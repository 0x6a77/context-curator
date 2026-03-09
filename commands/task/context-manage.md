---
description: Interactive context management
context: fork
allowed-tools: Bash, Read, Write, Edit
---

# Context Management

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

Inspect:
  view <number>    - View detailed summary
  diff <n1> <n2>   - Compare two contexts
  secrets <number> - Scan for secrets

Bulk:
  clean            - Find stale/duplicate contexts
  archive          - Archive old contexts (>30 days)

Enter command (or 'done' to exit):
```

## Action Implementations

### rename

```
User: rename 1

Claude: Current name: my-progress
New name (lowercase, numbers, hyphens):

User: oauth-validation

Claude: ✓ Renamed 'my-progress' → 'oauth-validation'
```

### delete

```
User: delete 5

Claude: Delete 'experiment' (3 msgs)?
This cannot be undone.
Confirm? (yes/no)

User: yes

Claude: ✓ Deleted 'experiment'
```

### promote

Run secret scan first:

```bash
node ~/.claude/context-curator/dist/scripts/scan-secrets.js "$CONTEXT_PATH"
```

Then:

```bash
node ~/.claude/context-curator/dist/scripts/promote-context.js "$TASK_ID" "$CONTEXT_NAME"
```

### secrets

```bash
node ~/.claude/context-curator/dist/scripts/scan-secrets.js "$CONTEXT_PATH"
```

### clean

Analyze contexts for cleanup opportunities based on age and size.

## Exit

```
User: done

Claude: ✓ Context management complete

Summary of changes:
- Renamed 1 context
- Deleted 1 context
- Promoted 1 context to golden

Don't forget to commit golden context changes:
  git add .claude/tasks/
  git commit -m "Update contexts"
  git push
```

## Important Notes

- **Forked context** - this command runs in a forked context for full access
- **Golden changes require git** - remind user to commit
- **Preserve data** - always backup before destructive operations
- **Smart suggestions** - provide intelligent recommendations based on analysis

---

## Native Claude Code Alternatives

For lighter-weight needs, Claude Code has built-in tools:

- **`/fork [name]`** — Branch current conversation (no install needed)
- **`/rewind`** — Roll back to a previous checkpoint (`Esc+Esc` shortcut)
- **`/rename [name]`** — Name the current session for easy `/resume` later
- **`/export`** — Export conversation as plain text

Context Curator adds on top of these: named snapshots, task organization, team sharing via golden contexts, and secret scanning.
