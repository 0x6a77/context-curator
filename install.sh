#!/bin/bash

set -e

echo "╔════════════════════════════════════════╗"
echo "║  Context Curator Installer            ║"
echo "╚════════════════════════════════════════╝"
echo

INSTALL_DIR="$HOME/.claude/context-curator"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 1. Create directory structure
echo "📦 Creating installation directories..."
mkdir -p "$INSTALL_DIR/scripts"
mkdir -p "$INSTALL_DIR/src"
mkdir -p "$HOME/.claude/commands/task"

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
echo "✅ Context Curator installed to: $INSTALL_DIR"
echo "✅ Commands installed to: ~/.claude/commands/task/"
echo
echo "Installation summary:"
echo "  • Scripts: ~/.claude/context-curator/scripts/"
echo "  • Source: ~/.claude/context-curator/src/"
echo "  • Dependencies: ~/.claude/context-curator/node_modules/"
echo "  • Commands: ~/.claude/commands/task/"
echo
echo "╔════════════════════════════════════════╗"
echo "║  IMPORTANT: Session Management         ║"
echo "╚════════════════════════════════════════╝"
echo
echo "When setting up tasks and managing contexts, always use a"
echo "dedicated context-curator session:"
echo
echo "  claude -r context-curator"
echo
echo "This keeps your context-curator management work separate"
echo "from your actual project work and prevents polluting your"
echo "real sessions with task setup activities."
echo
echo "Quick Start:"
echo "1. cd to your project directory"
echo "2. Start the curator session: claude -r context-curator"
echo "3. Create your first task: /task-create <task-id>"
echo "   (This will initialize the @-import system on first use)"
echo "4. Exit the curator session (Ctrl+D)"
echo "5. Start a real work session: claude"
echo "6. Switch to your task: /task <task-id>"
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
