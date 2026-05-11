# Managing Contexts

A [context](glossary.md#context) is a named snapshot of a Claude Code session. Save one when Claude has genuinely warmed up; restore it later — Claude picks up at the same depth of understanding.

## Saving a Context

```bash
/context-save deep-understanding
```

Saves your current session as a [personal context](glossary.md#personal-context) — stored in your home directory, never committed to git, visible only to you.

Context names must be alphanumeric with hyphens or underscores: `morning-progress`, `found_the_bug`, `auth-v2`.

**What gets saved:**
- Full conversation history
- An AI-generated summary of what the session covered
- Metadata: message count, timestamp, task association

**Overwrite protection:** If that name already exists, Context Curator backs up the original before overwriting.

---

## Listing Contexts

```bash
/context-list
```

Lists all contexts for the current task:

```
auth-refactor — contexts

Personal:
  1. deep-understanding (47 msgs, 2026-05-09) — Mapped token refresh flow, found race condition
  2. morning-progress (23 msgs, 2026-05-08) — Initial exploration of OAuth middleware
```

Each entry shows the AI-generated summary so you know which session to restore before loading it.

To list contexts for a specific task:

```bash
/context-list payment-v2
```

---

## AI-Generated Summaries

Every saved context gets an automatic 2–3 sentence description: what was accomplished, what was decided, what the session covered. Generated in a forked session — your current conversation is unaffected.

The summary is stored in a `.meta.json` file alongside the `.jsonl` session file and shown by `/context-list`.

---

## Managing Your Context Library

Over time contexts accumulate. `/context-manage` helps keep things tidy.

**List everything across all tasks:**
```bash
/context-manage
```
Highlights stale contexts (not accessed in 30+ days) and duplicates (byte-for-byte identical files).

**Dry run before deleting:**
```bash
/context-manage delete auth-refactor morning-progress --dry-run
```
Shows exactly what would be deleted. Always use `--dry-run` first.

**Rename:**
```bash
/context-manage rename auth-refactor old-name new-name
```

**Archive** (moves to `contexts/archives/`, out of the active list):
```bash
/context-manage archive auth-refactor old-exploration
```

**Delete:**
```bash
/context-manage delete auth-refactor old-exploration --force
```
`--force` is required to prevent accidental deletion.

---

## Storage Locations

| Context Type | Location | Committed to Git |
|-------------|----------|-----------------|
| Personal | `~/.claude/projects/<project>/tasks/<task>/contexts/` | No |
| Golden (shared) | `./.claude/tasks/<task>/contexts/` | Yes |
| Auto-save | `~/.claude/projects/<project>/auto-saves/` | No |

Personal contexts are private to your machine. Golden contexts travel with the repo. Auto-saves are the pre-compaction backups created by hooks — you don't manage these directly.

---

You now have everything you need to save, restore, and manage contexts solo.

- [Context Monitoring](context-monitoring.md) — know when to save before quality drops
- [Hooks and Automation](hooks-automation.md) — automatic saves so you never lose a session
- [For Teams](for-teams.md) — share warmed-up contexts with teammates
