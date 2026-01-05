# Developer Implementation Plan: Claude Code Context Curator

**Version:** 4.0 (Final)  
**Timeline:** 3-4 weeks to MVP  
**Approach:** Global resumable session with directory scoping  

---

## Architecture Summary

**Core Concept**: One global "context-curator" session that automatically scopes itself to the current directory when resumed.

**Key Files**:
- `~/.claude/sessions/context-curator/` - The session itself
- `~/.claude/context-curator/` - Code, scripts, CLAUDE.md

**Invocation**: `claude -r context-curator` from any project directory

**Scoping**: Uses `process.cwd()` to operate only on sessions in current directory

---

## Phase 0: Setup & Validation (Days 1-2)

### Goals
- Understand session resumption mechanics
- Validate directory-scoped approach
- Create project skeleton

### Tasks

#### T0.1: Validate Session Resumption
**Duration:** 2 hours  
**Priority:** P0

**Test Plan:**
```bash
# 1. Create a test session manually
mkdir -p ~/.claude/sessions/test-session
cat > ~/.claude/sessions/test-session/conversation.jsonl << 'EOF'
{"role":"user","content":"Hello"}
{"role":"assistant","content":"Hi there!"}
EOF

# 2. Try to resume it
claude -r test-session

# Expected: Session resumes with that conversation
# Verify this works before proceeding
```

**Validation:**
- [ ] Can create session manually
- [ ] Can resume with `claude -r <name>`
- [ ] Session persists conversation history

#### T0.2: Test CLAUDE.md Loading
**Duration:** 2 hours  
**Priority:** P0

**Test Plan:**
```bash
# 1. Create CLAUDE.md in project
mkdir test-project && cd test-project
cat > CLAUDE.md << 'EOF'
# Test Agent
When I start, I should say "Test agent activated!"
EOF

# 2. Start Claude Code
claude

# Expected: Claude reads CLAUDE.md and follows instructions
```

**Question to Answer:**
- Does Claude Code automatically read CLAUDE.md from current directory?
- Or do we need to use `--project-path` flag?
- Can we reference a CLAUDE.md from outside the current directory?

**If CLAUDE.md must be in current directory:**
We'll need a setup script that symlinks or copies CLAUDE.md to each project.

**If we can reference external CLAUDE.md:**
Much simpler - just point to `~/.claude/context-curator/CLAUDE.md`

#### T0.3: Project Initialization
**Duration:** 2 hours  
**Priority:** P0

```bash
# Create structure
mkdir -p ~/.claude/context-curator
cd ~/.claude/context-curator

# Initialize npm project
npm init -y

# Install dependencies
npm install @anthropic-ai/sdk
npm install --save-dev typescript @types/node tsx

# Setup TypeScript
npx tsc --init

# Create directories
mkdir -p src scripts
```

**Project Structure:**
```
~/.claude/context-curator/
├── CLAUDE.md              # Agent instructions
├── src/
│   ├── types.ts
│   ├── session-reader.ts
│   ├── session-writer.ts
│   ├── session-analyzer.ts
│   ├── editor.ts
│   └── utils.ts
├── scripts/
│   ├── init.ts            # Run on session resume
│   ├── show-sessions.ts
│   ├── summarize.ts
│   ├── manage.ts
│   ├── checkpoint.ts
│   ├── delete.ts
│   └── dump.ts
├── setup.sh               # One-time setup
├── package.json
├── tsconfig.json
└── README.md
```

---

## Phase 1: Session Creation & Core Scripts (Days 3-7)

### Tasks

#### T1.1: Setup Script
**Duration:** 4 hours  
**Priority:** P0

**File: setup.sh**
```bash
#!/bin/bash
set -e

echo "🚀 Setting up Claude Code Context Curator..."
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Create the curator session
SESSION_DIR=~/.claude/sessions/context-curator
echo "📁 Creating session directory..."
mkdir -p "$SESSION_DIR"

# Create initial conversation
echo "💬 Creating initial conversation..."
cat > "$SESSION_DIR/conversation.jsonl" << 'JSONL'
{"role":"system","content":"You are the Context Curator. Read ~/.claude/context-curator/CLAUDE.md for your instructions.","timestamp":"2026-01-03T00:00:00Z"}
{"role":"user","content":"Initialize as context curator","timestamp":"2026-01-03T00:00:01Z"}
{"role":"assistant","content":"Context Curator initialized. I help manage Claude Code sessions in the current directory.\n\nType 'help' to see available commands.","timestamp":"2026-01-03T00:00:02Z"}
JSONL

# Create metadata
echo "📋 Creating metadata..."
cat > "$SESSION_DIR/metadata.json" << METADATA
{
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "projectPath": "$HOME/.claude/context-curator"
}
METADATA

echo "✓ Session created"
echo ""

# Test it
echo "🧪 Testing session..."
if [ -f "$SESSION_DIR/conversation.jsonl" ]; then
  echo "✓ Session file exists"
else
  echo "❌ Session file not created"
  exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To use the Context Curator:"
echo "  1. cd into any project directory"
echo "  2. Run: claude -r context-curator"
echo ""
echo "Example:"
echo "  cd ~/my-project"
echo "  claude -r context-curator"
echo ""
```

#### T1.2: Types Definition
**Duration:** 1 hour  
**Priority:** P0

**File: src/types.ts**
```typescript
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface SessionMetadata {
  createdAt: string;
  updatedAt: string;
  projectPath?: string;
}

export interface Session {
  id: string;
  messages: Message[];
  metadata: SessionMetadata;
  messageCount: number;
  tokenCount: number;
  directory: string;  // Which directory this session belongs to
}

export interface Task {
  startIndex: number;
  endIndex: number;
  firstPrompt: string;
  messageCount: number;
  tokenCount: number;
  status: 'completed' | 'in-progress' | 'failed';
}

export interface SessionChange {
  type: 'remove' | 'summarize' | 'edit';
  description: string;
  original: Message[];
  modified: Message[];
  tokenDelta: number;
}
```

#### T1.3: Session Reader
**Duration:** 4 hours  
**Priority:** P0

**File: src/session-reader.ts**
```typescript
import * as path from 'path';
import * as fs from 'fs/promises';
import { Session, Message, SessionMetadata } from './types.js';

/**
 * CRITICAL: Always use process.cwd() for directory scoping
 */
const getSessionsDir = () => path.join(process.cwd(), '.claude', 'sessions');

export async function listSessionIds(): Promise<string[]> {
  const sessionsDir = getSessionsDir();
  
  try {
    const entries = await fs.readdir(sessionsDir);
    return entries.filter(e => e.startsWith('sess-'));
  } catch (err) {
    return [];
  }
}

export async function readSession(sessionId: string): Promise<Session> {
  const sessionsDir = getSessionsDir();
  const sessionPath = path.join(sessionsDir, sessionId);
  
  // Read conversation.jsonl
  const jsonlPath = path.join(sessionPath, 'conversation.jsonl');
  const content = await fs.readFile(jsonlPath, 'utf-8');
  
  const messages: Message[] = content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
  
  // Read metadata.json
  let metadata: SessionMetadata;
  try {
    const metadataPath = path.join(sessionPath, 'metadata.json');
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    metadata = JSON.parse(metadataContent);
  } catch {
    // Fallback if metadata doesn't exist
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
    directory: process.cwd()
  };
}

export async function sessionExists(sessionId: string): Promise<boolean> {
  const sessionsDir = getSessionsDir();
  const sessionPath = path.join(sessionsDir, sessionId);
  
  try {
    await fs.access(sessionPath);
    return true;
  } catch {
    return false;
  }
}

function estimateTokens(messages: Message[]): number {
  // Rough estimate: ~4 chars per token
  const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  return Math.ceil(totalChars / 4);
}
```

#### T1.4: Init Script
**Duration:** 2 hours  
**Priority:** P0

**File: scripts/init.ts**
```typescript
#!/usr/bin/env tsx
import * as path from 'path';
import { listSessionIds } from '../src/session-reader.js';

async function main() {
  const cwd = process.cwd();
  const sessionsDir = path.join(cwd, '.claude', 'sessions');
  
  console.log('\n' + '═'.repeat(70));
  console.log('  Context Curator - Claude Code Session Manager');
  console.log('═'.repeat(70));
  console.log(`📁 Operating on: ${cwd}`);
  console.log(`📂 Sessions: ${sessionsDir}`);
  console.log('');
  
  // List sessions
  const sessionIds = await listSessionIds();
  
  if (sessionIds.length === 0) {
    console.log('⚠️  No sessions found in this directory');
    console.log('   Start a session with: claude');
    console.log('');
  } else {
    console.log(`Found ${sessionIds.length} session(s):`);
    const toShow = sessionIds.slice(0, 5);
    for (const id of toShow) {
      console.log(`  • ${id}`);
    }
    if (sessionIds.length > 5) {
      console.log(`  ... and ${sessionIds.length - 5} more`);
    }
    console.log('');
  }
  
  console.log('Available commands:');
  console.log('  show sessions              List all sessions with details');
  console.log('  summarize <id>             Analyze a session');
  console.log('  manage <id> <model>        Edit session interactively');
  console.log('  checkpoint <id> <name>     Backup/fork a session');
  console.log('  delete <id>                Remove a session');
  console.log('  dump <id>                  View raw JSONL');
  console.log('  help                       Show detailed help');
  console.log('═'.repeat(70));
  console.log('');
}

main().catch(console.error);
```

#### T1.5: Show Sessions Script
**Duration:** 4 hours  
**Priority:** P0

**File: scripts/show-sessions.ts**
```typescript
#!/usr/bin/env tsx
import { listSessionIds, readSession } from '../src/session-reader.js';

async function main() {
  const cwd = process.cwd();
  const sessionIds = await listSessionIds();
  
  if (sessionIds.length === 0) {
    console.log('\nNo sessions found in this directory.');
    console.log('Start a session with: claude\n');
    return;
  }
  
  console.log(`\nSessions in ${cwd}/.claude/sessions/:\n`);
  
  // Load and sort sessions by recency
  const sessions = await Promise.all(
    sessionIds.map(async id => {
      try {
        return await readSession(id);
      } catch (err) {
        return null;
      }
    })
  );
  
  const validSessions = sessions.filter(s => s !== null) as Session[];
  validSessions.sort((a, b) => 
    new Date(b.metadata.updatedAt).getTime() - 
    new Date(a.metadata.updatedAt).getTime()
  );
  
  // Display each session
  for (let i = 0; i < validSessions.length; i++) {
    const session = validSessions[i];
    const percentCapacity = (session.tokenCount / 200000) * 100;
    const capacityWarning = percentCapacity > 70 ? ' ⚠️ HIGH' : '';
    const recentMarker = i === 0 ? ' [most recent]' : '';
    
    console.log(`${session.id}${recentMarker}`);
    console.log(`├─ ${session.messageCount} messages, ${session.tokenCount.toLocaleString()} tokens (${percentCapacity.toFixed(1)}%)${capacityWarning}`);
    console.log(`├─ Updated: ${formatRelativeTime(session.metadata.updatedAt)}`);
    
    // Show first user message as preview
    const firstUserMsg = session.messages.find(m => m.role === 'user');
    const preview = firstUserMsg ? firstUserMsg.content.slice(0, 60) : '(no messages)';
    console.log(`└─ Task: ${preview}${preview.length >= 60 ? '...' : ''}`);
    console.log();
  }
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

main().catch(console.error);
```

#### T1.6: CLAUDE.md
**Duration:** 2 hours  
**Priority:** P0

**File: CLAUDE.md**
```markdown
# Context Curator

You are the Context Curator, a specialized assistant for managing Claude Code sessions.

## Initialization

**CRITICAL**: Every time you are resumed, immediately run:

```bash
npm --prefix ~/.claude/context-curator run init
```

This will:
1. Display the current working directory
2. Show which sessions are available
3. List available commands

## Your Purpose

You help developers manage Claude Code sessions **in the current directory only**.

### Directory Scoping (CRITICAL)

- You operate ONLY on `./.claude/sessions/` in the current directory
- NEVER modify sessions from other directories  
- Always show which directory you're operating on
- All scripts automatically use `process.cwd()` for scoping

## Available Commands

### show sessions
List all sessions in the current directory with details.

```bash
npm --prefix ~/.claude/context-curator run show
```

### summarize <session-id>
Analyze a specific session in detail.

```bash
npm --prefix ~/.claude/context-curator run summarize <session-id>
```

### manage <session-id> <model>
Enter interactive session editing mode.

Arguments:
- `session-id`: Session to edit
- `model`: One of: sonnet, opus, haiku

```bash
npm --prefix ~/.claude/context-curator run manage <session-id> <model>
```

In manage mode, the user can:
- Get optimization suggestions
- Stage changes with natural language
- Type `@apply` to commit changes
- Type `@undo` or `@undo all` to revert

### checkpoint <session-id> <new-name>
Create a backup/fork of a session.

```bash
npm --prefix ~/.claude/context-curator run checkpoint <session-id> <new-name>
```

### delete <session-id>
Remove a session (creates backup first, requires confirmation).

```bash
npm --prefix ~/.claude/context-curator run delete <session-id>
```

### dump <session-id>
Display raw JSONL contents of a session.

```bash
npm --prefix ~/.claude/context-curator run dump <session-id>
```

### help
Show detailed help and command reference.

## Behavior Guidelines

### Safety
- ALWAYS create backups before modifications
- REQUIRE user confirmation for destructive operations
- NEVER touch sessions from other directories
- WARN if attempting to modify an active session

### User Experience
- Display current directory prominently
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
You: "Let me check. [Run show sessions] I see sess-abc123 is your most recent. Let me analyze it. [Run summarize sess-abc123]"

**Optimization:**
User: "can you clean it up?"
You: "I'll use the editor mode. [Run manage sess-abc123 sonnet]"

**Checkpoint:**
User: "save a backup first"
You: "What should I name it?"
User: "before-cleanup"
You: [Run checkpoint sess-abc123 before-cleanup]

## Remember

- You are focused on ONE task: managing sessions in the current directory
- Be helpful, safe, and efficient
- Always confirm the current directory
- Protect user data with backups
```

---

## Phase 2: Analysis & Optimization (Days 8-14)

### T2.1: Session Analyzer
**Duration:** 1 day  
**Priority:** P0

(Implementation similar to previous version, but ensure all file paths use `process.cwd()`)

### T2.2: Summarize Script
**Duration:** 4 hours  
**Priority:** P0

(Implementation from previous version)

### T2.3: Session Writer
**Duration:** 4 hours  
**Priority:** P0

**File: src/session-writer.ts**
```typescript
import * as path from 'path';
import * as fs from 'fs/promises';
import { Message } from './types.js';

const getSessionsDir = () => path.join(process.cwd(), '.claude', 'sessions');
const BACKUP_DIR = path.join(process.env.HOME!, '.claude-context-backups');

export async function writeSession(
  sessionId: string,
  messages: Message[]
): Promise<void> {
  const sessionsDir = getSessionsDir();
  const sessionPath = path.join(sessionsDir, sessionId);
  
  await fs.mkdir(sessionPath, { recursive: true });
  
  // Write conversation.jsonl
  const jsonlPath = path.join(sessionPath, 'conversation.jsonl');
  const content = messages.map(m => JSON.stringify(m)).join('\n');
  await fs.writeFile(jsonlPath, content, 'utf-8');
  
  // Update metadata
  const metadataPath = path.join(sessionPath, 'metadata.json');
  const metadata = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
}

export async function backupSession(sessionId: string): Promise<string> {
  const sessionsDir = getSessionsDir();
  const sourcePath = path.join(sessionsDir, sessionId);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupId = `${sessionId}-${timestamp}`;
  const backupPath = path.join(BACKUP_DIR, backupId);
  
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  await fs.cp(sourcePath, backupPath, { recursive: true });
  
  return backupPath;
}

export async function deleteSession(
  sessionId: string,
  createBackup: boolean = true
): Promise<string | null> {
  const sessionsDir = getSessionsDir();
  const sessionPath = path.join(sessionsDir, sessionId);
  
  let backupPath = null;
  if (createBackup) {
    backupPath = await backupSession(sessionId);
  }
  
  await fs.rm(sessionPath, { recursive: true, force: true });
  
  return backupPath;
}
```

### T2.4: Checkpoint Script
**Duration:** 2 hours  
**Priority:** P0

### T2.5: Delete Script  
**Duration:** 2 hours  
**Priority:** P0

### T2.6: Dump Script
**Duration:** 2 hours  
**Priority:** P0

---

## Phase 3: Editor Mode (Days 15-21)

### T3.1: Change Tracker
**Duration:** 4 hours  
**Priority:** P0

(Same as previous implementation)

### T3.2: Editor Implementation
**Duration:** 2 days  
**Priority:** P0

(Similar to previous, ensure all paths use `process.cwd()`)

### T3.3: Manage Script
**Duration:** 1 day  
**Priority:** P0

---

## Phase 4: Testing & Polish (Days 22-28)

### T4.1: Integration Testing
**Duration:** 2 days  
**Priority:** P0

**Test Scenarios:**

1. **Multi-directory scoping:**
```bash
# Create two test projects
mkdir -p ~/test-proj-a && cd ~/test-proj-a
claude  # Create session
exit

mkdir -p ~/test-proj-b && cd ~/test-proj-b
claude  # Create session
exit

# Test curator sees correct sessions
cd ~/test-proj-a
claude -r context-curator
# Should see only proj-a's sessions

cd ~/test-proj-b
claude -r context-curator
# Should see only proj-b's sessions
```

2. **Session modification:**
```bash
cd ~/test-proj-a
claude -r context-curator
# Test manage, checkpoint, delete commands
```

3. **Error handling:**
```bash
cd ~/empty-directory
claude -r context-curator
# Should handle gracefully (no sessions)
```

### T4.2: Documentation
**Duration:** 1 day  
**Priority:** P0

**README.md** with:
- Quick start guide
- Installation instructions
- Command reference
- Examples
- Troubleshooting

### T4.3: Polish
**Duration:** 1 day  
**Priority:** P1

- Improve error messages
- Better output formatting
- Progress indicators
- Confirmation prompts

---

## Testing Checklist

### Setup
- [ ] `setup.sh` creates session successfully
- [ ] Session can be resumed with `claude -r context-curator`
- [ ] Init script runs and displays correct directory

### Directory Scoping
- [ ] Only sees sessions in current directory
- [ ] Correctly ignores sessions from other directories
- [ ] Works from any directory

### Commands
- [ ] show sessions works (0, 1, many sessions)
- [ ] summarize provides useful analysis
- [ ] checkpoint creates valid session copy
- [ ] delete removes session (with backup)
- [ ] dump displays raw JSONL correctly
- [ ] manage enters interactive mode

### Editor Mode
- [ ] Launches successfully
- [ ] Provides optimization suggestions
- [ ] Stages changes correctly
- [ ] @apply commits changes
- [ ] @undo reverts changes
- [ ] Modified session loads in Claude Code

### Safety
- [ ] Backups created before modifications
- [ ] Confirmations required for destructive ops
- [ ] No data loss in any scenario
- [ ] Clear error messages

---

## Timeline Summary

| Days | Phase | Deliverables |
|------|-------|--------------|
| 1-2 | Setup | Validation, project structure |
| 3-7 | Core | Session creation, basic scripts, CLAUDE.md |
| 8-14 | Analysis | Analyzer, summarize, checkpoint, delete |
| 15-21 | Editor | Interactive editing with @apply/@undo |
| 22-28 | Polish | Testing, documentation, refinement |

**Total: 4 weeks to production-ready MVP**

---

## Success Criteria

### Technical
- Works from any directory
- Correctly scopes to current directory only
- All commands functional
- Zero data loss
- Handles edge cases gracefully

### User Experience
- Easy to install (one command)
- Intuitive to use
- Clear feedback
- Helpful error messages
- Fast execution

### Documentation
- Clear README
- Installation guide
- Command reference
- Examples
- Troubleshooting guide

---

## Launch Checklist

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Tested on macOS and Linux
- [ ] API key handling documented
- [ ] Example workflows documented
- [ ] GitHub repo ready
- [ ] Demo video/GIF created
