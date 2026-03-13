# Concepts

## Tasks

A **task** is a focused work environment containing:

- Custom `CLAUDE.md` with task-specific instructions
- Personal context snapshots (private to you)
- Golden context snapshots (shared with the team via git)

Tasks represent distinct areas of work on the same codebase:

```
oauth-refactor
payment-webhooks
legacy-migration
mobile-auth-bugs
```

## Contexts

A **context** is a named snapshot of a Claude Code session saved within a task.

### Personal Contexts

- Saved in `~/.claude/projects/.../tasks/*/contexts/`
- Never committed to git
- Your private work history

### Golden Contexts

- Saved in `./.claude/tasks/*/contexts/`
- Committed to git
- Team knowledge base of warmed-up sessions

When a teammate runs `/task auth-refactor` after a `git pull`, they see your golden contexts and can load your hard-won understanding instantly.

## The Two CLAUDE.md Files

This is how Context Curator avoids git conflicts when multiple developers work on the same project.

### `./CLAUDE.md` (Root, Committed)

- Your canonical project knowledge
- Universal instructions, architecture, commands
- **Never modified by Context Curator**
- Standard git workflow

### `./.claude/CLAUDE.md` (Auto-generated, Git-ignored)

- What Claude Code actually reads
- Contains an `@import` directive pointing to the active task
- Modified by `/task` when you switch tasks
- Each developer has their own

**Example `.claude/CLAUDE.md`:**

```markdown
# Project: my-app

## Universal Instructions
[Your project-wide guidelines]

## Task-Specific Context
@import ~/.claude/projects/-Users-dev-my-app/tasks/oauth-refactor/CLAUDE.md
```

When you run `/task payment-integration`, the `@import` line is updated. When you then run `/resume`, Claude Code re-reads `CLAUDE.md` from disk and picks up the new task instructions.

## How `/resume` Enables Task Switching

When you run `/resume <uuid>`, Claude Code:

1. Loads the session from disk
2. **Re-reads `CLAUDE.md` from the current directory** (fresh from disk)
3. Reconstructs the system prompt with the new instructions
4. Resumes the conversation

This is the mechanism that makes task switching work. You modify `.claude/CLAUDE.md` between sessions and the new instructions take effect on `/resume`.

## File Locations

```
# Project repository (committed to git)
my-project/
└── .claude/
    └── tasks/
        └── oauth-refactor/
            ├── CLAUDE.md              # Task instructions
            └── contexts/
                └── deep-dive.jsonl    # Golden context

# Personal storage (never committed)
~/.claude/projects/-Users-dev-my-project/
└── tasks/
    └── oauth-refactor/
        └── contexts/
            └── my-work.jsonl          # Personal context
```
