# Hooks and Automation

Context Curator registers two hooks that fire automatically on compaction events, protecting your context without requiring manual action.

## The Compaction Lifecycle

Both hooks are part of the same compaction event sequence. Together they ensure you never lose a session to unexpected compaction, and always pick up with task context intact after one.

```
Before Compaction          During Compaction          After Compaction
─────────────────          ─────────────────          ────────────────
Session running            PreCompact hook fires      PostCompact hook fires
PostToolUse fires                  ↓                          ↓
State file updated         Auto-save written          Task context re-injected
(monitoring)                       ↓                   (non-default task)
                           Compaction executes         Session continues
```

## PreCompact Auto-Save Hook

Before every compaction — automatic or manual — a hook saves the current session to a timestamped file:

```
~/.claude/projects/<project>/auto-saves/2026-05-09T14-32-00.jsonl
```

This is a safety net. If compaction happens unexpectedly, you have a copy of the session from just before it. Auto-saves are flat `.jsonl` files in a dedicated directory — no task association, no AI summary, just a timestamped snapshot.

Auto-saves are not the same as named contexts. They're an emergency fallback, not a workflow tool. For intentional checkpoints you plan to resume from, use `/context-save`.

### Accessing Auto-Saves

Auto-saves live in `~/.claude/projects/<project>/auto-saves/`. You can browse them by timestamp to find the most recent one before a compaction event, then manually restore from it if needed.

## PostCompact Task Re-Injection Hook

After every compaction, a hook re-injects your current task context into the session.

**The problem it solves:** After compaction, Claude loses the warm context built up during the session. The session continues but Claude's understanding of your specific task — the quirks, the architecture, the open threads — is gone. You'd normally have to re-explain everything.

**What the hook does:** It reads which task is currently active from your `.claude/CLAUDE.md`, generates a concise summary of the task's CLAUDE.md content, and injects it as a system message. Claude picks up with the task context fresh in mind.

### Behavior

- **Non-default task active:** Injects a one-paragraph context reminder from the task CLAUDE.md. Claude's next response acknowledges the task context.
- **Default task active:** Injects nothing. No reminder needed when you're in vanilla mode.
- **Task CLAUDE.md not readable:** Logs a warning to stderr but does not fail the session. Claude continues without the injection; you may notice reduced task focus.

The hook fires for both automatic and manual compaction. It runs synchronously via a `PostCompact` hook so the injection happens before Claude's next response.

## Hook Registration

Both hooks are registered globally in `~/.claude/settings.json` by the installer. You can verify they're registered:

```bash
cat ~/.claude/settings.json | grep -A5 hooks
```

The hooks run local TypeScript scripts via `npx tsx`. No network calls, no model invocations. They read from and write to local files only.

## When Hooks Are and Aren't Enough

**Hooks handle:** Unplanned compaction events (auto-compact fires mid-session), manual compaction, session continuity after any compaction.

**Hooks don't handle:** Intentional session breaks where you want to return days later at peak understanding. For those, save a named context with `/context-save` before ending the session. Named contexts have summaries, are searchable, and are usable by teammates (if golden).

Think of hooks as your auto-save in a video game — they save your progress constantly so you don't lose much if something goes wrong. Named contexts are your manual saves — intentional, named, and available to load later.

## Next Steps

- [Managing Contexts](managing-contexts.md) — intentional named saves alongside auto-saves
- [Context Monitoring](context-monitoring.md) — know when compaction is approaching so you can save before it happens
