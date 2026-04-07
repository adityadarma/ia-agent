#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Client setup scripts for AI Agent (gemma4:e4b)
# Base URL : https://ai.adityadarma.dev
# ─────────────────────────────────────────────────────────────

BASE="https://ai.adityadarma.dev"
KEY="ea549cb9630542bf93bd1a80f7e9bd24aee49cfdb963421d1bc3257ea8a51321"
MODEL="gemma4:e4b"

case "${1:-help}" in

  # ── OpenCode ─────────────────────────────────────────────
  opencode)
    echo "=== Setup OpenCode ==="
    export OPENAI_BASE_URL="$BASE/v1"
    export OPENAI_API_KEY="$KEY"
    echo "Environment set. Running opencode..."
    echo ""
    echo "  OPENAI_BASE_URL=$OPENAI_BASE_URL"
    echo "  OPENAI_API_KEY=$OPENAI_API_KEY"
    echo ""
    # opencode   # uncomment to auto-launch
    ;;

  # ── Claude Code ──────────────────────────────────────────
  claude)
    echo "=== Setup Claude Code (OpenAI-compat mode) ==="
    export OPENAI_BASE_URL="$BASE/v1"
    export OPENAI_API_KEY="$KEY"
    echo "Environment set. Running claude..."
    echo ""
    echo "  OPENAI_BASE_URL=$OPENAI_BASE_URL"
    echo "  OPENAI_API_KEY=$OPENAI_API_KEY"
    echo ""
    # Untuk Claude Code versi lama yang hanya support ANTHROPIC_BASE_URL:
    # export ANTHROPIC_BASE_URL="$BASE"
    # export ANTHROPIC_API_KEY="$KEY"
    # claude
    ;;

  # ── Continue (VS Code Extension) ─────────────────────────
  continue)
    echo "=== Setup Continue Extension ==="
    DEST="$HOME/.continue/config.json"
    SRC="$(dirname "$0")/continue.json"
    if [[ ! -f "$SRC" ]]; then
      echo "ERROR: $SRC not found. Run script from clients/ directory."
      exit 1
    fi
    mkdir -p "$(dirname "$DEST")"
    cp "$SRC" "$DEST"
    echo "Config copied to $DEST"
    echo "Reload VS Code to apply changes."
    ;;

  # ── Print env vars (for manual export) ───────────────────
  env)
    echo "# Copy-paste these into your shell or .bashrc / .zshrc:"
    echo ""
    echo "export OPENAI_BASE_URL=\"$BASE/v1\""
    echo "export OPENAI_API_KEY=\"$KEY\""
    echo ""
    echo "# For Claude Code (older versions):"
    echo "# export ANTHROPIC_BASE_URL=\"$BASE\""
    echo "# export ANTHROPIC_API_KEY=\"$KEY\""
    ;;

  help|*)
    echo "Usage: $0 <command>"
    echo ""
    echo "  opencode   - set env vars for OpenCode"
    echo "  claude     - set env vars for Claude Code"
    echo "  continue   - install config for Continue VS Code extension"
    echo "  env        - print env vars to copy manually"
    echo ""
    echo "Model  : $MODEL"
    echo "Base   : $BASE/v1"
    ;;
esac
