---
description: Delete a saved context
allowed-tools: Bash, Read
---

# Context Deletion

Usage: /context-delete <context-name> [task-id]

## Step 1: Determine Task

If task-id is provided, use that task.

If not provided, determine active task from @-import line in .claude/CLAUDE.md:
```bash
# Extract task ID from @-import line
grep '@import' .claude/CLAUDE.md | sed 's/.*tasks\/\([^\/]*\)\/.*/\1/'
```

## Step 2: Validate Context Exists

Check if context file exists:
```bash
test -f .context-curator/tasks/<task-id>/contexts/<context-name>.jsonl && echo "exists" || echo "not-found"
```

If not found, inform user and show available contexts:
```bash
npx tsx ~/.claude/context-curator/scripts/context-list.ts <task-id>
```

## Step 3: Show Context Details

Use Bash to get file stats:
```bash
# Count messages (lines in JSONL)
wc -l < .context-curator/tasks/<task-id>/contexts/<context-name>.jsonl

# Get file size
ls -lh .context-curator/tasks/<task-id>/contexts/<context-name>.jsonl

# Get dates
stat -f "Created: %SB" .context-curator/tasks/<task-id>/contexts/<context-name>.jsonl
```

Display:
```
⚠️  Delete context '<context-name>' from task '<task-id>'?

  156 messages, ~34k tokens
  Created: 1 day ago
  Last modified: 2 hours ago

Type 'delete <context-name>' to confirm:
```

## Step 4: Require Confirmation

Ask user to type exact confirmation:
"Type 'delete <context-name>' to confirm:"

Wait for exact match. If user types anything else, cancel.

## Step 5: Delete Context

If confirmed:

```bash
rm .context-curator/tasks/<task-id>/contexts/<context-name>.jsonl
```

## Step 6: Confirm Deletion

Display:
```
✓ Context '<context-name>' deleted from task '<task-id>'
```

## Example

User: /context-delete edge-cases

You:
[Determine active task is "integration-tests"]
[Check file exists]
[Gather stats]
```
⚠️  Delete context 'edge-cases' from task 'integration-tests'?

  156 messages, ~34k tokens
  Created: 1 day ago
  Last modified: 2 hours ago

Type 'delete edge-cases' to confirm:
```

User: delete edge-cases

You:
[Execute deletion]
```
✓ Context 'edge-cases' deleted
```

User: /context-delete timeout-work api-refactor

You:
[Use specified task "api-refactor"]
[Proceed with deletion workflow]
