---
description: List contexts with summaries
context: fork
allowed-tools: Bash, Read
---

# Context List

**Usage:** `/context-list [task-id]`

List all contexts for a task, with AI-generated summaries. Shows both personal and golden (shared) contexts.

**You have access to read context files and generate intelligent summaries.**

## Step 1: Determine Task

If `task-id` is provided, use it. Otherwise, get the current task:

```bash
if [ -z "$1" ]; then
  TASK_ID=$(npx tsx ~/.claude/context-curator/scripts/get-current-task.ts)
else
  TASK_ID="$1"
fi
echo "Task: $TASK_ID"
```

## Step 2: List Contexts

Run the context listing script:

```bash
npx tsx ~/.claude/context-curator/scripts/context-list.ts "$TASK_ID"
```

This outputs JSON with all contexts (personal and golden).

## Step 3: Generate Summaries

For each context found, use the **Read tool** to read a sample of the context file:
- Read the first 20 messages
- Read the last 10 messages

Based on the content, generate a 1-2 sentence summary that captures:
- What was accomplished
- Key topics explored
- Notable decisions or patterns discovered

## Step 4: Display Results

Format the output clearly:

```markdown
# Contexts: <task-id>

## Personal contexts

### my-progress
**15 messages** • 2 days ago

**Summary:** Working through OAuth token validation edge cases,
focusing on mobile app authentication flow and session timeout handling.

### edge-cases
**8 messages** • 5 days ago

**Summary:** Explored boundary conditions in session token generation,
including concurrent request handling and Redis cache failures.

## Golden contexts (team shared)

### oauth-deep-dive ⭐
**47 messages** • 1 week ago • by: alice

**Summary:** Complete analysis of legacy OAuth implementation including
custom token format (v2.{sessionId}.{hmac}), three-tier session storage
(Redis/PostgreSQL/cookies), and rate limiting bypass issue in middleware.

### warmed-up ⭐
**32 messages** • 2 weeks ago • by: bob

**Summary:** Deep dive into session state management across distributed
systems, covering Redis cluster failover scenarios and PostgreSQL backup
synchronization patterns.

---

**Load a context:** `/task <task-id>` then select from menu
```

## Important Notes

- **Forked context** - this command runs in a forked context to analyze files
- **Golden contexts** are marked with ⭐
- **Summaries are AI-generated** based on message content
- Show author for golden contexts (from git history if available)

## Example Interactions

### Listing current task's contexts:

```
User: /context-list

Claude: # Contexts: oauth-refactor

## Personal contexts

### my-progress
**15 messages** • 2 days ago

**Summary:** Initial exploration of the OAuth flow in src/auth/,
identified the three-tier session storage pattern and documented
key entry points.

## Golden contexts (team shared)

### oauth-deep-dive ⭐
**47 messages** • 5 days ago

**Summary:** Comprehensive walkthrough of legacy OAuth with Alice,
covering token format, session management quirks, and the rate
limiting issue that was fixed last sprint.

---

Load a context: `/task oauth-refactor` then select from menu
```

### Listing specific task's contexts:

```
User: /context-list payment-integration

Claude: # Contexts: payment-integration

## Personal contexts

(No personal contexts)

## Golden contexts (team shared)

### stripe-complete ⭐
**62 messages** • 1 week ago

**Summary:** Full Stripe integration walkthrough including webhook
handling, idempotency keys, and the retry logic for failed charges.
Includes the fix for duplicate charge prevention.

---

Load a context: `/task payment-integration` then select
```
