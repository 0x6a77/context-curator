# Claude Code Context Curator

A **global skill** for Claude Code that helps you manage, analyze, and optimize your Claude Code sessions across all your projects.

## What is This?

Context Curator is a Claude Code skill that manages both **named sessions** (globally accessible) and **unnamed sessions** (project-specific). It automatically scopes itself to show you the right sessions based on your current directory.

## Session Types

### Named Sessions
- Stored in `~/.claude/sessions/<session-id>/`
- Globally accessible by name
- Resume with: `claude -r <name>`
- Examples: `context-curator`, `my-workflow`

### Unnamed Sessions
- Stored in `~/.claude/projects/<project-dir>/<uuid>.jsonl`
- Project-specific (automatically scoped by directory)
- Created automatically by Claude Code
- Examples: `8e14f625-bd1a-4e79-a382-2d6c0649df97`

### Project Directory Formula

```typescript
projectDir = fullPath.replace(/\//g, '-')
// /Users/dev/my-project → -Users-dev-my-project
// /home/user/work/app → -home-user-work-app
```

## Features

- 📊 **List Sessions**: View both named and unnamed sessions with token usage stats
- 🔍 **Analyze Sessions**: Get detailed breakdowns of conversation history
- 💾 **Checkpoint Sessions**: Create backups/forks (unnamed → named)
- 🗑️ **Delete Sessions**: Safely remove sessions (with automatic backup)
- 📄 **Dump Sessions**: View raw JSONL data

## Installation

### One-Time Setup

```bash
# 1. Clone to global skills directory
git clone <repo-url> ~/.claude/skills/context-curator
cd ~/.claude/skills/context-curator

# 2. Install dependencies
npm install

# 3. Run setup
./setup.sh
```

This will:
- Install dependencies (TypeScript, tsx, Anthropic SDK)
- Create the `context-curator` session
- Verify installation

### Verify Installation

```bash
cd ~/any-project
claude -r context-curator
```

You should see the Context Curator initialization screen showing session counts.

## Usage

### From Any Project Directory

```bash
cd ~/my-project
claude -r context-curator
```

The curator will show:
- **All named sessions** (globally accessible)
- **Unnamed sessions for `~/my-project`** only

### Available Commands

Once in the curator session, you can use natural language or these commands:

#### Show Sessions
```
show sessions
```
Lists all sessions (named + unnamed) with details like message count, token usage, and recency.

#### Summarize a Session
```
summarize <session-id>
```
Analyzes a specific session, shows task breakdown and optimization recommendations.

#### Checkpoint a Session
```
checkpoint <session-id> <new-name>
```
Creates a backup/fork as a named session. Useful for converting unnamed → named.

#### Delete a Session
```
delete <session-id>
```
Removes a session (creates automatic backup, requires confirmation).

#### Dump Raw Data
```
dump <session-id>
```
Shows the raw JSONL contents of a session.

#### Help
```
help
```
Shows detailed help with command examples.

## Example Workflow

```bash
# Working on a project
cd ~/my-app
claude
You: implement authentication
Claude: [working... session getting large]
^D

# Check session health
claude -r context-curator

Curator: Context Curator initialized
Operating on: /Users/dev/my-app

Found 1 named session(s)
Found 2 unnamed session(s) for this project

You: show sessions

Curator:
Named Sessions:
─────────────────
context-curator [most recent named]
├─ 12 messages, 3k tokens (1.5%)
├─ Updated: just now
└─ Task: Initialize

Unnamed Sessions:
─────────────────
8e14f625-bd1a-4e79-a382-2d6c0649df97 [current]
├─ 312 messages, 67k tokens (34%)
├─ Updated: 5m ago
└─ Task: Implement JWT token refresh logic

You: summarize 8e14f625-bd1a-4e79-a382-2d6c0649df97

Curator: [Shows detailed task breakdown and recommendations]

You: checkpoint 8e14f625-bd1a-4e79-a382-2d6c0649df97 auth-work
Curator: ✓ Checkpoint created: auth-work
Resume with: claude -r auth-work

You: exit

# Resume work with the same session
claude
# Or resume the named checkpoint
claude -r auth-work
```

## How It Works

### Directory Scoping

The Context Curator automatically scopes itself based on `process.cwd()`:

- **Named sessions**: Always visible from any directory
- **Unnamed sessions**: Only shows sessions for the current project

This means you can safely manage sessions from different projects without mixing them up.

### File Structure

```
~/.claude/
├── skills/
│   └── context-curator/         # The skill (this repo)
│       ├── skill.json          # Skill manifest
│       ├── CLAUDE.md            # Agent instructions
│       ├── src/                 # TypeScript source
│       ├── scripts/             # Command scripts
│       └── setup.sh
│
├── sessions/
│   ├── context-curator/         # The curator session
│   │   ├── conversation.jsonl
│   │   └── metadata.json
│   ├── auth-work/               # Example named session
│   └── [other named sessions]
│
└── projects/
    ├── -Users-dev-my-project/   # Project sessions
    │   ├── 8e14f625-[...].jsonl
    │   └── 340f0a71-[...].jsonl
    └── -Users-dev-other-app/
        └── [...]
```

## Implementation Status

✅ **Fully Implemented:**
- Dual session type support (named + unnamed)
- Global installation as skill
- Project directory formula
- Session reading and listing
- Show sessions command
- Summarize command with analysis
- Checkpoint command
- Delete command with confirmation
- Dump command
- Help command
- Setup script
- CLAUDE.md agent instructions

🚧 **Not Implemented:**
- Interactive manage/editor mode (stub only)

## Development

### Project Structure

```
.
├── src/
│   ├── types.ts               # TypeScript type definitions
│   ├── session-reader.ts      # Read named + unnamed sessions
│   ├── session-writer.ts      # Write/modify sessions
│   ├── session-analyzer.ts    # Analyze session content
│   └── editor.ts              # Interactive editor (TODO)
├── scripts/
│   ├── init.ts                # Initialization on resume
│   ├── show-sessions.ts       # List sessions
│   ├── summarize.ts           # Analyze session
│   ├── checkpoint.ts          # Backup session
│   ├── delete.ts              # Remove session
│   ├── dump.ts                # Show raw JSONL
│   ├── manage.ts              # Interactive editor (TODO)
│   └── help.ts                # Show help
├── skill.json                 # Skill manifest
├── CLAUDE.md                  # Agent instructions
├── setup.sh                   # One-time setup
├── package.json
├── tsconfig.json
└── README.md
```

### Running Scripts Locally

```bash
# Install dependencies
npm install

# Run any script
npm run init
npm run show
npm run summarize <session-id>
npm run checkpoint <id> <name>
npm run delete <id>
npm run dump <id>
npm run help
```

## Requirements

- Claude Code installed
- Node.js 18+ (for TypeScript scripts)
- `ANTHROPIC_API_KEY` set in environment (for future editor mode)

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

## Contributing

Contributions welcome! This is v0.1.0 with core functionality implemented.
