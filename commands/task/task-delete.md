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
  echo ""
  echo "This deletes the task and ALL its contexts."
  exit 1
fi

if [ "$TASK_ID" = "default" ]; then
  echo "❌ Cannot delete the default task"
  exit 1
fi
```

## Step 2: Check Task Exists

```bash
npx tsx ~/.claude/context-curator/scripts/task-check.ts "$TASK_ID"
```

If not found, show error and list available tasks.

## Step 3: Get Task Details

Use the task-list script to get details:

```bash
npx tsx ~/.claude/context-curator/scripts/task-list.ts "$TASK_ID"
```

Show what will be deleted:

```
About to delete task: <task-id>

This will remove:

Task CLAUDE.md:
• Personal: ~/.claude/projects/.../tasks/<task-id>/CLAUDE.md
• Golden: ./.claude/tasks/<task-id>/CLAUDE.md (if exists)

Contexts (N total):
• personal-context-1 (15 msgs)
• personal-context-2 (8 msgs)
• golden-context-1 (47 msgs) ⭐

⚠️  THIS CANNOT BE UNDONE
```

## Step 4: Confirm Deletion

```
Type the task name to confirm deletion: 
```

User must type the exact task name (not just "yes") as a safety measure.

## Step 5: Delete

```bash
npx tsx ~/.claude/context-curator/scripts/delete-task.ts "$TASK_ID"
```

## Step 6: Switch to Default

If the deleted task was the current task, switch to default:

```bash
npx tsx ~/.claude/context-curator/scripts/update-import.ts default
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

## Example

```
User: /task-delete old-experiment

Claude: About to delete task: old-experiment

This will remove:

Task CLAUDE.md:
• Personal: ~/.claude/projects/.../tasks/old-experiment/CLAUDE.md

Contexts (2 total):
• attempt-1 (5 msgs)
• attempt-2 (3 msgs)

⚠️ THIS CANNOT BE UNDONE

Type "old-experiment" to confirm deletion:

User: old-experiment

Claude: ✓ Deleted task: old-experiment
✓ Removed 2 context(s)

Current task remains: oauth-refactor
```
