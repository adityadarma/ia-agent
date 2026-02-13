# 🤖 AI Agent Server

Self-hosted AI coding assistant optimized for **8GB RAM** systems.

**Perfect for:** ThinkPad M710Q, Core i5 Gen 7, 8GB RAM

---

## 🎯 Features

- ✅ **Lightweight:** Optimized for 8GB RAM systems
- ✅ **Fast:** Async operations, no blocking I/O
- ✅ **Smart:** Context-aware code assistance
- ✅ **Secure:** API key authentication
- ✅ **Streaming:** Real-time response streaming
- ✅ **Tools:** File operations, code search, directory listing
- ✅ **Memory:** Session-based conversation history
- ✅ **Monitoring:** Built-in metrics endpoint

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/ia-agent.git
cd ia-agent
```

### 2. Run Setup Script

```bash
./start.sh
```

That's it! The script will:
- ✅ Check Docker installation
- ✅ Generate secure API key
- ✅ Build and start services
- ✅ Download AI model
- ✅ Verify everything is running

### 3. Test Server

```bash
# Health check (no auth)
curl http://localhost:3000/

# Test agent (use your API key from start.sh output)
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"prompt": "Hello!", "sessionId": "test"}'
```

---

## 📁 Project Structure

```
ia-agent/
├── server/                 # Node.js server
│   ├── src/
│   │   ├── agent/         # AI agent logic
│   │   │   ├── agent.ts   # Main agent loop
│   │   │   ├── llm.ts     # LLM integration
│   │   │   ├── tools/     # Available tools
│   │   │   └── ...
│   │   ├── middleware/    # Auth middleware
│   │   ├── monitoring/    # Metrics
│   │   └── server.ts      # Express server
│   └── Dockerfile
├── ollama/                # Ollama service
│   └── Dockerfile
├── docker-compose.yml     # Service orchestration
├── start.sh              # Quick start script
├── .env.example          # Environment template
├── DEPLOYMENT.md         # Deployment guide
├── OPTIMIZATION_SUMMARY.md
└── QUICK_REFERENCE.md
```

---

## 🛠️ Available Tools

The AI agent has access to these tools:

1. **listFiles** - List directory contents
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

## 📊 API Endpoints

### `GET /`
Health check endpoint (no authentication required)

**Response:** `200 OK`

---

### `POST /agent/chat`
Main agent endpoint for code assistance

**Headers:**
- `Content-Type: application/json`
- `x-api-key: YOUR_API_KEY`

**Request Body:**
```json
{
  "prompt": "Your question or task",
  "sessionId": "unique-session-id"
}
```

**Response:** Streaming text/plain

---

### `GET /metrics`
Server metrics and statistics

**Headers:**
- `x-api-key: YOUR_API_KEY`

**Response:**
```json
{
  "totalRequests": 42,
  "totalToolCalls": 15,
  "totalLLMCalls": 50,
  "totalTimeouts": 0,
  "avgLLMResponseTime": 3500,
  "uptime": 86400
}
```

---

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
# API Authentication
API_KEY=your-secure-api-key

# Server
PORT=3000

# Ollama
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=deepseek-coder:1.3b

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

### Memory Limits (docker-compose.yml)

Current limits for 8GB RAM:
- Server: 512M
- Ollama: 3G
- Redis: 256M

**After RAM upgrade to 16GB**, you can increase:
- Ollama: 8G (for larger models)
- Server: 1G

---

## 🔧 Management Commands

### Start Services
```bash
docker compose up -d
```

### Stop Services
```bash
docker compose down
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker logs ai-agent-server -f
docker logs ollama -f
docker logs ai-redis -f
```

### Restart Services
```bash
docker compose restart
```

### Monitor Resources
```bash
docker stats
```

### Rebuild
```bash
docker compose down
docker compose up -d --build
```

---

## 🌐 Remote Access

### Local Network

Server is accessible from your local network:

```
http://192.168.x.x:3000
```

Find server IP:
```bash
ip addr show | grep inet
```

### Internet Access (Optional)

See `DEPLOYMENT.md` for:
- Tailscale setup (recommended)
- Cloudflare Tunnel
- Port forwarding

---

## 📈 Performance

### Current (8GB RAM + 1.3b model)

- Simple query: **3-8 seconds**
- With 1 tool: **10-15 seconds**
- With 2-3 tools: **20-30 seconds**

### After RAM Upgrade (16GB + 6.7b model)

- Better code quality
- More accurate responses
- Larger context window
- See `QUICK_REFERENCE.md` for upgrade guide

---

## 🔒 Security

### Best Practices

1. ✅ **Change default API key** (start.sh does this automatically)
2. ✅ **Use firewall** to restrict access
3. ✅ **Enable HTTPS** for internet access
4. ✅ **Keep Docker updated**
5. ✅ **Monitor logs** for suspicious activity

### Generate Secure API Key

```bash
openssl rand -hex 32
```

---

## 🐛 Troubleshooting

### Server won't start

```bash
# Check logs
docker logs ai-agent-server

# Check if port is in use
sudo lsof -i :3000

# Restart Docker
sudo systemctl restart docker
```

### Model not loading

```bash
# Check Ollama logs
docker logs ollama

# Re-pull model
docker exec ollama ollama pull deepseek-coder:1.3b

# List models
docker exec ollama ollama list
```

### Out of memory

```bash
# Check memory usage
docker stats

# Free up memory
docker system prune -a
```

See `DEPLOYMENT.md` for more troubleshooting tips.

---

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide
- **[OPTIMIZATION_SUMMARY.md](OPTIMIZATION_SUMMARY.md)** - Performance optimizations
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick config reference

---

## 🎯 Use Cases

### For VSCode Extension (Coming Soon)

Connect VSCode to your server:
```json
{
  "aiAgent.serverUrl": "http://server-ip:3000",
  "aiAgent.apiKey": "your-api-key"
}
```

### For API Integration

```javascript
const response = await fetch('http://server-ip:3000/agent/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key'
  },
  body: JSON.stringify({
    prompt: 'Explain this code',
    sessionId: 'user-123'
  })
});

const reader = response.body.getReader();
// Stream response...
```

---

## 🚀 Roadmap

- [x] Core agent functionality
- [x] File operations tools
- [x] Code search optimization
- [x] Streaming responses
- [x] Session management
- [x] Metrics endpoint
- [ ] VSCode extension client
- [ ] Web UI client
- [ ] Git integration tools
- [ ] Code refactoring tools
- [ ] Multi-language support

---

## 💡 Tips

1. **Use listFiles first** - Explore project structure before reading files
2. **Be specific** - Clear prompts get better results
3. **Monitor memory** - Keep an eye on `docker stats`
4. **Upgrade RAM** - 16GB unlocks much better models
5. **Check logs** - Logs show what the agent is doing

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Ollama** - Local LLM inference
- **DeepSeek** - Excellent coding models
- **Redis** - Fast session storage
- **Docker** - Easy deployment

---

## 📞 Support

- **Issues:** GitHub Issues
- **Docs:** See `/docs` folder
- **Logs:** `docker compose logs -f`

---

**Built with ❤️ for developers who want local AI coding assistance**

**Optimized for 8GB RAM systems** 🚀
