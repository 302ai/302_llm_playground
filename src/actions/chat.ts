/**
 * @fileoverview Server action for handling chat message generation using AI models.
 * Supports streaming responses and various model configurations.
 * @author zpl
 * @created 2024-11-20
 */

'use server'
import { env } from '@/env'
import { PlaygroundMessage } from '@/stores/playground'
import { normalizeUrl } from '@/utils/api'
import { logger } from '@/utils/logger'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { createStreamableValue } from 'ai/rsc'

/**
 * Maximum number of tokens allowed for model responses.
 * Currently set for Claude 3.5 model compatibility.
 * @constant
 * @type {number}
 */
const MAX_TOKENS = 8192

/**
 * Server action that generates chat responses using AI models.
 * Supports streaming responses and various model parameters for fine-tuning output.
 * 
 * @async
 * @function
 * @param {Object} params - Chat generation parameters
 * @param {string} params.model - AI model identifier
 * @param {string} params.apiKey - API key for model access
 * @param {PlaygroundMessage[]} params.messages - Conversation history
 * @param {number} [params.frequencyPenalty] - Penalty for frequent token use
 * @param {number} [params.presencePenalty] - Penalty for token presence
 * @param {number} [params.temperature] - Randomness in response generation
 * @param {number} [params.topP] - Nucleus sampling parameter
 * @returns {Promise<{output: ReadableStream}>} Streamable response value
 * 
 * @example
 * ```typescript
 * const response = await chat({
 *   model: 'gpt-4',
 *   apiKey: 'your-api-key',
 *   messages: previousMessages,
 *   temperature: 0.7,
 *   topP: 0.9
 * });
 * 
 * for await (const chunk of response.output) {
 *   // Process streaming response
 *   console.log(chunk);
 * }
 * ```
 */
export async function chat({
  model,
  apiKey,
  messages,
  frequencyPenalty,
  presencePenalty,
  temperature,
  topP,
}: {
  model: string
  apiKey: string
  messages: PlaygroundMessage[]
  frequencyPenalty?: number
  presencePenalty?: number
  temperature?: number
  topP?: number
}) {
  logger.info('Starting chat generation', { 
    context: { 
      model,
      messagesCount: messages.length,
      frequencyPenalty,
      presencePenalty,
      temperature,
      topP
    },
    module: 'Chat'
  })
  
  // Create a streamable value for real-time updates
  const stream = createStreamableValue('')
  try {
    // Initialize OpenAI client with custom base URL
    const openai = createOpenAI({
      apiKey: apiKey,
      baseURL: normalizeUrl(env.AI_302_API_URL) + '/v1',
    })

    // Start asynchronous streaming process
    ;(async () => {
      try {
        logger.debug('Initiating stream text request', { module: 'Chat' })
        const { textStream } = await streamText({
          model: openai(model),
          messages,
          frequencyPenalty,
          presencePenalty,
          temperature,
          topP,
          // Special configuration for Claude 3.5 model
          ...(model.includes('claude-3-5') && {
            maxTokens: MAX_TOKENS,
            headers: {
              'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
            },
          }),
        })

        // Process and forward each chunk of the response
        for await (const delta of textStream) {
          stream.update(delta)
        }

        logger.info('Chat stream completed successfully', { module: 'Chat' })
        stream.done()
      } catch (e: any) {
        logger.error('Error in stream text processing', e, { 
          context: { responseBody: e.responseBody },
          module: 'Chat'
        })
        stream.error(e.responseBody)
      }
    })()
  } catch (error) {
    logger.error('Error in chat initialization', error as Error, { module: 'Chat' })
  }

  return { output: stream.value }
}
