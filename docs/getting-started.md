# Getting Started

## Install

```bash
git clone https://github.com/0x6a77/context-curator.git
cd context-curator
./install.sh
```

This compiles the TypeScript source and copies everything into place:

- Scripts: `~/.claude/context-curator/dist/`
- Slash commands: `~/.claude/commands/task/`

## Per-Project Setup

### 1. Initialize the project

```bash
cd ~/my-project
claude
/task-init
```

This creates:

- `.claude/` directory with `.gitignore`
- `.claude/tasks/default/CLAUDE.md` (copy of root `CLAUDE.md`)
- Backup of original `CLAUDE.md` in personal storage

### 2. Configure Claude Code settings

Create `.claude/settings.json`:

```json
{
  "env": {
    "INHERIT_FROM_SHELL": "true"
  },
  "sandbox": {
    "enabled": true,
    "excludedCommands": [
      "node ~/.claude/context-curator/dist/scripts/"
    ]
  }
}
```

!!! note "Sandbox + Context Curator"
    With `sandbox.enabled: true`, Claude Code restricts writes to the project directory. The `excludedCommands` entry lets Context Curator write to `~/.claude/projects/` (where task and context data lives) while keeping all other sandbox restrictions in place.

### 3. Add to .claude/.gitignore

```gitignore
CLAUDE.md
settings.local.json
```

The auto-generated `.claude/CLAUDE.md` is per-developer and must never be committed. `settings.local.json` holds personal permission grants and should also stay out of git.

## Files After Setup

```
my-project/
├── CLAUDE.md                    # Project instructions (committed)
├── .claude/
│   ├── CLAUDE.md                # Task switcher (git-ignored)
│   ├── settings.json            # Sandbox + env config (committed)
│   ├── settings.local.json      # Personal permissions (git-ignored)
│   └── .gitignore

~/.claude/
├── CLAUDE.md                    # Global instructions
├── commands/task/               # Context Curator slash commands
└── context-curator/dist/        # Compiled scripts
```

## Optional: Container-Use

[container-use](https://github.com/dagger/container-use) runs Claude's file and shell operations inside containers for extra isolation. To enable it, add to your global `~/.claude/CLAUDE.md`:

```markdown
## container use

ALWAYS use ONLY Environments for ANY and ALL file, code, or shell operations.
```

## Optional: Git Commit Conventions

For consistent AI-assisted commit messages, add to `~/.claude/CLAUDE.md`:

```markdown
## Git Commits

For every prompt YOU MUST suggest a commit message: first line under 50 chars
ending in "(claude 4)", followed by a blank line, followed by the prompt.
```

## Next Steps

- [Concepts](concepts.md) — Understand tasks, contexts, and the two-file system
- [Commands](commands.md) — Full command reference
- [Workflows](workflows.md) — Common patterns and examples
