# Developer Implementation Plan: Claude Code Context Curator

**Version:** 5.0 (Final)
**Timeline:** 3-4 weeks to MVP
**Approach:** Global skill with dual session management (named + unnamed)

---

## Architecture Summary

**Core Concept**: A global skill that only activates from the "context-curator" session, managing both named sessions and unnamed project sessions.

**Key Files**:
- `~/.claude/skills/context-curator/` - Skill installation directory
- `~/.claude/sessions/context-curator/` - The curator session

**Invocation**: `claude -r context-curator` from any project directory

**Session Management**:
- Named sessions: `~/.claude/sessions/<session-id>/`
- Unnamed sessions: `~/.claude/projects/<project-dir>/`
- Project directory formula: `projectDir = fullPath.replace(/\//g, '-')`

---

## Phase 0: Setup & Validation (Days 1-2)

### Goals
- Understand Claude Code skills system
- Validate session resumption mechanics
- Test project directory formula
- Create project skeleton

### Tasks

#### T0.1: Validate Skills System
**Duration:** 3 hours
**Priority:** P0

**Test Plan:**
```bash
# 1. Create a test skill
mkdir -p ~/.claude/skills/test-skill
cat > ~/.claude/skills/test-skill/skill.json << 'EOF'
{
  "name": "test-skill",
  "version": "0.1.0",
  "description": "Test skill",
  "trigger": {
    "sessionId": "test-session"
  }
}
EOF

# 2. Create a test session
mkdir -p ~/.claude/sessions/test-session
cat > ~/.claude/sessions/test-session/conversation.jsonl << 'EOF'
{"role":"user","content":"Hello"}
{"role":"assistant","content":"Test skill active!"}
EOF

# 3. Test resumption
claude -r test-session

# Expected: Session resumes and skill is available
```

**Questions to Answer:**
- [ ] How does Claude Code discover skills?
- [ ] Does `trigger.sessionId` restrict skill availability?
- [ ] Can skills access npm scripts?
- [ ] How are skill commands invoked?

#### T0.2: Validate Project Directory Formula
**Duration:** 1 hour
**Priority:** P0

**Test Plan:**
```bash
# Test the formula
node -e "
const cwd = process.cwd();
const projectDir = cwd.replace(/\//g, '-');
console.log('CWD:', cwd);
console.log('Project Dir:', projectDir);
console.log('Full Path:', \`~/.claude/projects/\${projectDir}/\`);
"

# Check if this matches actual Claude Code behavior
ls -la ~/.claude/projects/

# Verify the formula is correct
```

**Validation:**
- [ ] Formula matches Claude Code's directory naming
- [ ] Can read unnamed sessions from projects directory
- [ ] Can distinguish between named and unnamed sessions

#### T0.3: Test Session Types Discovery
**Duration:** 2 hours
**Priority:** P0

**Test Plan:**
```bash
# 1. List named sessions
ls -la ~/.claude/sessions/

# 2. List unnamed sessions for current project
PROJECT_DIR=$(pwd | tr '/' '-')
ls -la ~/.claude/projects/$PROJECT_DIR/

# 3. Test reading both types
# Named: Read conversation.jsonl from directory
# Unnamed: Read UUID.jsonl flat file

# 4. Verify they have different structures
```

**Validation:**
- [ ] Can distinguish named vs unnamed sessions
- [ ] Can read both formats
- [ ] Can extract metadata from both

#### T0.4: Project Initialization
**Duration:** 2 hours
**Priority:** P0

```bash
# Create structure (this will be the git repo root)
mkdir -p ~/.claude/skills/context-curator
cd ~/.claude/skills/context-curator

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
~/.claude/skills/context-curator/
├── skill.json             # Skill manifest
├── CLAUDE.md              # Skill instructions
├── src/
│   ├── types.ts
│   ├── session-reader.ts  # Reads named + unnamed
│   ├── session-writer.ts
│   ├── session-analyzer.ts
│   ├── editor.ts
│   └── utils.ts
├── scripts/
│   ├── init.ts            # Run on session resume
│   ├── show-sessions.ts   # Shows both types
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

## Phase 1: Skill Setup & Core Scripts (Days 3-7)

### Tasks

#### T1.1: Skill Manifest
**Duration:** 1 hour
**Priority:** P0

**File: skill.json**
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

**Notes:**
- `trigger.sessionId` ensures skill only activates from context-curator session
- Commands list helps with discoverability

#### T1.2: Setup Script
**Duration:** 4 hours
**Priority:** P0

**File: setup.sh**
```bash
#!/bin/bash
set -e

echo "🚀 Setting up Claude Code Context Curator..."
echo ""

# Create the context-curator session
SESSION_DIR=~/.claude/sessions/context-curator
echo "📁 Creating session..."
mkdir -p "$SESSION_DIR"

# Create initial conversation
cat > "$SESSION_DIR/conversation.jsonl" << 'JSONL'
{"role":"system","content":"You have access to the context-curator skill. This skill helps manage Claude Code sessions for the current project."}
{"role":"user","content":"Initialize"}
{"role":"assistant","content":"Context Curator ready. I can help manage your Claude Code sessions. Type 'help' to see available commands."}
JSONL

# Create metadata
cat > "$SESSION_DIR/metadata.json" << METADATA
{
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "projectPath": "$HOME/.claude/skills/context-curator"
}
METADATA

echo "✓ Session created: context-curator"
echo ""

# Verify installation
echo "🧪 Verifying installation..."
if [ -f "$SESSION_DIR/conversation.jsonl" ]; then
  echo "✓ Session created"
else
  echo "❌ Session not created"
  exit 1
fi

if [ -f "skill.json" ]; then
  echo "✓ Skill manifest exists"
else
  echo "❌ Skill manifest not found"
  exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Usage:"
echo "  cd ~/any-project"
echo "  claude -r context-curator"
echo ""
echo "Commands:"
echo "  show sessions"
echo "  summarize <session-id>"
echo "  manage <session-id> <model>"
echo ""
```

#### T1.3: Types Definition
**Duration:** 2 hours
**Priority:** P0

**File: src/types.ts**
```typescript
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | any;  // Can be string or structured content
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
  isNamed: boolean;      // NEW: Distinguish session types
  directory: string;     // Which directory this session belongs to
}

export interface SessionList {
  named: string[];       // NEW: Named session IDs
  unnamed: string[];     // NEW: Unnamed session UUIDs
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

#### T1.4: Session Reader (Named + Unnamed)
**Duration:** 6 hours
**Priority:** P0

**File: src/session-reader.ts**
```typescript
import * as path from 'path';
import * as fs from 'fs/promises';
import { Session, Message, SessionMetadata, SessionList } from './types.js';

/**
 * Project directory naming formula
 * /Users/dev/my-project → -Users-dev-my-project
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
  const homeDir = process.env.HOME!;

  return {
    namedSessionsDir: path.join(homeDir, '.claude', 'sessions'),
    unnamedSessionsDir: path.join(homeDir, '.claude', 'projects', projectDir),
    projectDir,
    cwd
  };
}

/**
 * List all session IDs (named + unnamed for current project)
 */
export async function listSessionIds(): Promise<SessionList> {
  const { namedSessionsDir, unnamedSessionsDir } = getSessionPaths();

  // Named sessions
  let named: string[] = [];
  try {
    const entries = await fs.readdir(namedSessionsDir);
    named = entries.filter(e => {
      // Filter out agent sessions, only real named sessions
      return !e.startsWith('agent-') && !e.startsWith('.');
    });
  } catch (err) {
    // No named sessions directory
  }

  // Unnamed sessions for this project
  let unnamed: string[] = [];
  try {
    const entries = await fs.readdir(unnamedSessionsDir);
    unnamed = entries
      .filter(e => {
        // UUID pattern: starts with hex chars and ends with .jsonl
        return e.endsWith('.jsonl') &&
               !e.startsWith('agent-') &&
               /^[0-9a-f]{8}-/.test(e);
      })
      .map(e => e.replace('.jsonl', ''));
  } catch (err) {
    // No unnamed sessions for this project
  }

  return { named, unnamed };
}

/**
 * Read a session (auto-detect named vs unnamed)
 */
export async function readSession(sessionId: string): Promise<Session> {
  const { namedSessionsDir, unnamedSessionsDir } = getSessionPaths();

  // Try named first (directory structure)
  const namedPath = path.join(namedSessionsDir, sessionId, 'conversation.jsonl');
  const unnamedPath = path.join(unnamedSessionsDir, `${sessionId}.jsonl`);

  let jsonlPath: string;
  let isNamed: boolean;

  try {
    await fs.access(namedPath);
    jsonlPath = namedPath;
    isNamed = true;
  } catch {
    // Try unnamed (flat file)
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

  // Read metadata
  let metadata: SessionMetadata;
  if (isNamed) {
    // Named sessions have metadata.json
    try {
      const metadataPath = path.join(namedSessionsDir, sessionId, 'metadata.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(metadataContent);
    } catch {
      metadata = {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  } else {
    // Unnamed sessions: use file stats
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

/**
 * Check if session exists
 */
export async function sessionExists(sessionId: string): Promise<boolean> {
  try {
    await readSession(sessionId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Estimate tokens (rough approximation)
 */
function estimateTokens(messages: Message[]): number {
  // ~4 chars per token
  const totalChars = messages.reduce((sum, msg) => {
    const content = typeof msg.content === 'string'
      ? msg.content
      : JSON.stringify(msg.content);
    return sum + content.length;
  }, 0);
  return Math.ceil(totalChars / 4);
}
```

#### T1.5: Init Script
**Duration:** 3 hours
**Priority:** P0

**File: scripts/init.ts**
```typescript
#!/usr/bin/env tsx
import * as path from 'path';
import { listSessionIds } from '../src/session-reader.js';

function getProjectDir(cwd: string): string {
  return cwd.replace(/\//g, '-');
}

async function main() {
  const cwd = process.cwd();
  const projectDir = getProjectDir(cwd);

  console.log('\n' + '═'.repeat(70));
  console.log('  Context Curator - Session Manager');
  console.log('═'.repeat(70));
  console.log(`📁 Operating on: ${cwd}`);
  console.log(`🔧 Project dir:  ${projectDir}`);
  console.log('');

  // List sessions
  const { named, unnamed } = await listSessionIds();

  console.log(`Found ${named.length} named session(s)`);
  console.log(`Found ${unnamed.length} unnamed session(s) for this project`);
  console.log('');

  if (named.length > 0) {
    console.log('Recent named sessions:');
    for (const id of named.slice(0, 3)) {
      console.log(`  • ${id}`);
    }
    if (named.length > 3) {
      console.log(`  ... and ${named.length - 3} more`);
    }
    console.log('');
  }

  if (unnamed.length > 0) {
    console.log('Recent unnamed sessions:');
    for (const id of unnamed.slice(0, 3)) {
      console.log(`  • ${id.slice(0, 24)}...`);
    }
    if (unnamed.length > 3) {
      console.log(`  ... and ${unnamed.length - 3} more`);
    }
    console.log('');
  }

  if (named.length === 0 && unnamed.length === 0) {
    console.log('⚠️  No sessions found');
    console.log('   Start a session with: claude');
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

#### T1.6: Show Sessions Script
**Duration:** 4 hours
**Priority:** P0

**File: scripts/show-sessions.ts**
```typescript
#!/usr/bin/env tsx
import { listSessionIds, readSession } from '../src/session-reader.js';

async function main() {
  const cwd = process.cwd();
  const { named, unnamed } = await listSessionIds();

  if (named.length === 0 && unnamed.length === 0) {
    console.log('\nNo sessions found.');
    console.log('Start a session with: claude\n');
    return;
  }

  console.log(`\nSessions for ${cwd}:\n`);

  // Show named sessions
  if (named.length > 0) {
    console.log('Named Sessions:');
    console.log('─'.repeat(70));

    const namedSessions = await Promise.all(
      named.map(async id => {
        try {
          return await readSession(id);
        } catch {
          return null;
        }
      })
    );

    const validNamed = namedSessions.filter(s => s !== null);
    validNamed.sort((a, b) =>
      new Date(b!.metadata.updatedAt).getTime() -
      new Date(a!.metadata.updatedAt).getTime()
    );

    for (let i = 0; i < validNamed.length; i++) {
      const session = validNamed[i]!;
      const label = i === 0 ? ' [most recent named]' : '';
      printSession(session, label);
    }
    console.log();
  }

  // Show unnamed sessions
  if (unnamed.length > 0) {
    console.log('Unnamed Sessions:');
    console.log('─'.repeat(70));

    const unnamedSessions = await Promise.all(
      unnamed.map(async id => {
        try {
          return await readSession(id);
        } catch {
          return null;
        }
      })
    );

    const validUnnamed = unnamedSessions.filter(s => s !== null);
    validUnnamed.sort((a, b) =>
      new Date(b!.metadata.updatedAt).getTime() -
      new Date(a!.metadata.updatedAt).getTime()
    );

    for (let i = 0; i < validUnnamed.length; i++) {
      const session = validUnnamed[i]!;
      const label = i === 0 ? ' [current]' : '';
      printSession(session, label);
    }
  }
}

function printSession(session: any, label: string) {
  const percentCapacity = (session.tokenCount / 200000) * 100;
  const capacityWarning = percentCapacity > 70 ? ' ⚠️ HIGH' : '';

  console.log(`${session.id}${label}`);
  console.log(`├─ ${session.messageCount} messages, ${(session.tokenCount / 1000).toFixed(0)}k tokens (${percentCapacity.toFixed(1)}%)${capacityWarning}`);
  console.log(`├─ Updated: ${formatRelativeTime(session.metadata.updatedAt)}`);

  // Show first user message as preview
  const firstUserMsg = session.messages.find((m: any) => m.role === 'user');
  const content = firstUserMsg?.content;
  const preview = typeof content === 'string'
    ? content.slice(0, 60)
    : (content ? JSON.stringify(content).slice(0, 60) : '(no messages)');

  console.log(`└─ Task: ${preview}${preview.length >= 60 ? '...' : ''}`);
  console.log();
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

#### T1.7: CLAUDE.md
**Duration:** 2 hours
**Priority:** P0

**File: CLAUDE.md**

(Use the exact content from PRD v5.0 section "### CLAUDE.md")

---

## Phase 2: Analysis & Optimization (Days 8-14)

### T2.1: Session Analyzer
**Duration:** 1 day
**Priority:** P0

**File: src/session-analyzer.ts**

Key updates:
- Handle both named and unnamed sessions
- Work with structured content (not just strings)
- Detect task boundaries
- Calculate token distributions

### T2.2: Summarize Script
**Duration:** 4 hours
**Priority:** P0

**File: scripts/summarize.ts**
```typescript
#!/usr/bin/env tsx
import { readSession } from '../src/session-reader.js';
import { analyzeSession } from '../src/session-analyzer.js';

async function main() {
  const sessionId = process.argv[2];

  if (!sessionId) {
    console.error('Usage: npm run summarize <session-id>');
    process.exit(1);
  }

  console.log(`\nAnalyzing session: ${sessionId}\n`);

  try {
    const session = await readSession(sessionId);
    const analysis = await analyzeSession(session);

    console.log(`Session Type: ${session.isNamed ? 'Named' : 'Unnamed'}`);
    console.log(`Messages: ${session.messageCount}`);
    console.log(`Tokens: ${session.tokenCount.toLocaleString()}`);
    console.log(`Capacity: ${((session.tokenCount / 200000) * 100).toFixed(1)}%`);
    console.log('');

    // Show task breakdown
    console.log('Task Breakdown:');
    console.log('─'.repeat(70));
    for (const task of analysis.tasks) {
      console.log(`\nMessages ${task.startIndex}-${task.endIndex}`);
      console.log(`├─ ${task.messageCount} messages, ${task.tokenCount} tokens`);
      console.log(`├─ Status: ${task.status}`);
      console.log(`└─ Task: ${task.firstPrompt.slice(0, 60)}...`);
    }

    // Show recommendations
    if (analysis.recommendations.length > 0) {
      console.log('\n\nRecommendations:');
      console.log('─'.repeat(70));
      for (const rec of analysis.recommendations) {
        console.log(`\n⚠️  ${rec.description}`);
        console.log(`   Potential savings: ${rec.tokenSavings} tokens`);
      }
    }

    console.log('\n');
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
```

### T2.3: Session Writer
**Duration:** 4 hours
**Priority:** P0

**File: src/session-writer.ts**

Key updates:
- Support writing both named and unnamed sessions
- Auto-detect session type from ID
- Handle metadata appropriately for each type
- Create backups before modifications

### T2.4: Checkpoint Script
**Duration:** 3 hours
**Priority:** P0

**File: scripts/checkpoint.ts**
```typescript
#!/usr/bin/env tsx
import { readSession } from '../src/session-reader.js';
import { writeSession } from '../src/session-writer.js';

async function main() {
  const sourceId = process.argv[2];
  const newName = process.argv[3];

  if (!sourceId || !newName) {
    console.error('Usage: npm run checkpoint <session-id> <new-name>');
    process.exit(1);
  }

  console.log(`\nCreating checkpoint: ${sourceId} → ${newName}\n`);

  try {
    // Read source session (can be named or unnamed)
    const session = await readSession(sourceId);

    console.log(`Source: ${sourceId} (${session.isNamed ? 'named' : 'unnamed'})`);
    console.log(`Target: ${newName} (will be named)`);
    console.log('');

    // Write as named session
    await writeSession(newName, session.messages, true);

    console.log(`✓ Checkpoint created: ${newName}`);
    console.log('');
    console.log(`Resume with: claude -r ${newName}`);
    console.log('');
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
```

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

**File: src/editor.ts**

Key updates:
- Work with both named and unnamed sessions
- Handle structured message content
- Support @apply and @undo commands
- Show clear before/after states

### T3.3: Manage Script
**Duration:** 1 day
**Priority:** P0

**File: scripts/manage.ts**
```typescript
#!/usr/bin/env tsx
import { readSession } from '../src/session-reader.js';
import { SessionEditor } from '../src/editor.js';

async function main() {
  const sessionId = process.argv[2];
  const model = process.argv[3] as 'sonnet' | 'opus' | 'haiku';

  if (!sessionId || !model) {
    console.error('Usage: npm run manage <session-id> <model>');
    process.exit(1);
  }

  console.log(`\nLaunching editor for session: ${sessionId}`);
  console.log(`Model: ${model}\n`);

  try {
    const session = await readSession(sessionId);
    console.log(`Session type: ${session.isNamed ? 'Named' : 'Unnamed'}`);
    console.log(`Messages: ${session.messageCount}`);
    console.log(`Tokens: ${session.tokenCount.toLocaleString()}`);
    console.log('');

    const editor = new SessionEditor(session, model);
    await editor.start();
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
```

---

## Phase 4: Testing & Polish (Days 22-28)

### T4.1: Integration Testing
**Duration:** 2 days
**Priority:** P0

**Test Scenarios:**

1. **Skill activation:**
```bash
# Should only work from context-curator session
claude -r context-curator
# Commands should be available

# Should NOT work from other sessions
claude -r some-other-session
# Commands should not be available
```

2. **Named vs Unnamed sessions:**
```bash
# Create named session
mkdir -p ~/.claude/sessions/test-named
echo '{"role":"user","content":"test"}' > ~/.claude/sessions/test-named/conversation.jsonl

# Create unnamed session (simulate)
PROJECT_DIR=$(pwd | tr '/' '-')
mkdir -p ~/.claude/projects/$PROJECT_DIR
echo '{"role":"user","content":"test"}' > ~/.claude/projects/$PROJECT_DIR/abc123.jsonl

# Test curator sees both
claude -r context-curator
# show sessions should list both types separately
```

3. **Project directory scoping:**
```bash
# Test in different directories
cd ~/project-a
claude -r context-curator
# Should see project-a's unnamed sessions

cd ~/project-b
claude -r context-curator
# Should see project-b's unnamed sessions
# Should still see all named sessions
```

4. **Session operations:**
```bash
# Test all commands on both session types
cd ~/test-project
claude -r context-curator

# Test on unnamed session
show sessions
summarize <uuid>
manage <uuid> sonnet
checkpoint <uuid> backup-name
delete <uuid>

# Test on named session
summarize test-named
checkpoint test-named backup-named
```

5. **Error handling:**
```bash
# Directory with no sessions
mkdir ~/empty-dir && cd ~/empty-dir
claude -r context-curator
# Should handle gracefully

# Invalid session ID
claude -r context-curator
summarize non-existent-session
# Should show clear error
```

### T4.2: Documentation
**Duration:** 1 day
**Priority:** P0

**README.md** with:
- Quick start guide
- Installation instructions
- Session types explanation
- Command reference
- Examples for both named and unnamed sessions
- Troubleshooting

### T4.3: Polish
**Duration:** 1 day
**Priority:** P1

- Improve error messages
- Better output formatting
- Progress indicators
- Confirmation prompts
- Session type indicators

---

## Testing Checklist

### Setup
- [ ] Repository cloned to `~/.claude/skills/context-curator`
- [ ] `setup.sh` creates session successfully
- [ ] Skill files exist in `~/.claude/skills/context-curator`
- [ ] Session can be resumed with `claude -r context-curator`
- [ ] Init script runs and displays correct info

### Skill Behavior
- [ ] Skill only activates from context-curator session
- [ ] Commands not available in other sessions
- [ ] Can invoke npm scripts from skill

### Session Discovery
- [ ] Discovers named sessions
- [ ] Discovers unnamed sessions for current project
- [ ] Project directory formula works correctly
- [ ] Correctly filters out agent sessions
- [ ] Handles missing directories gracefully

### Session Operations
- [ ] Can read both named and unnamed sessions
- [ ] show sessions displays both types separately
- [ ] summarize works on both types
- [ ] checkpoint converts unnamed to named
- [ ] delete works on both types (with backup)
- [ ] dump displays correct format for each type

### Directory Scoping
- [ ] Named sessions visible from all directories
- [ ] Unnamed sessions scoped to current project
- [ ] Changing directories shows correct unnamed sessions
- [ ] Project dir formula handles all path types

### Editor Mode
- [ ] Works on both session types
- [ ] Handles structured message content
- [ ] @apply commits changes correctly
- [ ] @undo reverts changes
- [ ] Modified sessions load in Claude Code
- [ ] Preserves session type after modification

### Safety
- [ ] Backups created before modifications
- [ ] Confirmations required for destructive ops
- [ ] No data loss in any scenario
- [ ] Clear error messages
- [ ] Session type preserved through operations

---

## Timeline Summary

| Days | Phase | Deliverables |
|------|-------|--------------|
| 1-2 | Setup | Skill validation, project structure |
| 3-7 | Core | Skill manifest, dual session reader, basic scripts |
| 8-14 | Analysis | Analyzer, summarize, checkpoint, delete |
| 15-21 | Editor | Interactive editing with @apply/@undo |
| 22-28 | Polish | Testing, documentation, refinement |

**Total: 4 weeks to production-ready MVP**

---

## Success Criteria

### Technical
- Skill only activates from context-curator session
- Correctly handles named and unnamed sessions
- Project directory formula works correctly
- All commands functional on both session types
- Zero data loss
- Handles edge cases gracefully

### User Experience
- Easy to install (one command)
- Clear distinction between session types
- Intuitive to use
- Clear feedback
- Helpful error messages
- Fast execution

### Documentation
- Clear README
- Installation guide
- Session types explained
- Command reference
- Examples for both types
- Troubleshooting guide

---

## Launch Checklist

- [ ] All tests passing
- [ ] Both session types work correctly
- [ ] Project directory formula validated
- [ ] Documentation complete
- [ ] Tested on macOS and Linux
- [ ] API key handling documented
- [ ] Example workflows documented
- [ ] GitHub repo ready (with instructions to clone to `~/.claude/skills/`)
- [ ] Demo video/GIF created
- [ ] Skill manifest correct
- [ ] Installation instructions clear
