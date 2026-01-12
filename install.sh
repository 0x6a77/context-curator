#!/bin/bash

set -e

echo "╔════════════════════════════════════════╗"
echo "║  Context Curator Installer            ║"
echo "╚════════════════════════════════════════╝"
echo

# Detect where we are and where context-curator is
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CURATOR_NAME=$(basename "$SCRIPT_DIR")

# Check if we're in a git repo (project root)
if git rev-parse --git-dir > /dev/null 2>&1; then
  PROJECT_ROOT=$(git rev-parse --show-toplevel)
  echo "📁 Detected project root: $PROJECT_ROOT"
  
  # If we're inside the project, we're in per-project mode
  if [[ "$SCRIPT_DIR" == "$PROJECT_ROOT"* ]]; then
    IN_PROJECT=true
    INSTALL_MODE="per-project"
  else
    IN_PROJECT=false
    INSTALL_MODE="standalone"
  fi
else
  IN_PROJECT=false
  INSTALL_MODE="standalone"
fi

# 1. Install npm dependencies
echo "📦 Installing dependencies..."
cd "$SCRIPT_DIR"
npm install

# 2. Handle different installation modes
if [ "$IN_PROJECT" = true ]; then
  echo "🔧 Installing in per-project mode..."
  
  # Ensure we're accessible as .context-curator from project root
  EXPECTED_PATH="$PROJECT_ROOT/.context-curator"
  
  if [ "$SCRIPT_DIR" != "$EXPECTED_PATH" ]; then
    echo "⚠️  Note: Scripts expect to be at .context-curator/"
    echo "   Current location: $SCRIPT_DIR"
    echo "   Expected location: $EXPECTED_PATH"
    echo
    echo "To fix this, run from project root:"
    echo "  mv $SCRIPT_DIR $EXPECTED_PATH"
    echo "  cd $EXPECTED_PATH"
    echo "  ./install.sh"
    exit 1
  fi
  
else
  echo "🔧 Installing in standalone mode..."
  echo "   (To use in a project, symlink to .context-curator)"
fi

# 3. Copy commands to ~/.claude/commands/task
echo "📋 Copying slash commands to ~/.claude/commands/task..."
mkdir -p ~/.claude/commands/task

for cmd in "$SCRIPT_DIR"/commands/task/*.md; do
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

if [ "$IN_PROJECT" = true ]; then
  echo "✅ Per-project installation successful!"
  echo
  echo "Commands installed to: ~/.claude/commands/task/"
  echo "Scripts accessible at: .context-curator/scripts/"
  echo
  echo "Next steps:"
  echo "1. Create your first task: /task-create <task-id>"
  echo "   (This will initialize the @-import system on first use)"
  echo "2. Start working: /task <task-id>"
else
  echo "✅ Standalone installation successful!"
  echo
  echo "Commands installed to: ~/.claude/commands/task/"
  echo
  echo "To use in a project:"
  echo "1. cd ~/your-project"
  echo "2. ln -s $SCRIPT_DIR .context-curator"
  echo "3. Start using: /task-create <task-id>"
fi

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
