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
  exit 1
fi
```

## Step 2: Determine Task

If `--task` is provided, use that. Otherwise, get the current task:

```bash
TASK_ID=$(node ~/.claude/context-curator/dist/scripts/get-current-task.js)
```

## Step 3: Find Context

```bash
node ~/.claude/context-curator/dist/scripts/find-context.js "$TASK_ID" "$NAME"
```

If not found, show error and list available contexts.

## Step 4: Show Context Info and Confirm

Display context stats and ask for confirmation:

```
About to delete:

Context: <name>
Task: <task-id>
Location: <personal|golden>
Messages: N
Tokens: ~Xk

This cannot be undone.
Delete this context? (yes/no)
```

## Step 5: Delete

```bash
node ~/.claude/context-curator/dist/scripts/delete-context.js "$TASK_ID" "$NAME"
```

## Step 6: Confirm

```
✓ Deleted context: <name>
```

If it was a golden context, remind about git:

```
Note: This was a golden context. To remove from git:
  git rm .claude/tasks/<task-id>/contexts/<name>.jsonl
  git commit -m "Remove <name> context"
  git push
```
