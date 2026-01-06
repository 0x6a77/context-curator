#!/bin/bash
set -e

echo "🚀 Setting up Claude Code Context Curator..."
echo ""

# Verify we're in the right location (should be ~/.claude/skills/context-curator)
EXPECTED_DIR="$HOME/.claude/skills/context-curator"
CURRENT_DIR=$(pwd)

if [ "$CURRENT_DIR" != "$EXPECTED_DIR" ]; then
  echo "⚠️  Warning: This skill should be installed at:"
  echo "   $EXPECTED_DIR"
  echo ""
  echo "   Current location: $CURRENT_DIR"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Verify required files exist
echo "🔍 Verifying skill files..."
if [ ! -f "skill.json" ]; then
  echo "❌ Missing skill.json"
  exit 1
fi
if [ ! -f "CLAUDE.md" ]; then
  echo "❌ Missing CLAUDE.md"
  exit 1
fi
echo "✓ Skill files verified"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Create the context-curator session (global)
SESSION_DIR=~/.claude/sessions/context-curator
echo "📁 Creating session at $SESSION_DIR..."
mkdir -p "$SESSION_DIR"

# Create initial conversation
echo "💬 Creating initial conversation..."
cat > "$SESSION_DIR/conversation.jsonl" << 'JSONL'
{"role":"system","content":"You have access to the context-curator skill. This skill helps manage Claude Code sessions for the current project."}
{"role":"user","content":"Initialize"}
{"role":"assistant","content":"Context Curator ready. I can help manage your Claude Code sessions. Type 'help' to see available commands."}
JSONL

# Create metadata
echo "📋 Creating metadata..."
cat > "$SESSION_DIR/metadata.json" << METADATA
{
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "projectPath": "$HOME/.claude/skills/context-curator"
}
METADATA

echo "✓ Session created: context-curator"
echo ""

# Verify installation
echo "🧪 Verifying installation..."
if [ -f "$SESSION_DIR/conversation.jsonl" ]; then
  echo "✓ Session created"
else
  echo "❌ Session not created"
  exit 1
fi

if [ -f "skill.json" ]; then
  echo "✓ Skill manifest exists"
else
  echo "❌ Skill manifest not found"
  exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Usage:"
echo "  cd ~/any-project"
echo "  claude -r context-curator"
echo ""
echo "Commands:"
echo "  show sessions              - List all sessions"
echo "  summarize <session-id>     - Analyze a session"
echo "  manage <session-id> <model> - Edit session interactively"
echo "  checkpoint <id> <name>     - Backup a session"
echo "  delete <session-id>        - Remove a session"
echo "  dump <session-id>          - View raw JSONL"
echo "  help                       - Show detailed help"
echo ""
