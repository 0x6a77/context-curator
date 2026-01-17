# Product Requirements Document: Claude Code Context Curator

**Version:** 13.0  
**Last Updated:** January 17, 2026  
**Status:** Ready for Implementation

---

## Executive Summary

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

When you run `/resume sess-xyz123`, Claude Code:

1. Loads session from disk (conversation history, tool calls, state)
2. **Re-reads CLAUDE.md from current directory** (fresh from disk!)
3. Reconstructs system prompt with CLAUDE.md in `<system-reminder>` tags
4. Restores runtime state
5. Resumes conversation

This means we can modify `./.claude/CLAUDE.md` between sessions and the new instructions take effect on `/resume`.

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

## Commands Reference

### `/task <task-id>`

**Purpose:** Switch to a task (creates if new, resumes if exists)

**Behavior:**

If task doesn't exist:
1. Ask: "What should this task focus on?"
2. Create `CLAUDE.md` for task based on description
3. Create default context (empty)
4. Modify `.claude/CLAUDE.md` to import task's CLAUDE.md
5. Output: "Run: /resume sess-xyz123"

If task exists:
1. List available contexts (personal + golden)
2. Ask which context to load
3. Modify `.claude/CLAUDE.md` to import task's CLAUDE.md
4. Copy selected context to session file
5. Output: "Run: /resume sess-xyz123"

**Example:**

```
You: /task oauth-refactor

# If new:
What should this task focus on?

You: Refactoring the legacy OAuth implementation in src/auth/

✓ Created task: oauth-refactor
✓ Location: ./.claude/tasks/oauth-refactor/

Run: /resume sess-abc123

Your focus:
  Refactoring the legacy OAuth implementation in src/auth/

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

Run: /resume sess-abc123

# Now /resume will read .claude/CLAUDE.md which imports oauth-refactor/CLAUDE.md
```

**Implementation:**

```markdown
---
description: Switch to a task (create if new, resume if exists)
allowed-tools: Bash, Read, Write, Edit
---

# Task Switcher

Usage: /task <task-id>

## Step 1: Validate input and setup paths

```bash
TASK_ID=$1

if [ -z "$TASK_ID" ]; then
  echo "Usage: /task <task-id>"
  echo ""
  echo "Examples:"
  echo "  /task oauth-refactor"
  echo "  /task payment-integration"
  echo "  /task bug-fix-session"
  exit 1
fi

if ! [[ "$TASK_ID" =~ ^[a-z0-9-]+$ ]]; then
  echo "❌ Invalid task ID. Use lowercase, numbers, hyphens only."
  exit 1
fi

PROJECT_ID=$(pwd | tr '/' '-' | sed 's/^-//')
TASK_DIR=./.claude/tasks/$TASK_ID
PERSONAL_CONTEXTS_DIR=~/.claude/projects/$PROJECT_ID/tasks/$TASK_ID/contexts
GOLDEN_CONTEXTS_DIR=$TASK_DIR/contexts
```

## Step 2: Check if task exists

If task directory doesn't exist, this is a new task.

## Step 3a: Create new task (if needed)

Ask the user: **"What should this task focus on?"**

Based on their answer, create comprehensive CLAUDE.md:

```bash
mkdir -p $TASK_DIR/contexts
mkdir -p $PERSONAL_CONTEXTS_DIR

cat > $TASK_DIR/CLAUDE.md << 'EOF'
# Task: <task-id>

## Focus
[User's description]

## Key Areas
[Relevant subsystems based on description]

## Guidelines
[Task-specific best practices]

## Common Pitfalls
[Document these as you discover them]

## Reference Files
[Key files for this task]
EOF

# Create default context
touch $PERSONAL_CONTEXTS_DIR/$TASK_ID-default.jsonl
```

## Step 3b: List contexts (if task exists)

Show both personal and golden contexts with summaries:

```bash
echo "Which context to load?"
echo ""

# List personal contexts
if [ -d "$PERSONAL_CONTEXTS_DIR" ]; then
  echo "Personal contexts:"
  IDX=1
  for CTX in $PERSONAL_CONTEXTS_DIR/*.jsonl; do
    if [ ! -f "$CTX" ]; then continue; fi
    CTX_NAME=$(basename "$CTX" .jsonl)
    MSG_COUNT=$(wc -l < "$CTX")
    MODIFIED=$(stat -f "%Sm" -t "%Y-%m-%d" "$CTX" 2>/dev/null || \
               stat -c "%y" "$CTX" 2>/dev/null | cut -d' ' -f1)
    echo "$IDX. $CTX_NAME ($MSG_COUNT msgs) - $MODIFIED"
    IDX=$((IDX + 1))
  done
fi

# List golden contexts
if [ -d "$GOLDEN_CONTEXTS_DIR" ]; then
  echo ""
  echo "Golden contexts (team shared):"
  for CTX in $GOLDEN_CONTEXTS_DIR/*.jsonl; do
    if [ ! -f "$CTX" ]; then continue; fi
    CTX_NAME=$(basename "$CTX" .jsonl)
    MSG_COUNT=$(wc -l < "$CTX")
    MODIFIED=$(stat -f "%Sm" -t "%Y-%m-%d" "$CTX" 2>/dev/null || \
               stat -c "%y" "$CTX" 2>/dev/null | cut -d' ' -f1)
    AUTHOR=$(git log --format="%an" -- "$CTX" 2>/dev/null | head -1)
    echo "$IDX. $CTX_NAME ($MSG_COUNT msgs) - $MODIFIED - by: ${AUTHOR:-unknown} ⭐"
    IDX=$((IDX + 1))
  done
fi

echo ""
echo "Choice (or enter for default):"
```

## Step 4: Stash original CLAUDE.md (first time only)

```bash
STASH_DIR=~/.claude/projects/$PROJECT_ID/.stash
mkdir -p $STASH_DIR

if [ ! -f $STASH_DIR/original-CLAUDE.md ]; then
  if [ -f ./CLAUDE.md ]; then
    cp ./CLAUDE.md $STASH_DIR/original-CLAUDE.md
  fi
fi
```

## Step 5: Generate .claude/CLAUDE.md with @import

```bash
mkdir -p .claude

cat > .claude/CLAUDE.md << EOF
# This file is auto-generated by /task command
# DO NOT EDIT MANUALLY

@import ../CLAUDE.md
@import tasks/$TASK_ID/CLAUDE.md

<!-- Current task: $TASK_ID -->
EOF

echo "✓ Updated .claude/CLAUDE.md → tasks/$TASK_ID"
```

## Step 6: Create session and output instructions

```bash
SESSION_ID="sess-$(head /dev/urandom | tr -dc a-z0-9 | head -c 8)"
SESSION_FILE=~/.claude/sessions/$SESSION_ID.jsonl

mkdir -p ~/.claude/sessions

# Copy selected context to session (or create empty)
if [ -f "$SELECTED_CONTEXT" ]; then
  cp "$SELECTED_CONTEXT" "$SESSION_FILE"
  MSG_COUNT=$(wc -l < "$SESSION_FILE")
else
  touch "$SESSION_FILE"
  MSG_COUNT=0
fi

echo ""
echo "✓ Task: $TASK_ID"
if [ $MSG_COUNT -gt 0 ]; then
  echo "✓ Context: $CONTEXT_NAME ($MSG_COUNT msgs)"
else
  echo "✓ Using default context (empty)"
fi
echo ""
echo "Run: /resume $SESSION_ID"
echo ""
echo "Your focus:"
head -n 10 $TASK_DIR/CLAUDE.md | grep -A 5 "^## Focus" || cat $TASK_DIR/CLAUDE.md | head -10
```
```

---

### `/context-save <name> [--golden]`

**Purpose:** Save current session as a context (personal by default, golden if flagged)

**Execution:** Forked context (has access to current session, doesn't pollute)

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

**Implementation:**

```markdown
---
description: Save current session as a context
context: fork
allowed-tools: Bash, Read, Write
---

# Save Session Context

You have full access to the current conversation for analysis.

## Arguments
- $1: Context name (required)

## Steps

1. **Validate context name**
2. **Determine current task from .claude/CLAUDE.md**
3. **Scan for secrets in current session**
4. **Ask: Personal or Golden?**
5. **If golden: Confirm and save to project**
6. **If personal: Save to ~/.claude/projects/**
7. **Output confirmation and next steps**

Secret scan patterns:
- Stripe API keys: sk_test_, sk_live_
- AWS keys: AKIA[0-9A-Z]{16}
- GitHub tokens: ghp_[a-zA-Z0-9]{36}
- Generic API keys: api_key, apiKey patterns
- Passwords: password=, pwd=
- Private keys: -----BEGIN PRIVATE KEY-----
```

---

### `/context-list [task-id]`

**Purpose:** List all contexts with AI-generated summaries

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

# Contexts: oauth-refactor

## Personal contexts

### my-progress
**15 messages** • 2025-01-16

**Summary:** Working through OAuth token validation edge cases, 
focusing on mobile app authentication flow and session timeout handling.

### edge-cases  
**8 messages** • 2025-01-15

**Summary:** Explored boundary conditions in session token generation,
including concurrent request handling and Redis cache failures.

## Golden contexts (team shared)

### oauth-deep-dive ⭐
**47 messages** • 2025-01-15 • by: alice

**Summary:** Complete analysis of legacy OAuth implementation including
custom token format (v2.{sessionId}.{hmac}), three-tier session storage
(Redis/PostgreSQL/cookies), and rate limiting bypass issue in middleware.
Includes mobile app auth flow fixes and debugging approaches.

### warmed-up ⭐
**32 messages** • 2025-01-14 • by: bob

**Summary:** Deep dive into session state management across distributed
systems, covering Redis cluster failover scenarios and PostgreSQL backup
synchronization patterns.

---

**Load a context:** `/task oauth-refactor` then select from menu
```

**Implementation:**

```markdown
---
description: List contexts with AI-generated summaries
context: fork
allowed-tools: Bash, Read
---

# Context Listing with Summaries

You can read context files and generate intelligent summaries.

## For each context:

1. Read the .jsonl file
2. Extract sample messages (first 10, last 10)
3. Analyze conversation flow
4. Generate 1-2 sentence summary covering:
   - What was accomplished
   - Key topics explored
   - Notable outcomes or decisions

Present in clean markdown format with metadata.
```

---

### `/context-manage`

**Purpose:** Interactive context management with Claude's assistance

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

**Implementation:**

```markdown
---
description: Interactive context management with Claude's assistance
context: fork
allowed-tools: Bash, Read, Write, Edit
---

# Context Management Assistant

I'll help you manage contexts interactively.

## Phase 1: Discovery

Scan all contexts across all tasks and present organized view.

## Phase 2: Interactive Loop

Accept commands and provide intelligent assistance:

- For rename: suggest better names based on content
- For delete: warn about important contexts
- For clean: analyze for duplicates, stale contexts
- For promote: scan secrets, confirm sharing
- For view: generate comprehensive summary
- For merge: intelligently combine related contexts

Provide helpful context-aware suggestions throughout.
```

---

### `/context-promote <name>`

**Purpose:** Promote personal context to golden (shared with team)

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

---

## Workflows

### Starting a New Task

```bash
# 1. Create/switch to task
/task oauth-refactor

> What should this task focus on?
"Refactoring the legacy OAuth implementation in src/auth/"

✓ Created task
Run: /resume sess-abc123

# 2. Resume with task context
/resume sess-abc123

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
Run: /resume sess-xyz789

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

Run: /resume sess-new123

# Back to general development mode
```

---

## Key Features

### ✅ Preserves Hard-Won Context

The primary value: save those precious hours of warming Claude up on complex subsystems. Return to peak performance on-demand.

### ✅ Personal by Default, Share Explicitly

- All contexts start personal
- Explicitly promote valuable ones to golden
- Team builds knowledge base of warmed-up sessions

### ✅ No Git Conflicts

Two-file CLAUDE.md system:
- Root `CLAUDE.md` is committed, never modified
- `.claude/CLAUDE.md` is auto-generated, git-ignored
- Each developer has their own task state

### ✅ Secret Detection

Automatic scanning for:
- API keys (Stripe, AWS, GitHub, etc.)
- Passwords and credentials
- Private keys
- Helps prevent accidental secret sharing

### ✅ Intelligent Summaries

AI-generated summaries for every context:
- What was accomplished
- Key topics explored
- Notable decisions or patterns

### ✅ Team Knowledge Base

Golden contexts become team assets:
- New teammates ramp up faster
- Proven debugging approaches preserved
- Subsystem understanding documented

### ✅ Clean Project Directory

Minimal footprint in project:
- `.claude/` directory (mostly git-ignored)
- Task CLAUDE.md files (committed)
- Golden contexts (committed)
- Everything else stays in `~/.claude/projects/`

---

## Success Criteria

### MVP Complete When

- [x] `/task` creates or switches to tasks
- [x] Two-file CLAUDE.md system working (no git conflicts)
- [x] `/resume` loads task-specific instructions
- [x] Personal contexts save to `~/.claude/projects/`
- [x] Golden contexts save to `./.claude/tasks/.../contexts/`
- [x] Secret detection before golden promotion
- [x] `/context-list` shows summaries (AI-generated)
- [x] `/context-manage` provides interactive management
- [x] `/context-promote` with secret scanning and redaction
- [x] Documentation complete
- [x] Team can share golden contexts via git

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

### Claude Code Integration Points

**Critical behavior we rely on:**

1. `/resume` re-reads CLAUDE.md from disk
   - This enables task switching
   - Documented in research: "Re-read CLAUDE.md from current directory"

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
- `.claude/tasks/*/contexts/*.jsonl` - Golden contexts
- `.claude/.gitignore` - Ignore rules

**What NOT to commit:**
- `.claude/CLAUDE.md` - Auto-generated
- Personal contexts (they live in `~/.claude/projects/`)

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
| `/context-list [task]` | List contexts | Fork | AI-generated summaries |
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