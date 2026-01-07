# Product Requirements Document: Claude Code Context Curator

**Version:** 6.0
**Last Updated:** January 7, 2026
**Status:** Ready for Implementation

---

## Executive Summary

Claude Code Context Curator is a **global skill** that helps developers manage their Claude Code sessions. The skill provides a unified `context` command interface for analyzing, optimizing, and managing session context.

---

## Command Interface

All curator operations use a consistent `context <command>` syntax:

```bash
context list                           # List all sessions
context analyze <session-id>           # Analyze a session
context manage <session-id> <model>    # Edit session interactively
context checkpoint <session-id> <name> # Backup a session
context delete <session-id>            # Remove a session
context dump <session-id> [type]       # View raw session data
context help                           # Show help
```

---

## Session Types

**Named Sessions** (globally accessible):
- Stored in: `~/.claude/sessions/<session-id>/`
- Structure: Directory containing `conversation.jsonl` + `metadata.json`
- Examples: `context-curator`, `my-workflow`, `documentation`

**Unnamed Sessions** (project-specific):
- Stored in: `~/.claude/projects/<project-path>/`
- Structure: Flat JSONL files named by UUID
- Examples: `8e14f625-bd1a-4e79-a382-2d6c0649df97.jsonl`

### Project Path Formula

Claude Code creates project directories by replacing all forward slashes with hyphens:

```
/Users/dev/my-project  →  -Users-dev-my-project
/home/user/work/app    →  -home-user-work-app
```

Formula: `projectDir = fullPath.replace(/\//g, '-')`

---

## User Workflow

### Initial Setup (One-Time)

```bash
# 1. Clone to skills directory
git clone <repo-url> ~/.claude/skills/context-curator
cd ~/.claude/skills/context-curator

# 2. Install dependencies
npm install

# 3. Run setup
./setup.sh

# 4. Test installation
cd ~/any-project
claude -r context-curator
```

### Daily Usage

```bash
# Start curator session
cd ~/my-project
claude -r context-curator

Curator: Context Curator ready
Operating on: /Users/dev/my-project

# List all sessions
You: context list

Curator:
Sessions for /Users/dev/my-project:

Named Sessions:
─────────────────
auth-workflow
├─ 487 messages, 89k tokens (45%)
├─ Updated: 2 days ago
└─ Task: User authentication implementation

Unnamed Sessions:
─────────────────
8e14f625-bd1a-4e79-a382-2d6c0649df97 [current]
├─ 312 messages, 67k tokens (34%)
├─ Updated: 5 minutes ago
└─ Task: Implement JWT token refresh logic

# Analyze a session
You: context analyze 8e14f625-bd1a-4e79-a382-2d6c0649df97

Curator: [detailed analysis]
- Messages 1-120: Auth setup (completed) - 25k tokens
- Messages 121-280: Cookie debugging (failed attempts) - 38k tokens
- Messages 281-312: JWT refresh implementation - 14k tokens

Recommendations:
⚠️ Messages 121-280 contain many failed attempts (38k tokens)

# Optimize the session
You: context manage 8e14f625-bd1a-4e79-a382-2d6c0649df97 sonnet

Editor: [Interactive editing session]

You: remove all failed cookie attempts but keep the working solution
Editor: [analyzes and stages changes]
You: @apply
Curator: ✓ Session optimized
  Before: 312 messages, 67k tokens
  After: 189 messages, 38k tokens
  Saved: 29k tokens (43%)

# Create a checkpoint before risky changes
You: context checkpoint 8e14f625-bd1a-4e79-a382-2d6c0649df97 auth-backup

Curator: ✓ Checkpoint created: auth-backup
Resume with: claude -r auth-backup
```

---

## Commands Reference

### context list

List all sessions (named + unnamed for current project).

**Usage:**
```bash
context list
```

**Output:**
- Named sessions (globally accessible)
- Unnamed sessions (current project only)
- Token usage and capacity percentage
- Last updated time
- First task preview

### context analyze <session-id>

Analyze a specific session in detail.

**Arguments:**
- `session-id`: Session to analyze (named or UUID)

**Usage:**
```bash
context analyze 8e14f625-bd1a-4e79-a382-2d6c0649df97
context analyze my-session
```

**Output:**
- Task breakdown by message ranges
- Token distribution
- Optimization recommendations
- Potential savings

### context manage <session-id> <model>

Enter interactive session editing mode.

**Arguments:**
- `session-id`: Session to edit (named or UUID)
- `model`: One of: sonnet, opus, haiku

**Usage:**
```bash
context manage 8e14f625-bd1a-4e79-a382-2d6c0649df97 sonnet
```

**Interactive Commands:**
- Natural language: Describe changes you want
- `@apply` - Apply staged changes
- `@undo` - Undo last staged change
- `@undo all` - Undo all staged changes
- `@preview` - Show before/after comparison
- `@exit` - Exit without saving

### context checkpoint <session-id> <new-name>

Create a backup/fork of a session as a named session.

**Arguments:**
- `session-id`: Source session (named or UUID)
- `new-name`: Name for the checkpoint (will be a named session)

**Usage:**
```bash
context checkpoint 8e14f625-bd1a-4e79-a382-2d6c0649df97 before-refactor
context checkpoint my-session backup-2026-01-07
```

**Result:**
- Creates a named session with the specified name
- Original session unchanged
- Can resume checkpoint with: `claude -r <new-name>`

### context delete <session-id>

Remove a session (creates backup first, requires confirmation).

**Arguments:**
- `session-id`: Session to delete (named or UUID)

**Usage:**
```bash
context delete old-session
context delete 8e14f625-bd1a-4e79-a382-2d6c0649df97
```

**Safety:**
- Creates automatic backup before deletion
- Requires user confirmation
- Shows backup name for recovery

### context dump <session-id> [type]

Display session messages sorted by timestamp.

**Arguments:**
- `session-id`: Session to dump (named or UUID)
- `type` (optional): Filter by message type (user, assistant, file-history-snapshot, summary)

**Usage:**
```bash
context dump 8e14f625-bd1a-4e79-a382-2d6c0649df97
context dump my-session user
context dump 8e14f625-bd1a-4e79-a382-2d6c0649df97 assistant
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
context help
```

---

## Implementation Architecture

### File Structure

```
~/.claude/skills/context-curator/
├── skill.json                  # Skill manifest
├── CLAUDE.md                   # Agent instructions
├── src/
│   ├── types.ts
│   ├── session-reader.ts
│   ├── session-writer.ts
│   ├── session-analyzer.ts
│   └── editor.ts
├── scripts/
│   ├── context.ts              # Main entry point (NEW)
│   ├── init.ts
│   ├── list.ts                 # Renamed from show-sessions.ts
│   ├── analyze.ts              # Renamed from summarize.ts
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
claude -r context-curator

You: context list

Curator: [Shows all sessions with stats]

You: context analyze 8e14f625-bd1a-4e79-a382-2d6c0649df97

Curator: [Shows detailed breakdown with recommendations]
```

### Example 2: Optimizing Current Session

```bash
claude -r context-curator

You: My current session is slow

Curator: Let me check. [runs context list]
  Your current session (8e14f625-...) has 67k tokens.
  
You: context analyze 8e14f625-bd1a-4e79-a382-2d6c0649df97

Curator: [Shows analysis with many failed attempts]

You: context manage 8e14f625-bd1a-4e79-a382-2d6c0649df97 sonnet

Editor: [Interactive editing mode]
```

### Example 3: Creating Checkpoint Before Risky Change

```bash
claude -r context-curator

You: context checkpoint 8e14f625-bd1a-4e79-a382-2d6c0649df97 before-refactor

Curator: ✓ Checkpoint created: before-refactor
Resume with: claude -r before-refactor
```

---

## Command Mapping (Natural Language)

The curator should interpret these natural language requests:

| User Says | Maps To |
|-----------|---------|
| "show sessions", "list sessions" | context list |
| "tell me about session X" | context analyze X |
| "analyze session X" | context analyze X |
| "clean up session X" | context manage X sonnet |
| "optimize session X" | context manage X sonnet |
| "backup session X as Y" | context checkpoint X Y |
| "remove session X" | context delete X |
| "dump session X" | context dump X |
| "show user messages for X" | context dump X user |
| "help", "show commands" | context help |

---

## Success Criteria

### Technical
- Single entry point with clean command routing
- Consistent command syntax across all operations
- Works with both named and unnamed sessions
- Project directory formula works correctly
- Zero data loss
- Fast execution

### User Experience
- Intuitive command structure
- Easy to remember (all start with "context")
- Clear error messages
- Helpful command suggestions
- Tab completion friendly

### Documentation
- Clear README with examples
- Installation guide
- Command reference
- Migration guide from old commands

---

## Migration Plan

### For Existing Users

Old commands still work via npm scripts, but new unified syntax is recommended:

```bash
# Old way (still works)
npm run show
npm run summarize <id>

# New way (recommended)
context list
context analyze <id>
```

### CLAUDE.md Updates

```markdown
## Available Commands

All commands use the `context` prefix:

### context list
List all sessions (named + unnamed for current project).

### context analyze <session-id>
Analyze a specific session in detail.

### context manage <session-id> <model>
Enter interactive session editing mode.

[etc...]
```

---

## Future Enhancements

### v0.2
- `context search <query>` - Search across all sessions
- `context merge <id1> <id2>` - Merge two sessions
- `context split <id> <range>` - Split session into parts
- `context export <id>` - Export to markdown/PDF

### v0.3
- `context stats` - Global statistics dashboard
- `context trends` - Usage trends over time
- `context recommend` - AI-powered optimization suggestions
- `context schedule` - Auto-cleanup scheduling

---

## Technical Requirements

- Claude Code installed
- Node.js 18+
- ANTHROPIC_API_KEY (for manage mode)
- TypeScript 5+
- tsx for running scripts

---

## Version History

- **v6.0** (2026-01-07): Unified `context` command interface
- **v5.0** (2026-01-06): Dual session support (named + unnamed)
- **v4.0**: Interactive editor mode
- **v3.0**: Session analysis and optimization
- **v2.0**: Basic session management
- **v1.0**: Initial prototype
