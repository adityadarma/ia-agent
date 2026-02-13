import fs from 'fs/promises'
import path from 'path'
import { resolveSafePath } from '../security.js'

const MAX_RESULTS = 20
const MAX_FILE_SIZE = 100 * 1024 // 100KB limit
const MAX_DEPTH = 5

// Folders to ignore for performance
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.cache',
  'tmp'
])

export async function searchCodeTool(query: string) {
  const root = resolveSafePath('.')
  const results: string[] = []

  async function walk(dir: string, depth: number = 0): Promise<boolean> {
    // Stop if max depth reached
    if (depth > MAX_DEPTH) return false
    
    // Stop if we have enough results
    if (results.length >= MAX_RESULTS) return true

    try {
      const files = await fs.readdir(dir)

      for (const file of files) {
        // Early exit if we have enough results
        if (results.length >= MAX_RESULTS) return true

        const fullPath = path.join(dir, file)
        
        try {
          const stat = await fs.stat(fullPath)

          if (stat.isDirectory()) {
            // Skip ignored directories
            if (IGNORE_DIRS.has(file)) continue
            
            // Recursive walk
            const shouldStop = await walk(fullPath, depth + 1)
            if (shouldStop) return true
          } else if (
            file.endsWith('.ts') ||
            file.endsWith('.tsx') ||
            file.endsWith('.js') ||
            file.endsWith('.jsx')
          ) {
            // Skip files that are too large
            if (stat.size > MAX_FILE_SIZE) continue

            const content = await fs.readFile(fullPath, 'utf-8')
            if (content.includes(query)) {
              results.push(fullPath)
            }
          }
        } catch (err) {
          // Skip files we can't read (permissions, etc)
          continue
        }
      }
    } catch (err) {
      // Skip directories we can't read
      return false
    }

    return false
  }

  await walk(root)

  return results.length > 0
    ? results.slice(0, MAX_RESULTS).join('\n')
    : 'No results found'
}
