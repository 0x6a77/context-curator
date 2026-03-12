# Product Requirements Document: Claude Code Context Curator

**Version:** 17.0
**Last Updated:** March 10, 2026
**Status:** Ready for Implementation

---

## Overview

Claude Code Context Curator is a **task-based context management system** that solves the critical problem of losing hard-won context when Claude Code auto-compacts or exceeds token limits. It enables developers to preserve "warmed-up" Claude sessions and return to peak performance on-demand.

**The Problem:**
Working on large, legacy codebases requires 1-3 hours to warm Claude Code up on a specific subsystem. Once Claude understands the quirks, patterns, and gotchas, it performs exceptionally. But auto-compact destroys this hard-won understanding, forcing developers to start over. This is infuriating and wastes valuable time.

**The Solution:**
- **Tasks** = Focused work environments with dedicated instruction sets
- **Contexts** = Named snapshots of warmed-up Claude sessions
- **Personal by default** = Your contexts stay private
- **Golden contexts** = Explicitly share valuable warmed-up sessions with team
- **No git conflicts** = Two-file CLAUDE.md system keeps projects clean

**Key Innovation:**
Claude Code's `/resume` re-reads CLAUDE.md from disk, enabling us to swap task-specific instructions at resume-time without polluting the project directory or causing git conflicts.

---

## Core Concepts

### The Warm-Up Problem

```
Hour 0: Start fresh on auth subsystem
  "Check the authentication middleware in src/auth/"
  
Hour 1-3: Claude warms up
  - Understands the legacy OAuth flow
  - Knows about the weird session token format  
  - Remembers the three places auth state is stored
  - Gets the quirky error handling patterns
  
Hour 4-6: SWEET SPOT ✨
  - Claude is crushing it
  - Deep understanding of the auth subsystem
  - Makes changes confidently
  - Suggests good refactors
  
Hour 7: Auto-compact happens
  - Context gets summarized
  - Nuanced understanding lost
  - Back to generic suggestions
  
😤 We lose hours of accumulated knowledge
```

### Tasks

A **task** is a focused work environment containing:
- Custom CLAUDE.md with task-specific instructions
- Personal context snapshots (private)
- Golden context snapshots (shared with team via git)

Tasks represent different areas of work on the same codebase:
- **Examples**: oauth-refactor, payment-integration, legacy-migration, bug-fix-sessions

### Contexts

A **context** is a named snapshot of a Claude Code session saved within a task.

**Personal contexts** (default):
- Saved in `~/.claude/projects/.../tasks/*/contexts/`
- Never committed to git
- Your private work history

**Golden contexts** (explicitly shared):
- Saved in `./.claude/tasks/*/contexts/`
- Committed to git
- Team knowledge base of warmed-up sessions

### The Two CLAUDE.md Files

**`./CLAUDE.md` (Root, Committed)**
- Canonical project knowledge
- Universal instructions, architecture, commands
- **Never modified by context-curator**
- Standard git workflow

**`./.claude/CLAUDE.md` (Auto-generated, Git-ignored)**
- What Claude Code actually reads
- Contains `@import` directives
- Modified by `/task` command to switch contexts
- Each developer has their own based on current task

This solves the git conflict problem: the committed file never changes, the working file is git-ignored.

### How /resume Re-reads CLAUDE.md

When you run `/resume <uuid>`, Claude Code:

1. Loads session from disk (conversation history, tool calls, state)
2. **Re-reads CLAUDE.md from current directory** (fresh from disk!)
3. Reconstructs system prompt with CLAUDE.md in `<system-reminder>` tags
4. Restores runtime state
5. Resumes conversation

This means we can modify `./.claude/CLAUDE.md` between sessions and the new instructions take effect on `/resume`.

> **Known Risk:** This behavior (re-reading CLAUDE.md on `/resume`) is not officially documented by Anthropic. It is an observed behavior central to task-switching. If a future Claude Code update changes this behavior, task switching will break silently.
>
> **Mitigation:** The `@import` directive is a documented feature, so instruction-loading itself is stable. Add a smoke test: after a `/resume`, verify a known string from the task CLAUDE.md appears in Claude's system context. This catches breakage quickly.

---

## Architecture

### Project Structure (Clean, Minimal Git Footprint)

```
my-project/
├── CLAUDE.md                          # ← Committed, never modified
│   # Contains universal project instructions
│
├── .claude/                           # ← Git-ignored directory
│   ├── CLAUDE.md                      # ← Auto-generated, git-ignored
│   │   # Contains @import to current task
│   │
│   ├── tasks/                         # ← Task definitions (committed)
│   │   ├── oauth-refactor/
│   │   │   ├── CLAUDE.md              # ← Committed (task knowledge)
│   │   │   ├── README.md              # ← Committed (task docs)
│   │   │   └── contexts/              # ← Golden contexts (committed)
│   │   │       ├── warmed-up.jsonl
│   │   │       └── oauth-deep-dive.jsonl
│   │   │
│   │   ├── payment-integration/
│   │   │   ├── CLAUDE.md
│   │   │   └── contexts/
│   │   │       └── stripe-flow.jsonl
│   │   │
│   │   └── default/
│   │       └── CLAUDE.md              # ← Copy of original CLAUDE.md
│   │
│   └── .gitignore
│
├── src/
├── tests/
└── package.json

# .claude/.gitignore contents:
# CLAUDE.md                   # Auto-generated file
```

### Personal Storage Structure (Never Committed)

```
~/.claude/
├── commands/                          # Global slash commands
│   ├── task.md
│   ├── context-save.md
│   ├── context-list.md
│   ├── context-manage.md
│   └── context-promote.md
│
└── projects/                          # Per-project personal state
    └── -Users-dev-my-project/
        ├── tasks/
        │   ├── oauth-refactor/
        │   │   └── contexts/          # Personal contexts
        │   │       ├── my-work.jsonl
        │   │       └── edge-cases.jsonl
        │   │
        │   └── payment-integration/
        │       └── contexts/
        │           └── experiment.jsonl
        │
        └── .stash/
            └── original-CLAUDE.md     # Backup of project's CLAUDE.md
```

---

## Installation

### One-Time Global Setup

```bash
# 1. Create directories
mkdir -p ~/.claude/commands
mkdir -p ~/.claude/projects

# 2. Download commands from repository
cd ~/.claude/commands
curl -O <repo-url>/commands/task.md
curl -O <repo-url>/commands/context-save.md
curl -O <repo-url>/commands/context-list.md
curl -O <repo-url>/commands/context-manage.md
curl -O <repo-url>/commands/context-promote.md

# 3. Verify installation
ls ~/.claude/commands/*.md

# 4. Test in any project
cd ~/my-project
claude
You: /task oauth-refactor
```

### Per-Project Initialization

In any project directory:

```bash
claude
You: /task-init
```

This creates:
- `.claude/` directory with `.gitignore`
- `.claude/tasks/default/CLAUDE.md` (copy of root CLAUDE.md)
- Backup of original CLAUDE.md in personal storage

---

## Workflows

### Starting a New Task

```bash
# 1. Create/switch to task
/task oauth-refactor

> What should this task focus on?
"Refactoring the legacy OAuth implementation in src/auth/"

✓ Created task
Run: /resume <uuid>

# 2. Resume with task context
/resume <uuid>

# Claude now has task-specific instructions loaded
# Work begins with fresh, focused context
```

### Saving Your Hard-Won Context

```bash
# After hours of warming Claude up...
/context-save oauth-deep-dive

> Save as: 1. Personal  2. Golden
2

> Team will see this. Confirm?
yes

✓ Saved as golden context

# Commit to share with team
git add .claude/tasks/oauth-refactor/contexts/oauth-deep-dive.jsonl
git commit -m "Add OAuth deep-dive golden context

This context includes:
- Complete understanding of legacy OAuth flow
- Session token format quirks  
- Rate limiting bypass issue
- Mobile app auth debugging
"
git push
```

### Using a Teammate's Golden Context

```bash
# Teammate pulls latest
git pull

# Start same task
/task oauth-refactor

> Which context?
> 
> Golden contexts:
> 1. oauth-deep-dive (47 msgs) - by: alice ⭐
>    Complete OAuth flow analysis with session state deep-dive
> 
> Choice: 1

✓ Context: oauth-deep-dive (47 msgs)
Run: /resume <uuid>

# /resume loads the golden context
# Claude is INSTANTLY warmed up on OAuth subsystem! ✨
```

### Managing Contexts

```bash
/context-manage

> I found 8 contexts across 3 tasks
> What would you like to do?

clean

> Found stale and duplicate contexts
> Apply recommendations? (yes/no/review)

review

# Interactive cleanup with intelligent suggestions
# Claude helps you organize and maintain contexts
```

### Returning to Default/Vanilla

```bash
/task default

✓ Task: default
✓ Restored to vanilla project context

Run: /resume <uuid>

# Back to general development mode
```

---

## Features

Save those precious hours of warming Claude up on complex subsystems. Context Curator preserves hard-won context so you can return to peak performance on-demand — the primary value of the system.

### Command Reference

| Command | Feature ID | Description |
|---------|-----------|-------------|
| `/task-init` | [F-INIT](#f-init--project-initialization-task-init) | Bootstrap a project for context-curator |
| `/task <id>` _(new task)_ | [F-TASK-CREATE](#f-task-create--task-creation-task-new-task-id) | Create a new named task with custom instructions |
| `/task <id>` _(existing task)_ | [F-TASK-SWITCH](#f-task-switch--task-switching-task-existing-task-id) | Switch to an existing task and load a context |
| `/context-save <name> [--golden]` | [F-CTX-SAVE](#f-ctx-save--context-saving-context-save-n) | Save current session as a named context |
| `/context-list [task-id]` | [F-CTX-LIST](#f-ctx-list--context-listing-context-list-task-id) | List all contexts with AI-generated summaries |
| `/context-manage` | [F-CTX-MANAGE](#f-ctx-manage--context-management-context-manage) | Interactive context management and cleanup |
| `/context-promote <name>` | [F-CTX-PROMOTE](#f-ctx-promote--context-promotion-context-promote-context-name) | Promote a personal context to golden (team-shared) |

---

### F-INIT · Project Initialization (`/task-init`)

Bootstraps a project for context-curator by creating the `.claude/` directory structure, wiring up `.gitignore`, and copying root `CLAUDE.md` into the default task.

**Expected Behaviors:**
- Creates `.claude/` directory if it doesn't exist
- Creates `.claude/.gitignore` with `CLAUDE.md` entry
- Creates `.claude/tasks/default/CLAUDE.md` as copy of root `CLAUDE.md`
- Backs up original `CLAUDE.md` to `~/.claude/projects/{sanitized-path}/.stash/original-CLAUDE.md`
- Idempotent: running twice doesn't break anything
- Works in projects with and without existing `CLAUDE.md`
- Preserves existing `.claude/` content if directory exists

**Test Scenarios:**
1. Fresh project without `CLAUDE.md`
2. Project with existing `CLAUDE.md`
3. Project with existing `.claude/` directory
4. Running `/task-init` twice in same project
5. Multiple projects in different directories

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-INIT-1 | `init-project` creates `.claude/CLAUDE.md` containing an `@import` line; the file must not exist before the script runs |
| T-INIT-2 | `init-project` copies root `CLAUDE.md` byte-for-byte to the stash path; backup must not exist before script runs (not created in test setup) |
| T-INIT-3 | `.claude/tasks/default/CLAUDE.md` content equals root `CLAUDE.md` character-for-character |
| T-INIT-4 | Running `init-project` twice exits 0 both times and produces identical file contents |
| T-INIT-5 | Writing a file to project A's personal dir does not make it visible in project B's personal dir |

### F-TASK-CREATE · Task Creation (`/task <new-task-id>`)

Creates a new named task with its own CLAUDE.md, directory structure, and metadata, then wires it into `.claude/CLAUDE.md` so Claude Code loads the right instructions.

**Command:** `/task <task-id>`

**Behavior (creating new task):**

If task doesn't exist:
1. Ask: "What should this task focus on?"
2. Create `CLAUDE.md` for task based on description
3. Create default context (empty)
4. Modify `.claude/CLAUDE.md` to import task's CLAUDE.md
5. Output: "Run: /resume <uuid>"

**Example:**

```
You: /task oauth-refactor

# If new:
What should this task focus on?

You: Refactoring the legacy OAuth implementation in src/auth/

✓ Created task: oauth-refactor
✓ Location: ./.claude/tasks/oauth-refactor/

Run: /resume <uuid>

Your focus:
  Refactoring the legacy OAuth implementation in src/auth/
```

**Expected Behaviors:**
- Prompts user for task focus/description
- Creates `.claude/tasks/{task-id}/` directory structure
- Creates task-specific `CLAUDE.md` based on description
- Generates `.claude/tasks/{task-id}/README.md` with task metadata
- Modifies `.claude/CLAUDE.md` to import task's `CLAUDE.md`
- Provides `/resume sess-{id}` instruction
- Task ID validation (alphanumeric + hyphens only)
- Creates both project and personal task directories

**Test Scenarios:**
1. Create new task in initialized project
2. Invalid task ID (spaces, special chars, uppercase)
3. Task creation with multi-line description
4. Task creation with no description
5. Verify `.claude/CLAUDE.md` contains correct `@import` directive
6. Verify task `CLAUDE.md` contains user's description

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-TASK-1 | `task-create` produces CLAUDE.md with all required sections: `# Task:`, `## Focus`, `## Key Areas`, `## Guidelines` |
| T-TASK-2 | `task-create` with uppercase name exits non-zero AND creates no task directory |
| T-TASK-3 | `task-create` with multi-line description preserves all lines in the Focus section |
| T-TASK-4 | `task-create` with empty description exits non-zero and creates no task directory |

### F-TASK-SWITCH · Task Switching (`/task <existing-task-id>`)

Switches the active task context by updating `.claude/CLAUDE.md` and optionally restoring a saved context session for that task.

**Command:** `/task <task-id>`

**Behavior (switching to existing task):**

If task exists:
1. List available contexts (personal + golden)
2. Ask which context to load
3. Modify `.claude/CLAUDE.md` to import task's CLAUDE.md
4. Copy selected context to session file
5. Output: "Run: /resume <uuid>"

**Example:**

```
# If exists:
Which context to load?

Personal contexts:
1. my-progress (15 msgs) - 2025-01-16

Golden contexts (team shared):
2. oauth-deep-dive (47 msgs) - 2025-01-15 - by: alice
   Summary: Complete walkthrough of OAuth flow, token format, session storage

Choice (or enter for default): 2

✓ Task: oauth-refactor  
✓ Context: oauth-deep-dive (47 msgs)

Run: /resume <uuid>

# Now /resume will read .claude/CLAUDE.md which imports oauth-refactor/CLAUDE.md
```

**Expected Behaviors:**
- Lists available contexts (personal + golden) for task
- Displays context metadata: name, message count, date, author (for golden)
- Displays context summaries
- Prompts user to select context (or default/new)
- Modifies `.claude/CLAUDE.md` to import selected task's `CLAUDE.md`
- If context selected: copies context to session location
- Provides `/resume sess-{id}` instruction
- Handles task with no contexts (offers to start fresh)

**Test Scenarios:**
1. Switch to task with personal contexts only
2. Switch to task with golden contexts only
3. Switch to task with both personal and golden contexts
4. Switch to task with no contexts
5. Switch to `default` task (return to vanilla)
6. Switch between tasks multiple times
7. Verify `.claude/CLAUDE.md` updates correctly on each switch

**Acceptance Criteria:**

| Test ID    | Criterion |
|------------|-----------|
| T-SWITCH-1 | After switching tasks A→B→C→A, `.claude/CLAUDE.md` contains **exactly one** `@import` line on each switch, pointing to the selected task's `CLAUDE.md` |
| T-SWITCH-2 | When a task has no saved contexts, `context-list` exits 0 and output contains "no contexts" or "fresh" |
| T-SWITCH-3 | When a task has both personal and golden contexts, all context names appear in output with personal contexts listed before golden contexts |
| T-SWITCH-4 | `context-list --json` for a task with active sessions but no saved contexts returns `contexts: []` (empty array) — session UUIDs must never appear in the `contexts` field |
| T-SWITCH-5 | When `contexts` is empty, the switch UI displays a "no contexts" message and does NOT present UUID session files as numbered selectable options |
| T-SWITCH-6 | Switching to `default` task sets `@import` to point to `default/CLAUDE.md` and script output confirms the switch (e.g. "vanilla" or "restored") |

### F-CTX-SAVE · Context Saving (`/context-save <n>`)

Saves the current Claude Code session as a named personal or golden context, including AI-generated summary and metadata. Personal contexts stay local; golden contexts are committed to git for team sharing.

**Command:** `/context-save <name> [--golden]`
**Execution:** Forked context (has access to current session, does not pollute)

**Behavior:**

1. Scan for secrets (API keys, passwords, tokens)
2. If secrets found, warn user
3. Ask: "Save as personal or golden?"
4. If golden: confirm team sharing implications
5. Save to appropriate location
6. If golden: remind to commit via git

**Example:**

```
You: /context-save oauth-deep-dive

Scanning for secrets...
✓ No secrets detected

Save this context as:
1. Personal (only you can access)
2. Golden (shared with team via git)

Choice (1/2): 2

⚠️  GOLDEN CONTEXT

This will be saved to:
./.claude/tasks/oauth-refactor/contexts/oauth-deep-dive.jsonl

Team members will be able to:
- See your conversation history
- Use this context to warm up Claude
- View any code snippets discussed

Confirm? (yes/no): yes

✓ Saved as golden context
✓ Location: ./.claude/tasks/oauth-refactor/contexts/oauth-deep-dive.jsonl

Next steps:
git add .claude/tasks/oauth-refactor/contexts/oauth-deep-dive.jsonl
git commit -m "Add OAuth deep-dive golden context"
git push
```

> **Note:** Secrets are scanned at save time for ALL contexts (personal and golden). For personal saves, secrets trigger a warning with the option to redact before saving — they do not block the save. For golden promotion, secrets must be acknowledged and optionally redacted before proceeding.

**Expected Behaviors:**
- Saves current session to personal context by default
- Prompts: "Save as golden (team-shared) context? (y/n)"
- Personal: saves to `~/.claude/projects/{project}/tasks/{task}/contexts/{name}.jsonl`
- Golden: saves to `./.claude/tasks/{task}/contexts/{name}.jsonl`
- Generates AI summary of context content
- Stores metadata: timestamp, message count, author
- Validates context name (alphanumeric + hyphens + underscores)
- Prevents overwriting without confirmation

**Test Scenarios:**
1. Save personal context with valid name
2. Save golden context with secret detection passing
3. Attempt to save with invalid name
4. Attempt to overwrite existing context
5. Save context with varying message counts (empty, small, large)
6. Verify `.jsonl` format is valid
7. Verify summary is generated and stored
8. Context saved without active task (should error or prompt)

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-CTX-1 | `save-context --personal` creates file at exactly `<personalDir>/tasks/<task-id>/contexts/<name>.jsonl` |
| T-CTX-2 | Saved context file parses as valid JSONL — asserted unconditionally, not inside an `if (fileExists)` guard |
| T-CTX-3 | `save-context --golden` on a session with a real AWS key exits non-zero or produces a prompt; exit 0 with no prompt is a failure |
| T-CTX-4 | `save-context --golden` on a 150KB session exits non-zero with output containing "100KB" or "too large" |
| T-CTX-6 | `save-context` called twice with the same name creates a `.backup-` file; the backup contains the original content |
| T-MEM-1 | After `save-context`, the file `<personalDir>/memory/MEMORY.md` contains the task-id and context-name saved |

### F-CTX-LIST · Context Listing (`/context-list [task-id]`)

Lists available contexts for the current or specified task, grouped by type (personal then golden), with metadata and summary previews.

**Command:** `/context-list [task-id]`
**Execution:** Forked context (can read files and generate summaries)

**Behavior:**

1. List personal contexts from `~/.claude/projects/.../`
2. List golden contexts from `./.claude/tasks/.../contexts/`
3. For each context:
   - Read sample of messages
   - Generate 1-2 sentence summary
   - Show metadata (size, date, author for golden)

**Example:**

```
You: /context-list oauth-refactor

# Context List

**Project:** /Users/dev/my-project
**Task:** oauth-refactor

Sessions:
  8e14f625... (current)  23 msgs   ~6k - just now
  a1b2c3d4...            45 msgs  ~11k - 2 hours ago

Personal contexts:
  my-progress           15 msgs - yesterday [oauth-refactor]
  edge-cases             8 msgs - 2 days ago [oauth-refactor]

Golden contexts:
  oauth-deep-dive       47 msgs - 2 days ago [oauth-refactor] ⭐
  warmed-up             32 msgs - 3 days ago [oauth-refactor] ⭐

---
Save: `/context-save <name>` | Load: `/task oauth-refactor`
```

**Output Format:**
- Compact single-line format for each context
- Sorted newest first within each section
- Task shown in brackets `[task-id]`
- Golden contexts marked with ⭐

**Active Sessions:**
- Located in `~/.claude/projects/<project-id>/` as UUID-named `.jsonl` files
- The most recently modified session is marked as "(current)"
- Shows message count, tokens, and relative time

**Expected Behaviors:**
- Lists contexts for current task if no task-id specified
- Lists contexts for specified task if task-id provided
- Shows personal contexts with "(personal)" indicator
- Shows golden contexts with author and "⭐" indicator
- Displays: name, message count, date, summary
- Groups by type: personal first, then golden
- Handles tasks with no contexts gracefully
- Shows context file sizes

**Test Scenarios:**
1. List contexts for current task
2. List contexts for different task
3. List contexts when none exist
4. List contexts with mix of personal and golden
5. Verify summary display is truncated/formatted properly
6. List contexts for non-existent task (should error)

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-LIST-1 | `context-list` output: indexOf("Personal") < indexOf("Golden") AND specific context names appear |
| T-LIST-2 | `context-list` shows exact message count matching `\b<N>\b` (word boundary, not `\d+`) |
| T-LIST-3 | When no contexts exist, `context-list` output contains "fresh", "empty", or "no contexts" |
| T-LIST-4 | `context-list` shows a non-empty description string after each context name, not just metadata |

### F-CTX-MANAGE · Context Management (`/context-manage`)

Scans all task contexts, identifies stale or duplicate entries, and provides interactive cleanup with dry-run previews and explicit confirmation before any deletion.

**Command:** `/context-manage`
**Execution:** Forked context (full file access and intelligent suggestions)

**Behavior:**

Claude scans all contexts and presents an interactive menu:

```
Available actions:

Organize:
- rename <number> - Rename a context
- delete <number> - Delete a context
- merge <numbers> - Merge multiple contexts

Share:
- promote <number> - Make a golden context
- demote <number> - Make personal again

Inspect:
- view <number> - View full summary and details
- diff <num1> <num2> - Compare two contexts
- secrets <number> - Scan for secrets

Bulk:
- clean - Find and remove old/duplicate contexts
- archive - Archive contexts older than 30 days
```

**Example Session:**

```
You: /context-manage

Scanning contexts...

I found **8 contexts** across **3 tasks**:

### oauth-refactor (current)
**Personal:**
1. `my-progress` - 15 msgs - OAuth token validation work
2. `edge-cases` - 8 msgs - Session timeout edge cases

**Golden:**
3. `oauth-deep-dive` ⭐ - 47 msgs - Complete OAuth analysis (by: alice)

### payment-integration
**Personal:**
4. `stripe-work` - 12 msgs - Webhook handling
5. `experiment` - 3 msgs - Testing refund flow

**Golden:**
6. `stripe-flow` ⭐ - 32 msgs - Production integration (by: you)

### legacy-migration
**Personal:**
7. `old-approach` - 5 msgs - Failed migration attempt (60 days old)

**Golden:**
8. `migration-strategy` ⭐ - 62 msgs - Comprehensive plan (by: you)

---

What would you like to do?

You: clean

Let me analyze for cleanup opportunities...

Found:

**Stale contexts:**
- `old-approach` (legacy-migration) - 5 msgs, 60 days old
  Superseded by migration-strategy
  → Recommend: Archive

**Very small contexts:**
- `experiment` (payment-integration) - 3 msgs
  Might be incomplete
  → Recommend: Delete or merge with stripe-work

Apply recommendations? (yes/no/review)

You: review

1. Archive `old-approach`? (yes/no/skip)
You: yes
✓ Archived to ./.claude/tasks/legacy-migration/archive/old-approach.jsonl

2. Delete `experiment`? (yes/no/skip/merge)
You: merge
Merge into which context? (4 or 6)
You: 4
✓ Merged experiment → stripe-work (now 15 msgs)

Cleanup complete!

Anything else? (or 'done' to exit)

You: done

✓ Context management complete
```

**Expected Behaviors:**
- Scans all tasks for contexts
- Reports total count across tasks
- Identifies stale contexts (old, unused)
- Identifies duplicate contexts (similar content)
- Suggests cleanup actions
- Interactive prompts: clean, review, cancel
- Provides dry-run/preview before deletion
- Respects user confirmation for destructive actions
- Preserves golden contexts (warns before deletion)

**Test Scenarios:**
1. Manage when no contexts exist
2. Manage with multiple stale contexts
3. Manage with duplicate contexts
4. Review mode: shows details before action
5. Clean mode: confirms then deletes
6. Cancel: exits without changes
7. Verify no golden contexts deleted without explicit confirmation
8. Verify personal contexts can be cleaned

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-CTX-7 | `delete-context` on a golden context exits non-zero without `--confirm` flag; the file still exists after the failed attempt |

### F-CTX-PROMOTE · Context Promotion (`/context-promote <context-name>`)

Promotes a personal context to a golden (team-shared) context after scanning for secrets and obtaining user confirmation, making it available to all team members via git. New teammates ramp up faster and proven debugging approaches are preserved as team assets.

**Command:** `/context-promote <name>`
**Execution:** Forked context

**Behavior:**

1. Find personal context
2. Scan for secrets
3. Optionally redact secrets
4. Copy to `./.claude/tasks/.../contexts/`
5. Remind to commit via git

**Example:**

```
You: /context-promote edge-cases

Promoting: edge-cases (oauth-refactor)

Scanning for secrets...

⚠️  Found potential secrets:
- Line 89: API key pattern (pk_test_...)
- Line 124: Database password

Options:
1. Continue anyway (not recommended)
2. Let me help redact secrets first
3. Cancel

You: 2

Creating sanitized version...

Redacted 2 secrets:
- Line 89: pk_test_4eC39... → pk_test_[REDACTED]
- Line 124: postgres://user:pass@... → postgres://user:[REDACTED]@...

Save this cleaned version as golden? (yes/no)

You: yes

✓ Promoted to golden context
✓ Location: ./.claude/tasks/oauth-refactor/contexts/edge-cases.jsonl

Personal copy remains at:
  ~/.claude/projects/.../oauth-refactor/contexts/edge-cases.jsonl

Next steps:
  git add .claude/tasks/oauth-refactor/contexts/edge-cases.jsonl
  git commit -m "Share edge-cases context for OAuth work"
  git push
```

**Expected Behaviors:**
- Finds personal context by name in current task
- Scans for secrets using multiple detection methods
- Lists detected secrets with context
- Offers redaction options for each secret
- Prompts for confirmation before promotion
- Copies from `~/.claude/projects/.../contexts/` to `./.claude/tasks/.../contexts/`
- Preserves original personal context
- Updates metadata to mark as golden
- Fails if secrets detected and not handled

**Test Scenarios:**
1. Promote clean context (no secrets)
2. Promote context with API keys
3. Promote context with multiple secret types
4. Redact secrets before promotion
5. Cancel promotion when secrets detected
6. Promote non-existent context (should error)
7. Promote already-golden context (should error or warn)
8. Verify promoted context file is identical (minus secrets)

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-CTX-5 | `promote-context` on a 150KB personal context exits non-zero with output containing "100KB" or "too large" |
| T-PROM-1 | After `promote-context`, both personal original and golden copy exist; contents are byte-for-byte identical |
| T-PROM-2 | `promote-context` on a context with `ghp_` + 36 alphanumeric chars: output names the specific secret type |
| T-PROM-3 | `promote-context` when golden already exists exits non-zero or warns; setup must create personal context only |

### F-CLMD · Two-File CLAUDE.md System

Keeps the root `CLAUDE.md` stable and committed while using an auto-generated, git-ignored `.claude/CLAUDE.md` for per-developer task state — eliminating git conflicts when multiple developers work on the same project.

**Expected Behaviors:**
- Root `CLAUDE.md` never modified by context-curator
- `.claude/CLAUDE.md` auto-generated with `@import` directives
- `.claude/CLAUDE.md` git-ignored (in `.claude/.gitignore`)
- Each task switch updates `.claude/CLAUDE.md` import path
- `/resume` reads `.claude/CLAUDE.md` (or `CLAUDE.md` if no `.claude/` exists)
- Import path format: `@import ./tasks/{task-id}/CLAUDE.md`

**Test Scenarios:**
1. Verify root `CLAUDE.md` unchanged after task operations
2. Verify `.claude/CLAUDE.md` created correctly
3. Verify `.claude/CLAUDE.md` updates on task switch
4. Verify git status shows `.claude/CLAUDE.md` as ignored
5. Task switch followed by `/resume` loads correct task instructions
6. Multiple developers on same project have different `.claude/CLAUDE.md`

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-CLMD-1 | After any task operation, root `CLAUDE.md` content equals its pre-operation content |
| T-CLMD-2 | After two task switches, `.claude/CLAUDE.md` contains exactly one `@import` line |
| T-RESUME-MANUAL | MANUAL: After `/task <id>` + `/resume <session>`, Claude's response references task CLAUDE.md content |

### F-SEC · Secret Detection

Automatically scans context content for API keys, passwords, tokens, and private keys before any golden promotion or save, preventing accidental secret sharing with the team.

**Expected Behaviors:**
- Detects common secret patterns: API keys, passwords, tokens, private keys
- Recognizes service-specific formats (AWS, Stripe, GitHub, etc.)
- Scans entire context content (all messages)
- Reports line numbers and context for each detection
- Offers redaction options: mask, remove, replace
- Validates redaction doesn't break context structure
- Re-scans after redaction to confirm clean

**Test Scenarios:**
1. Detect AWS access keys
2. Detect Stripe API keys
3. Detect GitHub tokens
4. Detect private keys (SSH, GPG)
5. Detect generic passwords/credentials
6. False positives (API key-like strings that aren't secrets)
7. Multiple secrets in single message
8. Secrets in different message types (user, assistant, tool)
9. Verify redaction produces valid `.jsonl`

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-SEC-2 | `scan-secrets` on a file with `AKIA` + 16 uppercase alphanumeric chars exits non-zero; output contains "AWS" or "AKIA" |
| T-SEC-3 | `scan-secrets` detects both `sk_test_` and `sk_live_`; output names the specific key type |
| T-SEC-4 | A context with one secret in user, one in assistant, one in tool_result: all three reported |
| T-SEC-5 | `AKIAIOSFODNN7EXAMPLE` is treated as a true positive (scanner prefers false positives over false negatives) |
| T-SEC-6 | After `redact-secrets`, every line parses as JSON; a second `scan-secrets` run returns "clean" |
| T-SEC-7 | `scan-secrets` on a context with exactly 5 secrets reports count matching `\b5\b` |

### F-SUMMARY · AI-Generated Summaries

Generates concise AI summaries (key topics, accomplishments, decisions) for every saved context using a forked session, enabling informed context selection from `/context-list`.

**Expected Behaviors:**
- Generates summary when context is saved
- Summary includes: key topics, accomplishments, decisions
- Summary stored in context metadata
- Summary length: 2-3 sentences (concise)
- Summary uses forked context (doesn't pollute main session)
- Summary quality sufficient for context selection
- Handles empty contexts gracefully

**Test Scenarios:**
1. Generate summary for small context (5 messages)
2. Generate summary for medium context (50 messages)
3. Generate summary for large context (200+ messages)
4. Generate summary for context with code-heavy content
5. Generate summary for context with minimal content
6. Verify summary stored in context metadata
7. Verify summary displayed in `/context-list`

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-SUM-1 | After `save-context`, a `.meta.json` file exists alongside the `.jsonl` with a `summary` string between 20 and 500 characters |
| T-SUM-2 | Two contexts saved from clearly different conversations produce different `summary` strings; each summary must contain at least one keyword from its source conversation content |

### F-GIT · Git Integration

Maintains a minimal and conflict-free git footprint: task CLAUDE.md files and golden contexts are committed; the auto-generated `.claude/CLAUDE.md` and all personal contexts stay out of version control entirely.

**Expected Behaviors:**
- `.claude/.gitignore` prevents `.claude/CLAUDE.md` from being committed
- Task `CLAUDE.md` files are committed
- Golden contexts are committed
- Personal storage (`~/.claude/`) never committed
- No git conflicts from context-curator operations
- Team can pull golden contexts via `git pull`
- Multiple developers can work on same task without conflicts

**Test Scenarios:**
1. Initialize project and verify `.gitignore` setup
2. Create task and verify files are staged correctly
3. Save golden context and verify it's tracked by git
4. Multiple developers initialize same project independently
5. Developer pulls golden context and loads it
6. Verify `.claude/CLAUDE.md` not in `git status`
7. Verify no merge conflicts from simultaneous task work

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-GIT-1 | `git check-ignore .claude/CLAUDE.md` exits 0 in a real git repo after init |
| T-GIT-2 | After a full workflow in a real git repo, `git status --porcelain` does not list any path containing the personal storage prefix |

### F-XPLAT · Cross-Platform Compatibility

Supports macOS and Linux with correct POSIX path handling, file permissions, and line endings. Windows native is out of scope for v16.0; Windows users should use WSL2.

> **Scope:** Initial version targets **macOS and Linux only**. Windows native support is explicitly out of scope for v16.0. The path encoding (`cwd.replace(/\//g, '-')`) is POSIX-specific and the shell scripts use bash syntax incompatible with Windows cmd/PowerShell. Windows users should use WSL2.

**Expected Behaviors (macOS/Linux):**
- Path sanitization handles POSIX paths
- File permissions set correctly
- Line endings handled properly (LF)
- Tilde expansion works (`~/.claude/`)
- Handles spaces in project paths
- Handles special characters in paths

**Test Scenarios:**
1. Initialize on macOS
2. Initialize on Linux
3. Project path with spaces
4. Project path with special characters
5. Verify contexts are portable (macOS ↔ Linux)
6. Verify `.jsonl` files use consistent line endings

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-ERR-3 | All operations work when project path contains a space; verified by exitCode === 0 AND output file existence |

### F-ERR · Error Handling & Edge Cases

Provides graceful degradation, clear user-facing error messages, and atomic operations with rollback so that no data is lost even when things go wrong.

**Expected Behaviors:**
- Graceful degradation when directories don't exist
- Clear error messages for user mistakes
- No data loss on errors
- Atomic operations where possible
- Rollback on failure
- Validates inputs before destructive operations
- Handles interrupted operations (Ctrl+C)

**Test Scenarios:**
1. Run `/task` without initialization
2. Delete `.claude/` directory mid-operation
3. Corrupt `.jsonl` context file
4. Fill disk during context save
5. Invalid JSON in context metadata
6. Permission denied errors
7. Network interruption during git operations
8. Concurrent operations (multiple Claude sessions)

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-ERR-1 | Any script run without init exits non-zero with output containing "initialized" or "init" — not a stack trace |
| T-ERR-2 | `scan-secrets` on malformed JSONL exits non-zero (not 0) |

### F-HOOK · PreCompact Auto-Save Hook

Automatically saves the current session to a timestamped file when Claude Code is about to compact, preventing context loss during long conversations.

**Expected Behaviors:**
- Automatically saves context when Claude Code is about to compact
- Creates a timestamped `.jsonl` file in the flat `<personalBase>/auto-saves/` directory
- Triggered via `PreCompact` hook in Claude Code hooks configuration

**Test Scenarios:**
1. Trigger auto-save with a mock stdin payload
2. Verify timestamped file created in correct flat `auto-saves/` directory

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-HOOK-1 | `auto-save-context` with a mock stdin payload creates a timestamped `.jsonl` file in the flat `<personalBase>/auto-saves/` directory |

---

## Success Criteria

### Success Metrics

**Developer Productivity:**
- Time to warm up Claude on subsystem: 3 hours → 5 minutes (using golden context)
- Context loss frustration: Eliminated
- Knowledge sharing: Improved (golden contexts)

**Team Collaboration:**
- New developer ramp-up time: Reduced
- Subsystem knowledge: Preserved and shared
- Code quality: Improved (consistent understanding)

---

## Implementation Notes

### Test Contract

All automated tests in this project must conform to the following rules. Violations are treated as test failures regardless of whether the underlying assertion passes.

**T1 — No Vacuous OR Fallbacks.** Assertions must not use trailing OR clauses broad enough to always fire. Banned patterns: `|| output.includes('context')`, `|| result.exitCode === 0`, `|| /\d+/.test(output)`, `|| typeof x === 'number'`. Every assertion must be capable of failing on a buggy-but-conforming implementation.

**T2 — No Conditional Assertions on File Existence.** The pattern `if (await fileExists(path)) { expect(...) }` is banned. Assert file existence unconditionally first: `expect(await fileExists(path)).toBe(true)`, then assert contents.

**T3 — No Self-Fulfilling Setup.** Test setup must not create the artifact the test then verifies. If a script is supposed to create a backup, the test must not create the backup in `beforeEach`.

**T4 — No Tautological Type Assertions.** `typeof x === 'number'` when `x` is always numeric is banned. Assert specific values or ranges.

**T5 — Exit Codes Must Be Specific.** Error paths assert `exitCode !== 0`. Success paths assert `exitCode === 0`. Skipping the assertion is banned.

**T6 — String Assertions Must Be Specific.** When asserting a specific value appears in output (e.g. a count, path, or label), the pattern must be specific enough to fail on unrelated content. Use `\b47\b` not `\d+` when 47 messages are expected.

### Claude Code Integration Points

**Critical behavior we rely on:**

1. `/resume` re-reads CLAUDE.md from disk
   - This enables task switching
   - Observed behavior (not officially documented); treat as stable but monitor on Claude Code updates
   - **Automated tests:** Cannot test this directly — requires a live Claude Code instance. Instead, test the structural proxy: verify `.claude/CLAUDE.md` contains the correct `@import` path before `/resume` would fire (T-CLMD-2).
   - **Manual smoke test (T-RESUME-MANUAL):** Run once per Claude Code version update. See test plan for steps.

2. `@import` directive works in CLAUDE.md
   - Official Claude Code feature
   - Allows composing instructions from multiple files

3. `context: fork` for commands
   - Commands have full conversation access
   - Don't pollute main session
   - Perfect for summaries and analysis

### File Format: .jsonl

Context files are JSON Lines format (one JSON object per line):
- Each message is a separate line
- Compatible with Claude Code's session format
- Easy to inspect and analyze

### Git Best Practices

**.gitignore in .claude/:**

```gitignore
# Auto-generated file (each dev has their own)
CLAUDE.md

# Add any other per-developer state files here
```

**What to commit:**
- `.claude/tasks/*/CLAUDE.md` - Task knowledge
- `.claude/tasks/*/README.md` - Task documentation
- `.claude/tasks/*/contexts/*.jsonl` - Golden contexts (max 100KB each; warn and block if exceeded)
- `.claude/.gitignore` - Ignore rules

> **Context Size Limit:** Golden contexts committed to git are capped at **100KB**. Large contexts bloat the repository and slow clones over time. If a context exceeds this limit, `/context-save --golden` and `/context-promote` must warn the user and offer to trim the context before saving.

**What NOT to commit:**
- `.claude/CLAUDE.md` - Auto-generated
- Personal contexts (they live in `~/.claude/projects/`)

### Context Size Policy

Golden contexts committed to git are capped at **100KB per file**. This limit is enforced in two places:
- `/context-save --golden`: rejects save if session exceeds 100KB
- `/context-promote`: rejects promotion if personal context exceeds 100KB

Both paths are independently tested (T-CTX-4, T-CTX-5). Personal contexts have no size limit.

---

## Testing

### Testing Philosophy

Context Curator prioritizes **integration tests** over unit tests. Integration tests validate that features work correctly from the user's perspective, testing task appropriateness rather than code structure. This approach:

- **Proves real-world functionality**: Tests confirm actual user workflows work end-to-end
- **Reduces technical debt**: No brittle tests tied to implementation details
- **Enables refactoring**: Code structure can change without breaking tests
- **Finds real bugs**: Tests catch issues users would actually encounter

**Test Criteria:**
- All tests must be **deterministic** and **repeatable**
- Slow or flaky tests indicate design problems, not test problems
- Each test must have **clear success/failure criteria**
- Tests should be **isolated** (no dependencies between tests)

### Test Validation Methods

**How to Prove Tests Are Valid:**

1. **File System Verification**
   - Check files exist at expected paths
   - Verify file contents match expected format
   - Confirm permissions and ownership
   - Validate directory structures

2. **Git State Verification**
   - Run `git status` and verify tracked/untracked files
   - Verify `.gitignore` rules are working
   - Confirm no uncommitted changes to root `CLAUDE.md`
   - Test cross-developer scenarios with real git operations

3. **JSONL Format Validation**
   - Parse `.jsonl` files with JSON parser
   - Verify each line is valid JSON
   - Confirm message structure matches Claude Code format
   - Check for required fields (role, content, timestamp)

4. **Secret Detection Validation**
   - Use known secret patterns in test data
   - Verify detection with both true positives and false positives
   - Confirm redaction produces clean contexts
   - Re-scan redacted content to ensure secrets removed

5. **Import Directive Validation**
   - Parse `.claude/CLAUDE.md` for `@import` syntax
   - Verify import paths resolve correctly
   - Confirm imported files exist
   - Test with Claude Code `/resume` to ensure loading works

6. **Summary Quality Validation**
   - Human review of sample summaries
   - Verify summaries are unique (not generic)
   - Confirm summaries reflect actual context content
   - Check summary length constraints

7. **Cross-Platform Validation**
   - Run same tests on macOS, Linux, Windows
   - Verify file paths work on all platforms
   - Confirm line endings are handled correctly
   - Test with Docker containers for consistency

8. **Integration Validation**
   - Full workflow tests: init → create task → save context → switch tasks → load context
   - Multi-user scenarios: create golden → commit → another user pulls → loads golden
   - Verify `/resume` actually loads task-specific instructions
   - Confirm Claude Code recognizes updated `CLAUDE.md`

---

## Future Enhancements

### Context Analytics

Track context effectiveness:
- How often is it loaded?
- Does it lead to successful outcomes?
- Which contexts are most valuable?

### Context Templates

Pre-built golden contexts for common tasks:
- "API integration starter"
- "Database migration template"
- "Auth debugging context"

### Context Merging

Intelligently combine multiple contexts:
```bash
/context-merge oauth-deep-dive edge-cases → oauth-complete
```

### Context Diffing

Compare two contexts to see what changed:
```bash
/context-diff oauth-v1 oauth-v2
> Shows: What new understanding was gained
```

### Context Versioning

Track evolution of understanding:
```
oauth-flow.v1.jsonl  # Initial understanding
oauth-flow.v2.jsonl  # After finding rate limit bug
oauth-flow.v3.jsonl  # After mobile app integration
```

---

## Appendix: Command Summary

| Command | Purpose | Context | Notes |
|---------|---------|---------|-------|
| `/task <id>` | Switch to task | Main | Creates if new, resumes if exists |
| `/context-save <name>` | Save session | Fork | Personal by default, ask about golden |
| `/context-list [task]` | List contexts | Fork | Active sessions + AI-generated summaries |
| `/context-manage` | Interactive management | Fork | Claude assists with organization |
| `/context-promote <name>` | Personal → Golden | Fork | Secret scanning + redaction |

---

## Appendix: Directory Reference

```
# PROJECT REPOSITORY (committed)
./
├── CLAUDE.md                          # Never modified
└── .claude/
    ├── CLAUDE.md                      # Git-ignored, auto-generated
    ├── tasks/
    │   └── oauth-refactor/
    │       ├── CLAUDE.md              # Committed
    │       ├── README.md              # Committed
    │       └── contexts/              # Golden contexts (committed)
    │           └── warmed-up.jsonl
    └── .gitignore

# PERSONAL STORAGE (never committed)
~/.claude/
├── commands/                          # Global slash commands
│   ├── task.md
│   ├── context-save.md
│   ├── context-list.md
│   ├── context-manage.md
│   └── context-promote.md
│
└── projects/
    └── -Users-dev-my-project/
        ├── tasks/
        │   └── oauth-refactor/
        │       └── contexts/          # Personal contexts
        │           └── my-work.jsonl
        └── .stash/
            └── original-CLAUDE.md
```

---

## Version History

- **v17.0** (2026-03-10): Merged Commands Reference content into Features sections; deleted Commands Reference section
- **v16.0** (2026-03-10): Added Commands Reference section with Purpose/Execution/Behavior/Example for all five commands
- **v15.0** (2026-03-10): Embedded DoD acceptance criteria into feature sections; added Feature 14 (PreCompact Auto-Save Hook); removed standalone DoD table
- **v13.0** (2026-01-17): Two-file CLAUDE.md system, golden contexts, secret detection, interactive management
- **v12.0** (2026-01-12): Forked execution, @-import mechanism
- **v11.0** (2026-01-12): Personal storage in ~/.claude/projects/
- **v10.0** (2026-01-10): Initial @-import architecture

---

## License

MIT License - see LICENSE file for details

---

## Acknowledgments

- Claude Code team at Anthropic for `context: fork` and `/resume` behavior
- Community for multi-instance workflows and best practices
- Every developer who's lost hours of hard-won context to auto-compact

**Built with ❤️ to preserve developer sanity and hard-won knowledge**
