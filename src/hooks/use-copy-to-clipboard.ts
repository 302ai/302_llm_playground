/**
 * @fileoverview React hook for copying text to clipboard with feedback.
 * Provides copy functionality with success/error toasts and temporary copy state.
 * @author zpl
 * @created 2024-11-20
 */

import { useTranslations } from 'next-intl'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

/**
 * Props for the useCopyToClipboard hook.
 * @interface
 * @property {string} text - The text to be copied to clipboard
 * @property {string} [copyMessage='Copied to clipboard!'] - Success message to display after copying
 */
type UseCopyToClipboardProps = {
  text: string
  copyMessage?: string
}

/**
 * React hook that provides clipboard copy functionality with visual feedback.
 * Manages copy state and displays toast notifications for success/failure.
 * 
 * @function
 * @param {UseCopyToClipboardProps} props - Configuration options
 * @returns {Object} Object containing copy state and handler
 * @property {boolean} isCopied - Whether the text was recently copied
 * @property {() => void} handleCopy - Function to trigger the copy operation
 * 
 * @example
 * ```tsx
 * function CopyButton({ text }: { text: string }) {
 *   const { isCopied, handleCopy } = useCopyToClipboard({
 *     text,
 *     copyMessage: 'Text copied!'
 *   });
 * 
 *   return (
 *     <button onClick={handleCopy}>
 *       {isCopied ? 'Copied!' : 'Copy'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useCopyToClipboard({
  text,
  copyMessage = 'Copied to clipboard!',
}: UseCopyToClipboardProps) {
  // Track whether text was recently copied
  const [isCopied, setIsCopied] = useState(false)
  // Store timeout ID for resetting copy state
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Get translations for error message
  const t = useTranslations('playground')

  /**
   * Handles the copy operation.
   * - Copies text to clipboard using navigator.clipboard
   * - Shows success/error toast
   * - Updates copy state with 2-second timeout
   */
  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(copyMessage)
        setIsCopied(true)
        // Clear existing timeout if any
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        // Reset copy state after 2 seconds
        timeoutRef.current = setTimeout(() => {
          setIsCopied(false)
        }, 2000)
      })
      .catch(() => {
        toast.error(t('copiedError'))
      })
  }, [t, text, copyMessage])

  return { isCopied, handleCopy }
}
