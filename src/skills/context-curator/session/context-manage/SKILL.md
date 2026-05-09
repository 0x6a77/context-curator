---
name: context-manage
description: >
  Interactive context management. Rename, delete, merge, promote, or demote
  saved contexts across all tasks. Use /context-manage to browse and organize.
invocation: explicit
allowed-tools: Bash, Read, Write, Edit
---

# /context-manage

**Usage:** `/context-manage`

Interactive context management with intelligent suggestions.

**You have full access to read, analyze, and modify context files.**

## Phase 1: Discovery

Scan all contexts across all tasks:

```bash
node ~/.claude/context-curator/dist/scripts/list-all-contexts.js
```

Present an organized view:

```
I found **8 contexts** across **3 tasks**:

### oauth-refactor (current task)
**Personal:**
1. `my-progress` - 15 msgs - OAuth token validation work
2. `edge-cases` - 8 msgs - Session timeout edge cases

**Golden:**
3. `oauth-deep-dive` ⭐ - 47 msgs - Complete OAuth analysis (by: alice)

### payment-integration
**Personal:**
4. `stripe-work` - 12 msgs - Webhook handling
5. `experiment` - 3 msgs - Testing refund flow

**Golden:**
6. `stripe-flow` ⭐ - 32 msgs - Production integration (by: bob)
```

## Phase 2: Interactive Loop

Present available actions:

```
Available actions:

Organize:
  rename <number>  - Rename a context
  delete <number>  - Delete a context
  merge <n1> <n2>  - Merge two contexts

Share:
  promote <number> - Personal → Golden (share with team)
  demote <number>  - Golden → Personal

Enter action (or 'done' to exit):
```

Parse the user's input and execute the corresponding script:

- **rename N new-name**: `node ~/.claude/context-curator/dist/scripts/rename-context.js <task> <old-name> <new-name>`
- **delete N**: `node ~/.claude/context-curator/dist/scripts/delete-context.js <task> <name>`
- **promote N**: `node ~/.claude/context-curator/dist/scripts/promote-context.js <task> <name>`
- **done**: Exit the management loop

After each action, refresh the context list and repeat Phase 2.

## Important Notes

- Always confirm before delete: "Delete `<name>` from `<task>`? This cannot be undone. (yes/no)"
- Promotion requires secret scan — run `scan-secrets.js` before promoting
- After rename or delete, update the display numbers
