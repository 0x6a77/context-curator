# Product Requirements Document: Claude Code Context Curator

**Version:** 7.0  
**Last Updated:** January 8, 2026  
**Status:** Ready for Implementation  

---

## Executive Summary

Claude Code Context Curator is a conversational assistant that helps developers manage their Claude Code sessions. Invoked with `claude -r context-curator`, it provides commands for analyzing, optimizing, and managing session context for the current project.

**Key Innovation**: The `manage` command uses Claude Code's own intelligence to interactively edit sessions - no API key required.

---

## How It Works

### Invocation

From any project directory:
```bash
cd ~/my-project
claude -r context-curator
```

This starts a dedicated Claude Code session configured as a context management assistant. The session has access to helper scripts and special instructions that enable it to:
- List and analyze sessions
- Read session files
- Edit sessions conversationally
- Apply changes safely

### Directory Scoping

The curator automatically scopes to the current directory:
- Only shows sessions for `~/my-project`
- Session path: `~/.claude/projects/-Users-dev-my-project/`
- Each project's sessions are isolated

---

## User Workflow

### Initial Setup (One-Time)

```bash
# 1. Clone the curator
git clone <repo-url> ~/.claude/context-curator
cd ~/.claude/context-curator

# 2. Install dependencies
npm install

# 3. Create the curator session
./setup.sh

# 4. Test it works
cd ~/any-project
claude -r context-curator
```

### Daily Usage

```bash
# Working on a project
cd ~/my-project
claude
You: implement authentication
Claude: [working... session getting large]

# Exit your work session
^D

# Start the context curator
cd ~/my-project
claude -r context-curator

Context Curator initialized
Operating on: /Users/dev/my-project

You: show sessions

Curator: [Runs list script]

Sessions for /Users/dev/my-project:

sess-abc123 [most recent]
├─ 487 messages, 89k tokens (45%)
├─ Updated: 5 minutes ago
└─ Task: Implement JWT token refresh logic

You: analyze sess-abc123

Curator: [Runs analyze script and shows detailed breakdown]

Session: sess-abc123
Messages: 487 | Tokens: 89,234 (45% capacity)

Task Breakdown:
─────────────────────────────────────────
[1-120] Auth Implementation - COMPLETED
  • 120 messages, 25k tokens
  • Recommendation: Can be summarized

[121-280] Cookie Debugging - MANY FAILURES
  • 160 messages, 38k tokens
  • Contains 89 failed attempts
  • Recommendation: Remove failures, keep solution

[281-487] JWT Refresh (current)
  • 207 messages, 26k tokens
  • Status: In progress
  • Recommendation: Keep as-is

You: manage sess-abc123

Curator: Let me read that session and see what we can optimize...

[Uses Read tool to load session file]

I've analyzed the session. I can see:

1. Messages 1-120 are the completed auth implementation (25k tokens)
   → This could be summarized to 3-5 messages

2. Messages 121-280 are cookie debugging (38k tokens)
   → 89 messages are failed attempts
   → 71 messages contain the working solution
   → We could remove the failures

3. Messages 281-487 are your current JWT work (26k tokens)
   → Should keep this as-is

What would you like me to do?

You: Remove the failed cookie attempts and summarize the auth work

Curator: Good plan! Let me show you what that would look like...

For the auth section, I'll create a summary like:
  [1] User: "Help me implement JWT authentication"
  [2] [SUMMARY: Implemented JWT auth with refresh tokens using
      the jose library. Tokens expire after 15min, refresh tokens
      after 7 days. Added middleware for protected routes.]
  [3] User: "Perfect, it works!"

For the cookie section, I'll remove messages 121-209 (the failed
attempts) and keep 210-280 (the working solution).

Results:
  Before: 487 messages, 89k tokens
  After:  282 messages, 31k tokens
  Savings: 205 messages, 58k tokens (65%)

Should I proceed?

You: yes

Curator: [Working...]

[Writes edited version to temp file using Write tool]

✓ Edited version created
✓ Running apply script...
✓ Backup created: sess-abc123.backup-2026-01-08.jsonl
✓ Session updated successfully

Session optimized:
  Before: 487 messages, 89k tokens (45%)
  After:  282 messages, 31k tokens (16%)
  Saved:  58k tokens (65% reduction)

Resume with: claude --resume sess-abc123

You: exit

# Resume your work with optimized context
cd ~/my-project
claude --resume sess-abc123
[Fresh, clean context!]
```

---

## Commands Reference

All commands work within the `claude -r context-curator` session.

### show sessions / list

List all sessions for the current project.

**Usage:**
```
You: show sessions
```

**What Claude does:**
- Runs `npm run list` script
- Displays all sessions with metadata

**Output:**
- Session IDs and status
- Message count and token usage
- Last updated time
- First task preview

---

### analyze <session-id>

Analyze a specific session in detail.

**Usage:**
```
You: analyze sess-abc123
```

**What Claude does:**
- Runs `npm run analyze <session-id>` script
- Displays detailed breakdown

**Output:**
- Task boundaries and status
- Token distribution
- Optimization recommendations
- Potential savings

---

### manage <session-id>

**Interactive session editing using Claude's intelligence.**

**Usage:**
```
You: manage sess-abc123
```

**What happens:**

1. **Claude analyzes** - Runs analyze script first

2. **Claude reads** - Uses Read tool to load the session JSONL file

3. **Claude suggests** - Identifies optimization opportunities:
   - Completed work that can be summarized
   - Failed attempts that can be removed
   - Redundant information

4. **You discuss** - Tell Claude what you want:
   - "Remove the failed attempts"
   - "Summarize the auth work"
   - "Keep only the last 100 messages"
   - Any natural language instruction

5. **Claude previews** - Shows before/after examples

6. **You approve** - Confirm the changes

7. **Claude applies** - Writes edited version and applies it:
   - Creates temporary edited file
   - Runs apply-edits script
   - Creates backup
   - Updates session

**Interactive Commands:**
- Describe changes in natural language
- "show me a preview" - See before/after
- "yes" / "apply" - Apply changes
- "no" / "cancel" - Abort changes

**Example interactions:**
```
You: Remove all the debugging messages
You: Summarize the first 50 messages
You: Keep only messages from the last hour
You: Remove messages about X but keep messages about Y
```

---

### checkpoint <session-id> <name>

Create a backup of a session.

**Usage:**
```
You: checkpoint sess-abc123 before-refactor
```

**What Claude does:**
- Runs `npm run checkpoint <session-id> <name>` script
- Creates timestamped backup

---

### delete <session-id>

Remove a session (with backup and confirmation).

**Usage:**
```
You: delete sess-abc123
```

**What Claude does:**
- Runs `npm run delete <session-id>` script
- Creates automatic backup
- Asks for confirmation
- Deletes if confirmed

---

### dump <session-id> [type]

Display raw session data.

**Usage:**
```
You: dump sess-abc123
You: dump sess-abc123 user
```

**What Claude does:**
- Runs `npm run dump <session-id> [type]` script
- Shows raw JSONL messages

---

### help

Show detailed help and command reference.

**Usage:**
```
You: help
```

---

## Session File Format

### Storage Location

Sessions are stored as JSONL files:
```
~/.claude/projects/<encoded-project-path>/<session-uuid>.jsonl
```

### Path Encoding Formula

Project paths are encoded by replacing `/` with `-`:
```
/Users/dev/my-project  →  -Users-dev-my-project
/home/user/work/app    →  -home-user-work-app
```

### JSONL Format

One message per line:
```json
{"role":"user","content":"Help me implement auth","timestamp":"2026-01-08T10:00:00Z"}
{"role":"assistant","content":"I'll help you...","timestamp":"2026-01-08T10:00:05Z"}
```

### Message Types

- `role: "user"` - User messages
- `role: "assistant"` - Claude responses
- `role: "file-history-snapshot"` - File state tracking
- `role: "summary"` - Compaction summaries

---

## Implementation Architecture

### File Structure

```
~/.claude/
├── sessions/
│   └── context-curator/           # The curator's own session
│       ├── conversation.jsonl
│       └── metadata.json
│
└── context-curator/                # Curator code
    ├── CLAUDE.md                   # Instructions for curator
    ├── src/
    │   ├── types.ts
    │   ├── session-reader.ts
    │   ├── session-writer.ts
    │   ├── session-analyzer.ts
    │   └── utils.ts
    ├── scripts/
    │   ├── init.ts                 # Initialization
    │   ├── list.ts                 # List sessions
    │   ├── analyze.ts              # Analyze session
    │   ├── checkpoint.ts           # Backup session
    │   ├── delete.ts               # Delete session
    │   ├── dump.ts                 # Show raw data
    │   └── apply-edits.ts          # Apply edited session
    ├── setup.sh                    # One-time setup
    ├── package.json
    └── README.md
```

### The Curator Session

Created by `setup.sh`:
```bash
~/.claude/sessions/context-curator/
├── conversation.jsonl              # Initial conversation
└── metadata.json
```

When you run `claude -r context-curator`, Claude Code:
1. Resumes this session
2. Reads `~/.claude/context-curator/CLAUDE.md`
3. Becomes the context curator assistant
4. Operates on the current directory's sessions

### CLAUDE.md (Curator Instructions)

```markdown
# Context Curator

You help developers manage their Claude Code sessions for the current project.

## Initialization

When the user resumes this session, immediately run:
```bash
npm --prefix ~/.claude/context-curator run init
```

This displays:
- Current working directory
- Available sessions
- Available commands

## Your Role

You are a context management assistant with helper scripts at:
`~/.claude/context-curator/scripts/`

Run scripts using:
```bash
npm --prefix ~/.claude/context-curator run <command> <args>
```

## Available Commands

### show sessions / list
Run: `npm run list`
Shows all sessions for the current project.

### analyze <session-id>
Run: `npm run analyze <session-id>`
Shows detailed breakdown of a session.

### manage <session-id>
**This is SPECIAL - you handle this interactively.**

Workflow:
1. Run analyze script to understand the session
2. Use Read tool to load the session JSONL file:
   - Path: `~/.claude/projects/<encoded-path>/<session-id>.jsonl`
   - Format: One message per line (JSONL)
3. Analyze and suggest optimizations
4. Discuss with user what to optimize
5. Show preview of changes
6. When approved, create edited version:
   - Build array of edited messages
   - Write to: `/tmp/edited-<session-id>.jsonl`
   - Format: One message per line
7. Apply changes: `npm run apply-edits <session-id> /tmp/edited-<session-id>.jsonl`
8. Confirm success

**Important for manage:**
- Always read the actual session file first
- Be conservative - don't remove important context
- Show clear before/after previews
- Get explicit approval before applying
- Maintain valid JSONL format (one message per line)
- Explain your reasoning

**Example manage interaction:**

User: "manage sess-abc123"

You:
1. Run analyze script
2. Read session file with Read tool
3. Explain what you found
4. Suggest optimizations
5. Discuss with user
6. Preview changes
7. Get approval ("yes" or "apply")
8. Write edited version to temp file
9. Run apply-edits script
10. Confirm success with stats

### checkpoint <session-id> <name>
Run: `npm run checkpoint <session-id> <name>`
Creates a backup of the session.

### delete <session-id>
Run: `npm run delete <session-id>`
Deletes a session (with backup and confirmation).

### dump <session-id> [type]
Run: `npm run dump <session-id> [type]`
Shows raw JSONL contents.

## Command Interpretation

Users may phrase requests differently. Understand intent:

- "show sessions", "list sessions", "what sessions do I have" → list
- "analyze X", "tell me about X", "what's in X" → analyze X
- "manage X", "optimize X", "clean up X", "edit X" → manage X
- "backup X", "checkpoint X", "save X as Y" → checkpoint X Y
- "delete X", "remove X" → delete X

## Session File Format

JSONL format - one message per line:
```json
{"role":"user","content":"...","timestamp":"2026-01-08T10:00:00Z"}
{"role":"assistant","content":"...","timestamp":"2026-01-08T10:00:05Z"}
```

## Project Path Encoding

Claude Code encodes paths by replacing `/` with `-`:
- `/Users/dev/project` → `-Users-dev-project`

Sessions: `~/.claude/projects/<encoded-path>/<uuid>.jsonl`

## Your Personality

- Helpful and conversational
- Clear about what you're doing
- Ask for confirmation on destructive operations
- Show token savings prominently
- Explain your reasoning
- Guide users through optimization
```

### Helper Script: apply-edits.ts

```typescript
#!/usr/bin/env tsx
// scripts/apply-edits.ts

import * as fs from 'fs/promises';
import { getProjectSessionsDir } from '../src/session-reader.js';
import { backupSession } from '../src/session-writer.js';
import * as path from 'path';

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
        throw new Error(`Invalid JSON on line: ${line}`);
      }
    });
  
  // Validate
  if (editedMessages.length === 0) {
    throw new Error('Edited session is empty');
  }
  
  // Backup original
  const timestamp = new Date().toISOString().split('T')[0];
  const backupFilename = `${sessionId}.backup-${timestamp}.jsonl`;
  const sessionsDir = getProjectSessionsDir();
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
  
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Error applying edits:', err.message);
  process.exit(1);
});
```

---

## Usage Examples

### Example 1: Quick Session Check

```bash
cd ~/my-app
claude -r context-curator

You: show sessions

Curator: [Shows 2 sessions]

You: analyze sess-abc123

Curator: [Shows breakdown with optimization opportunities]

You: exit
```

### Example 2: Interactive Session Optimization

```bash
claude -r context-curator

You: manage sess-abc123

Curator: [Analyzes and reads the session]

I can see this session has:
- Completed auth work that can be summarized
- Many failed cookie debugging attempts
- Current JWT work in progress

What would you like to optimize?

You: Remove the failed attempts and summarize the completed work

Curator: [Shows preview of changes]

This will reduce from 487 to 282 messages (58k tokens saved).
Apply?

You: yes

Curator: [Applies changes]
✓ Done! Session optimized.

You: exit
```

### Example 3: Creating Safety Checkpoint

```bash
claude -r context-curator

You: I'm about to try a risky refactor, can you backup my session first?

Curator: Sure! What's the session ID?

You: sess-abc123

Curator: [Runs checkpoint script]
✓ Checkpoint created: sess-abc123.backup-2026-01-08.jsonl

Your session is backed up. Good luck with the refactor!

You: exit
```

---

## Key Features

### No API Key Required

The `manage` command uses Claude Code's own intelligence - no Anthropic API key needed. Claude uses its built-in capabilities (Read, Write, Bash tools) to edit sessions.

### Conversational Interface

Natural language commands - talk to the curator like you would any Claude session:
- "Show me my sessions"
- "What's in sess-abc123?"
- "Clean up the old one"
- "Remove the failures but keep the solution"

### Safe and Reversible

All modifications:
- Create automatic backups
- Require user confirmation
- Show clear previews
- Provide recovery paths

### Project-Scoped

Automatically operates only on the current project's sessions - no risk of modifying other projects.

---

## Technical Requirements

### Prerequisites
- Claude Code installed
- Node.js 18+
- TypeScript 5+
- tsx for running scripts

### No API Key Needed
The curator uses Claude Code itself for the `manage` command - no separate Anthropic API account required.

---

## Success Criteria

### MVP Complete When
- [ ] `claude -r context-curator` starts the curator session
- [ ] All commands work (list, analyze, manage, checkpoint, delete, dump)
- [ ] `manage` command edits sessions interactively using Claude
- [ ] No API key required for any functionality
- [ ] Project-scoped sessions work correctly
- [ ] Backups created automatically
- [ ] Zero data loss in testing
- [ ] Documentation complete

### User Success
- Users can optimize sessions without API keys
- Natural conversational interface feels intuitive
- Context optimization extends productive work time
- No confusion about which project's sessions are managed
- Community shares optimization strategies

---

## Version History

- **v7.0** (2026-01-08): Conversational `manage` using Claude Code, no API key
- **v6.1** (2026-01-07): Project-only scoping, removed named sessions
- **v6.0** (2026-01-07): Unified `context` command interface
- **v5.0** (2026-01-06): Dual session support - DEPRECATED
- **v4.0**: Interactive editor mode
- **v3.0**: Session analysis and optimization
- **v2.0**: Basic session management
- **v1.0**: Initial prototype
