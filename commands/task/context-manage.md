---
description: Interactive context management
allowed-tools: Bash, Read, Write
---

# Context Management

Usage: /context-manage [task-id]

## Your Role

You are helping the user interactively manage contexts within a task.

## Step 1: List Contexts

First, show available contexts:

```bash
# For active task
npx tsx ~/.claude/context-curator/scripts/context-list.ts

# For specific task
npx tsx ~/.claude/context-curator/scripts/context-list.ts <task-id>
```

## Step 2: Ask What to Do

Present these options to the user:

```
What would you like to do?

r - Rename a context
v - View context details
c - Compare two contexts
d - Delete a context
q - Quit
```

## Step 3: Handle Actions

### Rename (r)
1. Ask: "Which context number?" or "Which context name?"
2. Ask: "New name? (lowercase, numbers, hyphens only)"
3. Validate new name matches /^[a-z0-9-]+$/
4. Use Bash to rename the file:
   ```bash
   mv .context-curator/tasks/<task-id>/contexts/<old-name>.jsonl \
      .context-curator/tasks/<task-id>/contexts/<new-name>.jsonl
   ```
5. Confirm: "✓ Renamed: old-name → new-name"

### View (v)
1. Ask: "Which context?"
2. Use Read tool to load the context file:
   `.context-curator/tasks/<task-id>/contexts/<context-name>.jsonl`
3. Show statistics (message count, token estimate)
4. Show first and last few messages as preview
5. Summarize what the context contains

### Compare (c)
1. Ask: "First context?"
2. Ask: "Second context?"
3. Use Read tool to load both context files
4. Compare:
   - Message counts
   - Token estimates
   - Date ranges
   - Key differences in content/focus
5. Summarize which context is more suitable for different use cases

### Delete (d)
1. Ask: "Which context?"
2. Show context details (messages, tokens, dates)
3. Ask: "Are you sure? Type 'delete <context-name>' to confirm"
4. If confirmed, use Bash to remove:
   ```bash
   rm .context-curator/tasks/<task-id>/contexts/<context-name>.jsonl
   ```
5. Confirm: "✓ Context '<context-name>' deleted"

## Example Interaction

User: /context-manage

You:
```
# Contexts: integration-tests

1. initial-setup (45 msgs)
2. edge-cases (156 msgs)
3. timeout-work (89 msgs)

What would you like to do?
r - Rename a context
v - View context details
c - Compare two contexts
d - Delete a context
q - Quit
```

User: v

You: "Which context? (1-3 or name)"

User: 2

You:
[Use Read tool to load edge-cases.jsonl]
[Analyze and display]:
```
Context: edge-cases
• 156 messages, ~34k tokens
• Created: 1 day ago
• Last modified: 2 hours ago

Preview:
[1] User: "Let's test edge cases for the auth system"
[2] Assistant: "I'll help test edge cases..."
...
[155] User: "Great, all edge cases covered!"
[156] Assistant: "Excellent work on comprehensive testing!"

Summary: This context covers comprehensive edge case testing for the authentication system, including timeout handling, malformed input validation, and error recovery patterns.
```
