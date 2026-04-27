import { Request, Response } from 'express'
import axios from 'axios'
import { ModelObject } from './types.js'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:3b'

export async function handleListModels(_req: Request, res: Response) {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`)
    const ollamaModels: {
      name: string
      modified_at?: string
    }[] = response.data.models || []

    const models: ModelObject[] = ollamaModels.map((m) => ({
      id: m.name,
      object: 'model',
      created: m.modified_at
        ? Math.floor(new Date(m.modified_at).getTime() / 1000)
        : Math.floor(Date.now() / 1000),
      owned_by: 'ollama'
    }))

    // Ensure the configured default model is always listed
    const defaultModel = DEFAULT_MODEL
    if (!models.find((m) => m.id === defaultModel)) {
      models.unshift({
        id: defaultModel,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'ollama'
      })
    }

    res.json({ object: 'list', data: models })
  } catch (err) {
    console.error('Models list error:', err)
    // Fallback to configured model
    res.json({
      object: 'list',
      data: [
        {
          id: DEFAULT_MODEL,
          object: 'model',
          created: Math.floor(Date.now() / 1000),
          owned_by: 'ollama'
        }
      ]
    })
  }
}

export async function handleGetModel(req: Request, res: Response) {
  const modelId = req.params.model
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`)
    const ollamaModels: { name: string; modified_at?: string }[] =
      response.data.models || []
    const found = ollamaModels.find((m) => m.name === modelId)

    if (!found) {
      return res.status(404).json({
        error: { message: `Model '${modelId}' not found`, type: 'invalid_request_error' }
      })
    }

    const model: ModelObject = {
      id: found.name,
      object: 'model',
      created: found.modified_at
        ? Math.floor(new Date(found.modified_at).getTime() / 1000)
        : Math.floor(Date.now() / 1000),
      owned_by: 'ollama'
    }

    res.json(model)
  } catch (err) {
    console.error('Get model error:', err)
    res.status(500).json({
      error: { message: 'Internal server error', type: 'server_error' }
    })
  }
}
