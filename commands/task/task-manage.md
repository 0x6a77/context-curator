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
npx tsx ~/.claude/context-curator/scripts/task-list.ts
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

Open the task's CLAUDE.md in the conversation for editing.

Use the Read tool to show current content, then ask what changes the user wants:

```
Current CLAUDE.md:

[Show full content]

What would you like to change?
- Type new content to replace a section
- Or describe what you want to update
```

Use the Write or Edit tool to apply changes.

### rename

```
Current name: oauth-refactor
New name (lowercase, numbers, hyphens):
```

Validate new name, then:

```bash
npx tsx ~/.claude/context-curator/scripts/rename-task.ts old-name new-name
```

Update @import if this was the current task.

### promote

Make a personal task into a golden task (copy to project directory):

```
Promote 'payment-integration' to golden?

This will:
- Copy task to ./.claude/tasks/payment-integration/
- Make it visible to team members via git
- Keep personal copy as backup

Confirm? (yes/no)
```

If confirmed:

```bash
npx tsx ~/.claude/context-curator/scripts/promote-task.ts payment-integration
```

Remind about git:

```
✓ Promoted to golden task ⭐

Next steps:
  git add .claude/tasks/payment-integration/
  git commit -m "Add payment-integration task"
  git push
```

### demote

Make a golden task personal (remove from project directory):

```
Demote 'oauth-refactor' from golden to personal?

This will:
- Remove task from ./.claude/tasks/
- Keep copy in personal storage
- Team members will no longer see it

Confirm? (yes/no)
```

Note: Golden contexts within the task stay in the project until git rm.

### delete

Delegate to `/task-delete`:

```
This will delete the task and ALL its contexts.
See /task-delete for details.

Proceed? (yes/no)
```

### done

```
✓ Task management complete
```

## Example

```
User: /task-manage oauth-refactor

Claude: # Managing: oauth-refactor

Location: Golden (in project) ⭐
Contexts: 3
Last modified: 2 hours ago

Available actions:
1. edit, 2. rename, 3. promote, 4. demote, 5. delete, 6. done

User: edit

Claude: Current CLAUDE.md:

# Task: oauth-refactor

## Focus
Refactoring the legacy OAuth implementation in src/auth/

## Key Areas
- Token validation flow
- Session management
- Auth state storage (3 locations)

What would you like to change?

User: Add a note about the rate limiting issue we found

Claude: ✓ Updated CLAUDE.md

Added to ## Common Pitfalls:
- Rate limiting bypass in middleware - see PR #234 for fix

Anything else? (or 'done')

User: done

Claude: ✓ Task management complete
```
