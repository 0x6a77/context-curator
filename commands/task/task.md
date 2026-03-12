---
description: Switch to a task (creates if new, shows contexts if exists)
allowed-tools: Bash, Read, Write, Edit
---

# Task Switcher

**Usage:** `/task <task-id>`

Switch to a task environment. Creates the task if it doesn't exist.

## Step 1: Validate Input

The task ID must be provided and use only lowercase letters, numbers, and hyphens.

```bash
TASK_ID="$1"

if [ -z "$TASK_ID" ]; then
  echo "Usage: /task <task-id>"
  echo ""
  echo "Examples:"
  echo "  /task oauth-refactor"
  echo "  /task payment-integration"
  echo "  /task bug-fixes"
  exit 1
fi

if ! echo "$TASK_ID" | grep -qE '^[a-z0-9-]+$'; then
  echo "❌ Invalid task ID"
  echo "   Use lowercase letters, numbers, and hyphens only"
  exit 1
fi
```

## Step 2: Check if Project is Initialized

Check if `.claude/tasks/default/CLAUDE.md` exists. If not, initialize the project first:

```bash
node ~/.claude/context-curator/dist/scripts/init-project.js
```

## Step 3: Check if Task Exists

Run the task-check script to see if the task exists:

```bash
node ~/.claude/context-curator/dist/scripts/task-check.js "$TASK_ID"
```

This script outputs:
- `exists:golden` - Task exists in project (golden)
- `exists:personal` - Task exists in personal storage
- `not-found` - Task doesn't exist

## Step 4a: If Task Doesn't Exist - Create It

Ask the user: **"What should this task focus on?"**

Wait for their response describing the task's purpose, guidelines, and focus areas.

Based on their answer, create the task's CLAUDE.md with this structure:

```markdown
# Task: <task-id>

## Focus
[User's description]

## Key Areas
[Relevant subsystems based on description]

## Guidelines
[Task-specific best practices]

## Common Pitfalls
[Document these as you discover them]

## Reference Files
[Key files for this task]
```

Create in personal storage by default:
```bash
echo "<claude-md-content>" | node ~/.claude/context-curator/dist/scripts/task-create.js "$TASK_ID"
```

Then continue to Step 5.

## Step 4b: If Task Exists - List Contexts

Run the context listing script in JSON mode:

```bash
node ~/.claude/context-curator/dist/scripts/context-list.js "$TASK_ID" --json
```

Parse the JSON output. It has two distinct fields — **do not confuse them**:
- `sessions` — active UUID session files from `~/.claude/projects/<project-id>/`. These are raw Claude Code sessions, NOT named saved contexts. **Never present these as context options.**
- `contexts` — named saved contexts for this specific task (personal or golden). These are what the user selects from.

Each entry in `contexts` has: `name`, `location` ("personal" or "golden"), `messages`, `tokens`, `lastModified`.

**If `contexts` is empty** (no named contexts saved yet):

Tell the user and proceed to a fresh start — do NOT show sessions as a substitute:

```
No saved contexts for task '<task-id>' yet.

Starting fresh.
```

Skip ahead; no context will be loaded.

**If `contexts` is not empty:**

Filter by `location` and present them numbered — personal first, then golden:

```
Which context to load?

Personal contexts:
1. my-progress        15 msgs - 2 days ago

Golden contexts (team shared):
2. oauth-deep-dive    47 msgs - 5 days ago ⭐

Enter number, or press Enter for fresh start:
```

Wait for the user's response. If the user enters a number, record the `name` field of that context. If the user presses Enter or says "fresh", proceed with no context.

## Step 5: Update @import

Update the @import line in `.claude/CLAUDE.md`:

```bash
node ~/.claude/context-curator/dist/scripts/update-import.js "$TASK_ID"
```

## Step 6: Prepare Session

If a context was selected, prepare it:

```bash
SESSION_ID=$(node ~/.claude/context-curator/dist/scripts/prepare-context.js "$TASK_ID" "$CONTEXT_NAME")
```

If no context (fresh start), just get a new session ID:

```bash
SESSION_ID=$(node ~/.claude/context-curator/dist/scripts/prepare-context.js "$TASK_ID")
```

## Step 7: Display Results

Read the task's CLAUDE.md to show focus:

Use the **Read tool** to read the task's CLAUDE.md file and extract the Focus section.

Display to the user:

```
✓ Task: <task-id>
✓ Context: <context-name> (N msgs) [or "fresh start"]

Run: /resume <session-id>

Your focus:
  [Extract Focus section from task CLAUDE.md]
```

## Important Notes

- Tasks are created in **personal storage** by default
- Use `/context-promote` to make a task golden (shared)
- Golden tasks (in `.claude/tasks/`) take precedence over personal
- The @import in `.claude/CLAUDE.md` is what Claude Code reads
- User must run `/resume <session-id>` to activate the new context

## Example Interactions

### Creating a new task:

```
User: /task oauth-refactor

Claude: Task 'oauth-refactor' doesn't exist yet.

What should this task focus on? Describe the goal, key areas, and any guidelines.

User: Refactoring the legacy OAuth implementation in src/auth/. Focus on the token validation flow, session management, and the three places auth state is stored.

Claude: ✓ Created task: oauth-refactor
✓ Location: personal storage

Run: /resume 8e14f625-bd1a-4e79-a382-2d6c0649df97

Your focus:
  Refactoring the legacy OAuth implementation in src/auth/
```

### Switching to existing task with contexts:

```
User: /task oauth-refactor

Claude: Which context to load?

Personal contexts:
1. my-progress (15 msgs) - 2 days ago

Golden contexts (team shared):
2. oauth-deep-dive (47 msgs) - 5 days ago ⭐

Enter number, or press Enter for fresh start:

User: 2

Claude: ✓ Task: oauth-refactor
✓ Context: oauth-deep-dive (47 msgs)

Run: /resume a3f2c891-57bd-4e12-b8a6-1d9c0e5f7320

Your focus:
  Refactoring the legacy OAuth implementation in src/auth/
```
