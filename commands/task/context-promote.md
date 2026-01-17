---
description: Promote personal context to golden (shared with team)
context: fork
allowed-tools: Bash, Read, Write
---

# Context Promote

**Usage:** `/context-promote <name> [--task <task-id>]`

Promote a personal context to golden (shared with team via git).

**You have access to read and copy context files.**

## Step 1: Validate Input

```bash
NAME="$1"

if [ -z "$NAME" ]; then
  echo "Usage: /context-promote <name> [--task <task-id>]"
  echo ""
  echo "Promotes a personal context to golden (shared)."
  exit 1
fi
```

## Step 2: Determine Task

If `--task` is provided, use that. Otherwise, get the current task:

```bash
TASK_ID=$(node ~/.claude/context-curator/dist/scripts/get-current-task.js)
```

## Step 3: Find Personal Context

Locate the personal context file:

```bash
node ~/.claude/context-curator/dist/scripts/find-context.js "$TASK_ID" "$NAME" --personal
```

If not found, show error and list available personal contexts.

## Step 4: Scan for Secrets

**Important:** Always scan before promoting to golden.

```bash
node ~/.claude/context-curator/dist/scripts/scan-secrets.js "$CONTEXT_PATH"
```

If secrets are found, display them and offer options:
1. Continue anyway (not recommended)
2. Let me help redact secrets first
3. Cancel

### If user chooses "Redact secrets":

```bash
node ~/.claude/context-curator/dist/scripts/redact-secrets.js "$CONTEXT_PATH" > /tmp/redacted-context.jsonl
```

## Step 5: Confirm Promotion

```
⚠️  GOLDEN CONTEXT

This will be saved to:
  ./.claude/tasks/<task-id>/contexts/<name>.jsonl

Team members will be able to see this context.

Confirm? (yes/no)
```

## Step 6: Promote

Copy the context (or redacted version) to golden storage:

```bash
node ~/.claude/context-curator/dist/scripts/promote-context.js "$TASK_ID" "$NAME"
```

## Step 7: Confirm Success

```
✓ Promoted to golden context ⭐
✓ Name: <name>
✓ Task: <task-id>
✓ Location: ./.claude/tasks/<task-id>/contexts/<name>.jsonl

Next steps:
  git add .claude/tasks/<task-id>/contexts/<name>.jsonl
  git commit -m "Share <name> context for <task-id>"
  git push
```

## Important Notes

- **Personal copy is preserved** - original stays in personal storage
- **Secret scanning is mandatory** - always scan before promoting
- **Git workflow required** - golden contexts need git add/commit/push
