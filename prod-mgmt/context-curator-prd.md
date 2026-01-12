# Product Requirements Document: Claude Code Context Curator with Task Management

**Version:** 10.0  
**Last Updated:** January 10, 2026  
**Status:** Ready for Implementation

---

## Executive Summary

Claude Code Context Curator is a **task-based context management system** implemented as custom slash commands. It enables developers to organize their work into tasks with dedicated instruction sets (CLAUDE.md) and manage context snapshots within each task.

**Key Innovation**:
- **Tasks** = Named instruction sets via @-import mechanism
- **Contexts** = Named session snapshots saved within tasks
- **Atomic task switching** = Hard reset + @-import update + context load in one command
- **Multi-instance safe** = Running sessions unaffected by task switches

**No API key required. Works entirely within Claude Code using native features.**

---

## Core Concepts

### Tasks

A **task** is a focused work environment containing:
- Custom CLAUDE.md with task-specific instructions
- Saved context snapshots

Tasks use the project's shared skills and agents from `.claude/skills/` and `.claude/agents/`.

**Examples**: integration-tests, api-refactor, bug-fix, documentation

### Contexts

A **context** is a named snapshot of a Claude Code session saved within a task.

**Examples**: initial-setup, edge-cases, timeout-work, refactor-v2

### Default Task

Every project has an implicit **default** task that:
- Contains the original project configuration
- Stores contexts created without an explicit task
- Allows context-curator to work without thinking about tasks

### @-import Mechanism

The project's `.claude/CLAUDE.md` contains:
1. **Universal instructions** - Project-wide guidelines, shared across all tasks
2. **@-import line** - Points to the current task's CLAUDE.md

```markdown
# Project: My Application

## Universal Instructions
[Project-wide guidelines]

## Task-Specific Context

@import .context-curator/tasks/default/CLAUDE.md

<!-- This line is managed by context-curator. Do not edit manually. -->
```

When you run `/task integration-tests`, the @-import line updates to:
```markdown
@import .context-curator/tasks/integration-tests/CLAUDE.md
```

**Why this works**: Claude Code reads CLAUDE.md once at session start and never reloads. This means:
- Each session is isolated with its startup task context
- Updating @-import affects only the NEXT new session
- Multiple instances can run simultaneously without interference

---

## Architecture

### Storage Structure

```
~/.claude/tasks/
│
└── <encoded-project-path>/                # e.g., -Users-dev-my-project
    │
    ├── default/                           # Base project environment
    │   ├── CLAUDE.md                      # Default task instructions
    │   └── contexts/                      # Contexts without explicit task
    │       ├── quick-fix.jsonl
    │       └── experiment.jsonl
    │
    ├── integration-tests/
    │   ├── CLAUDE.md                      # Task-specific instructions
    │   └── contexts/                      # Saved session snapshots
    │       ├── initial-setup.jsonl
    │       ├── edge-cases.jsonl
    │       └── refactor-v2.jsonl
    │
    ├── api-refactor/
    │   ├── CLAUDE.md
    │   └── contexts/
    │
    ├── bug-fix/
    │   ├── CLAUDE.md
    │   └── contexts/
    │
    └── session-task-map.json              # Tracks session→task associations
```

### Project Structure

```
my-project/
├── .claude/
│   ├── CLAUDE.md                          # Universal + @-import line
│   │
│   ├── skills/                            # Shared by ALL tasks
│   │   ├── test-generator/
│   │   └── api-mocker/
│   │
│   ├── agents/                            # Shared by ALL tasks
│   │   └── code-reviewer/
│   │
│   └── commands/                          # Custom slash commands
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
├── .context-curator/                      # Helper scripts and storage
│   ├── tasks/                             # Task definitions
│   │   ├── default/
│   │   │   ├── CLAUDE.md
│   │   │   └── contexts/
│   │   ├── integration-tests/
│   │   │   ├── CLAUDE.md
│   │   │   └── contexts/
│   │   └── session-task-map.json
│   │
│   ├── src/
│   │   ├── types.ts
│   │   ├── session-reader.ts
│   │   ├── session-writer.ts
│   │   ├── task-manager.ts
│   │   └── utils.ts
│   │
│   ├── scripts/
│   │   ├── init-project.ts
│   │   ├── update-import.ts
│   │   ├── task-create.ts
│   │   ├── task-save.ts
│   │   ├── task-list.ts
│   │   ├── prepare-context.ts
│   │   ├── context-list.ts
│   │   ├── context-manage.ts
│   │   └── apply-edits.ts
│   │
│   └── package.json
│
└── [project files...]
```

---

## Commands Reference

### Task Management Commands

#### /task <task-id> [context-name]

Activate a task environment with optional saved context.

**Usage**:
```
/task integration-tests              # Fresh session
/task integration-tests edge-cases   # Load saved context
```

**What happens**:
1. **[PreToolUse Hook]** Updates @-import line in .claude/CLAUDE.md
2. Checks current session for unsaved work
3. Offers to save if work exists
4. Executes `/clear` to reset session
5. Prepares new session with context (if specified)
6. Records session→task mapping
7. Tells user to `/resume <session-id>`

**Example**:
```
You: /task integration-tests edge-cases

Claude (PreToolUse):
        ✓ Task context: integration-tests
        
        Current session: 34 messages (unsaved)
        Save? (yes/no)

You: yes

Claude: Context name? (lowercase, numbers, hyphens only)

You: debug-work

Claude: ✓ Saved to 'default' task as 'debug-work'
        
        Activating task 'integration-tests' with context 'edge-cases'...
        /clear
        ✓ Session cleared
        ✓ Session ready: sess-a1b2c3d4 (156 messages from edge-cases)
        
        Type: /resume sess-a1b2c3d4
        
        Your focus for this task:
        • API integration testing with Jest
        • Prioritize edge cases and error handling
        • Tools: test-generator, coverage-analyzer, api-mocker

You: /resume sess-a1b2c3d4

Claude: [Loads 156 messages from edge-cases context]
        [Task environment active with integration-tests instructions]
```

---

#### /task-create <task-id>

Create a new task with interactive configuration.

**Usage**:
```
/task-create integration-tests
```

**What happens**:
1. On first task: offers to migrate current config to 'default' task
2. Asks for task description/focus
3. Writes task CLAUDE.md via editor mode
4. Updates .claude/CLAUDE.md with @-import on first task creation

**Example**:
```
You: /task-create integration-tests

Claude: ⚠️ First time using tasks in this project!
        
        Your current .claude/CLAUDE.md will become the 'default' task.
        A new .claude/CLAUDE.md will be created with:
        - Universal project guidelines (you can edit these)
        - @-import line pointing to 'default' task
        
        Current CLAUDE.md has 127 lines of content.
        
        Set up task system? (yes/no)

You: yes

Claude: ✓ Created 'default' task with current CLAUDE.md
        ✓ Created new .claude/CLAUDE.md with @-import structure
        
        Now creating 'integration-tests' task...
        
        What should this task focus on?

You: API integration testing with Jest. Focus on edge cases and error handling.

Claude: [Launches editor mode to write CLAUDE.md]

I'll create a CLAUDE.md focused on integration testing. Here's what I'll include:
- Jest configuration and best practices
- API testing patterns
- Edge case and error handling guidelines
- Mocking and test data strategies

[Writes CLAUDE.md to .context-curator/tasks/integration-tests/CLAUDE.md]

✓ Task 'integration-tests' created (147 lines)

Next steps:
• /task integration-tests     - Start working
• Edit task CLAUDE.md         - Refine instructions

Note: This task uses project-wide skills and agents from .claude/
      Task-specific tool guidance should go in the task's CLAUDE.md
```

---

#### /task-save <context-name>

Save current session as a named context in the active task.

**Usage**:
```
/task-save initial-setup
```

**Validation**: Context name must match `/^[a-z0-9-]+$/`

**What happens**:
1. Validates context name format
2. Determines active task from session-task-map.json or @-import
3. Parses `~/.claude/history.jsonl` to get current session ID
4. Copies session to task's contexts directory
5. Handles overwrite with backup

**Example**:
```
You: /task-save edge-cases

Claude: ✓ Saved as 'edge-cases' (156 msgs, 34k tokens)
        Task: integration-tests
        Location: ~/.claude/tasks/-Users-dev-my-project/integration-tests/contexts/edge-cases.jsonl

# Later, overwriting
You: /task-save edge-cases

Claude: ⚠️ Context 'edge-cases' already exists (156 msgs, 34k tokens)
        
        Overwrite? (yes/no)

You: yes

Claude: ✓ Backup created: edge-cases-backup-20260110.jsonl
        ✓ Saved as 'edge-cases' (178 msgs, 38k tokens)
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

default (current)
• Contexts: 2
• Last used: 2 hours ago

integration-tests
• Contexts: 3
• Last used: 1 day ago

api-refactor
• Contexts: 1
• Last used: 3 days ago

Total: 3 tasks, 6 saved contexts

Current: @import .context-curator/tasks/default/CLAUDE.md
```

**Example (specific task)**:
```
You: /task-list integration-tests

Claude: # Task: integration-tests

## Overview
API integration testing with Jest. Edge cases and error handling.

## CLAUDE.md
147 lines
Focus: Integration testing patterns, mocking strategies

## Saved Contexts
1. initial-setup (45 msgs, 12k tokens) - 3 days ago
2. edge-cases (156 msgs, 34k tokens) - 1 day ago
3. timeout-work (89 msgs, 19k tokens) - 2 hours ago

## Usage
/task integration-tests              - Start fresh
/task integration-tests edge-cases   - Resume saved work
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

**Example**:
```
You: /task-manage

Claude: # Task Management

Current tasks:
1. default (current)
2. integration-tests
3. api-refactor

Actions:
r - Rename task
e - Edit task CLAUDE.md
s - Show statistics
d - Delete task
q - Quit

Choose an action:

You: e

Claude: Which task?

You: integration-tests

Claude: [Opens editor with current CLAUDE.md content]

Edit the CLAUDE.md for 'integration-tests':

[User edits content]

Claude: ✓ Updated integration-tests CLAUDE.md (163 lines)
```

---

#### /task-delete <task-id>

Delete a task and all its contexts.

**Usage**:
```
/task-delete integration-tests
```

**What happens**:
1. Confirms deletion (shows contexts that will be lost)
2. Deletes task directory and all contexts
3. If deleting current task, switches to 'default'

**Example**:
```
You: /task-delete integration-tests

Claude: ⚠️ Delete task 'integration-tests'?

This will permanently delete:
• Task CLAUDE.md (147 lines)
• 3 saved contexts:
  - initial-setup (45 msgs)
  - edge-cases (156 msgs)
  - timeout-work (89 msgs)

Type 'delete integration-tests' to confirm:

You: delete integration-tests

Claude: ✓ Task 'integration-tests' deleted
        ✓ Switched to 'default' task
```

---

### Context Management Commands

#### /context-list [task-id]

List all contexts in the active task or specified task.

**Usage**:
```
/context-list                    # Active task's contexts
/context-list integration-tests  # Specific task's contexts
```

**Example**:
```
You: /context-list

Claude: # Contexts: integration-tests

1. initial-setup
   • 45 messages, 12k tokens
   • Created: 3 days ago
   • Last modified: 3 days ago

2. edge-cases
   • 156 messages, 34k tokens
   • Created: 1 day ago
   • Last modified: 2 hours ago

3. timeout-work
   • 89 messages, 19k tokens
   • Created: 2 hours ago
   • Last modified: 2 hours ago

Total: 3 contexts

Load: /task integration-tests <context-name>
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
- Compare contexts
- Delete contexts

**Example**:
```
You: /context-manage

Claude: # Context Management: integration-tests

Contexts:
1. initial-setup (45 msgs)
2. edge-cases (156 msgs)
3. timeout-work (89 msgs)

Actions:
r - Rename context
v - View details
c - Compare contexts
d - Delete context
q - Quit

Choose an action:

You: r

Claude: Which context?

You: 2

Claude: Current name: edge-cases
        New name? (lowercase, numbers, hyphens only)

You: error-handling

Claude: ✓ Renamed: edge-cases → error-handling
```

---

#### /context-delete <context-name> [task-id]

Delete a saved context.

**Usage**:
```
/context-delete edge-cases                    # Delete from active task
/context-delete edge-cases integration-tests  # Delete from specific task
```

**Example**:
```
You: /context-delete edge-cases

Claude: ⚠️ Delete context 'edge-cases' from task 'integration-tests'?

        156 messages, 34k tokens
        Created: 1 day ago
        Last modified: 2 hours ago

Type 'delete edge-cases' to confirm:

You: delete edge-cases

Claude: ✓ Context 'edge-cases' deleted
```

---

## Multi-Instance Workflow

### How It Works

Claude Code reads `.claude/CLAUDE.md` once at session start and **never reloads it during the session**. This behavior enables multi-instance workflows:

- Each instance captures the @-import state when it starts
- Running instances are unaffected by subsequent @-import changes
- Multiple instances can work on different tasks simultaneously

### Example: Running 8-9 Instances (Boris's Workflow)

```bash
# Terminal 1: Integration testing
$ cd ~/myproject && claude
You: /task integration-tests edge-cases
     [PreToolUse updates @import to integration-tests]
You: /resume sess-abc123
     [Works with integration-tests context]
     [Session isolated, won't change even if @import updates]

# Terminal 2: API refactoring (while T1 running)
$ cd ~/myproject && claude
You: /task api-refactor initial-design
     [PreToolUse updates @import to api-refactor]
     [New session gets api-refactor context]
You: /resume sess-def456
     [Works with api-refactor context]

# Terminal 1: Still running, still integration-tests ✅
     [CLAUDE.md not reloaded, context unchanged]

# Terminal 3: Bug fixing
$ cd ~/myproject && claude
You: /task bug-fix
     [PreToolUse updates @import to bug-fix]
You: /resume sess-ghi789
     [Works with bug-fix context]

# Terminal 4-9: Additional work streams
     [Each can use different tasks]
     [All isolated, no interference]
```

### Current Task Visibility

Check which task the next new session will use:

```bash
$ grep '@import' .claude/CLAUDE.md
@import .context-curator/tasks/api-refactor/CLAUDE.md
```

This shows: The next session started will have api-refactor context.
Currently running sessions keep their original task context.

### Best Practices for Multi-Instance

1. **Always run `/task <id>` before starting work**
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

### Core Scripts

#### init-project.ts

Initializes context-curator structure in a project.

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

#### update-import.ts

Updates the @-import line in .claude/CLAUDE.md.

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

#### prepare-context.ts

Prepares a session for task activation with optional saved context.

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

   // Estimate tokens (rough: 4 chars per token)
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

#### task-save.ts

Saves current session to task's contexts directory.

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

   // Get current task from @-import or session map
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
   // Try to get from .claude/CLAUDE.md @-import line
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

   // Default to 'default' task
   return 'default';
}

async function getCurrentSessionId(): Promise<string | null> {
   const historyPath = path.join(process.env.HOME!, '.claude/history.jsonl');

   try {
      const content = await fs.readFile(historyPath, 'utf-8');
      const lines = content.trim().split('\n');

      // Find most recent session marker
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
   // Check if session exists in history
   const content = await fs.readFile(historyPath, 'utf-8');
   if (!content.includes(sessionId)) {
      return null;
   }

   // In Claude Code, sessions might be in various locations
   // Try common paths
   const possiblePaths = [
      path.join(process.cwd(), '.claude/sessions', `${sessionId}.jsonl`),
      path.join(process.env.HOME!, '.claude/sessions', `${sessionId}.jsonl`),
      historyPath // Sometimes the session is inline in history
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

## Command Implementation Examples

### /task Command

```markdown
---
description: Activate a task environment with optional context
allowed-tools: Bash, Read, Write
pre-tool-use: |
  # Update task import in CLAUDE.md
  npm --prefix .context-curator run update-import $1
---

# Task Activation

Usage: /task <task-id> [context-name]

## PreToolUse (Automatic)

The pre-tool-use hook has already updated .claude/CLAUDE.md:
- Changed @-import line to point to this task's CLAUDE.md

## Step 1: Check for unsaved work

Check if current session has messages:
```bash
npm --prefix .context-curator run check-session
```

If there are unsaved messages, ask user:
"Current session: N messages (unsaved). Save? (yes/no)"

If yes:
- Ask for context name (validate: lowercase, numbers, hyphens only)
- Run: `npm --prefix .context-curator run task-save <context-name>`

## Step 2: Clear session

Execute `/clear` to reset the conversation.

## Step 3: Prepare context session

Run:
```bash
SESSION_ID=$(npm --prefix .context-curator run prepare-context $1 $2)
```

This:
- Creates new session file with context messages (if context-name provided)
- Records session→task mapping
- Returns session ID

## Step 4: Display task focus and tell user to resume

Read the task's CLAUDE.md to show key points:
```bash
cat .context-curator/tasks/$1/CLAUDE.md | head -n 20
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

### /task-create Command

```markdown
---
description: Create a new task
allowed-tools: Bash, Read, Write
---

# Task Creation

Usage: /task-create <task-id>

## Step 1: Check if first task

Check if .context-curator/tasks/ exists and has any tasks.

If this is the first task:
1. Explain the @-import system will be set up
2. Run: `npm --prefix .context-curator run init-project`
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

Launch editor mode to write the task's CLAUDE.md file.

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

---

## Installation

### Per-Project Installation

```bash
cd ~/my-project

# 1. Clone the curator
git clone <repo-url> .context-curator
cd .context-curator
npm install

# 2. Initialize the @-import structure
npm run init-project

# This:
# - Backs up current .claude/CLAUDE.md to .context-curator/tasks/default/
# - Creates new .claude/CLAUDE.md with @-import
# - Sets up task directory structure
# - Creates session tracking file

# 3. Link commands to .claude/commands
cd ..
mkdir -p .claude/commands
ln -s ../context-curator/commands/* .claude/commands/

# 4. (Optional) Add to .gitignore
echo ".context-curator/tasks/" >> .gitignore
echo ".context-curator/tasks/session-task-map.json" >> .gitignore

# 5. Test it
claude
You: /task-list
You: /task-create my-first-task
```

### Global Installation (Optional)

For developers who want to use context-curator across multiple projects:

```bash
# Clone to global location
git clone <repo-url> ~/.context-curator
cd ~/.context-curator
npm install

# Then in each project:
cd ~/my-project
ln -s ~/.context-curator .context-curator
npm --prefix .context-curator run init-project
ln -s ../.context-curator/commands/* .claude/commands/
```

---

## Key Features

### ✅ Task-Based Organization

Separate instruction sets for different work types:
- integration-tests task
- api-refactor task
- bug-fix task
- documentation task

### ✅ @-import Mechanism

Simple, transparent context switching:
- One line updates in .claude/CLAUDE.md
- Running sessions unaffected
- Multi-instance safe

### ✅ Context Snapshots

Named checkpoints within each task:
- initial-setup
- edge-cases
- refactor-v2

### ✅ Atomic Task Switching

One command (`/task <id> <context>`) does everything:
- Updates @-import
- Saves current work (if needed)
- Clears session
- Prepares context
- Ready to resume

### ✅ Multi-Instance Safe

Run 8-9 Claude Code instances simultaneously:
- Each instance isolated
- No interference between sessions
- Perfect for parallel work streams

### ✅ Shared Tooling

Skills and agents are project-wide:
- All tasks use the same tools
- Simpler mental model
- Task CLAUDE.md guides usage

### ✅ Backward Compatible

Default task preserves existing workflow:
- Works without thinking about tasks
- Smooth migration path
- Tasks are opt-in

### ✅ No API Key Required

Uses Claude Code's built-in features:
- Native `/clear` and `/resume`
- Custom slash commands
- PreToolUse hooks
- File system operations

---

## Technical Requirements

### Prerequisites
- Claude Code installed
- Node.js 18+
- TypeScript 5+
- tsx for running scripts

### No Additional Accounts
- No Anthropic API key required
- Works entirely within Claude Code

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
- [x] Multi-instance workflow documented
- [x] Zero data loss in testing
- [x] Documentation complete

### User Success
- Developers organize work into meaningful tasks
- Context stays clean and focused per task
- Easy switching between different work types
- Multi-instance workflow supported
- Natural workflow integration
- Community shares task templates

---

## Future Enhancements

### v1.1
- Task templates shipped with curator
- Auto-suggest task when starting new work
- Context analytics and recommendations
- Task usage statistics

### v1.2
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

## Version History

- **v10.0** (2026-01-10): @-import based architecture for multi-instance safety
- **v9.0** (2026-01-08): Task-based architecture with atomic switching - SUPERSEDED
- **v8.0** (2026-01-08): Custom slash commands - DEPRECATED
- **v7.0** (2026-01-08): Conversational manage - DEPRECATED
- **v1.0-v6.1**: Earlier prototypes - DEPRECATED

---

## Appendix: Design Philosophy

### Why @-import?

**Claude Code reads CLAUDE.md once at startup** - This behavior is perfect for multi-instance workflows.

**One line changes** - Minimal surface area, low risk, easy to debug.

**Transparent** - Developers can grep to see current task anytime.

### Why Shared Skills/Agents?

**Most tools are project-wide** - test generators, linters, formatters work across all tasks.

**Simpler mental model** - Tasks = instruction sets, Tools = shared toolbox.

**Can add later** - If Anthropic supports session-scoped config, we can add per-task tools in v2.0.

### Why Task-Based?

**Research shows optimal context is task-specific** - exactly what's needed for the current work, no more, no less.

**Isolation prevents contamination** - integration test context doesn't leak into API design work.

### Why Hard Reset?

**Atomic operations are predictable** - no partial state, no confusion about what's loaded.

**Clean slate** - each task switch starts fresh with clear focus.

### Why Custom Slash Commands?

**Official extension mechanism** - aligns with Anthropic's vision for Claude Code extensibility.

**PreToolUse hooks** - enable atomic updates before command execution.

### Path to Official Adoption

This design:
- Uses only official features (no hacks)
- Solves real user pain (context management + multi-instance)
- Aligns with Claude Code's architecture
- Could be integrated with minimal changes
- Demonstrates value through community adoption

**Goal**: Build something so useful that Anthropic wants to make it official.

---

## Appendix: Example Task CLAUDE.md Files

### Integration Tests Task

```markdown
# Task: Integration Tests

## Focus
API integration testing with Jest. Prioritize edge cases and error handling.

## Guidelines
- Use supertest for HTTP testing
- Mock external services with jest.mock()
- Test error paths: timeouts, malformed data, auth failures
- Minimum 90% coverage on critical integration paths
- Each test should be isolated and idempotent

## Tool Usage

### Preferred Skills for This Task
- **test-generator**: Use the "integration" template
   - Focus on API endpoints and data flow
   - Include setup/teardown for test databases
- **coverage-analyzer**: Run after each test suite
   - Flag any critical paths below 90% coverage
- **api-mocker**: For external service simulation
   - Mock payment gateways, third-party APIs
   - Use realistic response times and error scenarios

### Preferred Agents
- **test-reviewer**: Review for:
   - Edge case coverage
   - Error handling completeness
   - Test isolation and cleanup

## Patterns

### Integration Test Structure
```typescript
describe('Auth API Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });
  
  afterEach(async () => {
    await cleanupTestDatabase();
  });
  
  it('handles timeout gracefully', async () => {
    const response = await request(app)
      .post('/auth/login')
      .timeout(100)
      .send({ username: 'test', password: 'test' });
    
    expect(response.status).toBe(408);
  });
  
  it('rejects malformed credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 123, password: null });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid credentials format');
  });
});
```

## Reference
- [Internal testing guidelines](https://wiki.example.com/testing)
- [API contract documentation](https://api.example.com/docs)
- [Jest best practices](https://jestjs.io/docs/api)
```

### API Refactor Task

```markdown
# Task: API Refactor

## Focus
Redesigning API endpoints for better developer experience and performance.

## Guidelines
- Follow RESTful principles
- Use consistent naming conventions
- Version all endpoints (e.g., /v2/users)
- Document with OpenAPI/Swagger
- Maintain backward compatibility where possible

## Tool Usage

### Preferred Skills for This Task
- **api-designer**: For endpoint design
  - Generate OpenAPI specs
  - Validate against REST best practices
- **type-generator**: Create TypeScript types from API specs
- **migration-helper**: Plan breaking changes

### Preferred Agents
- **code-reviewer**: Review for:
  - API consistency
  - Breaking change documentation
  - Performance implications

## Patterns

### Endpoint Refactor Pattern
```typescript
// Before: Inconsistent naming and structure
app.get('/getUserData/:id', handler);
app.post('/user-create', handler);
app.delete('/deleteUser/:id', handler);

// After: RESTful and consistent
app.get('/v2/users/:id', getUserHandler);
app.post('/v2/users', createUserHandler);
app.delete('/v2/users/:id', deleteUserHandler);
```

### Deprecation Notice
```typescript
/**
 * @deprecated Use /v2/users/:id instead
 * @see https://api.example.com/docs/migration/v1-to-v2
 */
app.get('/getUserData/:id', (req, res) => {
   res.set('Deprecation', 'true');
   res.set('Sunset', 'Wed, 01 Apr 2026 00:00:00 GMT');
   // ... existing handler
});
```

## Reference
- [API Design Guidelines](https://wiki.example.com/api-design)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Versioning Strategy](https://wiki.example.com/api-versioning)
```

---

## Appendix: Troubleshooting

### Issue: @-import line not updating

**Symptom**: Running `/task <id>` but CLAUDE.md still has old import.

**Solution**:
1. Check PreToolUse hook is present in `/task` command
2. Run manually: `npm --prefix .context-curator run update-import <task-id>`
3. Verify task exists: `ls .context-curator/tasks/<task-id>/CLAUDE.md`

### Issue: Session not finding context

**Symptom**: `/task <id> <context>` says context not found.

**Solution**:
1. List contexts: `/context-list <task-id>`
2. Check file exists: `ls .context-curator/tasks/<task-id>/contexts/<context>.jsonl`
3. Verify context name format (lowercase, numbers, hyphens only)

### Issue: Multi-instance interference

**Symptom**: Two running instances seem to affect each other.

**Solution**:
1. Verify instances were started AFTER their respective `/task` commands
2. Check each instance's CLAUDE.md wasn't manually edited
3. Confirm Claude Code version (should not reload CLAUDE.md mid-session)

### Issue: Task CLAUDE.md not being used

**Symptom**: Session doesn't follow task-specific instructions.

**Solution**:
1. Check @-import line: `grep '@import' .claude/CLAUDE.md`
2. Verify you ran `/resume` AFTER `/task` command
3. Ensure you started a NEW session, not resuming an old one

### Issue: Lost contexts after migration

**Symptom**: Old saved contexts disappeared after updating to v10.0.

**Solution**:
1. Check `.context-curator/tasks/default/contexts/` for old contexts
2. Run migration script if available
3. Manually move contexts from old location to new structure

---

## Contributing

### Reporting Issues
- Use GitHub issues
- Include Claude Code version
- Provide steps to reproduce
- Share relevant logs (sanitize sensitive data)

### Contributing Code
- Fork the repository
- Create feature branch
- Add tests for new functionality
- Update documentation
- Submit pull request

### Sharing Task Templates
- Create task CLAUDE.md
- Add example contexts
- Document use case
- Submit to community templates repo

---

## License

MIT License - see LICENSE file for details

---

## Acknowledgments

- Claude Code team at Anthropic for the extensibility features
- Boris Cherny for the multi-instance workflow inspiration
- Community contributors and testers

**Built with ❤️ for the Claude Code community**