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
      model: 'deepseek-coder:1.3b',
      prompt,
      stream: true,
      temperature: 0.1,
      options: {
        num_predict: 512,      // max token output
        temperature: 0.3,      // lebih deterministik
        top_k: 40,
        top_p: 0.9,
        repeat_penalty: 1.1
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
