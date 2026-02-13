import path from 'path'

const PROJECT_ROOT = path.resolve('/app/workspace')
const ALLOWED_EXTENSIONS = ['.ts', '.js', '.json', '.md']

export function resolveSafePath(inputPath: string): string {
  const resolvedPath = path.resolve(PROJECT_ROOT, inputPath)

  if (!resolvedPath.startsWith(PROJECT_ROOT)) {
    throw new Error('Access denied: invalid path')
  }

  return resolvedPath
}

export function validateExtension(filePath: string) {
  const ext = path.extname(filePath)

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Access denied: file type not allowed')
  }
}