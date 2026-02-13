import { Request, Response, NextFunction } from 'express'

export function apiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers['x-api-key']
  const expectedKey = (process.env.API_KEY || '').trim()

  if (!apiKey || apiKey !== expectedKey) {
    console.log(`[AUTH FAIL] Received: '${apiKey}', Expected: '${expectedKey}'`)
    return res.status(401).json({ error: 'Unauthorized' })
  }

  next()
}
