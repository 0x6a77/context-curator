# Product Requirements Document: Claude Code Context Curator

**Version:** 5.0 (Final)
**Last Updated:** January 6, 2026
**Status:** Ready for Implementation

---

## Executive Summary

Claude Code Context Curator is a **global skill** that helps developers manage their Claude Code sessions. The skill is only available when invoked from the special "context-curator" session, and it automatically scopes itself to manage sessions related to the current project directory.

---

## How It Works

### The Skill

Context Curator is a **Claude Code skill** that:
1. Only activates when invoked from a session with ID `context-curator`
2. Detects the current working directory
3. Manages both **named sessions** and **unnamed sessions** for that project
4. Provides tools to analyze, optimize, checkpoint, and clean up session context

### Session Types

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

### Directory Scoping

When you invoke the skill from `/Users/dev/my-project`, it manages:
- **Named sessions** from `~/.claude/sessions/` (all named sessions)
- **Unnamed sessions** from `~/.claude/projects/-Users-dev-my-project/`

---

## User Workflow

### Initial Setup (One-Time)

```bash
# 1. Clone the curator repository directly to skills directory
git clone https://github.com/yourusername/context-curator.git ~/.claude/skills/context-curator
cd ~/.claude/skills/context-curator

# 2. Install dependencies
npm install

# 3. Create the session
./setup.sh

# You should see:
# ✓ Session created: context-curator
#
# Usage:
#   cd ~/any-project
#   claude -r context-curator
```

### Daily Usage

```bash
# Working on a project
cd ~/my-project
claude
You: implement authentication
Claude: [working... session getting large]

# Want to check context health
^D  # Exit work session

# Start context curator session
claude -r context-curator

Context Curator initialized
Operating on: /Users/dev/my-project

You: show sessions

Curator:
Sessions for /Users/dev/my-project:

Named Sessions:
─────────────────
auth-workflow [most recent named]
├─ 487 messages, 89k tokens (45%)
├─ Updated: 2 days ago
└─ Task: User authentication implementation

Unnamed Sessions:
─────────────────
8e14f625-bd1a-4e79-a382-2d6c0649df97 [current]
├─ 312 messages, 67k tokens (34%)
├─ Updated: 5 minutes ago
└─ Task: Implement JWT token refresh logic

340f0a71-99d6-40be-83f3-825d87ff1811
├─ 203 messages, 34k tokens (17%)
├─ Updated: 1 day ago
└─ Task: Payment webhook debugging

You: summarize 8e14f625-bd1a-4e79-a382-2d6c0649df97

Curator: [detailed analysis]
- Messages 1-120: Auth setup (completed) - 25k tokens
- Messages 121-280: Cookie debugging (lots of failed attempts) - 38k tokens
- Messages 281-312: JWT refresh implementation (current) - 14k tokens

Recommendations:
⚠️ Messages 121-280 contain many failed attempts (38k tokens)
   Consider removing failed attempts, keeping only the solution

You: manage 8e14f625-bd1a-4e79-a382-2d6c0649df97 sonnet

Curator: Launching session editor...
[Interactive editing session]

You: remove all failed cookie attempts but keep the working solution
Editor: [analyzes and stages changes]
You: @apply
Curator: ✓ Session optimized
  Before: 312 messages, 67k tokens
  After: 189 messages, 38k tokens
  Saved: 29k tokens (43%)

You: exit

# Back to work with the same session (it's been optimized)
claude
[Continues with optimized context]
```

---

## File Structure

### Global Installation

```
~/.claude/
├── skills/
│   └── context-curator/              # The skill (installed here)
│       ├── skill.json                # Skill manifest
│       ├── CLAUDE.md                 # Skill instructions
│       ├── src/
│       │   ├── session-reader.ts     # Read sessions (named + unnamed)
│       │   ├── session-writer.ts
│       │   ├── session-analyzer.ts
│       │   ├── editor.ts
│       │   └── utils.ts
│       ├── scripts/
│       │   ├── init.ts               # Initialization
│       │   ├── show-sessions.ts
│       │   ├── summarize.ts
│       │   ├── manage.ts
│       │   └── ...
│       ├── setup.sh                  # Installation script
│       ├── package.json
│       └── README.md
│
├── sessions/
│   ├── context-curator/              # The curator session
│   │   ├── conversation.jsonl
│   │   └── metadata.json
│   ├── auth-workflow/                # Example named session
│   └── [other named sessions]
│
└── projects/
    ├── -Users-dev-my-project/        # Project-specific unnamed sessions
    │   ├── 8e14f625-[...].jsonl      # Unnamed session 1
    │   ├── 340f0a71-[...].jsonl      # Unnamed session 2
    │   └── agent-a55a46e.jsonl       # Agent sessions
    └── -Users-dev-other-app/         # Different project
        └── [...]
```

---

## Implementation Details

### Setup Script

**~/.claude/skills/context-curator/setup.sh:**
```bash
#!/bin/bash
set -e

echo "Setting up Context Curator..."

# Create the context-curator session
SESSION_DIR=~/.claude/sessions/context-curator
mkdir -p "$SESSION_DIR"

cat > "$SESSION_DIR/conversation.jsonl" << 'EOF'
{"role":"system","content":"You have access to the context-curator skill. This skill helps manage Claude Code sessions for the current project."}
{"role":"user","content":"Initialize"}
{"role":"assistant","content":"Context Curator ready. I can help manage your Claude Code sessions. Type 'help' to see available commands."}
EOF

cat > "$SESSION_DIR/metadata.json" << EOF
{
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "projectPath": "$HOME/.claude/skills/context-curator"
}
EOF

echo "✓ Session created: context-curator"
echo ""
echo "Usage:"
echo "  cd ~/any-project"
echo "  claude -r context-curator"
echo ""
echo "Then use commands like:"
echo "  show sessions"
echo "  summarize <session-id>"
echo "  manage <session-id> <model>"
```

### Skill Manifest

**skill.json:**
```json
{
  "name": "context-curator",
  "version": "0.1.0",
  "description": "Manage Claude Code session context",
  "trigger": {
    "sessionId": "context-curator"
  },
  "commands": {
    "show": "Show all sessions for current project",
    "summarize": "Analyze a specific session",
    "manage": "Edit a session interactively",
    "checkpoint": "Backup a session",
    "delete": "Remove a session",
    "dump": "View raw session data",
    "help": "Show help"
  }
}
```

### CLAUDE.md

**~/.claude/skills/context-curator/CLAUDE.md:**
```markdown
# Context Curator

You are the Context Curator, a specialized assistant for managing Claude Code sessions.

## Initialization

**CRITICAL**: Every time you are resumed, immediately run:

```bash
npm --prefix ~/.claude/skills/context-curator run init
```

This will:
1. Display the current working directory
2. Show which sessions are available (named + unnamed for this project)
3. List available commands

## Your Purpose

You help developers manage Claude Code sessions **for the current project**.

### Session Scope - CRITICAL

The curator manages TWO types of sessions:

1. **Named Sessions** (in `~/.claude/sessions/`)
   - Format: `<session-id>/conversation.jsonl`
   - Globally accessible by name
   - Examples: `context-curator`, `my-workflow`

2. **Unnamed Sessions** (in `~/.claude/projects/<project-dir>/`)
   - Format: `<uuid>.jsonl` (flat files)
   - Project-specific
   - Examples: `8e14f625-bd1a-4e79-a382-2d6c0649df97.jsonl`

**Project Directory Formula:**
```typescript
const projectDir = process.cwd().replace(/\//g, '-');
// /Users/dev/my-project → -Users-dev-my-project
```

You operate on:
- ALL named sessions
- ONLY unnamed sessions for the current project directory

### Directory Scoping

- ALWAYS display which directory you're operating on
- NEVER modify sessions you're not managing
- Show both named and unnamed sessions clearly separated

## Available Commands

### show sessions
List all sessions (named + unnamed) for the current project.

```bash
npm --prefix ~/.claude/skills/context-curator run show
```

### summarize <session-id>
Analyze a specific session in detail.

```bash
npm --prefix ~/.claude/skills/context-curator run summarize <session-id>
```

### manage <session-id> <model>
Enter interactive session editing mode.

Arguments:
- `session-id`: Session to edit (named or UUID)
- `model`: One of: sonnet, opus, haiku

```bash
npm --prefix ~/.claude/skills/context-curator run manage <session-id> <model>
```

In manage mode, the user can:
- Get optimization suggestions
- Stage changes with natural language
- Type `@apply` to commit changes
- Type `@undo` or `@undo all` to revert

### checkpoint <session-id> <new-name>
Create a backup/fork of a session.

```bash
npm --prefix ~/.claude/skills/context-curator run checkpoint <session-id> <new-name>
```

### delete <session-id>
Remove a session (creates backup first, requires confirmation).

```bash
npm --prefix ~/.claude/skills/context-curator run delete <session-id>
```

### dump <session-id> <type>
Display the raw "message" elements of JSONL contents of a session sorted in timestamp order and filtered by "type" == <type> if the user specified a type parameter. Add the following label to each message output:

   --- MESSAGE <type> <timestamp> <message>

```bash
npm --prefix ~/.claude/skills/context-curator run dump <session-id>
```

### help
Show detailed help and command reference.

## Behavior Guidelines

### Safety
- ALWAYS create backups before modifications
- REQUIRE user confirmation for destructive operations
- NEVER touch sessions from other projects
- WARN if attempting to modify an active session

### User Experience
- Display current directory prominently
- Show named vs unnamed sessions clearly
- Show before/after states for changes
- Highlight token savings
- Use clear formatting
- Be concise but informative

### Command Interpretation

Users may phrase requests differently. Map these to commands:

- "show me my sessions" → show sessions
- "what sessions do I have" → show sessions
- "list sessions" → show sessions
- "tell me about session X" → summarize X
- "analyze session X" → summarize X
- "clean up session X" → manage X sonnet
- "optimize session X" → manage X sonnet
- "backup session X" → checkpoint X <name>
- "copy session X to Y" → checkpoint X Y
- "remove session X" → delete X
- "show raw data for X" → dump X

## Tools You Have

- **Bash**: Run npm scripts, check file system
- **Read**: Read files to inspect sessions
- **Write**: Modify sessions (only after confirmation)
- **Glob/Grep**: Search for patterns

## Example Interactions

**Simple listing:**
User: "show sessions"
You: [Run init if needed, then run show command, display results]

**Analysis request:**
User: "my auth session feels slow"
You: "Let me check. [Run show sessions] I see several sessions. Which one are you referring to? Could be:
  - auth-workflow (named session, 89k tokens)
  - 8e14f625-... (current unnamed, 67k tokens)"

**Optimization:**
User: "can you clean up 8e14f625-bd1a-4e79-a382-2d6c0649df97?"
You: "I'll use the editor mode. [Run manage 8e14f625-bd1a-4e79-a382-2d6c0649df97 sonnet]"

**Checkpoint:**
User: "save a backup first"
You: "What should I name it?"
User: "before-cleanup"
You: [Run checkpoint 8e14f625-bd1a-4e79-a382-2d6c0649df97 before-cleanup]

## Remember

- You are focused on ONE task: managing sessions for the current project
- Be helpful, safe, and efficient
- Always confirm the current directory
- Protect user data with backups
```

### Init Script

**scripts/init.ts:**
```typescript
#!/usr/bin/env tsx
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Project directory naming formula
 */
function getProjectDir(cwd: string): string {
  return cwd.replace(/\//g, '-');
}

async function main() {
  const cwd = process.cwd();
  const projectDir = getProjectDir(cwd);

  console.log('\n' + '═'.repeat(60));
  console.log('Context Curator - Session Manager');
  console.log('═'.repeat(60));
  console.log(`Operating on: ${cwd}`);
  console.log(`Project dir:  ${projectDir}`);
  console.log('');

  // Check named sessions
  let namedSessions: string[] = [];
  try {
    const namedDir = path.join(process.env.HOME!, '.claude', 'sessions');
    const entries = await fs.readdir(namedDir);
    namedSessions = entries.filter(e => {
      // Filter out agent sessions and only show real named sessions
      return !e.startsWith('agent-');
    });
  } catch (err) {
    // No named sessions
  }

  // Check unnamed sessions for this project
  let unnamedSessions: string[] = [];
  try {
    const projectsDir = path.join(process.env.HOME!, '.claude', 'projects', projectDir);
    const entries = await fs.readdir(projectsDir);
    unnamedSessions = entries.filter(e => {
      // UUID pattern and not agent sessions
      return e.endsWith('.jsonl') &&
             !e.startsWith('agent-') &&
             /^[0-9a-f]{8}-/.test(e);
    });
  } catch (err) {
    // No unnamed sessions for this project
  }

  console.log(`Found ${namedSessions.length} named session(s)`);
  console.log(`Found ${unnamedSessions.length} unnamed session(s) for this project`);

  if (namedSessions.length > 0) {
    console.log('\nRecent named sessions:');
    for (const id of namedSessions.slice(0, 3)) {
      console.log(`  - ${id}`);
    }
    if (namedSessions.length > 3) {
      console.log(`  ... and ${namedSessions.length - 3} more`);
    }
  }

  if (unnamedSessions.length > 0) {
    console.log('\nRecent unnamed sessions:');
    for (const file of unnamedSessions.slice(0, 3)) {
      const id = file.replace('.jsonl', '');
      console.log(`  - ${id}`);
    }
    if (unnamedSessions.length > 3) {
      console.log(`  ... and ${unnamedSessions.length - 3} more`);
    }
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

### Session Reader (Named + Unnamed)

**src/session-reader.ts:**
```typescript
import * as path from 'path';
import * as fs from 'fs/promises';
import { Session, Message } from './types.js';

/**
 * Project directory naming formula
 */
function getProjectDir(cwd: string): string {
  return cwd.replace(/\//g, '-');
}

/**
 * Get paths for both session types
 */
function getSessionPaths() {
  const cwd = process.cwd();
  const projectDir = getProjectDir(cwd);

  return {
    namedSessionsDir: path.join(process.env.HOME!, '.claude', 'sessions'),
    unnamedSessionsDir: path.join(process.env.HOME!, '.claude', 'projects', projectDir),
    projectDir,
    cwd
  };
}

/**
 * List all session IDs (named + unnamed for current project)
 */
export async function listSessionIds(): Promise<{
  named: string[];
  unnamed: string[];
}> {
  const { namedSessionsDir, unnamedSessionsDir } = getSessionPaths();

  // Named sessions
  let named: string[] = [];
  try {
    const entries = await fs.readdir(namedSessionsDir);
    named = entries.filter(e => !e.startsWith('agent-'));
  } catch (err) {
    // No named sessions
  }

  // Unnamed sessions for this project
  let unnamed: string[] = [];
  try {
    const entries = await fs.readdir(unnamedSessionsDir);
    unnamed = entries
      .filter(e => e.endsWith('.jsonl') && !e.startsWith('agent-') && /^[0-9a-f]{8}-/.test(e))
      .map(e => e.replace('.jsonl', ''));
  } catch (err) {
    // No unnamed sessions
  }

  return { named, unnamed };
}

/**
 * Read a session (auto-detect named vs unnamed)
 */
export async function readSession(sessionId: string): Promise<Session> {
  const { namedSessionsDir, unnamedSessionsDir } = getSessionPaths();

  // Try named first
  const namedPath = path.join(namedSessionsDir, sessionId, 'conversation.jsonl');
  const unnamedPath = path.join(unnamedSessionsDir, `${sessionId}.jsonl`);

  let jsonlPath: string;
  let isNamed: boolean;

  try {
    await fs.access(namedPath);
    jsonlPath = namedPath;
    isNamed = true;
  } catch {
    // Try unnamed
    try {
      await fs.access(unnamedPath);
      jsonlPath = unnamedPath;
      isNamed = false;
    } catch {
      throw new Error(`Session not found: ${sessionId}`);
    }
  }

  // Read conversation
  const content = await fs.readFile(jsonlPath, 'utf-8');
  const messages: Message[] = content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));

  // Read metadata (named sessions only)
  let metadata;
  if (isNamed) {
    try {
      const metadataPath = path.join(namedSessionsDir, sessionId, 'metadata.json');
      metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
    } catch {
      metadata = {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  } else {
    // For unnamed sessions, use file stats
    const stats = await fs.stat(jsonlPath);
    metadata = {
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString()
    };
  }

  return {
    id: sessionId,
    messages,
    metadata,
    messageCount: messages.length,
    tokenCount: estimateTokens(messages),
    isNamed,
    directory: process.cwd()
  };
}

function estimateTokens(messages: Message[]): number {
  // Rough estimate: ~4 chars per token
  const totalChars = messages.reduce((sum, msg) => {
    const content = typeof msg.content === 'string'
      ? msg.content
      : JSON.stringify(msg.content);
    return sum + content.length;
  }, 0);
  return Math.ceil(totalChars / 4);
}
```

---

## Commands Implementation

All command scripts use the project directory formula to access the correct unnamed sessions.

### Show Sessions

**scripts/show-sessions.ts:**
```typescript
#!/usr/bin/env tsx
import { listSessionIds, readSession } from '../src/session-reader.js';

async function main() {
  const cwd = process.cwd();
  console.log(`\nSessions for ${cwd}:\n`);

  const { named, unnamed } = await listSessionIds();

  if (named.length === 0 && unnamed.length === 0) {
    console.log('No sessions found.');
    console.log('Start a session with: claude');
    return;
  }

  // Show named sessions
  if (named.length > 0) {
    console.log('Named Sessions:');
    console.log('─'.repeat(60));

    const namedSessions = await Promise.all(named.map(id => readSession(id)));
    namedSessions.sort((a, b) =>
      new Date(b.metadata.updatedAt).getTime() -
      new Date(a.metadata.updatedAt).getTime()
    );

    for (const session of namedSessions) {
      printSession(session, namedSessions[0] === session ? '[most recent named]' : '');
    }
    console.log();
  }

  // Show unnamed sessions
  if (unnamed.length > 0) {
    console.log('Unnamed Sessions:');
    console.log('─'.repeat(60));

    const unnamedSessions = await Promise.all(unnamed.map(id => readSession(id)));
    unnamedSessions.sort((a, b) =>
      new Date(b.metadata.updatedAt).getTime() -
      new Date(a.metadata.updatedAt).getTime()
    );

    for (const session of unnamedSessions) {
      printSession(session, unnamedSessions[0] === session ? '[current]' : '');
    }
  }
}

function printSession(session: any, label: string) {
  const percent = (session.tokenCount / 200000) * 100;
  const warning = percent > 70 ? ' ⚠️ HIGH' : '';

  console.log(`${session.id}${label ? ' ' + label : ''}`);
  console.log(`├─ ${session.messageCount} messages, ${(session.tokenCount / 1000).toFixed(0)}k tokens (${percent.toFixed(1)}%)${warning}`);
  console.log(`├─ Updated: ${formatRelative(session.metadata.updatedAt)}`);

  const firstUser = session.messages.find((m: any) => m.role === 'user');
  const content = firstUser?.content;
  const preview = typeof content === 'string'
    ? content.slice(0, 60)
    : (content ? JSON.stringify(content).slice(0, 60) : '(no messages)');
  console.log(`└─ Task: ${preview}${preview.length >= 60 ? '...' : ''}`);
  console.log();
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
Sessions for /Users/dev/my-app:

Named Sessions:
─────────────────
auth-workflow [most recent named]
├─ 487 messages, 89k tokens (45%)
├─ Updated: 2d ago
└─ Task: implement user authentication with JWT

Unnamed Sessions:
─────────────────
8e14f625-bd1a-4e79-a382-2d6c0649df97 [current]
├─ 312 messages, 67k tokens (34%)
├─ Updated: 5m ago
└─ Task: Implement JWT token refresh logic

340f0a71-99d6-40be-83f3-825d87ff1811
├─ 203 messages, 34k tokens (17%)
├─ Updated: 1d ago
└─ Task: Payment webhook debugging

You: summarize 8e14f625-bd1a-4e79-a382-2d6c0649df97
Curator: [shows detailed breakdown]
```

### Example 2: Optimizing Current Session

```bash
cd ~/my-app
claude -r context-curator

You: my current session is really slow, can you help?
Curator: Let me check your sessions. [runs show command]

  I can see your current unnamed session (8e14f625-...) has 312 messages
  using 67k tokens. Let me analyze it.

  [runs summarize]

  This session contains:
  - Completed auth setup (120 messages)
  - Many failed cookie attempts (160 messages) ⚠️
  - Current JWT work (32 messages)

  I recommend optimizing this. Would you like me to manage it?

You: yes, use sonnet
Curator: [launches editor with: npm run manage 8e14f625-bd1a-4e79-a382-2d6c0649df97 sonnet]
```

### Example 3: Creating Checkpoint Before Risky Change

```bash
claude -r context-curator

You: I want to try a risky refactor. Can you checkpoint my current session first?
Curator: Sure! Looking at your sessions... [runs show]

  Your current session is: 8e14f625-bd1a-4e79-a382-2d6c0649df97

  What should I name the checkpoint?

You: before-risky-refactor
Curator: [runs checkpoint 8e14f625-bd1a-4e79-a382-2d6c0649df97 before-risky-refactor]

  ✓ Created checkpoint: before-risky-refactor

  Your session is backed up as a named session.
  Resume with: claude -r before-risky-refactor

You: thanks!
Curator: Good luck with the refactor! If it goes wrong, just resume the
  checkpoint and your context will be exactly as it was.
```

---

## Installation Guide

### One-Time Setup

```bash
# 1. Clone the repository directly to skills directory
git clone https://github.com/yourusername/context-curator.git ~/.claude/skills/context-curator

# 2. Install dependencies
cd ~/.claude/skills/context-curator
npm install

# 3. Run setup (creates session)
./setup.sh

# You should see:
# ✓ Session created: context-curator
#
# Usage:
#   cd ~/any-project
#   claude -r context-curator
```

### Verify Installation

```bash
# Test from any project
cd ~/my-project
claude -r context-curator

# You should see the initialization screen with session counts
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

### Session Isolation
- Named sessions are globally accessible (by design)
- Unnamed sessions are project-scoped automatically
- Formula prevents collisions: each project path → unique directory
- Never modifies sessions outside current scope

### Data Protection
- Backups created before all modifications
- Confirmation required for deletions
- Undo capability in editor mode
- Original sessions never lost

### Process Safety
- Detects active Claude Code processes
- Warns before modifying active sessions
- Can safely kill processes when needed

---

## Success Criteria

### MVP Launch
- [ ] Skill installed and accessible from context-curator session
- [ ] Can be invoked from any directory with `claude -r context-curator`
- [ ] Correctly identifies and displays both named and unnamed sessions
- [ ] Project path formula works correctly
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
- Auto-detection of bloated sessions on startup
- Suggested optimizations with one-click apply
- Session templates for common cleanup patterns
- Better visualization of session structure

### v0.3
- Multi-directory dashboard (see all projects)
- Session analytics and trends over time
- Cross-session context merging
- Smart recommendations based on usage patterns

### v1.0
- GUI interface (Electron?)
- Team collaboration features
- Integration with Claude Code as official feature
- Advanced AI-powered optimization strategies
