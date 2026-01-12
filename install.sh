#!/bin/bash

set -e

echo "╔════════════════════════════════════════╗"
echo "║  Context Curator Installer            ║"
echo "╚════════════════════════════════════════╝"
echo

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Must run from context-curator directory"
  exit 1
fi

# 1. Install npm dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Copy commands to ~/.claude/commands/task
echo "📋 Copying slash commands to ~/.claude/commands/task..."
mkdir -p ~/.claude/commands/task

for cmd in commands/task/*.md; do
  if [ -f "$cmd" ]; then
    cmd_name=$(basename "$cmd")
    cp "$cmd" ~/.claude/commands/task/"$cmd_name"
    echo "   ✓ Copied $cmd_name"
  fi
done

echo
echo "╔════════════════════════════════════════╗"
echo "║  Installation Complete!                ║"
echo "╚════════════════════════════════════════╝"
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
