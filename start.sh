#!/bin/bash

# AI Agent Server - Quick Start Script
# For ThinkPad M710Q deployment

set -e

echo "🚀 AI Agent Server - Quick Start"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo "Please install Docker first:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is installed
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed!${NC}"
    echo "Please install Docker Compose plugin"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    
    # Generate random API key
    NEW_API_KEY=$(openssl rand -hex 32)
    
    # Update .env with new API key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/API_KEY=supersecret123/API_KEY=$NEW_API_KEY/" .env
    else
        # Linux
        sed -i "s/API_KEY=supersecret123/API_KEY=$NEW_API_KEY/" .env
    fi
    
    echo -e "${GREEN}✅ Generated new API key: $NEW_API_KEY${NC}"
    echo -e "${YELLOW}⚠️  Save this API key! You'll need it for the client.${NC}"
    echo ""
fi

# Load .env
source .env

echo "📦 Building and starting services..."
echo ""

# Stop existing containers
docker compose down 2>/dev/null || true

# Build and start services
docker compose up -d --build

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Check if Ollama is running
if docker ps | grep -q ollama; then
    echo -e "${GREEN}✅ Ollama is running${NC}"
    
    # Check if model exists
    if docker exec ollama ollama list | grep -q "qwen2.5-coder:3b"; then
        echo -e "${GREEN}✅ Model already downloaded${NC}"
    else
        echo -e "${YELLOW}📥 Downloading model (this may take a few minutes)...${NC}"
        docker exec ollama ollama pull qwen2.5-coder:3b
        echo -e "${GREEN}✅ Model downloaded${NC}"
    fi
else
    echo -e "${RED}❌ Ollama failed to start${NC}"
    echo "Check logs with: docker logs ollama"
    exit 1
fi

# Check if server is running
if docker ps | grep -q ai-agent-server; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server failed to start${NC}"
    echo "Check logs with: docker logs ai-agent-server"
    exit 1
fi

# Check if Redis is running
if docker ps | grep -q ai-redis; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Redis failed to start${NC}"
    echo "Check logs with: docker logs ai-redis"
    exit 1
fi

echo ""
echo "🎉 All services are running!"
echo ""
echo "=================================="
echo "📊 Server Information"
echo "=================================="
echo "Server URL: http://localhost:3000"
echo "API Key: $API_KEY"
echo ""

# Get local IP
if command -v ip &> /dev/null; then
    LOCAL_IP=$(ip route get 1 | awk '{print $7;exit}')
    echo "Local Network URL: http://$LOCAL_IP:3000"
elif command -v ifconfig &> /dev/null; then
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n1)
    echo "Local Network URL: http://$LOCAL_IP:3000"
fi

echo ""
echo "=================================="
echo "🔧 Useful Commands"
echo "=================================="
echo "View logs:        docker compose logs -f"
echo "Stop services:    docker compose down"
echo "Restart services: docker compose restart"
echo "Check status:     docker compose ps"
echo "Monitor resources: docker stats"
echo ""
echo "=================================="
echo "🧪 Test Server"
echo "=================================="
echo "Health check:"
echo "  curl http://localhost:3000/"
echo ""
echo "Test agent (replace API_KEY):"
echo "  curl -X POST http://localhost:3000/agent/chat \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'x-api-key: $API_KEY' \\"
echo "    -d '{\"prompt\": \"Hello!\", \"sessionId\": \"test\"}'"
echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
