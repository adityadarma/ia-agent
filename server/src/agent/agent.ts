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


const MAX_STEPS = 3 // Increased for better task completion
const LLM_TIMEOUT_MS = 120000 // 2 minutes for complex reasoning
const MAX_CONTEXT_LENGTH = 2048 // Matched with LLM num_ctx


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
  console.log(data)
  const sessionId = data.sessionId || 'default'
  const history = await getMemory(sessionId)

  let conversationContext = history.join('\n')
  conversationContext += `\nUser: ${data.prompt}\n`

  for (let step = 0; step < MAX_STEPS; step++) {
    // Send status update to user
    if (step === 0) {
      onChunk('[Thinking...] ')
    }

    let plannerResponse = ''

    const start = Date.now()

    try {
      await Promise.race([
        streamLLM(
          buildPlannerPrompt({
            prompt: trimContext(conversationContext),
            contextFiles: data.contextFiles
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
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      onChunk(`\n[Error: ${errorMsg}]\n`)
      throw new Error(`LLM timeout or error: ${errorMsg}`)
    }

    try {
      const parsedJson = JSON.parse(plannerResponse)
      const validation = toolCallSchema.safeParse(parsedJson)

      if (validation.success) {
        const toolCall = validation.data
        const toolName = toolCall.tool as ToolName

        recordToolCall()

        // Send tool status to user
        onChunk(`[Using tool: ${toolName}] `)

        try {
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
        } catch (toolErr) {
          const toolErrorMsg = toolErr instanceof Error ? toolErr.message : 'Tool execution failed'
          onChunk(`[Tool error: ${toolErrorMsg}] `)
          conversationContext += `\nTool ${toolName} failed: ${toolErrorMsg}\n`
          // Continue to final answer phase
        }
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
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      onChunk(`\n[Error generating response: ${errorMsg}]\n`)
      throw new Error(`Final answer timeout: ${errorMsg}`)
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
