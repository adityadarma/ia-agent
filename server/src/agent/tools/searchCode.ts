import fs from 'fs'
import path from 'path'
import { resolveSafePath } from '../security.js'

const MAX_RESULTS = 20

export async function searchCodeTool(query: string) {
  const root = resolveSafePath('.')
  const results: string[] = []

  function walk(dir: string) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        walk(fullPath)
      } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf-8')
        if (content.includes(query)) {
          results.push(fullPath)
          if (results.length >= MAX_RESULTS) return
        }
      }
    }
  }

  walk(root)

  return results.slice(0, MAX_RESULTS).join('\n')
}
