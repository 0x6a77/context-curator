# Product Requirements Document: Claude Code Context Curator

**Version:** 21.1
**Last Updated:** May 10, 2026
**Status:** Ready for Implementation

---

## Overview

Claude Code Context Curator is a **task-based context management system** that solves the critical problem of losing hard-won context when Claude Code auto-compacts or exceeds token limits. It enables developers to preserve "warmed-up" Claude sessions and return to peak performance on-demand.

**The Problem:**
Working on large, legacy codebases requires significant warm-up time before Claude Code performs at its best on a specific subsystem. Once Claude understands the quirks, patterns, and gotchas, it performs exceptionally. But even with 1M context windows, context quality degrades well before the token ceiling — auto-compact destroys hard-won understanding, and "context rot" sets in at high fill levels regardless of window size. This forces developers to start over or accept degraded output. This is infuriating and wastes valuable time.

**The Solution:**
- **Tasks** = Focused work environments with dedicated instruction sets
- **Contexts** = Named snapshots of warmed-up Claude sessions
- **Personal by default** = Your contexts stay private
- **Golden contexts** = Explicitly share valuable warmed-up sessions with team
- **No git conflicts** = Two-file CLAUDE.md system keeps projects clean
- **Hooks integration** = Automatic context protection on compaction events
- **PRD-driven development** = Structured upstream quality that makes AI-generated code trustworthy
- **User documentation as feedback loop** = Markdown-first docs generated after every PRD update; shared with users before code is written

**Key Innovation:**
Claude Code's `/resume` re-reads CLAUDE.md from disk, enabling us to swap task-specific instructions at resume-time without polluting the project directory or causing git conflicts. Skills carry forward through compaction, and hooks fire deterministically — together these enable automatic context protection that doesn't require manual intervention.

---

## Core Concepts

### The Warm-Up Problem

```
Session start: Begin work on auth subsystem
  "Check the authentication middleware in src/auth/"

Early session: Claude warms up
  - Understands the legacy OAuth flow
  - Knows about the weird session token format
  - Remembers the three places auth state is stored
  - Gets the quirky error handling patterns

SWEET SPOT ✨  (typically 50K–200K tokens into context)
  - Claude is crushing it
  - Deep understanding of the auth subsystem
  - Makes changes confidently
  - Suggests good refactors

Context fills or auto-compact fires
  - Context gets summarized
  - Nuanced understanding lost
  - Back to generic suggestions

  Note: With 1M context windows, the cliff arrives later — but it
  still arrives. Context rot (degraded multi-needle recall) sets in
  well before the window fills. Quality loss is real at any scale.

😤 We lose hard-won knowledge
```

### Tasks

A **task** is a focused work environment containing:
- Custom CLAUDE.md with task-specific instructions
- Personal context snapshots (private)
- Golden context snapshots (shared with team via git)

Tasks represent different areas of work on the same codebase:
- **Examples**: oauth-refactor, payment-integration, legacy-migration, bug-fix-sessions

### Specialized Tasks

A **specialized task** is a task with pre-authored DNA — a fixed identity, operating parameters, and behavior protocol distributed as part of context-curator. Specialized tasks are not created by users; they are shipped with the installer and activated per-project via `/task-init` or explicitly via `/task <id>`.

Specialized tasks differ from user tasks in three ways:

| Dimension | User Task | Specialized Task |
|-----------|-----------|-----------------|
| Created by | Developer (`/task <id>`) | Shipped with context-curator |
| CLAUDE.md | User-authored, editable | Pre-authored, immutable |
| Context isolation | STANDARD (save/restore) | Declared in DNA (STRICT or STANDARD) |

**Context isolation modes:**

- **STANDARD**: Normal context save/restore behavior. The task switch shows the context menu and supports `/resume` from saved sessions. Used when the specialized task benefits from accumulated warm-up.
- **STRICT**: No context restoration. No context saving. Every invocation starts a fresh session. STRICT isolation is enforced by hooks, not by behavioral instruction — a `PreCompact` hook blocks compaction saves and a `SessionStart` hook with `resume` trigger verifies no prior context was loaded when the adversary task is active. STRICT isolation is load-bearing for tasks where prior session knowledge would compromise the task's purpose (e.g., an adversarial reviewer that must not be influenced by prior verdicts or by knowledge of the team's intent).

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

### The Skills Architecture

As of Claude Code v2.x, skills are the idiomatic way to package reusable behaviors. Context Curator commands are implemented as **skills** rather than raw slash commands, with the following advantages:

- Skills survive auto-compaction: Claude Code re-attaches the most recent invocation of each skill after compaction, keeping the first 5,000 tokens per skill (combined 25,000-token budget)
- Skills are auto-invocable: the description-based trigger means Claude can call context management behaviors without the user invoking the slash command explicitly
- Skills are composable: supporting files (scripts, templates) live in the skill directory alongside SKILL.md

**Skill locations:**
- `~/.claude/skills/context-curator/` — user-scoped skills (all CC commands)
- `.claude/skills/` — project-scoped skills (if project-specific overrides are needed)

### Hooks Integration

Context Curator registers hooks that fire deterministically regardless of Claude's behavior:

| Hook | Trigger | Purpose |
|------|---------|---------|
| `PreCompact` | auto/manual | Auto-save current session to timestamped file before compaction |
| `PostCompact` | (any) | Re-inject current task CLAUDE.md content into session as context reminder |
| `SessionStart` | resume | Detect active task and validate context isolation mode |
| `SessionStart` | compact | Re-inject task context summary after compaction |

The `PostCompact` hook is the most transformative addition: it closes the loop between compaction events and task context restoration, so developers working inside a task automatically get a context reminder after every compaction without manual intervention.

---

## Architecture

### Project Structure (Clean, Minimal Git Footprint)

```
my-project/
├── CLAUDE.md                          # ← Committed, never modified
│   # Contains universal project instructions
│
├── .claude/                           # ← Partially committed (see .gitignore)
│   ├── CLAUDE.md                      # ← Auto-generated, git-ignored
│   │   # Contains @import to current task
│   │
│   ├── skills/                        # ← Project-scope skills (committed, optional)
│   │   └── context-curator/           #   Only present if project-scope install chosen
│   │       ├── task/
│   │       │   ├── SKILL.md           # ← /task command
│   │       │   └── scripts/
│   │       ├── context-save/
│   │       │   ├── SKILL.md           # ← /context-save command
│   │       │   └── scripts/
│   │       └── ...                    #   (other skills)
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
├── prod-mgmt/                         # ← PRD-driven development artifacts
│   ├── risk-acceptances.md            # ← Human-reviewed risk acceptances
│   └── test-inventory.md             # ← Adversary output (not committed)
│
├── docs/                              # ← User documentation (committed)
│   ├── index.html                     # ← Entry point; built from toc + intro
│   ├── feature-section-map.md         # ← Feature → product section mapping
│   ├── markdown/                      # ← Source of truth; always updated first
│   │   ├── toc.md
│   │   ├── introduction.md
│   │   ├── glossary.md
│   │   ├── permuted-index.md
│   │   └── [product-section].md
│   └── html/                          # ← Generated; never hand-edited
│       ├── style.md                   # ← Style guide (typeface, color, a11y)
│       └── [product-section].html
│
├── src/
├── tests/
└── package.json

# .claude/.gitignore contents:
# CLAUDE.md                   # Auto-generated file
# (skills/ and tasks/ are NOT ignored — they are committed)
```

### Personal Storage Structure (Never Committed)

```
~/.claude/
├── skills/                            # Global skills (context-curator commands)
│   └── context-curator/
│       ├── authoring/                 # Document authoring skills
│       │   ├── prd/SKILL.md           # /prd
│       │   ├── test-plan/SKILL.md     # /test-plan
│       │   ├── dev-plan/SKILL.md      # /dev-plan
│       │   ├── test-inventory/SKILL.md # /test-inventory (adversary only)
│       │   ├── docs-markdown/SKILL.md # /docs-markdown — markdown base update
│       │   └── docs-html/SKILL.md     # /docs-html — HTML generation
│       ├── session/                   # Session management skills
│       │   ├── task/SKILL.md          # /task
│       │   ├── context-save/SKILL.md  # /context-save
│       │   ├── context-list/SKILL.md  # /context-list
│       │   ├── context-manage/SKILL.md # /context-manage
│       │   └── context-promote/SKILL.md # /context-promote
│       └── monitor/                   # Context monitoring skills
│           ├── status/SKILL.md
│           ├── warn/SKILL.md
│           └── cost/SKILL.md
│
├── hooks/                             # Global hooks
│   ├── precompact-autosave.sh         # PreCompact → auto-save
│   └── postcompact-reinject.sh        # PostCompact → task context re-injection
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
        ├── auto-saves/                # Hook-generated pre-compaction snapshots
        │   └── 2026-05-09T14-32-00.jsonl
        │
        └── .stash/
            └── original-CLAUDE.md     # Backup of project's CLAUDE.md

# SPECIALIZED TASK DNA (read-only, shipped with context-curator)
~/.claude/
└── context-curator/
    ├── dist/                          # Compiled scripts
    └── specialized/                   # Bundled specialized tasks
        └── adversary/
            └── CLAUDE.md              # Adversary DNA (never modified by user ops)
```

> **Immutability contract:** No script operation on user tasks (task-create, update-import, save-context, etc.) may write to or read-modify-write any file under `~/.claude/context-curator/specialized/`. The only process that writes to this directory is the installer (`install.sh`).

---

## Installation

### Option A: Global Install (one developer, all projects)

Run once. Skills and hooks become available in every project on this machine.

```bash
./install.sh

# Creates:
#   ~/.claude/skills/context-curator/  (skill SKILL.md files + scripts)
#   ~/.claude/hooks/                   (PreCompact, PostCompact, monitor hooks)
#   ~/.claude/context-curator/         (specialized task DNA, rate config)
```

Every developer on a team runs this independently. Nothing is committed to the project repo. Suitable for individual developers or teams who want a personal install.

### Option B: Project Install (whole team, zero per-developer setup)

Skills are committed to the project repository. Any developer who clones the repo gets all context-curator commands immediately — no installer required.

```bash
# First developer sets up the project:
./install.sh --project-install /path/to/my-project

# This copies skill directories into .claude/skills/context-curator/
# and commits them alongside task definitions.
# Every subsequent developer just clones and runs claude.
```

Or during per-project initialization:

```bash
claude
You: /task-init
# Prompted: "Install skills globally (~/.claude) or into this project (.claude)?"
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
- `.claude/skills/context-curator/` (if project-scope install chosen)
- `prod-mgmt/` directory for PRD-driven development artifacts
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
git commit -m "Add OAuth deep-dive golden context"
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

### Automatic Context Protection (Hooks)

With hooks installed, context protection is automatic:

```
[Claude Code] Context at 78% — auto-compact triggered
[PreCompact hook] → auto-save: ~/.claude/projects/.../auto-saves/2026-05-09T14-32-00.jsonl
[Auto-compact runs]
[PostCompact hook] → re-injecting task context for: oauth-refactor
  "You are working in the oauth-refactor task. Current focus: legacy OAuth
   implementation in src/auth/. Key understanding: weird session token format,
   three places auth state is stored..."
[Session continues with task context restored]
```

No manual intervention required.

### Running the LoD2 Adversary

```bash
# Switch to adversary task (STRICT isolation — always fresh)
/task adversary

# Adversary scans PRD, tests, risk-acceptances.md
# Writes output to ./prod-mgmt/test-inventory.md
# Session ends

# Review findings
cat prod-mgmt/test-inventory.md

# Address findings in PRD/AC/tests, then re-run
# For findings that cannot be remediated: add risk acceptance entry
```

---

## Features

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

Bootstraps a project for context-curator by creating the `.claude/` directory structure, wiring up `.gitignore`, copying root `CLAUDE.md` into the default task, and creating the `prod-mgmt/` directory for PRD-driven development artifacts.

**Expected Behaviors:**
- Creates `.claude/` directory if it doesn't exist
- Creates `.claude/.gitignore` with `CLAUDE.md` entry
- Creates `.claude/tasks/default/CLAUDE.md` as copy of root `CLAUDE.md`
- Creates `prod-mgmt/` directory if it doesn't exist
- Creates `prod-mgmt/risk-acceptances.md` from template if it doesn't exist
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
| T-INIT-6 | `init-project` creates `prod-mgmt/risk-acceptances.md`; the file contains the string "DISPOSITION" and the string "EXPIRY" |
| T-INIT-7 | `init-project --project-install` creates `.claude/skills/context-curator/` containing at least the five skill directories (`task`, `context-save`, `context-list`, `context-manage`, `context-promote`), each with a `SKILL.md` file and a `scripts/` subdirectory |
| T-INIT-8 | After a project-scope install, typing `/context-save` in a Claude Code session resolves to the skill in `.claude/skills/context-curator/context-save/` — not to any user-scope skill of the same name; verified by checking that the skill SKILL.md path in the session context matches the project path |
| T-INIT-9 | A developer who clones a project with `.claude/skills/context-curator/` committed has all five slash commands available without running `install.sh`; verified by running `claude` in a fresh environment with no `~/.claude/skills/` directory and confirming `/task` is a recognized command |

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

**Expected Behaviors:**
- Prompts user for task focus/description
- Creates `.claude/tasks/{task-id}/` directory structure
- Creates task-specific `CLAUDE.md` based on description
- Generates `.claude/tasks/{task-id}/README.md` with task metadata
- Modifies `.claude/CLAUDE.md` to import task's `CLAUDE.md`
- Provides `/resume sess-{id}` instruction
- Task ID validation (alphanumeric + hyphens only)
- Creates both project and personal task directories

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-TASK-1 | task-create produces a CLAUDE.md with all required section headers (`# Task: <taskId>`, `## Focus`, `## Key Areas`, `## Guidelines`) and the description keyword appears under the `## Focus` section |
| T-TASK-2 | task-create exits non-zero and creates no directory for a task name containing uppercase letters |
| T-TASK-3 | A four-line description has all four lines preserved verbatim in the Focus section |
| T-TASK-4 | task-create exits non-zero and creates no directory when given empty description |

### F-TASK-SWITCH · Task Switching (`/task <existing-task-id>`)

Switches to an existing task by loading available contexts, updating the CLAUDE.md import, and preparing a session for `/resume`.

**Command:** `/task <task-id>`

**Behavior (switching to existing task):**

If task exists:
1. List available contexts (personal + golden)
2. Ask which context to load
3. Modify `.claude/CLAUDE.md` to import task's CLAUDE.md
4. Copy selected context to session file
5. Output: "Run: /resume <uuid>"

**Expected Behaviors:**
- Lists available contexts (personal + golden) for task
- Displays context metadata: name, message count, date, author (for golden)
- Displays context summaries
- Prompts user to select context (or default/new)
- Modifies `.claude/CLAUDE.md` to import selected task's `CLAUDE.md`
- If context selected: copies context to session location
- Provides `/resume sess-{id}` instruction
- Handles task with no contexts (offers to start fresh)

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-SWITCH-1 | After switching tasks A→B→C→A, `.claude/CLAUDE.md` contains **exactly one** `@import` line on each switch, pointing to the selected task's `CLAUDE.md` |
| T-SWITCH-2 | When a task has no saved contexts, `context-list` exits 0 and output contains "no contexts" or the word "fresh" as a complete word (not a substring of e.g. "Refreshed") |
| T-SWITCH-3 | When a task has both personal and golden contexts, all context names appear in output with personal contexts listed before golden contexts |
| T-SWITCH-4 | `context-list --json` for a task with active sessions but no saved contexts returns `contexts: []` (empty array) — session UUIDs must never appear in the `contexts` field |
| T-SWITCH-5 | When `contexts` is empty, the switch UI displays a "no contexts" message and does NOT present UUID session files as numbered selectable options |
| T-SWITCH-6 | Switching to `default` task sets `@import` to point to `default/CLAUDE.md` and script output confirms the switch (e.g. "vanilla" or "restored") |

### F-CTX-SAVE · Context Saving (`/context-save <n>`)

Saves the current Claude Code session as a named personal or golden context, including AI-generated summary and metadata.

**Command:** `/context-save <name> [--golden]`
**Execution:** Forked context (has access to current session, does not pollute)

**Expected Behaviors:**
- Saves current session to personal context by default
- Prompts: "Save as golden (team-shared) context? (y/n)"
- Personal: saves to `~/.claude/projects/{project}/tasks/{task}/contexts/{name}.jsonl`
- Golden: saves to `./.claude/tasks/{task}/contexts/{name}.jsonl`
- Generates AI summary of context content
- Stores metadata: timestamp, message count, author
- Validates context name (alphanumeric + hyphens + underscores)
- Prevents overwriting without confirmation
- Scans for secrets before any save (warns on personal, blocks on golden)

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

**Expected Behaviors:**
- Lists contexts for current task if no task-id specified
- Lists contexts for specified task if task-id provided
- Shows personal contexts with "(personal)" indicator
- Shows golden contexts with author and "⭐" indicator
- Displays: name, message count, date, summary
- Groups by type: personal first, then golden
- Handles tasks with no contexts gracefully
- Shows context file sizes

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

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-CTX-7 | `delete-context` on a golden context exits non-zero without `--force` flag; the file still exists after the failed attempt |
| T-MANAGE-1 | `list-all-contexts` exits 0 and output includes context names from at least 2 different tasks when such contexts exist across tasks |
| T-MANAGE-2 | `list-all-contexts` marks a context as stale (output contains "stale" adjacent to or on the same line as the context name) when its last-modified timestamp is > 30 days old |
| T-MANAGE-3 | `list-all-contexts` identifies two byte-for-byte identical context files as duplicates (output contains "duplicate" adjacent to or on the same line as the context names) |
| T-MANAGE-4 | `delete-context --dry-run` exits 0, prints what would be deleted (context name appears in output), and does NOT delete the file (file still exists after the call) |
| T-MANAGE-5 | `rename-context <task-id> <old-name> <new-name>` exits 0; old path does not exist; new path is a valid non-empty JSONL file |
| T-MANAGE-6 | `archive-context <task-id> <context-name>` exits 0; file exists at `contexts/archives/<context-name>.jsonl`; original path does not exist |

### F-CTX-PROMOTE · Context Promotion (`/context-promote <context-name>`)

Promotes a personal context to a golden (team-shared) context after scanning for secrets and obtaining user confirmation.

**Command:** `/context-promote <name>`
**Execution:** Forked context

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

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-CTX-5 | `promote-context` on a 150KB personal context exits non-zero with output containing "100KB" or "too large" |
| T-PROM-1 | After `promote-context`, both personal original and golden copy exist; contents are byte-for-byte identical |
| T-PROM-2 | `promote-context` on a context with `ghp_` + 36 alphanumeric chars: output names the specific secret type |
| T-PROM-3 | `promote-context` when golden already exists exits non-zero or warns; setup must create personal context only |

### F-CLMD · Two-File CLAUDE.md System

Keeps the root `CLAUDE.md` stable and committed while using an auto-generated, git-ignored `.claude/CLAUDE.md` for per-developer task state.

**Expected Behaviors:**
- Root `CLAUDE.md` never modified by context-curator
- `.claude/CLAUDE.md` auto-generated with `@import` directives
- `.claude/CLAUDE.md` git-ignored (in `.claude/.gitignore`)
- Each task switch updates `.claude/CLAUDE.md` import path
- `/resume` reads `.claude/CLAUDE.md` (or `CLAUDE.md` if no `.claude/` exists)
- Import path format: `@import ./tasks/{task-id}/CLAUDE.md`

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-CLMD-1 | After any task operation, root `CLAUDE.md` content equals its pre-operation content |
| T-CLMD-2 | After two task switches, `.claude/CLAUDE.md` contains exactly one `@import` line |
| T-RESUME-MANUAL | MANUAL: After `/task <id>` + `/resume <session>`, Claude's response references task CLAUDE.md content |

### F-SEC · Secret Detection

Automatically scans context content for API keys, passwords, tokens, and private keys before any save or golden promotion.

**Expected Behaviors:**
- Detects common secret patterns: API keys, passwords, tokens, private keys
- Recognizes service-specific formats (AWS, Stripe, GitHub, etc.)
- Scans entire context content (all messages)
- Reports line numbers and context for each detection
- Offers redaction options: mask, remove, replace
- Validates redaction doesn't break context structure
- Re-scans after redaction to confirm clean

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-SEC-2 | `scan-secrets` on a file with `AKIA` + 16 uppercase alphanumeric chars exits non-zero; output contains "AWS" or "AKIA" |
| T-SEC-3 | `scan-secrets` detects both `sk_test_` and `sk_live_`; output names the specific key type |
| T-SEC-4 | A context with one secret in user, one in assistant, one in tool_result: all three reported |
| T-SEC-5 | `AKIAIOSFODNN7EXAMPLE` is treated as a true positive (scanner prefers false positives over false negatives) |
| T-SEC-6 | After `redact-secrets`, every line parses as JSON; a second `scan-secrets` run returns "clean" |
| T-SEC-7 | `scan-secrets` on a context with exactly 5 secrets: output matches `found 5 secret` or `5 secret(s) found` |
| T-SEC-8 | `scan-secrets` on a context containing `ghp_` + 36 alphanumeric chars exits non-zero; output contains "ghp_" or "github" |
| T-SEC-9 | `scan-secrets` on a context containing `-----BEGIN RSA PRIVATE KEY-----` exits non-zero; output matches `rsa.*private`, `private.*key`, or `BEGIN.*PRIVATE` (case-insensitive) |
| T-SEC-10 | `scan-secrets` on a context containing `password=<value>` or `PASSWORD=<value>` exits non-zero; output contains "password" (case-insensitive) |

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

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-SUM-1 | After `save-context`, a `.meta.json` file exists alongside the `.jsonl` with a `summary` string between 20 and 500 characters |
| T-SUM-2 | Two contexts saved from clearly different conversations produce different `summary` strings; each summary must contain at least one keyword from its source conversation content |
| T-SUM-3 | After `save-context`, the session source file (the `.jsonl` read as input) is byte-for-byte identical to its pre-save snapshot — summary generation must not append messages to or otherwise mutate the calling session |

### F-GIT · Git Integration

Maintains a minimal and conflict-free git footprint.

**Expected Behaviors:**
- `.claude/.gitignore` prevents `.claude/CLAUDE.md` from being committed
- Task `CLAUDE.md` files are committed
- Golden contexts are committed
- Personal storage (`~/.claude/`) never committed
- No git conflicts from context-curator operations
- Team can pull golden contexts via `git pull`

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-GIT-1 | `git check-ignore .claude/CLAUDE.md` exits 0 in a real git repo after init |
| T-GIT-2 | After a full workflow in a real git repo, `git status --porcelain` does not show any relative path that resolves into the personal storage directory; the personal storage path must be expressed as a relative prefix for this assertion to be non-vacuous |

> **Note:** T-GIT-2 was found INADEQUATE by the LoD2 adversary (run 2026-03-14) — the original test used an absolute personal storage prefix which git status never emits, making the assertion vacuous. The acceptance criterion has been updated above to require the relative-path form, which is what git status --porcelain actually emits.

### F-XPLAT · Cross-Platform Compatibility

Supports macOS and Linux with correct POSIX path handling. Windows native is out of scope; Windows users should use WSL2.

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-ERR-3 | All operations work when project path contains a space; verified by exitCode === 0 AND output file existence |

### F-ERR · Error Handling & Edge Cases

Provides graceful degradation, clear user-facing error messages, and atomic operations with rollback.

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-ERR-1 | Any script run without init exits non-zero with output containing "initialized" or "init" — not a stack trace |
| T-ERR-2 | `scan-secrets` on malformed JSONL exits non-zero (not 0) |

### F-DOC-SKILLS · Document Authoring Skills

Four skills that enforce idiomatic format when creating or editing the core process artifacts — PRD, test plan, dev plan, and test inventory. These are auto-invocable: Claude loads the relevant skill automatically when it detects the user is working on one of these documents. The skills carry the format conventions, code rules, and quality heuristics so the user gets correct structure without consulting `prd-driven-development.md` on every edit.

These are **authoring guidance skills**, not session management skills. They belong in a separate namespace (`context-curator/authoring/`) from the session management skills (`context-curator/`). A team can install just the authoring skills without the full context management stack.

**The four skills:**

| Skill | Slash command | Auto-invoke trigger | Purpose |
|-------|--------------|---------------------|---------|
| `prd` | `/prd` | Working on a `*prd*.md` file | PRD format, F-XXX codes, falsifiable AC rules |
| `test-plan` | `/test-plan` | Working on a `*test-plan*.md` file | Test plan format, AC table copy rule, banned patterns, fix tiers |
| `dev-plan` | `/dev-plan` | Working on a `*dev-plan*.md` file | Dev plan format, phase structure, design decision conventions |
| `test-inventory` | `/test-inventory` | Adversary task active | Test inventory output format, verdict definitions, coverage gap schema |

**Expected Behaviors:**
- Each skill loads the full format specification for its document type, including structure templates, naming conventions, and quality rules
- Auto-invocation triggers on filename pattern match — a user editing `prd.md` or `my-project-prd.md` gets the PRD skill loaded without typing `/prd`
- `/prd new` scaffolds a new PRD from a template with placeholder F-XXX codes, overview section, and an empty features section
- `/test-plan new` scaffolds a new test plan with the philosophy, banned patterns, fix tiers, and environment setup sections pre-populated; feature test groups are left empty pending PRD feature codes
- `/dev-plan new` scaffolds a new dev plan with executive summary, architecture, phases, file structure, and design decisions sections pre-populated with the correct headings
- `/test-inventory` is available only when the adversary task is active; it loads the output format schema into the adversary's context to ensure consistent inventory structure
- Each skill includes the full falsifiability checklist for PRD criteria: the user can invoke `/prd check-ac` to have Claude review each acceptance criteria clause and flag potentially non-falsifiable ones
- Skills carry the F-XXX/T-XXX code rules: Claude will not generate a feature section without a code, will flag duplicate codes, and will warn if an AC table references a code from a different feature

**Expected Behaviors — PRD skill specifically:**
- Carries the complete feature section format template
- Enforces: F-XXX in heading, T-XXX-N in AC table, AC table embedded in section (not appendix), AC criteria are statements not questions
- On `/prd check-ac`: reviews each criterion and flags any that are vague, circular, or not independently testable; does not auto-fix, surfaces findings for human review
- On `/prd new-feature`: scaffolds a complete feature section with placeholder F-XXX code, Expected Behaviors bullets, Test Scenarios list, and an AC table with one placeholder row

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-DOC-1 | `/prd new-feature` produces a markdown section containing all four required elements: heading with `F-` prefix, `**Expected Behaviors:**` section, `**Test Scenarios:**` section, and `**Acceptance Criteria:**` table with a `T-` prefixed row |
| T-DOC-2 | Auto-invocation: when the active file matches `*prd*.md`, the PRD skill description appears in the session context without the user typing `/prd`; verified by checking session context for the skill's description string |
| T-DOC-3 | `/test-plan new` produces a document containing all mandatory sections: testing philosophy, banned patterns list with at least 6 items, fix priority tiers table, environment setup, and a summary section |
| T-DOC-4 | `/dev-plan new` produces a document with `Based on: PRD vX.Y` in the header (placeholder populated), executive summary, at least one phase section, file structure table, key design decisions section, and troubleshooting section |
| T-DOC-5 | `/prd check-ac` on a PRD with one vague criterion ("the system handles errors gracefully") exits 0 and output flags that criterion with a non-empty rationale; a PRD with only falsifiable criteria produces no flags |
| T-DOC-6 | The `test-inventory` skill is only loadable when the adversary task is active; attempting `/test-inventory` outside the adversary task exits with an error message indicating it is adversary-only |

---

### F-MARKETPLACE · Skill Marketplace

Context Curator ships a plugin manifest that exposes its skills as a browsable, selectively-installable marketplace. Teams can install individual skills or skill bundles without taking the full stack. The manifest is the bridge between the skills filesystem and the Claude Code plugin/marketplace discovery mechanism.

**Two marketplace shapes, both supported:**

**Local team marketplace** — a manifest committed to the project repo at `.claude/context-curator-manifest.json`. Any developer who clones the repo can run `/plugin marketplace add context-curator` and browse available skills. Skills are installed into `.claude/skills/` (project scope). The manifest travels with the codebase; there is no external registry dependency.

**Published marketplace** — context-curator's authoring skills (`prd`, `test-plan`, `dev-plan`, `test-inventory`) are published to the Claude Code community skill registry so teams using Claude Code without context-curator can discover and install them independently. Session management skills (`task`, `context-save`, etc.) are published as a separate bundle, since many teams may want the document authoring skills without the full context management infrastructure.

**Skill namespacing in the manifest:**

```
context-curator/
├── authoring/          ← document authoring skills (shareable standalone)
│   ├── prd
│   ├── test-plan
│   ├── dev-plan
│   └── test-inventory
├── session/            ← session management skills (full CC stack)
│   ├── task
│   ├── context-save
│   ├── context-list
│   ├── context-manage
│   └── context-promote
└── monitor/            ← context monitoring skills
    ├── status
    ├── warn
    └── cost
```

**Manifest format** (`.claude/context-curator-manifest.json`):

```json
{
  "name": "context-curator",
  "version": "X.Y",
  "description": "Task-based context management and PRD-driven development for Claude Code",
  "bundles": {
	"authoring": {
	  "description": "PRD, test plan, dev plan, and test inventory authoring skills",
	  "skills": ["authoring/prd", "authoring/test-plan", "authoring/dev-plan", "authoring/test-inventory"]
	},
	"session": {
	  "description": "Full context management stack",
	  "skills": ["session/task", "session/context-save", "session/context-list", "session/context-manage", "session/context-promote"]
	},
	"monitor": {
	  "description": "Context usage monitoring and threshold warnings",
	  "skills": ["monitor/status", "monitor/warn", "monitor/cost"]
	},
	"full": {
	  "description": "Everything",
	  "skills": ["authoring/*", "session/*", "monitor/*"]
	}
  }
}
```

**Expected Behaviors:**
- `install.sh` writes the manifest to both `~/.claude/context-curator-manifest.json` (global) and optionally `.claude/context-curator-manifest.json` (project) when `--project-install` is passed
- `/plugin marketplace list context-curator` lists all available bundles and individual skills with descriptions
- `/plugin marketplace add context-curator/authoring` installs only the authoring bundle into the current scope (user or project)
- Installing a bundle with project scope copies the SKILL.md and scripts into `.claude/skills/context-curator/<namespace>/<skill-name>/`
- Teams can publish their own skill bundles by committing a manifest to their repo — the format is the same, the content is their custom skills
- The authoring bundle has no dependency on the session bundle; it can be installed and used standalone
- The monitor bundle depends on the session bundle (requires the `task` skill to know the active task); the dependency is declared in the manifest and checked at install time

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-MKT-1 | `install.sh` creates `~/.claude/context-curator-manifest.json`; the file is valid JSON and contains `bundles.authoring`, `bundles.session`, and `bundles.monitor` keys |
| T-MKT-2 | After installing the `authoring` bundle only (no session bundle), the five slash commands `/prd`, `/test-plan`, `/dev-plan`, `/test-inventory`, and `/context-save` are tested for availability; the first four are available and `/context-save` is not |
| T-MKT-3 | The manifest `version` field matches the installed context-curator version from `dist/version.json`; a version mismatch exits non-zero with a message containing "version" |
| T-MKT-4 | A team manifest committed at `.claude/context-curator-manifest.json` with a custom skill listed under a `custom` bundle is discoverable via `/plugin marketplace list`; the custom bundle description appears in output |

---

### F-HOOK · PreCompact Auto-Save Hook

Automatically saves the current session to a timestamped file when Claude Code is about to compact, preventing context loss during long conversations.

**Expected Behaviors:**
- Automatically saves context when Claude Code is about to compact
- Creates a timestamped `.jsonl` file in the flat `<personalBase>/auto-saves/` directory
- Triggered via `PreCompact` hook in Claude Code hooks configuration
- Hook registered globally in `~/.claude/hooks/settings.json`
- Fires for both `auto` and `manual` compact triggers

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-HOOK-1 | `auto-save-context` with a mock stdin payload creates a timestamped `.jsonl` file in the flat `<personalBase>/auto-saves/` directory |

### F-HOOK-POST · PostCompact Task Re-Injection Hook

After every compaction event, re-injects the current task's context summary into the session so that task-specific understanding survives compaction without requiring manual `/resume`.

**Expected Behaviors:**
- Fires after every compaction (auto and manual) via `PostCompact` hook
- Reads active task from `.claude/CLAUDE.md` @import directive
- Generates a one-paragraph context reminder from the task CLAUDE.md
- Injects the reminder as a system message via the `prompt` hook type
- If no task is active (default), injects nothing
- If the task CLAUDE.md cannot be read, logs a warning and does not inject

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-HOOK-POST-1 | With a non-default task active, `postcompact-reinject` script outputs a string containing the task ID; output must not be empty |
| T-HOOK-POST-2 | With default task active, `postcompact-reinject` script exits 0 and outputs nothing (no injection for default task) |
| T-HOOK-POST-3 | `postcompact-reinject` with a missing task CLAUDE.md exits 0 (does not fail the session), and stderr contains "warning" or "not found" |

### F-CTX-MONITOR · Context Monitor

Gives developers continuous, low-cost visibility into context consumption — how full the window is, how much has been used since the session warmed up, the current burn rate, estimated cost, and how much runway remains before compaction becomes likely. Surfaces threshold warnings before compaction happens rather than after.

The design constraint is strict: **the monitor must not meaningfully consume the context it is measuring.** All monitoring runs as local scripts or hooks using shell environment variables and the session JSONL file. No model calls. No skill invocations during a live session. Haiku is permitted only for the one-time warm-up baseline summarization at checkpoint save time, which is already happening as part of `F-CTX-SAVE`.

**The warm-up baseline:** When the user saves a context checkpoint (via `/context-save` or the PreCompact auto-save hook), the current token count is recorded in the checkpoint metadata as `baselineTokens`. The monitor uses this as the reference point — the moment meaningful work began. All subsequent display distinguishes total context fill from tokens consumed since warm-up, giving the user a clear picture of how much runway remains in the productive zone.

**Degradation zones:** Based on observed context rot behavior, the monitor uses three zones:

| Zone | Fill level | Meaning |
|------|-----------|---------|
| 🟢 Productive | < 65% | Sweet spot — high recall quality |
| 🟡 Degrading | 65–80% | Recall quality declining; save a checkpoint soon |
| 🔴 Critical | > 80% | Compaction imminent; quality significantly degraded |

Thresholds are configurable in `~/.claude/context-curator/monitor-config.json`.

---

#### F-CTX-MONITOR-STATUS · Passive Status Line

A lightweight persistent indicator that renders after every tool call — always visible, never intrusive, zero model cost. The status line gives the user a live read on where they are in the session without requiring any action.

**Format:**

```
[🟢 47% | +31k since warm-up | ~$0.18 | 2.1k tok/msg]
```

Fields, left to right:
- **Zone indicator + fill %** — current zone emoji and total context fill as a percentage
- **Tokens since warm-up** — tokens consumed since the `baselineTokens` checkpoint; shows `+Nk` format
- **Estimated cost** — cumulative session cost at current model rates from `monitor-config.json`
- **Burn rate** — tokens per message, averaged over the last 10 messages

**Expected Behaviors:**
- Renders to stderr after every tool call via an async `PostToolUse` hook — never delays Claude's response
- Reads all values from environment variables and the monitor state file; no JSONL parsing on the hot path
- One async `PostToolUse` hook parses the session JSONL and writes `~/.claude/context-curator/monitor-state.json`; the status line reads from that file — parsing cost paid once, not per display
- Suppressed entirely when running in a non-interactive session (`CLAUDE_SESSION_TYPE=headless` or equivalent)
- When no warm-up baseline exists, the `+Nk since warm-up` field shows `+Nk` from session start
- Zone emoji updates immediately on zone transition; no delay or debounce

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-MON-1 | The status line script reads values from the monitor state file only — no invocations of `claude`, no API calls, no model calls; verified by confirming no network calls are made during script execution |
| T-MON-2 | Given a monitor state file with `fillPct: 47.5`, `tokensSinceBaseline: 31000`, `estimatedCost: 0.18`, `burnRatePerMessage: 2100`, and `currentZone: productive`, the status line output matches the pattern `47` and `31k` and `0.18` and `2.1k` |
| T-MON-3 | With `CLAUDE_SESSION_TYPE=headless` set, the status line script exits 0 and produces no stdout or stderr |
| T-MON-4 | With no checkpoint metadata present, `tokensSinceBaseline` equals `currentTokens` and the status line renders without error |

---

#### F-CTX-MONITOR-WARN · Threshold Warnings

One-time warnings that fire when the session crosses a zone boundary — visible, actionable, and non-repeating. Each warning fires exactly once per zone entry and includes a specific suggested action.

**Warning format:**

```
⚠️  Context at 67% — entering degrading zone.
    Recall quality is declining. Consider: /context-save checkpoint-name
    (This warning will not repeat in this zone.)
```

```
🔴  Context at 82% — critical. Compaction is imminent.
    Start a fresh session: /task <current-task> to reload a saved context.
    (This warning will not repeat in this zone.)
```

**Expected Behaviors:**
- Fires as a synchronous `PostToolUse` hook so the warning appears before Claude's next response, not after
- Reads zone from the monitor state file written by the async status line hook — no independent JSONL parsing
- Writes a zone sentinel to the state file after firing; does not fire again while the session remains in the same zone
- Sentinel is cleared on `SessionStart` (new session or resume) so warnings reset correctly
- When context drops back into a lower zone (e.g., after compaction), the sentinel for that zone is cleared and will fire again if re-entered
- Both warning messages name the zone explicitly and include a concrete suggested command

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-MON-5 | At 65% fill (mocked via state file), the warning script exits 0 and stderr contains "degrading" or equivalent and a save suggestion; at 64% fill stderr is empty |
| T-MON-6 | At 80% fill (mocked), warning stderr contains "critical" or equivalent and a restart suggestion; at 79% it emits the degrading warning only |
| T-MON-7 | After firing at 65%, a second invocation at 66% exits 0 and stderr is empty (sentinel suppresses repeat) |
| T-MON-8 | After compaction drops fill to 30%, the degrading sentinel is cleared; re-crossing 65% fires the warning again |
| T-MON-9 | The SessionStart hook clears all zone sentinels; verified by writing sentinels to the state file, running the hook, and asserting both sentinels are false |

---

#### F-CTX-MONITOR-COST · Burn Rate and Cost Estimation

A local script that calculates burn rate and cumulative cost from the session JSONL and the rate config file. Runs as part of the async state-file update — one parse per tool call, results shared with the status line and warning hooks.

**Expected Behaviors:**
- Burn rate calculated as mean tokens-per-message over the last N messages (default: 10); N configurable in `monitor-config.json`
- Cost estimate uses per-model input and output rates from `monitor-config.json`; rates editable without reinstalling
- When the model changes mid-session, the cost estimate uses the correct rate for each segment
- State file updated atomically (write to temp file, rename) to prevent partial reads by concurrent hook invocations

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-MON-10 | The burn-rate script with a JSONL fixture of 15 messages with known token counts returns a value within 5% of the hand-calculated mean of the last 10 |
| T-MON-11 | Cost estimation: given a known token count, model name, and rate config file with explicit rates, the cost script output matches hand-calculated expected cost within 1% |
| T-MON-12 | With `baselineTokens: 42000` in checkpoint metadata and current tokens 95000, the state file contains `tokensSinceBaseline: 53000` (not 95000) |
| T-MON-13 | State file write is atomic: a concurrent reader never observes a partially-written file; verified by running writer and reader in parallel and asserting every read produces valid JSON |

---

**Shared implementation notes:**

The three sub-features share a single state file at `~/.claude/context-curator/monitor-state.json`:

```
{
  "sessionId": "<uuid>",
  "currentTokens": 95000,
  "contextWindowSize": 200000,
  "fillPct": 47.5,
  "baselineTokens": 42000,
  "tokensSinceBaseline": 53000,
  "burnRatePerMessage": 2100,
  "estimatedCost": 0.47,
  "currentZone": "productive",
  "zoneSentinels": { "degrading": false, "critical": false },
  "model": "claude-opus-4-6",
  "lastUpdated": "2026-05-09T14:32:00Z"
}
```

One async `PostToolUse` hook owns all writes to this file. The status line display hook and threshold warning hook are read-only consumers. This single-writer pattern prevents race conditions and ensures JSONL parsing happens at most once per tool call.

### F-SPEC · Specialized Task Framework

Provides the infrastructure for specialized tasks: immutable DNA distribution, STRICT/STANDARD isolation enforcement, and hook-enforced isolation guarantees.

**STRICT isolation is now hook-enforced, not instruction-enforced:**
- A `PreCompact` hook blocks compaction saves when the adversary task is active
- A `SessionStart` hook with `resume` trigger validates that no prior context was loaded for STRICT tasks
- These hooks fire deterministically — the model cannot override them

**Expected Behaviors:**
- Specialized task DNA lives at `~/.claude/context-curator/specialized/<name>/CLAUDE.md`
- No user-facing script reads from or writes to the `specialized/` directory except to resolve the @import path
- Activating a STRICT task via `/task <id>` updates `.claude/CLAUDE.md` @import to point to the specialized task's installed CLAUDE.md
- STRICT isolation: `save-context` exits non-zero with a clear message; no context file is created
- STRICT isolation: hooks prevent compaction save in addition to instruction-level blocking
- STRICT isolation: `context-list` exits 0 but reports no selectable contexts and explicitly states isolation mode
- STANDARD isolation: full context save/restore works identically to user tasks
- `task-list` or any listing command shows specialized tasks in a distinct section
- `task-check <task-id>` for a specialized task returns `exists:specialized`; `getTaskInfo()` checks the specialized directory and returns `location: 'specialized'` before falling through to `not-found`

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-SPEC-1 | Read the adversary CLAUDE.md before and after running `task-create`, `update-import`, and `save-context` on user tasks; assert content is byte-for-byte identical across all three operations |
| T-SPEC-2 | `save-context` called with the adversary task active exits non-zero; output matches `/strict.isolation\|not.*available\|specialized.*task/i`; no `.jsonl` file is created at **any path within the adversary task directories** (not just one specific filename) |
| T-SPEC-3 | `context-list` for the adversary task exits 0; output matches `/strict.isolation\|no contexts.*isolation\|isolation.*no contexts/i`; output does NOT match any UUID pattern |
| T-SPEC-4 | `update-import adversary` updates `.claude/CLAUDE.md` to contain exactly one `@import` line; the imported path resolves to a file on disk whose content contains "ADVERSARY" |
| T-SPEC-5 | `task-check <task-id>` exits 0 and outputs `exists:specialized` when the task's CLAUDE.md exists only in the specialized directory (`~/.claude/context-curator/specialized/<task-id>/CLAUDE.md`); it does NOT output `not-found` when no golden or personal task of that name exists |

> **Note:** T-SPEC-2 was found INADEQUATE by the LoD2 adversary (run 2026-03-14) — the test checked only one specific file path. The acceptance criterion above now requires checking all paths within the adversary task directories.

### F-ADVERSARY · Adversary Task

The first bundled specialized task. A LoD2 red-team operator that independently audits test coverage against PRD acceptance criteria — structurally isolated from the engineering team to prevent confirmation bias.

**DNA summary:**
- **Model:** claude-opus-4-6
- **Isolation:** STRICT — no knowledge of any other task, session, or prior adversarial run
- **Identity:** LoD2 control assurance reviewer, reporting to control assurance function (not LoD1 engineering team)
- **Input discovery:** Scans project for `*prd*.md`, `*test-plan*.md`, `tests/`, `*risk-accept*.md`
- **Output artifact:** `./prod-mgmt/test-inventory.md` (two sections: test inventory table + AC coverage gaps)
- **Hard prohibitions:** No mitigations, no recommendations, no positive framing — output ends at ESCALATE
- **Risk acceptance integration:** Loads `./prod-mgmt/risk-acceptances.md` before evaluation; suppresses accepted findings per RA entries; surfaces lapsed entries as active findings

**Expected Behaviors:**
- Shipped with context-curator; DNA installed to `~/.claude/context-curator/specialized/adversary/CLAUDE.md`
- Activated via `/task adversary`; the @import in `.claude/CLAUDE.md` points to the installed DNA
- Every invocation is a fresh session (STRICT isolation enforced by hooks + DNA)
- DNA is never modified by user task operations
- Produces exactly one output file: `./prod-mgmt/test-inventory.md`
- Lapsed risk acceptances are surfaced as active findings with a note that a previously accepted risk has lapsed

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-ADV-1 | After `./install.sh`, `~/.claude/context-curator/specialized/adversary/CLAUDE.md` exists (asserted unconditionally) and its content contains both "ADVERSARY" and "STRICT" |
| T-ADV-2 | After `update-import adversary`, `.claude/CLAUDE.md` contains exactly one `@import` line; the imported path ends with `specialized/adversary/CLAUDE.md`; the file at that path exists on disk and contains "ADVERSARY" |
| T-ADV-3 | Read adversary DNA content before running `task-create oauth-refactor`, `update-import oauth-refactor`, `save-context test-ctx --personal`; assert adversary DNA content is byte-for-byte identical after all three operations |
| T-ADV-4 | `save-context` with adversary task active exits non-zero; no `.jsonl` file exists at **any path within the adversary task personal or golden context directories** — not just one specific filename |

> **Note:** T-ADV-4 was found INADEQUATE by the LoD2 adversary (run 2026-03-14) — the test checked only `tasks/adversary/contexts/should-not-exist.jsonl`. The acceptance criterion above now requires checking all paths within the adversary task context directories.

### F-PRD · PRD-Driven Development

Establishes the PRD as the authoritative source of truth for the project, with a structured artifact triad — PRD, dev plan, and test plan — that together carry a feature from specification through implementation and verification. Immediately after every PRD update, user documentation is generated and shared (see F-DOC). The LoD2 adversary challenges the triad as a whole. See `prd-driven-development.md` for the full process description.

**The artifact triad:**

| Artifact | Audience | Purpose |
|----------|----------|---------|
| `prd.md` | Everyone | What the system does; acceptance criteria; the authoritative reference |
| `dev-plan.md` | Builder (LoD1) | How to build it; phased implementation; design decisions; troubleshooting |
| `test-plan.md` | Verifier / Adversary | How to verify it; one test group per F-XXX feature; AC table + concrete test cases |

**The F-XXX / T-XXX code system is load-bearing for the entire process:**
- `F-XXX` codes tie feature sections across all three documents
- `T-XXX` codes tie each AC clause to tests, the test plan, the test inventory, and risk acceptances
- Codes are assigned once and never changed or reused — even after a feature is removed

**PRD format requirements:**
- Every feature section has a unique `F-XXX` code in its heading
- Every acceptance criteria clause has a unique `T-XXX` code
- Acceptance criteria are embedded in their feature section (not collected in an appendix)
- Acceptance criteria are falsifiable — there must exist an implementation that fails each one

**Dev plan format requirements:**
- Opens with an executive summary and architecture overview that recaps the PRD's core concepts
- Organizes implementation into ordered phases; each phase lists concrete sub-tasks
- Each sub-task includes implementation sketches (pseudocode, code snippets, or command sequences) and a `- [ ]` testing checklist
- Includes a file structure table mapping every artifact to its location and committed/not-committed status
- Includes a key design decisions section that records *why* each non-obvious architectural choice was made
- Includes a troubleshooting section for known failure modes and their resolutions
- References the PRD version it implements (`Based on: PRD vX.Y`)

**Test plan format requirements:**
- Opens with testing philosophy and mandatory test quality rules (banned patterns with examples, fix priority tiers)
- Includes environment setup (prerequisites, directory structure, shared test utilities)
- Organized into feature test groups, one per `F-XXX` feature, in the same order as the PRD
- Each feature group opens with the AC table copied verbatim from the PRD (same `T-XXX` codes), then expands each AC into one or more concrete test cases
- Each test case has: Setup, Execution, Validation (code), Expected Output
- Ends with a coverage summary matrix and a manual test checklist for behaviors that cannot be automated

**Expected Behaviors:**
- `prod-mgmt/` directory contains `risk-acceptances.md` and receives `test-inventory.md`
- The adversary's `test-inventory.md` references `T-XXX` codes from the current PRD
- Orphaned `T-XXX` codes in the test inventory (codes not in the PRD) are flagged as a structural FAIL

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-PRD-1 | Every feature section in the PRD contains an "Acceptance Criteria" table with at least one row; a feature section with no AC table is a FAIL |
| T-PRD-2 | Every T-XXX code in the PRD is unique; duplicate T-XXX codes within the document constitute a FAIL |
| T-PRD-3 | `prod-mgmt/risk-acceptances.md` contains the strings "DISPOSITION", "EXPIRY", and "RA_ID" after `task-init` |
| T-PRD-4 | `prod-mgmt/test-inventory.md` (when it exists) references only T-XXX codes that appear in the current PRD; orphaned T-XXX codes in the test inventory are a FAIL |

### F-DOC · User Documentation System

Establishes a markdown-first, HTML-derived documentation workflow that runs immediately after every PRD update. Documentation is shared with users before code is written, creating a feedback loop that surfaces requirements mismatches at the cheapest possible point in the development cycle. The system generates two synchronized artifact sets: a base markdown set and an accessible, navigable HTML set. See `prd-driven-development.md` for the full rationale.

**Design invariant:** The markdown set is always updated first. HTML is always derived from markdown. HTML files in `docs/html/` are never hand-edited.

**Accessibility invariant:** All generated HTML complies with WCAG 2.1 AA. The animating principle is: *good design is accessible design.* Accessibility is not a post-generation check — it is a generation constraint.

**The base markdown set:**

| File | Purpose |
|------|---------|
| `docs/markdown/toc.md` | Table of contents; links to all product sections and glossary |
| `docs/markdown/introduction.md` | Plain-language system overview; audience-facing, not spec-facing |
| `docs/markdown/glossary.md` | All significant terms defined; linked from first occurrence in each page |
| `docs/markdown/permuted-index.md` | Every term rotated to front for multi-angle lookup; regenerated by skill |
| `docs/markdown/[section].md` | One file per product section; sections defined by designer-developer |

**Product sections vs. features:**

PRD features are atomic engineering specifications. Product sections are user-coherent topics. A single product section may cover multiple features; a complex feature may warrant its own section. The mapping is maintained in `docs/feature-section-map.md` and updated interactively by the `/docs-markdown` skill when new features are added.

**Linking conventions:**

- Every product section name linked on first mention in any page
- Every feature name (not F-XXX code) linked on first mention to its product section
- Every glossary term linked on first mention in each page (not on repeat mentions)
- Internal links use relative paths

**The HTML set:**

Generated from markdown by `/docs-html`. Entry point is `docs/index.html` (rendered from `toc.md` + `introduction.md`). Every page includes consistent keyboard-accessible navigation. Style and a11y governed by `docs/html/style.md`.

**`docs/html/style.md`:**

A human-editable style guide that governs HTML generation. Specifies typeface choices, color palette with explicit contrast ratios, language register, and layout preferences. Read by `/docs-html` before generating any output. If absent or empty at first run, the skill generates sensible accessible defaults and reports them for review.

**Expected Behaviors:**
- `/docs-markdown` runs after every PRD update that introduces or changes user-facing behavior
- `/docs-markdown` identifies changed features, prompts for product section assignments when needed, updates affected pages, regenerates permuted index
- `/docs-html` reads `docs/html/style.md`, generates all HTML from markdown source, validates a11y of output
- `/docs-html` reports any a11y issues found (non-blocking — HTML is still written — but clearly logged)
- `docs/index.html` is the shareable entry point: contains introduction + TOC inline
- All generated HTML pages include consistent navigation linking to all product sections and glossary
- Navigation is keyboard-accessible and works on mobile viewports
- If `style.md` is absent, `/docs-html` writes defaults and notifies the designer-developer
- `docs/feature-section-map.md` is updated by the skill when new feature-to-section assignments are made

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-UDOC-1 | After `/docs-markdown` runs on a PRD with a new F-XXX feature not yet in `feature-section-map.md`, the skill prompts for a product section assignment; after assignment, `feature-section-map.md` contains a row for that F-XXX code |
| T-UDOC-2 | `docs/markdown/toc.md` contains a link to every product section page listed in `feature-section-map.md`; any section page without a TOC link is a FAIL |
| T-UDOC-3 | `docs/markdown/glossary.md` is non-empty after `/docs-markdown` runs on a PRD with defined Core Concepts; every term defined in Core Concepts appears in the glossary |
| T-UDOC-4 | After `/docs-html` runs, `docs/index.html` exists and its content contains the text of `introduction.md` and `toc.md`; file must not be empty |
| T-UDOC-5 | All generated HTML pages contain at least one `<nav>` element; `<nav>` contains links to at least the home page and glossary |
| T-UDOC-6 | Generated HTML heading hierarchy does not skip levels: no `<h3>` appears without a preceding `<h2>` on the same page; no `<h2>` appears without a preceding `<h1>` |
| T-UDOC-7 | When `docs/html/style.md` is absent at invocation time, `/docs-html` writes the file with non-empty content before generating any HTML; the written file contains the strings "color" and "typeface" or "font" |
| T-UDOC-8 | All `<img>` elements in generated HTML have a non-empty `alt` attribute |

---

### F-PROCESS · Process Sequencing Skill (`/prd-process`)

Provides a lightweight state machine that detects the current phase of the PRD-driven development process and resists attempts to perform phases out of order. The most critical guard is the **adversary staleness check**: if `prd.md` has been modified after `test-inventory.md`, the skill warns that the adversary run is stale and implementation work should pause until Phase 5 re-runs.

The skill does not hard-block — it warns and requires an explicit bypass (`--force`) for exceptions. This allows intentional out-of-order steps (e.g., a trivial typo fix) while making accidental skips visible and named.

**Phase detection heuristics:**

| Phase | Complete When |
|-------|---------------|
| 1 — PRD Authoring | `prod-mgmt/prd.md` exists with ≥1 `### F-` section |
| 1a — User Documentation | `docs/html/` exists with files newer than `prd.md` |
| 2 — Test Plan | `prod-mgmt/test-plan.md` exists |
| 3 — Dev Plan | `prod-mgmt/dev-plan.md` exists |
| 4 — Implementation | `.test.ts` files exist in `tests/` |
| 5 — Adversarial Review | `prod-mgmt/test-inventory.md` exists AND newer than `prd.md` |

**Expected Behaviors:**
- `/prd-process` with all artifacts present reports the current phase and next step
- When `prd.md` is newer than `test-inventory.md`, the skill warns that the adversary run is stale before proceeding with any Phase 4 work
- When the user requests implementation work and the adversary is stale, the skill refuses and outputs a correction sequence
- With `--force` acknowledged, the skill warns but proceeds
- With no `prd.md` present, the script exits non-zero with a message containing "PRD"

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-PROC-1 | With only `prod-mgmt/prd.md` present (no test-plan, dev-plan, or test-inventory), `prd-process-status` exits 0 and outputs valid JSON with `currentPhase` equal to 1 and `nextPhase` equal to 2 |
| T-PROC-2 | With `test-inventory.md` modified before `prd.md`, output JSON has `adversaryStale === true` and `warnings` is a non-empty array containing a string matching `/stale|adversary/i` |
| T-PROC-3 | With `test-inventory.md` modified after `prd.md` (all prior artifacts present), output JSON has `adversaryStale === false` and `warnings` does not contain any adversary-stale warning |
| T-PROC-4 | With no `prod-mgmt/prd.md` present, `prd-process-status` exits non-zero and stderr or stdout contains the string "PRD" |
| T-PROC-5 | With test-plan and dev-plan present but no `test-inventory.md`, output JSON has `currentPhase` equal to 4 and `nextPhase` equal to 5 |
| T-PROC-6 | Output is always valid JSON with fields `completedPhases` (array), `currentPhase` (number or string), `nextPhase` (number or string), `adversaryStale` (boolean), and `warnings` (array) |

---

## Skills Implementation

### Skills Are Slash Commands

Context Curator commands are implemented as **skills** — but skills and slash commands are the same surface in Claude Code. A skill directory named `context-save` creates the `/context-save` slash command, identical to the old `~/.claude/commands/context-save.md` approach. Users type `/task`, `/context-save`, `/context-list`, `/context-manage`, and `/context-promote` exactly as before. Skills add capabilities on top: auto-invocation based on description matching, compaction survival (re-attached after summarization within the 25K token budget), and co-located scripts.

### Installation Scopes

Skills are discovered from two locations, and both are supported:

**User scope** (`~/.claude/skills/context-curator/`) — installed once globally by `install.sh`. Available in every project for that developer. The right choice for individual developers or teams where everyone runs the installer.

**Project scope** (`.claude/skills/context-curator/`) — committed to the project repository alongside task definitions and golden contexts. Available automatically to every developer who clones the repo, with no global install required. The right choice for teams who want context-curator to be a zero-setup part of the project.

Both scopes produce the same slash commands and the same auto-invocation behavior. When both are present, project scope takes precedence, allowing a team to pin a specific version of the skills without affecting other projects.

> **Per-project install:** `task-init` creates `.claude/skills/context-curator/` and copies the skill directories into it when a `--project-install` flag is passed, or prompts the user to choose scope during first-time init. The committed skill directories include both SKILL.md and the supporting scripts, so the project is fully self-contained.

### Skill Structure

The same directory tree is used at both scopes (user or project). Skills are namespaced by category so bundles can be installed independently:

```
<scope>/skills/context-curator/
│
├── authoring/                         # Document authoring skills (standalone)
│   ├── prd/
│   │   ├── SKILL.md                   # /prd — PRD format, F-XXX codes, AC rules
│   │   └── scripts/
│   ├── test-plan/
│   │   ├── SKILL.md                   # /test-plan — test plan format, banned patterns
│   │   └── scripts/
│   ├── dev-plan/
│   │   ├── SKILL.md                   # /dev-plan — dev plan format, phase structure
│   │   └── scripts/
│   ├── test-inventory/
│   │   ├── SKILL.md                   # /test-inventory — adversary output format
│   │   └── scripts/
│   ├── prd-process/
│   │   ├── SKILL.md                   # /prd-process — process sequencing guard
│   │   └── scripts/
│   ├── docs-markdown/
│   │   ├── SKILL.md                   # /docs-markdown — markdown base update, feature-section mapping
│   │   └── scripts/
│   └── docs-html/
│       ├── SKILL.md                   # /docs-html — HTML generation, a11y validation, style.md bootstrap
│       └── scripts/
│
├── session/                           # Session management skills
│   ├── task/
│   │   ├── SKILL.md                   # /task — task creation and switching
│   │   └── scripts/
│   ├── context-save/
│   │   ├── SKILL.md                   # /context-save — save current session
│   │   └── scripts/
│   ├── context-list/
│   │   ├── SKILL.md                   # /context-list — list available contexts
│   │   └── scripts/
│   ├── context-manage/
│   │   ├── SKILL.md                   # /context-manage — interactive management
│   │   └── scripts/
│   └── context-promote/
│       ├── SKILL.md                   # /context-promote — promote to golden
│       └── scripts/
│
└── monitor/                           # Context monitoring skills
    ├── status/
    │   ├── SKILL.md                   # status line display
    │   └── scripts/
    ├── warn/
    │   ├── SKILL.md                   # threshold warnings
    │   └── scripts/
    └── cost/
        ├── SKILL.md                   # burn rate and cost estimation
        └── scripts/
```

Where `<scope>` is `~/.claude` for user scope or `.claude` for project scope. The authoring bundle has no dependency on the session bundle and can be installed standalone.

### SKILL.md Frontmatter Convention

Each skill declares its slash command name, description for auto-invocation matching, and invocation mode:

```yaml
---
name: context-save
description: >
  Save the current Claude Code session as a named context. Use when the user
  asks to save, checkpoint, or back up their session, or when the user says
  "save context", "checkpoint this session", or similar.
invocation: explicit  # user must type /context-save; Claude will not auto-invoke
---
```

`invocation: explicit` means the skill only runs when the user types the slash command directly. `invocation: auto` is reserved for monitor behaviors that Claude should trigger proactively — not for context management commands where the user must be in control.

### What to Commit (Project Scope)

When using project-scope installation, add to `.claude/.gitignore` exceptions or committed paths:

```
# .claude/.gitignore
CLAUDE.md                        # Auto-generated, never commit

# Everything else in .claude/ is committed:
# skills/context-curator/**      ← skill files and scripts
# tasks/**                       ← task definitions and golden contexts
# .gitignore                     ← this file
```

This means a developer who clones the repo and runs `claude` immediately has all context-curator commands available without running any installer.

---

## Testing

### Testing Philosophy

Context Curator prioritizes **integration tests** over unit tests. Integration tests validate that features work correctly from the user's perspective, testing task appropriateness rather than code structure.

The full test specification lives in `test-plan.md`. The test plan expands each feature's AC table from this PRD into concrete test cases (Setup → Execution → Validation → Expected Output). The PRD is the authority on *what* must be true; the test plan is the authority on *how to verify* it.

### Test Contract

These rules are mandatory. A test that violates them is a failing test regardless of whether its assertions pass. The test plan elaborates each rule with examples and a tiered fix-priority schedule.

**T1 — No Vacuous OR Fallbacks.** Assertions must not use trailing OR clauses broad enough to always fire.

**T2 — No Conditional Assertions on File Existence.** Assert file existence unconditionally first: `expect(await fileExists(path)).toBe(true)`, then assert contents.

**T3 — No Self-Fulfilling Setup.** Test setup must not create the artifact the test then verifies.

**T4 — No Tautological Type Assertions.** Assert specific values or ranges, not just types.

**T5 — Exit Codes Must Be Specific.** Error paths assert `exitCode !== 0`. Success paths assert `exitCode === 0`.

**T6 — String Assertions Must Be Specific.** Use `\b47\b` not `\d+` when 47 messages are expected.

**T7 — Path Assertions Must Use the Same Form as the Tool.** When asserting a path does not appear in tool output (e.g., git status), use the path form the tool actually emits (relative), not an absolute path that can never appear.

---

## Git Best Practices

### What to commit:
- `.claude/tasks/*/CLAUDE.md` — Task knowledge
- `.claude/tasks/*/README.md` — Task documentation
- `.claude/tasks/*/contexts/*.jsonl` — Golden contexts (max 100KB each)
- `.claude/.gitignore` — Ignore rules
- `prod-mgmt/risk-acceptances.md` — Human-reviewed risk decisions
- `.claude/skills/context-curator/authoring/` — Authoring skills, if using project-scope install (standalone, no session dependency)
- `.claude/skills/context-curator/session/` — Session management skills, if using project-scope install
- `.claude/skills/context-curator/monitor/` — Monitor skills, if using project-scope install
- `.claude/context-curator-manifest.json` — Plugin manifest for `/plugin marketplace` discovery
- `docs/` — All documentation (markdown base, generated HTML, style guide, feature-section map)

### What NOT to commit:
- `.claude/CLAUDE.md` — Auto-generated, each developer has their own
- Personal contexts (they live in `~/.claude/projects/`)
- `prod-mgmt/test-inventory.md` — Adversary output (regenerated each run)

> **Choosing a scope:** Global install (`~/.claude/skills/`) is simpler for solo developers. Project-scope install (`.claude/skills/`) is better for teams — it pins the skill version alongside the project, requires no per-developer installer step, and makes the skills visible in code review like any other project file. Both work; they can coexist (project scope takes precedence).

### Context Size Policy

Golden contexts committed to git are capped at **100KB per file**. Personal contexts have no size limit.

---

## Future Enhancements

### Context Quality Scoring

When a user saves a golden context, generate a "warm-up score" based on how many distinct subsystem concepts the context contains and how specific (vs. generic) Claude's demonstrated understanding is. Gives teams signal about which golden contexts are actually worth loading vs. stale/shallow ones.

### Proactive Context Checkpoint Suggestion

A `StatusLine`-style hook that monitors context usage percentage and proactively suggests saving a checkpoint before quality degrades ("You're at 65% context and appear warmed up on the auth subsystem — want to save a checkpoint?"). Turns context management from reactive to proactive.

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

### Branch-Merge Protection for LoD Separation

For team environments: optionally enforce organizational separation between constructor (LoD1) and adversary (LoD2) by requiring adversary review to pass before a PR can be merged. Mirrors the CTO/CRO organizational boundary in financial services LoD governance.

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
| `/context-list [task-id]` | List contexts | Fork | Active sessions + AI-generated summaries |
| `/context-manage` | Interactive management | Fork | Claude assists with organization |
| `/context-promote <name>` | Personal → Golden | Fork | Secret scanning + redaction |
| `/docs-markdown` | Update markdown docs base | Main | Runs after every PRD update; prompts for feature-section mapping |
| `/docs-html` | Regenerate HTML from markdown | Main | Always run after `/docs-markdown`; validates a11y; bootstraps style.md if absent |

---

## Version History

- **v21.1** (2026-05-10): T-SPEC-5 added — `task-check` must recognize specialized tasks and return `exists:specialized`; `getTaskInfo()` bug fix: specialized directory was not checked, causing `/task adversary` to fall through to the "create new task" prompt
- **v21.0** (2026-05-09): Process sequencing skill added
    - **F-PROCESS (new):** `/prd-process` skill detects current phase via artifact presence and mtime heuristics; adversary-staleness check warns when `prd.md` is newer than `test-inventory.md`; resists out-of-order implementation requests; `--force` bypass available for intentional exceptions; T-PROC-1 through T-PROC-6 added
    - **`prd-process` added to authoring bundle:** skill directory added to `authoring/prd-process/`; `scripts/prd-process-status.ts` provides the underlying state-machine scan
    - **prd-driven-development.md updated:** "Process State Machine" section added describing phase detection heuristics, staleness check formula, and resistance model
- **v20.1** (2026-05-09): T-XXX code collision fix
    - **F-DOC AC codes corrected:** T-DOC-1 through T-DOC-8 renamed to T-UDOC-1 through T-UDOC-8; T-DOC-1/6 codes belong exclusively to F-DOC-SKILLS; T-UDOC-* namespace is reserved for F-DOC (user documentation system)
- **v20.0** (2026-05-09): User documentation system added
    - **F-DOC (new):** Two-skill documentation system — `/docs-markdown` (markdown base update, feature-section mapping, glossary, permuted index) and `/docs-html` (HTML generation, a11y validation, style.md bootstrap); documentation is Phase 1a of the development process, immediately after PRD authoring and before test plan; T-UDOC-1 through T-UDOC-8 added
    - **Documentation skills added to authoring bundle:** `docs-markdown/` and `docs-html/` added to skill structure diagram and personal storage structure
    - **Project structure updated:** `docs/` directory added with full tree (markdown base, html output, style guide, feature-section map)
    - **Git best practices updated:** `docs/` committed as a first-class project artifact
    - **Overview updated:** user documentation feedback loop added to key innovations
    - **prd-driven-development.md updated:** Phase 1a added to process flow; full documentation system specification; evidence-based rationale for early user iteration; two documentation skills specified; improvement suggestions section added; artifact triad expanded to five-artifact set
- **v19.0** (2026-05-09): Substantial update across architecture, features, and process artifacts
    - **Skills architecture:** Commands migrated from `~/.claude/commands/` to skills under `~/.claude/skills/context-curator/`; skills namespaced into three bundles — `authoring/`, `session/`, `monitor/`; slash commands preserved unchanged
    - **Installation scopes:** Two install paths added — global (`~/.claude/skills/`) for individual developers, project-scope (`.claude/skills/`) for zero-setup team installs; project scope takes precedence when both present; T-INIT-7/8/9 added
    - **F-DOC-SKILLS (new):** Four document authoring skills (`/prd`, `/test-plan`, `/dev-plan`, `/test-inventory`) that auto-invoke on filename pattern match and enforce idiomatic format; `/prd check-ac` surfaces non-falsifiable criteria for human review before adversary runs; T-DOC-1 through T-DOC-6 added
    - **F-MARKETPLACE (new):** Plugin manifest (`context-curator-manifest.json`) exposes skills as a browsable, selectively-installable marketplace; local team manifest committed to `.claude/`; authoring bundle publishable standalone to community registry; T-MKT-1 through T-MKT-4 added
    - **F-CTX-MONITOR (new):** Context monitoring feature with three sub-features — F-CTX-MONITOR-STATUS (passive status line: fill %, tokens since warm-up, cost, burn rate), F-CTX-MONITOR-WARN (one-fire threshold warnings at 65% and 80% with zone sentinels), F-CTX-MONITOR-COST (burn rate and cost estimation from JSONL); all computation local, zero model token cost; T-MON-1 through T-MON-13 added
    - **F-HOOK-POST (new):** PostCompact task re-injection hook re-injects active task context after every compaction; T-HOOK-POST-1/2/3 added
    - **F-PRD (new):** Artifact triad formalized (PRD + test plan + dev plan); format requirements for all three documents specified; T-PRD-1 through T-PRD-4 added; T-INIT-6 added for prod-mgmt/ initialization
    - **STRICT isolation hardened:** Hook-enforced rather than instruction-enforced for adversary task; T-SPEC-2 and T-ADV-4 ACs broadened to cover all paths within adversary task directories (not just one specific filename), following LoD2 finding
    - **T-GIT-2 corrected:** AC rewritten to require relative path form matching git status output; original assertion was vacuous (used absolute path git never emits), following LoD2 finding
    - **T7 test contract rule added:** Path assertions must use the same form as the tool being tested
    - **prod-mgmt/ directory:** Added to project structure; created by task-init; holds risk-acceptances.md (committed) and test-inventory.md (not committed)
    - **Architecture diagrams updated:** Project structure, personal storage structure, and skill structure diagrams all reflect new namespaced layout
- **v18.0** (2026-03-12): Added Specialized Tasks concept, F-SPEC framework, and F-ADVERSARY task
- **v17.0** (2026-03-10): Merged Commands Reference content into Features sections
- **v16.0** (2026-03-10): Added Commands Reference section with Purpose/Execution/Behavior/Example for all five commands
- **v15.0** (2026-03-10): Embedded DoD acceptance criteria into feature sections; added Feature 14 (PreCompact Auto-Save Hook)
- **v13.0** (2026-01-17): Two-file CLAUDE.md system, golden contexts, secret detection, interactive management
- **v12.0** (2026-01-12): Forked execution, @-import mechanism
- **v11.0** (2026-01-12): Personal storage in ~/.claude/projects/
- **v10.0** (2026-01-10): Initial @-import architecture

---

## License

MIT License — see LICENSE file for details

---

## Acknowledgments

- Claude Code team at Anthropic for `context: fork`, `/resume` behavior, Skills, and Hooks
- Community for multi-instance workflows and best practices
- Every developer who's lost hours of hard-won context to auto-compact

**Built with ❤️ to preserve developer sanity and hard-won knowledge**