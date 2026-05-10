# Managing Contexts

A [context](glossary.md#context) is a named snapshot of a Claude Code session. This page covers saving, listing, promoting, and cleaning up contexts.

## Saving a Context

```bash
/context-save deep-understanding
```

This saves your current session as a [personal context](glossary.md#personal-context) — stored in your home directory, never committed to git, visible only to you.

Context names must be alphanumeric with hyphens or underscores: `morning-progress`, `found_the_bug`, `auth-v2`.

**What gets saved:**
- The full conversation history (all messages)
- An AI-generated summary of key topics, decisions, and accomplishments
- Metadata: message count, timestamp, task association

**Overwrite protection:** If a context with that name already exists, Context Curator creates a `.backup-` copy of the original before overwriting. You won't lose prior work.

### Saving a Golden (Team-Shared) Context

```bash
/context-save team-baseline --golden
```

[Golden contexts](glossary.md#golden-context) are saved inside the project directory at `.claude/tasks/<task>/contexts/` and committed to git. Any teammate who pulls gets access.

Before saving a golden context, Context Curator scans for secrets. If it finds anything — API keys, tokens, passwords, private keys — it reports them. Secrets block golden promotion; redact or remove them first.

**Size limit:** Sessions over 100KB cannot be promoted to golden. For large sessions, trim or summarize before promoting.

---

## Listing Contexts

```bash
/context-list
```

Lists all contexts for the current task, personal first then golden:

```
auth-refactor — contexts

Personal:
  1. deep-understanding (47 msgs, 2026-05-09) — Mapped token refresh flow, found session race condition
  2. morning-progress (23 msgs, 2026-05-08) — Initial exploration of OAuth middleware

Golden (shared):
  ⭐ 3. team-baseline (61 msgs, jsmith, 2026-05-07) — Full auth subsystem, all edge cases documented
```

To list contexts for a different task:

```bash
/context-list payment-v2
```

Each context shows:
- Name and message count
- Save date and (for golden) author
- AI-generated summary — enough to know which session to resume

---

## AI-Generated Summaries

Every saved context gets an automatic summary — a 2–3 sentence description of what was accomplished, what was decided, and what the session covered. The summary is generated in a separate forked session that doesn't pollute your current conversation.

Summaries are what make `/context-list` useful: you see what's in each context before resuming it, without loading it. The summary is stored in a `.meta.json` file alongside the `.jsonl` session file.

---

## Promoting a Context to Golden

If you have a personal context that would be valuable to share with your team:

```bash
/context-promote deep-understanding
```

This:
1. Scans the context for secrets (blocks if found)
2. Checks the size (blocks if over 100KB)
3. Asks for confirmation
4. Copies from your personal storage to the project's `.claude/tasks/<task>/contexts/`

Your personal original is preserved. The golden copy is committed to git when you next push.

---

## Managing Your Context Library

Over time, contexts accumulate. `/context-manage` gives you tools to keep things tidy.

### List All Contexts Across Tasks

```bash
/context-manage
```

Shows all contexts across all tasks in the current project. Highlights:
- **Stale contexts** — not accessed in 30+ days
- **Duplicate contexts** — byte-for-byte identical files (accidental double-saves)

### Dry Run Before Deleting

```bash
/context-manage delete auth-refactor morning-progress --dry-run
```

Shows exactly what would be deleted without doing it. Always run with `--dry-run` first.

### Renaming a Context

```bash
/context-manage rename auth-refactor old-name new-name
```

Renames in place. The file moves; the content is unchanged.

### Archiving a Context

```bash
/context-manage archive auth-refactor old-exploration
```

Moves the context to `contexts/archives/` within the task directory. Keeps the file but removes it from the active context list.

### Deleting a Context

```bash
/context-manage delete auth-refactor old-exploration --force
```

Deletes the context file. Irreversible. The `--force` flag is required for golden contexts to prevent accidental team knowledge loss.

---

## Storage Locations

| Context Type | Location | Committed to Git |
|-------------|----------|-----------------|
| Personal | `~/.claude/projects/<project>/tasks/<task>/contexts/` | No |
| Golden | `./.claude/tasks/<task>/contexts/` | Yes |
| Auto-save (pre-compaction) | `~/.claude/projects/<project>/auto-saves/` | No |

Personal contexts live in your home directory and are completely private. Golden contexts travel with the repo.

---

## Next Steps

- [Security](security.md) — how secret scanning works before saves and promotions
- [Context Monitoring](context-monitoring.md) — when to save (before quality drops)
- [Hooks and Automation](hooks-automation.md) — auto-save before compaction so you never lose a session
