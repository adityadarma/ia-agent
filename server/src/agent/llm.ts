import axios from 'axios'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const DEFAULT_MODEL = 'gemma4:e4b'

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
}

/**
 * Stream using the Ollama /api/generate endpoint (prompt-based).
 * Used by the legacy agent loop.
 */
export async function streamLLM(
  prompt: string,
  onChunk: (chunk: string) => void
) {
  const response = await axios.post(
    `${OLLAMA_URL}/api/generate`,
    {
      model: DEFAULT_MODEL,
      prompt,
      stream: true,
      options: {
        num_predict: parseInt(process.env.OLLAMA_NUM_PREDICT || '2048', 10),
        temperature: 0.3,
        top_k: 40,
        top_p: 0.9,
        repeat_penalty: 1.1,
        num_ctx: parseInt(process.env.OLLAMA_CONTEXT_LENGTH || '2048', 10),
        num_thread: 4
      }
    },
    { responseType: 'stream' }
  )

  return new Promise<void>((resolve, reject) => {
    response.data.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n')

      for (const line of lines) {
        if (!line.trim()) continue

        const parsed = JSON.parse(line)
        if (parsed.response) {
          onChunk(parsed.response)
        }
      }
    })

    response.data.on('end', resolve)
    response.data.on('error', reject)
  })
}

/**
 * Stream using the Ollama /api/chat endpoint (messages-based).
 * Used by the OpenAI-compatible layer.
 */
export async function streamChatLLM(
  messages: LLMMessage[],
  onChunk: (chunk: string) => void
) {
  const response = await axios.post(
    `${OLLAMA_URL}/api/chat`,
    {
      model: DEFAULT_MODEL,
      messages,
      stream: true,
      options: {
        num_predict: parseInt(process.env.OLLAMA_NUM_PREDICT || '2048', 10),
        temperature: 0.3,
        top_k: 40,
        top_p: 0.9,
        repeat_penalty: 1.1,
        num_ctx: parseInt(process.env.OLLAMA_CONTEXT_LENGTH || '4096', 10),
        num_thread: 4
      }
    },
    { responseType: 'stream' }
  )

  return new Promise<void>((resolve, reject) => {
    response.data.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n')
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const parsed = JSON.parse(line)
          if (parsed.message?.content) {
            onChunk(parsed.message.content)
          }
        } catch {
          // skip malformed lines
        }
      }
    })

    response.data.on('end', resolve)
    response.data.on('error', reject)
  })
}
