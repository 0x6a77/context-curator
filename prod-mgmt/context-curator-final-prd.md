# Product Requirements Document: Claude Code Context Curator

**Version:** 4.0 (Final)  
**Last Updated:** January 3, 2026  
**Status:** Ready for Implementation  

---

## Executive Summary

Claude Code Context Curator is a **special-purpose resumable session** that helps developers manage their Claude Code sessions. Invoked with `claude -r context-curator` from any directory, it automatically scopes itself to manage only the sessions in that directory.

---

## How It Works

### The Session

There is **one global "context-curator" session** stored in `~/.claude/sessions/context-curator/`.

When you run `claude -r context-curator` from any directory:
1. Claude Code resumes the "context-curator" session
2. The session's CLAUDE.md makes it act as a context curator
3. It detects the current working directory
4. It operates **only on sessions in that directory's `.claude/sessions/`**

### Directory Scoping

The magic is in the CLAUDE.md:

```markdown
# Context Curator

When I am resumed, I IMMEDIATELY:
1. Detect the current working directory
2. Look for sessions in `./.claude/sessions/`
3. Scope all my operations to this directory ONLY

I am a context management assistant. I help users:
- View their sessions
- Analyze context usage
- Optimize bloated sessions
- Checkpoint important states
- Clean up cruft

I operate ONLY on sessions in the current directory.
```

---

## User Workflow

### Initial Setup (One-Time)

```bash
# 1. Create the context-curator directory
mkdir -p ~/.claude/context-curator
cd ~/.claude/context-curator

# 2. Clone/download the curator template
git clone <repo> .
npm install

# 3. Initialize the session
./setup.sh  # Creates the context-curator session with proper CLAUDE.md
```

### Daily Usage

```bash
# Working on a project
cd ~/my-project
claude
You: implement authentication
Claude: [working...]

# Want to check context health
# Exit or suspend work session
^D  # or Ctrl+D

# Start context curator
claude -r context-curator

Context Curator initialized
Operating on: /Users/dev/my-project
Found 2 sessions in this directory

You: show sessions

Curator:
Sessions in /Users/dev/my-project/.claude/sessions/:

sess-abc123 [most recent]
├─ 487 messages, 89k tokens (45%)
├─ Updated: 5 minutes ago
└─ Task: User authentication implementation

sess-def456 
├─ 203 messages, 34k tokens (17%)
├─ Updated: 1 day ago
└─ Task: Payment webhook debugging

You: summarize sess-abc123

Curator: [detailed analysis]
- Messages 1-120: Auth setup (completed) - 25k tokens
- Messages 121-280: Cookie debugging (lots of failed attempts) - 38k tokens
- Messages 281-487: Email verification (current) - 26k tokens

Recommendations:
⚠️ Messages 121-280 contain many failed attempts (38k tokens)
   Consider removing failed attempts, keeping only the solution

You: manage sess-abc123 sonnet

Curator: Launching session editor...
[Interactive editing session]

You: remove all failed cookie attempts but keep the working solution
Editor: [analyzes and stages changes]
You: @apply
Curator: ✓ Session optimized
  Before: 487 messages, 89k tokens
  After: 342 messages, 56k tokens
  Saved: 33k tokens (37%)

You: exit

# Back to work
claude --resume sess-abc123
[Continues with optimized context]
```

---

## Session Structure

### File Layout

```
~/.claude/
├── sessions/
│   ├── context-curator/           # The curator session itself
│   │   ├── conversation.jsonl     # Curator's conversation history
│   │   └── metadata.json
│   └── [other global sessions]
│
└── context-curator/                # Curator code/template
    ├── CLAUDE.md                   # Session instructions
    ├── src/
    │   ├── session-reader.ts       # Read sessions from CWD
    │   ├── session-writer.ts
    │   ├── session-analyzer.ts
    │   ├── editor.ts
    │   └── utils.ts
    ├── scripts/
    │   ├── init.sh                 # Initialization on resume
    │   ├── show-sessions.ts
    │   ├── summarize.ts
    │   ├── manage.ts
    │   └── ...
    ├── setup.sh                    # One-time setup script
    ├── package.json
    └── README.md
```

### Directory Context

When working in a project:

```
~/my-project/
├── .claude/
│   └── sessions/
│       ├── sess-abc123/            # Work session 1
│       ├── sess-def456/            # Work session 2
│       └── ...
└── [project files]
```

The curator **only sees and operates on** sessions in `~/my-project/.claude/sessions/`.

When you move to a different project:

```bash
cd ~/other-project
claude -r context-curator

Context Curator initialized
Operating on: /Users/dev/other-project
Found 1 session in this directory
```

Now it **only sees** sessions in `~/other-project/.claude/sessions/`.

---

## Implementation Details

### Setup Script

**~/.claude/context-curator/setup.sh:**
```bash
#!/bin/bash
set -e

echo "Setting up Context Curator..."

# Create the session directory
SESSION_DIR=~/.claude/sessions/context-curator
mkdir -p "$SESSION_DIR"

# Create initial conversation with CLAUDE.md
cat > "$SESSION_DIR/conversation.jsonl" << 'EOF'
{"role":"system","content":"Read and follow the instructions in ~/.claude/context-curator/CLAUDE.md"}
{"role":"user","content":"Initialize"}
{"role":"assistant","content":"Context Curator initialized. I will help manage Claude Code sessions in the current directory. Type 'help' to see available commands."}
EOF

# Create metadata
cat > "$SESSION_DIR/metadata.json" << EOF
{
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "projectPath": "$HOME/.claude/context-curator"
}
EOF

echo "✓ Session created: context-curator"
echo ""
echo "Test it:"
echo "  cd ~/any-project"
echo "  claude -r context-curator"
```

### CLAUDE.md

**~/.claude/context-curator/CLAUDE.md:**
```markdown
# Context Curator

You are a specialized Claude Code session manager.

## Initialization Protocol

Every time you are resumed, IMMEDIATELY run this command:

```bash
cd $(pwd) && npm --prefix ~/.claude/context-curator run init
```

This will:
1. Display the current working directory
2. List sessions in this directory
3. Show available commands

## Your Purpose

You help developers manage Claude Code sessions in the **current directory only**.

### Directory Scoping - CRITICAL

- You operate ONLY on sessions in `./claude/sessions/` (relative to current directory)
- NEVER modify sessions from other directories
- Always display which directory you're operating on
- If the current directory has no `.claude/sessions/`, inform the user

## Available Commands

Users will ask you to:

### 1. show sessions
List all sessions in the current directory.

Implementation:
```bash
npm --prefix ~/.claude/context-curator run show
```

### 2. summarize <session-id>
Analyze a specific session.

Implementation:
```bash
npm --prefix ~/.claude/context-curator run summarize <session-id>
```

### 3. manage <session-id> <model>
Enter interactive session editor mode.

Arguments:
- session-id: Which session to edit
- model: sonnet, opus, or haiku

Implementation:
```bash
npm --prefix ~/.claude/context-curator run manage <session-id> <model>
```

This enters an interactive mode where the user can:
- Get suggestions for optimizations
- Stage changes with natural language
- Use `@apply` to commit changes
- Use `@undo` or `@undo all` to revert

### 4. checkpoint <session-id> <new-name>
Create a backup/fork of a session.

Implementation:
```bash
npm --prefix ~/.claude/context-curator run checkpoint <session-id> <new-name>
```

### 5. delete <session-id>
Remove a session (with backup and confirmation).

Implementation:
```bash
npm --prefix ~/.claude/context-curator run delete <session-id>
```

### 6. dump <session-id>
Show raw JSONL contents.

Implementation:
```bash
npm --prefix ~/.claude/context-curator run dump <session-id>
```

### 7. help
Show this help message.

## Behavior Guidelines

### Safety First
- ALWAYS create backups before modifications
- REQUIRE confirmation for destructive operations
- NEVER modify sessions from other directories
- CHECK for active processes before modifying sessions

### User Experience
- Display current directory prominently
- Show before/after states for changes
- Highlight token savings
- Use clear formatting (boxes, tables, colors)
- Be concise but informative

### Error Handling
- If no sessions found, guide user to create one
- If session is active, warn before modification
- If path errors, explain clearly
- Provide recovery steps for errors

## Example Interactions

User: "show sessions"
You: [Run init command to confirm directory, then run show command]

User: "the auth session is getting bloated, can you help?"
You: "I can analyze it. What's the session ID? (run 'show sessions' to see IDs)"

User: "sess-abc123"
You: [Run summarize command, show analysis, suggest optimizations]

User: "yes, clean it up"
You: [Run manage command with appropriate model]

## Tools You Have

- **Bash**: Execute npm scripts, check processes, file operations
- **Read**: Read session files, analyze content
- **Write**: Modify sessions (only after user confirms)
- **Glob/Grep**: Search for patterns in sessions

## Remember

You are a helpful assistant focused on ONE task: managing Claude Code sessions in the current directory. Be efficient, safe, and clear.
```

### Init Script

**scripts/init.ts:**
```typescript
#!/usr/bin/env tsx
import * as path from 'path';
import * as fs from 'fs/promises';

async function main() {
  const cwd = process.cwd();
  const sessionsDir = path.join(cwd, '.claude', 'sessions');
  
  console.log('\n' + '═'.repeat(60));
  console.log('Context Curator - Session Manager');
  console.log('═'.repeat(60));
  console.log(`Operating on: ${cwd}`);
  console.log(`Sessions: ${sessionsDir}`);
  console.log('');
  
  // Check if sessions exist
  try {
    const sessions = await fs.readdir(sessionsDir);
    const sessionIds = sessions.filter(s => s.startsWith('sess-'));
    
    console.log(`Found ${sessionIds.length} session(s) in this directory`);
    
    if (sessionIds.length > 0) {
      console.log('\nRecent sessions:');
      for (const id of sessionIds.slice(0, 3)) {
        console.log(`  - ${id}`);
      }
      if (sessionIds.length > 3) {
        console.log(`  ... and ${sessionIds.length - 3} more`);
      }
    }
  } catch (err) {
    console.log('⚠️  No .claude/sessions/ directory found');
    console.log('   This directory hasn\'t been used with Claude Code yet.');
  }
  
  console.log('\nAvailable commands:');
  console.log('  show sessions              - List all sessions');
  console.log('  summarize <id>             - Analyze a session');
  console.log('  manage <id> <model>        - Edit a session interactively');
  console.log('  checkpoint <id> <name>     - Backup a session');
  console.log('  delete <id>                - Remove a session');
  console.log('  dump <id>                  - View raw session data');
  console.log('  help                       - Show detailed help');
  console.log('═'.repeat(60));
  console.log('');
}

main().catch(console.error);
```

### Session Reader (Directory-Aware)

**src/session-reader.ts:**
```typescript
import * as path from 'path';
import * as fs from 'fs/promises';
import { Session, Message } from './types.js';

/**
 * CRITICAL: Uses process.cwd() to ensure directory scoping
 * This makes the curator operate only on the current directory's sessions
 */
const getSessionsDir = () => path.join(process.cwd(), '.claude', 'sessions');

export async function listSessionIds(): Promise<string[]> {
  const sessionsDir = getSessionsDir();
  
  try {
    const entries = await fs.readdir(sessionsDir);
    return entries.filter(e => e.startsWith('sess-'));
  } catch (err) {
    // No sessions directory in this project
    return [];
  }
}

export async function readSession(sessionId: string): Promise<Session> {
  const sessionsDir = getSessionsDir();
  const sessionPath = path.join(sessionsDir, sessionId);
  
  // Read conversation
  const jsonlPath = path.join(sessionPath, 'conversation.jsonl');
  const content = await fs.readFile(jsonlPath, 'utf-8');
  
  const messages: Message[] = content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
  
  // Read metadata
  let metadata;
  try {
    const metadataPath = path.join(sessionPath, 'metadata.json');
    metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
  } catch {
    metadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  return {
    id: sessionId,
    messages,
    metadata,
    messageCount: messages.length,
    tokenCount: estimateTokens(messages),
    directory: process.cwd() // Track which directory this session belongs to
  };
}

function estimateTokens(messages: Message[]): number {
  // Rough estimate: ~4 chars per token
  const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  return Math.ceil(totalChars / 4);
}
```

---

## Commands Implementation

All command scripts use `process.cwd()` to ensure they operate on the current directory only.

### Show Sessions

**scripts/show-sessions.ts:**
```typescript
#!/usr/bin/env tsx
import { listSessionIds, readSession } from '../src/session-reader.js';

async function main() {
  const cwd = process.cwd();
  console.log(`\nSessions in ${cwd}/.claude/sessions/:\n`);
  
  const sessionIds = await listSessionIds();
  
  if (sessionIds.length === 0) {
    console.log('No sessions found in this directory.');
    console.log('Start a session with: claude');
    return;
  }
  
  // Sort by most recent
  const sessions = await Promise.all(
    sessionIds.map(id => readSession(id))
  );
  
  sessions.sort((a, b) => 
    new Date(b.metadata.updatedAt).getTime() - 
    new Date(a.metadata.updatedAt).getTime()
  );
  
  for (const session of sessions) {
    const percent = (session.tokenCount / 200000) * 100;
    const warning = percent > 70 ? ' ⚠️ HIGH' : '';
    
    console.log(`${session.id}${sessions[0] === session ? ' [most recent]' : ''}`);
    console.log(`├─ ${session.messageCount} messages, ${session.tokenCount.toLocaleString()} tokens (${percent.toFixed(1)}%)${warning}`);
    console.log(`├─ Updated: ${formatRelative(session.metadata.updatedAt)}`);
    
    const firstUser = session.messages.find(m => m.role === 'user');
    const preview = firstUser?.content.slice(0, 60) || '(no messages)';
    console.log(`└─ Task: ${preview}${preview.length >= 60 ? '...' : ''}`);
    console.log();
  }
}

function formatRelative(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

main().catch(console.error);
```

---

## Usage Examples

### Example 1: Checking Context Health

```bash
cd ~/my-app
claude -r context-curator

You: show sessions
Curator:
  Sessions in /Users/dev/my-app/.claude/sessions/:
  
  sess-abc123 [most recent]
  ├─ 487 messages, 89k tokens (45%)
  ├─ Updated: 5m ago
  └─ Task: implement user authentication with JWT
  
You: summarize sess-abc123
Curator: [shows detailed breakdown]
```

### Example 2: Optimizing Bloated Context

```bash
claude -r context-curator

You: my session is really slow, can you help?
Curator: Let me check your sessions. [runs show command]

You: sess-ghi789
Curator: [runs summarize]
  This session has 891 messages using 156k tokens (78% capacity).
  
  I can see:
  - Completed database refactor (200 messages)
  - Many failed ORM attempts (400 messages) 
  - Current work (291 messages)
  
  I recommend optimizing this. Would you like me to manage it?

You: yes
Curator: Which model should I use? (sonnet/opus/haiku)

You: sonnet
Curator: [launches editor]
```

### Example 3: Creating Checkpoint Before Experiment

```bash
claude -r context-curator

You: I want to try a risky refactor, can you checkpoint my current session first?
Curator: Sure! What's the session ID?

You: sess-abc123
Curator: What should I name the checkpoint?

You: before-risky-refactor
Curator: [runs checkpoint]
  ✓ Created checkpoint: sess-before-risky-refactor
  
  Your session is backed up. Resume with:
  claude --resume sess-before-risky-refactor
```

---

## Installation Guide

### One-Time Setup

```bash
# 1. Create the curator directory
mkdir -p ~/.claude/context-curator
cd ~/.claude/context-curator

# 2. Clone the repository
git clone https://github.com/yourusername/claude-context-curator.git .

# 3. Install dependencies
npm install

# 4. Run setup
./setup.sh

# You should see:
# ✓ Session created: context-curator
# Test it:
#   cd ~/any-project
#   claude -r context-curator
```

### Verify Installation

```bash
# Test from any project
cd ~/my-project
claude -r context-curator

# You should see the initialization screen
```

---

## Technical Requirements

### Prerequisites
- Claude Code installed
- Node.js 18+ (for scripts)
- ANTHROPIC_API_KEY set (for editor mode)

### Dependencies
- `@anthropic-ai/sdk` - For editor mode
- `tsx` - For running TypeScript scripts
- `typescript` - For type checking

---

## Security & Safety

### Directory Isolation
- Sessions are read from `process.cwd()/.claude/sessions/` only
- Modifications never affect other directories
- Each invocation re-scopes to current directory

### Data Protection
- Backups created before all modifications
- Confirmation required for deletions
- Undo capability in editor mode
- Original sessions never lost

### Process Safety
- Detects active Claude Code processes
- Warns before modifying active sessions
- Can kill processes safely when needed

---

## Success Criteria

### MVP Launch
- [ ] Setup script creates working curator session
- [ ] Can be invoked from any directory with `claude -r context-curator`
- [ ] Correctly scopes to current directory
- [ ] All 6 commands work (show, summarize, manage, checkpoint, delete, dump)
- [ ] Editor mode with @apply/@undo works
- [ ] Zero data loss in testing

### User Success
- Users extend productive session time by 2x
- Reduced context-related Claude Code slowdowns
- Easy context cleanup becomes routine
- Community shares optimization patterns

---

## Future Enhancements

### v0.2
- Auto-detection of bloated sessions
- Suggested optimizations on startup
- Session templates for common cleanup patterns

### v0.3
- Multi-directory dashboard
- Session analytics and trends
- Cross-session context merging

### v1.0
- GUI interface (Electron?)
- Team collaboration features
- Integration with Claude Code as official feature
