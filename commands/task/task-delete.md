---
description: Delete a task and all its contexts
allowed-tools: Bash, Read, Write
---

# Task Delete

**Usage:** `/task-delete <task-id>`

Delete a task and all its contexts. Requires confirmation.

**Warning:** This deletes both personal AND golden contexts for the task.

## Step 1: Validate Input

```bash
TASK_ID="$1"

if [ -z "$TASK_ID" ]; then
  echo "Usage: /task-delete <task-id>"
  exit 1
fi

if [ "$TASK_ID" = "default" ]; then
  echo "❌ Cannot delete the default task"
  exit 1
fi
```

## Step 2: Check Task Exists

```bash
node ~/.claude/context-curator/dist/scripts/task-check.js "$TASK_ID"
```

## Step 3: Get Task Details

```bash
node ~/.claude/context-curator/dist/scripts/task-list.js "$TASK_ID"
```

Show what will be deleted.

## Step 4: Confirm Deletion

```
Type the task name to confirm deletion: 
```

User must type the exact task name (not just "yes") as a safety measure.

## Step 5: Delete

```bash
node ~/.claude/context-curator/dist/scripts/delete-task.js "$TASK_ID"
```

## Step 6: Switch to Default if Needed

If the deleted task was the current task:

```bash
node ~/.claude/context-curator/dist/scripts/update-import.js default
```

## Step 7: Confirm

```
✓ Deleted task: <task-id>
✓ Removed N context(s)

Current task is now: default
```

If there were golden files, remind about git:

```
Note: Golden files were deleted. To remove from git:
  git rm -r .claude/tasks/<task-id>/
  git commit -m "Remove <task-id> task"
  git push
```
