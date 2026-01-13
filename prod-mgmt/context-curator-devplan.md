# Developer Implementation Plan: Context Curator v10.0

**Version:** 10.1
**Last Updated:** January 13, 2026
**Status:** Ready for Implementation
**Based on:** PRD v10.0 + Global Installation Updates

---

## Executive Summary

This plan implements the task-based context management system described in PRD v10.0. The key innovation is the **@-import mechanism** that enables atomic task switching and multi-instance safety by leveraging Claude Code's startup behavior.

**Core Architecture:**
- **Tasks** = Named instruction sets via @-import in .claude/CLAUDE.md
- **Contexts** = Named session snapshots within tasks
- **Atomic switching** = Hard reset + @-import update + context load
- **Multi-instance safe** = Running sessions unaffected by @-import changes

**No API key required. Works entirely within Claude Code using native features.**

---

## Implementation Overview

### Phase 1: Foundation (Critical Path)
1. Project initialization system
2. Task storage structure
3. @-import mechanism
4. Default task creation

### Phase 2: Task Commands (Core Functionality)
1. /task command with PreToolUse hook
2. /task-create command
3. /task-save command
4. /task-list command

### Phase 3: Context Commands (Secondary)
1. /context-list command
2. Context management utilities

### Phase 4: Advanced Features (Optional)
1. /task-manage command
2. /task-delete command
3. /context-manage command
4. /context-delete command

---

## Storage Architecture

### Global Storage Structure

**All task data is stored globally in `~/.claude/projects/<project-id>/`:**

```
~/.claude/
├── context-curator/                      # Installed scripts and source
│   ├── scripts/
│   ├── src/
│   ├── node_modules/
│   └── package.json
│
├── commands/
│   └── task/                             # Installed commands
│
└── projects/                             # ← All task data
    ├── -Users-dev-my-project/            # Encoded project path
    │   ├── tasks/
    │   │   ├── default/
    │   │   │   ├── CLAUDE.md
    │   │   │   └── contexts/
    │   │   │       └── default-default.jsonl
    │   │   │
    │   │   ├── integration-tests/
    │   │   │   ├── CLAUDE.md
    │   │   │   └── contexts/
    │   │   │       ├── initial-setup.jsonl
    │   │   │       ├── edge-cases.jsonl
    │   │   │       └── refactor-v2.jsonl
    │   │   │
    │   │   └── api-refactor/
    │   │       ├── CLAUDE.md
    │   │       └── contexts/
    │   │
    │   ├── session-task-map.json
    │   └── config.json
    │
    └── -Users-dev-other-project/
        └── tasks/
```

### Project Structure (Minimal Modification)

**We ONLY modify `.claude/CLAUDE.md` in the project:**

```
my-project/
├── .claude/
│   ├── CLAUDE.md                         # ← ONLY file we modify (@-import line)
│   ├── skills/                           # ← User's skills (UNTOUCHED)
│   └── agents/                           # ← User's agents (UNTOUCHED)
│
├── src/
├── tests/
└── package.json
```

**Key principle**: We ONLY touch `.claude/CLAUDE.md` to update the @-import line. All task state lives in `~/.claude/projects/<project-id>/`.

### Project ID Encoding

The project ID is the project path with slashes replaced by hyphens:

```
/Users/dev/my-project → -Users-dev-my-project
/home/user/code/app   → -home-user-code-app
```

### Why Global Storage?

1. **Minimal project modification**: Only `.claude/CLAUDE.md` is touched
2. **No .gitignore needed**: Task data isn't in the project directory
3. **Centralized management**: All task data in one location (`~/.claude/projects/`)
4. **Easier backups**: Backup `~/.claude/projects/` to backup all task data
5. **Cleaner projects**: No `.context-curator/` directory cluttering projects

---

## Installation Architecture

### Global Installation Model

Context Curator uses a **global installation** approach - install once, use everywhere.

**Repository Structure:**

```
context-curator/                          # Repository (for development/installation)
├── commands/
│   └── task/                             # Slash command definitions (source)
│       ├── task.md
│       ├── task-create.md
│       ├── task-save.md
│       ├── task-list.md
│       ├── task-manage.md
│       ├── task-delete.md
│       ├── context-list.md
│       ├── context-manage.md
│       └── context-delete.md
│
├── scripts/                              # TypeScript scripts (source)
│   ├── init-project.ts
│   ├── update-import.ts
│   ├── check-session.ts
│   ├── prepare-context.ts
│   ├── task-save.ts
│   ├── task-list.ts
│   ├── context-list.ts
│   ├── get-current-task.ts
│   └── apply-edits.ts
│
├── src/                                  # Source modules
│   ├── types.ts
│   ├── session-reader.ts
│   ├── session-writer.ts
│   ├── task-manager.ts
│   └── utils.ts
│
├── install.sh                            # Installation script
├── package.json
├── tsconfig.json
└── README.md
```

**Installation:**

```bash
# Clone and install globally (one time)
git clone <repo-url> context-curator
cd context-curator
./install.sh
```

**What install.sh does:**

1. **Copies necessary files** to `~/.claude/context-curator/`:
   - `scripts/*.ts` → `~/.claude/context-curator/scripts/`
   - `src/*.ts` → `~/.claude/context-curator/src/`
   - `package.json` → `~/.claude/context-curator/`
   - `tsconfig.json` → `~/.claude/context-curator/`

2. **Installs dependencies** in `~/.claude/context-curator/`:
   ```bash
   cd ~/.claude/context-curator
   npm install
   ```

3. **Installs commands** to `~/.claude/commands/task/`:
   - Copies `commands/task/*.md` → `~/.claude/commands/task/`

**What does NOT get installed:**
- `.git/` - No git history
- `README.md`, `prod-mgmt/`, docs - No documentation
- `install.sh` - Installer not copied
- Source `commands/` directory - Only final commands copied

**Installed Structure:**

```
~/.claude/
├── context-curator/                      # Globally installed (clean)
│   ├── scripts/                          # TypeScript scripts
│   │   ├── init-project.ts
│   │   ├── update-import.ts
│   │   ├── prepare-context.ts
│   │   ├── task-save.ts
│   │   └── [other scripts...]
│   ├── src/                              # Source modules
│   │   ├── task-manager.ts
│   │   ├── session-reader.ts
│   │   ├── session-writer.ts
│   │   └── utils.ts
│   ├── node_modules/                     # Installed dependencies
│   ├── package.json
│   └── tsconfig.json
│
└── commands/
    └── task/                             # Commands (global)
        ├── task.md
        ├── task-create.md
        ├── task-save.md
        ├── task-list.md
        └── [other commands...]
```

### Script Access from Commands

Commands reference scripts using **absolute paths**:

```bash
# In command definitions (commands/task/*.md):
npx tsx ~/.claude/context-curator/scripts/update-import.ts $1
npx tsx ~/.claude/context-curator/scripts/task-save.ts <context-name>
npx tsx ~/.claude/context-curator/scripts/prepare-context.ts $1 $2
```

This works because:
1. Commands execute from the current project directory
2. Scripts are at a fixed global location (`~/.claude/context-curator/`)
3. `npx tsx` executes TypeScript files directly
4. Scripts can import from `~/.claude/context-curator/src/` modules
5. Works from any project directory

### Key Design Points

1. **One installation, works everywhere**: Install once to `~/.claude/`, use in all projects
2. **Clean installation**: Only necessary files copied (scripts, source, configs)
3. **Global commands**: Available in all Claude Code sessions
4. **Absolute paths**: Commands reference `~/.claude/context-curator/scripts/`
5. **Session management**: Use `claude -r context-curator` for setup/management tasks

---

## Session Management Pattern

**IMPORTANT:** Context Curator uses a **two-session model** to keep management activities separate from real work:

### Curator Session (`claude -r context-curator`)

Use for **managing** your work:
- Creating tasks (`/task-create`)
- Saving contexts (`/task-save`)
- Listing tasks/contexts (`/task-list`, `/context-list`)
- Managing tasks/contexts (`/task-manage`, `/context-manage`, `/task-delete`, `/context-delete`)

**Purpose:** Meta-work - organizing and curating your development activities

### Normal Work Session (`claude`)

Use for **doing** your work:
- Switching tasks (`/task <task-id>`)
- Resuming with contexts (`/task <task-id> <context-name>`)
- Writing code, fixing bugs, implementing features

**Purpose:** Actual development work

### Why Separate Sessions?

1. **Prevents pollution**: Management activities don't clutter work sessions
2. **Clean histories**: Work sessions contain only relevant work, not setup overhead
3. **Clear mental model**: Setup activities are distinct from development
4. **Better context**: Saved work sessions capture only the work, not meta-discussion

### Workflow Pattern

```bash
# 1. Setup (curator session)
claude -r context-curator
/task-create integration-tests
# Exit

# 2. Work (normal session)
claude
/task integration-tests
/resume <session-id>
# ... do work ...
# Exit

# 3. Save (curator session)
claude -r context-curator
/task-save edge-cases
# Exit

# 4. Resume later (normal session)
claude
/task integration-tests edge-cases
/resume <session-id>
```

---

## Phase 1: Foundation

### 1.1 Project Initialization (init-project.ts)

**Purpose:** Set up the @-import structure on first use

**Implementation:**

```typescript
#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function initProject() {
  console.log('Initializing context-curator...\n');
  
  const cwd = process.cwd();
  const projectPath = cwd;
  
  // 1. Encode project path to create project ID
  // /Users/dev/my-project → -Users-dev-my-project
  const projectId = projectPath.replace(/\//g, '-');
  console.log(`Project: ${projectPath}`);
  console.log(`Project ID: ${projectId}\n`);
  
  // 2. Create project directory structure in ~/.claude/projects/
  const projectDir = path.join(process.env.HOME!, '.claude/projects', projectId);
  const tasksDir = path.join(projectDir, 'tasks');
  const defaultTaskDir = path.join(tasksDir, 'default');
  
  await fs.mkdir(defaultTaskDir, { recursive: true });
  await fs.mkdir(path.join(defaultTaskDir, 'contexts'), { recursive: true });
  console.log(`✓ Created project directory: ${projectDir}`);
  
  // 3. Backup existing CLAUDE.md to default task
  const currentClaudeMd = path.join(cwd, '.claude/CLAUDE.md');
  
  try {
    const content = await fs.readFile(currentClaudeMd, 'utf-8');
    await fs.writeFile(
      path.join(defaultTaskDir, 'CLAUDE.md'),
      content
    );
    console.log('✓ Backed up current CLAUDE.md to default task');
  } catch {
    await fs.writeFile(
      path.join(defaultTaskDir, 'CLAUDE.md'),
      '# Default Task\n\nGeneral development work.\n'
    );
    console.log('✓ Created default task CLAUDE.md');
  }
  
  // 4. Create new CLAUDE.md with @-import
  const projectName = path.basename(cwd);
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
  
  // 5. Create default-default context (empty)
  const defaultContext = path.join(defaultTaskDir, 'contexts/default-default.jsonl');
  await fs.writeFile(defaultContext, '');
  console.log('✓ Created default-default context');
  
  // 6. Create session-task-map.json
  await fs.writeFile(
    path.join(projectDir, 'session-task-map.json'),
    '{}\n'
  );
  
  // 7. Create config.json
  await fs.writeFile(
    path.join(projectDir, 'config.json'),
    JSON.stringify({ projectPath, projectId, createdAt: new Date().toISOString() }, null, 2)
  );
  console.log('✓ Created session tracking and config files');
  
  console.log('\n✓ Initialization complete!\n');
  console.log('Next steps:');
  console.log('1. Edit .claude/CLAUDE.md to add universal guidelines');
  console.log('2. Create your first task: /task-create <task-id>');
  console.log('3. Start working: /task <task-id>');
}

initProject().catch(console.error);
```

**Testing:**
- [ ] Encodes project path correctly to project ID
- [ ] Creates `~/.claude/projects/<project-id>/` directory structure
- [ ] Creates `~/.claude/projects/<project-id>/tasks/default/` directory
- [ ] Backs up existing CLAUDE.md to default task
- [ ] Creates new CLAUDE.md with @-import pointing to global storage
- [ ] Creates default-default.jsonl context
- [ ] Creates session-task-map.json and config.json
- [ ] Handles missing CLAUDE.md gracefully
- [ ] Only modifies `.claude/CLAUDE.md` in project (no other project files touched)
- [ ] Idempotent (safe to run multiple times)

---

### 1.2 @-import Update Script (update-import.ts)

**Purpose:** Update the @-import line in .claude/CLAUDE.md

**Implementation:**

```typescript
#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function updateImport(taskId: string) {
  const cwd = process.cwd();
  const projectId = cwd.replace(/\//g, '-');
  const claudeMdPath = path.join(cwd, '.claude/CLAUDE.md');
  
  // Verify task exists in ~/.claude/projects/<project-id>/tasks/
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
    const tasksDir = path.join(process.env.HOME!, '.claude/projects', projectId, 'tasks');
    try {
      const tasks = await fs.readdir(tasksDir);
      const validTasks = [];
      
      for (const task of tasks) {
        const taskPath = path.join(tasksDir, task);
        const stats = await fs.stat(taskPath);
        if (stats.isDirectory() && task !== 'node_modules') {
          validTasks.push(task);
        }
      }
      
      if (validTasks.length > 0) {
        console.error('\nAvailable tasks:');
        validTasks.forEach(t => console.error(`   - ${t}`));
      }
    } catch {
      console.error('\nNo tasks directory found. Run /task-init first.');
    }
    
    process.exit(1);
  }
  
  // Read current CLAUDE.md
  let content = await fs.readFile(claudeMdPath, 'utf-8');
  
  // Update @-import line to point to global storage
  const importLine = `@import ~/.claude/projects/${projectId}/tasks/${taskId}/CLAUDE.md`;
  const importRegex = /@import ~\/\.claude\/projects\/[^\/]+\/tasks\/[^\/]+\/CLAUDE\.md/;
  
  if (importRegex.test(content)) {
    // Replace existing import
    content = content.replace(importRegex, importLine);
  } else {
    // Add import if not present (shouldn't happen after init)
    console.warn('⚠️  No @import line found, adding one...');
    content = content.trim() + '\n\n' + importLine + '\n\n<!-- This line is managed by context-curator. Do not edit manually. -->\n';
  }
  
  await fs.writeFile(claudeMdPath, content);
  
  console.log(`✓ Task context: ${taskId}`);
}

const taskId = process.argv[2];
if (!taskId) {
  console.error('Usage: update-import <task-id>');
  process.exit(1);
}

updateImport(taskId).catch(console.error);
```

**Testing:**
- [ ] Updates @-import line correctly
- [ ] Validates task exists before updating
- [ ] Lists available tasks on error
- [ ] Handles missing @-import line
- [ ] Preserves other CLAUDE.md content

---

### 1.3 Task Manager Utilities (task-manager.ts)

**Purpose:** Core utilities for task operations

**Implementation:**

```typescript
import fs from 'fs/promises';
import path from 'path';

export interface Task {
  id: string;
  claudeMdPath: string;
  contextsDir: string;
  contexts: string[];
  lastUsed?: Date;
}

export async function getTasksDir(): Promise<string> {
  const cwd = process.cwd();
  const projectId = cwd.replace(/\//g, '-');
  return path.join(process.env.HOME!, '.claude/projects', projectId, 'tasks');
}

export async function listTasks(): Promise<Task[]> {
  const tasksDir = await getTasksDir();

  try {
    const entries = await fs.readdir(tasksDir);
    const tasks: Task[] = [];

    for (const entry of entries) {
      const taskPath = path.join(tasksDir, entry);
      const stats = await fs.stat(taskPath);

      if (stats.isDirectory()) {
        const claudeMdPath = path.join(taskPath, 'CLAUDE.md');
        const contextsDir = path.join(taskPath, 'contexts');

        try {
          await fs.access(claudeMdPath);

          // List contexts
          let contexts: string[] = [];
          try {
            const contextFiles = await fs.readdir(contextsDir);
            contexts = contextFiles
              .filter(f => f.endsWith('.jsonl'))
              .map(f => f.replace('.jsonl', ''));
          } catch {
            // No contexts directory yet
          }

          tasks.push({
            id: entry,
            claudeMdPath,
            contextsDir,
            contexts,
            lastUsed: stats.mtime
          });
        } catch {
          // Not a valid task (missing CLAUDE.md)
        }
      }
    }

    return tasks.sort((a, b) => {
      if (!a.lastUsed) return 1;
      if (!b.lastUsed) return -1;
      return b.lastUsed.getTime() - a.lastUsed.getTime();
    });
  } catch {
    return [];
  }
}

export async function taskExists(taskId: string): Promise<boolean> {
  const tasksDir = await getTasksDir();
  const taskPath = path.join(tasksDir, taskId, 'CLAUDE.md');

  try {
    await fs.access(taskPath);
    return true;
  } catch {
    return false;
  }
}

export async function getCurrentTask(): Promise<string> {
  const claudeMdPath = path.join(process.cwd(), '.claude/CLAUDE.md');

  try {
    const content = await fs.readFile(claudeMdPath, 'utf-8');
    // Match: @import ~/.claude/projects/<project-id>/tasks/<task-id>/CLAUDE.md
    const match = content.match(/@import ~\/\.claude\/projects\/[^\/]+\/tasks\/([^\/]+)\/CLAUDE\.md/);

    if (match) {
      return match[1];
    }
  } catch {
    // Fall through
  }

  return 'default';
}

export async function validateContextName(name: string): boolean {
  return /^[a-z0-9-]+$/.test(name);
}
```

**Testing:**
- [ ] Lists all valid tasks
- [ ] Sorts by last used
- [ ] Validates task existence
- [ ] Extracts current task from CLAUDE.md
- [ ] Validates context names correctly

---

## Phase 2: Task Commands

### 2.1 /task Command (commands/task.md)

**Purpose:** Activate a task environment with optional context

**Implementation:**

```markdown
---
description: Activate a task environment with optional context
allowed-tools: Bash, Read, Write
pre-tool-use: |
  # Update task import in CLAUDE.md
  npx tsx ~/.claude/context-curator/scripts/update-import.ts $1
---

# Task Activation

Usage: /task <task-id> [context-name]

## PreToolUse (Automatic)

The pre-tool-use hook has already updated .claude/CLAUDE.md:
- Changed @-import line to point to this task's CLAUDE.md

## Step 1: Check for unsaved work

Check if current session has messages using the session reader:

```bash
npx tsx ~/.claude/context-curator/scripts/check-session.ts
```

If there are unsaved messages, ask user:
"Current session: N messages (unsaved). Save? (yes/no)"

If yes:
- Ask for context name (validate: lowercase, numbers, hyphens only)
- Run: `npx tsx ~/.claude/context-curator/scripts/task-save.ts <context-name>`

## Step 2: Clear session

Execute `/clear` to reset the conversation.

## Step 3: Prepare context session

Run:
```bash
SESSION_ID=$(npx tsx ~/.claude/context-curator/scripts/prepare-context.ts $1 $2)
```

This:
- Creates new session file with context messages (if context-name provided)
- Records session→task mapping
- Returns session ID

## Step 4: Display task focus and tell user to resume

Read the task's CLAUDE.md to show key points:
```bash
head -n 20 .context-curator/tasks/$1/CLAUDE.md
```

Display:
```
✓ Task context: $1
✓ Session ready: $SESSION_ID

Type: /resume $SESSION_ID

Your focus for this task:
• [Extract key points from task CLAUDE.md]
```

## Important Notes

- Always run PreToolUse first (automatic)
- Offer to save unsaved work
- Use /clear for hard reset
- Tell user to /resume (don't do it automatically)
- Running sessions are unaffected by this command
```

**Supporting Script: check-session.ts**

```typescript
#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function checkSession() {
  // Parse ~/.claude/history.jsonl to find current session
  const historyPath = path.join(process.env.HOME!, '.claude/history.jsonl');

  try {
    const content = await fs.readFile(historyPath, 'utf-8');
    const lines = content.trim().split('\n');

    // Count messages in current session
    let messageCount = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      try {
        const entry = JSON.parse(line);
        if (entry.type === 'session_start') {
          break;
        }
        if (entry.role === 'user' || entry.role === 'assistant') {
          messageCount++;
        }
      } catch {
        continue;
      }
    }

    console.log(messageCount);
  } catch {
    console.log(0);
  }
}

checkSession().catch(() => console.log(0));
```

**Testing:**
- [ ] PreToolUse hook updates @-import
- [ ] Checks for unsaved work
- [ ] Prompts to save if needed
- [ ] Validates context names
- [ ] Executes /clear successfully
- [ ] Prepares context session
- [ ] Displays task focus
- [ ] Provides /resume command

---

### 2.2 /task-create Command (commands/task-create.md)

**Purpose:** Create a new task with interactive configuration

**Implementation:**

```markdown
---
description: Create a new task
allowed-tools: Bash, Read, Write
---

# Task Creation

Usage: /task-create <task-id>

## Step 1: Check if first task

Check if .context-curator/tasks/ exists:

```bash
if [ ! -d .context-curator ]; then
  echo "first-time"
else
  echo "existing"
fi
```

If this is the first task:
1. Explain the @-import system will be set up
2. Run: `npx tsx ~/.claude/context-curator/scripts/init-project.ts`
3. Explain what was created

## Step 2: Validate task ID

Must match /^[a-z0-9-]+$/

Check if task already exists:
```bash
if [ -d .context-curator/tasks/$1 ]; then
  echo "exists"
else
  echo "new"
fi
```

If exists, ask to overwrite or choose new name.

## Step 3: Ask for task focus

Ask user:
"What should this task focus on? Describe the goal, guidelines, and patterns."

## Step 4: Create task CLAUDE.md

Write the task's CLAUDE.md file using the Write tool.

Structure:
```markdown
# Task: <task-id>

## Focus
[User's description]

## Guidelines
- [Key practices for this task]

## Tool Usage
### Preferred Skills for This Task
- **skill-name**: How to use it for this task

### Preferred Agents
- **agent-name**: When to use it

## Patterns
[Task-specific code patterns or examples]

## Reference
[Links to relevant documentation]
```

Write to: .context-curator/tasks/<task-id>/CLAUDE.md

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
• Focus: [summary of focus]
• [Line count] lines

Next steps:
• /task $1               - Start working
• Edit task CLAUDE.md    - Refine instructions
• /task-list             - See all tasks

Note: This task uses project-wide skills and agents from .claude/
      Task-specific tool guidance is in the task's CLAUDE.md
```
```

**Testing:**
- [ ] Detects first-time use
- [ ] Runs init-project on first use
- [ ] Validates task ID format
- [ ] Checks for existing tasks
- [ ] Creates task CLAUDE.md with proper structure
- [ ] Creates contexts directory
- [ ] Confirms creation with summary

---

### 2.3 /task-save Command (commands/task-save.md)

**Purpose:** Save current session as a named context

**Implementation:**

```markdown
---
description: Save current session as a named context
allowed-tools: Bash, Read, Write
---

# Task Save

Usage: /task-save <context-name>

## Step 1: Validate context name

Must match /^[a-z0-9-]+$/

If invalid, show error and examples.

## Step 2: Determine current task

Get from @-import line:
```bash
npx tsx ~/.claude/context-curator/scripts/get-current-task.ts
```

## Step 3: Get current session ID

Parse ~/.claude/history.jsonl to find current session ID.

## Step 4: Copy session to context

Find session file in `~/.claude/projects/<project-dir>/`:
```bash
npx tsx ~/.claude/context-curator/scripts/task-save.ts <context-name>
```

This script:
- Validates context name
- Determines current task
- Finds current session
- Copies to task's contexts directory
- Handles overwrite with backup

## Step 5: Confirm save

Display:
```
✓ Saved as '<context-name>' (N msgs, Xk tokens)
  Task: <task-id>
  Location: .context-curator/tasks/<task-id>/contexts/<context-name>.jsonl
```
```

**Supporting Script: task-save.ts** (from PRD)

**Testing:**
- [ ] Validates context name format
- [ ] Determines current task correctly
- [ ] Finds current session
- [ ] Copies session to contexts directory
- [ ] Handles overwrite with backup
- [ ] Shows confirmation with stats

---

### 2.4 /task-list Command (commands/task-list.md)

**Purpose:** List all tasks or show task details

**Implementation:**

```markdown
---
description: List all tasks or show task details
allowed-tools: Bash, Read
---

# Task List

Usage: /task-list [task-id]

## Without task-id: List all tasks

```bash
npx tsx ~/.claude/context-curator/scripts/task-list.ts
```

Display format:
```
# Available Tasks

default (current)
• Contexts: 2
• Last used: 2 hours ago

integration-tests
• Contexts: 3
• Last used: 1 day ago

Total: X tasks, Y saved contexts

Current: @import .context-curator/tasks/default/CLAUDE.md
```

## With task-id: Show task details

```bash
npx tsx ~/.claude/context-curator/scripts/task-list.ts <task-id>
```

Display format:
```
# Task: <task-id>

## Overview
[First few lines of task CLAUDE.md]

## CLAUDE.md
N lines
Focus: [Summary]

## Saved Contexts
1. context-name (N msgs, Xk tokens) - Y ago
2. ...

## Usage
/task <task-id>              - Start fresh
/task <task-id> <context>    - Resume saved work
```
```

**Supporting Script: task-list.ts**

```typescript
#!/usr/bin/env tsx

import { listTasks, getCurrentTask } from '../src/task-manager.js';
import fs from 'fs/promises';

async function main() {
  const taskId = process.argv[2];

  if (!taskId) {
    // List all tasks
    const tasks = await listTasks();
    const currentTask = await getCurrentTask();

    console.log('\n# Available Tasks\n');

    for (const task of tasks) {
      const isCurrent = task.id === currentTask;
      console.log(`${task.id}${isCurrent ? ' (current)' : ''}`);
      console.log(`• Contexts: ${task.contexts.length}`);
      if (task.lastUsed) {
        console.log(`• Last used: ${formatDate(task.lastUsed)}`);
      }
      console.log('');
    }

    const totalContexts = tasks.reduce((sum, t) => sum + t.contexts.length, 0);
    console.log(`Total: ${tasks.length} tasks, ${totalContexts} saved contexts\n`);
    console.log(`Current: @import .context-curator/tasks/${currentTask}/CLAUDE.md\n`);
  } else {
    // Show task details
    const tasks = await listTasks();
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      console.error(`❌ Task '${taskId}' not found`);
      process.exit(1);
    }

    console.log(`\n# Task: ${task.id}\n`);

    // Show CLAUDE.md overview
    const claudeMdContent = await fs.readFile(task.claudeMdPath, 'utf-8');
    const lines = claudeMdContent.split('\n');
    const focusSection = lines.slice(0, 5).join('\n');

    console.log('## Overview');
    console.log(focusSection);
    console.log('');

    console.log('## CLAUDE.md');
    console.log(`${lines.length} lines`);
    console.log('');

    // Show contexts
    console.log('## Saved Contexts');
    if (task.contexts.length === 0) {
      console.log('(No saved contexts yet)');
    } else {
      for (let i = 0; i < task.contexts.length; i++) {
        const context = task.contexts[i];
        console.log(`${i + 1}. ${context}`);
      }
    }
    console.log('');

    console.log('## Usage');
    console.log(`/task ${task.id}              - Start fresh`);
    console.log(`/task ${task.id} <context>    - Resume saved work`);
    console.log('');
  }
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
}

main().catch(console.error);
```

**Testing:**
- [ ] Lists all tasks with stats
- [ ] Shows current task indicator
- [ ] Displays task details when task-id provided
- [ ] Shows context count
- [ ] Formats dates nicely
- [ ] Handles no tasks gracefully

---

## Phase 3: Context Commands

### 3.1 /context-list Command (commands/context-list.md)

**Purpose:** List contexts in active or specified task

**Implementation:**

```markdown
---
description: List contexts in a task
allowed-tools: Bash, Read
---

# Context List

Usage: /context-list [task-id]

## Without task-id: Active task's contexts

```bash
npx tsx ~/.claude/context-curator/scripts/context-list.ts
```

## With task-id: Specific task's contexts

```bash
npx tsx ~/.claude/context-curator/scripts/context-list.ts <task-id>
```

Display format:
```
# Contexts: <task-id>

1. context-name
   • N messages, Xk tokens
   • Created: Y ago
   • Last modified: Z ago

2. ...

Total: N contexts

Load: /task <task-id> <context-name>
```
```

**Testing:**
- [ ] Lists contexts for active task
- [ ] Lists contexts for specified task
- [ ] Shows context stats
- [ ] Formats dates nicely
- [ ] Shows load command

---

### 3.2 prepare-context.ts Script

**Purpose:** Prepare session for task activation with optional context

**Implementation:** (from PRD lines 843-965)

**Testing:**
- [ ] Generates unique session ID
- [ ] Creates session file
- [ ] Copies context if specified
- [ ] Records session→task mapping
- [ ] Returns session ID
- [ ] Lists available contexts on error

---

## Phase 4: Advanced Features

### 4.1 /task-manage Command

**Purpose:** Interactive task management

**Features:**
- Rename tasks
- Edit task CLAUDE.md
- View task statistics
- Delete tasks

### 4.2 /task-delete Command

**Purpose:** Delete a task and all contexts

**Features:**
- Confirmation required
- Shows what will be deleted
- Switches to default if deleting current task

### 4.3 /context-manage Command

**Purpose:** Interactive context management

**Features:**
- Rename contexts
- View context details
- Compare contexts
- Delete contexts

### 4.4 /context-delete Command

**Purpose:** Delete a saved context

**Features:**
- Confirmation required
- Shows context stats before deletion

---

## Implementation Timeline

### Day 1: Foundation
- [ ] Implement init-project.ts
- [ ] Implement update-import.ts
- [ ] Implement task-manager.ts utilities
- [ ] Test @-import mechanism
- [ ] Verify multi-instance isolation

### Day 2: Core Commands
- [ ] Implement /task command with PreToolUse
- [ ] Implement /task-create command
- [ ] Implement /task-save command
- [ ] Implement /task-list command
- [ ] Implement prepare-context.ts
- [ ] Test task switching workflow

### Day 3: Context Commands & Polish
- [ ] Implement /context-list command
- [ ] Implement context-list.ts script
- [ ] Test context save/load workflow
- [ ] Write documentation
- [ ] End-to-end testing

### Optional (Day 4+): Advanced Features
- [ ] Implement /task-manage
- [ ] Implement /task-delete
- [ ] Implement /context-manage
- [ ] Implement /context-delete
- [ ] Additional testing

---

## Testing Strategy

### Installation Tests
- [ ] install.sh copies only necessary files (scripts, src, configs)
- [ ] Scripts installed to ~/.claude/context-curator/scripts/
- [ ] Source files installed to ~/.claude/context-curator/src/
- [ ] Commands installed to ~/.claude/commands/task/
- [ ] npm dependencies installed in ~/.claude/context-curator/
- [ ] Commands are accessible from Claude Code
- [ ] Scripts execute via npx tsx ~/.claude/context-curator/scripts/
- [ ] No .git, README, or other repo files copied
- [ ] Installation is clean and minimal

### Unit Tests
- [ ] Task manager utilities
- [ ] Session reader/writer
- [ ] @-import parsing
- [ ] Context name validation
- [ ] Script path resolution

### Integration Tests
- [ ] Full task creation workflow (in curator session)
- [ ] Task switching with context (in work session)
- [ ] Context save/load (save in curator, load in work)
- [ ] Multi-instance isolation
- [ ] Commands execute scripts via npx tsx ~/.claude/context-curator/scripts/
- [ ] Curator session isolation (management doesn't pollute work sessions)
- [ ] Work session isolation (work doesn't pollute curator session)

### End-to-End Tests
- [ ] Run install.sh from cloned repo
- [ ] Verify clean installation in ~/.claude/
- [ ] Start curator session: claude -r context-curator
- [ ] Initialize curator with /task-create
- [ ] Create multiple tasks (in curator session)
- [ ] Start work session: claude
- [ ] Switch between tasks (in work session)
- [ ] Do work and exit
- [ ] Save contexts (in curator session)
- [ ] Load contexts (in work session)
- [ ] Verify multi-instance safety
- [ ] Verify session isolation (curator vs work)
- [ ] Verify scripts execute from global location

---

## Success Criteria

### Technical
- [ ] @-import mechanism works reliably
- [ ] PreToolUse hooks execute correctly
- [ ] Task switching is atomic
- [ ] Context save/load preserves all messages
- [ ] Multi-instance isolation verified
- [ ] No data loss in any scenario
- [ ] TypeScript compilation clean

### User Experience
- [ ] Commands feel natural and intuitive
- [ ] Clear feedback at each step
- [ ] Error messages are helpful
- [ ] Default task "just works"
- [ ] Task switching is fast
- [ ] Context organization is clear

### Documentation
- [ ] All commands documented
- [ ] Multi-instance workflow explained
- [ ] Troubleshooting guide complete
- [ ] Example task templates provided
- [ ] Architecture clearly explained

---

## Key Design Principles

### 1. @-import is the Foundation

The entire system relies on Claude Code reading CLAUDE.md once at startup:
- Each instance captures the @-import state when it starts
- Running instances are never affected by subsequent changes
- This enables true multi-instance isolation

### 2. Atomic Operations

Task switching must be all-or-nothing:
1. Update @-import (PreToolUse)
2. Save current work (if needed)
3. Hard reset (/clear)
4. Prepare new session
5. Tell user to resume

No partial states, no confusion.

### 3. Default Task Simplicity

Users shouldn't need to think about tasks:
- Default task created automatically
- Works without any task commands
- Tasks are opt-in for organization

### 4. Shared Tooling

Skills and agents are project-wide:
- All tasks use the same tools
- Simpler mental model
- Task CLAUDE.md provides usage guidance

### 5. No API Key Required

Everything uses Claude Code's native features:
- PreToolUse hooks
- Custom slash commands
- File system operations
- Native /clear and /resume

---

## Migration Notes

### From Previous Versions

This is a **complete rewrite** from previous versions. The old conversational session management approach has been replaced with the task-based @-import system.

**Do not attempt to migrate old data.** Start fresh with v10.0.

### For New Projects

1. Install globally (one time):
   ```bash
   git clone <repo-url> context-curator
   cd context-curator
   ./install.sh
   ```

2. In any project, start using:
   ```bash
   cd ~/my-project
   claude -r context-curator
   /task-create my-first-task
   ```

3. On first use in a project, system auto-initializes with default task

---

## Troubleshooting

### Issue: @-import not updating

**Solution:**
- Verify PreToolUse hook in command definition
- Check task exists: `ls ~/.claude/projects/<project-id>/tasks/<task-id>/CLAUDE.md`
  (where <project-id> is your project path with slashes replaced by hyphens)
- Run manually: `npx tsx ~/.claude/context-curator/scripts/update-import.ts <task-id>`
- Verify @-import line format: `@import ~/.claude/projects/<project-id>/tasks/<task-id>/CLAUDE.md`

### Issue: Context not loading

**Solution:**
- List contexts: `/context-list <task-id>`
- Verify context exists: `ls ~/.claude/projects/<project-id>/tasks/<task-id>/contexts/<context>.jsonl`
- Check context name format (lowercase, numbers, hyphens only)
- Find your project ID: `echo $(pwd | sed 's/\//−/g')` (replace slashes with hyphens)

### Issue: Multi-instance interference

**Solution:**
- Verify instances were started AFTER their `/task` commands
- Confirm CLAUDE.md wasn't manually edited during session
- Restart affected instances

### Issue: Management tasks appearing in work sessions

**Solution:**
- Always use `claude -r context-curator` for management activities
- Use regular `claude` for actual development work
- This keeps sessions properly isolated

---

## Next Steps After MVP

### v1.1 Enhancements
- Task templates library
- Auto-suggest task for new work
- Context analytics
- Task usage statistics

### v1.2 Features
- Task collaboration (share definitions)
- Context diff viewer
- Automated optimization
- Cross-project templates

### v2.0 Vision (Official Adoption)
- Built into Claude Code
- Native task picker UI
- Session-scoped configuration
- Per-task skills and agents
- Cloud sync

---

## Appendix: File Checklist

### Scripts to Create (in scripts/)
- [x] scripts/init-project.ts
- [ ] scripts/update-import.ts
- [ ] scripts/check-session.ts
- [ ] scripts/prepare-context.ts
- [ ] scripts/task-save.ts (implementation in PRD)
- [ ] scripts/task-list.ts
- [ ] scripts/context-list.ts
- [ ] scripts/get-current-task.ts
- [ ] scripts/apply-edits.ts (for manage command)

### Commands to Create (in commands/task/)
- [ ] commands/task/task.md
- [ ] commands/task/task-create.md
- [ ] commands/task/task-save.md
- [ ] commands/task/task-list.md
- [ ] commands/task/context-list.md
- [ ] commands/task/task-manage.md (optional)
- [ ] commands/task/task-delete.md (optional)
- [ ] commands/task/context-manage.md (optional)
- [ ] commands/task/context-delete.md (optional)

### Source Files to Create (in src/)
- [ ] src/types.ts
- [ ] src/task-manager.ts
- [ ] src/session-reader.ts (may exist, verify compatibility)
- [ ] src/session-writer.ts (may exist, verify compatibility)
- [ ] src/utils.ts

### Installation Files
- [x] install.sh (installs to ~/.claude/ globally)
  - Copies scripts/*.ts to ~/.claude/context-curator/scripts/
  - Copies src/*.ts to ~/.claude/context-curator/src/
  - Copies package.json and tsconfig.json
  - Runs npm install in ~/.claude/context-curator/
  - Copies commands/task/*.md to ~/.claude/commands/task/
- [x] package.json (scripts and dependencies)
- [x] tsconfig.json (TypeScript configuration)

### Documentation to Update
- [x] README.md (global installation, session management pattern)
- [x] install.sh (session management guidance in output)
- [ ] ARCHITECTURE.md (global installation model, session isolation)
- [ ] TROUBLESHOOTING.md (session management issues)

---

## Final Notes

This plan implements PRD v10.0's vision of task-based context management with the @-import mechanism and global installation model. The architecture enables:

✅ **Global installation** - Install once to ~/.claude/, use everywhere
✅ **Clean installation** - Only necessary files copied (scripts, source, configs)
✅ **Session isolation** - Curator session for management, work session for development
✅ **Multi-instance safety** - Run 8-9 instances without interference
✅ **Atomic task switching** - Clean, predictable transitions
✅ **Simple mental model** - Tasks = instruction sets, Contexts = snapshots
✅ **No API key needed** - Uses only Claude Code native features
✅ **Backward compatible** - Default task preserves existing workflow

**Key Workflows:**

1. **Setup** (one time):
   ```bash
   git clone <repo> context-curator
   cd context-curator
   ./install.sh
   ```

2. **Create tasks** (curator session):
   ```bash
   claude -r context-curator
   /task-create <task-id>
   ```

3. **Do work** (normal session):
   ```bash
   claude
   /task <task-id>
   /resume <session-id>
   ```

4. **Save progress** (curator session):
   ```bash
   claude -r context-curator
   /task-save <context-name>
   ```

**Implementation is ready to begin. Follow the phases in order for best results.**
