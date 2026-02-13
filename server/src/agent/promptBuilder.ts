interface ContextItem {
  path: string
  content: string
  isActive?: boolean
  isStructure?: boolean
}

export function buildPlannerPrompt(data: { 
  prompt: string
  contextFiles?: ContextItem[] 
}) {
  let contextStr = ''
  
  if (data.contextFiles && data.contextFiles.length > 0) {
    contextStr += '\n[CONTEXT]\n'
    for (const file of data.contextFiles) {
      if (file.isStructure) {
        contextStr += `Project Structure:\n${file.content}\n\n`
      } else {
        contextStr += `File: ${file.path} ${file.isActive ? '(Active)' : ''}\n\`\`\`\n${file.content}\n\`\`\`\n\n`
      }
    }
    contextStr += '[/CONTEXT]\n\n'
  }

  return `You are a helpful AI coding assistant based on Qwen 2.5 Coder 3B.

AVAILABLE TOOLS:
- listFiles: List directory contents
- readFile: Read file contents
- writeFile: Write/update files
- searchCode: Search for code patterns

GUIDELINES:
1. If user provided [CONTEXT], use it! You don't need to read those files again.
2. If the user asks a GENERAL QUESTION (e.g. "What is Laravel?", "Write a Python script"), ANSWER DIRECTLY. DO NOT USE TOOLS.
3. Only use tools if you need MORE information than what is in [CONTEXT].
4. Be concise and professional.

TOOL USAGE FORMAT (JSON ONLY):
To use a tool, respond ONLY with JSON:

{
  "tool": "readFile",
  "input": "path/to/file.ts"
}

${contextStr}USER REQUEST:
${data.prompt}
`
}
