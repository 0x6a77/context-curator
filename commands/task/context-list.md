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

Format the output in compact single-line format (newest first):

```markdown
# Context List

**Project:** /Users/dev/my-project
**Task:** oauth-refactor

Sessions:
  8e14f625... (current)  47 msgs  ~12k - just now
  a3b2c1d0...            23 msgs   ~6k - 2 hours ago

Personal contexts:
  my-progress           15 msgs - 2 days ago [oauth-refactor]
  edge-cases             8 msgs - 5 days ago [oauth-refactor]

Golden contexts:
  oauth-deep-dive       47 msgs - 1 week ago [oauth-refactor] ⭐

---
Save: `/context-save <name>` | Load: `/task oauth-refactor`
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
**Task:** oauth-refactor

Sessions:
  8e14f625... (current)  47 msgs  ~12k - just now
  a3b2c1d0...            23 msgs   ~6k - 2 hours ago

Personal contexts:
  my-progress           15 msgs - 2 days ago [oauth-refactor]

Golden contexts:
  oauth-deep-dive       62 msgs - 5 days ago [oauth-refactor] ⭐

---
Save: `/context-save <name>` | Resume: `/resume <session-id>`
```

### Listing specific task's contexts:

```
User: /context-list payment-integration

Claude: # Context List

**Project:** /Users/dev/my-project
**Task:** payment-integration

Sessions:
  (none)

Golden contexts:
  stripe-complete       62 msgs - 1 week ago [payment-integration] ⭐

---
Load: `/task payment-integration` then select
```
