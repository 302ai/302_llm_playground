'use client'

import { ModeSwitcher } from '@/components/mode-switcher'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader } from '@/components/ui/sidebar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { TooltipButton } from '@/components/ui/tooltip-button'
import { TooltipHelpIcon } from '@/components/ui/tooltip-help-icon'
import { cn } from '@/utils/tailwindcss'
import { Check, RotateCcw } from 'lucide-react'
import { marked } from 'marked'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { GLOBAL } from '@/constants/values'
import { startTransition } from 'react'
import { useRouter } from '@/i18n/routing'
import { useParams } from 'next/navigation'

interface SettingsSidebarProps {
  settings: {
    model?: string
    temperature: number
    topP: number
    frequencyPenalty: number
    presencePenalty: number
    maxTokens: number
    apiKey: string
  }
  uiMode: 'expert' | 'beginner'
  models: Array<{ id: string }>
  onSettingsChange: (settings: any) => void
  onUiModeChange: (value: boolean) => void
  onResetSettings: () => void
}

export function SettingsSidebar({
  settings,
  uiMode,
  models,
  onSettingsChange,
  onUiModeChange,
  onResetSettings,
}: SettingsSidebarProps) {
  const t = useTranslations('playground')
  const [apiKeyDesc, setApiKeyDesc] = useState('')
  const router = useRouter()
  const params = useParams()
  const pathname = '/'

  useEffect(() => {
    const result = marked(t('settings.apiKeyDesc'))
    if (result instanceof Promise) {
      result.then(setApiKeyDesc)
    } else {
      setApiKeyDesc(result)
    }
  }, [t])

  return (
    <Sidebar side='right'>
      <SidebarHeader className='px-4'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>{t('settings.title')}</h2>
          <TooltipButton
            variant='ghost'
            size='icon'
            onClick={onResetSettings}
            className='h-8 w-8'
            tooltipContent={t('settings.resetSettingsDesc')}
          >
            <RotateCcw className='h-4 w-4' />
          </TooltipButton>
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
                <div className='flex items-center gap-1'>
                  <Label className='text-sm font-medium text-gray-700'>
                    {t('settings.model')}
                  </Label>
                  <TooltipHelpIcon content={t('settings.modelDesc')} />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      role='combobox'
                      className='mt-1.5 w-full justify-between border-gray-300 bg-white'
                    >
                      {settings.model || t('settings.selectModelPlaceholder')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-full p-0' side='bottom' align='start'>
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
                            {Array.isArray(models) && models.length > 0 ? (
                              models.map((model) => (
                                <CommandItem
                                  key={model.id}
                                  value={model.id}
                                  onSelect={() => {
                                    onSettingsChange({ ...settings, model: model.id })
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
                    <TooltipHelpIcon content={t('settings.temperatureDesc')} />
                  </div>
                  <span className='text-sm text-gray-500'>{settings.temperature}</span>
                </div>
                <Slider
                  className='mt-2'
                  value={[settings.temperature]}
                  max={1}
                  min={0}
                  step={0.1}
                  onValueChange={(value) =>
                    onSettingsChange({ ...settings, temperature: value[0] })
                  }
                />
              </div>

              <div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-1'>
                    <Label className='text-sm font-medium text-gray-700'>Top P</Label>
                    <TooltipHelpIcon content={t('settings.topPDesc')} />
                  </div>
                  <span className='text-sm text-gray-500'>{settings.topP}</span>
                </div>
                <Slider
                  className='mt-2'
                  value={[settings.topP]}
                  max={1}
                  min={0}
                  step={0.1}
                  onValueChange={(value) =>
                    onSettingsChange({ ...settings, topP: value[0] })
                  }
                />
              </div>

              <div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-1'>
                    <Label className='text-sm font-medium text-gray-700'>
                      {t('settings.frequencyPenalty')}
                    </Label>
                    <TooltipHelpIcon content={t('settings.frequencyPenaltyDesc')} />
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
                    onSettingsChange({
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
                    <TooltipHelpIcon content={t('settings.presencePenaltyDesc')} />
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
                    onSettingsChange({
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
                    <TooltipHelpIcon content={t('settings.maxTokensDesc')} />
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <Input
                    type='number'
                    min={1}
                    value={settings.maxTokens}
                    onChange={(e) =>
                      onSettingsChange({
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
              <TooltipHelpIcon
                content={
                  <div
                    className='prose prose-sm prose-invert max-w-none'
                    dangerouslySetInnerHTML={{ __html: apiKeyDesc }}
                  />
                }
              />
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent className='space-y-8'>
            <Input
              placeholder={t('settings.apiKeyPlaceholder')}
              type='password'
              value={settings.apiKey}
              onChange={(e) =>
                onSettingsChange({ ...settings, apiKey: e.target.value })
              }
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className='px-0'>
            <div className='flex items-center gap-1'>
              {t('settings.mode')}
              {uiMode === 'expert' && (
                <TooltipHelpIcon
                  content={t('settings.expertModeDeviceNote')}
                  className='h-4 w-4 text-amber-500'
                />
              )}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ModeSwitcher
              className='w-full'
              value={uiMode === 'expert'}
              onChange={onUiModeChange}
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
              <TooltipHelpIcon content={t('settings.languageTooltip')} />
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
  )
}
