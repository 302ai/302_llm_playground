/**
 * @fileoverview Animated mode switcher component for toggling between beginner and expert modes.
 * Features smooth transitions, custom icons, and configurable animations using Framer Motion.
 * @author zpl
 * @created 2024-11-20
 */

'use client'

import { cn } from '@/utils/tailwindcss'
import { motion } from 'framer-motion'
import { Lightbulb, Zap } from 'lucide-react'
import * as React from 'react'

/**
 * Props for the ModeSwitcher component.
 * 
 * @interface ModeSwitcherProps
 * @property {boolean} [value] - Current mode state (true for expert, false for beginner)
 * @property {(value: boolean) => void} [onChange] - Callback when mode changes
 * @property {string} [className] - Additional CSS classes
 * @property {boolean} [disabled] - Whether the switcher is disabled
 * @property {React.ReactNode} [beginnerIcon] - Custom icon for beginner mode
 * @property {React.ReactNode} [expertIcon] - Custom icon for expert mode
 * @property {string} [beginnerText] - Text label for beginner mode
 * @property {string} [expertText] - Text label for expert mode
 * @property {Object} [animationConfig] - Animation timing configuration
 * @property {number} [animationConfig.switchDuration] - Duration of switch animation
 * @property {number} [animationConfig.rotateDuration] - Duration of icon rotation
 * @property {number} [animationConfig.colorDuration] - Duration of color transition
 * @property {Object} [animationConfig.spring] - Spring animation configuration
 * @property {number} [animationConfig.spring.stiffness] - Spring stiffness
 * @property {number} [animationConfig.spring.damping] - Spring damping
 */
type ModeSwitcherProps = {
  value?: boolean
  onChange?: (value: boolean) => void
  className?: string
  disabled?: boolean
  beginnerIcon?: React.ReactNode
  expertIcon?: React.ReactNode
  beginnerText?: string
  expertText?: string
  animationConfig?: {
    switchDuration?: number
    rotateDuration?: number
    colorDuration?: number
    spring?: {
      stiffness?: number
      damping?: number
    }
  }
}

/**
 * An animated switch component for toggling between beginner and expert modes.
 * Features smooth transitions, custom icons, and accessibility support.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <ModeSwitcher
 *   value={isExpertMode}
 *   onChange={setIsExpertMode}
 * />
 * 
 * // With custom configuration
 * <ModeSwitcher
 *   value={isExpertMode}
 *   onChange={setIsExpertMode}
 *   beginnerText="Simple"
 *   expertText="Advanced"
 *   beginnerIcon={<SimpleIcon />}
 *   expertIcon={<AdvancedIcon />}
 *   animationConfig={{
 *     switchDuration: 0.4,
 *     rotateDuration: 0.6,
 *     spring: { stiffness: 800, damping: 35 }
 *   }}
 * />
 * ```
 */
export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({
  value,
  onChange,
  className,
  disabled = false,
  beginnerIcon,
  expertIcon,
  beginnerText = 'Beginner',
  expertText = 'Expert',
  animationConfig = {
    switchDuration: 0.3,
    rotateDuration: 0.5,
    colorDuration: 0.3,
    spring: {
      stiffness: 700,
      damping: 30,
    },
  },
}) => {
  // Reference to container for calculating translation distance
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [translateDistance, setTranslateDistance] = React.useState(0)

  const isExpertMode = value ?? false

  // Handle mode toggle with disabled state check
  const handleToggle = React.useCallback(() => {
    if (!disabled) {
      onChange?.(!isExpertMode)
    }
  }, [disabled, isExpertMode, onChange])

  // Calculate translation distance based on container width
  React.useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth
      const thumbWidth = 32
      const padding = 4
      setTranslateDistance(containerWidth - thumbWidth - padding * 2)
    }
  }, [])

  // Dynamic colors based on mode
  const iconColor = isExpertMode ? 'rgb(67, 56, 202)' : 'rgb(161, 98, 7)'
  const backgroundColor = isExpertMode
    ? 'rgb(224, 231, 255)'
    : 'rgb(254, 243, 199)'

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'relative h-10 cursor-pointer rounded-full p-1',
        'ring-1 ring-inset ring-black/5 dark:ring-white/5',
        'shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={handleToggle}
      role='switch'
      aria-checked={isExpertMode}
      aria-readonly={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleToggle()
        }
      }}
      animate={{
        backgroundColor: backgroundColor,
      }}
      transition={{ duration: animationConfig.colorDuration }}
    >
      {/* Mode labels */}
      <div className='flex h-full w-full items-center justify-between px-10'>
        <span
          className={cn(
            'select-none text-xs font-medium transition-all',
            isExpertMode
              ? 'text-indigo-900/75 opacity-0'
              : 'text-amber-800/75 opacity-100'
          )}
          style={{ transitionDuration: `${animationConfig.colorDuration}s` }}
        >
          {beginnerText}
        </span>
        <span
          className={cn(
            'select-none text-xs font-medium transition-all',
            isExpertMode
              ? 'text-indigo-900/75 opacity-100'
              : 'text-amber-800/75 opacity-0'
          )}
          style={{ transitionDuration: `${animationConfig.colorDuration}s` }}
        >
          {expertText}
        </span>
      </div>

      {/* Animated thumb with icon */}
      <motion.div
        className={cn(
          'absolute left-1 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full',
          'bg-white dark:bg-gray-800',
          'shadow-[0_2px_4px_rgba(0,0,0,0.1)]',
          'ring-1 ring-black/5 dark:ring-white/5'
        )}
        animate={{
          x: isExpertMode ? translateDistance : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: animationConfig.spring?.stiffness,
          damping: animationConfig.spring?.damping,
        }}
      >
        <motion.div
          animate={{
            rotate: isExpertMode ? 360 : 0,
          }}
          transition={{ duration: animationConfig.rotateDuration }}
        >
          {isExpertMode
            ? expertIcon || (
                <Zap className='h-5 w-5' style={{ color: iconColor }} />
              )
            : beginnerIcon || (
                <Lightbulb className='h-5 w-5' style={{ color: iconColor }} />
              )}
        </motion.div>
      </motion.div>

      {/* Screen reader text */}
      <div className='sr-only'>{isExpertMode ? expertText : beginnerText}</div>
    </motion.div>
  )
}
