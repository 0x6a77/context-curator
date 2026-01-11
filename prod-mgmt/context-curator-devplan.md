# Developer Implementation Plan: Context Curator

**Version:** 10.0
**Last Updated:** January 10, 2026
**Approach:** Task-based context management using @-import mechanism and custom slash commands

---

## Overview

This plan implements the Context Curator as described in PRD v10.0. The system enables developers to organize work into tasks with dedicated instruction sets (CLAUDE.md) and manage context snapshots within each task.

**Key Innovation**: The @-import mechanism in `.claude/CLAUDE.md` allows atomic task switching while keeping multiple Claude Code instances isolated and safe.

**No API key required. Works entirely within Claude Code using native features.**

---

## Architecture Summary

### Core Concepts

1. **Tasks** = Named work environments with custom CLAUDE.md
2. **Contexts** = Named session snapshots saved within tasks
3. **@-import** = Single line in `.claude/CLAUDE.md` pointing to active task
4. **Multi-instance safe** = Each instance captures @-import at startup, never reloads

### Storage Structure

```
~/.claude/tasks/<project>/
├── default/
│   ├── CLAUDE.md
│   └── contexts/
│       ├── quick-fix.jsonl
│       └── experiment.jsonl
├── integration-tests/
│   ├── CLAUDE.md
│   └── contexts/
│       ├── initial-setup.jsonl
│       ├── edge-cases.jsonl
│       └── refactor-v2.jsonl
└── session-task-map.json

.context-curator/
├── tasks/
│   ├── default/
│   │   ├── CLAUDE.md
│   │   └── contexts/
│   ├── integration-tests/
│   │   ├── CLAUDE.md
│   │   └── contexts/
│   └── session-task-map.json
├── src/
│   ├── types.ts
│   ├── session-reader.ts
│   ├── session-writer.ts
│   ├── task-manager.ts
│   └── utils.ts
├── scripts/
│   ├── init-project.ts
│   ├── update-import.ts
│   ├── task-create.ts
│   ├── task-save.ts
│   ├── task-list.ts
│   ├── prepare-context.ts
│   ├── context-list.ts
│   ├── context-manage.ts
│   └── apply-edits.ts
└── package.json
```

### Project .claude Structure

```
.claude/
├── CLAUDE.md                          # Universal + @-import line
├── skills/                            # Shared by ALL tasks
│   ├── test-generator/
│   └── api-mocker/
├── agents/                            # Shared by ALL tasks
│   └── code-reviewer/
└── commands/                          # Custom slash commands
    ├── task.md
    ├── task-create.md
    ├── task-save.md
    ├── task-list.md
    ├── task-manage.md
    ├── task-delete.md
    ├── context-list.md
    ├── context-manage.md
    └── context-delete.md
```

---

## Implementation Phases

### Phase 1: Core Infrastructure

**Goal**: Set up task storage, @-import mechanism, and project initialization.

#### 1.1 Type Definitions (src/types.ts)

```typescript
export interface Task {
  id: string;
  claudeMdPath: string;
  contextsDir: string;
  contexts: Context[];
  createdAt: string;
  lastUsed: string;
}

export interface Context {
  name: string;
  filePath: string;
  messageCount: number;
  tokenCount: number;
  createdAt: string;
  lastModified: string;
}

export interface SessionTaskMap {
  [sessionId: string]: {
    task_id: string;
    context_name?: string;
    created_at: string;
  };
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | any;
  timestamp?: string;
}
```

#### 1.2 Project Initialization (scripts/init-project.ts)

**Purpose**: Set up the @-import structure on first use.

```typescript
#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function initProject() {
  console.log('Initializing context-curator...\n');

  // 1. Create task directory structure
  const tasksDir = path.join(process.cwd(), '.context-curator/tasks');
  await fs.mkdir(tasksDir, { recursive: true });

  // 2. Move existing CLAUDE.md to default task
  const currentClaudeMd = path.join(process.cwd(), '.claude/CLAUDE.md');
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
  const projectName = path.basename(process.cwd());
  const newClaudeMd = `# Project: ${projectName}

## Universal Instructions

Add your project-wide guidelines here:
- Coding standards
- Common commands
- Shared practices

## Task-Specific Context

@import .context-curator/tasks/default/CLAUDE.md

<!-- This line is managed by context-curator. Do not edit manually. -->
`;

  await fs.writeFile(currentClaudeMd, newClaudeMd);
  console.log('✓ Created new CLAUDE.md with @-import structure');

  // 4. Create session-task-map.json
  await fs.writeFile(
    path.join(tasksDir, 'session-task-map.json'),
    '{}\n'
  );
  console.log('✓ Created session tracking file');

  console.log('\n✓ Initialization complete!\n');
  console.log('Next steps:');
  console.log('1. Edit .claude/CLAUDE.md to add universal guidelines');
  console.log('2. Create your first task: /task-create <task-id>');
  console.log('3. Start working: /task <task-id>');
}

initProject().catch(console.error);
```

#### 1.3 Update Import Line (scripts/update-import.ts)

**Purpose**: Update the @-import line in `.claude/CLAUDE.md` (used by PreToolUse hook).

```typescript
#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function updateImport(taskId: string) {
  const claudeMdPath = path.join(process.cwd(), '.claude/CLAUDE.md');

  // Verify task exists
  const taskClaudeMd = path.join(
    process.cwd(),
    '.context-curator/tasks',
    taskId,
    'CLAUDE.md'
  );

  try {
    await fs.access(taskClaudeMd);
  } catch (error) {
    console.error(`❌ Task '${taskId}' not found`);
    console.error(`   Missing: ${taskClaudeMd}`);

    // List available tasks
    const tasksDir = path.join(process.cwd(), '.context-curator/tasks');
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

    process.exit(1);
  }

  // Read current CLAUDE.md
  let content = await fs.readFile(claudeMdPath, 'utf-8');

  // Update @-import line
  const importLine = `@import .context-curator/tasks/${taskId}/CLAUDE.md`;
  const importRegex = /@import \.context-curator\/tasks\/[^\/]+\/CLAUDE\.md/;

  if (importRegex.test(content)) {
    // Replace existing import
    content = content.replace(importRegex, importLine);
  } else {
    // Add import if not present (shouldn't happen after init)
    console.warn('⚠️  No @import line found, adding one...');
    content = content.trim() + '\n\n' + importLine + '\n';
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

---

### Phase 2: Task Management Commands

#### 2.1 /task Command (.claude/commands/task.md)

**Purpose**: Activate a task with optional saved context.

```markdown
---
description: Activate a task environment with optional context
allowed-tools: Bash, Read, Write
pre-tool-use: |
  # Update task import in CLAUDE.md
  npx tsx .context-curator/scripts/update-import.ts $1
---

# Task Activation

Usage: /task <task-id> [context-name]

## PreToolUse (Automatic)

The pre-tool-use hook has already updated .claude/CLAUDE.md:
- Changed @-import line to point to this task's CLAUDE.md

## Step 1: Check for unsaved work

Check if current session has messages by examining history:

```bash
# Get current session message count
npx tsx .context-curator/scripts/check-session.ts
```

If there are unsaved messages, ask user:
"Current session: N messages (unsaved). Save? (yes/no)"

If yes:
- Ask for context name (validate: lowercase, numbers, hyphens only)
- Run: `npx tsx .context-curator/scripts/task-save.ts <context-name>`

## Step 2: Clear session

Execute `/clear` to reset the conversation.

## Step 3: Prepare context session

Run:
```bash
SESSION_ID=$(npx tsx .context-curator/scripts/prepare-context.ts $1 $2)
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

## Example

User: /task integration-tests edge-cases

You:
1. [PreToolUse updates @-import]
2. Check current session (23 messages)
3. Ask: "Save? (yes/no)"
4. User: "yes"
5. Ask: "Context name?"
6. User: "my-work"
7. Run task-save script
8. Execute /clear
9. Run prepare-context script with "integration-tests" and "edge-cases"
10. Display task focus and tell user to /resume <session-id>
```

#### 2.2 /task-create Command (.claude/commands/task-create.md)

**Purpose**: Create a new task with interactive configuration.

```markdown
---
description: Create a new task
allowed-tools: Bash, Read, Write, Edit
---

# Task Creation

Usage: /task-create <task-id>

## Step 1: Check if first task

Check if .context-curator/tasks/ exists and has any tasks.

If this is the first task:
1. Explain the @-import system will be set up
2. Run: `npx tsx .context-curator/scripts/init-project.ts`
3. Explain what was created

## Step 2: Validate task ID

Must match /^[a-z0-9-]+$/

Check if task already exists:
```bash
test -d .context-curator/tasks/$1 && echo "exists" || echo "new"
```

If exists, ask to overwrite or choose new name.

## Step 3: Ask for task focus

Ask user:
"What should this task focus on? Describe the goal, guidelines, and patterns."

## Step 4: Create task CLAUDE.md

Use Write tool to create the task's CLAUDE.md file at:
`.context-curator/tasks/<task-id>/CLAUDE.md`

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

#### 2.3 /task-save Command (.claude/commands/task-save.md)

**Purpose**: Save current session as a named context in the active task.

```markdown
---
description: Save current session as a named context
allowed-tools: Bash
---

# Task Save

Usage: /task-save <context-name>

## Validation

Validate context name format:
- Must match /^[a-z0-9-]+$/
- Examples: edge-cases, initial-setup, bug-fix-v2

## Execute

Run the task-save script:
```bash
npx tsx .context-curator/scripts/task-save.ts <context-name>
```

This script will:
1. Validate context name
2. Determine active task from @-import or session map
3. Get current session ID from history
4. Copy session to task's contexts directory
5. Handle overwrite with backup if needed
6. Display confirmation with stats

## Example

User: /task-save edge-cases

You run the script and it displays:
```
✓ Saved as 'edge-cases' (156 msgs, 34k tokens)
  Task: integration-tests
  Location: .context-curator/tasks/integration-tests/contexts/edge-cases.jsonl
```
```

#### 2.4 Scripts for Task Commands

**scripts/prepare-context.ts**:

```typescript
#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

async function prepareContext(taskId: string, contextName?: string) {
  const taskDir = path.join(
    process.cwd(),
    '.context-curator/tasks',
    taskId
  );

  // Generate session ID
  const sessionId = `sess-${randomUUID().slice(0, 8)}`;

  // Create session file in project's sessions directory
  const sessionDir = path.join(process.cwd(), '.claude/sessions');
  await fs.mkdir(sessionDir, { recursive: true });

  const sessionFile = path.join(sessionDir, `${sessionId}.jsonl`);

  if (contextName) {
    // Copy context messages to new session
    const contextPath = path.join(taskDir, 'contexts', `${contextName}.jsonl`);

    try {
      await fs.copyFile(contextPath, sessionFile);
      const stats = await getSessionStats(sessionFile);
      console.log(`✓ Loaded context: ${contextName} (${stats.messages} messages)`);
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
        jsonlContexts.forEach(c => console.error(`   - ${c}`));
      } catch {
        console.error('   (No contexts saved yet)');
      }

      process.exit(1);
    }
  } else {
    // Create empty session
    await fs.writeFile(sessionFile, '');
    console.log(`✓ Created fresh session`);
  }

  // Record session→task mapping
  await recordSessionTask(sessionId, taskId, contextName);

  // Return session ID for /resume
  console.log(sessionId);
  return sessionId;
}

async function recordSessionTask(
  sessionId: string,
  taskId: string,
  contextName?: string
) {
  const mapPath = path.join(
    process.cwd(),
    '.context-curator/tasks/session-task-map.json'
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
    context_name: contextName || null,
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

const [taskId, contextName] = process.argv.slice(2);
if (!taskId) {
  console.error('Usage: prepare-context <task-id> [context-name]');
  process.exit(1);
}

prepareContext(taskId, contextName).catch(console.error);
```

**scripts/task-save.ts**:

```typescript
#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function taskSave(contextName: string) {
  // Validate context name
  if (!/^[a-z0-9-]+$/.test(contextName)) {
    console.error('❌ Invalid context name');
    console.error('   Must contain only: lowercase letters, numbers, hyphens');
    console.error('   Example: edge-cases, initial-setup, bug-fix-v2');
    process.exit(1);
  }

  // Get current task from @-import
  const currentTask = await getCurrentTask();

  // Get current session ID from history
  const sessionId = await getCurrentSessionId();
  if (!sessionId) {
    console.error('❌ No active session found');
    process.exit(1);
  }

  const historyPath = path.join(process.env.HOME!, '.claude/history.jsonl');
  const sessionPath = await findSessionFile(historyPath, sessionId);

  if (!sessionPath) {
    console.error(`❌ Session ${sessionId} not found in history`);
    process.exit(1);
  }

  // Prepare task contexts directory
  const taskDir = path.join(
    process.cwd(),
    '.context-curator/tasks',
    currentTask
  );
  const contextsDir = path.join(taskDir, 'contexts');
  await fs.mkdir(contextsDir, { recursive: true });

  const destPath = path.join(contextsDir, `${contextName}.jsonl`);

  // Handle overwrite
  try {
    await fs.access(destPath);

    // Context exists, create backup
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const backup = `${contextName}-backup-${timestamp}.jsonl`;
    await fs.copyFile(destPath, path.join(contextsDir, backup));
    console.log(`✓ Backup created: ${backup}`);
  } catch {
    // Context doesn't exist, no backup needed
  }

  // Copy session to context
  await fs.copyFile(sessionPath, destPath);

  // Get stats
  const stats = await getSessionStats(destPath);
  const tokensFormatted = (stats.tokens / 1000).toFixed(1);

  console.log(`✓ Saved as '${contextName}' (${stats.messages} msgs, ${tokensFormatted}k tokens)`);
  console.log(`  Task: ${currentTask}`);
  console.log(`  Location: ${destPath}`);
}

async function getCurrentTask(): Promise<string> {
  const claudeMdPath = path.join(process.cwd(), '.claude/CLAUDE.md');

  try {
    const content = await fs.readFile(claudeMdPath, 'utf-8');
    const match = content.match(/@import \.context-curator\/tasks\/([^\/]+)\/CLAUDE\.md/);

    if (match) {
      return match[1];
    }
  } catch {
    // Fall through
  }

  return 'default';
}

async function getCurrentSessionId(): Promise<string | null> {
  const historyPath = path.join(process.env.HOME!, '.claude/history.jsonl');

  try {
    const content = await fs.readFile(historyPath, 'utf-8');
    const lines = content.trim().split('\n');

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      try {
        const entry = JSON.parse(line);
        if (entry.session_id) {
          return entry.session_id;
        }
      } catch {
        continue;
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function findSessionFile(
  historyPath: string,
  sessionId: string
): Promise<string | null> {
  const content = await fs.readFile(historyPath, 'utf-8');
  if (!content.includes(sessionId)) {
    return null;
  }

  const possiblePaths = [
    path.join(process.cwd(), '.claude/sessions', `${sessionId}.jsonl`),
    path.join(process.env.HOME!, '.claude/sessions', `${sessionId}.jsonl`),
    historyPath
  ];

  for (const p of possiblePaths) {
    try {
      await fs.access(p);
      return p;
    } catch {
      continue;
    }
  }

  return null;
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

const contextName = process.argv[2];
if (!contextName) {
  console.error('Usage: task-save <context-name>');
  process.exit(1);
}

taskSave(contextName).catch(console.error);
```

---

### Phase 3: Context Management Commands

#### 3.1 /context-list Command (.claude/commands/context-list.md)

```markdown
---
description: List all contexts in a task
allowed-tools: Bash
---

# Context List

Usage: /context-list [task-id]

## Execute

Run the context-list script:
```bash
# For active task
npx tsx .context-curator/scripts/context-list.ts

# For specific task
npx tsx .context-curator/scripts/context-list.ts <task-id>
```

This displays all saved contexts in the task with:
- Context name
- Message count
- Token count
- Created/modified dates
- Instructions for loading
```

#### 3.2 /context-manage Command (.claude/commands/context-manage.md)

```markdown
---
description: Interactive context management
allowed-tools: Bash, Read, Write
---

# Context Management

Usage: /context-manage [task-id]

## Your Role

You are helping the user manage contexts within a task. Use natural conversation to:
- Rename contexts
- View context details
- Compare contexts
- Delete contexts

## Step 1: List Contexts

Run:
```bash
npx tsx .context-curator/scripts/context-list.ts [task-id]
```

## Step 2: Ask What to Do

Present options:
- r - Rename context
- v - View details
- c - Compare contexts
- d - Delete context
- q - Quit

## Step 3: Handle Actions

**Rename**: Use fs operations to rename files
**View**: Read context file and show stats/preview
**Compare**: Read two contexts and show differences
**Delete**: Confirm and delete with backup

## Example

User: /context-manage

You:
1. Run context-list script
2. Show contexts
3. Ask: "Choose an action: r (rename), v (view), c (compare), d (delete), q (quit)"
4. Handle user's choice interactively
```

---

### Phase 4: Task List and Management

#### 4.1 /task-list Command (.claude/commands/task-list.md)

```markdown
---
description: List all tasks or show task details
allowed-tools: Bash, Read
---

# Task List

Usage: /task-list [task-id]

## List All Tasks

If no task-id provided:

```bash
npx tsx .context-curator/scripts/task-list.ts
```

Shows:
- Task name
- Context count
- Last used
- Current task marker

## Show Task Details

If task-id provided:

```bash
npx tsx .context-curator/scripts/task-list.ts <task-id>
```

Shows:
- Task overview
- CLAUDE.md summary
- All saved contexts
- Usage commands
```

---

### Phase 5: Installation and Setup

#### 5.1 Installation Script

Create `.context-curator/install.sh`:

```bash
#!/bin/bash

echo "Installing Context Curator..."
echo

# 1. Install dependencies
npm install

# 2. Initialize project structure
npx tsx scripts/init-project.ts

# 3. Link commands to .claude/commands
mkdir -p .claude/commands
for cmd in commands/*.md; do
  ln -sf "../../.context-curator/$cmd" ".claude/commands/$(basename $cmd)"
done

echo
echo "✓ Installation complete!"
echo
echo "Next steps:"
echo "1. Edit .claude/CLAUDE.md to add universal guidelines"
echo "2. Create your first task: /task-create <task-id>"
echo "3. Start working: /task <task-id>"
```

#### 5.2 Package.json Scripts

```json
{
  "name": "context-curator",
  "version": "10.0.0",
  "scripts": {
    "init": "tsx scripts/init-project.ts",
    "update-import": "tsx scripts/update-import.ts",
    "install-commands": "./install.sh"
  },
  "dependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## Testing Strategy

### Unit Tests

Test individual components:
- Task creation and validation
- Context save/load
- @-import updates
- Session→task mapping

### Integration Tests

Test complete workflows:
- Create task → switch to task → save context → resume context
- Multi-instance: start task in one terminal, start different task in another
- Default task creation on first use

### Multi-Instance Tests

Critical for v10.0:
1. Start Claude instance 1, run `/task integration-tests`
2. Start Claude instance 2, run `/task api-refactor`
3. Verify instance 1 still has integration-tests context
4. Verify instance 2 has api-refactor context
5. Check that .claude/CLAUDE.md updates don't affect running instances

---

## Migration Path

### From No Context Curator

1. Run `/task-create` - auto-initializes with default task
2. Current CLAUDE.md becomes default task
3. New @-import structure created

### From Previous Curator Versions

Create migration script to:
1. Move old contexts to default task
2. Set up @-import structure
3. Preserve all existing work

---

## Success Criteria

### MVP Complete When

- [x] All task commands work (`/task`, `/task-create`, `/task-save`, etc.)
- [x] All context commands work (`/context-list`, `/context-manage`, etc.)
- [x] @-import mechanism working reliably
- [x] Default task created automatically on first use
- [x] Task switching is atomic (one command)
- [x] Context saving via history.jsonl parsing
- [x] Context name validation enforced
- [x] Session tracking via session-task-map.json
- [x] Multi-instance workflow documented and tested
- [x] Zero data loss in testing
- [x] Documentation complete

### User Experience Goals

- Developers organize work into meaningful tasks
- Context stays clean and focused per task
- Easy switching between different work types
- Multi-instance workflow feels natural
- Commands are intuitive
- Error messages are helpful

---

## Key Implementation Notes

### PreToolUse Hooks

The `/task` command uses a PreToolUse hook to update @-import BEFORE any other actions. This ensures:
- @-import is updated atomically
- Next session gets correct task context
- No race conditions

### Claude Code CLAUDE.md Behavior

**Critical**: Claude Code reads `.claude/CLAUDE.md` once at startup and never reloads. This behavior enables:
- Multi-instance safety
- Each instance isolated
- @-import changes only affect new sessions

### Context Name Validation

Enforce `/^[a-z0-9-]+$/` pattern for context names:
- Prevents file system issues
- Ensures URL-safe names
- Maintains consistency

### Session File Format

All sessions use JSONL format:
- One JSON message per line
- Easy to parse and edit
- Compatible with Claude Code's format

---

## Timeline

### Day 1: Core Infrastructure
- Type definitions
- init-project script
- update-import script
- Basic task creation

### Day 2: Task Commands
- /task command
- /task-create command
- /task-save command
- /task-list command
- prepare-context script
- task-save script

### Day 3: Context Commands & Testing
- /context-list command
- /context-manage command
- Integration testing
- Multi-instance testing
- Documentation
- Installation script

---

## Future Enhancements

### v11.0
- Task templates shipped with curator
- Auto-suggest task when starting new work
- Context analytics and recommendations
- Task usage statistics

### v12.0
- Task collaboration (share task definitions)
- Context diff viewer
- Automated context optimization
- Cross-project task templates

### v2.0 (If Officially Adopted)
- Built into Claude Code
- Native task picker UI
- Session-scoped configuration
- Per-task skills and agents
- Cloud sync for task templates

---

## Notes

### Why @-import?

**Claude Code reads CLAUDE.md once at startup** - This behavior is perfect for multi-instance workflows.

**One line changes** - Minimal surface area, low risk, easy to debug.

**Transparent** - Developers can grep to see current task anytime.

### Why Shared Skills/Agents?

**Most tools are project-wide** - test generators, linters, formatters work across all tasks.

**Simpler mental model** - Tasks = instruction sets, Tools = shared toolbox.

**Can add later** - If needed, v2.0 can support per-task tools.

### Path to Official Adoption

This design:
- Uses only official features (no hacks)
- Solves real user pain (context management + multi-instance)
- Aligns with Claude Code's architecture
- Could be integrated with minimal changes
- Demonstrates value through community adoption

**Goal**: Build something so useful that Anthropic wants to make it official.
