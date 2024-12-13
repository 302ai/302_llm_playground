/**
 * @fileoverview Main playground page component that provides an interactive chat interface
 * with AI models. Features include message management, model selection, settings configuration,
 * and internationalization support.
 * @author zpl
 * @created 2024-11-20
 */

'use client'

import { ClientOnly } from '@/components/client-only'
import { MessageList } from '@/components/playground/message-list'
import { SidebarProvider } from '@/components/ui/sidebar'
import { messageStore } from '@/db/message-store'
import { useChatGeneration } from '@/hooks/use-chat-generation'
import { useFileUpload } from '@/hooks/use-file-upload'
import { useMessages } from '@/hooks/use-messages'

import {
  PlaygroundMessage,
  playgroundSettiongsAtom,
  uiModeAtom,
  validateMessage,
} from '@/stores/playground'
import { saveAs } from 'file-saver'
import { useAtom } from 'jotai'

import { marked, Tokens } from 'marked'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

import { SettingsSidebar } from './_components/settings-sidebar'
import { getModels, ModelInfo } from '@/actions/models'
import { Header } from './_components/header'
import { InputSection } from './_components/input-section'

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
      const { id, content, logprobs } = result
      await messageStore.addMessage({
        id,
        role: 'assistant',
        content,
        logprobs: logprobs,
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
            <Header
              onExport={handleExport}
              onResetMessages={handleResetMessages}
            />

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

            <InputSection
              height={bottomHeight}
              isDragging={isDragging}
              isExpanded={isExpanded}
              isAnimating={isAnimating}
              newMessage={newMessage}
              isRunning={isRunning}
              isUploading={isUploading}
              uiMode={uiMode}
              isPreviewOpen={isPreviewOpen}
              onMouseDown={handleMouseDown}
              onMessageChange={handleContentChange}
              onKeyDown={handleKeyDown}
              onRoleChange={(value) =>
                setNewMessage((prev) => ({
                  ...prev,
                  role: value as PlaygroundMessage['role'],
                }))
              }
              onToggleExpand={handleToggleExpand}
              onRun={handleRun}
              onStop={stop}
              onAddMessage={() => handleAddMessage(newMessage)}
              onFileUpload={handleFileUpload}
              onDeleteFile={handleDeleteFile}
              setIsPreviewOpen={setIsPreviewOpen}
            />
          </div>

          <SettingsSidebar
            settings={settings}
            uiMode={uiMode}
            models={models}
            onSettingsChange={setSettings}
            onUiModeChange={(value) => setUiMode(value ? 'expert' : 'beginner')}
            onResetSettings={handleResetSettings}
          />
        </SidebarProvider>
      </div>
    </ClientOnly>
  )
}
