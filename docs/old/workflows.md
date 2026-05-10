# Workflows

## Solo Developer

The core loop: create a task, work until Claude is warmed up, save before auto-compact.

```bash
# Day 1 morning
/task auth-refactor
# ... 3 hours of exploration, Claude gets warmed up ...
/context-save morning-progress

# Day 1 afternoon
/task auth-refactor
> 1. morning-progress (23 msgs)
/resume <uuid>
# Continue exactly where you left off
/context-save found-the-bug

# Day 2
/task auth-refactor
> 1. found-the-bug (31 msgs)
/resume <uuid>
# Implement the fix with full context intact
```

**Tips:**

- Save early, save often — don't wait for auto-compact
- Use descriptive names: `oauth-token-edge-cases` beats `tuesday`
- Keep tasks focused on one subsystem

---

## Team Collaboration

Golden contexts are committed to git. Teammates pull them and instantly load your understanding.

**Alice builds up understanding and shares it:**

```bash
/task payment-integration
# ... extensive work understanding the Stripe flow ...
/context-save stripe-complete
> 2 (Golden)

git add .claude/tasks/payment-integration/contexts/stripe-complete.jsonl
git commit -m "Share Stripe integration context"
git push
```

**Bob uses Alice's context:**

```bash
git pull
/task payment-integration
> Golden:
>   1. stripe-complete (47 msgs) ⭐ by: alice
> 1

# Bob is instantly productive on payments
```

---

## Context Switching

Handling urgent interruptions without losing your place.

```bash
# Deep in auth refactor work
/task auth-refactor
# ... 2 hours of focused work ...

# Urgent bug comes in
/context-save pre-interruption
/task urgent-bug
# ... fix the bug ...

# Back to auth work, exactly where you left off
/task auth-refactor
> 1. pre-interruption (52 msgs)
/resume <uuid>
```

---

## Returning to Default

Switch back to general-purpose mode without task-specific instructions.

```bash
/task default

✓ Restored to vanilla project context
Run: /resume <uuid>
```

---

## Native Claude Code Commands

These built-in commands complement Context Curator:

| Command | What it does |
|---------|-------------|
| `/fork [name]` | Branch the conversation for exploring alternatives |
| `/rewind` | Roll back to a previous checkpoint |
| `/rename [name]` | Give the current session a memorable name |
| `/compact [instructions]` | Manually compact with optional focus instructions |
| `/context` | Visualize current token usage |

Context Curator's `PreCompact` hook fires automatically before `/compact`, so your context is always saved before compaction runs.
