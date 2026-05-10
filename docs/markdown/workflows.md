# Workflows

Common patterns for using Context Curator day-to-day.

---

## Solo Developer

The core loop: create a task, work until Claude is warmed up, save before auto-compact strikes.

```bash
# Day 1 morning
/task auth-refactor
# ... 3 hours of exploration, Claude gets warmed up ...
/context-save morning-progress

# Day 1 afternoon
/task auth-refactor
> Personal:
>   1. morning-progress (23 msgs) — Mapped the token refresh flow, found the session state issue
/resume <uuid>
# Continue exactly where you left off
/context-save found-the-bug

# Day 2
/task auth-refactor
> Personal:
>   1. found-the-bug (31 msgs) — Reproduced logout race condition, root cause identified
/resume <uuid>
# Implement the fix with full context intact
```

**Tips:**

- Save early, save often — don't wait for auto-compact
- Use descriptive names: `oauth-token-edge-cases` beats `tuesday`
- Keep tasks focused on one subsystem or problem area

---

## Team Collaboration

[Golden contexts](glossary.md#golden-context) are committed to git. Teammates pull them and instantly load your hard-won understanding.

**Alice builds deep understanding and shares it:**

```bash
/task payment-integration
# ... extensive work understanding the Stripe webhook flow ...
/context-save stripe-complete --golden

git add .claude/tasks/payment-integration/contexts/stripe-complete.jsonl
git commit -m "Share Stripe integration context"
git push
```

**Bob uses Alice's context the next morning:**

```bash
git pull
/task payment-integration
> Golden (shared):
>   ⭐ 1. stripe-complete (47 msgs, alice, yesterday) — Full Stripe webhook flow, retry logic, idempotency keys
> 1
/resume <uuid>
# Bob is productive on payments from minute one
```

The warm-up cost Alice paid — hours of exploration and dead ends — is paid once. Every teammate who pulls gets the benefit.

---

## Handling Interruptions

Saving your context before switching tasks means you can return to deep focus without re-warming.

```bash
# Deep in auth refactor work, Claude has full context
/task auth-refactor
/resume <uuid>
# ... 2 hours of focused work ...

# Urgent bug comes in, can't ignore it
/context-save pre-interruption
/task urgent-bug
# ... fix the bug, task complete ...

# Back to auth work, exactly where you left off
/task auth-refactor
> Personal:
>   1. pre-interruption (52 msgs) — Was about to refactor the token validation path
/resume <uuid>
# Full context restored, no re-warm needed
```

This pattern also works for end-of-day: save before you close the laptop, resume the next morning.

---

## Returning to Default

Step outside all task-specific instructions and back to vanilla Claude Code:

```bash
/task default
```

Useful when you need to do general project work that doesn't fit any task, or when you want Claude without any special focus loaded. The default task uses your root `CLAUDE.md` only.

---

## Native Claude Code Commands

These built-in Claude Code commands complement Context Curator. They work in any task.

| Command | What it does |
|---------|-------------|
| `/fork [name]` | Branch the current conversation to explore an alternative approach without losing the main thread |
| `/rewind` | Roll back the conversation to a previous checkpoint |
| `/rename [name]` | Give the current session a memorable name for easier identification |
| `/compact [instructions]` | Manually compact the conversation with optional instructions about what to preserve |
| `/context` | Show current token usage and context window fill level |

**Note on `/compact`:** Context Curator's PreCompact hook fires automatically before `/compact`, so your session is saved before any compaction runs — including manual compaction. You won't lose unsaved work.

---

## Next Steps

- [Managing Contexts](managing-contexts.md) — full detail on `/context-save`, `/context-list`, `/context-promote`
- [Context Monitoring](context-monitoring.md) — see context fill level before it becomes a problem
- [Hooks and Automation](hooks-automation.md) — the PreCompact hook that auto-saves before every compaction
