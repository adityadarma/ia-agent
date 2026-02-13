import fs from 'fs/promises'
import { resolveSafePath, validateExtension } from '../security.js'

export async function writeFileTool(input: {
  path: string
  content: string
}) {
  const safePath = resolveSafePath(input.path)
  validateExtension(safePath)

  await fs.writeFile(safePath, input.content)

  return 'File written successfully'
}
