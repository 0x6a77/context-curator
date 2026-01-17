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
mkdir -p "$INSTALL_DIR/scripts"
mkdir -p "$INSTALL_DIR/src"
mkdir -p "$HOME/.claude/commands/task"
mkdir -p "$HOME/.claude/projects"

# 2. Copy necessary files
echo "📋 Copying scripts and source files..."

# Copy scripts
cp -r "$SCRIPT_DIR"/scripts/*.ts "$INSTALL_DIR/scripts/"
echo "   ✓ Copied scripts"

# Copy source files
cp -r "$SCRIPT_DIR"/src/*.ts "$INSTALL_DIR/src/"
echo "   ✓ Copied source files"

# Copy package files
cp "$SCRIPT_DIR/package.json" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/tsconfig.json" "$INSTALL_DIR/"
echo "   ✓ Copied package.json and tsconfig.json"

# 3. Install npm dependencies
echo "📦 Installing dependencies..."
cd "$INSTALL_DIR"
npm install --silent

# 4. Install slash commands
echo "📋 Installing slash commands..."
cd "$SCRIPT_DIR"
for cmd in commands/task/*.md; do
  if [ -f "$cmd" ]; then
    cmd_name=$(basename "$cmd")
    cp "$cmd" "$HOME/.claude/commands/task/$cmd_name"
    echo "   ✓ Installed $cmd_name"
  fi
done

echo
echo "╔════════════════════════════════════════╗"
echo "║  Installation Complete!                ║"
echo "╚════════════════════════════════════════╝"
echo
echo "✅ Context Curator v13.0 installed"
echo
echo "Installation locations:"
echo "  • Scripts:  ~/.claude/context-curator/scripts/"
echo "  • Source:   ~/.claude/context-curator/src/"
echo "  • Commands: ~/.claude/commands/task/"
echo "  • Storage:  ~/.claude/projects/<project-id>/"
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
echo "╔════════════════════════════════════════╗"
echo "║  v13.0 Features                        ║"
echo "╚════════════════════════════════════════╝"
echo
echo "• Two-file CLAUDE.md system (no git conflicts)"
echo "• Personal contexts (private, default)"
echo "• Golden contexts (shared with team via git)"
echo "• Secret detection before sharing"
echo "• AI-generated context summaries"
echo
echo "Available commands:"
echo "  /task <task-id>           - Switch to task (creates if new)"
echo "  /context-save <name>      - Save current session"
echo "  /context-list [task]      - List contexts with summaries"
echo "  /context-manage           - Interactive context management"
echo "  /context-promote <name>   - Share context with team (golden)"
echo
echo "The warm-up problem is solved! 🎉"
