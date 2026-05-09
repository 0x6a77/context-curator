---
name: status
description: >
  Show the current context window usage, burn rate, and cost estimate.
  Use /status to see a one-line summary of session health.
invocation: explicit
allowed-tools: Bash
---

# /status

**Usage:** `/status`

Read the monitor state file and display a one-line status summary.

```bash
node ~/.claude/context-curator/dist/scripts/status-line.js
```

Output format:
```
[🟢 47% | +31k since warm-up | ~$0.18 | 2.1k tok/msg]
```

Zone colors:
- 🟢 Productive: < 65% fill
- 🟡 Degrading: 65–80% fill
- 🔴 Critical: > 80% fill

If the state file does not exist, show:
```
[⚪ No monitor data — state file not found]
```

If `CLAUDE_SESSION_TYPE=headless`, output nothing and exit 0.
