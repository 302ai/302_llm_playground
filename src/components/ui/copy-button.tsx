/**
 * @fileoverview Copy button component with visual feedback.
 * Features a smooth transition between copy and check icons.
 * @author zpl
 * @created 2024-11-20
 */

'use client'

import { Check, Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/utils/tailwindcss'

/**
 * Props for the CopyButton component.
 * 
 * @interface CopyButtonProps
 * @property {string} content - The text content to copy to clipboard
 * @property {string} [copyMessage] - Optional message to display after copying
 */
type CopyButtonProps = {
  content: string
  copyMessage?: string
}

/**
 * A button component that copies text to clipboard with visual feedback.
 * Shows a check mark icon briefly after copying.
 * 
 * @component
 * @param {CopyButtonProps} props - Component props
 * @example
 * ```tsx
 * <CopyButton
 *   content="Text to copy"
 *   copyMessage="Copied to clipboard!"
 * />
 * ```
 */
export function CopyButton({ content, copyMessage }: CopyButtonProps) {
  const { isCopied, handleCopy } = useCopyToClipboard({
    text: content,
    copyMessage,
  })

  return (
    <Button
      variant='ghost'
      size='icon'
      className='relative h-6 w-6'
      aria-label='Copy to clipboard'
      onClick={handleCopy}
    >
      <div className='absolute inset-0 flex items-center justify-center'>
        <Check
          className={cn(
            'h-4 w-4 transition-transform ease-in-out',
            isCopied ? 'scale-100' : 'scale-0'
          )}
        />
      </div>
      <Copy
        className={cn(
          'h-4 w-4 transition-transform ease-in-out',
          isCopied ? 'scale-0' : 'scale-100'
        )}
      />
    </Button>
  )
}
