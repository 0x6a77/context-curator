---
name: warn
description: >
  Context window zone warning. Fires a one-time warning when entering degrading (65%)
  or critical (80%) zones. Suppressed by sentinel after first warning per session.
invocation: auto
---

# /warn — Zone Boundary Warnings

This skill is auto-invoked by the PostToolUse hook to check zone thresholds after each tool call.

## Zone Thresholds

- **Degrading zone**: fill ≥ 65%
- **Critical zone**: fill ≥ 80%

## Sentinel Suppression

Each warning fires **at most once per session per zone**. After firing, a sentinel flag is set in `monitor-state.json` to prevent repeat warnings in the same zone:

```json
"zoneSentinels": { "degrading": true, "critical": false }
```

Sentinels are cleared on session start and after compaction.

## Warning Messages

**Degrading zone (first crossing only):**
```
⚠️  Context at N% — entering degrading zone.
    Recall quality is declining. Consider: /context-save checkpoint-name
    (This warning will not repeat in this zone.)
```

**Critical zone (first crossing only):**
```
🔴  Context at N% — critical. Compaction is imminent.
    Start a fresh session: /task <current-task> to reload a saved context.
    (This warning will not repeat in this zone.)
```

## Implementation

```bash
node ~/.claude/context-curator/dist/scripts/warn.js
```
