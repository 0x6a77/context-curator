# Developer Implementation Plan: Context Curator

**Version:** 7.0
**Timeline:** 2-3 days
**Approach:** Conversational session management using Claude Code's native capabilities

---

## Overview

This plan implements the Context Curator as described in PRD v7.0. The key innovation is that the `manage` command uses Claude Code itself to interactively edit sessions - no API key required. The curator is Claude Code with special instructions and helper scripts.

**Important Note:** Claude Code only has project-specific sessions stored in `~/.claude/projects/<project-dir>/`. All operations are project-scoped.

---

## Completed Work

✅ **Already Implemented:**
- Session reader for project-specific sessions
- Session writer with backups
- Session analyzer with recommendations
- Unified `context` command interface
- Help system
- Init script
- TypeScript compilation working
- Project-only scoping (no named sessions)

---

## Current Architecture

### Session Storage

Claude Code stores sessions in:
```
~/.claude/projects/<project-dir>/<uuid>.jsonl
```

Where `<project-dir>` is computed by replacing `/` with `-`:
```typescript
const projectDir = process.cwd().replace(/\//g, '-');
// /Users/dev/my-project → -Users-dev-my-project
```

### File Structure

```
~/.claude/skills/context-curator/
├── skill.json
├── CLAUDE.md                  # Instructions for curator behavior
├── src/
│   ├── types.ts
│   ├── session-reader.ts      # Reads from ~/.claude/projects/
│   ├── session-writer.ts      # Writes sessions with backups
│   ├── session-analyzer.ts    # Analyzes and recommends optimizations
│   └── utils.ts
├── scripts/
│   ├── init.ts                # Initialization banner
│   ├── context.ts             # Main command dispatcher
│   ├── list.ts                # List sessions
│   ├── analyze.ts             # Analyze session detail
│   ├── checkpoint.ts          # Backup session
│   ├── delete.ts              # Delete session with backup
│   ├── dump.ts                # Show raw JSONL
│   └── help.ts                # Show command help
├── setup.sh                   # One-time setup
├── package.json
└── README.md
```

---

## Command Interface

All commands use the unified syntax:

```bash
context list
context analyze <session-id>
context manage <session-id> <model>
context checkpoint <session-id> <name>
context delete <session-id>
context dump <session-id> [type]
context help
```

---

## Key Innovation: No API Key Required

### The `manage` Command

Unlike traditional approaches that would call the Anthropic API, the `manage` command leverages Claude Code's conversational nature:

1. **The curator is Claude Code** - When you run `claude -r context-curator`, you're talking to Claude Code with special instructions
2. **Claude uses native tools** - Read, Write, Bash tools built into Claude Code
3. **Conversational editing** - You discuss changes naturally, Claude applies them
4. **No external API calls** - Everything happens within the Claude Code session

### How It Works

```
User: "manage sess-abc123"

Curator Claude:
1. Runs analyze script to understand the session
2. Uses Read tool to load the JSONL file
3. Analyzes content and suggests optimizations
4. Discusses with user what to change
5. Shows previews of changes
6. Gets approval
7. Uses Write tool to create edited version
8. Uses Bash to apply changes
9. Confirms success
```

This is fundamentally different from a traditional CLI that would:
- Accept edit commands
- Call Claude API to generate summaries
- Process responses programmatically

Instead, **Claude Code is the interface** - you're having a conversation with an AI that can read and write files.

---

## Implementation Details

### CLAUDE.md (Curator Behavior Instructions)

This file tells Claude Code how to behave when resumed as the context curator:

```markdown
# Context Curator

You are the Context Curator, a specialized assistant for managing Claude Code sessions.

## Initialization

When you first start (or are resumed), run init ONCE to show available sessions:

```bash
npx tsx ~/.claude/skills/context-curator/scripts/init.ts
```

## Your Purpose

You help developers manage Claude Code sessions **for the current project**.

**IMPORTANT**: 
- You manage USER sessions, NOT your own code
- NEVER modify files in ~/.claude/skills/context-curator/
- Focus ONLY on managing the user's Claude Code sessions

### Session Scope

The curator manages project-specific sessions in `~/.claude/projects/<project-dir>/`:
- Format: `<uuid>.jsonl` (flat files)
- Project-specific only

**Project Directory Formula:**
```typescript
const projectDir = process.cwd().replace(/\//g, '-');
```

## Available Commands

All commands use `npx tsx` to preserve working directory context.

### context list
List all sessions for the current project.

```bash
npx tsx ~/.claude/skills/context-curator/scripts/context.ts list
```

### context analyze <session-id>
Analyze a specific session in detail.

```bash
npx tsx ~/.claude/skills/context-curator/scripts/context.ts analyze <session-id>
```

### context manage <session-id> <model>
**This is YOUR specialty - interactive session editing.**

When the user says "manage <session-id>", follow this workflow:

1. **Analyze First**
   ```bash
   npx tsx ~/.claude/skills/context-curator/scripts/context.ts analyze <session-id>
   ```

2. **Read the Session File**
   - Compute project dir: `cwd.replace(/\//g, '-')`
   - Path: `~/.claude/projects/<project-dir>/<session-id>.jsonl`
   - Use Read tool to load the file
   - JSONL format: one message per line

3. **Understand and Suggest**
   - Analyze the messages
   - Identify optimization opportunities:
     * Completed work that can be summarized
     * Failed attempts that can be removed
     * Redundant information
     * Debug logs that can be condensed
   - Explain what you found

4. **Discuss with User**
   - Ask what they want to optimize
   - Listen to natural language instructions:
     * "Remove the failed attempts"
     * "Summarize the first section"
     * "Keep only the last 100 messages"
   - Clarify as needed

5. **Show Preview**
   - Give examples of changes:
     ```
     Before (messages 1-50):
     [1] User: "Help with auth"
     [2] Assistant: "Sure, let's start..."
     ...
     [50] User: "Perfect!"
     
     After:
     [1] User: "Help with auth"
     [2] [SUMMARY: Implemented JWT auth with refresh 
         tokens using jose library...]
     [3] User: "Perfect!"
     ```
   - Show token savings

6. **Get Approval**
   - Wait for explicit confirmation
   - Look for: "yes", "apply", "go ahead", "do it"
   - If user says "no" or "cancel", stop

7. **Apply Changes**
   - Build edited messages array
   - Write to temp file:
     ```bash
     # Use Write tool to create
     /tmp/edited-<session-id>.jsonl
     ```
   - Format: One JSON message per line (JSONL)
   - Run apply script:
     ```bash
     npx tsx ~/.claude/skills/context-curator/scripts/apply-edits.ts \
       <session-id> /tmp/edited-<session-id>.jsonl
     ```

8. **Confirm Success**
   - Show before/after stats
   - Explain what changed
   - Provide resume command

**Important for manage:**
- Always read the actual session file first
- Be conservative - don't remove important context
- Show clear before/after previews
- Get explicit approval before applying
- Maintain valid JSONL format (one message per line)
- Explain your reasoning
- Use the model parameter for any AI operations (if needed)

### context checkpoint <session-id> <new-name>
Create a backup/fork of a session.

```bash
npx tsx ~/.claude/skills/context-curator/scripts/context.ts checkpoint <session-id> <new-name>
```

### context delete <session-id>
Remove a session (creates backup first, requires confirmation).

```bash
npx tsx ~/.claude/skills/context-curator/scripts/context.ts delete <session-id>
```

### context dump <session-id> [type]
Display raw JSONL contents.

```bash
npx tsx ~/.claude/skills/context-curator/scripts/context.ts dump <session-id>
npx tsx ~/.claude/skills/context-curator/scripts/context.ts dump <session-id> user
```

### context help
Show detailed help.

## Command Interpretation

Users may phrase requests differently. Map to commands:

- "show sessions" → context list
- "analyze X" → context analyze X
- "manage X", "optimize X", "clean up X" → context manage X <model>
- "backup X as Y" → context checkpoint X Y
- "delete X" → context delete X
- "dump X" → context dump X

## Session File Format

JSONL - one message per line:
```json
{"role":"user","content":"...","timestamp":"2026-01-08T10:00:00Z"}
{"role":"assistant","content":"...","timestamp":"2026-01-08T10:00:05Z"}
```

## Your Personality

- Helpful and conversational
- Clear about what you're doing
- Ask for confirmation on destructive operations
- Show token savings prominently
- Explain your reasoning
- Guide users through optimization

## Remember

- You manage USER sessions, not your own code
- NEVER modify ~/.claude/skills/context-curator/
- Always operate on the current project only
- Create backups before modifications
- Be safe, helpful, and efficient
```

---

## Script Implementations

### 1. scripts/init.ts

Shows welcome banner and available sessions:

```typescript
#!/usr/bin/env tsx
import { listSessionIds } from '../src/session-reader.js';
import * as path from 'path';

async function main() {
  const cwd = process.cwd();
  const projectDir = cwd.replace(/\//g, '-');
  
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Context Curator Initialized         ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  console.log(`Operating on: ${cwd}`);
  console.log(`Session directory: ~/.claude/projects/${projectDir}\n`);
  
  const sessions = await listSessionIds();
  
  if (sessions.length === 0) {
    console.log('No sessions found for this project.\n');
  } else {
    console.log(`Found ${sessions.length} session(s):\n`);
    sessions.slice(0, 3).forEach(id => {
      console.log(`  • ${id}`);
    });
    if (sessions.length > 3) {
      console.log(`  ... and ${sessions.length - 3} more\n`);
    }
  }
  
  console.log('Available commands:');
  console.log('  context list                  - List all sessions');
  console.log('  context analyze <id>          - Analyze session');
  console.log('  context manage <id> <model>   - Edit session');
  console.log('  context help                  - Show help\n');
}

main().catch(console.error);
```

### 2. scripts/context.ts

Main command dispatcher (already implemented):

```typescript
#!/usr/bin/env tsx
import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command = process.argv[2];
const args = process.argv.slice(3);

const commands: Record<string, string> = {
  'list': 'list.ts',
  'analyze': 'analyze.ts',
  'checkpoint': 'checkpoint.ts',
  'delete': 'delete.ts',
  'dump': 'dump.ts',
  'help': 'help.ts'
};

if (!command || !commands[command]) {
  console.error('\nUsage: context <command> [args]\n');
  console.error('Commands:');
  console.error('  list                           List all sessions');
  console.error('  analyze <session-id>           Analyze a session');
  console.error('  manage <session-id> <model>    Edit session (handled by curator)');
  console.error('  checkpoint <session-id> <name> Backup a session');
  console.error('  delete <session-id>            Remove a session');
  console.error('  dump <session-id> [type]       View raw session data');
  console.error('  help                           Show detailed help\n');
  process.exit(1);
}

// Execute the command script
const scriptPath = path.join(__dirname, commands[command]);
const proc = spawn('tsx', [scriptPath, ...args], {
  stdio: 'inherit',
  shell: false
});

proc.on('exit', (code) => {
  process.exit(code || 0);
});
```

Note: There is no `scripts/manage.ts` - the manage command is handled conversationally by the curator itself using its native Read, Write, and Bash tools.

### 3. scripts/apply-edits.ts

Applied after the curator creates an edited session:

```typescript
#!/usr/bin/env tsx
import * as fs from 'fs/promises';
import * as path from 'path';

async function getProjectSessionsDir(): Promise<string> {
  const cwd = process.cwd();
  const projectDir = cwd.replace(/\//g, '-');
  const homeDir = process.env.HOME!;
  return path.join(homeDir, '.claude', 'projects', projectDir);
}

async function main() {
  const [sessionId, editedPath] = process.argv.slice(2);
  
  if (!sessionId || !editedPath) {
    console.error('Usage: apply-edits <session-id> <edited-file-path>');
    process.exit(1);
  }
  
  console.log('Applying edits...');
  
  // Read edited version
  const editedContent = await fs.readFile(editedPath, 'utf-8');
  const editedMessages = editedContent
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        throw new Error(`Invalid JSON on line: ${line.substring(0, 50)}...`);
      }
    });
  
  // Validate
  if (editedMessages.length === 0) {
    throw new Error('Edited session is empty');
  }
  
  // Backup original
  const timestamp = new Date().toISOString().split('T')[0];
  const backupFilename = `${sessionId}.backup-${timestamp}.jsonl`;
  const sessionsDir = await getProjectSessionsDir();
  const originalPath = path.join(sessionsDir, `${sessionId}.jsonl`);
  const backupPath = path.join(sessionsDir, backupFilename);
  
  console.log('Creating backup...');
  await fs.copyFile(originalPath, backupPath);
  console.log(`✓ Backup: ${backupFilename}`);
  
  // Write edited version
  console.log('Writing edited version...');
  const editedJSONL = editedMessages.map(m => JSON.stringify(m)).join('\n');
  await fs.writeFile(originalPath, editedJSONL, 'utf-8');
  console.log('✓ Session updated');
  
  // Cleanup temp file
  await fs.unlink(editedPath);
  
  // Stats
  const originalSize = (await fs.stat(backupPath)).size;
  const newSize = (await fs.stat(originalPath)).size;
  const savings = originalSize - newSize;
  const pct = Math.round((savings / originalSize) * 100);
  
  console.log('\nDone!');
  console.log(`Size: ${originalSize} → ${newSize} bytes`);
  console.log(`Saved: ${savings} bytes (${pct}%)`);
}

main().catch(err => {
  console.error('Error applying edits:', err.message);
  process.exit(1);
});
```

### 4. Other Scripts

The following scripts are already implemented and don't need changes:

- `scripts/list.ts` - Lists sessions for current project
- `scripts/analyze.ts` - Analyzes a session with recommendations
- `scripts/checkpoint.ts` - Creates session backups
- `scripts/delete.ts` - Deletes sessions with backup
- `scripts/dump.ts` - Shows raw JSONL contents
- `scripts/help.ts` - Shows detailed help

---

## Session Reader Implementation

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
 * Get session storage path for current project
 */
function getSessionPath() {
  const cwd = process.cwd();
  const projectDir = getProjectDir(cwd);
  const homeDir = process.env.HOME!;

  return {
    sessionsDir: path.join(homeDir, '.claude', 'projects', projectDir),
    projectDir,
    cwd
  };
}

/**
 * List all session IDs for current project
 */
export async function listSessionIds(): Promise<string[]> {
  const { sessionsDir } = getSessionPath();

  try {
    const entries = await fs.readdir(sessionsDir);
    return entries
      .filter(e => {
        // UUID pattern: starts with hex chars and ends with .jsonl
        return e.endsWith('.jsonl') &&
               !e.startsWith('agent-') &&
               /^[0-9a-f]{8}-/.test(e);
      })
      .map(e => e.replace('.jsonl', ''));
  } catch (err) {
    // No sessions for this project
    return [];
  }
}

/**
 * Read a session by ID
 */
export async function readSession(sessionId: string): Promise<Session> {
  const { sessionsDir, cwd } = getSessionPath();
  const sessionPath = path.join(sessionsDir, `${sessionId}.jsonl`);

  try {
    await fs.access(sessionPath);
  } catch {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Read conversation
  const content = await fs.readFile(sessionPath, 'utf-8');
  const messages: Message[] = content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));

  // Get metadata from file stats
  const stats = await fs.stat(sessionPath);
  const metadata = {
    createdAt: stats.birthtime.toISOString(),
    updatedAt: stats.mtime.toISOString()
  };

  return {
    id: sessionId,
    messages,
    metadata,
    messageCount: messages.length,
    tokenCount: estimateTokens(messages),
    directory: cwd
  };
}

function estimateTokens(messages: Message[]): number {
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

## Testing Checklist

### Command Interface
- [ ] `npx tsx scripts/init.ts` shows banner and sessions
- [ ] `npx tsx scripts/context.ts list` works
- [ ] `npx tsx scripts/context.ts analyze <id>` works
- [ ] `npx tsx scripts/context.ts checkpoint <id> <name>` works
- [ ] `npx tsx scripts/context.ts delete <id>` works
- [ ] `npx tsx scripts/context.ts dump <id>` works
- [ ] `npx tsx scripts/context.ts help` works
- [ ] Invalid commands show helpful error

### Conversational Manage
- [ ] Curator runs analyze when user says "manage X"
- [ ] Curator uses Read tool to load session file
- [ ] Curator suggests optimizations
- [ ] Curator responds to natural language edit requests
- [ ] Curator shows previews before applying
- [ ] Curator gets explicit confirmation
- [ ] Curator uses Write tool to create edited version
- [ ] Curator runs apply-edits script
- [ ] Curator shows success statistics

### Session Management
- [ ] Discovers sessions for current project only
- [ ] Project directory formula works correctly
- [ ] Correctly filters out agent sessions
- [ ] Handles missing directories gracefully
- [ ] Sessions from different projects are isolated

### Safety
- [ ] Backups created before modifications
- [ ] Confirmations required for destructive ops
- [ ] No data loss in any scenario
- [ ] Clear error messages

---

## Migration from Previous Versions

### Removed Components

The following are **NOT** part of v7.0:

- ❌ `src/editor.ts` - No longer needed, curator handles editing conversationally
- ❌ `scripts/manage.ts` - No separate script needed
- ❌ Anthropic API integration - Uses Claude Code's native capabilities
- ❌ API key requirements - Everything works within Claude Code

### What Changed

**Before (v6.x):**
- `manage` command would call a script
- Script would use Anthropic API for summaries
- Programmatic editing logic

**After (v7.0):**
- `manage` is handled conversationally by curator
- Curator uses Read/Write tools built into Claude Code
- Natural language editing interface
- No API calls needed

---

## File Changes Summary

### Created Files
- `scripts/init.ts` - Initialization banner
- `scripts/apply-edits.ts` - Apply edited sessions

### Removed Files
- `src/editor.ts` - No longer needed
- `scripts/manage.ts` - Handled conversationally

### Modified Files
- `CLAUDE.md` - Detailed instructions for conversational manage
- `scripts/context.ts` - Note that manage is handled by curator
- `package.json` - Updated version to 0.3.0, removed editor dependencies
- All documentation updated to reflect conversational approach

---

## Success Criteria

### Technical
- [ ] No Anthropic API integration needed
- [ ] Curator can read sessions with Read tool
- [ ] Curator can write sessions with Write tool
- [ ] Curator can run scripts with Bash tool
- [ ] All commands work via conversational interface
- [ ] TypeScript compilation passes
- [ ] Project-scoped sessions only

### User Experience
- [ ] Natural language editing feels intuitive
- [ ] Clear previews before changes
- [ ] Explicit confirmation required
- [ ] Token savings clearly shown
- [ ] Safe and reversible operations
- [ ] Project isolation is clear

### Documentation
- [ ] CLAUDE.md provides clear manage workflow
- [ ] All docs reflect conversational approach
- [ ] No references to API keys
- [ ] Comprehensive examples

---

## Launch Checklist

- [ ] `scripts/init.ts` implemented
- [ ] `scripts/apply-edits.ts` implemented
- [ ] `CLAUDE.md` updated with manage workflow
- [ ] `src/editor.ts` removed
- [ ] `scripts/manage.ts` removed
- [ ] API dependencies removed from package.json
- [ ] All docs updated
- [ ] All tests passing
- [ ] TypeScript compilation clean
- [ ] Version bumped to 0.3.0

---

## Notes

### Key Innovation

The fundamental insight of v7.0 is that **Claude Code is already an AI assistant that can manipulate files**. Instead of building a separate tool that calls the API, we leverage Claude Code's conversational nature:

- User talks to the curator naturally
- Curator uses its built-in tools (Read, Write, Bash)
- No API overhead or key management
- More intuitive interface
- Same AI capabilities, simpler architecture

### Why This Works

Claude Code sessions already have:
- ✅ Anthropic API access (built-in)
- ✅ File system tools (Read, Write)
- ✅ Command execution (Bash)
- ✅ Conversational interface
- ✅ Long context understanding

We're just giving Claude Code:
- Instructions (CLAUDE.md)
- Helper scripts (list, analyze, etc.)
- A specific domain (session management)

### Architecture Philosophy

**Don't build what you already have.**

Traditional approach: Build CLI → Call API → Process results
Context Curator approach: Talk to Claude → Claude uses its tools → Done

This is simpler, more powerful, and requires no API key management.
