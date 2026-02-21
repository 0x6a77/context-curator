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

**IMPORTANT:** This skill runs in a forked context. To find the NAME, scan the conversation history from the **most recent message backwards** until you find a user message that contains this skill's invocation. Use this exact regex to extract the name:

```
/(?:\/task:context-save|\/context-save)\s+([a-z0-9][a-z0-9-]*)/i
```

The first capture group is the NAME. Examples:
- `/task:context-save integration-tests` → NAME is `integration-tests`
- `/context-save oauth-deep-dive` → NAME is `oauth-deep-dive`
- `/task:context-save my-feature` → NAME is `my-feature`

**Scan all user messages** — the invocation may not be the last message. Do NOT stop after checking only the most recent message. Check every user message from newest to oldest.

If no matching invocation with a name is found in the entire conversation history, prompt the user:
```
Usage: /context-save <name>

Examples:
  /context-save oauth-deep-dive
  /context-save edge-cases
  /context-save pre-refactor

Please provide a context name (lowercase letters, numbers, hyphens only):
```

Once you have the NAME, validate it matches `^[a-z0-9-]+$`. If invalid:
```
❌ Invalid context name: <name>
   Use lowercase letters, numbers, and hyphens only
```

## Step 2: Determine Current Task

Get the current task from the @import line:

```bash
TASK_ID=$(node ~/.claude/context-curator/dist/scripts/get-current-task.js)
echo "Current task: $TASK_ID"
```

## Step 3: Find Current Session

Find the current session file to determine its content:

```bash
node ~/.claude/context-curator/dist/scripts/find-current-session.js
```

This will output the session path and stats.

## Step 4: Scan for Secrets

**Important:** Before saving, scan the session content for potential secrets.

Run the secret scanner:

```bash
node ~/.claude/context-curator/dist/scripts/scan-secrets.js "$SESSION_PATH"
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
node ~/.claude/context-curator/dist/scripts/save-context.js "$TASK_ID" "$NAME" --personal
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
node ~/.claude/context-curator/dist/scripts/save-context.js "$TASK_ID" "$NAME" --golden
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
