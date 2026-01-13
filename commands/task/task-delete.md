---
description: Delete a task and all its contexts
allowed-tools: Bash, Read
---

# Task Deletion

Usage: /task-delete <task-id>

## Step 1: Validate Task

Check if task exists:
```bash
test -d .context-curator/tasks/$1 && echo "exists" || echo "not-found"
```

If not found, inform user and show available tasks with `/task-list`.

## Step 2: Show What Will Be Deleted

Use Read tool and Bash to gather information:

1. Read task CLAUDE.md to show line count:
   `.context-curator/tasks/<task-id>/CLAUDE.md`

2. List all contexts in the task:
   ```bash
   ls .context-curator/tasks/$1/contexts/*.jsonl 2>/dev/null | wc -l
   ```

Display:
```
⚠️  Delete task '<task-id>'?

This will permanently delete:
• Task CLAUDE.md (147 lines)
• 3 saved contexts:
  - initial-setup (45 msgs)
  - edge-cases (156 msgs)
  - timeout-work (89 msgs)

This action cannot be undone!
```

## Step 3: Require Confirmation

Ask user to type exact confirmation:
"Type 'delete <task-id>' to confirm:"

Wait for exact match. If user types anything else, cancel.

## Step 4: Delete Task

If confirmed:

```bash
rm -rf .context-curator/tasks/$1
```

## Step 5: Handle Current Task

Check if this was the current active task by reading .claude/CLAUDE.md:

If the @-import line points to this task, switch to default:
```bash
npx tsx ~/.claude/context-curator/scripts/update-import.ts default
```

Inform user: "✓ Switched to 'default' task"

## Step 6: Confirm Deletion

Display:
```
✓ Task '<task-id>' deleted
  - Task CLAUDE.md removed
  - All 3 contexts removed
✓ Active task: default
```

## Example

User: /task-delete integration-tests

You:
```
⚠️  Delete task 'integration-tests'?

This will permanently delete:
• Task CLAUDE.md (147 lines)
• 3 saved contexts:
  - initial-setup (45 msgs)
  - edge-cases (156 msgs)
  - timeout-work (89 msgs)

Type 'delete integration-tests' to confirm:
```

User: delete integration-tests

You:
[Execute deletion]
```
✓ Task 'integration-tests' deleted
✓ Switched to 'default' task
```
