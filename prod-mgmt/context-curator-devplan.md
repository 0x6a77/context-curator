# Developer Implementation Plan: Unified Context Command Interface

**Version:** 6.1
**Timeline:** 2-3 days
**Approach:** Refactor to unified `context <command>` syntax

---

## Overview

This plan implements the unified command interface where all curator operations use the `context` prefix. The core functionality (session reading, analysis, editor) is already implemented. This refactoring focuses on the command interface layer.

**Important Note:** Claude Code only has project-specific sessions stored in `~/.claude/projects/<project-dir>/`. There are no "named" or "global" sessions.

---

## Completed Work

✅ **Already Implemented:**
- Session reader for project-specific sessions
- Session writer with backups
- Session analyzer with recommendations
- Interactive editor with Claude API
- All individual command scripts
- TypeScript compilation working
- Help system
- Init script optimized
- Unified `context` command interface

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
├── src/
│   ├── types.ts
│   ├── session-reader.ts      # Reads from ~/.claude/projects/
│   ├── session-writer.ts
│   ├── session-analyzer.ts
│   └── editor.ts
├── scripts/
│   ├── context.ts             # Main dispatcher
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

## Implementation Details

### Main Entry Point

**scripts/context.ts:**
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
  'manage': 'manage.ts',
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
  console.error('  manage <session-id> <model>    Edit session interactively');
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

### Session Reader

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

### Command Dispatcher
- [x] `npm run context` shows usage
- [x] `npm run context help` works
- [x] `npm run context list` works
- [x] `npm run context analyze <id>` works
- [x] `npm run context manage <id> <model>` works
- [x] `npm run context checkpoint <id> <name>` works
- [x] `npm run context delete <id>` works
- [x] `npm run context dump <id>` works
- [x] Invalid commands show helpful error

### Session Management
- [x] Discovers sessions for current project only
- [x] Project directory formula works correctly
- [x] Correctly filters out agent sessions
- [x] Handles missing directories gracefully
- [x] Sessions from different projects are isolated

### Safety
- [x] Backups created before modifications
- [x] Confirmations required for destructive ops
- [x] No data loss in any scenario
- [x] Clear error messages

---

## File Changes Summary

### Created Files
- `scripts/context.ts` - Main command dispatcher

### Renamed Files
- `scripts/show-sessions.ts` → `scripts/list.ts`
- `scripts/summarize.ts` → `scripts/analyze.ts`

### Modified Files
- `package.json` - Updated scripts and version to 0.2.0
- `src/session-reader.ts` - Simplified to only read project sessions
- `src/types.ts` - Removed `isNamed` field
- All documentation files updated to remove named sessions

### Removed Concepts
- Named sessions at `~/.claude/sessions/`
- Session type distinction (everything is project-scoped)
- Global session accessibility

---

## Success Criteria

### Technical
- Single entry point (`context.ts`) routes all commands
- All commands work with new syntax
- TypeScript compilation passes
- Project-scoped sessions only
- No references to non-existent named sessions

### User Experience
- Intuitive command structure
- Consistent syntax across all operations
- Clear error messages with command suggestions
- Project isolation is clear

### Documentation
- All docs reflect project-only sessions
- No references to ~/.claude/sessions/
- Clear migration examples
- Comprehensive help command

---

## Launch Checklist

- [x] `scripts/context.ts` implemented
- [x] Scripts renamed (show-sessions → list, summarize → analyze)
- [x] `package.json` updated
- [x] All docs updated to remove named sessions
- [x] All tests passing
- [x] TypeScript compilation clean
- [x] Version bumped to 0.2.0

---

## Notes

- **Critical Fix**: Removed incorrect concept of "named sessions" at `~/.claude/sessions/`
- Claude Code only stores sessions in `~/.claude/projects/<project-dir>/`
- All sessions are project-scoped automatically
- Simplified architecture with single session storage location
