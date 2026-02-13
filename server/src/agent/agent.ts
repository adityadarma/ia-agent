import { streamLLM } from './llm.js'
import { buildPlannerPrompt } from './promptBuilder.js'
import { tools, ToolName } from './tools/index.js'
import { appendMemory, getMemory } from './memory.js'
import { logToolCall } from './logger.js';
import { toolCallSchema } from './tools/schema.js'
import {
  recordToolCall,
  recordLLMCall,
  recordTimeout
} from '../monitoring/metrics.js'


const MAX_STEPS = 2 // penting untuk 8GB RAM
const LLM_TIMEOUT_MS = 60000
const MAX_CONTEXT_LENGTH = 8000


function trimContext(context: string): string {
  if (context.length > MAX_CONTEXT_LENGTH) {
    return context.slice(-MAX_CONTEXT_LENGTH)
  }
  return context
}
export async function runAgentStream(
  data: any,
  onChunk: (chunk: string) => void
) {
  const sessionId = data.sessionId || 'default'
  const history = await getMemory(sessionId)

  let conversationContext = history.join('\n')
  conversationContext += `\nUser: ${data.prompt}\n`

  for (let step = 0; step < MAX_STEPS; step++) {
    let plannerResponse = ''

    const start = Date.now()

    try {
      await Promise.race([
        streamLLM(
          buildPlannerPrompt({
            prompt: trimContext(conversationContext)
          }),
          (chunk) => {
            plannerResponse += chunk
          }
        ),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('LLM timeout')),
            LLM_TIMEOUT_MS
          )
        )
      ])

      recordLLMCall(Date.now() - start)
    } catch (err) {
      recordTimeout()
      throw err
    }

    try {
      const parsedJson = JSON.parse(plannerResponse)
      const validation = toolCallSchema.safeParse(parsedJson)

      if (validation.success) {
        const toolCall = validation.data
        const toolName = toolCall.tool as ToolName

        recordToolCall()

        const toolResult = await tools[toolName](
          toolCall.input as never
        )

        logToolCall(toolName, toolCall.input)

        conversationContext += `
Tool used: ${toolName}
Tool result:
${toolResult}
`
        conversationContext = trimContext(conversationContext)

        continue
      }
    } catch {
      // bukan tool call → lanjut ke final answer
    }

    // Final Answer Phase
    const finalStart = Date.now()

    try {
      await Promise.race([
        streamLLM(trimContext(conversationContext), onChunk),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('LLM timeout')),
            LLM_TIMEOUT_MS
          )
        )
      ])

      recordLLMCall(Date.now() - finalStart)
    } catch (err) {
      recordTimeout()
      throw err
    }

    await appendMemory(sessionId, `User: ${data.prompt}`)

    return
  }

  // Safety fallback
  await streamLLM(
    'The agent stopped due to safety limits. Please refine your request.',
    onChunk
  )
}
