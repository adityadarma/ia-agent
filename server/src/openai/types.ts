export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  name?: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface FunctionDef {
  name: string
  description?: string
  parameters?: Record<string, unknown>
}

export interface Tool {
  type: 'function'
  function: FunctionDef
}

export interface ChatCompletionRequest {
  model?: string
  messages: ChatMessage[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
  max_completion_tokens?: number  // Claude Code / OpenAI v2 alias
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string | string[]
  tools?: Tool[]
  tool_choice?: 'none' | 'auto' | { type: 'function'; function: { name: string } }
  user?: string
}

export interface ChatCompletionResponse {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: {
    index: number
    message: ChatMessage
    finish_reason: 'stop' | 'length' | 'tool_calls' | null
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface ChatCompletionChunk {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  choices: {
    index: number
    delta: Partial<ChatMessage>
    finish_reason: 'stop' | 'length' | 'tool_calls' | null
  }[]
}

export interface ModelObject {
  id: string
  object: 'model'
  created: number
  owned_by: string
}
