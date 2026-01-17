---
description: Delete a saved context
allowed-tools: Bash, Read, Write
---

# Context Delete

**Usage:** `/context-delete <name> [--task <task-id>]`

Delete a saved context. Requires confirmation.

## Step 1: Validate Input

```bash
NAME="$1"

if [ -z "$NAME" ]; then
  echo "Usage: /context-delete <name> [--task <task-id>]"
  echo ""
  echo "Examples:"
  echo "  /context-delete old-progress"
  echo "  /context-delete experiment --task payment-integration"
  exit 1
fi
```

## Step 2: Determine Task

If `--task` is provided, use that. Otherwise, get the current task:

```bash
TASK_ID=$(npx tsx ~/.claude/context-curator/scripts/get-current-task.ts)
```

## Step 3: Find Context

```bash
npx tsx ~/.claude/context-curator/scripts/find-context.ts "$TASK_ID" "$NAME"
```

If not found, show error and list available contexts.

## Step 4: Show Context Info

Use the Read tool to get stats about the context:
- Message count
- Token count
- Last modified date
- Location (personal or golden)

Display:

```
About to delete:

Context: <name>
Task: <task-id>
Location: <personal|golden>
Messages: N
Tokens: ~Xk
Last modified: Y ago

This cannot be undone.
```

## Step 5: Confirm Deletion

```
Delete this context? (yes/no)
```

If user confirms, proceed. Otherwise, cancel.

## Step 6: Delete

```bash
npx tsx ~/.claude/context-curator/scripts/delete-context.ts "$TASK_ID" "$NAME"
```

## Step 7: Confirm

```
✓ Deleted context: <name>
✓ Task: <task-id>
```

If it was a golden context, remind about git:

```
Note: This was a golden context. To remove from git:
  git rm .claude/tasks/<task-id>/contexts/<name>.jsonl
  git commit -m "Remove <name> context"
  git push
```

## Example

```
User: /context-delete old-experiment

Claude: About to delete:

Context: old-experiment
Task: oauth-refactor
Location: personal
Messages: 5
Tokens: ~2k
Last modified: 30 days ago

This cannot be undone.
Delete this context? (yes/no)

User: yes

Claude: ✓ Deleted context: old-experiment
```
