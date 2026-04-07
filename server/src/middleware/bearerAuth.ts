import { Request, Response, NextFunction } from 'express'

export function bearerAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization']
  const apiKeyHeader = req.headers['x-api-key']
  const expectedKey = (process.env.API_KEY || '').trim()

  // Support both "Authorization: Bearer <key>" and "x-api-key: <key>"
  let providedKey: string | undefined

  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedKey = authHeader.slice(7).trim()
  } else if (apiKeyHeader) {
    providedKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader
  }

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({
      error: {
        message: 'Incorrect API key provided.',
        type: 'authentication_error',
        param: null,
        code: 'invalid_api_key'
      }
    })
  }

  next()
}
