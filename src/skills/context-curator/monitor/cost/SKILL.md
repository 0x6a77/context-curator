---
name: cost
description: >
  Show detailed cost breakdown for the current session. Use /cost to see
  input/output token counts and per-model pricing from monitor-config.json.
invocation: explicit
allowed-tools: Bash
---

# /cost

**Usage:** `/cost`

Show a detailed cost breakdown for the current session.

```bash
node ~/.claude/context-curator/dist/scripts/estimate-cost.js --verbose
```

Output format:
```
Session Cost Estimate
─────────────────────
Model:         claude-sonnet-4-6
Input tokens:  92,000  @ $3.00/M  = $0.28
Output tokens: 18,000  @ $15.00/M = $0.27
─────────────────────
Total:         ~$0.55

Context window: 47% used (94k / 200k tokens)
Burn rate:      2.1k tok/msg (mean of last 10 messages)
```

If no state file exists:
```
No monitor data available. The PostToolUse hook may not be installed.
Run install.sh to set up hooks.
```

## Rate Configuration

Rates are read from `~/.claude/context-curator/monitor-config.json`. To update rates:
```json
{
  "models": {
    "claude-sonnet-4-6": { "input": 3.00, "output": 15.00 }
  }
}
```
