---
description: Save current session as a named context
context: fork
allowed-tools: Bash
---

# Save Context

**Usage:** `/context-save <name>` or `/context-save <name> --golden`

Saves personal by default. Add `--golden` to share with your team via git.

## Step 1: Extract Name and Flags

Scan conversation history from newest to oldest for a user message matching this invocation. Use this regex:

```
/(?:\/task:context-save|\/context-save)\s+([a-z0-9][a-z0-9-]*)(\s+--golden)?/i
```

- First capture group → NAME
- Second capture group present → GOLDEN=true, otherwise GOLDEN=false

Examples:
- `/task:context-save integration-tests` → NAME=`integration-tests`, GOLDEN=false
- `/context-save my-feature --golden` → NAME=`my-feature`, GOLDEN=true

If no name found, show:
```
Usage: /context-save <name> [--golden]

  /context-save my-progress         # personal (default)
  /context-save oauth-work --golden # shared with team
```

Validate NAME matches `^[a-z0-9-]+$`. If invalid:
```
❌ Invalid name: use lowercase letters, numbers, and hyphens only
```

## Step 2: Get Current Task

```bash
TASK_ID=$(node ~/.claude/context-curator/dist/scripts/get-current-task.js)
```

## Step 3: Scan for Secrets

Always run the secret scan regardless of save type:

```bash
node ~/.claude/context-curator/dist/scripts/scan-secrets.js
```

If secrets are found:

- **Personal save**: Show a warning listing the detected secrets, then ask:
  ```
  ⚠️  Potential secrets detected in this context.
  Save anyway? (yes/no):
  ```
  If the user answers **no**, abort the save. If **yes**, proceed to Step 4.

- **Golden save**: Show a warning listing the detected secrets, then ask:
  ```
  ⚠️  Potential secrets detected — this context will be shared via git.
  Proceed anyway? (yes/no):
  ```
  If the user answers **no**, abort the save. If **yes**, proceed to Step 4.

## Step 4: Save

```bash
node ~/.claude/context-curator/dist/scripts/save-context.js "$TASK_ID" "$NAME" --personal
# or with --golden flag:
node ~/.claude/context-curator/dist/scripts/save-context.js "$TASK_ID" "$NAME" --golden
```

Display the script output verbatim.
