---
description: List all tasks or show task details
allowed-tools: Bash, Read
---

# Task List

**Usage:** `/task-list [task-id]`

List all tasks in the current project, or show details for a specific task.

## Without task-id: List All Tasks

```bash
node ~/.claude/context-curator/dist/scripts/task-list.js
```

Display format:

```
# Available Tasks

oauth-refactor (current) ⭐
• Golden task (in project)
• Contexts: 3 (1 personal, 2 golden)
• Last used: 2 hours ago

payment-integration
• Personal task
• Contexts: 2
• Last used: 1 day ago

default
• Personal task
• Contexts: 0
• Last used: 1 week ago

---

Total: 3 tasks

Current task: oauth-refactor
Switch: /task <task-id>
```

## With task-id: Show Task Details

```bash
node ~/.claude/context-curator/dist/scripts/task-list.js <task-id>
```

Display format:

```
# Task: oauth-refactor

## Location
Golden (in project, shared) ⭐

## CLAUDE.md Preview
[First 15 lines of task CLAUDE.md]

## Contexts

### Personal
1. my-progress (15 msgs) - 2 days ago
2. edge-cases (8 msgs) - 5 days ago

### Golden (shared)
3. oauth-deep-dive (47 msgs) - 1 week ago ⭐

---

Switch to this task: /task oauth-refactor
Load with context: /task oauth-refactor oauth-deep-dive
```
