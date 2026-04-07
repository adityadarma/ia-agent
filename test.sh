#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# AI Agent – curl test scripts
# Base URL : https://ai.adityadarma.dev
# ─────────────────────────────────────────────────────────────

BASE="https://ai.adityadarma.dev"
KEY="ea549cb9630542bf93bd1a80f7e9bd24aee49cfdb963421d1bc3257ea8a51321"
MODEL="gemma4:e4b"

# ── pilih test yang ingin dijalankan ─────────────────────────
TEST="${1:-chat}"   # default: chat

case "$TEST" in

  # ── 1. Health check (tidak perlu auth) ───────────────────
  health)
    echo "=== Health Check ==="
    curl -s "$BASE/"
    echo ""
    ;;

  # ── 2. List model yang tersedia ───────────────────────────
  models)
    echo "=== Available Models ==="
    curl -s \
      -H "Authorization: Bearer $KEY" \
      "$BASE/v1/models" | python3 -m json.tool
    ;;

  # ── 3. Chat biasa (non-streaming) ────────────────────────
  chat)
    echo "=== Chat (non-streaming) ==="
    curl -s -X POST "$BASE/v1/chat/completions" \
      -H "Authorization: Bearer $KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"model\": \"$MODEL\",
        \"messages\": [
          {\"role\": \"system\", \"content\": \"You are a helpful coding assistant.\"},
          {\"role\": \"user\",   \"content\": \"${2:-Tulis fungsi Python untuk membalik string}\"}
        ],
        \"max_tokens\": 512
      }" | python3 -m json.tool
    ;;

  # ── 4. Chat streaming (Server-Sent Events) ────────────────
  stream)
    echo "=== Chat Streaming ==="
    curl -s -N -X POST "$BASE/v1/chat/completions" \
      -H "Authorization: Bearer $KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"model\": \"$MODEL\",
        \"stream\": true,
        \"messages\": [
          {\"role\": \"system\", \"content\": \"You are a helpful coding assistant.\"},
          {\"role\": \"user\",   \"content\": \"${2:-Jelaskan async/await di JavaScript}\"}
        ],
        \"max_tokens\": 512
      }" | while IFS= read -r line; do
        # Ambil teks dari setiap chunk SSE
        if [[ "$line" == data:* ]] && [[ "$line" != "data: [DONE]" ]]; then
          content=$(echo "${line#data: }" | python3 -c "
import sys,json
try:
  d=json.load(sys.stdin)
  c=d['choices'][0]['delta'].get('content','')
  if c: print(c,end='',flush=True)
except: pass
")
          printf "%s" "$content"
        fi
      done
    echo ""  # newline setelah stream selesai
    ;;

  # ── 5. Multi-turn conversation ────────────────────────────
  multi)
    echo "=== Multi-turn Conversation ==="
    curl -s -X POST "$BASE/v1/chat/completions" \
      -H "Authorization: Bearer $KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"model\": \"$MODEL\",
        \"messages\": [
          {\"role\": \"system\",    \"content\": \"You are a helpful coding assistant.\"},
          {\"role\": \"user\",      \"content\": \"Apa itu REST API?\"},
          {\"role\": \"assistant\", \"content\": \"REST API adalah antarmuka yang menggunakan HTTP untuk komunikasi antar sistem.\"},
          {\"role\": \"user\",      \"content\": \"Berikan contoh endpoint sederhana di Express.js\"}
        ],
        \"max_tokens\": 512
      }" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d['choices'][0]['message']['content'])
print()
print(f\"[tokens: prompt={d['usage']['prompt_tokens']}, completion={d['usage']['completion_tokens']}]\")
"
    ;;

  # ── 6. Test auth gagal ────────────────────────────────────
  authfail)
    echo "=== Auth Failure Test ==="
    echo "-- No key:"
    curl -s -o /dev/null -w "HTTP %{http_code}\n" "$BASE/v1/models"
    echo "-- Wrong key:"
    curl -s -o /dev/null -w "HTTP %{http_code}\n" \
      -H "Authorization: Bearer wrongkey" "$BASE/v1/models"
    ;;

  # ── Help ──────────────────────────────────────────────────
  *)
    echo "Usage: $0 <test> [prompt]"
    echo ""
    echo "  health    - health check"
    echo "  models    - list available models"
    echo "  chat      - non-streaming chat  (default)"
    echo "  stream    - streaming chat (SSE)"
    echo "  multi     - multi-turn conversation"
    echo "  authfail  - test auth rejection"
    echo ""
    echo "Examples:"
    echo "  $0 chat"
    echo "  $0 chat \"Tulis Docker Compose untuk Node.js + PostgreSQL\""
    echo "  $0 stream \"Jelaskan perbedaan TCP dan UDP\""
    ;;
esac
