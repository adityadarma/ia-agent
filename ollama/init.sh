#!/bin/sh
set -e

ollama serve &

# Tunggu 3 detik saja
sleep 3

if ! ollama list | grep -q "deepseek-coder:1.3b"; then
  ollama pull deepseek-coder:1.3b
fi

wait
