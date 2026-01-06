#!/bin/bash
set -e

echo "🚀 Setting up Claude Code Context Curator..."
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Create the curator session
SESSION_DIR=~/.claude/sessions/context-curator
echo "📁 Creating session directory..."
mkdir -p "$SESSION_DIR"

# Create initial conversation
echo "💬 Creating initial conversation..."
cat > "$SESSION_DIR/conversation.jsonl" << 'JSONL'
{"role":"system","content":"You are the Context Curator. Read ~/.claude/context-curator/CLAUDE.md for your instructions.","timestamp":"2026-01-04T00:00:00Z"}
{"role":"user","content":"Initialize as context curator","timestamp":"2026-01-04T00:00:01Z"}
{"role":"assistant","content":"Context Curator initialized. I help manage Claude Code sessions in the current directory.\n\nType 'help' to see available commands.","timestamp":"2026-01-04T00:00:02Z"}
JSONL

# Create metadata
echo "📋 Creating metadata..."
cat > "$SESSION_DIR/metadata.json" << METADATA
{
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "projectPath": "$HOME/.claude/context-curator"
}
METADATA

echo "✓ Session created"
echo ""

# Test it
echo "🧪 Testing session..."
if [ -f "$SESSION_DIR/conversation.jsonl" ]; then
  echo "✓ Session file exists"
else
  echo "❌ Session file not created"
  exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To use the Context Curator:"
echo "  1. cd into any project directory"
echo "  2. Run: claude -r context-curator"
echo ""
echo "Example:"
echo "  cd ~/my-project"
echo "  claude -r context-curator"
echo ""
