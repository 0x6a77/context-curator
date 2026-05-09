---
name: context-promote
description: >
  Promote a personal context to golden (shared with the team via git).
  Scans for secrets before promotion. Use /context-promote <name>.
invocation: explicit
allowed-tools: Bash, Read, Write
---

# /context-promote

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
node ~/.claude/context-curator/dist/scripts/redact-secrets.js "$CONTEXT_PATH" "$CONTEXT_PATH.redacted.jsonl"
```

Then offer to promote the redacted version. If the user accepts, use the redacted path going forward.

If secrets are found and user chooses to continue, confirm explicitly:
```
⚠️  This context contains potential secrets and will be visible to all team members via git.
Proceed? (yes/no):
```

## Step 5: Run Promote Script

```bash
node ~/.claude/context-curator/dist/scripts/promote-context.js "$TASK_ID" "$NAME"
```

Display the script output verbatim.

## Step 6: Confirm

After successful promotion, show:

```
✓ Promoted: <name>
  Personal → Golden

  Team members will see this context when they run /task <task-id>.
  Commit .claude/tasks/<task-id>/contexts/<name>.jsonl to share.
```
