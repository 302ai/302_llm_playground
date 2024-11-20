/**
 * @fileoverview Settings trigger button component for the playground.
 * Provides a button to toggle the settings sidebar.
 * @author zpl
 * @created 2024-11-20
 */

import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import { Settings } from 'lucide-react'
import { forwardRef } from 'react'

/**
 * A button component that toggles the settings sidebar.
 * Uses the Settings icon and ghost variant styling.
 * 
 * @component
 * @example
 * ```tsx
 * <SettingTrigger />
 * ```
 */
export const SettingTrigger = forwardRef<HTMLButtonElement>((props, ref) => {
  const { toggleSidebar } = useSidebar()
  
  return (
    <Button 
      ref={ref}
      variant='ghost' 
      size='icon' 
      onClick={toggleSidebar}
    >
      <Settings className='h-5 w-5' />
    </Button>
  )
})

SettingTrigger.displayName = 'SettingTrigger'