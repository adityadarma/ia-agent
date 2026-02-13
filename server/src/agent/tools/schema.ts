import { z } from 'zod'

export const readFileSchema = z.object({
  tool: z.literal('readFile'),
  input: z.string()
})

export const searchCodeSchema = z.object({
  tool: z.literal('searchCode'),
  input: z.string()
})

export const writeFileSchema = z.object({
  tool: z.literal('writeFile'),
  input: z.object({
    path: z.string(),
    content: z.string()
  })
})

export const toolCallSchema = z.union([
  readFileSchema,
  searchCodeSchema,
  writeFileSchema
])
