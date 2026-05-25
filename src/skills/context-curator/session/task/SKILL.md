---
name: task
description: >
  Switch to a task environment. Creates a new task if it doesn't exist (requires inline
  description), or lists saved contexts for an existing task.
  Usage: /task <task-id> [<description>]
allowed-tools: Bash, Read, Write
---

# /task

**Usage:**
- Switch to existing task: `/task <task-id>`
- Create new task: `/task <task-id> <description>`

## Step 1: Parse Input

Extract the task ID (first word) and description (everything after the task ID) from the full command text.

If no task ID is provided:
```
❌ Usage: /task <task-id> [<description>]

Examples:
  /task oauth-refactor
  /task vscode-integration Integrate Hubris RTOS into VS Code with thread/breakpoint support
```
Stop here.

If the task ID contains anything other than lowercase letters, numbers, and hyphens:
```
❌ Invalid task ID — use lowercase letters, numbers, and hyphens only
```
Stop here.

## Step 2: Initialize Project

Run init (idempotent — safe to run every time):

```bash
node ~/.claude/context-curator/dist/scripts/init-project.js 2>/dev/null || true
```

Then ensure `.claude/CLAUDE.md` exists. If it doesn't, create it with a default import:

```bash
if [ ! -f ".claude/CLAUDE.md" ]; then
  DEFAULT_IMPORT="$(pwd)/.claude/tasks/default/CLAUDE.md"
  printf '@import %s\n' "$DEFAULT_IMPORT" > .claude/CLAUDE.md
fi
```

## Step 3: Check if Task Exists

```bash
node ~/.claude/context-curator/dist/scripts/task-check.js "$TASK_ID"
```

Outputs: `exists:golden`, `exists:personal`, or `not-found`.

## Step 4a: Task Not Found — Create It

If no description was provided in Step 1:
```
❌ Task '<task-id>' doesn't exist. Provide a description to create it:

  /task <task-id> <description>

Example:
  /task vscode-integration Integrate Hubris RTOS into VS Code with thread/breakpoint support
```
Stop here.

If a description was provided, create the task:

```bash
node ~/.claude/context-curator/dist/scripts/task-create.js "$TASK_ID" "$DESCRIPTION"
```

Then skip to Step 6 (task-create already sets the @import).

## Step 4b: Task Exists — List Contexts

```bash
node ~/.claude/context-curator/dist/scripts/context-list.js "$TASK_ID" --json
```

Parse the JSON. It has two fields:
- `sessions` — raw Claude Code session files. **Never show these to the user.**
- `contexts` — named saved contexts. These are what the user selects from.

Each context has: `name`, `location` ("personal" or "golden"), `messages`, `tokens`, `lastModified`.

**If `contexts` is empty:**
```
No saved contexts for '<task-id>' yet. Starting fresh.
```
Skip the selection prompt.

**If `contexts` is not empty**, present them numbered — personal first, then golden:
```
Which context to load?

Personal:
1. my-progress        15 msgs · 2 days ago

Golden (team shared):
2. oauth-deep-dive    47 msgs · 5 days ago ⭐

Enter number, or press Enter for fresh start:
```
Wait for response. Record the selected context `name`, or proceed fresh if Enter is pressed.

## Step 5: Update @import (existing task only)

```bash
node ~/.claude/context-curator/dist/scripts/update-import.js "$TASK_ID"
```

## Step 6: Prepare Session

If a context was selected:
```bash
SESSION_ID=$(node ~/.claude/context-curator/dist/scripts/prepare-context.js "$TASK_ID" "$CONTEXT_NAME")
```

If fresh start:
```bash
SESSION_ID=$(node ~/.claude/context-curator/dist/scripts/prepare-context.js "$TASK_ID")
```

## Step 7: Display Result

Use the **Read tool** to read the task CLAUDE.md and extract the Focus section.

```
✓ Task: <task-id>
✓ Context: <context-name> (N msgs)  [or "fresh start"]

Run: /resume <session-id>

Your focus:
  [Focus section from task CLAUDE.md]
```

## Notes

- Tasks are created golden (project-shared) by default
- Use `/context-promote` to share a personal context with the team
- The `@import` in `.claude/CLAUDE.md` is what Claude Code reads for task instructions
- You must run `/resume <session-id>` to activate the new context

## Examples

### Create new task (single turn):
```
User: /task vscode-integration Integrate Hubris RTOS into VS Code with thread/breakpoint support

Claude: ✓ Task: vscode-integration
        ✓ Context: fresh start

        Run: /resume 8e14f625-bd1a-4e79-a382-2d6c0649df97

        Your focus:
          Integrate Hubris RTOS into VS Code with thread/breakpoint support
```

### Missing description (error immediately):
```
User: /task vscode-integration

Claude: ❌ Task 'vscode-integration' doesn't exist. Provide a description to create it:

          /task vscode-integration <description>
```

### Switch to existing task:
```
User: /task oauth-refactor

Claude: Which context to load?

        Personal:
        1. my-progress  15 msgs · 2 days ago

        Enter number, or press Enter for fresh start:

User: 1

Claude: ✓ Task: oauth-refactor
        ✓ Context: my-progress (15 msgs)

        Run: /resume a3f2c891-57bd-4e12-b8a6-1d9c0e5f7320
```
