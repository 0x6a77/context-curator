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
  TASK_ID=$(node ~/.claude/context-curator/dist/scripts/get-current-task.js)
else
  TASK_ID="$1"
fi
echo "Task: $TASK_ID"
```

## Step 2: List Contexts

Run the context listing script:

```bash
node ~/.claude/context-curator/dist/scripts/context-list.js "$TASK_ID"
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

---

**Load a context:** `/task <task-id>` then select from menu
```

## Important Notes

- **Forked context** - this command runs in a forked context to analyze files
- **Golden contexts** are marked with ⭐
- **Summaries are AI-generated** based on message content
- Show author for golden contexts (from git history if available)
