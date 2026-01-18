---
description: List active sessions and saved contexts with summaries
context: fork
allowed-tools: Bash, Read
---

# Context List

**Usage:** `/context-list [task-id]`

List active sessions and saved contexts for a task, with AI-generated summaries.

Shows:
- **Active sessions** from `~/.claude/projects/<project-id>/` (current and recent)
- **Saved personal contexts** (your private snapshots)
- **Saved golden contexts** (team-shared snapshots)

**You have access to read context files and generate intelligent summaries.**

## Step 1: Determine Task and Project

If `task-id` is provided, use it. Otherwise, get the current task:

```bash
if [ -z "$1" ]; then
  TASK_ID=$(node ~/.claude/context-curator/dist/scripts/get-current-task.js)
else
  TASK_ID="$1"
fi
echo "Task: $TASK_ID"
```

## Step 2: List Sessions and Contexts

Run the context listing script:

```bash
node ~/.claude/context-curator/dist/scripts/context-list.js "$TASK_ID"
```

This outputs JSON with:
- Active sessions from `~/.claude/projects/<project-id>/`
- Saved personal contexts
- Saved golden contexts

## Step 3: Generate Summaries

For each session and context found, use the **Read tool** to read a sample:
- Read the first 20 messages
- Read the last 10 messages

Based on the content, generate a 1-2 sentence summary that captures:
- What was accomplished
- Key topics explored
- Notable decisions or patterns discovered

## Step 4: Display Results

Format the output clearly:

```markdown
# Context List

**Project:** /Users/dev/my-project
**Project ID:** -Users-dev-my-project
**Current task:** oauth-refactor

## Active Sessions

### 8e14f625... (current)
**47 messages** • ~12k tokens • just now

**Summary:** Currently working on OAuth token validation,
exploring the three-tier session storage architecture.

### a3b2c1d0...
**23 messages** • ~6k tokens • 2 hours ago

**Summary:** Earlier session investigating rate limiting
bypass issue in middleware.

## Saved Personal Contexts

### my-progress
**15 messages** • 2 days ago

**Summary:** Working through OAuth token validation edge cases,
focusing on mobile app authentication flow.

### edge-cases
**8 messages** • 5 days ago

**Summary:** Explored boundary conditions in session token generation,
including concurrent request handling.

## Saved Golden Contexts (team shared)

### oauth-deep-dive ⭐
**47 messages** • 1 week ago • by: alice

**Summary:** Complete analysis of legacy OAuth implementation including
custom token format and rate limiting bypass fix.

---

**Save current session:** `/context-save <name>`
**Load a context:** `/task oauth-refactor` then select from menu
**Resume a session:** `/resume <session-id>`
```

## Important Notes

- **Active sessions** are live session files in Claude's project directory
- **Current session** is marked - this is likely your active conversation
- **Forked context** - this command runs in a forked context to analyze files
- **Golden contexts** are marked with ⭐
- **Summaries are AI-generated** based on message content
- Show author for golden contexts (from git history if available)

## Session Storage Location

Sessions are stored at:
```
~/.claude/projects/<project-id>/<uuid>.jsonl
```

Where `<project-id>` is the project path with `/` replaced by `-`:
```
/Users/dev/my-project → -Users-dev-my-project
```

## Example Interactions

### Listing current task's contexts and sessions:

```
User: /context-list

Claude: # Context List

**Project:** /Users/dev/my-project
**Current task:** oauth-refactor

## Active Sessions

### 8e14f625... (current)
**47 messages** • ~12k tokens • just now

**Summary:** Deep dive into OAuth token validation, discovered
the custom v2.{sessionId}.{hmac} format and three storage tiers.

## Saved Personal Contexts

### my-progress
**15 messages** • 2 days ago

**Summary:** Initial exploration of auth flow, documented key
entry points in src/auth/.

## Saved Golden Contexts ⭐

### oauth-deep-dive
**62 messages** • 5 days ago

**Summary:** Comprehensive walkthrough with Alice covering token
format, session management, and rate limiting fix.

---

Save current session: `/context-save <name>`
Resume a session: `/resume <session-id>`
```

### Listing specific task's contexts:

```
User: /context-list payment-integration

Claude: # Context List

**Project:** /Users/dev/my-project
**Current task:** payment-integration

## Active Sessions

(No active sessions for this task)

## Saved Golden Contexts ⭐

### stripe-complete
**62 messages** • 1 week ago

**Summary:** Full Stripe integration walkthrough including webhook
handling and the retry logic for failed charges.

---

Load a context: `/task payment-integration` then select
```
