---
description: List all contexts in a task
allowed-tools: Bash
---

# Context List

Usage: /context-list [task-id]

## Execute

Run the context-list script:

```bash
# For active task (based on current @-import)
npx tsx .context-curator/scripts/context-list.ts

# For specific task
npx tsx .context-curator/scripts/context-list.ts <task-id>
```

This displays all saved contexts in the specified task with:
- Context name
- Message count
- Estimated token count
- Created date
- Last modified date
- Instructions for loading the context

## Example

User: /context-list

You run: `npx tsx .context-curator/scripts/context-list.ts`

Output:
```
# Contexts: integration-tests

1. initial-setup
   • 45 messages, 12k tokens
   • Created: 3 days ago
   • Last modified: 3 days ago

2. edge-cases
   • 156 messages, 34k tokens
   • Created: 1 day ago
   • Last modified: 2 hours ago

3. timeout-work
   • 89 messages, 19k tokens
   • Created: 2 hours ago
   • Last modified: 2 hours ago

Total: 3 contexts

Load with: /task integration-tests <context-name>
```

User: /context-list api-refactor

You run: `npx tsx .context-curator/scripts/context-list.ts api-refactor`

And display the contexts for the api-refactor task.
