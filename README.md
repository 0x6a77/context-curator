# Claude Code Context Curator

A tool for managing Claude Code sessions with a unified `context` command interface.

## What is This?

Context Curator helps you analyze, optimize, and manage your Claude Code sessions for the current project. It provides commands to view session health, clean up context, and manage session files.

## Session Storage

Claude Code stores sessions as JSONL files in project-specific directories:

**Storage Location:**
- `~/.claude/projects/<project-dir>/`

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

## Installation

### One-Time Setup

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

## Usage

All commands use the unified `context` interface:

```bash
context list                           # List all sessions for current project
context analyze <session-id>           # Analyze a session
context manage <session-id> <model>    # Edit session interactively
context checkpoint <session-id> <name> # Backup a session
context delete <session-id>            # Remove a session
context dump <session-id> [type]       # View raw session data
context help                           # Show help
```

### Daily Workflow

```bash
# Working on a project
cd ~/my-project
claude
You: implement authentication
Claude: [working... session getting large]
^D

# Check session health from project directory
cd ~/my-project
npm --prefix ~/.claude/skills/context-curator run context list

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
npm run context analyze 8e14f625-bd1a-4e79-a382-2d6c0649df97

# Optimize the session
npm run context manage 8e14f625-bd1a-4e79-a382-2d6c0649df97 sonnet

Editor: [Interactive editing session]
You: remove all failed cookie attempts but keep the working solution
Editor: [analyzes and stages changes]
You: @apply
Curator: ✓ Session optimized
  Before: 312 messages, 67k tokens
  After: 189 messages, 38k tokens
  Saved: 29k tokens (43%)

# Create a checkpoint before risky changes
npm run context checkpoint 8e14f625-bd1a-4e79-a382-2d6c0649df97 auth-backup-2026-01-07

Curator: ✓ Checkpoint created: auth-backup-2026-01-07
```

## Commands Reference

### context list

List all sessions for the current project.

```bash
npm --prefix ~/.claude/skills/context-curator run context list
```

Shows:
- All sessions for the current project directory
- Token usage and capacity percentage
- Last updated time
- First task preview

### context analyze <session-id>

Analyze a specific session in detail.

```bash
npm --prefix ~/.claude/skills/context-curator run context analyze <session-id>
```

Output:
- Task breakdown by message ranges
- Token distribution
- Optimization recommendations
- Potential savings

### context manage <session-id> <model>

Enter interactive session editing mode.

Arguments:
- `session-id`: Session UUID to edit
- `model`: One of: sonnet, opus, haiku

```bash
npm --prefix ~/.claude/skills/context-curator run context manage <session-id> <model>
```

Interactive commands:
- Natural language: Describe changes you want
- `@apply` - Apply staged changes
- `@undo` - Undo last staged change
- `@undo all` - Undo all staged changes
- `@preview` - Show before/after comparison
- `@exit` - Exit without saving

### context checkpoint <session-id> <new-name>

Create a backup/fork of a session.

```bash
npm --prefix ~/.claude/skills/context-curator run context checkpoint <session-id> <new-name>
```

Result:
- Creates a backup file in the same project directory
- Original session unchanged

### context delete <session-id>

Remove a session (creates backup first, requires confirmation).

```bash
npm --prefix ~/.claude/skills/context-curator run context delete <session-id>
```

Safety:
- Creates automatic backup before deletion
- Requires user confirmation
- Shows backup name for recovery

### context dump <session-id> [type]

Display session messages sorted by timestamp.

Arguments:
- `session-id`: Session UUID to dump
- `type` (optional): Filter by message type (user, assistant, file-history-snapshot, summary)

```bash
npm --prefix ~/.claude/skills/context-curator run context dump <session-id>
npm --prefix ~/.claude/skills/context-curator run context dump <session-id> user
```

Output format:
```
--- MESSAGE <type> <timestamp>
<message content>
```

### context help

Show detailed help and command reference.

```bash
npm --prefix ~/.claude/skills/context-curator run context help
```

## File Structure

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

## Requirements

- Claude Code installed
- Node.js 18+
- `ANTHROPIC_API_KEY` (for manage mode)
- TypeScript 5+
- tsx for running scripts

## Development

### Running Scripts Locally

```bash
# Install dependencies
npm install

# Run any script
npm run init
npm run context list
npm run context analyze <session-id>
npm run context checkpoint <id> <name>
npm run context delete <id>
npm run context dump <id>
npm run context help
```

## Troubleshooting

### Sessions not showing up
- Verify you're in the correct directory
- Check the project directory formula matches Claude Code's convention
- Run `npm --prefix ~/.claude/skills/context-curator run init` to see what's detected

### Permission errors
- Ensure `setup.sh` is executable: `chmod +x setup.sh`
- Check that `~/.claude/skills/context-curator` exists

## License

MIT

## Version History

- **v0.2.0** (2026-01-07): Unified context command interface, project-only scoping
- **v0.1.0**: Initial implementation
