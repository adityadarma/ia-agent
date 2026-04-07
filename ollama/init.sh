#!/bin/sh
set -e

ollama serve &

# Tunggu 3 detik saja
sleep 3

if ! ollama list | grep -q "gemma4:e4b"; then
  ollama pull gemma4:e4b
fi

wait
