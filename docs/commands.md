# Commands

## /task-init

Bootstrap a project for Context Curator.

```bash
/task-init
```

Creates `.claude/` directory structure, wires up `.gitignore`, and copies root `CLAUDE.md` into the default task. Safe to run multiple times.

---

## /task \<id\>

Switch to a task. Creates the task if it doesn't exist; shows available contexts if it does.

**New task:**

```
/task oauth-refactor

What should this task focus on?
> Refactoring the legacy OAuth implementation in src/auth/

✓ Created task: oauth-refactor
Run: /resume <uuid>
```

**Existing task:**

```
/task oauth-refactor

Which context?

Personal:
  1. my-progress (15 msgs) - yesterday

Golden:
  2. deep-dive (47 msgs) - 2 days ago ⭐ by: alice

Choice: 2

✓ Context: deep-dive (47 msgs)
Run: /resume <uuid>
```

Switch back to general development with `/task default`.

---

## /context-save \<name\>

Save the current session as a named context.

```
/context-save oauth-deep-dive

Scanning for secrets... ✓ None found

Save as:
1. Personal (only you)
2. Golden (shared via git)

Choice: 1

✓ Saved as 'oauth-deep-dive' (47 msgs)
```

- **Personal** contexts go to `~/.claude/projects/...` (never committed)
- **Golden** contexts go to `.claude/tasks/.../contexts/` (commit to share)

---

## /context-list [task-id]

List contexts and active sessions for a task (defaults to current task).

```
/context-list oauth-refactor

Sessions:
  8e14f625... (current)  23 msgs  ~6k - just now

Personal:
  my-progress            15 msgs - yesterday

Golden:
  oauth-deep-dive        47 msgs - 2 days ago ⭐
```

---

## /context-promote \<name\>

Promote a personal context to golden, making it available to the team via git.

```
/context-promote my-progress

Scanning for secrets...
⚠️  Found: Line 89: API key pattern (pk_test_...)

Options:
1. Continue anyway
2. Redact secrets first
3. Cancel

Choice: 2

✓ Promoted to golden context
✓ Location: .claude/tasks/oauth-refactor/contexts/my-progress.jsonl

Next steps:
  git add .claude/tasks/oauth-refactor/contexts/my-progress.jsonl
  git commit -m "Share OAuth context"
  git push
```

---

## /context-manage

Interactive context management across all tasks.

```
/context-manage

Found 8 contexts across 3 tasks.

Available actions:
  rename, delete, merge
  promote (personal → golden)
  demote (golden → personal)
  view, diff, secrets, clean
```

Use `clean` to find and remove stale or duplicate contexts.

---

## Size Limits

Golden contexts committed to git are capped at **100KB per file**. `/context-save --golden` and `/context-promote` will warn and block if a context exceeds this limit.

---

## /adversary

Activate the LoD2 control assurance reviewer — an independent challenge function that audits test coverage against PRD acceptance criteria.

```
/adversary

✓ Adversary task activated

STRICT isolation is in effect:
  — No context save or restore
  — Each session starts fresh with no prior knowledge
  — /context-save and /context-list are disabled for this task

Run: /resume <session-id>

Assurance mandate:
  Identify control deficiencies and coverage gaps.
  Assurance objective: a test that passes when the implementation is wrong.
  Assurance failure: attesting to coverage you should have challenged.

Produce output to: ./prod-mgmt/test-inventory.md
```

The adversary operates as LoD2 (second line of defence), structurally independent of the engineering team (LoD1) that authored the tests. It reads the PRD and produces `./prod-mgmt/test-inventory.md`.

**Assurance constraints:**

| Constraint | Rule |
|-----------|------|
| No remediation | Produce findings only — no fix suggestions |
| No positive framing | Never produce a "what's good" section |
| No session memory | Each run starts fresh; prior findings do not carry over |
| Risk acceptances | Load from `./prod-mgmt/risk-acceptances.md` and record without re-litigating |

Return to normal work with `/task <your-task-id>`.
