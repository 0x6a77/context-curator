# Context Curator

Task-based context management for Claude Code. Preserve your hard-won Claude understanding.

[PRD](prod-mgmt/prd.md) · [Documentation](https://0x6a77.github.io/context-curator/)

---

## The Problem

Working on large, legacy codebases requires 1–3 hours to warm Claude Code up on a specific subsystem. Once Claude understands the quirks, patterns, and gotchas, it performs exceptionally. Then auto-compact fires and you start over.

## The Solution

Context Curator lets you:

- **Save warmed-up sessions** as named context snapshots
- **Organize work into tasks** with focused instruction sets
- **Share valuable contexts** with your team via git

**Key mechanism:** Claude Code's `/resume` re-reads `CLAUDE.md` from disk. Context Curator swaps task-specific instructions at resume-time — no git conflicts, no project pollution.

## Install

```bash
git clone https://github.com/0x6a77/context-curator.git
cd context-curator
./install.sh
```

Then initialize any project:

```bash
cd ~/my-project
claude
/task-init
```

## Usage

```bash
# Create a focused task
/task auth-refactor

# Work for hours, Claude gets warmed up...

# Save before auto-compact strikes
/context-save deep-understanding

# Next session — or on a teammate's machine
/task auth-refactor
> 1. deep-understanding (47 msgs) ⭐
/resume <uuid>
# Claude is instantly back at peak understanding ✨
```

## Commands

| Command | Description |
|---------|-------------|
| `/task <id>` | Switch to a task (creates if new, shows contexts if exists) |
| `/context-save <name>` | Save current session as a named context |
| `/context-list [task]` | List contexts for a task |
| `/context-manage` | Interactive context management |
| `/context-promote <name>` | Share a personal context with your team |

## Documentation

- [Getting Started](https://0x6a77.github.io/context-curator/getting-started/) — Installation and project setup
- [Concepts](https://0x6a77.github.io/context-curator/concepts/) — Tasks, contexts, and the two-file CLAUDE.md system
- [Commands](https://0x6a77.github.io/context-curator/commands/) — Full command reference
- [Workflows](https://0x6a77.github.io/context-curator/workflows/) — Solo, team, and context-switching patterns

## License

BSD-3-Clause. See [LICENSE](LICENSE.txt).
