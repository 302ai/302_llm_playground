/**
 * @fileoverview React hook for managing chat message generation with streaming support.
 * Provides real-time message generation, cancellation, and error handling.
 * @author zpl
 * @created 2024-11-20
 */

import { chat } from '@/actions/chat'
import { PlaygroundMessage } from '@/stores/playground'
import { logger } from '@/utils/logger'
import { readStreamableValue } from 'ai/rsc'
import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

/**
 * React hook that manages chat message generation with streaming support.
 * Handles message generation state, streaming updates, and error handling.
 * 
 * @function
 * @returns {Object} Chat generation interface
 * @property {Function} generate - Starts message generation
 * @property {Function} stop - Stops ongoing generation
 * @property {boolean} isRunning - Whether generation is in progress
 * @property {PlaygroundMessage | null} generatingMessage - Currently generating message
 * 
 * @example
 * ```tsx
 * function ChatInterface() {
 *   const {
 *     generate,
 *     stop,
 *     isRunning,
 *     generatingMessage
 *   } = useChatGeneration();
 * 
 *   const handleSubmit = async () => {
 *     const result = await generate(messages, settings);
 *     if (result) {
 *       // Handle successful generation
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       {isRunning && (
 *         <div>
 *           <StreamingMessage message={generatingMessage} />
 *           <button onClick={stop}>Stop Generation</button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useChatGeneration() {
  // Track generation state and current message
  const [state, setState] = useState<{
    isRunning: boolean
    generatingMessage: PlaygroundMessage | null
  }>({
    isRunning: false,
    generatingMessage: null,
  })

  // Refs for managing generation flow
  const shouldStopRef = useRef(false)
  const contentRef = useRef('')

  // Internationalization hooks
  const t = useTranslations('playground')
  const locale = useLocale()

  /**
   * Stops the current message generation.
   * Sets the stop flag that will be checked during streaming.
   */
  const stop = () => {
    logger.info('Stopping chat generation', { module: 'ChatGeneration' })
    shouldStopRef.current = true
  }

  /**
   * Generates a new chat message with streaming updates.
   * 
   * @async
   * @param {PlaygroundMessage[]} messages - Previous messages for context
   * @param {any} settings - Generation settings and configuration
   * @returns {Promise<{id: string, content: string} | null>} Generated message or null if error
   */
  const generate = async (messages: PlaygroundMessage[], settings: any) => {
    const messageId = uuidv4()
    shouldStopRef.current = false
    contentRef.current = ''

    logger.info('Starting chat generation', { 
      context: { messageId, messagesCount: messages.length },
      module: 'ChatGeneration'
    })

    setState({
      isRunning: true,
      generatingMessage: {
        id: messageId,
        role: 'assistant',
        content: '',
      },
    })

    try {
      const { output } = await chat({
        ...settings,
        messages,
      })

      logger.debug('Processing chat stream', { module: 'ChatGeneration' })
      for await (const delta of readStreamableValue(output)) {
        // Check for manual stop
        if (shouldStopRef.current) {
          logger.info('Chat generation stopped by user', { 
            context: { messageId },
            module: 'ChatGeneration'
          })
          return {
            id: messageId,
            content: contentRef.current
          }
        }

        // Accumulate content and update state
        contentRef.current += delta
        setState((prev) => ({
          ...prev,
          generatingMessage: {
            id: messageId,
            role: 'assistant',
            content: contentRef.current,
          },
        }))
      }

      logger.info('Chat generation completed successfully', { 
        context: { messageId },
        module: 'ChatGeneration'
      })
      return { id: messageId, content: contentRef.current }
    } catch (error: unknown) {
      logger.error('Error in chat generation', error as Error, { 
        context: { messageId },
        module: 'ChatGeneration'
      })

      // Handle localized error messages
      if (typeof error === 'string') {
        try {
          const parsedError = JSON.parse(error)
          const key = {
            zh: 'cn',
            en: 'en',
            ja: 'jp',
          }[locale]
          const errorMessage = parsedError.error[`message_${key}`] || parsedError.error.message
          toast.error(errorMessage)
        } catch (parseError) {
          logger.error('Error parsing error message', parseError as Error, { 
            context: { messageId, originalError: error },
            module: 'ChatGeneration'
          })
          toast.error(t('error.chatFailed'))
        }
      } else {
        toast.error(t('error.chatFailed'))
      }
      return null
    } finally {
      // Reset state and refs
      shouldStopRef.current = false
      contentRef.current = ''
      setState({
        isRunning: false,
        generatingMessage: null,
      })
    }
  }

  return {
    generate,
    stop,
    isRunning: state.isRunning,
    generatingMessage: state.generatingMessage,
  }
}
