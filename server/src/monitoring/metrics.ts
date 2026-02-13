export const metrics = {
  totalRequests: 0,
  totalToolCalls: 0,
  totalTimeouts: 0,
  totalLLMCalls: 0,
  totalLLMTime: 0
}

export function recordRequest() {
  metrics.totalRequests++
}

export function recordToolCall() {
  metrics.totalToolCalls++
}

export function recordTimeout() {
  metrics.totalTimeouts++
}

export function recordLLMCall(duration: number) {
  metrics.totalLLMCalls++
  metrics.totalLLMTime += duration
}

export function getMetrics() {
  return {
    ...metrics,
    avgLLMTime:
      metrics.totalLLMCalls > 0
        ? metrics.totalLLMTime / metrics.totalLLMCalls
        : 0
  }
}
