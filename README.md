# Claude Code Context Curator

A specialized Claude Code session manager that helps you manage, analyze, and optimize your Claude Code sessions.

## What is This?

Context Curator is a **resumable Claude Code session** that acts as your session management assistant. It automatically scopes itself to manage only the sessions in your current directory, making it easy to keep your Claude Code contexts clean and efficient.

## Features

- 📊 **List Sessions**: View all sessions in the current directory with token usage stats
- 🔍 **Analyze Sessions**: Get detailed breakdowns of conversation history
- ✂️ **Optimize Sessions**: Interactive editing mode to clean up bloated contexts
- 💾 **Checkpoint Sessions**: Create backups before making changes
- 🗑️ **Delete Sessions**: Safely remove old sessions (with automatic backup)
- 📄 **Dump Sessions**: View raw JSONL data

## Installation

### One-Time Setup

```bash
# 1. Clone this repository to ~/.claude/context-curator
git clone <repo-url> ~/.claude/context-curator
cd ~/.claude/context-curator

# 2. Run the setup script
chmod +x setup.sh
./setup.sh
```

This will:
- Install dependencies
- Create the `context-curator` session in `~/.claude/sessions/context-curator/`
- Set up the CLAUDE.md instructions

### Verify Installation

```bash
cd ~/any-project
claude -r context-curator
```

You should see the Context Curator initialization screen.

## Usage

### From Any Project Directory

```bash
cd ~/my-project
claude -r context-curator
```

The curator will automatically scope itself to manage sessions in `~/my-project/.claude/sessions/`.

### Available Commands

Once in the curator session, you can use natural language or these commands:

#### Show Sessions
```
show sessions
```
Lists all sessions in the current directory with details like message count, token usage, and last update time.

#### Summarize a Session
```
summarize <session-id>
```
Analyzes a specific session and provides detailed breakdown of context usage.

#### Manage/Optimize a Session
```
manage <session-id> sonnet
```
Enters interactive editing mode where you can optimize the session.

#### Checkpoint a Session
```
checkpoint <session-id> <new-name>
```
Creates a backup/fork of a session.

#### Delete a Session
```
delete <session-id>
```
Removes a session (creates backup first, requires confirmation).

#### Dump Raw Data
```
dump <session-id>
```
Shows the raw JSONL contents of a session.

## Example Workflow

```bash
# Working on a project
cd ~/my-app
claude
> implement user authentication
> [lots of back and forth, session getting large]
^D

# Check session health
claude -r context-curator
> show sessions

# Output shows:
# sess-abc123 [most recent]
# ├─ 487 messages, 89k tokens (45%) ⚠️ HIGH
# ├─ Updated: 5m ago
# └─ Task: implement user authentication

> summarize sess-abc123
# [Shows detailed breakdown]

> checkpoint sess-abc123 before-cleanup
# ✓ Created backup

> manage sess-abc123 sonnet
# [Interactive optimization session]

> exit

# Resume work with optimized context
claude --resume sess-abc123
```

## How It Works

### Directory Scoping

The Context Curator uses `process.cwd()` to automatically scope itself to the current directory. This means:

- When you run `claude -r context-curator` from `~/project-a`, it operates on `~/project-a/.claude/sessions/`
- When you run it from `~/project-b`, it operates on `~/project-b/.claude/sessions/`
- Sessions from different directories are never mixed or modified

### Session Structure

```
~/.claude/
├── sessions/
│   ├── context-curator/         # The curator session itself
│   │   ├── conversation.jsonl
│   │   └── metadata.json
│   └── [other global sessions]
│
└── context-curator/              # This repository
    ├── CLAUDE.md                 # Agent instructions
    ├── src/                      # Source code
    ├── scripts/                  # Command scripts
    ├── setup.sh
    └── README.md
```

## Current Status

This is a **rough first version** with the following features implemented:

✅ Core infrastructure
✅ Session reading and listing
✅ Show sessions command
✅ Initialization script
✅ CLAUDE.md agent instructions
✅ Setup script

🚧 Coming Soon:
- Summarize command
- Manage/editor mode
- Checkpoint command
- Delete command
- Dump command
- Session writer utilities

## Development

### Project Structure

```
.
├── src/
│   ├── types.ts              # TypeScript type definitions
│   ├── session-reader.ts     # Read sessions from disk
│   ├── session-writer.ts     # Write/modify sessions (TODO)
│   ├── session-analyzer.ts   # Analyze session content (TODO)
│   └── editor.ts             # Interactive editor (TODO)
├── scripts/
│   ├── init.ts               # Initialization on resume
│   ├── show-sessions.ts      # List sessions
│   ├── summarize.ts          # Analyze session (TODO)
│   ├── manage.ts             # Interactive editor (TODO)
│   ├── checkpoint.ts         # Backup session (TODO)
│   ├── delete.ts             # Remove session (TODO)
│   └── dump.ts               # Show raw JSONL (TODO)
├── CLAUDE.md                 # Agent instructions
├── setup.sh                  # One-time setup
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
# etc.
```

## Requirements

- Claude Code installed
- Node.js 18+ (for TypeScript scripts)
- `ANTHROPIC_API_KEY` set in environment (for editor mode)

## License

MIT

## Contributing

This is an early prototype. Contributions welcome!
