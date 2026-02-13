import fs from 'fs/promises'
import path from 'path'
import { resolveSafePath } from '../security.js'

const IGNORE_ITEMS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.cache',
  'tmp'
])

export async function listFilesTool(dirPath: string = '.') {
  const safePath = resolveSafePath(dirPath)

  try {
    const items = await fs.readdir(safePath, { withFileTypes: true })
    
    const result: string[] = []

    for (const item of items) {
      // Skip ignored items
      if (IGNORE_ITEMS.has(item.name)) continue

      if (item.isDirectory()) {
        result.push(`📁 ${item.name}/`)
      } else {
        const stat = await fs.stat(path.join(safePath, item.name))
        const sizeKB = (stat.size / 1024).toFixed(1)
        result.push(`📄 ${item.name} (${sizeKB} KB)`)
      }
    }

    return result.length > 0
      ? result.join('\n')
      : 'Directory is empty'
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    throw new Error(`Failed to list directory: ${errorMsg}`)
  }
}
