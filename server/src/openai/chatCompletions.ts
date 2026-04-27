import { Request, Response } from 'express'
import axios from 'axios'
import {
  ChatCompletionRequest,
  ChatCompletionChunk,
  ChatCompletionResponse,
  ToolCall
} from './types.js'
import { recordRequest, recordLLMCall } from '../monitoring/metrics.js'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:3b'

function generateId(): string {
  return 'chatcmpl-' + Math.random().toString(36).substring(2, 15)
}

function buildOllamaRequest(body: ChatCompletionRequest) {
  const model = body.model || DEFAULT_MODEL

  // Support both max_tokens (OpenAI v1) and max_completion_tokens (OpenAI v2 / Claude Code)
  const maxTokens = body.max_completion_tokens ?? body.max_tokens
    ?? parseInt(process.env.OLLAMA_NUM_PREDICT || '2048', 10)

  const req: Record<string, unknown> = {
    model,
    messages: body.messages,
    options: {
      temperature: body.temperature ?? 0.3,
      top_p: body.top_p ?? 0.9,
      num_predict: maxTokens,
      num_ctx: parseInt(process.env.OLLAMA_CONTEXT_LENGTH || '4096', 10),
      repeat_penalty: 1.1 + (body.presence_penalty ?? 0),
      frequency_penalty: body.frequency_penalty ?? 0,
      num_thread: 4
    }
  }

  // Forward tools if provided (Ollama supports them for compatible models)
  if (body.tools && body.tools.length > 0) {
    req.tools = body.tools
  }

  if (body.stop) {
    (req.options as Record<string, unknown>).stop = Array.isArray(body.stop)
      ? body.stop
      : [body.stop]
  }

  return req
}

function parseOllamaToolCalls(
  rawToolCalls: { function: { name: string; arguments: unknown } }[]
): ToolCall[] {
  return rawToolCalls.map((tc, i) => ({
    id: `call_${i}_${Math.random().toString(36).substring(2, 8)}`,
    type: 'function' as const,
    function: {
      name: tc.function.name,
      arguments:
        typeof tc.function.arguments === 'string'
          ? tc.function.arguments
          : JSON.stringify(tc.function.arguments)
    }
  }))
}

export async function handleChatCompletions(req: Request, res: Response) {
  const body: ChatCompletionRequest = req.body
  recordRequest()

  const model: string = body.model || DEFAULT_MODEL
  const stream = body.stream ?? false
  const id = generateId()
  const created = Math.floor(Date.now() / 1000)
  const start = Date.now()

  const ollamaReq = buildOllamaRequest(body)

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    try {
      const response = await axios.post(
        `${OLLAMA_URL}/api/chat`,
        { ...ollamaReq, stream: true },
        { responseType: 'stream' }
      )

      // Send role delta first
      const roleChunk: ChatCompletionChunk = {
        id,
        object: 'chat.completion.chunk',
        created,
        model,
        choices: [{ index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null }]
      }
      res.write(`data: ${JSON.stringify(roleChunk)}\n\n`)

      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n')
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const parsed = JSON.parse(line)
            const msg = parsed.message

            // Tool calls from Ollama
            if (msg?.tool_calls && msg.tool_calls.length > 0) {
              const toolCallChunk: ChatCompletionChunk = {
                id,
                object: 'chat.completion.chunk',
                created,
                model,
                choices: [{
                  index: 0,
                  delta: {
                    role: 'assistant',
                    content: null,
                    tool_calls: parseOllamaToolCalls(msg.tool_calls)
                  },
                  finish_reason: 'tool_calls'
                }]
              }
              res.write(`data: ${JSON.stringify(toolCallChunk)}\n\n`)
              return
            }

            // Regular content chunk
            if (msg?.content) {
              const contentChunk: ChatCompletionChunk = {
                id,
                object: 'chat.completion.chunk',
                created,
                model,
                choices: [{
                  index: 0,
                  delta: { content: msg.content },
                  finish_reason: null
                }]
              }
              res.write(`data: ${JSON.stringify(contentChunk)}\n\n`)
            }

            if (parsed.done) {
              recordLLMCall(Date.now() - start)
              const stopChunk: ChatCompletionChunk = {
                id,
                object: 'chat.completion.chunk',
                created,
                model,
                choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
              }
              res.write(`data: ${JSON.stringify(stopChunk)}\n\n`)
              res.write('data: [DONE]\n\n')
            }
          } catch {
            // skip malformed lines
          }
        }
      })

      response.data.on('end', () => {
        res.end()
      })

      response.data.on('error', (err: Error) => {
        console.error('Ollama stream error:', err)
        res.end()
      })
    } catch (err) {
      console.error('Chat completions stream error:', err)
      if (!res.headersSent) {
        res.status(500).json({
          error: { message: 'Internal server error', type: 'server_error' }
        })
      } else {
        res.end()
      }
    }
  } else {
    // Non-streaming
    try {
      const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
        ...ollamaReq,
        stream: false
      })
      recordLLMCall(Date.now() - start)

      const msg = response.data.message
      const hasToolCalls = msg?.tool_calls && msg.tool_calls.length > 0

      const result: ChatCompletionResponse = {
        id,
        object: 'chat.completion',
        created,
        model: response.data.model || model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: hasToolCalls ? null : (msg?.content || ''),
            ...(hasToolCalls && {
              tool_calls: parseOllamaToolCalls(msg.tool_calls)
            })
          },
          finish_reason: hasToolCalls ? 'tool_calls' : 'stop'
        }],
        usage: {
          prompt_tokens: response.data.prompt_eval_count || 0,
          completion_tokens: response.data.eval_count || 0,
          total_tokens:
            (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
        }
      }

      res.json(result)
    } catch (err) {
      console.error('Chat completions error:', err)
      res.status(500).json({
        error: { message: 'Internal server error', type: 'server_error' }
      })
    }
  }
}
