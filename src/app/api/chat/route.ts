import { env } from '@/env'
import { createOpenAI } from '@ai-sdk/openai'
import { createDataStreamResponse, generateId, JSONValue, streamText } from 'ai'

// Allow streaming responses up to 30 seconds
export const maxDuration = 3000

const model = createOpenAI({
  apiKey: env.AI_302_API_KEY,
  baseURL: 'https://api.302.ai/v1',
})

export async function POST(req: Request) {
  const { messages } = await req.json()

  return createDataStreamResponse({
    execute: (dataStream) => {
      dataStream.writeData('initialized call')

      const result = streamText({
        model: model('gpt-4o', { logprobs: 3 }),
        messages,
        onChunk() {
          dataStream.writeMessageAnnotation({ chunk: '123' })
        },
        onFinish: (res) => {
          // message annotation:
          dataStream.writeMessageAnnotation({
            id: generateId(),
            other: {
              logprobs: res.logprobs
            } as JSONValue,
          })

          // call annotation:
          dataStream.writeData('call completed')
        },
      })

      result.mergeIntoDataStream(dataStream)
    },
    onError: (error) => {
      // Error messages are masked by default for security reasons.
      // If you want to expose the error message to the client, you can do so here:
      return error instanceof Error ? error.message : String(error)
    },
  })
}
