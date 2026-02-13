export function logToolCall(tool: string, input: any) {
  console.log(`[TOOL CALL] ${tool}`, input)
}