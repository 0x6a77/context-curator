#!/bin/bash

set -e

echo "╔════════════════════════════════════════╗"
echo "║  Context Curator v13.0 Installer       ║"
echo "╚════════════════════════════════════════╝"
echo

INSTALL_DIR="$HOME/.claude/context-curator"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 1. Create directory structure
echo "📦 Creating installation directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$HOME/.claude/commands/task"
mkdir -p "$HOME/.claude/projects"

# 2. Build TypeScript (compile once for fast execution)
echo "🔨 Building TypeScript..."
cd "$SCRIPT_DIR"

# Install dev dependencies for build
npm install --silent

# Compile TypeScript to JavaScript
npm run build --silent

echo "   ✓ Compiled to JavaScript"

# 3. Copy compiled files
echo "📋 Installing compiled files..."

# Copy the dist directory (compiled JS)
cp -r "$SCRIPT_DIR/dist" "$INSTALL_DIR/"
echo "   ✓ Installed compiled scripts"

# Copy package.json (for module resolution)
cp "$SCRIPT_DIR/package.json" "$INSTALL_DIR/"

# 4. Install slash commands
echo "📋 Installing slash commands..."
for cmd in commands/task/*.md; do
  if [ -f "$cmd" ]; then
    cmd_name=$(basename "$cmd")
    cp "$cmd" "$HOME/.claude/commands/task/$cmd_name"
    echo "   ✓ Installed $cmd_name"
  fi
done

# 5. Install specialized tasks (immutable DNA — never modified by user operations)
echo "📋 Installing specialized tasks..."
if [ -d "$SCRIPT_DIR/specialized" ]; then
  mkdir -p "$INSTALL_DIR/specialized"
  cp -r "$SCRIPT_DIR/specialized/." "$INSTALL_DIR/specialized/"
  echo "   ✓ Installed specialized tasks"
fi

echo
echo "╔════════════════════════════════════════╗"
echo "║  Installation Complete!                ║"
echo "╚════════════════════════════════════════╝"
echo
echo "✅ Context Curator v13.0 installed"
echo
echo "Installation locations:"
echo "  • Scripts:    ~/.claude/context-curator/dist/"
echo "  • Commands:   ~/.claude/commands/task/"
echo "  • Storage:    ~/.claude/projects/<project-id>/"
echo "  • Specialized: ~/.claude/context-curator/specialized/"
echo
echo "⚡ Performance: Scripts are pre-compiled for fast execution"
echo
echo "╔════════════════════════════════════════╗"
echo "║  Quick Start                           ║"
echo "╚════════════════════════════════════════╝"
echo
echo "1. Go to your project:"
echo "   cd ~/my-project"
echo
echo "2. Start Claude and create a task:"
echo "   claude"
echo "   /task oauth-refactor"
echo
echo "3. Work with Claude, then save your progress:"
echo "   /context-save my-progress"
echo
echo "4. Later, resume where you left off:"
echo "   /task oauth-refactor"
echo "   > Select: my-progress"
echo "   /resume <session-id>"
echo
echo "Available commands:"
echo "  /task <task-id>           - Switch to task (creates if new)"
echo "  /context-save <name>      - Save current session"
echo "  /context-list [task]      - List contexts with summaries"
echo "  /context-manage           - Interactive context management"
echo "  /context-promote <name>   - Share context with team (golden)"
echo
