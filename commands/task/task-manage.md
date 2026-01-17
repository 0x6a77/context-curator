---
description: Interactive task management
allowed-tools: Bash, Read, Write, Edit
---

# Task Management

**Usage:** `/task-manage [task-id]`

Interactive task management. Edit CLAUDE.md, rename, promote to golden, or delete tasks.

## Step 1: Select Task

If task-id is provided, use that. Otherwise, list tasks and ask:

```bash
node ~/.claude/context-curator/dist/scripts/task-list.js
```

```
Which task would you like to manage?

1. oauth-refactor (current) ⭐
2. payment-integration
3. default

Enter number or task name:
```

## Step 2: Show Task Details

```
# Managing: oauth-refactor

Location: Golden (in project) ⭐
Contexts: 3 (1 personal, 2 golden)
Last modified: 2 hours ago

CLAUDE.md preview:
  # Task: oauth-refactor
  
  ## Focus
  Refactoring the legacy OAuth implementation...
```

## Step 3: Present Options

```
Available actions:

1. edit     - Edit task CLAUDE.md
2. rename   - Rename task
3. promote  - Make task golden (share with team)
4. demote   - Make task personal (unshare)
5. delete   - Delete task and all contexts
6. done     - Exit management

What would you like to do?
```

## Actions

### edit

Use Read tool to show current content, ask what changes the user wants, then use Write/Edit tool to apply.

### rename

```bash
node ~/.claude/context-curator/dist/scripts/rename-task.js old-name new-name
```

### promote

```bash
node ~/.claude/context-curator/dist/scripts/promote-task.js task-id
```

### delete

Delegate to `/task-delete`.

### done

```
✓ Task management complete
```

## Important Notes

- Golden task changes require git add/commit/push
- Renaming updates both personal and golden locations
- Cannot delete or rename the default task
