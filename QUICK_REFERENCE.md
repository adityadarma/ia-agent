# Quick Reference: Optimized Configuration

## 🎯 Current Setup (8GB RAM)

### Model Configuration
```typescript
// llm.ts
model: 'deepseek-coder:1.3b'  // ~1.5GB RAM
num_predict: 384               // Token output limit
temperature: 0.2               // Deterministic
num_ctx: 2048                  // Context window
num_thread: 4                  // CPU cores
```

### Agent Limits
```typescript
// agent.ts
MAX_STEPS: 3                   // Max tool iterations
LLM_TIMEOUT_MS: 45000          // 45 seconds
MAX_CONTEXT_LENGTH: 2048       // Matched with num_ctx
```

### Memory Limits
```yaml
# docker-compose.yml
server:  512M
ollama:  3G
redis:   256M
Total:   ~3.8GB
```

---

## 🚀 After RAM Upgrade to 16GB

### Recommended Changes

#### 1. Update Model (Better Quality!)
```typescript
// llm.ts
model: 'deepseek-coder:6.7b'  // or 'qwen2.5-coder:7b'
num_predict: 512               // More tokens
temperature: 0.2               // Keep same
num_ctx: 4096                  // Larger context
num_thread: 4                  // Keep same
```

#### 2. Update Agent Config
```typescript
// agent.ts
MAX_STEPS: 5                   // More iterations
LLM_TIMEOUT_MS: 60000          // 60s (larger model slower)
MAX_CONTEXT_LENGTH: 4096       // Match num_ctx
```

#### 3. Update Memory Limits
```yaml
# docker-compose.yml
server:  1G      # More headroom
ollama:  8G      # Larger model needs more
redis:   512M    # More cache
Total:   ~9.5GB
```

#### 4. Update Memory History
```typescript
// memory.ts
MAX_HISTORY: 10  // More context retention
```

---

## 📊 Performance Expectations

### With 8GB + 1.3b Model (Current)
- Simple query: 3-8s
- With 1 tool: 10-15s
- With 2-3 tools: 20-30s
- Quality: Good for simple tasks

### With 16GB + 6.7b Model (After Upgrade)
- Simple query: 5-12s
- With 1 tool: 15-25s
- With 2-3 tools: 30-45s
- Quality: Excellent for complex tasks

---

## 🛠️ Available Tools

1. **listFiles** - Fast directory listing
   ```json
   {"tool": "listFiles", "input": "."}
   ```

2. **readFile** - Read file contents
   ```json
   {"tool": "readFile", "input": "src/file.ts"}
   ```

3. **searchCode** - Search codebase (optimized!)
   ```json
   {"tool": "searchCode", "input": "function name"}
   ```

4. **writeFile** - Write/update files
   ```json
   {
     "tool": "writeFile",
     "input": {
       "path": "src/new.ts",
       "content": "code here"
     }
   }
   ```

---

## 🔍 Monitoring Commands

### Check Docker Stats
```bash
docker stats
```

### Check Ollama Model
```bash
docker exec ollama ollama list
```

### View Server Logs
```bash
docker logs ai-agent-server -f
```

### View Ollama Logs
```bash
docker logs ollama -f
```

### Restart Services
```bash
docker-compose down
docker-compose up -d
```

---

## 💡 Tips for Best Performance

1. **Use listFiles before readFile** - Explore structure first
2. **Be specific with searchCode** - Narrow queries are faster
3. **Keep context focused** - Don't load unnecessary files
4. **Monitor memory** - Watch `docker stats` during heavy use
5. **Restart periodically** - If memory usage creeps up

---

## 🐛 Troubleshooting

### Server Freezing
- ✅ Fixed with async searchCode
- If still happens: Check `docker stats` for memory

### Slow Responses
- Normal for CPU-only inference
- Consider RAM upgrade for larger model

### Out of Memory
- Check docker-compose memory limits
- Reduce MAX_HISTORY if needed
- Restart containers

### Tool Not Working
- Check logs: `docker logs ai-agent-server -f`
- Verify tool name in prompt
- Check file paths are correct

---

**Quick Start After Changes:**
```bash
cd /Users/aditya/Github/ia-agent
docker-compose down
docker-compose up -d --build
docker logs ai-agent-server -f
```
