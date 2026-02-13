import axios from 'axios'

const OLLAMA_URL =
  process.env.OLLAMA_URL || 'http://localhost:11434'

export async function streamLLM(
  prompt: string,
  onChunk: (chunk: string) => void
) {
  const response = await axios.post(
    `${OLLAMA_URL}/api/generate`,
    {
      model: process.env.OLLAMA_MODEL || 'qwen2.5-coder:3b',
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
