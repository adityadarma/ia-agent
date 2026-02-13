import fs from 'fs/promises'
import { resolveSafePath, validateExtension } from '../security.js'

export async function readFileTool(pathInput: string) {
  const safePath = resolveSafePath(pathInput)
  validateExtension(safePath)

  const content = await fs.readFile(safePath, 'utf-8')

  return content.slice(0, 5000)
}
