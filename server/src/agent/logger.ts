export function logToolCall(tool: string, input: any) {
  const timestamp = new Date().toISOString()
  const inputStr = typeof input === 'string' ? input : JSON.stringify(input, null, 2)
  console.log(`\n[${timestamp}] 🔧 TOOL CALL: ${tool}`)
  console.log(`Input: ${inputStr}\n`)
}