---
description: List all tasks or show task details
allowed-tools: Bash, Read
---

# Task List

Usage: /task-list [task-id]

## List All Tasks

If no task-id is provided, run:

```bash
npx tsx ~/.claude/context-curator/scripts/task-list.ts
```

This will display:
- All available tasks
- Number of contexts in each
- Last used timestamp
- Current active task (based on @-import line)

## Show Task Details

If a task-id is provided, run:

```bash
npx tsx ~/.claude/context-curator/scripts/task-list.ts <task-id>
```

This will show:
- Task overview (from CLAUDE.md)
- Number of lines in task's CLAUDE.md
- Focus and guidelines summary
- List of all saved contexts with statistics
- Usage commands for the task

You can also use the Read tool to show excerpts from the task's CLAUDE.md if the user wants more detail.

## Example

User: /task-list

You run the script and see:
```
# Available Tasks

default (current)
• 2 contexts
• Last used: 2 hours ago

integration-tests
• 3 contexts
• Last used: 1 day ago

api-refactor
• 1 context
• Last used: 3 days ago

Total: 3 tasks, 6 saved contexts
Current: @import .context-curator/tasks/default/CLAUDE.md
```

User: /task-list integration-tests

You run the script and see task details, then can optionally read the CLAUDE.md to show focus areas.
