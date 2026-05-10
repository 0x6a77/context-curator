# Reference

This page covers the CLAUDE.md two-file system, cross-platform compatibility, and error handling behavior.

## The Two-File CLAUDE.md System

Claude Code reads `CLAUDE.md` when loading a session. Context Curator needs to swap which task's instructions are active without modifying your project's committed `CLAUDE.md` — which would create git conflicts every time you switch tasks.

The solution is two files:

**`./CLAUDE.md` (root, committed)**
Your project's canonical instructions. This file is never modified by Context Curator. It contains universal project knowledge — architecture, conventions, commands — that every developer shares. Commit it, version it, review it in PRs.

**`./.claude/CLAUDE.md` (auto-generated, git-ignored)**
The file Claude Code actually reads on every `/resume`. Context Curator writes and overwrites this file. It contains `@import` directives that point to whichever task is currently active:

```
@import ./tasks/auth-refactor/CLAUDE.md
```

When you run `/task payment-v2`, Context Curator replaces the `@import` line. When Claude Code resumes, it re-reads `.claude/CLAUDE.md` from disk, picks up the new import, and loads the payment-v2 task instructions.

**Why this works:** Claude Code's `/resume` re-reads `CLAUDE.md` from disk at resume time — fresh from disk, not from a cached copy in the session. This means the import change takes effect immediately on the next `/resume`, without any other action.

**The gitignore entry:** `/task-init` creates `.claude/.gitignore` with a `CLAUDE.md` entry. Each developer has their own `.claude/CLAUDE.md` reflecting their current task. These files never conflict because they're never tracked.

### Task CLAUDE.md Files

Each task has its own `CLAUDE.md` at `.claude/tasks/<task-id>/CLAUDE.md`. These files are committed. They travel with the repo and carry the task-specific instructions that any developer can load via `/task <id>`.

---

## How `/resume` Re-Reads CLAUDE.md

When you run `/resume <uuid>`, Claude Code:

1. Loads the session from disk (conversation history, state)
2. Re-reads `.claude/CLAUDE.md` fresh from disk
3. Reconstructs the system prompt with the new CLAUDE.md content
4. Restores runtime state
5. Resumes conversation

This is the key mechanism behind task switching. The import points to the right task, and the re-read picks it up.

> **Note:** This re-read-on-resume behavior is not officially documented by Anthropic. It's an observed behavior that is central to Context Curator's task switching. If a future Claude Code update changes it, task switching will break. Mitigation: after any major Claude Code update, verify that a known string from your task CLAUDE.md appears in Claude's context after a `/resume`.

---

## Cross-Platform Compatibility

Context Curator supports macOS and Linux. Windows native is out of scope; Windows users should use WSL2.

**Path handling:** All path operations use POSIX conventions. Project directories with spaces in their names are supported — all scripts quote paths correctly.

**Shell requirement:** Bash or zsh. The installer and all hook scripts use POSIX-compatible shell constructs.

---

## Error Handling

Context Curator scripts produce clear, actionable error messages without exposing stack traces.

**Before initialization:** Any script run in a project that hasn't been initialized with `/task-init` exits non-zero with a message containing "initialized" or "init". There's no stack trace; just a clear message about what to do.

**Malformed context files:** If a `.jsonl` context file is corrupted or malformed, `scan-secrets` and other read operations exit non-zero with a message that names the corruption. The error message describes what was wrong, not just that something failed.

**The general pattern:** If something goes wrong, Context Curator tells you what happened and what to do next, in plain language.

---

## Directory Reference

| Path | Purpose | Committed |
|------|---------|-----------|
| `./CLAUDE.md` | Root project instructions | Yes |
| `./.claude/CLAUDE.md` | Active task import (auto-generated) | No |
| `./.claude/tasks/<task>/CLAUDE.md` | Task-specific instructions | Yes |
| `./.claude/tasks/<task>/contexts/` | Golden context storage | Yes |
| `./.claude/.gitignore` | Ignores active CLAUDE.md | Yes |
| `./prod-mgmt/prd.md` | Product requirements | Yes |
| `./prod-mgmt/test-plan.md` | Integration test specification | Yes |
| `./prod-mgmt/dev-plan.md` | Developer implementation plan | Yes |
| `./prod-mgmt/test-inventory.md` | Adversary output (regenerated each run) | No |
| `./prod-mgmt/risk-acceptances.md` | Governance risk register | Yes |
| `~/.claude/projects/<project>/tasks/<task>/contexts/` | Personal context storage | No |
| `~/.claude/projects/<project>/auto-saves/` | Pre-compaction auto-saves | No |
| `~/.claude/context-curator/monitor-state.json` | Monitor state (runtime) | No |
| `~/.claude/context-curator/monitor-config.json` | Monitor configuration | No |
| `~/.claude/context-curator/specialized/adversary/CLAUDE.md` | Adversary task DNA | No |
| `~/.claude/skills/context-curator/` | User-scope skills | No |
| `./.claude/skills/context-curator/` | Project-scope skills | Yes (if --project-install) |
