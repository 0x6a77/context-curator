---
description: Save current session as a named context
context: fork
allowed-tools: Bash, Read, Write
---

# Save Context

**Usage:** `/context-save <name>`

Save the current session as a named context snapshot. This preserves your hard-won Claude understanding for later.

**You have full access to the current conversation for analysis.**

## Step 1: Validate Context Name

The name must be provided and use only lowercase letters, numbers, and hyphens.

```bash
NAME="$1"

if [ -z "$NAME" ]; then
  echo "Usage: /context-save <name>"
  echo ""
  echo "Examples:"
  echo "  /context-save oauth-deep-dive"
  echo "  /context-save edge-cases"
  echo "  /context-save pre-refactor"
  exit 1
fi

if ! echo "$NAME" | grep -qE '^[a-z0-9-]+$'; then
  echo "❌ Invalid context name"
  echo "   Use lowercase letters, numbers, and hyphens only"
  exit 1
fi
```

## Step 2: Determine Current Task

Get the current task from the @import line:

```bash
TASK_ID=$(npx tsx ~/.claude/context-curator/scripts/get-current-task.ts)
echo "Current task: $TASK_ID"
```

## Step 3: Find Current Session

Find the current session file to determine its content:

```bash
npx tsx ~/.claude/context-curator/scripts/find-current-session.ts
```

This will output the session path and stats.

## Step 4: Scan for Secrets

**Important:** Before saving, scan the session content for potential secrets.

Run the secret scanner:

```bash
npx tsx ~/.claude/context-curator/scripts/scan-secrets.ts "$SESSION_PATH"
```

If secrets are found, display them to the user:

```
⚠️  Potential secrets detected:

Line 89: Stripe API Key (sk_test_4eC39...)
Line 124: Database Password (password=...)

Options:
1. Continue anyway (not recommended for golden contexts)
2. Cancel and review the session

What would you like to do?
```

If the user wants to continue, note this. If they want to cancel, exit.

## Step 5: Ask Storage Location

Ask the user where to save:

```
Save this context as:

1. Personal (only you can access)
2. Golden (shared with team via git) ⭐

Choice (1/2):
```

**Default to Personal** if user just presses Enter or says "1".

## Step 6a: Save as Personal

Save to personal storage:

```bash
npx tsx ~/.claude/context-curator/scripts/save-context.ts "$TASK_ID" "$NAME" --personal
```

Display:

```
✓ Saved as personal context
✓ Name: <name>
✓ Task: <task-id>
✓ Messages: N, ~Xk tokens
✓ Location: ~/.claude/projects/.../contexts/<name>.jsonl
```

## Step 6b: Save as Golden

If secrets were detected and user chose golden, give a final warning:

```
⚠️  GOLDEN CONTEXT WARNING

This context will be shared with your team via git.
Team members will see:
- Your conversation history
- Code snippets discussed
- Any data mentioned

The potential secrets detected will also be visible.

Proceed anyway? (yes/no):
```

If confirmed, save to golden storage:

```bash
npx tsx ~/.claude/context-curator/scripts/save-context.ts "$TASK_ID" "$NAME" --golden
```

Display:

```
✓ Saved as golden context ⭐
✓ Name: <name>
✓ Task: <task-id>
✓ Messages: N, ~Xk tokens
✓ Location: ./.claude/tasks/<task-id>/contexts/<name>.jsonl

Next steps:
  git add .claude/tasks/<task-id>/contexts/<name>.jsonl
  git commit -m "Add <name> context for <task-id>"
  git push
```

## Important Notes

- **Personal is the default** - protects against accidental secret leaks
- **Forked context** - this command runs in a forked context with full session access
- **Secret scanning** - always scan before allowing golden saves
- **Git workflow** - golden contexts require manual git add/commit/push

## Example Interactions

### Saving as personal (default):

```
User: /context-save my-progress

Claude: Scanning for secrets... ✓ None found

Current task: oauth-refactor
Session: 47 messages, ~12k tokens

Save this context as:
1. Personal (only you can access)
2. Golden (shared with team via git) ⭐

User: 1

Claude: ✓ Saved as personal context
✓ Name: my-progress
✓ Task: oauth-refactor
✓ Messages: 47, ~12k tokens
```

### Saving as golden with secrets warning:

```
User: /context-save stripe-integration

Claude: ⚠️ Potential secrets detected:
Line 234: Stripe API Key (sk_test_4eC39...)

Save this context as:
1. Personal (only you can access)
2. Golden (shared with team via git) ⭐

User: 2

Claude: ⚠️ GOLDEN CONTEXT WARNING

This context contains potential secrets that will be visible to your team.
Proceed anyway? (yes/no)

User: no

Claude: ✓ Cancelled. Consider removing secrets and trying again.
```
