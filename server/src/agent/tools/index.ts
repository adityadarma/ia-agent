import { readFileTool } from './readFile.js'
import { writeFileTool } from './writeFile.js'
import { searchCodeTool } from './searchCode.js'
import { listFilesTool } from './listFiles.js'
import { ToolInputMap } from './types.js'

export const tools: {
  [K in keyof ToolInputMap]: (
    input: ToolInputMap[K]
  ) => Promise<string>
} = {
  readFile: readFileTool,
  writeFile: writeFileTool,
  searchCode: searchCodeTool,
  listFiles: listFilesTool
}

export type ToolName = keyof ToolInputMap
