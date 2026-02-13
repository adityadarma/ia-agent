# Server Deployment Guide
**Target:** ThinkPad M710Q - Core i5 Gen 7 - 8GB RAM

## 🎯 Overview

Setup AI Agent server untuk production deployment dengan:
- Docker Compose untuk easy management
- Optimized untuk 8GB RAM
- Remote access dari VSCode client
- Auto-restart on failure

---

## 📋 Prerequisites

### 1. Install Docker & Docker Compose

**Ubuntu/Debian:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

**Arch Linux:**
```bash
sudo pacman -S docker docker-compose
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

**Logout and login again** for group changes to take effect.

---

## 🚀 Deployment Steps

### 1. Clone Repository to Server

```bash
# SSH to your ThinkPad server
ssh user@thinkpad-ip

# Clone repo
cd ~
git clone https://github.com/yourusername/ia-agent.git
cd ia-agent
```

### 2. Configure Environment

```bash
# Edit docker-compose.yml if needed
nano docker-compose.yml

# Set your API key (IMPORTANT!)
# Change API_KEY in docker-compose.yml from 'supersecret123' to something secure
```

**Generate secure API key:**
```bash
# Generate random API key
openssl rand -hex 32
# Copy this and use it as API_KEY
```

### 3. Pull Ollama Model

```bash
# Start only Ollama first
docker compose up -d ollama

# Wait for Ollama to start (check with docker logs)
docker logs ollama -f

# Pull the model (this will take a few minutes)
docker exec ollama ollama pull deepseek-coder:1.3b

# Verify model is downloaded
docker exec ollama ollama list
```

### 4. Start All Services

```bash
# Start everything
docker compose up -d

# Check status
docker compose ps

# Check logs
docker logs ai-agent-server -f
```

### 5. Test Server

```bash
# Test health endpoint (no auth needed)
curl http://localhost:3000/

# Test agent endpoint (needs API key)
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{
    "prompt": "Hello, what can you do?",
    "sessionId": "test-session"
  }'

# Test metrics endpoint
curl http://localhost:3000/metrics \
  -H "x-api-key: YOUR_API_KEY_HERE"
```

---

## 🌐 Network Configuration

### Option 1: Local Network Access (Recommended for Start)

**On Server:**
```bash
# Find server IP
ip addr show | grep inet

# Server will be accessible at:
# http://192.168.x.x:3000
```

**On Client (your laptop):**
```bash
# Test connection
curl http://192.168.x.x:3000/

# If works, you can use this URL in VSCode extension
```

### Option 2: Expose to Internet (Advanced)

**Using Tailscale (Recommended - Easy & Secure):**
```bash
# Install Tailscale on server
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Install Tailscale on client laptop
# Download from: https://tailscale.com/download

# Now you can access server via Tailscale IP
# Example: http://100.x.x.x:3000
```

**Using Cloudflare Tunnel (Free & Secure):**
```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create ia-agent

# Configure tunnel
nano ~/.cloudflared/config.yml
```

**config.yml:**
```yaml
tunnel: <your-tunnel-id>
credentials-file: /home/user/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: ia-agent.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

**Run tunnel:**
```bash
cloudflared tunnel run ia-agent
```

### Option 3: Port Forwarding (If you have public IP)

**On Router:**
1. Login to router admin panel
2. Find "Port Forwarding" or "Virtual Server"
3. Forward external port 3000 to server IP:3000
4. Access via: `http://your-public-ip:3000`

**⚠️ Security Warning:** Use strong API key and consider adding firewall rules!

---

## 🔒 Security Hardening

### 1. Firewall Configuration

```bash
# Install UFW (Ubuntu)
sudo apt install ufw

# Allow SSH (IMPORTANT - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow AI Agent only from local network
sudo ufw allow from 192.168.0.0/16 to any port 3000

# Or allow from specific IP only
sudo ufw allow from YOUR_LAPTOP_IP to any port 3000

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 2. Change Default API Key

```bash
# Generate strong API key
openssl rand -hex 32

# Update docker-compose.yml
nano docker-compose.yml
# Change: API_KEY=supersecret123
# To: API_KEY=<your-generated-key>

# Restart services
docker compose down
docker compose up -d
```

### 3. Enable HTTPS (Optional but Recommended)

**Using Caddy (Easiest):**
```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Configure Caddy
sudo nano /etc/caddy/Caddyfile
```

**Caddyfile:**
```
ia-agent.yourdomain.com {
    reverse_proxy localhost:3000
}
```

```bash
# Restart Caddy
sudo systemctl restart caddy

# Now accessible via HTTPS!
# https://ia-agent.yourdomain.com
```

---

## 📊 Monitoring & Maintenance

### Check Resource Usage

```bash
# Docker stats
docker stats

# System resources
htop

# Disk usage
df -h
docker system df
```

### View Logs

```bash
# Server logs
docker logs ai-agent-server -f

# Ollama logs
docker logs ollama -f

# Redis logs
docker logs ai-redis -f

# All logs
docker compose logs -f
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart server

# Full rebuild
docker compose down
docker compose up -d --build
```

### Cleanup

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup (CAREFUL!)
docker system prune -a --volumes
```

---

## 🔄 Auto-Start on Boot

### Enable Docker Auto-Start

```bash
# Enable Docker service
sudo systemctl enable docker

# Docker Compose will auto-restart containers
# (already configured with restart: unless-stopped)
```

### Verify Auto-Start

```bash
# Reboot server
sudo reboot

# After reboot, check containers
docker compose ps

# Should show all containers running
```

---

## 🐛 Troubleshooting

### Server Not Starting

```bash
# Check logs
docker logs ai-agent-server

# Check if port is in use
sudo lsof -i :3000

# Check Docker status
sudo systemctl status docker
```

### Ollama Model Not Loading

```bash
# Check Ollama logs
docker logs ollama

# List models
docker exec ollama ollama list

# Re-pull model
docker exec ollama ollama pull deepseek-coder:1.3b
```

### Out of Memory

```bash
# Check memory usage
free -h

# Check Docker memory limits
docker stats

# Reduce memory limits in docker-compose.yml if needed
```

### Cannot Connect from Client

```bash
# Check server is listening
sudo netstat -tlnp | grep 3000

# Check firewall
sudo ufw status

# Test locally first
curl http://localhost:3000/

# Then test from client
curl http://server-ip:3000/
```

---

## 📈 Performance Tuning

### For 8GB RAM (Current)

Already optimized! See `OPTIMIZATION_SUMMARY.md`

### After RAM Upgrade to 16GB

Update these files:

**docker-compose.yml:**
```yaml
ollama:
  deploy:
    resources:
      limits:
        memory: 8G  # Increase from 3G
```

**server/src/agent/llm.ts:**
```typescript
model: 'deepseek-coder:6.7b'  // Upgrade model
num_ctx: 4096                  // Larger context
```

**server/src/agent/agent.ts:**
```typescript
MAX_CONTEXT_LENGTH: 4096  // Match num_ctx
```

Then rebuild:
```bash
docker compose down
docker exec ollama ollama pull deepseek-coder:6.7b
docker compose up -d --build
```

---

## ✅ Deployment Checklist

- [ ] Docker & Docker Compose installed
- [ ] Repository cloned to server
- [ ] API key changed from default
- [ ] Ollama model pulled (deepseek-coder:1.3b)
- [ ] All services started (`docker compose ps`)
- [ ] Health check passes (`curl http://localhost:3000/`)
- [ ] Agent endpoint tested with API key
- [ ] Firewall configured (if needed)
- [ ] Auto-start on boot enabled
- [ ] Client can connect from network
- [ ] Logs are clean (no errors)

---

## 🎉 You're Ready!

Server is now running and ready to accept connections from VSCode client!

**Server URL for client:** `http://server-ip:3000`  
**API Key:** (the one you set in docker-compose.yml)

**Next Steps:**
1. Note down server IP and API key
2. Test connection from client machine
3. Configure VSCode extension (when ready)
4. Start coding with AI! 🚀
