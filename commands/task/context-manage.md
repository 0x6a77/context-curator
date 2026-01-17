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
npx tsx ~/.claude/context-curator/scripts/list-all-contexts.ts
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

### legacy-migration
**Personal:**
7. `old-approach` - 5 msgs - Failed migration attempt (60 days old)

**Golden:**
8. `migration-strategy` ⭐ - 62 msgs - Comprehensive plan (by: alice)
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

### merge

Use the Read tool to combine messages from both contexts.

```
User: merge 1 2

Claude: Merging:
  - my-progress (15 msgs)
  - edge-cases (8 msgs)

Combined name (or press Enter for 'my-progress-merged'):

User: oauth-complete

Claude: ✓ Created 'oauth-complete' (23 msgs)
✓ Original contexts preserved

Delete originals? (yes/no)

User: no

Claude: ✓ Merge complete
```

### promote

Run secret scan first.

```
User: promote 1

Claude: Promoting 'my-progress' to golden...

Scanning for secrets... ✓ None found

This will be shared with your team via git.
Confirm? (yes/no)

User: yes

Claude: ✓ Promoted to golden context
✓ Location: ./.claude/tasks/oauth-refactor/contexts/my-progress.jsonl

Next steps:
  git add .claude/tasks/oauth-refactor/contexts/my-progress.jsonl
  git commit -m "Add my-progress context"
  git push
```

### demote

```
User: demote 3

Claude: Demote 'oauth-deep-dive' from golden to personal?
It will no longer be shared with the team.
Confirm? (yes/no)

User: yes

Claude: ✓ Demoted to personal context
✓ Location: ~/.claude/projects/.../contexts/oauth-deep-dive.jsonl

Note: The golden file still exists. To fully remove:
  git rm .claude/tasks/oauth-refactor/contexts/oauth-deep-dive.jsonl
  git commit -m "Remove oauth-deep-dive from shared contexts"
```

### view

Use Read tool to read context and generate detailed summary.

```
User: view 3

Claude: # oauth-deep-dive

**Location:** Golden (shared) ⭐
**Messages:** 47
**Tokens:** ~12k
**Created:** 5 days ago
**Author:** alice

## Summary

This context captures a comprehensive walkthrough of the legacy OAuth
implementation. Key topics covered:

1. **Token Format:** The custom v2.{sessionId}.{hmac} format used for
   session tokens, and why it was chosen over JWTs.

2. **Session Storage:** Three-tier storage architecture:
   - Redis for fast lookup (5 minute TTL)
   - PostgreSQL for persistence
   - Cookies for fallback

3. **Rate Limiting:** Discovery of the bypass issue in middleware and
   the fix implemented.

4. **Mobile Auth:** Special handling for mobile app authentication
   including refresh token rotation.

## Key Files Discussed
- src/auth/oauth.ts
- src/middleware/session.ts
- src/services/token.ts
```

### diff

```
User: diff 1 2

Claude: # Comparing: my-progress vs edge-cases

**my-progress (15 msgs):**
- Covers basic OAuth flow understanding
- Token validation implementation
- Session management overview

**edge-cases (8 msgs):**
- Concurrent request handling
- Redis cache failures
- Timeout edge cases

**Overlap:**
- Both discuss session token format
- Both reference src/auth/oauth.ts

**Recommendation:**
These contexts are complementary. Consider merging for a complete picture.
```

### secrets

```
User: secrets 4

Claude: Scanning 'stripe-work' for secrets...

⚠️ Found potential secrets:

Line 234: Stripe API Key
  sk_test_4eC39HqLyjWDarj...

Line 456: Generic Secret
  api_key: "abc123def456..."

These would be visible if promoted to golden.
Consider redacting before sharing.
```

### clean

```
User: clean

Claude: Analyzing contexts for cleanup opportunities...

**Stale contexts (>30 days, not golden):**
- `old-approach` (legacy-migration) - 5 msgs, 60 days old
  Likely superseded by migration-strategy
  → Recommend: Archive

**Very small contexts (<5 msgs):**
- `experiment` (payment-integration) - 3 msgs
  May be incomplete or test data
  → Recommend: Delete or merge with stripe-work

Apply recommendations? (yes/no/review)
```

### archive

```
User: archive

Claude: Archiving contexts older than 30 days...

Found 1 context to archive:
- `old-approach` (legacy-migration) - 60 days old

Archive to ~/.claude/projects/.../archive/? (yes/no)

User: yes

Claude: ✓ Archived 'old-approach'
  From: contexts/old-approach.jsonl
  To: archive/old-approach-2025-01-17.jsonl
```

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
