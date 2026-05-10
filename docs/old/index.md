# Context Curator

Task-based context management for Claude Code. Preserve your hard-won Claude understanding.

---

## The Problem

Working on large, legacy codebases requires 1–3 hours to warm Claude Code up on a specific subsystem. Once Claude understands the quirks, patterns, and gotchas, it performs exceptionally. Then auto-compact fires and you start over.

```
Hour 0:   Start fresh on auth subsystem
Hour 1–3: Claude warms up (OAuth flow, session tokens, edge cases)
Hour 4–6: SWEET SPOT ✨ — Claude is crushing it
Hour 7:   Auto-compact happens 💥
😤        Back to generic suggestions, hours of knowledge lost
```

## The Solution

Context Curator gives you:

- **Tasks** — Focused work environments with dedicated instruction sets
- **Contexts** — Named snapshots of warmed-up Claude sessions
- **Personal by default** — Your contexts stay private
- **Golden contexts** — Share valuable warmed-up sessions with your team via git

**Key mechanism:** Claude Code's `/resume` re-reads `CLAUDE.md` from disk. Context Curator swaps task-specific instructions at resume-time without polluting your project or causing git conflicts.

## Quick Example

```bash
# Create a task
/task auth-refactor

# Work for hours, Claude gets warmed up...

# Save before auto-compact strikes
/context-save deep-understanding

# Later — or on a teammate's machine
/task auth-refactor
> 1. deep-understanding (47 msgs) ⭐
/resume <uuid>
# Claude is instantly back at peak understanding ✨
```

## Get Started

[Install and configure Context Curator →](getting-started.md)
