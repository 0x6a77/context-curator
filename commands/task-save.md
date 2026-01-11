---
description: Save current session as a named context
allowed-tools: Bash
---

# Task Save

Usage: /task-save <context-name>

## Validation

First, validate the context name format:
- Must match /^[a-z0-9-]+$/
- Examples: edge-cases, initial-setup, bug-fix-v2, refactor-round-2

If invalid, explain:
"Context name must contain only lowercase letters, numbers, and hyphens.
Examples: edge-cases, initial-setup, bug-fix-v2"

## Execute

Run the task-save script:
```bash
npx tsx .context-curator/scripts/task-save.ts <context-name>
```

This script will:
1. Validate context name format
2. Determine active task from @-import line in .claude/CLAUDE.md
3. Get current session ID from Claude Code history
4. Copy session file to task's contexts directory
5. Handle overwrite with automatic backup if context exists
6. Display confirmation with statistics

The script handles all the complexity - you just need to run it and display the output.

## Example

User: /task-save edge-cases

You:
1. Validate "edge-cases" matches /^[a-z0-9-]+$/ ✓
2. Run: `npx tsx .context-curator/scripts/task-save.ts edge-cases`
3. Display the script's output:
   ```
   ✓ Saved as 'edge-cases' (156 msgs, 34k tokens)
     Task: integration-tests
     Location: .context-curator/tasks/integration-tests/contexts/edge-cases.jsonl
   ```

If user tries invalid name like "My Test":
You: "Context name must contain only lowercase letters, numbers, and hyphens.
     Examples: my-test, edge-cases, initial-setup"
