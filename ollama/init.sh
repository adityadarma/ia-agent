#!/bin/sh
set -e

ollama serve &

# Tunggu 3 detik saja
sleep 3

if ! ollama list | grep -q "qwen2.5-coder:3b"; then
  ollama pull qwen2.5-coder:3b
fi

wait
