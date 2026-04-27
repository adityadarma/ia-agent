#!/bin/sh
set -e

ollama serve &

# Tunggu sampai Ollama siap
sleep 3

# Gunakan OLLAMA_MODEL dari env, fallback ke qwen2.5-coder:3b
MODEL="${OLLAMA_MODEL:-qwen2.5-coder:3b}"

echo "[init] Using model: $MODEL"
if ! ollama list | grep -q "$MODEL"; then
  echo "[init] Model '$MODEL' not found, pulling..."
  ollama pull "$MODEL"
else
  echo "[init] Model '$MODEL' already available."
fi

wait
