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
  echo ""
  echo "Examples:"
  echo "  /context-promote my-progress"
  echo "  /context-promote edge-cases --task oauth-refactor"
  exit 1
fi
```

## Step 2: Determine Task

If `--task` is provided, use that. Otherwise, get the current task:

```bash
TASK_ID=$(npx tsx ~/.claude/context-curator/scripts/get-current-task.ts)
```

## Step 3: Find Personal Context

Locate the personal context file:

```bash
npx tsx ~/.claude/context-curator/scripts/find-context.ts "$TASK_ID" "$NAME" --personal
```

If not found, show error and list available personal contexts.

## Step 4: Scan for Secrets

**Important:** Always scan before promoting to golden.

```bash
npx tsx ~/.claude/context-curator/scripts/scan-secrets.ts "$CONTEXT_PATH"
```

If secrets are found, display them:

```
⚠️  Potential secrets detected:

Line 89: Stripe API Key
  sk_test_4eC39HqLyjWDarj...

Line 124: Database Password
  password: "secret123"

Options:
1. Continue anyway (not recommended)
2. Let me help redact secrets first
3. Cancel

What would you like to do?
```

### If user chooses "Redact secrets":

Use the Read tool to read the context file.
Use the redaction utility to create a sanitized version:

```bash
npx tsx ~/.claude/context-curator/scripts/redact-secrets.ts "$CONTEXT_PATH" > /tmp/redacted-context.jsonl
```

Show what was redacted:

```
Redacted 2 secrets:
- Line 89: sk_test_4eC39... → sk_test_[REDACTED]
- Line 124: password: "secret123" → password: "[REDACTED]"

Save this cleaned version as golden? (yes/no)
```

## Step 5: Confirm Promotion

```
⚠️  GOLDEN CONTEXT

This will be saved to:
  ./.claude/tasks/<task-id>/contexts/<name>.jsonl

Team members will be able to:
- See your conversation history
- Use this context to warm up Claude
- View any code snippets discussed

Confirm? (yes/no)
```

## Step 6: Promote

Copy the context (or redacted version) to golden storage:

```bash
npx tsx ~/.claude/context-curator/scripts/promote-context.ts "$TASK_ID" "$NAME"
```

## Step 7: Confirm Success

```
✓ Promoted to golden context ⭐
✓ Name: <name>
✓ Task: <task-id>
✓ Location: ./.claude/tasks/<task-id>/contexts/<name>.jsonl

Personal copy remains at:
  ~/.claude/projects/.../contexts/<name>.jsonl

Next steps:
  git add .claude/tasks/<task-id>/contexts/<name>.jsonl
  git commit -m "Share <name> context for <task-id>"
  git push
```

## Important Notes

- **Personal copy is preserved** - original stays in personal storage
- **Secret scanning is mandatory** - always scan before promoting
- **Git workflow required** - golden contexts need git add/commit/push
- **Forked context** - this command runs in a forked context

## Example Interactions

### Promoting a clean context:

```
User: /context-promote edge-cases

Claude: Promoting 'edge-cases' to golden...

Scanning for secrets... ✓ None found

⚠️ GOLDEN CONTEXT

This will be shared with your team via git.
Location: ./.claude/tasks/oauth-refactor/contexts/edge-cases.jsonl

Confirm? (yes/no)

User: yes

Claude: ✓ Promoted to golden context ⭐
✓ Name: edge-cases
✓ Task: oauth-refactor

Next steps:
  git add .claude/tasks/oauth-refactor/contexts/edge-cases.jsonl
  git commit -m "Share edge-cases context"
  git push
```

### Promoting with secrets (redact):

```
User: /context-promote stripe-work

Claude: Promoting 'stripe-work' to golden...

⚠️ Potential secrets detected:

Line 234: Stripe API Key
  sk_test_4eC39HqLyjWDarj...

Options:
1. Continue anyway (not recommended)
2. Let me help redact secrets first
3. Cancel

User: 2

Claude: Creating redacted version...

Redacted 1 secret:
- Line 234: sk_test_4eC39... → sk_test_[REDACTED]

Save this cleaned version as golden? (yes/no)

User: yes

Claude: ✓ Promoted to golden context ⭐ (redacted)
✓ Name: stripe-work
✓ Task: payment-integration

Next steps:
  git add .claude/tasks/payment-integration/contexts/stripe-work.jsonl
  git commit -m "Share stripe-work context (secrets redacted)"
  git push
```

### Cancelling due to secrets:

```
User: /context-promote api-keys-test

Claude: Promoting 'api-keys-test' to golden...

⚠️ Potential secrets detected:

Line 12: AWS Access Key
  AKIAIOSFODNN7EXAMPLE

Line 45: Generic Secret
  secret_key: "very-secret-value"

Options:
1. Continue anyway (not recommended)
2. Let me help redact secrets first
3. Cancel

User: 3

Claude: ✓ Cancelled

The context remains personal at:
  ~/.claude/projects/.../contexts/api-keys-test.jsonl

Consider removing secrets manually before promoting.
```
