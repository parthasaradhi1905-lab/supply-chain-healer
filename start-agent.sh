#!/bin/bash
# ================================================
# Supply Chain Healer - AI Coding Agent (Fallback)
# Uses: Ollama + qwen2.5-coder:14b via Open Interpreter
# ================================================

echo "🤖 Starting AI Coding Agent..."
echo "📦 Model: qwen2.5-coder:14b (Ollama)"
echo "📁 Project: supply-chain-healer"
echo ""

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama is not running. Starting it..."
    ollama serve &
    sleep 3
fi

# Use full path to interpreter
INTERPRETER="$HOME/Library/Python/3.9/bin/interpreter"

if [ ! -f "$INTERPRETER" ]; then
    echo "❌ Interpreter not found. Trying python3 -m interpreter..."
    python3 -m interpreter --model ollama/qwen2.5-coder:14b --context_window 32000 --max_tokens 4096
else
    "$INTERPRETER" \
        --model ollama/qwen2.5-coder:14b \
        --context_window 32000 \
        --max_tokens 4096
fi
