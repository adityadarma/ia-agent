import express, { Request, Response } from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
// import timeout from 'connect-timeout'
import { runAgentStream } from './agent/agent.js'
import { apiKeyMiddleware } from './middleware/auth.js'
import { bearerAuthMiddleware } from './middleware/bearerAuth.js'
import { handleChatCompletions } from './openai/chatCompletions.js'
import { handleListModels, handleGetModel } from './openai/models.js'
import { recordRequest, getMetrics } from './monitoring/metrics.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20
})

const app = express()

// Trust reverse proxy (Nginx/Caddy) – required when X-Forwarded-For is set
app.set('trust proxy', 1)

if (!process.env.API_KEY) {
  console.error('FATAL: API_KEY environment variable is not set!')
  process.exit(1)
}

app.use(cors())
app.use(express.json())
app.use(limiter)
// Apply apiKeyMiddleware only to specific routes, not globally
// app.use(timeout('30s'))
// app.use((req: Request, _res: Response, next: NextFunction) => {
//   if (!req.timedout) next()
// })

app.post('/agent/chat', apiKeyMiddleware, async (req: Request, res: Response) => {
  recordRequest()
  res.setHeader('Content-Type', 'text/plain')
  res.setHeader('Transfer-Encoding', 'chunked')

  try {
    await runAgentStream(req.body, (chunk: string) => {
      res.write(chunk)
    })

    res.end()
  } catch (err) {
    console.error('Agent error:', err)
    res.status(500).end()
  }
})

app.get('/metrics', apiKeyMiddleware, (_req: Request, res: Response) => {
  res.json(getMetrics())
})

app.get('/', (_req: Request, res: Response) => {
  res.status(200).send('OK')
})

// ─── OpenAI-compatible API (v1) ──────────────────────────────────────────────

// Serve OpenAPI spec
app.get('/v1/openapi.yaml', (_req: Request, res: Response) => {
  try {
    const specPath = join(__dirname, '../openapi.yaml')
    const content = readFileSync(specPath, 'utf-8')
    res.setHeader('Content-Type', 'application/yaml')
    res.send(content)
  } catch {
    res.status(404).json({ error: 'OpenAPI spec not found' })
  }
})

// Models endpoints
app.get('/v1/models', bearerAuthMiddleware, handleListModels)
app.get('/v1/models/:model', bearerAuthMiddleware, handleGetModel)

// Chat completions – the main OpenAI-compatible endpoint
// Used by: Claude Code, OpenCode, Continue, Cursor, etc.
app.post('/v1/chat/completions', bearerAuthMiddleware, handleChatCompletions)

const PORT = parseInt(process.env.PORT || '3000', 10)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Agent server running on port ${PORT}`)
})
