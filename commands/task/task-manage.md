---
description: Interactive task management
allowed-tools: Bash, Read, Write, Edit
---

# Task Management

Usage: /task-manage

## Step 1: List Tasks

First, show available tasks:

```bash
npx tsx ~/.claude/context-curator/scripts/task-list.ts
```

## Step 2: Ask What to Do

Present these options:

```
What would you like to do?

r - Rename a task
e - Edit task CLAUDE.md
s - Show task statistics
d - Delete a task
q - Quit
```

## Step 3: Handle Actions

### Rename (r)
1. Ask: "Which task?"
2. Ask: "New task ID? (lowercase, numbers, hyphens only)"
3. Validate new ID matches /^[a-z0-9-]+$/
4. Rename the task directory:
   ```bash
   mv .context-curator/tasks/<old-id> .context-curator/tasks/<new-id>
   ```
5. Update @-import line if this is the current task:
   ```bash
   npx tsx ~/.claude/context-curator/scripts/update-import.ts <new-id>
   ```
6. Confirm: "✓ Renamed: old-id → new-id"

### Edit (e)
1. Ask: "Which task?"
2. Use Read tool to load current CLAUDE.md:
   `.context-curator/tasks/<task-id>/CLAUDE.md`
3. Use Edit or Write tool to modify the file based on user's requests
4. Confirm changes made
5. Show updated line count and key changes

### Statistics (s)
1. Ask: "Which task?"
2. Gather stats:
   - Number of contexts
   - Total messages across all contexts
   - Total estimated tokens
   - Last used date
   - CLAUDE.md line count
3. Display comprehensive statistics

### Delete (d)
1. Ask: "Which task?"
2. Show what will be deleted:
   - Task CLAUDE.md (line count)
   - All contexts (list names, message counts)
3. Warn: "This will permanently delete all data!"
4. Ask: "Type 'delete <task-id>' to confirm"
5. If confirmed:
   ```bash
   rm -rf .context-curator/tasks/<task-id>
   ```
6. If this was the current task, update @-import to default:
   ```bash
   npx tsx ~/.claude/context-curator/scripts/update-import.ts default
   ```
7. Confirm: "✓ Task '<task-id>' deleted"

## Example

User: /task-manage

You:
```
# Available Tasks

1. default (current)
2. integration-tests
3. api-refactor

What would you like to do?
r - Rename a task
e - Edit task CLAUDE.md
s - Show statistics
d - Delete a task
q - Quit
```

User: e

You: "Which task? (1-3 or name)"

User: integration-tests

You:
[Use Read tool to load .context-curator/tasks/integration-tests/CLAUDE.md]
"I've loaded the CLAUDE.md for integration-tests. What would you like to change?"

[User describes changes, you use Edit or Write tool to make them]

You: "✓ Updated integration-tests CLAUDE.md (147 → 163 lines)"
