'use client'

import { FilePreview } from '@/components/playground/file-preview'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TooltipButton } from '@/components/ui/tooltip-button'
import { PlaygroundMessage } from '@/stores/playground'
import { cn } from '@/utils/tailwindcss'
import { ChevronDown, ChevronUp, Loader2, PlayCircle, Plus, Square, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef } from 'react'

interface InputSectionProps {
  height: number
  isDragging: boolean
  isExpanded: boolean
  isAnimating: boolean
  newMessage: PlaygroundMessage
  isRunning: boolean
  isUploading: boolean
  uiMode: 'expert' | 'beginner'
  isPreviewOpen: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onRoleChange: (value: string) => void
  onToggleExpand: () => void
  onRun: () => void
  onStop: () => void
  onAddMessage: () => void
  onFileUpload: (files: File[]) => void
  onDeleteFile: (index: number) => void
  setIsPreviewOpen: (value: boolean) => void
}

export function InputSection({
  height,
  isDragging,
  isExpanded,
  isAnimating,
  newMessage,
  isRunning,
  isUploading,
  uiMode,
  isPreviewOpen,
  onMouseDown,
  onMessageChange,
  onKeyDown,
  onRoleChange,
  onToggleExpand,
  onRun,
  onStop,
  onAddMessage,
  onFileUpload,
  onDeleteFile,
  setIsPreviewOpen,
}: InputSectionProps) {
  const t = useTranslations('playground')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2 border-t border-gray-200 bg-background',
        isAnimating && 'transition-[height] duration-300 ease-in-out'
      )}
      style={{ height }}
    >
      <div
        className={cn(
          'h-0.5 w-full cursor-ns-resize transition-colors hover:bg-gray-200',
          isDragging && 'bg-gray-300'
        )}
        onMouseDown={onMouseDown}
      />
      <div className='flex flex-1 flex-col gap-2 p-4'>
        <div className='flex items-center justify-between gap-2'>
          {uiMode === 'expert' ? (
            <Select
              value={newMessage.role}
              onValueChange={onRoleChange}
            >
              <SelectTrigger className='w-fit'>
                <SelectValue placeholder={t('message.selectRolePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='system'>{t('message.system')}</SelectItem>
                <SelectItem value='user'>{t('message.user')}</SelectItem>
                <SelectItem value='assistant'>{t('message.assistant')}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <span className='text-sm text-gray-500'>{t('message.user')}</span>
          )}
          <div className='flex items-center gap-2'>
            <TooltipButton
              variant='outline'
              size='icon'
              onClick={onToggleExpand}
              tooltipContent={isExpanded ? t('message.collapse') : t('message.expand')}
            >
              {isExpanded ? (
                <ChevronDown className='h-4 w-4' />
              ) : (
                <ChevronUp className='h-4 w-4' />
              )}
            </TooltipButton>

            {newMessage.role === 'user' && (
              <Tooltip>
                <Popover open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
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
                              {newMessage.files && newMessage.files.length > 0 && (
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
                    <PopoverContent className='w-80 p-2' side='top' align='end'>
                      <div className='mb-2 flex items-center justify-between'>
                        <span className='text-sm font-medium'>
                          {t('message.uploaded_files')}
                        </span>
                        <TooltipButton
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8'
                          onClick={() => {
                            setIsPreviewOpen(false)
                            triggerFileUpload()
                          }}
                          tooltipContent={t('message.upload_file')}
                        >
                          <Plus className='h-4 w-4' />
                        </TooltipButton>
                      </div>
                      <FilePreview
                        files={newMessage.files}
                        canDelete={true}
                        onDelete={onDeleteFile}
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
                  onFileUpload(files)
                }
                e.target.value = ''
              }}
              accept='image/*'
            />

            {uiMode === 'expert' && (
              <TooltipButton
                variant='outline'
                disabled={!newMessage.content}
                onClick={onAddMessage}
                tooltipContent={t('message.addTooltip')}
              >
                <Plus className='h-4 w-4' />
                {t('message.add')}
              </TooltipButton>
            )}
            
            <TooltipButton
              className='bg-primary hover:bg-primary/90'
              onClick={isRunning ? onStop : onRun}
              tooltipContent={
                isRunning
                  ? t('message.stopTooltip')
                  : uiMode === 'expert'
                  ? t('message.runTooltipExpert')
                  : t('message.runTooltipBeginner')
              }
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
            </TooltipButton>
          </div>
        </div>
        <Textarea
          className='flex-1 resize-none rounded-lg border-0 px-0 shadow-none focus-visible:ring-0'
          placeholder={t('message.inputPlaceholder')}
          value={newMessage.content}
          onChange={onMessageChange}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  )
}
