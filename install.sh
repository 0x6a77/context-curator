#!/bin/bash

set -e

echo "╔════════════════════════════════════════╗"
echo "║  Context Curator v15.0 Installer       ║"
echo "╚════════════════════════════════════════╝"
echo

INSTALL_DIR="$HOME/.claude/context-curator"
SKILLS_DIR="$HOME/.claude/skills/context-curator"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Parse flags
PROJECT_INSTALL=false
for arg in "$@"; do
  if [ "$arg" = "--project-install" ]; then
    PROJECT_INSTALL=true
  fi
done

# 1. Create directory structure
echo "📦 Creating installation directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$HOME/.claude/projects"
# Legacy commands dir kept for backwards compatibility
mkdir -p "$HOME/.claude/commands/task"

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

# 4. Install skills (new in v15.0)
echo "📋 Installing skills..."
for bundle in authoring session monitor; do
  if [ -d "$SCRIPT_DIR/src/skills/context-curator/$bundle" ]; then
    mkdir -p "$SKILLS_DIR/$bundle"
    cp -r "$SCRIPT_DIR/src/skills/context-curator/$bundle/"* "$SKILLS_DIR/$bundle/"
    echo "   ✓ Installed $bundle bundle"
  fi
done

# 5. Install legacy slash commands (kept for backwards compatibility)
echo "📋 Installing legacy slash commands..."
for cmd in commands/task/*.md; do
  if [ -f "$cmd" ]; then
    cmd_name=$(basename "$cmd")
    cp "$cmd" "$HOME/.claude/commands/task/$cmd_name"
    echo "   ✓ Installed $cmd_name"
  fi
done

# 6. Install specialized tasks (immutable DNA — never modified by user operations)
echo "📋 Installing specialized tasks..."
if [ -d "$SCRIPT_DIR/specialized" ]; then
  mkdir -p "$INSTALL_DIR/specialized"
  cp -r "$SCRIPT_DIR/specialized/." "$INSTALL_DIR/specialized/"
  chmod -R a-w "$INSTALL_DIR/specialized/"
  echo "   ✓ Installed specialized tasks (write-protected)"
fi

# 7. Write monitor config defaults (if not already present)
MONITOR_CONFIG="$HOME/.claude/context-curator/monitor-config.json"
if [ ! -f "$MONITOR_CONFIG" ]; then
  echo "📋 Writing monitor config defaults..."
  cat > "$MONITOR_CONFIG" << 'EOF'
{
  "zones": { "degrading": 65, "critical": 80 },
  "burnRateWindow": 10,
  "models": {
    "claude-sonnet-4-6": { "input": 3.00, "output": 15.00 },
    "claude-opus-4-7":   { "input": 15.00, "output": 75.00 },
    "claude-haiku-4-5":  { "input": 0.80, "output": 4.00 },
    "default":           { "input": 3.00, "output": 15.00 }
  }
}
EOF
  echo "   ✓ Created monitor-config.json"
fi

# 8. Write skill marketplace manifest
echo "📋 Writing marketplace manifest..."
VERSION="15.0"
if [ -f "$SCRIPT_DIR/dist/version.json" ]; then
  VERSION=$(cat "$SCRIPT_DIR/dist/version.json" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
fi
cat > "$HOME/.claude/context-curator-manifest.json" << EOF
{
  "name": "context-curator",
  "version": "$VERSION",
  "description": "Task-based context management and PRD-driven development for Claude Code",
  "installedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "bundles": {
    "authoring": {
      "description": "PRD, test plan, dev plan, test inventory, and process sequencing authoring skills",
      "skills": ["authoring/prd", "authoring/test-plan", "authoring/dev-plan", "authoring/test-inventory", "authoring/prd-process", "authoring/docs-markdown", "authoring/docs-html"]
    },
    "session": {
      "description": "Full context management stack",
      "skills": ["session/task", "session/context-save", "session/context-list", "session/context-manage", "session/context-promote"]
    },
    "monitor": {
      "description": "Context usage monitoring and threshold warnings",
      "skills": ["monitor/status", "monitor/warn", "monitor/cost"]
    },
    "full": {
      "description": "Everything",
      "skills": ["authoring/*", "session/*", "monitor/*"]
    }
  }
}
EOF
echo "   ✓ Created context-curator-manifest.json"

# 9. Project-scope install (optional — copies skills into .claude/skills/ in the current project)
if [ "$PROJECT_INSTALL" = true ]; then
  PROJECT_DIR="$(pwd)"
  PROJECT_SKILLS_DIR="$PROJECT_DIR/.claude/skills/context-curator"
  echo "📋 Installing project-scope skills into $PROJECT_SKILLS_DIR..."

  if [ ! -f "$PROJECT_DIR/.claude/tasks/default/CLAUDE.md" ]; then
    echo "   ⚠️  Project not initialized. Run init-project first:"
    echo "   npx tsx $SCRIPT_DIR/scripts/init-project.ts"
    exit 1
  fi

  for bundle in authoring session monitor; do
    if [ -d "$SCRIPT_DIR/src/skills/context-curator/$bundle" ]; then
      mkdir -p "$PROJECT_SKILLS_DIR/$bundle"
      cp -r "$SCRIPT_DIR/src/skills/context-curator/$bundle/"* "$PROJECT_SKILLS_DIR/$bundle/"
      echo "   ✓ Installed $bundle bundle to project"
    fi
  done

  # Write project-scope manifest
  cat > "$PROJECT_DIR/.claude/context-curator-manifest.json" << EOF
{
  "name": "context-curator",
  "version": "$VERSION",
  "projectScope": true,
  "installedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
  echo "   ✓ Created project-scope manifest"
  echo
  echo "Project-scope skills installed. Commit .claude/skills/ to share with teammates."
fi

echo
echo "╔════════════════════════════════════════╗"
echo "║  Installation Complete!                ║"
echo "╚════════════════════════════════════════╝"
echo
echo "✅ Context Curator v15.0 installed"
echo
echo "Installation locations:"
echo "  • Scripts:    ~/.claude/context-curator/dist/"
echo "  • Skills:     ~/.claude/skills/context-curator/{authoring,session,monitor}/"
echo "  • Storage:    ~/.claude/projects/<project-id>/"
echo "  • Specialized: ~/.claude/context-curator/specialized/"
echo "  • Manifest:   ~/.claude/context-curator-manifest.json"
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
echo "Available skills:"
echo "  /task <task-id>           - Switch to task (creates if new)"
echo "  /context-save <name>      - Save current session"
echo "  /context-list [task]      - List contexts with summaries"
echo "  /context-manage           - Interactive context management"
echo "  /context-promote <name>   - Share context with team (golden)"
echo "  /status                   - Context window usage summary"
echo "  /cost                     - Detailed cost breakdown"
echo
echo "Authoring skills (auto-load with matching files):"
echo "  /prd                      - PRD format enforcement"
echo "  /test-plan                - Test plan format enforcement"
echo "  /dev-plan                 - Dev plan format enforcement"
echo "  /test-inventory           - Adversary LoD2 output format"
echo
echo "Project-scope install (commit skills to repo for team):"
echo "  bash install.sh --project-install"
echo
