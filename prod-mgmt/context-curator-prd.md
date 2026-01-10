# Product Requirements Document: Claude Code Context Curator with Task Management

**Version:** 9.0  
**Last Updated:** January 8, 2026  
**Status:** Ready for Implementation

---

## Executive Summary

Claude Code Context Curator is a **task-based context management system** implemented as custom slash commands. It enables developers to organize their work into tasks with dedicated environments (CLAUDE.md, skills, sub-agents) and manage context snapshots within each task.

**Key Innovation**:
- **Tasks** = Reusable work environments with specific tools and configuration
- **Contexts** = Named session snapshots saved within tasks
- **Atomic task switching** = Hard reset + environment swap + context load in one command

**No API key required. Works entirely within Claude Code using native features.**

---

## Core Concepts

### Tasks

A **task** is a complete work environment containing:
- Custom CLAUDE.md with task-specific instructions
- Selected skills from the library
- Selected sub-agents from the library
- Saved context snapshots

**Examples**: integration-tests, api-refactor, bug-fix, documentation

### Contexts

A **context** is a named snapshot of a Claude Code session saved within a task.

**Examples**: initial-setup, edge-cases, timeout-work, refactor-v2

### Default Task

Every project has an implicit **default** task that:
- Contains the original project configuration
- Stores contexts created without an explicit task
- Allows context-curator to work without thinking about tasks

### Library

A **library** is a collection of reusable skills and sub-agents that can be included in any task.

---

## Architecture

### Storage Structure

```
~/.claude/tasks/
│
├── library/                               # Reusable components
│   ├── skills/
│   │   ├── test-generator/
│   │   │   ├── skill.json
│   │   │   └── [skill files...]
│   │   ├── api-designer/
│   │   └── coverage-analyzer/
│   │
│   └── sub-agents/
│       ├── code-reviewer/
│       │   ├── agent.json
│       │   └── [agent files...]
│       └── test-reviewer/
│
└── <encoded-project-path>/                # e.g., -Users-dev-my-project
    │
    ├── default/                           # Base project environment
    │   ├── CLAUDE.md
    │   ├── skills/                        # Symlinks to original
    │   ├── agents/                        # Symlinks to original
    │   └── contexts/                      # Contexts without task
    │       ├── quick-fix.jsonl
    │       └── experiment.jsonl
    │
    ├── integration-tests/
    │   ├── CLAUDE.md                      # Task-specific instructions
    │   ├── skills/                        # Symlinks to library
    │   │   ├── test-generator -> ../../../library/skills/test-generator
    │   │   └── coverage-analyzer -> ...
    │   ├── agents/                        # Symlinks to library
    │   │   └── test-reviewer -> ../../../library/sub-agents/test-reviewer
    │   └── contexts/                      # Saved session snapshots
    │       ├── initial-setup.jsonl
    │       ├── edge-cases.jsonl
    │       └── refactor-v2.jsonl
    │
    ├── api-refactor/
    │   ├── CLAUDE.md
    │   ├── skills/
    │   ├── agents/
    │   └── contexts/
    │
    └── bug-fix/
        └── ...
```

### Project Structure

```
my-project/
├── .claude/
│   ├── CLAUDE.md                          # Active task's CLAUDE.md
│   ├── .current-task                      # Tracks active task
│   │
│   ├── skills/                            # Active task's skills
│   │   └── [symlinks to library]
│   │
│   ├── agents/                            # Active task's agents
│   │   └── [symlinks to library]
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
├── .context-curator/                      # Helper scripts
│   ├── src/
│   │   ├── types.ts
│   │   ├── session-reader.ts
│   │   ├── session-writer.ts
│   │   ├── task-manager.ts
│   │   └── utils.ts
│   │
│   ├── scripts/
│   │   ├── task-activate.ts
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
1. Checks current session for unsaved work
2. Offers to save if work exists
3. Executes `/clear` to reset session
4. Replaces project's CLAUDE.md, skills, and agents
5. If context specified: copies it to active session
6. Tells user to `/resume <session-id>`

**Example**:
```
You: /task integration-tests edge-cases

Claude: Current session: 34 messages (unsaved)
        Save? (yes/no)

You: yes

Claude: Context name? (lowercase, numbers, hyphens only)

You: debug-work

Claude: ✓ Saved to 'default' task as 'debug-work'
        
        Activating task 'integration-tests' with context 'edge-cases'...
        /clear
        ✓ Session cleared
        ✓ Project environment replaced:
          - CLAUDE.md: API integration testing focus
          - Skills: test-generator, coverage-analyzer, api-mocker
          - Agents: test-reviewer
        ✓ Context 'edge-cases' ready: sess-a1b2c3d4
        
        Type: /resume sess-a1b2c3d4

You: /resume sess-a1b2c3d4

Claude: [Loads 156 messages from edge-cases context]
        [Task environment active]
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
3. Shows library skills and agents for selection
4. Writes task CLAUDE.md
5. Creates task directory with symlinks

**Example**:
```
You: /task-create integration-tests

Claude: ⚠️ First time using tasks in this project!
        
        Your current .claude/ configuration will be moved to 'default' task.
        This preserves your setup and lets you switch back anytime.
        
        Current project has:
        - CLAUDE.md (127 lines)
        - 2 skills: api-helpers, testing-utils
        - 1 agent: code-reviewer
        
        Move to 'default' task? (yes/no)

You: yes

Claude: ✓ Created 'default' task with current config
        
        Now creating 'integration-tests' task...
        
        What should this task focus on?

You: API integration testing with Jest. Focus on edge cases and error handling.

Claude: [Launches editor mode to write CLAUDE.md]

I'll create a CLAUDE.md focused on integration testing. Here's what I'll include:
- Jest configuration and best practices
- API testing patterns
- Edge case and error handling guidelines
- Mocking and test data strategies

[Writes CLAUDE.md]

✓ CLAUDE.md created (147 lines)

Which skills from the library?

Available skills:
1. test-generator
2. coverage-analyzer
3. api-mocker
4. [add new skill]
5. [skip - no skills]

You: 1 2 3

Claude: ✓ Selected: test-generator, coverage-analyzer, api-mocker

Which agents?

Available agents:
1. code-reviewer
2. test-reviewer
3. [add new agent]
4. [skip - no agents]

You: 2

Claude: ✓ Selected: test-reviewer

✓ Task 'integration-tests' created!
  Location: ~/.claude/tasks/-Users-dev-my-project/integration-tests/
  • CLAUDE.md: 147 lines
  • Skills: test-generator, coverage-analyzer, api-mocker
  • Agents: test-reviewer

Activate with: /task integration-tests
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
2. Parses `~/.claude/history.jsonl` to get current session ID
3. Copies session to task's contexts directory
4. Handles overwrite with backup

**Example**:
```
You: /task-save edge-cases

Claude: ✓ Saved as 'edge-cases' (156 msgs, 34k tokens)
        Location: ~/.claude/tasks/-Users-dev-my-project/integration-tests/contexts/edge-cases.jsonl

# Later, overwriting
You: /task-save edge-cases

Claude: ⚠️ Context 'edge-cases' already exists (156 msgs, 34k tokens)
        
        Options:
        1. Overwrite (creates backup)
        2. Cancel
        
        Choose: 1

Claude: ✓ Backup: edge-cases-backup-20260108.jsonl
        ✓ Saved as 'edge-cases' (203 msgs, 45k tokens)

# Invalid name
You: /task-save "My Checkpoint"

Claude: ❌ Invalid context name: "My Checkpoint"
        
        Names must contain only:
        - Lowercase letters (a-z)
        - Numbers (0-9)
        - Hyphens (-)
        
        Examples: initial-setup, edge-cases, checkpoint-1
```

---

#### /task-list

List all tasks and show contexts for current task.

**Usage**:
```
/task-list
```

**Example**:
```
You: /task-list

Claude: Available tasks:
        
        • default (base project config)
        • integration-tests ← ACTIVE
        • api-refactor
        • bug-fix
        
        Contexts for 'integration-tests':
        - initial-setup (45 msgs, 12k tokens)
        - edge-cases (156 msgs, 34k tokens)
        - refactor-v2 (89 msgs, 21k tokens)
```

---

#### /task-manage <task-id>

Edit a task's configuration (CLAUDE.md, skills, agents).

**Usage**:
```
/task-manage integration-tests
```

**What happens**:
1. Shows current task configuration
2. Allows editing CLAUDE.md
3. Allows adding/removing skills
4. Allows adding/removing agents

**Example**:
```
You: /task-manage integration-tests

Claude: Task: integration-tests
        CLAUDE.md: 147 lines
        Skills: test-generator, coverage-analyzer, api-mocker
        Agents: test-reviewer
        
        What would you like to change?
        1. Edit CLAUDE.md
        2. Manage skills
        3. Manage agents
        4. Done

You: 2

Claude: Current skills:
        ✓ test-generator
        ✓ coverage-analyzer
        ✓ api-mocker
        
        Available in library:
        - api-designer
        - performance-profiler
        
        Add/remove? (add/remove/done)

You: add api-designer

Claude: ✓ Added api-designer
        
        Updated skills:
        ✓ test-generator
        ✓ coverage-analyzer
        ✓ api-mocker
        ✓ api-designer
```

---

#### /task-delete <task-id>

Delete a task (with safety checks).

**Usage**:
```
/task-delete integration-tests
```

**What happens**:
1. Checks if task has saved contexts
2. Offers to move contexts to 'default' task
3. Requires confirmation
4. Deletes task

**Example**:
```
You: /task-delete integration-tests

Claude: ⚠️ Task 'integration-tests' has 3 saved contexts:
        - initial-setup (45 msgs)
        - edge-cases (156 msgs)
        - refactor-v2 (89 msgs)
        
        Options:
        1. Delete task and all contexts
        2. Move contexts to 'default' task
        3. Cancel deletion
        
        Choose: 2

Claude: ✓ Moved contexts to 'default' task
        ✓ Deleted task 'integration-tests'
```

---

### Context Management Commands

#### /context-list

List contexts for the current task.

**Usage**:
```
/context-list
```

**Same as `/task-list` but focused on contexts only.**

**Example**:
```
You: /context-list

Claude: Contexts for task 'integration-tests':
        
        - initial-setup (45 msgs, 12k tokens)
          Saved: 2 days ago
        
        - edge-cases (156 msgs, 34k tokens)
          Saved: 1 day ago
        
        - refactor-v2 (89 msgs, 21k tokens)
          Saved: 3 hours ago
        
        Current session: 23 msgs, 5k tokens (unsaved)
```

---

#### /context-manage <context-name>

Interactively edit and optimize a saved context.

**Usage**:
```
/context-manage edge-cases
```

**What happens**:
1. Loads context from task's contexts directory
2. Claude analyzes the session
3. Interactive conversation to optimize
4. Writes optimized version back

**Example**:
```
You: /context-manage edge-cases

Claude: Loading context 'edge-cases' from task 'integration-tests'...
        
        Session: 156 messages, 34k tokens (17% capacity)
        
        Task Breakdown:
        ─────────────────────────────────────────
        [1-45] Initial test setup - COMPLETED
          • 45 messages, 12k tokens
          • Status: Working framework
          • Recommendation: Can be summarized
        
        [46-120] Failed cookie attempts
          • 75 messages, 18k tokens
          • Many failed debugging attempts
          • Recommendation: Remove failures
        
        [121-156] Working solution
          • 36 messages, 4k tokens
          • Status: Clean implementation
          • Recommendation: Keep as-is
        
        What would you like to optimize?

You: Remove the failed attempts and summarize the setup

Claude: Good plan! I'll:
        - Summarize messages 1-45 into 3 messages (~10k tokens saved)
        - Remove messages 46-120 (failed attempts, ~18k saved)
        - Keep messages 121-156 (working solution)
        
        Results:
          Before: 156 msgs, 34k tokens
          After:  39 msgs, 6k tokens
          Savings: 117 msgs, 28k tokens (82%)
        
        Should I proceed?

You: yes

Claude: [Working...]
        
        ✓ Context optimized
        ✓ Saved back to: edge-cases.jsonl
        
        New stats:
          Messages: 39 (was 156)
          Tokens: 6k (was 34k)
          Saved: 28k tokens (82% reduction)
```

---

#### /context-delete <context-name>

Delete a saved context from the current task.

**Usage**:
```
/context-delete refactor-v2
```

**Example**:
```
You: /context-delete refactor-v2

Claude: Delete 'refactor-v2'? (89 msgs, 21k tokens)
        
        This cannot be undone. (yes/no)

You: yes

Claude: ✓ Deleted context 'refactor-v2'
```

---

### Library Management Commands

#### /library-add-skill <skill-name>

Add current project skill to the global library.

**Usage**:
```
/library-add-skill my-custom-skill
```

**Example**:
```
You: /library-add-skill api-helpers

Claude: Adding 'api-helpers' to global library...
        
        Source: .claude/skills/api-helpers/
        
        ✓ Copied to: ~/.claude/tasks/library/skills/api-helpers/
        
        This skill is now available for all tasks.
```

---

#### /library-add-agent <agent-name>

Add current project agent to the global library.

**Usage**:
```
/library-add-agent my-reviewer
```

---

#### /library-list

List all available skills and agents in the library.

**Usage**:
```
/library-list
```

**Example**:
```
You: /library-list

Claude: Skills Library:
        - test-generator
        - coverage-analyzer
        - api-mocker
        - api-designer
        - performance-profiler
        
        Agents Library:
        - code-reviewer
        - test-reviewer
        - security-auditor
```

---

## Complete Workflows

### Workflow 1: First-Time Setup

```bash
cd ~/my-project
claude

# User discovers tasks
You: I want to organize my work into tasks

Claude: Great! You can create tasks for different types of work.
        Each task has its own environment (CLAUDE.md, skills, agents)
        and saved contexts (session snapshots).
        
        Start by creating a task:
          /task-create <task-name>

You: /task-create integration-tests

Claude: ⚠️ First time using tasks!
        
        Move current config to 'default' task? (yes/no)

You: yes

Claude: [Creates default task, then integration-tests task]
        ✓ Task created

You: /task integration-tests

Claude: [Activates task with fresh session]

You: Help me set up Jest for integration tests

Claude: [Works with integration-tests environment]
        [Conversation continues... 45 messages]

You: /task-save initial-setup

Claude: ✓ Saved as 'initial-setup'
```

---

### Workflow 2: Daily Work Routine

```bash
# Start of day
$ claude

You: /task integration-tests edge-cases

Claude: [Activates task, prepares context]
        Type: /resume sess-a1b2c3d4

You: /resume sess-a1b2c3d4

Claude: [Loads 156 messages]
        Looks like we were testing error conditions.
        Ready to continue?

You: Add timeout tests

Claude: [Works... session grows to 203 messages]

You: /task-save timeout-tests

Claude: ✓ Saved as 'timeout-tests'

# Bug report comes in
You: /task bug-fix

Claude: Save current work? (yes/no)

You: no

Claude: [Switches to bug-fix task with fresh session]

You: Fix null pointer in auth flow

Claude: [Works on bug fix... 34 messages]

# Bug fixed, back to testing
You: /task integration-tests timeout-tests

Claude: [Switches back, loads context]
        Type: /resume sess-xyz

You: /resume sess-xyz

Claude: [Right back to timeout testing with 203 messages]
```

---

### Workflow 3: Context Management

```bash
You: /task integration-tests
You: /context-list

Claude: Contexts for 'integration-tests':
        - initial-setup (45 msgs, 12k tokens)
        - edge-cases (156 msgs, 34k tokens) ⚠️ HIGH
        - timeout-tests (203 msgs, 45k tokens) ⚠️ HIGH

You: /context-manage edge-cases

Claude: [Shows analysis]
        This context has bloat from failed debugging.
        Can reduce from 156 to 39 messages.

You: Do it

Claude: [Optimizes]
        ✓ Reduced to 39 messages (82% savings)

You: /context-manage timeout-tests

Claude: [Optimizes this one too]
        ✓ Reduced to 87 messages (57% savings)
```

---

## Implementation Details

### Path Encoding

```typescript
function encodeProjectPath(projectPath: string): string {
  return projectPath.replace(/\//g, '-');
}

// Examples:
// /Users/dev/my-project → -Users-dev-my-project
// /home/alice/work/api → -home-alice-work-api
```

### Current Task Detection

```typescript
async function getCurrentTask(): Promise<string> {
  const taskFile = '.claude/.current-task';
  try {
    const task = await fs.readFile(taskFile, 'utf-8');
    return task.trim();
  } catch {
    return 'default';
  }
}

async function setCurrentTask(taskId: string): Promise<void> {
  await fs.mkdir('.claude', { recursive: true });
  await fs.writeFile('.claude/.current-task', taskId, 'utf-8');
}
```

### Current Session ID Detection

```typescript
async function getCurrentSessionId(): Promise<string> {
  // Parse ~/.claude/history.jsonl to find current session
  const historyPath = path.join(os.homedir(), '.claude', 'history.jsonl');
  const content = await fs.readFile(historyPath, 'utf-8');
  
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    throw new Error('No session history found');
  }
  
  // Last line is most recent session
  const lastEntry = JSON.parse(lines[lines.length - 1]);
  return lastEntry.id;
}
```

### Task Activation Script

```typescript
// scripts/task-activate.ts
async function taskActivate(taskId: string) {
  const projectRoot = process.cwd();
  const encodedPath = encodeProjectPath(projectRoot);
  const taskDir = path.join(os.homedir(), '.claude/tasks', encodedPath, taskId);
  const claudeDir = path.join(projectRoot, '.claude');
  
  // Verify task exists
  if (!await exists(taskDir)) {
    throw new Error(`Task '${taskId}' not found`);
  }
  
  // Ensure default task exists
  await ensureDefaultTask(encodedPath, claudeDir);
  
  // Replace CLAUDE.md
  await fs.copyFile(
    path.join(taskDir, 'CLAUDE.md'),
    path.join(claudeDir, 'CLAUDE.md')
  );
  
  // Replace skills
  await fs.rm(path.join(claudeDir, 'skills'), { recursive: true, force: true });
  await fs.mkdir(path.join(claudeDir, 'skills'));
  
  const skillsDir = path.join(taskDir, 'skills');
  if (await exists(skillsDir)) {
    for (const skill of await fs.readdir(skillsDir)) {
      const target = await fs.readlink(path.join(skillsDir, skill));
      await fs.symlink(target, path.join(claudeDir, 'skills', skill));
    }
  }
  
  // Replace agents
  await fs.rm(path.join(claudeDir, 'agents'), { recursive: true, force: true });
  await fs.mkdir(path.join(claudeDir, 'agents'));
  
  const agentsDir = path.join(taskDir, 'agents');
  if (await exists(agentsDir)) {
    for (const agent of await fs.readdir(agentsDir)) {
      const target = await fs.readlink(path.join(agentsDir, agent));
      await fs.symlink(target, path.join(claudeDir, 'agents', agent));
    }
  }
  
  // Write .current-task
  await fs.writeFile(path.join(claudeDir, '.current-task'), taskId);
  
  console.log(`✓ Task '${taskId}' activated`);
  console.log(`  CLAUDE.md: Loaded from task`);
  console.log(`  Skills: ${(await fs.readdir(path.join(claudeDir, 'skills'))).length} skills`);
  console.log(`  Agents: ${(await fs.readdir(path.join(claudeDir, 'agents'))).length} agents`);
}
```

### Context Preparation Script

```typescript
// scripts/prepare-context.ts
async function prepareContext(taskId: string, contextName?: string): Promise<string> {
  const encodedPath = encodeProjectPath(process.cwd());
  const taskDir = path.join(os.homedir(), '.claude/tasks', encodedPath, taskId);
  const projectSessionsDir = path.join(os.homedir(), '.claude/projects', encodedPath);
  
  // Ensure sessions directory exists
  await fs.mkdir(projectSessionsDir, { recursive: true });
  
  // Generate new session ID
  const sessionId = `sess-${crypto.randomUUID().slice(0, 8)}`;
  const destPath = path.join(projectSessionsDir, `${sessionId}.jsonl`);
  
  if (contextName) {
    // Copy saved context
    const contextPath = path.join(taskDir, 'contexts', `${contextName}.jsonl`);
    
    if (!await exists(contextPath)) {
      throw new Error(`Context '${contextName}' not found in task '${taskId}'`);
    }
    
    await fs.copyFile(contextPath, destPath);
    
    console.log(`✓ Context '${contextName}' ready: ${sessionId}`);
  } else {
    // Create minimal fresh session
    const freshSession = [
      {
        role: 'system',
        content: `Task: ${taskId}`,
        timestamp: new Date().toISOString()
      }
    ];
    
    await fs.writeFile(
      destPath,
      freshSession.map(m => JSON.stringify(m)).join('\n')
    );
    
    console.log(`✓ Fresh session ready: ${sessionId}`);
  }
  
  return sessionId;
}
```

### Context Save Script

```typescript
// scripts/task-save.ts
async function taskSave(contextName: string) {
  // Validate name
  if (!/^[a-z0-9-]+$/.test(contextName)) {
    throw new Error(
      `Invalid context name: "${contextName}"\n\n` +
      `Names must contain only:\n` +
      `- Lowercase letters (a-z)\n` +
      `- Numbers (0-9)\n` +
      `- Hyphens (-)\n\n` +
      `Examples: initial-setup, edge-cases, checkpoint-1`
    );
  }
  
  const currentTask = await getCurrentTask();
  const encodedPath = encodeProjectPath(process.cwd());
  const taskDir = path.join(os.homedir(), '.claude/tasks', encodedPath, currentTask);
  
  // Get current session ID from history
  const currentSessionId = await getCurrentSessionId();
  const sessionPath = path.join(
    os.homedir(),
    '.claude/projects',
    encodedPath,
    `${currentSessionId}.jsonl`
  );
  
  if (!await exists(sessionPath)) {
    throw new Error(`Current session not found: ${currentSessionId}`);
  }
  
  // Prepare contexts directory
  const contextsDir = path.join(taskDir, 'contexts');
  await fs.mkdir(contextsDir, { recursive: true });
  
  const destPath = path.join(contextsDir, `${contextName}.jsonl`);
  
  // Handle overwrite
  if (await exists(destPath)) {
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const backup = `${contextName}-backup-${timestamp}.jsonl`;
    await fs.copyFile(destPath, path.join(contextsDir, backup));
    console.log(`✓ Backup created: ${backup}`);
  }
  
  // Copy session to context
  await fs.copyFile(sessionPath, destPath);
  
  // Get stats
  const stats = await getSessionStats(destPath);
  console.log(`✓ Saved as '${contextName}' (${stats.messages} msgs, ${stats.tokens} tokens)`);
  console.log(`  Location: ${destPath}`);
}

async function getSessionStats(sessionPath: string) {
  const content = await fs.readFile(sessionPath, 'utf-8');
  const messages = content.split('\n').filter(line => line.trim());
  
  // Estimate tokens (rough: 4 chars per token)
  const totalChars = messages.reduce((sum, line) => {
    try {
      const msg = JSON.parse(line);
      return sum + (msg.content?.length || 0);
    } catch {
      return sum;
    }
  }, 0);
  
  return {
    messages: messages.length,
    tokens: Math.ceil(totalChars / 4)
  };
}
```

---

## Command Implementation Examples

### /task Command

```markdown
---
description: Activate a task environment with optional context
allowed-tools: Bash, Read, Write
---

# Task Activation

Usage: /task <task-id> [context-name]

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

## Step 3: Activate task environment

Run:
```bash
npm --prefix .context-curator run task-activate $1
```

This replaces .claude/CLAUDE.md, skills/, and agents/ with the task's configuration.

## Step 4: Prepare context

If second argument (context-name) provided:
```bash
SESSION_ID=$(npm --prefix .context-curator run prepare-context $1 $2)
```

If no context-name:
```bash
SESSION_ID=$(npm --prefix .context-curator run prepare-context $1)
```

This copies the context (or creates fresh session) to the project sessions directory.

## Step 5: Tell user to resume

Display:
```
✓ Task '$1' activated
✓ Context ready: $SESSION_ID

Type: /resume $SESSION_ID
```

## Example

User: /task integration-tests edge-cases

You:
1. Check current session (23 messages)
2. Ask: "Save? (yes/no)"
3. User: "yes"
4. Ask: "Context name?"
5. User: "my-work"
6. Run task-save script
7. Execute /clear
8. Run task-activate script
9. Run prepare-context script with "edge-cases"
10. Tell user to /resume <session-id>
```

### /task-save Command

```markdown
---
description: Save current session as a named context in active task
allowed-tools: Bash
---

# Task Save

Usage: /task-save <context-name>

Run the save script:
```bash
npm --prefix .context-curator run task-save $ARGUMENTS
```

The script will:
1. Validate the context name format
2. Get current session ID from history
3. Copy session to task's contexts directory
4. Handle overwrites with backups

Display the result.
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

# 2. Link commands to .claude/commands
cd ..
mkdir -p .claude/commands
ln -s ../context-curator/commands/* .claude/commands/

# 3. (Optional) Add to .gitignore
echo ".context-curator/" >> .gitignore
echo ".claude/.current-task" >> .gitignore

# 4. Test it
claude
You: /task-list
```

---

## Key Features

### ✅ Task-Based Organization

Separate environments for different work types:
- integration-tests task
- api-refactor task
- bug-fix task
- documentation task

### ✅ Reusable Components

Skills and agents in global library, used across all tasks via symlinks.

### ✅ Context Snapshots

Named checkpoints within each task:
- initial-setup
- edge-cases
- refactor-v2

### ✅ Atomic Task Switching

One command (`/task <id> <context>`) does everything:
- Saves current work
- Clears session
- Swaps environment
- Loads context
- Ready to resume

### ✅ Clean Isolation

Each task completely isolated:
- No cross-contamination
- Predictable behavior
- Clear mental model

### ✅ Backward Compatible

Default task preserves existing workflow:
- Works without thinking about tasks
- Smooth migration path
- Tasks are opt-in

### ✅ No API Key Required

Uses Claude Code's built-in features:
- Native `/clear` and `/resume`
- Custom slash commands
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
- [ ] All task commands work (`/task`, `/task-create`, `/task-save`, etc.)
- [ ] All context commands work (`/context-list`, `/context-manage`, etc.)
- [ ] Default task created automatically on first use
- [ ] Task switching is atomic (one command)
- [ ] Context saving via history.jsonl parsing
- [ ] Context name validation enforced
- [ ] Library management for skills/agents
- [ ] Zero data loss in testing
- [ ] Documentation complete

### User Success
- Developers organize work into meaningful tasks
- Context stays clean and focused per task
- Easy switching between different work types
- Natural workflow integration
- Community shares task templates

---

## Future Enhancements

### v1.1
- Task templates shipped with curator
- Auto-suggest task when starting new work
- Context analytics and recommendations

### v1.2
- Task collaboration (share task definitions)
- Context diff viewer
- Automated context optimization

### v2.0 (If Officially Adopted)
- Built into Claude Code
- Native task picker UI
- Integrated with session management
- Cloud sync for task templates

---

## Version History

- **v9.0** (2026-01-08): Task-based architecture with atomic switching
- **v8.0** (2026-01-08): Custom slash commands - DEPRECATED
- **v7.0** (2026-01-08): Conversational manage - DEPRECATED
- **v1.0-v6.1**: Earlier prototypes - DEPRECATED

---

## Appendix: Design Philosophy

### Why Task-Based?

**Research shows optimal context is task-specific** - exactly what's needed for the current work, no more, no less.

### Why Hard Reset?

**Atomic operations are predictable** - no partial state, no confusion about what's loaded.

### Why Custom Slash Commands?

**Official extension mechanism** - aligns with Anthropic's vision for Claude Code extensibility.

### Why Library + Symlinks?

**DRY principle** - one copy of each skill/agent, used everywhere, easy updates.

### Path to Official Adoption

This design:
- Uses only official features (no hacks)
- Solves real user pain (context management)
- Aligns with Claude Code's architecture
- Could be integrated with minimal changes
- Demonstrates value through community adoption

**Goal**: Build something so useful that Anthropic wants to make it official.