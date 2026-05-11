# Getting Started

This page covers installation, project setup, and creating your first task.

## Installation

```bash
git clone https://github.com/0x6a77/context-curator.git
cd context-curator
./install.sh
```

The installer compiles the TypeScript source and places everything in:

- Scripts: `~/.claude/context-curator/dist/`
- Skills (slash commands): `~/.claude/skills/context-curator/`
- Specialized tasks (adversary): `~/.claude/context-curator/specialized/`

**Requirements:** Node.js 18+, Claude Code installed.

**Platform:** macOS and Linux. Windows users should use WSL2.

### Project-Scope Install (Optional)

If you want Context Curator to be available to every developer who clones your repo — with no global install required — use the project-scope install:

```bash
cd ~/my-project
./install.sh --project-install
```

This copies the skills into `.claude/skills/context-curator/` in your project. Commit that directory to git and teammates get the full command set automatically.

---

## Initialize a Project

Before using Context Curator in a project, run:

```bash
cd ~/my-project
claude
/task-init
```

This sets up the `.claude/` directory structure, creates a `.gitignore` so task state doesn't leak into git, copies your root `CLAUDE.md` into the default task, and creates the `prod-mgmt/` directory for development artifacts.

You only need to do this once per project. Running `/task-init` again on an already-initialized project is safe — it won't overwrite anything.

**What gets created:**

```
.claude/
  .gitignore           ← git-ignores the active CLAUDE.md (never conflicts)
  CLAUDE.md            ← auto-generated; git-ignored; updated by /task
  tasks/
    default/
      CLAUDE.md        ← copy of your root CLAUDE.md

prod-mgmt/
  risk-acceptances.md  ← governance register for PRD-driven development
```

Your root `CLAUDE.md` is never modified.

---

## Creating a Task

A [task](glossary.md#task) is a focused work environment with its own instructions for Claude. Create one with:

```bash
/task auth-refactor
```

If the task doesn't exist yet, Claude will ask what it should focus on. Describe the work:

```
What should this task focus on?
> Refactoring the OAuth flow in src/auth/. Focus on the token refresh 
> logic, the session state, and the three places auth state is stored.
```

Claude creates a task-specific `CLAUDE.md` based on your description, then tells you to run:

```
/resume <uuid>
```

Run that, and Claude loads the task — instructions already loaded, ready to work.

**Task ID rules:** Lowercase letters, numbers, and hyphens only. No uppercase, no spaces. Examples: `auth-refactor`, `payment-v2`, `legacy-migration-2026`.

---

## Switching Between Tasks

To switch to a task that already exists:

```bash
/task auth-refactor
```

If you have saved [contexts](glossary.md#context) for this task, Claude shows them:

```
auth-refactor — available contexts:

Personal:
  1. morning-progress (47 msgs, 2026-05-09) — Mapped the token refresh flow, found the session race condition
  2. bug-hunt (23 msgs, 2026-05-08) — Reproduced the logout bug under concurrent requests

Golden (shared):
  ⭐ 3. team-baseline (61 msgs, jsmith, 2026-05-07) — Full auth subsystem understanding, all edge cases documented

Start fresh (no context)
```

Select a context or start fresh. Then run `/resume <uuid>` and Claude picks up exactly where that session left off.

---

## The Default Task

Every project has a `default` task. It uses your root `CLAUDE.md` with no task-specific additions — plain Claude with no special focus. Switch to it any time:

```bash
/task default
```

This restores vanilla Claude behavior. Useful when you need to step outside your current task focus.

---

## Quick Example

```bash
# Initialize (first time only)
cd ~/my-project
/task-init

# Create a task
/task auth-refactor
# → describe what to focus on
/resume <uuid>

# Work for a few hours, Claude warms up...

# Save before compaction
/context-save deep-understanding

# Later, or on a teammate's machine:
/task auth-refactor
# → select "deep-understanding" 
/resume <uuid>
# Claude is back at peak understanding instantly
```

---

You now have everything you need to use Context Curator solo.

- [Managing Contexts](managing-contexts.md) — save, list, and restore warmed-up sessions
- [Context Monitoring](context-monitoring.md) — know when to save before quality drops
- [Hooks and Automation](hooks-automation.md) — automatic protection so you never lose a session

When you're ready to bring in teammates: [For Teams](for-teams.md)
