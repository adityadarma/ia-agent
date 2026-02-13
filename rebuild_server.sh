#!/bin/bash
echo "Rebuilding AI Agent Server..."
docker compose build --no-cache server
docker compose up -d server

echo "Waiting for services..."
sleep 5

# Check model existence
if ! docker exec ollama ollama list | grep -q "qwen2.5-coder:3b"; then
    echo "Pulling new model qwen2.5-coder:3b..."
    docker exec ollama ollama pull qwen2.5-coder:3b
else
    echo "Model qwen2.5-coder:3b already exists."
fi

echo "Server updated and Qwen 3B ready!"
docker logs --tail 20 ai-agent-server
