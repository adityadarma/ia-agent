import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: 6379
})

const MAX_HISTORY = 3

export async function appendMemory(sessionId: string, message: string) {
  await redis.lpush(sessionId, message)
  await redis.ltrim(sessionId, 0, MAX_HISTORY - 1)
}

export async function getMemory(sessionId: string) {
  return await redis.lrange(sessionId, 0, MAX_HISTORY - 1)
}
