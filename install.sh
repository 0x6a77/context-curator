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

# Check if we're inside .context-curator (meaning we're in a project)
if [[ "$PWD" == *"/.context-curator" ]]; then
  echo "Installing in project mode..."
  IN_PROJECT=true
else
  echo "Installing as standalone repository..."
  IN_PROJECT=false
fi

# 1. Install npm dependencies
echo "📦 Installing dependencies..."
npm install

# 2. If in a project, set up commands and initialize
if [ "$IN_PROJECT" = true ]; then
  # Go to project root (parent directory)
  cd ..

  # 3. Link commands to ~/.claude/commands (global)
  echo "🔗 Linking slash commands to ~/.claude/commands..."
  mkdir -p ~/.claude/commands

  for cmd in .context-curator/commands/task/*.md; do
    if [ -f "$cmd" ]; then
      cmd_name=$(basename "$cmd")
      # Remove existing symlink if it exists
      rm -f ~/.claude/commands/"$cmd_name"
      # Create new symlink (use absolute path)
      ln -s "$PWD/.context-curator/commands/task/$cmd_name" ~/.claude/commands/"$cmd_name"
      echo "   ✓ Linked $cmd_name"
    fi
  done

  # 4. Initialize project structure
  echo
  echo "🚀 Initializing project structure..."
  npx tsx .context-curator/scripts/init-project.ts

else
  echo "✓ Dependencies installed"
  echo
  echo "To use in a project:"
  echo "1. Clone or copy this directory to <your-project>/.context-curator"
  echo "2. cd <your-project>/.context-curator"
  echo "3. Run ./install.sh again"
fi

echo
echo "╔════════════════════════════════════════╗"
echo "║  Installation Complete!                ║"
echo "╚════════════════════════════════════════╝"
echo

if [ "$IN_PROJECT" = true ]; then
  echo "Next steps:"
  echo "1. Edit .claude/CLAUDE.md to add universal guidelines"
  echo "2. Create your first task: /task-create <task-id>"
  echo "3. Start working: /task <task-id>"
  echo
  echo "Available commands:"
  echo "  /task <task-id> [context]  - Switch to a task"
  echo "  /task-create <task-id>     - Create a new task"
  echo "  /task-save <context-name>  - Save current session"
  echo "  /task-list                 - List all tasks"
  echo "  /context-list              - List contexts in current task"
fi
