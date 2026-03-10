# Developer Implementation Plan: Context Curator v13.0

**Version:** 13.0  
**Last Updated:** January 17, 2026  
**Status:** Ready for Implementation  
**Based on:** PRD v17.0

---

## Executive Summary

This plan implements the **task-based context management system** described in PRD v13.0. The core innovation solves the **warm-up problem**: preserving hard-won Claude understanding that gets lost to auto-compact.

**Core Architecture:**
- **Tasks** = Focused work environments with custom CLAUDE.md
- **Contexts** = Named snapshots of warmed-up Claude sessions
- **Personal by default** = Contexts stay private unless explicitly shared
- **Golden contexts** = Team knowledge base of valuable warmed-up sessions
- **Two-file CLAUDE.md** = No git conflicts (root committed, .claude/ git-ignored)

**Key Innovation:** Claude Code's `/resume` re-reads CLAUDE.md from disk, enabling task-specific instructions to take effect at resume-time.

> **Known Risk:** This behavior is not officially documented by Anthropic. If a future Claude Code update changes it, task switching breaks silently. Add a smoke test: after `/resume`, verify a known string from the task CLAUDE.md appears in system context.

**No API key required. Works entirely within Claude Code using native features.**

---

## Architecture Overview

### The Two-File System

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

### Storage Structure

**Project Directory (Committed):**
```
my-project/
├── CLAUDE.md                          # ← Committed, never modified
└── .claude/
    ├── CLAUDE.md                      # ← Auto-generated, git-ignored
    ├── tasks/                         # ← Task definitions (committed)
    │   ├── oauth-refactor/
    │   │   ├── CLAUDE.md              # ← Task knowledge
    │   │   ├── README.md              # ← Task docs
    │   │   └── contexts/              # ← Golden contexts (max 100KB each) (committed)
    │   │       └── oauth-deep-dive.jsonl
    │   └── default/
    │       └── CLAUDE.md              # ← Copy of original CLAUDE.md
    └── .gitignore
```

**Personal Storage (Never Committed):**
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
        │   └── oauth-refactor/
        │       └── contexts/          # Personal contexts
        │           ├── my-work.jsonl
        │           └── edge-cases.jsonl
        └── .stash/
            └── original-CLAUDE.md     # Backup of project's CLAUDE.md
```

### Project ID Encoding

```
/Users/dev/my-project → -Users-dev-my-project
```

---

## Implementation Phases

### Phase 1: Foundation (Critical Path)
1. Installation mechanism (curl-based)
2. Project initialization (`/task-init`)
3. Two-file CLAUDE.md system
4. @-import mechanism

### Phase 2: Core Commands
1. `/task` - Switch/create tasks
2. `/context-save` - Save sessions (personal/golden)
3. `/context-list` - List with AI summaries

### Phase 3: Context Management
1. `/context-manage` - Interactive management
2. `/context-promote` - Personal → Golden with secret scanning

### Phase 4: Advanced Features
1. Secret detection and redaction
2. Context merging
3. Context analytics

---

## Phase 1: Foundation

### 1.1 Installation

**One-time global setup:**

```bash
# Create directories
mkdir -p ~/.claude/commands
mkdir -p ~/.claude/projects

# Download commands from repository
cd ~/.claude/commands
curl -O <repo-url>/commands/task.md
curl -O <repo-url>/commands/context-save.md
curl -O <repo-url>/commands/context-list.md
curl -O <repo-url>/commands/context-manage.md
curl -O <repo-url>/commands/context-promote.md

# Verify installation
ls ~/.claude/commands/*.md
```

**Testing:**
- [ ] Commands download successfully
- [ ] Commands are accessible in Claude Code
- [ ] No dependencies required (uses native Claude Code features)

### 1.2 Project Initialization (/task-init)

**Purpose:** Set up the two-file CLAUDE.md system on first use

**What it creates:**
1. `.claude/` directory with `.gitignore`
2. `.claude/tasks/default/CLAUDE.md` (copy of root CLAUDE.md)
3. `.claude/CLAUDE.md` with @import directives
4. Backup of original CLAUDE.md in personal storage

**Implementation:**

```markdown
---
description: Initialize context-curator in a project
allowed-tools: Bash, Read, Write
---

# Project Initialization

## Step 1: Check if already initialized

Check if `.claude/tasks/default/CLAUDE.md` exists.
If yes, inform user and exit.

## Step 2: Create directory structure

```bash
mkdir -p .claude/tasks/default/contexts
```

## Step 3: Create .gitignore

```bash
cat > .claude/.gitignore << 'EOF'
# Auto-generated file (each dev has their own)
CLAUDE.md
EOF
```

## Step 4: Backup and copy root CLAUDE.md

Read `./CLAUDE.md` (or create minimal default).
Copy to `.claude/tasks/default/CLAUDE.md`.
Backup to `~/.claude/projects/<project-id>/.stash/original-CLAUDE.md`.

## Step 5: Generate .claude/CLAUDE.md

```markdown
# Project: <project-name>

## Universal Instructions

Add your project-wide guidelines here:
- Coding standards
- Common commands
- Shared practices

## Task-Specific Context

@import ~/.claude/projects/<project-id>/tasks/default/CLAUDE.md

<!-- This line is managed by context-curator. Do not edit manually. -->
```

## Step 6: Confirm

Display:
```
✓ Initialized context-curator
✓ Created .claude/tasks/default/
✓ Root CLAUDE.md unchanged (never modified)
✓ .claude/CLAUDE.md created with @import

Next steps:
• Edit ./CLAUDE.md for universal instructions
• /task oauth-refactor - Create a new task
• /context-save my-progress - Save your work
```
```

**Testing:**
- [ ] Creates `.claude/` directory structure
- [ ] Creates `.gitignore` with correct contents
- [ ] Backs up root CLAUDE.md to default task
- [ ] Creates `.claude/CLAUDE.md` with @import
- [ ] Preserves original root CLAUDE.md
- [ ] Idempotent (safe to run multiple times)
- [ ] Creates backup in personal storage

### 1.3 @-import Update Mechanism

**Purpose:** Update the @import line in `.claude/CLAUDE.md` when switching tasks

**Key Principle:** Claude Code re-reads CLAUDE.md on `/resume`, so we can modify `.claude/CLAUDE.md` and have new instructions take effect.

**Implementation (update-import.ts):**

```typescript
#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function updateImport(taskId: string) {
  const cwd = process.cwd();
  const projectId = cwd.replace(/\//g, '-');
  const claudeMdPath = path.join(cwd, '.claude/CLAUDE.md');
  
  // Check personal storage first
  const personalTaskPath = path.join(
    process.env.HOME!,
    '.claude/projects',
    projectId,
    'tasks',
    taskId,
    'CLAUDE.md'
  );
  
  // Check project storage (for golden tasks)
  const projectTaskPath = path.join(cwd, '.claude/tasks', taskId, 'CLAUDE.md');
  
  let importPath: string;
  
  // Prefer personal, fall back to project
  try {
    await fs.access(personalTaskPath);
    importPath = `~/.claude/projects/${projectId}/tasks/${taskId}/CLAUDE.md`;
  } catch {
    try {
      await fs.access(projectTaskPath);
      importPath = `tasks/${taskId}/CLAUDE.md`;
    } catch {
      console.error(`❌ Task '${taskId}' not found`);
      process.exit(1);
    }
  }
  
  // Read and update CLAUDE.md
  let content = await fs.readFile(claudeMdPath, 'utf-8');
  
  const importRegex = /@import [^\n]+CLAUDE\.md/;
  const newImportLine = `@import ${importPath}`;
  
  if (importRegex.test(content)) {
    content = content.replace(importRegex, newImportLine);
  } else {
    content = content.trim() + '\n\n' + newImportLine + '\n';
  }
  
  await fs.writeFile(claudeMdPath, content);
  console.log(`✓ Task context: ${taskId}`);
}

const taskId = process.argv[2];
if (!taskId) {
  console.error('Usage: update-import <task-id>');
  process.exit(1);
}

updateImport(taskId).catch(console.error);
```

**Testing:**
- [ ] Updates @import line correctly
- [ ] Checks personal storage first, then project
- [ ] Lists available tasks on error
- [ ] Preserves other CLAUDE.md content

---

## Phase 2: Core Commands

### 2.1 /task Command

**Purpose:** Switch to a task (creates if new, resumes if exists)

**Implementation:**

```markdown
---
description: Switch to a task (create if new, resume if exists)
allowed-tools: Bash, Read, Write, Edit
---

# Task Switcher

Usage: /task <task-id>

## Step 1: Validate input

```bash
TASK_ID=$1

if [ -z "$TASK_ID" ]; then
  echo "Usage: /task <task-id>"
  exit 1
fi

if ! [[ "$TASK_ID" =~ ^[a-z0-9-]+$ ]]; then
  echo "❌ Invalid task ID. Use lowercase, numbers, hyphens only."
  exit 1
fi
```

## Step 2: Check if task exists

Check both:
- Personal: `~/.claude/projects/<project-id>/tasks/<task-id>/CLAUDE.md`
- Project: `./.claude/tasks/<task-id>/CLAUDE.md`

## Step 3a: Create new task (if needed)

Ask the user: **"What should this task focus on?"**

Based on their answer, create task CLAUDE.md:

```markdown
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
```

Create in personal storage: `~/.claude/projects/<project-id>/tasks/<task-id>/CLAUDE.md`
Create contexts dir: `~/.claude/projects/<project-id>/tasks/<task-id>/contexts/`

## Step 3b: List contexts (if task exists)

Show both personal and golden contexts:

```
Which context to load?

Personal contexts:
1. my-progress (15 msgs) - 2025-01-16

Golden contexts (team shared):
2. oauth-deep-dive (47 msgs) - 2025-01-15 - by: alice ⭐

Choice (or enter for default):
```

## Step 4: Update .claude/CLAUDE.md

Modify @import line to point to selected task's CLAUDE.md.

## Step 5: Prepare session

If context selected, copy to session file.
Generate session ID.

## Step 6: Output instructions

```
✓ Task: oauth-refactor
✓ Context: oauth-deep-dive (47 msgs)

Run: /resume <uuid>

Your focus:
  Refactoring the legacy OAuth implementation in src/auth/
```
```

**Testing:**
- [ ] Validates task ID format
- [ ] Creates new tasks with user guidance
- [ ] Lists personal and golden contexts
- [ ] Updates @import correctly
- [ ] Provides /resume command
- [ ] Shows task focus summary

### 2.2 /context-save Command

**Purpose:** Save current session as a context (personal by default, golden if flagged)

> **Secret Scanning Policy:** Secrets are scanned at every save, not just at promotion. Personal saves warn but do not block. Golden saves require acknowledgement and offer redaction before proceeding.

**Execution:** Forked context (has access to current session)

**Implementation:**

```markdown
---
description: Save current session as a context
context: fork
allowed-tools: Bash, Read, Write
---

# Save Session Context

Usage: /context-save <name>

You have full access to the current conversation for analysis.

## Step 1: Validate context name

Must match /^[a-z0-9-]+$/

## Step 2: Determine current task

Extract from @import line in .claude/CLAUDE.md

## Step 3: Scan for secrets

Check for:
- Stripe API keys: sk_test_, sk_live_
- AWS keys: AKIA[0-9A-Z]{16}
- GitHub tokens: ghp_[a-zA-Z0-9]{36}
- Generic API keys: api_key, apiKey patterns
- Passwords: password=, pwd=
- Private keys: -----BEGIN PRIVATE KEY-----

If found, warn user and list locations.

## Step 4: Ask storage location

```
Save this context as:
1. Personal (only you can access)
2. Golden (shared with team via git)

Choice (1/2):
```

## Step 5a: Save as personal

Save to: `~/.claude/projects/<project-id>/tasks/<task-id>/contexts/<name>.jsonl`

## Step 5b: Save as golden

If secrets found and not redacted, require confirmation.

Save to: `./.claude/tasks/<task-id>/contexts/<name>.jsonl`

Remind user:
```
Next steps:
  git add .claude/tasks/<task-id>/contexts/<name>.jsonl
  git commit -m "Add <name> golden context"
  git push
```

## Step 6: Confirm

```
✓ Saved as personal context
✓ Location: ~/.claude/projects/.../contexts/<name>.jsonl
```
```

**Testing:**
- [ ] Validates context name
- [ ] Scans for secrets
- [ ] Asks personal vs golden
- [ ] Saves to correct location
- [ ] Warns about secrets
- [ ] Provides git commands for golden

### 2.3 /context-list Command

**Purpose:** List all contexts with AI-generated summaries

**Execution:** Forked context (can read files and generate summaries)

**Implementation:**

```markdown
---
description: List contexts with AI-generated summaries
context: fork
allowed-tools: Bash, Read
---

# Context Listing with Summaries

Usage: /context-list [task-id]

## Step 1: Determine task

If task-id provided, use it.
Otherwise, extract current task from @import line.

## Step 2: List personal contexts

Read from: `~/.claude/projects/<project-id>/tasks/<task-id>/contexts/`

For each .jsonl file:
- Count messages
- Get last modified date
- Read sample messages (first 10, last 10)
- Generate 1-2 sentence summary

## Step 3: List golden contexts

Read from: `./.claude/tasks/<task-id>/contexts/`

For each .jsonl file:
- Count messages
- Get last modified date
- Get author from git log
- Read sample and generate summary

## Step 4: Display

```
# Contexts: oauth-refactor

## Personal contexts

### my-progress
**15 messages** • 2025-01-16

**Summary:** Working through OAuth token validation edge cases,
focusing on mobile app authentication flow and session timeout handling.

## Golden contexts (team shared)

### oauth-deep-dive ⭐
**47 messages** • 2025-01-15 • by: alice

**Summary:** Complete analysis of legacy OAuth implementation including
custom token format, three-tier session storage, and rate limiting issue.

---

**Load a context:** `/task oauth-refactor` then select from menu
```
```

**Testing:**
- [ ] Lists personal contexts
- [ ] Lists golden contexts
- [ ] Generates meaningful summaries
- [ ] Shows author for golden contexts
- [ ] Shows message counts and dates
- [ ] Provides load instructions

---

## Phase 3: Context Management

### 3.1 /context-manage Command

**Purpose:** Interactive context management with Claude's assistance

**Execution:** Forked context (full file access and intelligent suggestions)

**Implementation:**

```markdown
---
description: Interactive context management with Claude's assistance
context: fork
allowed-tools: Bash, Read, Write, Edit
---

# Context Management Assistant

## Phase 1: Discovery

Scan all contexts across all tasks and present organized view:

```
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

**Golden:**
5. `stripe-flow` ⭐ - 32 msgs - Production integration (by: you)
```

## Phase 2: Interactive Loop

Accept commands:
- `rename <number>` - Rename a context
- `delete <number>` - Delete a context
- `merge <numbers>` - Merge multiple contexts
- `promote <number>` - Make a golden context
- `demote <number>` - Make personal again
- `view <number>` - View full summary
- `diff <num1> <num2>` - Compare two contexts
- `secrets <number>` - Scan for secrets
- `clean` - Find and remove old/duplicate contexts
- `archive` - Archive contexts older than 30 days
- `done` - Exit management

## Intelligent Assistance

- For rename: suggest better names based on content
- For delete: warn about important contexts
- For clean: analyze for duplicates, stale contexts
- For promote: scan secrets, confirm sharing
- For view: generate comprehensive summary
- For merge: intelligently combine related contexts

## Example Session

User: clean

```
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
```
```

**Testing:**
- [ ] Scans all tasks and contexts
- [ ] Supports all management commands
- [ ] Provides intelligent suggestions
- [ ] Handles confirmation workflows
- [ ] Updates files correctly

### 3.2 /context-promote Command

**Purpose:** Promote personal context to golden (shared with team)

**Execution:** Forked context

**Implementation:**

```markdown
---
description: Promote personal context to golden (shared with team)
context: fork
allowed-tools: Bash, Read, Write
---

# Promote to Golden Context

Usage: /context-promote <name>

## Step 1: Find personal context

Locate: `~/.claude/projects/<project-id>/tasks/<current-task>/contexts/<name>.jsonl`

## Step 2: Scan for secrets

Check for API keys, passwords, tokens, private keys.

## Step 3: Handle secrets

If secrets found:
```
⚠️  Found potential secrets:
- Line 89: API key pattern (pk_test_...)
- Line 124: Database password

Options:
1. Continue anyway (not recommended)
2. Let me help redact secrets first
3. Cancel
```

If option 2:
- Create sanitized version
- Show what was redacted
- Confirm before saving

## Step 4: Promote

Copy sanitized (or original) to: `./.claude/tasks/<task-id>/contexts/<name>.jsonl`

Keep personal copy as backup.

## Step 5: Confirm

```
✓ Promoted to golden context
✓ Location: ./.claude/tasks/oauth-refactor/contexts/edge-cases.jsonl

Personal copy remains at:
  ~/.claude/projects/.../oauth-refactor/contexts/edge-cases.jsonl

Next steps:
  git add .claude/tasks/oauth-refactor/contexts/edge-cases.jsonl
  git commit -m "Share edge-cases context for OAuth work"
  git push
```
```

**Testing:**
- [ ] Finds personal context
- [ ] Scans for secrets accurately
- [ ] Offers redaction option
- [ ] Copies to golden location
- [ ] Preserves personal backup
- [ ] Provides git commands

---

## Phase 4: Advanced Features

### 4.1 Secret Detection

**Patterns to detect:**
- Stripe: `sk_test_`, `sk_live_`, `pk_test_`, `pk_live_`
- AWS: `AKIA[0-9A-Z]{16}`, `aws_secret_access_key`
- GitHub: `ghp_[a-zA-Z0-9]{36}`, `github_pat_`
- Generic: `api_key`, `apiKey`, `API_KEY`, `secret`, `password`, `pwd`
- Private keys: `-----BEGIN PRIVATE KEY-----`, `-----BEGIN RSA PRIVATE KEY-----`
- Database URLs: `postgres://`, `mysql://`, `mongodb://` with embedded passwords

**Redaction approach:**
- Replace with `[REDACTED]` while preserving context
- Keep first few characters for recognition (e.g., `pk_test_[REDACTED]`)
- Note line numbers in report

### 4.2 Context Analytics (Future)

Track:
- Context usage frequency
- Session outcomes after loading context
- Most valuable contexts (time saved)

### 4.3 Context Merging (Future)

Intelligently combine contexts:
- Deduplicate similar messages
- Preserve chronological order
- Maintain coherent conversation flow

---

## File Structure

### Commands (in ~/.claude/commands/)

| File | Purpose |
|------|---------|
| `task.md` | Switch/create tasks |
| `context-save.md` | Save sessions |
| `context-list.md` | List with summaries |
| `context-manage.md` | Interactive management |
| `context-promote.md` | Personal → Golden |

### Project Files (in ./.claude/)

| File | Committed | Purpose |
|------|-----------|---------|
| `CLAUDE.md` | No (git-ignored) | Auto-generated @import |
| `tasks/*/CLAUDE.md` | Yes | Task instructions |
| `tasks/*/README.md` | Yes | Task documentation |
| `tasks/*/contexts/*.jsonl` | Yes | Golden contexts |
| `.gitignore` | Yes | Ignore rules |

### Personal Files (in ~/.claude/projects/)

| Path | Purpose |
|------|---------|
| `<project-id>/tasks/*/CLAUDE.md` | Personal task instructions |
| `<project-id>/tasks/*/contexts/*.jsonl` | Personal contexts |
| `<project-id>/.stash/original-CLAUDE.md` | Backup |

---

## Testing Strategy

### Unit Tests

- [ ] Project ID encoding
- [ ] @import parsing and updating
- [ ] Context name validation
- [ ] Secret detection patterns
- [ ] JSONL reading/writing

### Integration Tests

- [ ] Project initialization workflow
- [ ] Task creation workflow
- [ ] Context save (personal)
- [ ] Context save (golden)
- [ ] Context promotion with secrets
- [ ] @import switching

### End-to-End Tests

- [ ] Fresh project initialization
- [ ] Create task, warm up, save context
- [ ] Load golden context on different machine
- [ ] Multi-developer workflow simulation
- [ ] Secret detection prevents accidental leaks

---

## Success Criteria

### Technical

- [ ] Two-file CLAUDE.md system works
- [ ] @import updates correctly
- [ ] /resume loads new instructions
- [ ] Personal/golden separation clear
- [ ] Secret detection catches common patterns
- [ ] No data loss in any scenario

### User Experience

- [ ] Task switching feels natural
- [ ] Context save is one command
- [ ] Summaries are helpful
- [ ] Golden context sharing is explicit
- [ ] Error messages guide users

### Documentation

- [ ] All commands documented
- [ ] Two-file system explained
- [ ] Personal vs golden clear
- [ ] Troubleshooting guide complete

---

## Implementation Timeline

### Day 1: Foundation
- [ ] Command files structure
- [ ] Project initialization (/task-init)
- [ ] @import mechanism
- [ ] Basic /task command

### Day 2: Core Commands
- [ ] /task with context selection
- [ ] /context-save (personal)
- [ ] /context-save (golden)
- [ ] /context-list

### Day 3: Management
- [ ] /context-manage
- [ ] /context-promote
- [ ] Secret detection
- [ ] Secret redaction

### Day 4: Polish
- [ ] Testing
- [ ] Documentation
- [ ] Edge cases
- [ ] User feedback

---

## Key Design Decisions

### 1. Two-File System

**Why:** Eliminates git conflicts while preserving clean project history.

- Root `./CLAUDE.md` is canonical, committed, never touched
- `./.claude/CLAUDE.md` is per-developer, auto-generated

### 2. Personal by Default

**Why:** Prevents accidental secret leaks and reduces noise in team repos.

- All contexts start personal
- Explicit `/context-promote` to share
- Secret scanning before promotion

### 3. Forked Context Execution

**Why:** Commands have full conversation access for analysis without polluting main session.

- `context: fork` in command definition
- Can generate summaries, scan content
- Doesn't affect user's working session

### 4. @import at Resume Time

**Why:** Claude Code re-reads CLAUDE.md on `/resume`.

- Task switching = update @import + /resume
- No complex state management
- Works with existing Claude Code behavior

### 5. Golden Context via Git

**Why:** Uses existing infrastructure, familiar workflow.

**Size limit:** 100KB per golden context file. Warn and block on exceed to prevent repo bloat over time.

- Committed to repo like any other file
- Standard git workflow (add, commit, push)
- Team sees contexts in PR reviews

---

## Migration Notes

### From v10.x

v13.0 is a significant architecture change:

**Changed:**
- "Curator session" pattern removed (use `context: fork` instead)
- Personal storage structure updated
- Golden contexts added to project directory
- Two-file CLAUDE.md system

**Actions:**
1. Re-download commands
2. Run `/task-init` in each project
3. Personal contexts auto-migrate on first access
4. Golden contexts require explicit creation

---

## Troubleshooting

### @import not taking effect

**Solution:**
1. Verify `.claude/CLAUDE.md` has @import line
2. Ensure path in @import exists
3. Use `/resume` to reload (not just continue session)

### Context not showing in list

**Solution:**
1. Check file location (personal vs golden)
2. Verify .jsonl extension
3. Check context name format (lowercase, hyphens)

### Secrets detected incorrectly

**Solution:**
1. False positives happen (generic patterns)
2. Use "continue anyway" if certain
3. Report patterns for improvement

### Git conflicts in .claude/

**Solution:**
1. `.claude/CLAUDE.md` should be in `.claude/.gitignore`
2. Only `tasks/*/` contents should be committed
3. Each dev's @import is independent

---

## Appendix: Command Quick Reference

| Command | Purpose | Context |
|---------|---------|---------|
| `/task <id>` | Switch/create task | Main |
| `/context-save <name>` | Save session | Fork |
| `/context-list [task]` | List contexts | Fork |
| `/context-manage` | Interactive management | Fork |
| `/context-promote <name>` | Personal → Golden | Fork |

---

## Version History

- **v13.0** (2026-01-17): Two-file CLAUDE.md system, golden contexts, secret detection
- **v10.1** (2026-01-13): Global installation model
- **v10.0** (2026-01-10): Initial @-import architecture

---

**Built to preserve developer sanity and hard-won knowledge.**
