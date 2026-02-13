import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
// import timeout from 'connect-timeout'
import { runAgentStream } from './agent/agent.js'
import { apiKeyMiddleware } from './middleware/auth.js'
import { recordRequest, getMetrics } from './monitoring/metrics.js'

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20
})

const app = express()

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

const PORT = parseInt(process.env.PORT || '3000', 10)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Agent server running on port ${PORT}`)
})
