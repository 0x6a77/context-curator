#!/bin/bash

set -e

echo "╔════════════════════════════════════════╗"
echo "║  Context Curator Installer            ║"
echo "╚════════════════════════════════════════╝"
echo

INSTALL_DIR="$HOME/.claude/context-curator"

# 1. Copy context-curator to ~/.claude/context-curator
echo "📦 Installing to $INSTALL_DIR..."

# Create directory structure
mkdir -p "$INSTALL_DIR"

# Copy everything
cp -r . "$INSTALL_DIR/"

# 2. Install npm dependencies
echo "📦 Installing dependencies..."
cd "$INSTALL_DIR"
npm install

# 3. Copy commands to ~/.claude/commands/task
echo "📋 Installing slash commands to ~/.claude/commands/task..."
mkdir -p ~/.claude/commands/task

for cmd in "$INSTALL_DIR"/commands/task/*.md; do
  if [ -f "$cmd" ]; then
    cmd_name=$(basename "$cmd")
    cp "$cmd" ~/.claude/commands/task/"$cmd_name"
    echo "   ✓ Installed $cmd_name"
  fi
done

echo
echo "╔════════════════════════════════════════╗"
echo "║  Installation Complete!                ║"
echo "╚════════════════════════════════════════╝"
echo
echo "✅ Context Curator installed to: $INSTALL_DIR"
echo "✅ Commands installed to: ~/.claude/commands/task/"
echo
echo "Next steps:"
echo "1. cd to any project directory"
echo "2. Create your first task: /task-create <task-id>"
echo "   (This will initialize the @-import system on first use)"
echo "3. Start working: /task <task-id>"
echo
echo "Available commands:"
echo "  /task <task-id> [context]  - Switch to a task"
echo "  /task-create <task-id>     - Create a new task"
echo "  /task-save <context-name>  - Save current session"
echo "  /task-list                 - List all tasks"
echo "  /task-manage <task-id>     - Manage a task"
echo "  /task-delete <task-id>     - Delete a task"
echo "  /context-list              - List contexts in current task"
echo "  /context-manage <name>     - Manage a context"
echo "  /context-delete <name>     - Delete a context"
