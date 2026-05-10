# Context Monitoring

Context Curator includes a lightweight monitoring system that gives you continuous visibility into session quality — without consuming the context it's measuring.

## The Three Degradation Zones

Based on observed Claude Code behavior, the monitor uses three zones:

| Zone | Fill Level | What It Means |
|------|-----------|---------------|
| 🟢 Productive | < 65% | Sweet spot — high recall quality |
| 🟡 Degrading | 65–80% | Recall declining; save a checkpoint soon |
| 🔴 Critical | > 80% | Compaction imminent; quality significantly degraded |

These thresholds are configurable in `~/.claude/context-curator/monitor-config.json`.

---

## Status Line

After every tool call, a status line appears in the terminal showing your current session state:

```
[🟢 47% | +31k since warm-up | ~$0.18 | 2.1k tok/msg]
```

From left to right:

- **Zone + fill %** — current zone emoji and how full the context window is
- **+N since warm-up** — tokens used since the last saved checkpoint; shows how much runway remains in the productive zone
- **Estimated cost** — cumulative session cost at current model rates
- **Burn rate** — average tokens per message over the last 10 messages

The status line reads from a state file that the monitoring system maintains. It never parses the session JSONL on the display path — all the expensive work happens asynchronously after each tool call, and the status line just reads the result. This keeps it fast and ensures it doesn't interfere with Claude's response.

**The status line is suppressed** when running in non-interactive mode (CI, headless environments).

### The Warm-Up Baseline

The "+Nk since warm-up" field measures from your last saved [checkpoint](glossary.md#context). When you save a context with `/context-save`, the current token count is recorded as the baseline. Everything after that is "since warm-up."

If you haven't saved a checkpoint yet in the current session, the monitor counts from session start.

---

## Zone Warnings

When your session crosses into a new zone, a one-time warning appears:

**At 65% (entering degrading):**
```
⚠️  Context at 67% — entering degrading zone.
    Recall quality is declining. Consider: /context-save checkpoint-name
    (This warning will not repeat in this zone.)
```

**At 80% (entering critical):**
```
🔴  Context at 82% — critical. Compaction is imminent.
    Start a fresh session: /task <current-task> to reload a saved context.
    (This warning will not repeat in this zone.)
```

Warnings fire **before** Claude's next response — you see the warning while there's still time to act. Each warning fires exactly once per zone entry. After compaction resets the fill level, zone sentinels clear and warnings fire again if you re-enter the zone.

---

## Burn Rate and Cost Estimation

The monitor tracks how fast you're consuming context:

- **Burn rate** — mean tokens per message over the last 10 messages (configurable)
- **Cost estimate** — calculated from per-model input/output rates in `monitor-config.json`

Rates are editable without reinstalling — update `monitor-config.json` when model pricing changes.

### Configuration File

`~/.claude/context-curator/monitor-config.json`:

```json
{
  "thresholds": {
    "degrading": 0.65,
    "critical": 0.80
  },
  "burnRateWindow": 10,
  "models": {
    "claude-opus-4-6": {
      "inputCostPer1kTokens": 0.015,
      "outputCostPer1kTokens": 0.075
    },
    "claude-sonnet-4-6": {
      "inputCostPer1kTokens": 0.003,
      "outputCostPer1kTokens": 0.015
    }
  }
}
```

---

## How the Monitor Works

The design constraint is strict: **the monitor must not meaningfully consume the context it is measuring.**

All monitoring runs as local scripts and hooks. No model calls during a live session. One asynchronous `PostToolUse` hook parses the session JSONL and writes a state file after each tool call. The status line display hook and threshold warning hook read that state file — they never parse JSONL themselves. One parse per tool call, results shared by all consumers.

The state file lives at `~/.claude/context-curator/monitor-state.json` and is updated atomically (write to temp, rename) to prevent partial reads.

---

## When to Save a Checkpoint

The monitor tells you when — but here's the general rule:

- Save before you hit 65% if you're in deep understanding territory
- Save immediately when you see the 🟡 warning
- The 🔴 warning means compaction is close — save now, then plan to start a fresh session

The [pre-compaction hook](hooks-automation.md) saves automatically before compaction, but that's a safety net, not a substitute for intentional checkpoints. Named checkpoints are searchable; auto-saves are timestamped blobs.

---

## Next Steps

- [Managing Contexts](managing-contexts.md) — how to save, name, and restore checkpoints
- [Hooks and Automation](hooks-automation.md) — automatic pre-compaction saves as a safety net
