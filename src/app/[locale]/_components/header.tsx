'use client'

import { SettingTrigger } from '@/components/playground/setting-trigger'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowLeft, FileDown, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  onExport: () => void
  onResetMessages: () => void
}

export function Header({ onExport, onResetMessages }: HeaderProps) {
  const t = useTranslations('playground')
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  return (
    <header className='flex h-16 items-center justify-between border-b border-gray-200 bg-background px-6'>
      <div className='flex items-center gap-2'>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='outline' size='icon' onClick={handleBack}>
                <ArrowLeft className='h-5 w-5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              sideOffset={4}
              className='max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50'
            >
              <p>{t('backTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <span className='text-xl font-semibold'>Playground</span>
      </div>
      <div className='flex items-center gap-4'>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon' onClick={onExport}>
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
              <Button variant='ghost' size='icon' onClick={onResetMessages}>
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
  )
}
