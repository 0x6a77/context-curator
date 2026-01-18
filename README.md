# Context Curator

Task-based context management for Claude Code. Preserve your hard-won Claude understanding.

Version 13.0 • [PRD](prod-mgmt/context-curator-prd.md) • [Dev Plan](prod-mgmt/context-curator-devplan.md)

## The Problem

Working on large, legacy codebases requires hours to warm Claude up on a specific subsystem. Once Claude understands the quirks, patterns, and gotchas, it performs exceptionally. But auto-compact destroys this hard-won understanding, forcing you to start over.

```
Hour 0: Start fresh on auth subsystem
Hour 1-3: Claude warms up (understands OAuth flow, session tokens, edge cases)
Hour 4-6: SWEET SPOT ✨ (Claude is crushing it)
Hour 7: Auto-compact happens 💥
😤 Back to generic suggestions, hours of knowledge lost
```

## The Solution

Context Curator lets you:
- **Save warmed-up sessions** as named context snapshots
- **Organize work into tasks** with focused instructions
- **Share valuable contexts** with your team (golden contexts)
- **Keep personal contexts private** by default

**Key Innovation:** Claude Code's `/resume` re-reads CLAUDE.md from disk. We swap task-specific instructions at resume-time without polluting your project or causing git conflicts.

## Quick Start

### Installation

```bash
# Create directories
mkdir -p ~/.claude/commands

# Download commands
cd ~/.claude/commands
curl -O <repo-url>/commands/task.md
curl -O <repo-url>/commands/context-save.md
curl -O <repo-url>/commands/context-list.md
curl -O <repo-url>/commands/context-manage.md
curl -O <repo-url>/commands/context-promote.md

# Verify
ls ~/.claude/commands/*.md
```

### Per-Project Setup

```bash
cd ~/my-project
claude
You: /task-init
```

This creates the two-file CLAUDE.md system (see [How It Works](#how-it-works)).

### Basic Usage

```bash
# Start a new task
/task oauth-refactor
> What should this task focus on?
"Refactoring the legacy OAuth implementation in src/auth/"

✓ Created task: oauth-refactor
Run: /resume sess-abc123

# Work for hours, Claude gets warmed up...
# Save your hard-won understanding
/context-save oauth-deep-dive
> Save as: 1. Personal  2. Golden
2

✓ Saved as golden context

# Later, or on a teammate's machine:
/task oauth-refactor
> Which context?
> 1. oauth-deep-dive (47 msgs) ⭐
1

Run: /resume sess-xyz789
# Claude is INSTANTLY warmed up! ✨
```

## Core Concepts

### Tasks

A **task** is a focused work environment with:
- Custom CLAUDE.md instructions
- Personal context snapshots (private)
- Golden context snapshots (shared with team)

**Examples:** `oauth-refactor`, `payment-integration`, `legacy-migration`

### Contexts

A **context** is a named snapshot of a Claude Code session.

**Personal contexts** (default):
- Saved in `~/.claude/projects/.../contexts/`
- Never committed to git
- Your private work history

**Golden contexts** (explicitly shared):
- Saved in `./.claude/tasks/.../contexts/`
- Committed to git
- Team knowledge base

### The Two CLAUDE.md Files

This is how we avoid git conflicts:

**`./CLAUDE.md` (Root, Committed)**
- Your canonical project knowledge
- **Never modified by context-curator**
- Committed, reviewed, shared normally

**`./.claude/CLAUDE.md` (Auto-generated, Git-ignored)**
- What Claude Code actually reads
- Contains `@import` to current task
- Each developer has their own
- Modified when you switch tasks

## Commands

### /task \<task-id\>

Switch to a task. Creates if new, shows context menu if exists.

```bash
/task oauth-refactor

# If new:
> What should this task focus on?

# If exists:
> Which context?
> Personal: 1. my-progress (15 msgs)
> Golden:   2. oauth-deep-dive (47 msgs) ⭐
```

### /context-save \<name\>

Save current session as a context.

```bash
/context-save edge-cases

Scanning for secrets... ✓ None found

Save as:
1. Personal (only you)
2. Golden (shared via git)

Choice: 1

✓ Saved as 'edge-cases'
```

### /context-list [task-id]

List contexts and sessions in compact format (newest first).

```bash
/context-list oauth-refactor

Sessions:
  8e14f625... (current)  23 msgs   ~6k - just now

Personal contexts:
  my-progress           15 msgs - today [oauth-refactor]

Golden contexts:
  oauth-deep-dive       47 msgs - yesterday [oauth-refactor] ⭐
```

### /context-manage

Interactive context management.

```bash
/context-manage

Available actions:
- rename, delete, merge
- promote (personal → golden)
- demote (golden → personal)
- view, diff, secrets, clean
```

### /context-promote \<name\>

Promote a personal context to golden (shared with team).

```bash
/context-promote edge-cases

Scanning for secrets...
⚠️ Found: Line 89: API key pattern

Options:
1. Continue anyway
2. Redact secrets first
3. Cancel

Choice: 2

✓ Promoted to golden context

Next steps:
git add .claude/tasks/oauth-refactor/contexts/edge-cases.jsonl
git commit -m "Share edge-cases context"
```

## How It Works

### The @import Mechanism

Your `.claude/CLAUDE.md` contains:

```markdown
# Project: my-app

## Universal Instructions
[Your project-wide guidelines]

## Task-Specific Context
@import ~/.claude/projects/-Users-dev-my-app/tasks/oauth-refactor/CLAUDE.md
```

When you run `/task payment-integration`:
1. Context-curator updates the @import line
2. You run `/resume sess-xyz`
3. Claude Code re-reads CLAUDE.md (fresh from disk!)
4. New task instructions take effect

### File Locations

**Project (committed to git):**
```
my-project/
├── CLAUDE.md                     # Never modified
└── .claude/
    ├── CLAUDE.md                 # Git-ignored, auto-generated
    ├── tasks/
    │   └── oauth-refactor/
    │       ├── CLAUDE.md         # Task instructions
    │       └── contexts/         # Golden contexts
    │           └── oauth-deep-dive.jsonl
    └── .gitignore
```

**Personal (never committed):**
```
~/.claude/
├── commands/                     # Global commands
└── projects/
    └── -Users-dev-my-project/
        └── tasks/
            └── oauth-refactor/
                └── contexts/     # Personal contexts
                    └── my-work.jsonl
```

## Workflows

### Solo Developer

```bash
# Create task
/task auth-fixes
> "Fix authentication bugs in the mobile app"

# Work for a few hours, Claude gets warmed up
# ... fixing bugs, understanding the auth system ...

# Save before auto-compact strikes
/context-save auth-deep-dive
> 1 (Personal)

# Next day
/task auth-fixes
> 1. auth-deep-dive
/resume sess-abc

# Instantly back to full understanding
```

### Team Collaboration

```bash
# Alice creates and shares a golden context
/task payment-integration
# ... extensive work understanding Stripe flow ...
/context-save stripe-complete
> 2 (Golden)

git add .claude/tasks/payment-integration/contexts/stripe-complete.jsonl
git commit -m "Add Stripe integration golden context"
git push

# Bob pulls and uses Alice's context
git pull
/task payment-integration
> 1. stripe-complete (by: alice) ⭐

# Bob is instantly productive on payments
```

### Context Switching

```bash
# Working on API refactor
/task api-refactor
# ... 2 hours of deep work ...

# Urgent bug! Need to switch
/context-save pre-interruption
> 1 (Personal)

# Switch to bug fix
/task bug-fix
# ... fix the bug ...

# Back to API work, exactly where you left off
/task api-refactor
> pre-interruption
/resume sess-xyz
```

## Best Practices

### Save Often

Don't wait for auto-compact. Save whenever Claude reaches peak understanding:

```bash
# Good checkpoints
/context-save after-understanding-auth
/context-save found-the-bug
/context-save refactor-plan-ready
```

### Use Descriptive Names

```bash
# Good
/context-save oauth-token-edge-cases
/context-save stripe-webhook-debugging

# Avoid
/context-save work
/context-save tuesday
```

### Promote Thoughtfully

Only promote contexts that would help teammates:
- Complete understanding of a subsystem
- Debugging approaches that worked
- Architecture decisions with rationale

### Keep Tasks Focused

```bash
# Good: Focused tasks
/task oauth-refactor
/task payment-webhooks
/task mobile-auth-bugs

# Avoid: Vague tasks
/task backend-work
/task misc-fixes
```

## Troubleshooting

### Context not loading

1. Verify context exists: `/context-list <task>`
2. Check file location (personal vs golden)
3. Ensure valid name (lowercase, numbers, hyphens)

### @import not taking effect

1. Check `.claude/CLAUDE.md` has @import line
2. Use `/resume` to reload (not just continue)
3. Verify task CLAUDE.md exists

### Secrets warning on promote

1. Review flagged lines
2. Choose "Redact secrets first" if real secrets
3. Use "Continue anyway" for false positives

### Git conflicts in .claude/

1. `.claude/CLAUDE.md` should be git-ignored
2. Check `.claude/.gitignore` contains `CLAUDE.md`
3. Only `tasks/*/` contents should be committed

## Technical Details

**Requirements:** Claude Code (that's it!)

**No API key needed:** Works entirely within Claude Code using:
- Custom slash commands
- `context: fork` for session analysis
- Native `/resume` behavior
- Standard file operations

**Session format:** JSONL (one JSON message per line)

## Version History

- **v13.0** (2026-01-17): Two-file CLAUDE.md system, golden contexts, secret detection
- **v10.0** (2026-01-10): Task-based architecture with @-import mechanism

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT

## Credits

- Claude Code team at Anthropic for extensibility features
- Every developer who's lost hours of hard-won context to auto-compact

---

**Built with ❤️ to preserve developer sanity and hard-won knowledge**
