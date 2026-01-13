---
description: Create a new task with custom CLAUDE.md
allowed-tools: Bash, Read, Write
---

# Task Creation

Usage: /task-create <task-id>

## Step 1: Check if first task

Check if .context-curator/tasks/ exists:

```bash
test -d .context-curator/tasks && echo "exists" || echo "new"
```

If directory doesn't exist (output is "new"), this is the first task:
1. Explain to user: "This is your first task! I'll set up the @-import system in .claude/CLAUDE.md"
2. Run: `npx tsx ~/.claude/context-curator/scripts/init-project.ts`
3. Explain what was created:
   - Default task with current CLAUDE.md
   - New .claude/CLAUDE.md with @-import structure
   - Task tracking system

## Step 2: Validate task ID

Task ID must match /^[a-z0-9-]+$/

Check if task already exists:
```bash
test -d .context-curator/tasks/$1 && echo "exists" || echo "new"
```

If exists, ask user to choose a different name or confirm overwrite.

## Step 3: Ask for task focus

Ask user:
"What should this task focus on? Describe the goal, guidelines, and patterns for this work."

Wait for user's response.

## Step 4: Create task CLAUDE.md

Use the Write tool to create the task's CLAUDE.md file at:
`.context-curator/tasks/<task-id>/CLAUDE.md`

Structure the content based on user's description:
```markdown
# Task: <task-id>

## Focus
[User's description of the task goal]

## Guidelines
- [Key practices and principles for this task]
- [Coding standards specific to this work]
- [Important considerations]

## Tool Usage

### Preferred Skills for This Task
- **skill-name**: How and when to use it for this task
- [List relevant skills from .claude/skills/]

### Preferred Agents
- **agent-name**: When to invoke this agent
- [List relevant agents from .claude/agents/]

## Patterns

### [Pattern Category]
```[language]
// Code examples or patterns specific to this task
```

## Reference
- [Links to relevant documentation]
- [Related resources]
```

## Step 5: Create contexts directory

```bash
mkdir -p .context-curator/tasks/$1/contexts
```

## Step 6: Confirm creation

Display:
```
✓ Task '$1' created!
  Location: .context-curator/tasks/$1/

Task CLAUDE.md created with:
• Focus: [brief summary]
• [Line count] lines of guidance

Next steps:
• /task $1               - Start working on this task
• Edit task CLAUDE.md    - Refine instructions further
• /task-list             - See all your tasks

Note: This task uses project-wide skills and agents from .claude/
      Task-specific guidance for tool usage is in the task's CLAUDE.md
```
