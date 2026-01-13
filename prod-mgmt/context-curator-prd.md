# Product Requirements Document: Claude Code Context Curator with Task Management

**Version:** 11.0  
**Last Updated:** January 12, 2026  
**Status:** Ready for Implementation

---

## Executive Summary

Claude Code Context Curator is a **task-based context management system** implemented as custom slash commands. It enables developers to organize their work into tasks with dedicated instruction sets (CLAUDE.md) and manage context snapshots within each task.

**Key Innovation**:
- **Tasks** = Named instruction sets via @-import mechanism
- **Contexts** = Named session snapshots saved within tasks
- **Atomic task switching** = Hard reset + @-import update + context load in one command
- **Multi-instance safe** = Running sessions unaffected by task switches
- **Clean project directory** = Only `.claude/CLAUDE.md` is modified
- **Personal workflow** = Tasks and contexts stored in `~/.claude/projects/`

**No API key required. Works entirely within Claude Code using native features.**

---

## Core Concepts

### Tasks

A **task** is a focused work environment containing:
- Custom CLAUDE.md with task-specific instructions
- Saved context snapshots

Tasks use the project's shared skills and agents from `.claude/skills/` and `.claude/agents/`.

Tasks are **personal workflow organization** (like browser tabs), not team assets.

**Examples**: integration-tests, api-refactor, bug-fix, documentation

### Contexts

A **context** is a named snapshot of a Claude Code session saved within a task.

Contexts are **personal session history** (like browser history), not team assets.

**Examples**: initial-setup, edge-cases, timeout-work, refactor-v2

### Default Task

Every project has an implicit **default** task that:
- Contains the original project configuration
- Stores contexts created without an explicit task
- Allows context-curator to work without thinking about tasks

### Default Contexts

Every task has a **default context** named `<task-id>-default`:
- Created automatically when task is created
- Provides clean starting point for the task
- Cannot be deleted (but can be overwritten)
- Naming pattern: `integration-tests-default`, `api-refactor-default`

### @-import Mechanism

The project's `.claude/CLAUDE.md` contains:
1. **Universal instructions** - Project-wide guidelines, shared across all tasks
2. **@-import line** - Points to the current task's CLAUDE.md

```markdown
# Project: My Application

## Universal Instructions
[Project-wide guidelines]

## Task-Specific Context

@import ~/.claude/projects/-Users-dev-my-project/tasks/default/CLAUDE.md

<!-- This line is managed by context-curator. Do not edit manually. -->
```

When you run `/task integration-tests`, the @-import line updates to:
```markdown
@import ~/.claude/projects/-Users-dev-my-project/tasks/integration-tests/CLAUDE.md
```

**Why this works**: Claude Code reads CLAUDE.md once at session start and never reloads. This means:
- Each session is isolated with its startup task context
- Updating @-import affects only the NEXT new session
- Multiple instances can run simultaneously without interference

---

## Architecture

### Global Installation Structure

```
~/.claude/
├── commands/                          # Personal slash commands
│   ├── task.md
│   ├── task-init.md
│   ├── task-create.md
│   ├── task-save.md
│   ├── task-list.md
│   ├── task-manage.md
│   ├── task-delete.md
│   ├── context-list.md
│   ├── context-create.md
│   ├── context-save.md
│   ├── context-rename.md
│   ├── context-delete.md
│   └── context-manage.md
│
├── extensions/                        # Extension scripts and tools
│   └── context-curator/
│       ├── commands/                  # Source command files (copied to ~/.claude/commands/)
│       ├── scripts/                   # TypeScript scripts
│       │   ├── init-project.ts
│       │   ├── update-import.ts
│       │   ├── prepare-context.ts
│       │   ├── create-default-context.ts
│       │   ├── task-create.ts
│       │   ├── task-save.ts
│       │   ├── task-list.ts
│       │   ├── context-list.ts
│       │   ├── context-create.ts
│       │   ├── context-rename.ts
│       │   ├── context-delete.ts
│       │   └── utils.ts
│       │
│       ├── src/                       # Shared libraries
│       │   ├── types.ts
│       │   ├── session-reader.ts
│       │   ├── session-writer.ts
│       │   └── task-manager.ts
│       │
│       ├── package.json
│       ├── tsconfig.json
│       └── node_modules/
│
└── projects/                          # Per-project state (isolated by project)
    ├── -Users-dev-my-project/
    │   ├── tasks/
    │   │   ├── default/
    │   │   │   ├── CLAUDE.md
    │   │   │   └── contexts/
    │   │   │       ├── default-default.jsonl
    │   │   │       ├── quick-fix.jsonl
    │   │   │       └── experiment.jsonl
    │   │   │
    │   │   ├── integration-tests/
    │   │   │   ├── CLAUDE.md
    │   │   │   └── contexts/
    │   │   │       ├── integration-tests-default.jsonl
    │   │   │       ├── initial-setup.jsonl
    │   │   │       └── edge-cases.jsonl
    │   │   │
    │   │   └── api-refactor/
    │   │       ├── CLAUDE.md
    │   │       └── contexts/
    │   │           └── api-refactor-default.jsonl
    │   │
    │   ├── session-task-map.json
    │   └── config.json
    │
    └── -Users-dev-other-project/
        └── tasks/
```

### Project Structure (Clean - Minimal Modification)

```
my-project/
├── .claude/
│   ├── CLAUDE.md                      # ← ONLY FILE WE MODIFY (one @-import line)
│   ├── skills/                        # ← User's skills (UNTOUCHED)
│   └── agents/                        # ← User's agents (UNTOUCHED)
│
├── src/
├── tests/
└── package.json
```

**Key principle**: We only touch `.claude/CLAUDE.md` to update the @-import line. All task state lives in `~/.claude/projects/`.

---

## Installation

### One-Time Global Setup

Install context-curator once in your `~/.claude/` directory, and it becomes available for all projects:

```bash
# 1. Create directories
mkdir -p ~/.claude/commands
mkdir -p ~/.claude/extensions
mkdir -p ~/.claude/projects

# 2. Clone context-curator
cd ~/.claude/extensions
git clone <repo-url> context-curator
cd context-curator
npm install

# 3. Copy commands to ~/.claude/commands/
cp commands/*.md ~/.claude/commands/

# 4. Verify installation
ls ~/.claude/commands/task*.md
# Should show: task.md, task-init.md, task-create.md, task-save.md, etc.

# 5. Test in any project
cd ~/any-project
claude
You: /task-list
```

**That's it!** Commands are now available in all projects.

### Per-Project Initialization

After global installation, initialize each project:

```bash
cd ~/my-project

# Option 1: Use slash command
claude
You: /task-init

# Option 2: Run script directly
npx tsx ~/.claude/extensions/context-curator/scripts/init-project.ts
```

**What `/task-init` does**:
1. Creates `~/.claude/projects/<project-id>/` directory
2. Creates `~/.claude/projects/<project-id>/tasks/default/` directory
3. Backs up current `.claude/CLAUDE.md` to default task
4. Adds @-import line to `.claude/CLAUDE.md`
5. Creates default-default.jsonl (empty context)
6. Creates session-task-map.json

### Update Context-Curator

```bash
cd ~/.claude/extensions/context-curator
git pull
npm install

# All projects automatically use updated version ✅
```

---

## Commands Reference

All commands invoke scripts in `~/.claude/extensions/context-curator/scripts/`.

### Task Management Commands

#### /task-init

Initialize context-curator for the current project.

**Usage**:
```
/task-init
```

**What happens**:
1. Encodes project path to create project ID (e.g., `/Users/dev/my-project` → `-Users-dev-my-project`)
2. Creates `~/.claude/projects/<project-id>/` directory structure
3. Backs up current `.claude/CLAUDE.md` to `~/.claude/projects/<project-id>/tasks/default/CLAUDE.md`
4. Creates new `.claude/CLAUDE.md` with @-import line
5. Creates `default-default.jsonl` (empty default context)
6. Creates `session-task-map.json`

**Example**:
```
You: /task-init

Claude: Initializing context-curator for this project...

        Project: /Users/dev/my-project
        Project ID: -Users-dev-my-project
        
        ✓ Created project directory: ~/.claude/projects/-Users-dev-my-project/
        ✓ Created default task
        ✓ Backed up current CLAUDE.md
        ✓ Added @-import line to .claude/CLAUDE.md
        ✓ Created default-default context
        
        Context-curator ready!
        
        Try:
        /task-list              - See your tasks
        /task-create <name>     - Create a new task
        /context-list           - See all contexts
```

---

#### /task <task-id> [context-name]

Activate a task environment with optional saved context.

**Usage**:
```
/task integration-tests              # Fresh session with default context
/task integration-tests edge-cases   # Load saved context
```

**What happens**:
1. **[PreToolUse Hook]** Updates @-import line in project's `.claude/CLAUDE.md`
2. Checks current session for unsaved work
3. Offers to save if work exists
4. Executes `/clear` to reset session
5. Prepares new session with context (if specified) or default context
6. Records session→task mapping in `~/.claude/projects/<project-id>/session-task-map.json`
7. Tells user to `/resume <session-id>`

**Example**:
```
You: /task integration-tests edge-cases

Claude (PreToolUse):
        ✓ Updated @-import: integration-tests
        
        Current session: 34 messages (unsaved)
        Save? (yes/no)

You: yes

Claude: Context name? (lowercase, numbers, hyphens only)

You: debug-work

Claude: ✓ Saved to 'default' task as 'debug-work'
        Location: ~/.claude/projects/-Users-dev-my-project/tasks/default/contexts/debug-work.jsonl
        
        Activating task 'integration-tests' with context 'edge-cases'...
        /clear
        ✓ Session cleared
        ✓ Session ready: sess-a1b2c3d4 (156 messages from edge-cases)
        
        Type: /resume sess-a1b2c3d4
        
        Your focus for this task:
        • API integration testing with Jest
        • Prioritize edge cases and error handling

You: /resume sess-a1b2c3d4

Claude: [Loads 156 messages from edge-cases context]
        [Task environment active with integration-tests instructions]
```

---

#### /task-create <task-id>

Create a new task with interactive configuration and automatically switch to it.

**Usage**:
```
/task-create integration-tests
```

**What happens**:
1. Validates task ID format (lowercase, numbers, hyphens only)
2. Checks if task already exists
3. Asks for task description/focus
4. Writes task CLAUDE.md via editor mode to `~/.claude/projects/<project-id>/tasks/<task-id>/CLAUDE.md`
5. **Auto-switch**: Updates @-import, clears session, creates default context
6. Tells user to `/resume <session-id>`

**Example**:
```
You: /task-create integration-tests

Claude: What should this task focus on?

You: API integration testing with Jest. Focus on edge cases and error handling.

Claude: [Launches editor mode to write CLAUDE.md]

I'll create a CLAUDE.md focused on integration testing:

[Writes to ~/.claude/projects/-Users-dev-my-project/tasks/integration-tests/CLAUDE.md]

✓ Task 'integration-tests' created (147 lines)
  Location: ~/.claude/projects/-Users-dev-my-project/tasks/integration-tests/

Switching to new task...
/clear
✓ Session cleared
✓ Created default context: integration-tests-default
✓ Session ready: sess-abc123

Type: /resume sess-abc123

Your focus for this task:
• API integration testing with Jest
• Prioritize edge cases and error handling

You: /resume sess-abc123

Claude: [Clean slate in integration-tests task]
        Ready to start integration testing work!
```

---

#### /task-save <context-name> [task-id]

Save current session as a named context in the active or specified task.

**Usage**:
```
/task-save initial-setup              # Save to active task
/task-save initial-setup api-refactor # Save to specific task
```

**Validation**: Context name must match `/^[a-z0-9-]+$/`

**What happens**:
1. Validates context name format
2. Determines active task from session-task-map.json or current @-import
3. Parses `~/.claude/history.jsonl` to get current session ID
4. Copies session to `~/.claude/projects/<project-id>/tasks/<task-id>/contexts/<context-name>.jsonl`
5. Handles overwrite with backup

**Example**:
```
You: /task-save edge-cases

Claude: ✓ Saved as 'edge-cases' (156 msgs, 34k tokens)
        Task: integration-tests
        Location: ~/.claude/projects/-Users-dev-my-project/tasks/integration-tests/contexts/edge-cases.jsonl
```

---

#### /task-list [task-id]

List all tasks or show details for a specific task.

**Usage**:
```
/task-list                    # List all tasks
/task-list integration-tests  # Show task details
```

**Example (all tasks)**:
```
You: /task-list

Claude: # Available Tasks

Project: /Users/dev/my-project
Storage: ~/.claude/projects/-Users-dev-my-project/

default (current)
• Contexts: 3
• Last used: 2 hours ago

integration-tests
• Contexts: 4
• Last used: 1 day ago

api-refactor
• Contexts: 2
• Last used: 3 days ago

Total: 3 tasks, 9 contexts

Current: @import ~/.claude/projects/-Users-dev-my-project/tasks/default/CLAUDE.md

Switch tasks: /task <task-id> [context-name]
```

**Example (specific task)**:
```
You: /task-list integration-tests

Claude: # Task: integration-tests

## Overview
API integration testing with Jest. Edge cases and error handling.

## CLAUDE.md
147 lines
Location: ~/.claude/projects/-Users-dev-my-project/tasks/integration-tests/CLAUDE.md
Focus: Integration testing patterns, mocking strategies

## Saved Contexts
1. integration-tests-default (0 msgs) - 5 days ago [DEFAULT]
2. initial-setup (67 msgs, 15k tokens) - 3 days ago
3. edge-cases (156 msgs, 34k tokens) - 1 day ago
4. timeout-work (89 msgs, 19k tokens) - 2 hours ago

Total: 4 contexts

## Usage
/task integration-tests                    - Use default context
/task integration-tests edge-cases         - Resume saved work
```

---

#### /task-manage

Interactive task management interface.

**Usage**:
```
/task-manage
```

**Features**:
- Rename tasks
- Edit task CLAUDE.md
- View task usage statistics
- Delete tasks (with confirmation)

---

#### /task-delete <task-id>

Delete a task and all its contexts.

**Usage**:
```
/task-delete integration-tests
```

**What happens**:
1. Confirms deletion (shows contexts that will be lost)
2. Prevents deletion of 'default' task
3. Deletes task directory from `~/.claude/projects/<project-id>/tasks/`
4. If deleting current task, switches to 'default'

**Example**:
```
You: /task-delete integration-tests

Claude: ⚠️ Delete task 'integration-tests'?

This will permanently delete:
• Task CLAUDE.md (147 lines)
• 4 saved contexts:
  - integration-tests-default (0 msgs)
  - initial-setup (67 msgs)
  - edge-cases (156 msgs)
  - timeout-work (89 msgs)
  
Location: ~/.claude/projects/-Users-dev-my-project/tasks/integration-tests/

Type 'delete integration-tests' to confirm:

You: delete integration-tests

Claude: ✓ Task 'integration-tests' deleted
        ✓ Switched to 'default' task
```

---

### Context Management Commands

#### /context-list [task-id]

List all contexts in all tasks (default) or a specific task.

**Usage**:
```
/context-list                    # All contexts across all tasks
/context-list integration-tests  # Specific task's contexts
```

**Example (all contexts)**:
```
You: /context-list

Claude: # All Contexts

Project: /Users/dev/my-project
Storage: ~/.claude/projects/-Users-dev-my-project/

## Task: default
1. default-default (0 msgs) - 3 days ago [DEFAULT]
2. quick-fix (45 msgs, 12k tokens) - 2 days ago
3. experiment (23 msgs, 6k tokens) - 1 day ago

## Task: integration-tests
1. integration-tests-default (0 msgs) - 5 days ago [DEFAULT]
2. initial-setup (67 msgs, 15k tokens) - 3 days ago
3. edge-cases (156 msgs, 34k tokens) - 1 day ago
4. timeout-work (89 msgs, 19k tokens) - 2 hours ago

## Task: api-refactor
1. api-refactor-default (0 msgs) - 4 days ago [DEFAULT]
2. initial-design (103 msgs, 28k tokens) - 4 days ago

Total: 3 tasks, 9 contexts

Load any context: /task <task-id> <context-name>
```

**Example (specific task)**:
```
You: /context-list integration-tests

Claude: # Contexts: integration-tests

1. integration-tests-default (0 msgs) - 5 days ago [DEFAULT]
2. initial-setup (67 msgs, 15k tokens) - 3 days ago
3. edge-cases (156 msgs, 34k tokens) - 1 day ago  
4. timeout-work (89 msgs, 19k tokens) - 2 hours ago

Total: 4 contexts

Load: /task integration-tests <context-name>
```

---

#### /context-create <context-name> [task-id]

Create a new empty context in active or specified task.

**Usage**:
```
/context-create refactor-attempt              # In active task
/context-create refactor-attempt api-refactor # In specific task
```

**What happens**:
1. Validates context name format
2. Determines target task (active or specified)
3. Creates empty .jsonl file in `~/.claude/projects/<project-id>/tasks/<task-id>/contexts/`

**Example**:
```
You: /context-create refactor-attempt

Claude: ✓ Created empty context: refactor-attempt
        Task: integration-tests
        Location: ~/.claude/projects/-Users-dev-my-project/tasks/integration-tests/contexts/refactor-attempt.jsonl
        
        Start using it:
        /task integration-tests refactor-attempt
```

**Use case**: Want to branch from current work without saving it yet.

---

#### /context-rename <old-name> <new-name> [task-id]

Rename a context in active or specified task.

**Usage**:
```
/context-rename edge-cases error-handling              # In active task
/context-rename edge-cases error-handling integration-tests # In specific task
```

**What happens**:
1. Validates context exists
2. Validates new name format
3. Renames file in `~/.claude/projects/<project-id>/tasks/<task-id>/contexts/`
4. Updates session-task-map.json if context is currently loaded

**Example**:
```
You: /context-rename edge-cases error-handling

Claude: ✓ Renamed context in task 'integration-tests':
        edge-cases → error-handling
        
        Location: ~/.claude/projects/-Users-dev-my-project/tasks/integration-tests/contexts/error-handling.jsonl
        
        Load renamed context:
        /task integration-tests error-handling
```

**Use case**: Refine naming as work evolves.

---

#### /context-delete <context-name> [task-id]

Delete a context from active or specified task.

**Usage**:
```
/context-delete edge-cases              # From active task
/context-delete edge-cases integration-tests # From specific task
```

**What happens**:
1. Validates context exists
2. Prevents deletion of default contexts (`<task-id>-default`)
3. Shows confirmation prompt with context details
4. Deletes file from `~/.claude/projects/<project-id>/tasks/<task-id>/contexts/`

**Example**:
```
You: /context-delete edge-cases

Claude: ⚠️ Delete context 'edge-cases' from task 'integration-tests'?
        
        156 messages, 34k tokens
        Last modified: 2 hours ago
        Location: ~/.claude/projects/-Users-dev-my-project/tasks/integration-tests/contexts/edge-cases.jsonl
        
        Type 'delete edge-cases' to confirm:

You: delete edge-cases

Claude: ✓ Context 'edge-cases' deleted
```

**Special case - default context**:
```
You: /context-delete integration-tests-default

Claude: ❌ Cannot delete default context 'integration-tests-default'
        
        Default contexts are created when tasks are created and serve as the
        task's clean starting point. You can overwrite it but not delete it.
        
        To reset the default context:
        /task integration-tests integration-tests-default
        /clear
        /task-save integration-tests-default
```

---

#### /context-manage [task-id]

Interactive context management interface.

**Usage**:
```
/context-manage                    # Manage active task's contexts
/context-manage integration-tests  # Manage specific task's contexts
```

**Features**:
- Rename contexts
- View context details
- Delete contexts
- Create new contexts

**Example**:
```
You: /context-manage

Claude: # Context Management: integration-tests

Contexts:
1. integration-tests-default (0 msgs) [DEFAULT]
2. initial-setup (67 msgs)
3. edge-cases (156 msgs)
4. timeout-work (89 msgs)

Actions:
n - Create new context
r - Rename context
v - View details
d - Delete context
q - Quit

Choose an action:

You: r

Claude: Which context? (number or name)

You: 3

Claude: Current name: edge-cases
        New name? (lowercase, numbers, hyphens only)

You: error-handling

Claude: ✓ Renamed: edge-cases → error-handling
```

---

## Multi-Instance Workflow

### How It Works

Claude Code reads `.claude/CLAUDE.md` once at session start and **never reloads it during the session**. This behavior enables multi-instance workflows:

- Each instance captures the @-import state when it starts
- Running instances are unaffected by subsequent @-import changes
- Multiple instances can work on different tasks simultaneously
- All state managed in `~/.claude/projects/<project-id>/` (outside project directory)

### Example: Running 8-9 Instances (Boris's Workflow)

```bash
# Terminal 1: Integration testing
$ cd ~/myproject && claude
You: /task integration-tests edge-cases
     [PreToolUse updates @import to integration-tests]
     [Loads from ~/.claude/projects/-Users-dev-myproject/...]
You: /resume sess-abc123
     [Works with integration-tests context]
     [Project directory unchanged]

# Terminal 2: API refactoring (while T1 running)
$ cd ~/myproject && claude
You: /task api-refactor initial-design
     [PreToolUse updates @import to api-refactor]
     [Loads from ~/.claude/projects/-Users-dev-myproject/...]
You: /resume sess-def456
     [Works with api-refactor context]
     [Project directory unchanged]

# Terminal 1: Still running, still integration-tests ✅
     [CLAUDE.md not reloaded, context unchanged]
     [All state in ~/.claude/projects/]

# Terminal 3: Bug fixing
$ cd ~/myproject && claude
You: /task bug-fix
     [PreToolUse updates @import to bug-fix]
You: /resume sess-ghi789
     [Works with bug-fix context]

# Terminals 4-9: Additional work streams
     [Each can use different tasks]
     [All isolated, no interference]
     [Project directory stays clean]
```

### Current Task Visibility

Check which task the next new session will use:

```bash
$ grep '@import' ~/myproject/.claude/CLAUDE.md
@import ~/.claude/projects/-Users-dev-myproject/tasks/api-refactor/CLAUDE.md
```

This shows: The next session started will have api-refactor context.
Currently running sessions keep their original task context.

### Best Practices for Multi-Instance

1. **Always use `/task <id>` before starting work**
   - Updates @-import for your session
   - Ensures you get the right task context

2. **Start session immediately after `/task`**
   - Captures the task context you just set
   - Avoids race conditions with other instances

3. **Don't manually edit the @-import line**
   - Let commands manage it automatically
   - Manual edits can cause confusion

4. **Use task-specific contexts**
   - Save work with `/task-save <name>`
   - Resume with `/task <id> <context-name>`
   - Keeps work organized by task

---

## Implementation Details

### Command File Structure

All command files in `~/.claude/commands/` invoke scripts in `~/.claude/extensions/context-curator/scripts/`.

#### ~/.claude/commands/task.md

```markdown
---
description: Activate a task environment with optional context
allowed-tools: Bash, Read, Write
pre-tool-use: |
  # Update task import in project's CLAUDE.md
  npx tsx ~/.claude/extensions/context-curator/scripts/update-import.ts $1
---

# Task Activation

Usage: /task <task-id> [context-name]

## PreToolUse (Automatic)

The pre-tool-use hook has already updated .claude/CLAUDE.md:
- Changed @-import line to point to this task's CLAUDE.md

## Step 1: Check for unsaved work

Check if current session has messages:
```bash
npx tsx ~/.claude/extensions/context-curator/scripts/check-session.ts
```

If there are unsaved messages, ask user:
"Current session: N messages (unsaved). Save? (yes/no)"

If yes:
- Ask for context name (validate: lowercase, numbers, hyphens only)
- Run: `npx tsx ~/.claude/extensions/context-curator/scripts/task-save.ts <context-name>`

## Step 2: Clear session

Execute `/clear` to reset the conversation.

## Step 3: Prepare context session

Run:
```bash
SESSION_ID=$(npx tsx ~/.claude/extensions/context-curator/scripts/prepare-context.ts $1 $2)
```

This:
- Creates new session file with context messages (if context-name provided)
- Or loads <task-id>-default context if no context-name
- Records session→task mapping
- Returns session ID

## Step 4: Display task focus and tell user to resume

Read the task's CLAUDE.md to show key points:
```bash
PROJECT_ID=$(npx tsx ~/.claude/extensions/context-curator/scripts/get-project-id.ts)
head -n 20 ~/.claude/projects/$PROJECT_ID/tasks/$1/CLAUDE.md
```

Display:
```
✓ Task context: $1
✓ Session ready: $SESSION_ID

Type: /resume $SESSION_ID

Your focus for this task:
• [Extract key points from task CLAUDE.md]
```
```

### Core Scripts

All scripts are in `~/.claude/extensions/context-curator/scripts/`.

#### init-project.ts

```typescript
#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function initProject() {
  console.log('Initializing context-curator...\n');
  
  const projectPath = process.cwd();
  const projectId = encodeProjectPath(projectPath);
  const projectDir = path.join(
    process.env.HOME!,
    '.claude/projects',
    projectId
  );
  
  console.log(`Project: ${projectPath}`);
  console.log(`Project ID: ${projectId}\n`);
  
  // 1. Create project directory structure
  const tasksDir = path.join(projectDir, 'tasks');
  await fs.mkdir(tasksDir, { recursive: true });
  
  // 2. Move existing CLAUDE.md to default task
  const currentClaudeMd = path.join(projectPath, '.claude/CLAUDE.md');
  const defaultTaskDir = path.join(tasksDir, 'default');
  
  await fs.mkdir(defaultTaskDir, { recursive: true });
  await fs.mkdir(path.join(defaultTaskDir, 'contexts'), { recursive: true });
  
  try {
    const content = await fs.readFile(currentClaudeMd, 'utf-8');
    await fs.writeFile(
      path.join(defaultTaskDir, 'CLAUDE.md'),
      content
    );
    console.log('✓ Backed up current CLAUDE.md to "default" task');
  } catch {
    await fs.writeFile(
      path.join(defaultTaskDir, 'CLAUDE.md'),
      '# Default Task\n\nGeneral development work.\n'
    );
    console.log('✓ Created default task CLAUDE.md');
  }
  
  // 3. Create new CLAUDE.md with @-import
  const projectName = path.basename(projectPath);
  const newClaudeMd = `# Project: ${projectName}

## Universal Instructions

Add your project-wide guidelines here:
- Coding standards
- Common commands
- Shared practices

## Task-Specific Context

@import ~/.claude/projects/${projectId}/tasks/default/CLAUDE.md

<!-- This line is managed by context-curator. Do not edit manually. -->
`;
  
  await fs.writeFile(currentClaudeMd, newClaudeMd);
  console.log('✓ Added @-import line to .claude/CLAUDE.md');
  
  // 4. Create default-default context (empty)
  await fs.writeFile(
    path.join(defaultTaskDir, 'contexts', 'default-default.jsonl'),
    ''
  );
  console.log('✓ Created default-default context');
  
  // 5. Create session-task-map.json
  await fs.writeFile(
    path.join(projectDir, 'session-task-map.json'),
    '{}\n'
  );
  console.log('✓ Created session tracking file');
  
  console.log(`\n✓ Initialization complete!`);
  console.log(`  Project directory: ${projectDir}\n`);
  console.log('Next steps:');
  console.log('1. Edit .claude/CLAUDE.md to add universal guidelines');
  console.log('2. Create your first task: /task-create <task-id>');
  console.log('3. View all contexts: /context-list');
}

function encodeProjectPath(projectPath: string): string {
  // Encode path for filesystem safety
  // /Users/dev/my-project → -Users-dev-my-project
  return projectPath.replace(/\//g, '-').replace(/^-/, '');
}

initProject().catch(console.error);
```

#### update-import.ts

```typescript
#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function updateImport(taskId: string) {
  const projectPath = process.cwd();
  const projectId = encodeProjectPath(projectPath);
  const claudeMdPath = path.join(projectPath, '.claude/CLAUDE.md');
  
  // Verify task exists
  const taskClaudeMd = path.join(
    process.env.HOME!,
    '.claude/projects',
    projectId,
    'tasks',
    taskId,
    'CLAUDE.md'
  );
  
  try {
    await fs.access(taskClaudeMd);
  } catch (error) {
    console.error(`❌ Task '${taskId}' not found`);
    console.error(`   Missing: ${taskClaudeMd}`);
    
    // List available tasks
    const tasksDir = path.join(
      process.env.HOME!,
      '.claude/projects',
      projectId,
      'tasks'
    );
    
    try {
      const tasks = await fs.readdir(tasksDir);
      const validTasks = [];
      
      for (const task of tasks) {
        const taskPath = path.join(tasksDir, task);
        const stats = await fs.stat(taskPath);
        if (stats.isDirectory()) {
          validTasks.push(task);
        }
      }
      
      console.error('\nAvailable tasks:');
      validTasks.forEach(t => console.error(`   - ${t}`));
    } catch {
      console.error('\nNo tasks found. Run /task-init first.');
    }
    
    process.exit(1);
  }
  
  // Read current CLAUDE.md
  let content = await fs.readFile(claudeMdPath, 'utf-8');
  
  // Update @-import line
  const importLine = `@import ~/.claude/projects/${projectId}/tasks/${taskId}/CLAUDE.md`;
  const importRegex = /@import ~\/\.claude\/projects\/[^\/]+\/tasks\/[^\/]+\/CLAUDE\.md/;
  
  if (importRegex.test(content)) {
    // Replace existing import
    content = content.replace(importRegex, importLine);
  } else {
    // Add import if not present
    console.warn('⚠️  No @import line found, adding one...');
    content = content.trim() + '\n\n' + importLine + '\n';
  }
  
  await fs.writeFile(claudeMdPath, content);
  
  console.log(`✓ Updated @-import: ${taskId}`);
}

function encodeProjectPath(projectPath: string): string {
  return projectPath.replace(/\//g, '-').replace(/^-/, '');
}

const taskId = process.argv[2];
if (!taskId) {
  console.error('Usage: update-import <task-id>');
  process.exit(1);
}

updateImport(taskId).catch(console.error);
```

#### create-default-context.ts

```typescript
#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

async function createDefaultContext(taskId: string) {
  const projectPath = process.cwd();
  const projectId = encodeProjectPath(projectPath);
  
  const sessionId = `sess-${randomUUID().slice(0, 8)}`;
  const contextName = `${taskId}-default`;
  
  // Create empty session in Claude's sessions directory
  const sessionFile = path.join(
    process.env.HOME!,
    '.claude/sessions',
    `${sessionId}.jsonl`
  );
  
  await fs.mkdir(path.dirname(sessionFile), { recursive: true });
  await fs.writeFile(sessionFile, '');
  
  // Save as task's default context
  const contextPath = path.join(
    process.env.HOME!,
    '.claude/projects',
    projectId,
    'tasks',
    taskId,
    'contexts',
    `${contextName}.jsonl`
  );
  
  await fs.mkdir(path.dirname(contextPath), { recursive: true });
  await fs.writeFile(contextPath, '');
  
  // Record session→task mapping
  const mapPath = path.join(
    process.env.HOME!,
    '.claude/projects',
    projectId,
    'session-task-map.json'
  );
  
  let map: Record<string, any> = {};
  try {
    const content = await fs.readFile(mapPath, 'utf-8');
    map = JSON.parse(content);
  } catch {
    // File doesn't exist yet
  }
  
  map[sessionId] = {
    task_id: taskId,
    context_name: contextName,
    created_at: new Date().toISOString()
  };
  
  await fs.writeFile(mapPath, JSON.stringify(map, null, 2));
  
  console.log(`✓ Created default context: ${contextName}`);
  console.log(sessionId);
  
  return sessionId;
}

function encodeProjectPath(projectPath: string): string {
  return projectPath.replace(/\//g, '-').replace(/^-/, '');
}

const taskId = process.argv[2];
if (!taskId) {
  console.error('Usage: create-default-context <task-id>');
  process.exit(1);
}

createDefaultContext(taskId).catch(console.error);
```

#### prepare-context.ts

```typescript
#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

async function prepareContext(taskId: string, contextName?: string) {
  const projectPath = process.cwd();
  const projectId = encodeProjectPath(projectPath);
  
  // If no context specified, use default
  if (!contextName) {
    contextName = `${taskId}-default`;
  }
  
  const taskDir = path.join(
    process.env.HOME!,
    '.claude/projects',
    projectId,
    'tasks',
    taskId
  );
  
  // Generate session ID
  const sessionId = `sess-${randomUUID().slice(0, 8)}`;
  
  // Create session file in Claude's sessions directory
  const sessionDir = path.join(process.env.HOME!, '.claude/sessions');
  await fs.mkdir(sessionDir, { recursive: true });
  
  const sessionFile = path.join(sessionDir, `${sessionId}.jsonl`);
  
  // Copy context to new session
  const contextPath = path.join(taskDir, 'contexts', `${contextName}.jsonl`);
  
  try {
    await fs.copyFile(contextPath, sessionFile);
    const stats = await getSessionStats(sessionFile);
    
    if (stats.messages > 0) {
      console.log(`✓ Loaded context: ${contextName} (${stats.messages} messages)`);
    } else {
      console.log(`✓ Loaded default context: ${contextName}`);
    }
  } catch (error) {
    console.error(`❌ Context '${contextName}' not found in task '${taskId}'`);
    
    // List available contexts
    const contextsDir = path.join(taskDir, 'contexts');
    try {
      const contexts = await fs.readdir(contextsDir);
      const jsonlContexts = contexts
        .filter(f => f.endsWith('.jsonl'))
        .map(f => f.replace('.jsonl', ''));
      
      console.error('\nAvailable contexts:');
      jsonlContexts.forEach(c => {
        const isDefault = c.endsWith('-default');
        console.error(`   - ${c}${isDefault ? ' [DEFAULT]' : ''}`);
      });
    } catch {
      console.error('   (No contexts saved yet)');
    }
    
    process.exit(1);
  }
  
  // Record session→task mapping
  await recordSessionTask(projectId, sessionId, taskId, contextName);
  
  // Return session ID for /resume
  console.log(sessionId);
  return sessionId;
}

async function recordSessionTask(
  projectId: string,
  sessionId: string,
  taskId: string,
  contextName: string
) {
  const mapPath = path.join(
    process.env.HOME!,
    '.claude/projects',
    projectId,
    'session-task-map.json'
  );
  
  let map: Record<string, any> = {};
  
  try {
    const content = await fs.readFile(mapPath, 'utf-8');
    map = JSON.parse(content);
  } catch {
    // File doesn't exist yet
  }
  
  map[sessionId] = {
    task_id: taskId,
    context_name: contextName,
    created_at: new Date().toISOString()
  };
  
  await fs.writeFile(mapPath, JSON.stringify(map, null, 2));
}

async function getSessionStats(sessionPath: string) {
  const content = await fs.readFile(sessionPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  
  const totalChars = lines.reduce((sum, line) => {
    try {
      const msg = JSON.parse(line);
      const contentStr = typeof msg.content === 'string' 
        ? msg.content 
        : JSON.stringify(msg.content);
      return sum + contentStr.length;
    } catch {
      return sum;
    }
  }, 0);
  
  return {
    messages: lines.length,
    tokens: Math.ceil(totalChars / 4)
  };
}

function encodeProjectPath(projectPath: string): string {
  return projectPath.replace(/\//g, '-').replace(/^-/, '');
}

const [taskId, contextName] = process.argv.slice(2);
if (!taskId) {
  console.error('Usage: prepare-context <task-id> [context-name]');
  process.exit(1);
}

prepareContext(taskId, contextName).catch(console.error);
```

---

## Key Features

### ✅ Global Installation

One installation in `~/.claude/`:
- Works across all projects
- Update once, affects all projects
- Commands available everywhere

### ✅ Clean Project Directory

Only `.claude/CLAUDE.md` is modified:
- All task state in `~/.claude/projects/`
- No version control pollution
- Safe from accidental commits

### ✅ Task-Based Organization

Separate instruction sets for different work types:
- integration-tests task
- api-refactor task
- bug-fix task

### ✅ @-import Mechanism

Simple, transparent context switching:
- One line updates in project's `.claude/CLAUDE.md`
- Running sessions unaffected
- Multi-instance safe

### ✅ Context Snapshots

Named checkpoints within each task:
- Saved in `~/.claude/projects/<project-id>/tasks/<task-id>/contexts/`
- Full CRUD operations (create, rename, delete)
- Default contexts for clean starting points

### ✅ Atomic Task Switching

One command (`/task <id> <context>`) does everything:
- Updates @-import
- Saves current work (if needed)
- Clears session
- Loads context
- Ready to resume

### ✅ Multi-Instance Safe

Run 8-9 Claude Code instances simultaneously:
- Each instance isolated
- No interference between sessions
- Perfect for parallel work streams

### ✅ Personal Workflow Management

Tasks and contexts are personal:
- Like browser tabs and history
- Not shared via git
- Each developer manages their own

### ✅ No API Key Required

Uses Claude Code's built-in features:
- Native `/clear` and `/resume`
- Custom slash commands with PreToolUse hooks
- File system operations

---

## Success Criteria

### MVP Complete When
- [x] Global installation in ~/.claude/
- [x] Project state in ~/.claude/projects/
- [x] All task commands work
- [x] All context commands work (including create, rename, delete)
- [x] @-import mechanism working reliably
- [x] Auto-switch after task creation with default context
- [x] /context-list shows all contexts across all tasks
- [x] Default contexts cannot be deleted
- [x] Multi-instance workflow documented
- [x] Zero data loss in testing
- [x] Documentation complete

---

## Version History

- **v11.0** (2026-01-12): Corrected storage to ~/.claude/projects/, auto-switch on task creation, complete context commands, show all contexts
- **v10.1** (2026-01-12): Global ~/.claude/ installation model - SUPERSEDED
- **v10.0** (2026-01-10): @-import based architecture - SUPERSEDED
- **v9.0** (2026-01-08): Task-based architecture - SUPERSEDED

---

## Appendix: Directory Structure Summary

```
~/.claude/
├── commands/              # Slash commands (global, all projects)
├── extensions/
│   └── context-curator/   # Extension code (global, all projects)
└── projects/              # Per-project state (isolated)
    └── <project-id>/
        ├── tasks/
        │   ├── default/
        │   │   ├── CLAUDE.md
        │   │   └── contexts/
        │   └── integration-tests/
        │       ├── CLAUDE.md
        │       └── contexts/
        └── session-task-map.json

my-project/
└── .claude/
    └── CLAUDE.md          # Only file we modify (one @-import line)
```

---

## Appendix: Troubleshooting

### Issue: Commands not found

**Symptom**: Running `/task` shows "command not found"

**Solution**:
1. Verify commands exist: `ls ~/.claude/commands/task*.md`
2. If missing: `cp ~/.claude/extensions/context-curator/commands/*.md ~/.claude/commands/`
3. Restart Claude Code

### Issue: Project not initialized

**Symptom**: `/task` says "No tasks found. Run /task-init first."

**Solution**:
```bash
cd ~/my-project
claude
You: /task-init
```

### Issue: Task not found

**Symptom**: `/task integration-tests` says task not found

**Solution**:
1. List tasks: `/task-list`
2. Check directory: `ls ~/.claude/projects/$(pwd | tr '/' '-' | sed 's/^-//')/tasks/`
3. Create task if missing: `/task-create integration-tests`

### Issue: Context not found

**Symptom**: `/task integration-tests my-context` says context not found

**Solution**:
1. List contexts: `/context-list integration-tests`
2. Check file exists: `ls ~/.claude/projects/*/tasks/integration-tests/contexts/`
3. Use correct context name (lowercase, hyphens only)

### Issue: @-import line missing

**Symptom**: Task switch doesn't change behavior

**Solution**:
1. Check `.claude/CLAUDE.md`: `grep '@import' .claude/CLAUDE.md`
2. If missing, run: `/task-init`
3. Verify format: `@import ~/.claude/projects/<project-id>/tasks/<task-id>/CLAUDE.md`

---

## License

MIT License - see LICENSE file for details

---

## Acknowledgments

- Claude Code team at Anthropic for the extensibility features
- Boris Cherny for the multi-instance workflow inspiration
- Community contributors and testers

**Built with ❤️ for the Claude Code community**