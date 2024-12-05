/**
 * @fileoverview Main playground page component that provides an interactive chat interface
 * with AI models. Features include message management, model selection, settings configuration,
 * and internationalization support.
 * @author zpl
 * @created 2024-11-20
 */

'use client'

import { ClientOnly } from '@/components/client-only'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { ModeSwitcher } from '@/components/mode-switcher'
import { MessageList } from '@/components/playground/message-list'
import { SettingTrigger } from '@/components/playground/setting-trigger'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { messageStore } from '@/db/message-store'
import { useChatGeneration } from '@/hooks/use-chat-generation'
import { useFileUpload } from '@/hooks/use-file-upload'
import { useMessages } from '@/hooks/use-messages'

import { getModels, ModelInfo } from '@/actions/models'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useRouter } from '@/i18n/routing'
import {
  PlaygroundMessage,
  playgroundSettiongsAtom,
  uiModeAtom,
  validateMessage,
} from '@/stores/playground'
import { cn } from '@/utils/tailwindcss'
import { saveAs } from 'file-saver'
import { useAtom } from 'jotai'
import {
  Check,
  ChevronDown,
  ChevronUp,
  FileDown,
  HelpCircle,
  Loader2,
  PlayCircle,
  Plus,
  RotateCcw,
  Square,
  Trash2,
  Upload
} from 'lucide-react'
import { marked, Tokens } from 'marked'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

import { FilePreview } from '@/components/playground/file-preview'
import { GLOBAL } from '@/constants/values'
import { startTransition } from 'react'

/**
 * Default settings for the AI model
 * @const {Object}
 */
const DEFAULT_SETTINGS = {
  temperature: 0.7,
  topP: 0.7,
  frequencyPenalty: 0.5,
  presencePenalty: 0.5,
}

/**
 * Main playground component providing an interactive chat interface with AI models.
 * Features include:
 * - Message composition and management
 * - Model selection and configuration
 * - Settings adjustment
 * - Drag-and-drop message reordering
 * - Export functionality
 * - Responsive layout with resizable panels
 *
 * @component
 * @returns {JSX.Element} The rendered playground interface
 */
export default function Component() {
  const t = useTranslations('playground')
  const [settings, setSettings] = useAtom(playgroundSettiongsAtom)
  const [uiMode, setUiMode] = useAtom(uiModeAtom)
  const [newMessage, setNewMessage] = useState<PlaygroundMessage>({
    id: uuidv4(),
    role: 'user',
    content: '',
  })

  const { messages, handleEdit, handleDelete, handleDragEnd } = useMessages(
    t('message.systemDefaultContent')
  )

  const { generate, stop, isRunning, generatingMessage } = useChatGeneration()

  /**
   * Adds a new message to the chat history
   * @param {PlaygroundMessage} message - The message to add
   */
  const handleAddMessage = async (message: PlaygroundMessage) => {
    if (!message.content?.trim()) {
      toast.error(t('message.emptyContent'))
      return
    }

    if (!validateMessage(message.content)) {
      return
    }

    const newMsg = {
      ...message,
      id: uuidv4(),
      ...(uiMode === 'expert'
        ? { role: message.role as PlaygroundMessage['role'] }
        : { role: 'user' as PlaygroundMessage['role'] }),
        files: message.role === 'user' ? message.files : undefined,
    }

    await messageStore.addMessage(newMsg)
    setNewMessage((prev) => ({
      ...prev,
      id: uuidv4(),
      content: '',
      files: [],
    }))
  }

  /**
   * Resets the chat history to initial state
   */
  const handleResetMessages = useCallback(async () => {
    await messageStore.clear()
    await messageStore.addMessage({
      id: uuidv4(),
      role: 'system',
      content: t('message.systemDefaultContent'),
    })
    setNewMessage((prev) => ({
      ...prev,
      id: uuidv4(),
      content: '',
      files: [],
    }))
  }, [t])

  // State for bottom panel resizing
  const [bottomHeight, setBottomHeight] = useState(150)
  const [isDragging, setIsDragging] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  /**
   * Handles mouse drag events for resizing the bottom panel
   * @param {React.MouseEvent} e - Mouse event
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)

    const startY = e.clientY
    const startHeight = bottomHeight

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startY - e.clientY
      const newHeight = Math.min(
        Math.max(startHeight + delta, 150),
        window.innerHeight * 0.6
      )
      setBottomHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  // Model selection state
  const [models, setModels] = useState<ModelInfo[]>([])

  useEffect(() => {
    getModels().then(setModels).catch(console.error)
  }, [])

  /**
   * Initiates chat generation with the AI model
   */
  const handleRun = async () => {
    if (!settings.apiKey) {
      toast.error(t('settings.apiKeyRequired'))
      return
    }
    let _messages = messages
    if (uiMode !== 'expert') {
      const currentMessage = {
        ...newMessage,
        content: newMessage.content,
      }

      if (!currentMessage.content?.trim()) {
        toast.error(t('message.emptyContent'))
        return
      }

      await handleAddMessage(currentMessage)
      _messages = [...messages, currentMessage]
    }

    const result = await generate(_messages, settings)
    if (result) {
      const { id, content } = result
      await messageStore.addMessage({
        id,
        role: 'assistant',
        content,
      })
    }
  }

  /**
   * Handles keyboard events for message submission
   * @param {React.KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter for new line
        return
      }

      // Regular Enter to send message
      e.preventDefault()
      if (!newMessage.content?.trim()) {
        toast.error(t('message.emptyContent'))
        return
      }

      handleRun()
    }
  }

  /**
   * Exports chat history as markdown file
   */
  const handleExport = () => {
    const markdown = messages
      .map((msg) => {
        const roleLabel = t(`message.${msg.role}`)
        return `## ${roleLabel}\n\n${msg.content}\n`
      })
      .join('\n')

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    saveAs(blob, `chat-${new Date().toISOString().slice(0, 10)}.md`)
  }

  // Configure marked renderer for links
  marked.use({
    renderer: {
      link(args_0: Tokens.Link) {
        return `<a href="${args_0.href}" target="_blank" rel="noopener noreferrer">${args_0.text}</a>`
      },
    },
  })

  /**
   * Updates the new message content
   * @param {React.ChangeEvent<HTMLTextAreaElement>} e - Change event
   */
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setNewMessage((prev) => ({
      ...prev,
      content: newValue,
    }))
  }

  /**
   * Resets settings to default values
   */
  const handleResetSettings = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      ...DEFAULT_SETTINGS,
    }))
  }, [setSettings])

  /**
   * Toggles bottom panel expansion
   */
  const handleToggleExpand = () => {
    setIsAnimating(true)
    if (isExpanded) {
      setBottomHeight(150)
    } else {
      setBottomHeight(window.innerHeight * 0.6)
    }
    setIsExpanded(!isExpanded)

    setTimeout(() => {
      setIsAnimating(false)
    }, 300)
  }

  const router = useRouter()
  const params = useParams()
  const pathname = '/'
  
  const { upload, isUploading } = useFileUpload()

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      try {
        const uploaded = await upload(files)
        setNewMessage((prev) => ({
          ...prev,
          files: [...(prev.files || []), ...uploaded],
        }))
        toast.success(t('message.upload_success'))
      } catch (error) {
        console.error('Upload error:', error)
        toast.error(
          error instanceof Error ? error.message : t('message.upload_error')
        )
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [upload, t]
  )

  const handleDeleteFile = useCallback((index: number) => {
    setNewMessage((prev) => ({
      ...prev,
      files: prev.files?.filter((_, i) => i !== index),
    }))
  }, [])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  return (
    <ClientOnly>
      <div className='h-full w-full overflow-hidden'>
        <SidebarProvider
          className='h-screen w-full'
          style={
            {
              '--sidebar-width': '20rem',
              '--sidebar-width-mobile': '20rem',
            } as React.CSSProperties
          }
        >
          <div className='sticky top-0 flex h-full w-full flex-col overflow-hidden'>
            <header className='flex h-16 items-center justify-between border-b border-gray-200 bg-background px-6'>
              <div className='flex items-center gap-2'>
                <span className='text-xl font-semibold'>Playground</span>
              </div>
              <div className='flex items-center gap-4'>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={handleExport}
                      >
                        <FileDown className='h-5 w-5' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      sideOffset={4}
                      className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                    >
                      <p>{t('exportTooltipMD')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={handleResetMessages}
                      >
                        <Trash2 className='h-5 w-5' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      sideOffset={4}
                      className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                    >
                      <p>{t('clearMessagesTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SettingTrigger />
                    </TooltipTrigger>
                    <TooltipContent
                      sideOffset={4}
                      className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                    >
                      <p>{t('settingsTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </header>

            <div className='flex-1 overflow-hidden'>
              <MessageList
                messages={messages}
                generatingMessage={generatingMessage}
                isRunning={isRunning}
                onDragEnd={handleDragEnd}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>

            <div
              className={cn(
                'flex flex-col gap-2 border-t border-gray-200 bg-background',
                isAnimating && 'transition-[height] duration-300 ease-in-out'
              )}
              style={{ height: bottomHeight }}
            >
              <div
                className={cn(
                  'h-0.5 w-full cursor-ns-resize transition-colors hover:bg-gray-200',
                  isDragging && 'bg-gray-300'
                )}
                onMouseDown={handleMouseDown}
              />
              <div className='flex flex-1 flex-col gap-2 p-4'>
                <div className='flex items-center justify-between gap-2'>
                  {uiMode === 'expert' ? (
                    <Select
                      value={newMessage.role}
                      onValueChange={(value) =>
                        setNewMessage((prev) => ({
                          ...prev,
                          role: value as PlaygroundMessage['role'],
                        }))
                      }
                    >
                      <SelectTrigger className='w-fit'>
                        <SelectValue
                          placeholder={t('message.selectRolePlaceholder')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='system'>
                          {t('message.system')}
                        </SelectItem>
                        <SelectItem value='user'>
                          {t('message.user')}
                        </SelectItem>
                        <SelectItem value='assistant'>
                          {t('message.assistant')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className='text-sm text-gray-500'>
                      {t('message.user')}
                    </span>
                  )}
                  <div className='flex items-center gap-2'>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='outline'
                            size='icon'
                            onClick={handleToggleExpand}
                          >
                            {isExpanded ? (
                              <ChevronDown className='h-4 w-4' />
                            ) : (
                              <ChevronUp className='h-4 w-4' />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={4}
                          className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                        >
                          <p>
                            {isExpanded
                              ? t('message.collapse')
                              : t('message.expand')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {newMessage.role === 'user' && (
                      <Tooltip>
                        <Popover
                          open={isPreviewOpen}
                          onOpenChange={setIsPreviewOpen}
                        >
                          <TooltipProvider delayDuration={0}>
                            <TooltipTrigger asChild>
                              <PopoverTrigger asChild>
                                <Button
                                  variant='outline'
                                  onClick={(e) => {
                                    e.preventDefault()
                                    if (!newMessage.files?.length) {
                                      triggerFileUpload()
                                    } else {
                                      setIsPreviewOpen(true)
                                    }
                                  }}
                                  disabled={isUploading}
                                  className='relative'
                                  size='icon'
                                >
                                  {isUploading ? (
                                    <Loader2 className='size-4 animate-spin' />
                                  ) : (
                                    <>
                                      <Upload className='size-4' />
                                      {newMessage.files &&
                                        newMessage.files.length > 0 && (
                                          <span className='absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground'>
                                            {newMessage.files.length}
                                          </span>
                                        )}
                                    </>
                                  )}
                                </Button>
                              </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent
                              sideOffset={4}
                              className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                            >
                              <p>{t('message.upload_file')}</p>
                            </TooltipContent>
                          </TooltipProvider>
                          {newMessage.files && newMessage.files.length > 0 && (
                            <PopoverContent
                              className='w-80 p-2'
                              side='top'
                              align='end'
                            >
                              <div className='mb-2 flex items-center justify-between'>
                                <span className='text-sm font-medium'>
                                  {t('message.uploaded_files')}
                                </span>
                                <TooltipProvider delayDuration={0}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant='ghost'
                                        size='icon'
                                        className='h-8 w-8'
                                        onClick={() => {
                                          setIsPreviewOpen(false)
                                          triggerFileUpload()
                                        }}
                                      >
                                        <Plus className='h-4 w-4' />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      sideOffset={4}
                                      className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                                    >
                                      <p>{t('message.upload_file')}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <FilePreview
                                files={newMessage.files}
                                canDelete={true}
                                onDelete={handleDeleteFile}
                              />
                            </PopoverContent>
                          )}
                        </Popover>
                      </Tooltip>
                    )}

                    <input
                      ref={fileInputRef}
                      type='file'
                      multiple
                      className='hidden'
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        if (files.length) {
                          handleFileUpload(files)
                        }
                        e.target.value = ''
                      }}
                      accept='image/*'
                    />

                    {uiMode === 'expert' && (
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='outline'
                              disabled={!newMessage.content}
                              onClick={() => handleAddMessage(newMessage)}
                            >
                              <Plus className='h-4 w-4' />
                              {t('message.add')}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            sideOffset={4}
                            className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                          >
                            <p>{t('message.addTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className='bg-primary hover:bg-primary/90'
                            onClick={isRunning ? stop : handleRun}
                          >
                            {isRunning ? (
                              <>
                                {t('message.stop')}
                                <Square className='ml-2 h-4 w-4' />
                              </>
                            ) : (
                              <>
                                {t('message.run')}
                                <PlayCircle className='ml-2 h-4 w-4' />
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={4}
                          className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                        >
                          {isRunning ? (
                            <p>{t('message.stopTooltip')}</p>
                          ) : (
                            <p>
                              {uiMode === 'expert'
                                ? t('message.runTooltipExpert')
                                : t('message.runTooltipBeginner')}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <Textarea
                  className='flex-1 resize-none rounded-lg border-0 px-0 shadow-none focus-visible:ring-0'
                  placeholder={t('message.inputPlaceholder')}
                  value={newMessage.content}
                  onChange={handleContentChange}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
          </div>

          <Sidebar side='right'>
            <SidebarHeader className='px-4'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-lg font-semibold'>{t('settings.title')}</h2>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={handleResetSettings}
                        className='h-8 w-8'
                      >
                        <RotateCcw className='h-4 w-4' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      sideOffset={4}
                      className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                    >
                      <p>{t('settings.resetSettingsDesc')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </SidebarHeader>
            <SidebarContent className='px-4'>
              <SidebarGroup>
                <SidebarGroupLabel className='px-0'>
                  {t('settings.basicConfig')}
                </SidebarGroupLabel>
                <SidebarGroupContent className='space-y-8'>
                  <div className='space-y-6'>
                    <div>
                      <Label className='text-sm font-medium text-gray-700'>
                        {t('settings.model')}
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            role='combobox'
                            className='mt-1.5 w-full justify-between border-gray-300 bg-white'
                          >
                            {settings.model ||
                              t('settings.selectModelPlaceholder')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className='w-full p-0'
                          side='bottom'
                          align='start'
                        >
                          <Command className='w-full'>
                            <CommandInput
                              placeholder={t('settings.searchModelPlaceholder')}
                              className='px-3 py-2'
                            />
                            <div
                              className='max-h-[300px] touch-pan-y overflow-hidden'
                              onWheel={(e) => e.stopPropagation()}
                              onTouchMove={(e) => e.stopPropagation()}
                            >
                              <CommandList className='max-h-[calc(300px-40px)] overflow-y-auto'>
                                <CommandEmpty className='px-3 py-2'>
                                  {t('settings.noModelFound')}
                                </CommandEmpty>
                                <CommandGroup>
                                  {Array.isArray(models) &&
                                  models.length > 0 ? (
                                    models.map((model) => (
                                      <CommandItem
                                        key={model.id}
                                        value={model.id}
                                        onSelect={() => {
                                          setSettings((prev) => ({
                                            ...prev,
                                            model: model.id,
                                          }))
                                        }}
                                        className='px-3 py-1.5'
                                      >
                                        <Check
                                          className={cn(
                                            'mr-2 h-4 w-4',
                                            settings.model === model.id
                                              ? 'opacity-100'
                                              : 'opacity-0'
                                          )}
                                        />
                                        {model.id}
                                      </CommandItem>
                                    ))
                                  ) : (
                                    <div className='py-6 text-center text-sm text-gray-500'>
                                      {t('settings.noModelFound')}
                                    </div>
                                  )}
                                </CommandGroup>
                              </CommandList>
                            </div>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-1'>
                          <Label className='text-sm font-medium text-gray-700'>
                            {t('settings.temperature')}
                          </Label>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type='button'
                                  className='cursor-help'
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <HelpCircle className='h-4 w-4 text-gray-400 hover:text-gray-500' />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                sideOffset={4}
                                className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                              >
                                <p>{t('settings.temperatureDesc')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className='text-sm text-gray-500'>
                          {settings.temperature}
                        </span>
                      </div>
                      <Slider
                        className='mt-2'
                        value={[settings.temperature]}
                        max={1}
                        min={0}
                        step={0.1}
                        onValueChange={(value) =>
                          setSettings({ ...settings, temperature: value[0] })
                        }
                      />
                    </div>
                    <div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-1'>
                          <Label className='text-sm font-medium text-gray-700'>
                            Top P
                          </Label>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type='button'
                                  className='cursor-help'
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <HelpCircle className='h-4 w-4 text-gray-400 hover:text-gray-500' />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                sideOffset={4}
                                className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                              >
                                <p>{t('settings.topPDesc')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className='text-sm text-gray-500'>
                          {settings.topP}
                        </span>
                      </div>
                      <Slider
                        className='mt-2'
                        value={[settings.topP]}
                        max={1}
                        min={0}
                        step={0.1}
                        onValueChange={(value) =>
                          setSettings({ ...settings, topP: value[0] })
                        }
                      />
                    </div>
                    <div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-1'>
                          <Label className='text-sm font-medium text-gray-700'>
                            {t('settings.frequencyPenalty')}
                          </Label>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type='button'
                                  className='cursor-help'
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <HelpCircle className='h-4 w-4 text-gray-400 hover:text-gray-500' />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                sideOffset={4}
                                className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                              >
                                <p>{t('settings.frequencyPenaltyDesc')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className='text-sm text-gray-500'>
                          {settings.frequencyPenalty}
                        </span>
                      </div>
                      <Slider
                        className='mt-2'
                        value={[settings.frequencyPenalty]}
                        max={2}
                        min={-2}
                        step={0.1}
                        onValueChange={(value) =>
                          setSettings({
                            ...settings,
                            frequencyPenalty: value[0],
                          })
                        }
                      />
                    </div>
                    <div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-1'>
                          <Label className='text-sm font-medium text-gray-700'>
                            {t('settings.presencePenalty')}
                          </Label>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type='button'
                                  className='cursor-help'
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <HelpCircle className='h-4 w-4 text-gray-400 hover:text-gray-500' />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                sideOffset={4}
                                className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                              >
                                <p>{t('settings.presencePenaltyDesc')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className='text-sm text-gray-500'>
                          {settings.presencePenalty}
                        </span>
                      </div>
                      <Slider
                        className='mt-2'
                        value={[settings.presencePenalty]}
                        max={2}
                        min={-2}
                        step={0.1}
                        onValueChange={(value) =>
                          setSettings({
                            ...settings,
                            presencePenalty: value[0],
                          })
                        }
                      />
                    </div>
                    <div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-1'>
                          <Label className='text-sm font-medium text-gray-700'>
                            {t('settings.maxTokens')}
                          </Label>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type='button'
                                  className='cursor-help'
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <HelpCircle className='h-4 w-4 text-gray-400 hover:text-gray-500' />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                sideOffset={4}
                                className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                              >
                                <p>{t('settings.maxTokensDesc')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div className='flex items-center justify-between'>
                        <Input
                          type='number'
                          min={1}
                          value={settings.maxTokens}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              maxTokens: Number(e.target.value),
                            })
                          }
                          placeholder={t('settings.maxTokensPlaceholder')}
                          className='mt-2'
                        />
                      </div>
                    </div>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel className='px-0'>
                  <div className='flex items-center gap-1'>
                    {t('settings.apiKey')}
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type='button'
                            className='cursor-help'
                            onClick={(e) => e.preventDefault()}
                          >
                            <HelpCircle className='h-4 w-4 text-gray-400 hover:text-gray-500' />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={4}
                          className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                        >
                          <div
                            className='prose prose-sm prose-invert max-w-none'
                            dangerouslySetInnerHTML={{
                              __html: marked(t('settings.apiKeyDesc'), {
                                // 现有配置保持不变...
                              }) as string,
                            }}
                          />
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </SidebarGroupLabel>
                <SidebarGroupContent className='space-y-8'>
                  <Input
                    placeholder={t('settings.apiKeyPlaceholder')}
                    type='password'
                    value={settings.apiKey}
                    onChange={(e) =>
                      setSettings({ ...settings, apiKey: e.target.value })
                    }
                  />
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel className='px-0'>
                  <div className='flex items-center gap-1'>
                    {t('settings.mode')}
                    {uiMode === 'expert' && (
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type='button'
                              className='cursor-help'
                              onClick={(e) => e.preventDefault()}
                            >
                              <HelpCircle className='h-4 w-4 text-amber-500' />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            sideOffset={4}
                            className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                          >
                            <p>{t('settings.expertModeDeviceNote')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <ModeSwitcher
                    className='w-full'
                    value={uiMode === 'expert'}
                    onChange={(value) =>
                      setUiMode(value ? 'expert' : 'beginner')
                    }
                    beginnerText={t('settings.beginnerMode')}
                    expertText={t('settings.expertMode')}
                  />
                  <p className='mt-2 text-sm text-gray-500'>
                    {uiMode === 'expert'
                      ? t('settings.expertModeDesc')
                      : t('settings.beginnerModeDesc')}
                  </p>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel className='px-0'>
                  <div className='flex items-center gap-1'>
                    {t('settings.language')}
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type='button'
                            className='cursor-help'
                            onClick={(e) => e.preventDefault()}
                          >
                            <HelpCircle className='h-4 w-4 text-gray-400 hover:text-gray-500' />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          sideOffset={4}
                          className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
                        >
                          <p>{t('settings.languageTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <Select
                    value={params.locale as string}
                    onValueChange={(nextLocale) => {
                      startTransition(() => {
                        router.replace(
                          // @ts-expect-error -- TypeScript will validate that only known `params`
                          // are used in combination with a given `pathname`. Since the two will
                          // always match for the current route, we can skip runtime checks.
                          { pathname, params },
                          { locale: nextLocale }
                        )
                      })
                    }}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder={t('settings.selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      {GLOBAL.LOCALE.SUPPORTED.map((locale) => (
                        <SelectItem key={locale} value={locale}>
                          {t(`settings.languages.${locale}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </div>
    </ClientOnly>
  )
}
