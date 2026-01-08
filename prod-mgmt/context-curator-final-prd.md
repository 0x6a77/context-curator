# Product Requirements Document: Claude Code Context Curator

**Version:** 6.1
**Last Updated:** January 7, 2026
**Status:** Ready for Implementation

---

## Executive Summary

Claude Code Context Curator is a tool that helps developers manage their Claude Code sessions. It provides a unified `context` command interface for analyzing, optimizing, and managing session context for the current project.

---

## Command Interface

All curator operations use a consistent `context <command>` syntax:

```bash
context list                           # List all sessions for current project
context analyze <session-id>           # Analyze a session
context manage <session-id> <model>    # Edit session interactively
context checkpoint <session-id> <name> # Backup a session
context delete <session-id>            # Remove a session
context dump <session-id> [type]       # View raw session data
context help                           # Show help
```

---

## Session Management

### Session Storage

Claude Code stores sessions as JSONL files in project-specific directories:

**Storage Location:**
- `~/.claude/projects/<project-path>/`

**File Format:**
- `<uuid>.jsonl` - Flat JSONL files

**Examples:**
- `~/.claude/projects/-Users-dev-my-project/8e14f625-bd1a-4e79-a382-2d6c0649df97.jsonl`
- `~/.claude/projects/-home-user-work-app/340f0a71-99d6-40be-83f3-825d87ff1811.jsonl`

### Project Path Formula

Claude Code creates project directories by replacing all forward slashes with hyphens:

```
/Users/dev/my-project  →  -Users-dev-my-project
/home/user/work/app    →  -home-user-work-app
```

Formula: `projectDir = fullPath.replace(/\//g, '-')`

### Directory Scoping

The curator automatically scopes itself based on `process.cwd()`:
- Shows ONLY sessions for the current project directory
- Each project's sessions are completely isolated

---

## User Workflow

### Initial Setup (One-Time)

```bash
# 1. Clone to skills directory
git clone <repo-url> ~/.claude/skills/context-curator
cd ~/.claude/skills/context-curator

# 2. Install dependencies
npm install

# 3. Test installation
cd ~/any-project
npm --prefix ~/.claude/skills/context-curator run init
```

### Daily Usage

```bash
# Working on a project
cd ~/my-project
claude
You: implement authentication
Claude: [working... session getting large]

# Exit and check session health
^D

# Run curator from project directory
cd ~/my-project
npm --prefix ~/.claude/skills/context-curator run context list

Curator:
Sessions for /Users/dev/my-project:

8e14f625-bd1a-4e79-a382-2d6c0649df97 [current]
├─ 312 messages, 67k tokens (34%)
├─ Updated: 5 minutes ago
└─ Task: Implement JWT token refresh logic

340f0a71-99d6-40be-83f3-825d87ff1811
├─ 203 messages, 34k tokens (17%)
├─ Updated: 1 day ago
└─ Task: Payment webhook debugging

# Analyze a session
You: npm run context analyze 8e14f625-bd1a-4e79-a382-2d6c0649df97

Curator: [detailed analysis]
- Messages 1-120: Auth setup (completed) - 25k tokens
- Messages 121-280: Cookie debugging (failed attempts) - 38k tokens
- Messages 281-312: JWT refresh implementation - 14k tokens

Recommendations:
⚠️ Messages 121-280 contain many failed attempts (38k tokens)

# Optimize the session
You: npm run context manage 8e14f625-bd1a-4e79-a382-2d6c0649df97 sonnet

Editor: [Interactive editing session]

You: remove all failed cookie attempts but keep the working solution
Editor: [analyzes and stages changes]
You: @apply
Curator: ✓ Session optimized
  Before: 312 messages, 67k tokens
  After: 189 messages, 38k tokens
  Saved: 29k tokens (43%)

# Create a checkpoint before risky changes
You: npm run context checkpoint 8e14f625-bd1a-4e79-a382-2d6c0649df97 auth-backup-2026-01-07

Curator: ✓ Checkpoint created: auth-backup-2026-01-07
```

---

## Commands Reference

### context list

List all sessions for the current project.

**Usage:**
```bash
npm --prefix ~/.claude/skills/context-curator run context list
```

**Output:**
- All sessions for the current project directory
- Token usage and capacity percentage
- Last updated time
- First task preview

### context analyze <session-id>

Analyze a specific session in detail.

**Arguments:**
- `session-id`: Session UUID to analyze

**Usage:**
```bash
npm --prefix ~/.claude/skills/context-curator run context analyze 8e14f625-bd1a-4e79-a382-2d6c0649df97
```

**Output:**
- Task breakdown by message ranges
- Token distribution
- Optimization recommendations
- Potential savings

### context manage <session-id> <model>

Enter interactive session editing mode.

**Arguments:**
- `session-id`: Session UUID to edit
- `model`: One of: sonnet, opus, haiku

**Usage:**
```bash
npm --prefix ~/.claude/skills/context-curator run context manage 8e14f625-bd1a-4e79-a382-2d6c0649df97 sonnet
```

**Interactive Commands:**
- Natural language: Describe changes you want
- `@apply` - Apply staged changes
- `@undo` - Undo last staged change
- `@undo all` - Undo all staged changes
- `@preview` - Show before/after comparison
- `@exit` - Exit without saving

### context checkpoint <session-id> <new-name>

Create a backup/fork of a session.

**Arguments:**
- `session-id`: Source session UUID
- `new-name`: Name for the checkpoint file (will be stored with this name)

**Usage:**
```bash
npm --prefix ~/.claude/skills/context-curator run context checkpoint 8e14f625-bd1a-4e79-a382-2d6c0649df97 before-refactor
```

**Result:**
- Creates a backup file in the same project directory
- Original session unchanged

### context delete <session-id>

Remove a session (creates backup first, requires confirmation).

**Arguments:**
- `session-id`: Session UUID to delete

**Usage:**
```bash
npm --prefix ~/.claude/skills/context-curator run context delete 8e14f625-bd1a-4e79-a382-2d6c0649df97
```

**Safety:**
- Creates automatic backup before deletion
- Requires user confirmation
- Shows backup name for recovery

### context dump <session-id> [type]

Display session messages sorted by timestamp.

**Arguments:**
- `session-id`: Session UUID to dump
- `type` (optional): Filter by message type (user, assistant, file-history-snapshot, summary)

**Usage:**
```bash
npm --prefix ~/.claude/skills/context-curator run context dump 8e14f625-bd1a-4e79-a382-2d6c0649df97
npm --prefix ~/.claude/skills/context-curator run context dump 8e14f625-bd1a-4e79-a382-2d6c0649df97 user
```

**Output Format:**
```
--- MESSAGE <type> <timestamp>
<message content>
```

### context help

Show detailed help and command reference.

**Usage:**
```bash
npm --prefix ~/.claude/skills/context-curator run context help
```

---

## Implementation Architecture

### File Structure

```
~/.claude/skills/context-curator/
├── skill.json                  # Skill manifest
├── src/
│   ├── types.ts
│   ├── session-reader.ts       # Reads project sessions
│   ├── session-writer.ts
│   ├── session-analyzer.ts
│   └── editor.ts
├── scripts/
│   ├── context.ts              # Main entry point
│   ├── init.ts
│   ├── list.ts
│   ├── analyze.ts
│   ├── manage.ts
│   ├── checkpoint.ts
│   ├── delete.ts
│   ├── dump.ts
│   └── help.ts
├── setup.sh
├── package.json
└── README.md
```

### Main Entry Point

**scripts/context.ts:**
```typescript
#!/usr/bin/env tsx

// Main dispatcher for context commands
const command = process.argv[2];
const args = process.argv.slice(3);

const commands = {
  'list': './scripts/list.ts',
  'analyze': './scripts/analyze.ts',
  'manage': './scripts/manage.ts',
  'checkpoint': './scripts/checkpoint.ts',
  'delete': './scripts/delete.ts',
  'dump': './scripts/dump.ts',
  'help': './scripts/help.ts'
};

if (!command || !commands[command]) {
  console.error('Usage: context <command> [args]');
  console.error('Commands: list | analyze | manage | checkpoint | delete | dump | help');
  process.exit(1);
}

// Dynamic import and execute
const scriptPath = commands[command];
import(scriptPath).catch(err => {
  console.error(`Error running ${command}:`, err.message);
  process.exit(1);
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "init": "tsx scripts/init.ts",
    "context": "tsx scripts/context.ts",
    "list": "tsx scripts/list.ts",
    "analyze": "tsx scripts/analyze.ts",
    "manage": "tsx scripts/manage.ts",
    "checkpoint": "tsx scripts/checkpoint.ts",
    "delete": "tsx scripts/delete.ts",
    "dump": "tsx scripts/dump.ts",
    "help": "tsx scripts/help.ts"
  }
}
```

---

## Usage Examples

### Example 1: Checking Context Health

```bash
cd ~/my-app
npm --prefix ~/.claude/skills/context-curator run context list

Sessions for /Users/dev/my-app:

8e14f625-bd1a-4e79-a382-2d6c0649df97 [current]
├─ 312 messages, 67k tokens (34%)
├─ Updated: 5m ago
└─ Task: Implement JWT token refresh logic

npm run context analyze 8e14f625-bd1a-4e79-a382-2d6c0649df97
[Shows detailed breakdown]
```

### Example 2: Optimizing Current Session

```bash
cd ~/my-app
npm --prefix ~/.claude/skills/context-curator run context list

# See current session is 67k tokens with many errors

npm run context manage 8e14f625-bd1a-4e79-a382-2d6c0649df97 sonnet

Editor: [Interactive editing mode]
```

### Example 3: Creating Checkpoint Before Risky Change

```bash
npm run context checkpoint 8e14f625-bd1a-4e79-a382-2d6c0649df97 before-refactor

✓ Checkpoint created: before-refactor
```

---

## Success Criteria

### Technical
- Single entry point with clean command routing
- Consistent command syntax across all operations
- Works with project-scoped sessions
- Project directory formula works correctly
- Zero data loss
- Fast execution

### User Experience
- Intuitive command structure
- Easy to remember (all start with "context")
- Clear error messages
- Helpful command suggestions
- Project isolation clear to users

### Documentation
- Clear README with examples
- Installation guide
- Command reference

---

## Technical Requirements

- Claude Code installed
- Node.js 18+
- ANTHROPIC_API_KEY (for manage mode)
- TypeScript 5+
- tsx for running scripts

---

## Version History

- **v6.1** (2026-01-07): Removed named sessions concept, project-only scoping
- **v6.0** (2026-01-07): Unified `context` command interface
- **v5.0** (2026-01-06): Dual session support (named + unnamed) - DEPRECATED
- **v4.0**: Interactive editor mode
- **v3.0**: Session analysis and optimization
- **v2.0**: Basic session management
- **v1.0**: Initial prototype
