---
description: Activate a task environment with optional context
allowed-tools: Bash, Read, Write
pre-tool-use: |
  # Update task import in CLAUDE.md
  npx tsx ~/.claude/context-curator/scripts/update-import.ts $1
---

# Task Activation

Usage: /task <task-id> [context-name]

## PreToolUse (Automatic)

The pre-tool-use hook has already updated .claude/CLAUDE.md:
- Changed @-import line to point to this task's CLAUDE.md

## Step 1: Check for unsaved work

Check if current session has messages by examining history.

If there are unsaved messages, ask user:
"Current session: N messages (unsaved). Save? (yes/no)"

If yes:
- Ask for context name (validate: lowercase, numbers, hyphens only)
- Run: `npx tsx ~/.claude/context-curator/scripts/task-save.ts <context-name>`

## Step 2: Clear session

Execute `/clear` to reset the conversation.

## Step 3: Prepare context session

Run:
```bash
SESSION_ID=$(npx tsx ~/.claude/context-curator/scripts/prepare-context.ts $1 $2)
```

This:
- Creates new session file with context messages (if context-name provided)
- Records session→task mapping
- Returns session ID (capture the last line of output)

## Step 4: Display task focus and tell user to resume

Read the task's CLAUDE.md to show key points using the Read tool:
- File path: `.context-curator/tasks/$1/CLAUDE.md`
- Show first 20-30 lines to give context

Display:
```
✓ Task context: $1
✓ Session ready: $SESSION_ID

Type: /resume $SESSION_ID

Your focus for this task:
• [Extract key points from task CLAUDE.md]
```

## Example

User: /task integration-tests edge-cases

You:
1. [PreToolUse updates @-import automatically]
2. Check current session message count
3. If messages exist, ask: "Save? (yes/no)"
4. If user says yes, ask: "Context name?"
5. Run task-save script if saving
6. Execute /clear
7. Run prepare-context script with "integration-tests" and "edge-cases"
8. Use Read tool to view the task's CLAUDE.md
9. Display task focus and tell user to /resume <session-id>
