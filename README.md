# Claude Code Context Curator

**Task-based context management for Claude Code with @-import mechanism**

Version 10.0

## What is This?

Context Curator helps you organize Claude Code work into **tasks** with dedicated instruction sets and saved context snapshots. It uses a simple @-import mechanism to switch between tasks atomically while keeping multiple Claude instances safe and isolated.

**Key Features:**
- 📁 **Tasks** - Separate work environments with custom CLAUDE.md
- 💾 **Contexts** - Named session snapshots within each task
- 🔄 **Atomic switching** - One command to change tasks cleanly
- 🛡️ **Multi-instance safe** - Run 8-9 Claude sessions simultaneously
- 🔧 **No API key required** - Uses Claude Code's native features

## Quick Start

### Installation

```bash
# 1. Clone into your project
cd ~/my-project
git clone <repo-url> .context-curator
cd .context-curator

# 2. Run installer
./install.sh
```

This will:
- Install dependencies
- Set up `.claude/CLAUDE.md` with @-import structure
- Link slash commands to `.claude/commands/`
- Create the default task

### Basic Usage

```bash
# Create a task for integration testing
/task-create integration-tests

# Switch to that task
/task integration-tests

# Work on your task...
# (Claude now has task-specific instructions)

# Save your progress
/task-save edge-cases

# Later, resume where you left off
/task integration-tests edge-cases
```

## Core Concepts

### Tasks

A **task** is a focused work environment containing:
- Custom CLAUDE.md with task-specific instructions
- Saved context snapshots
- Uses project-wide skills and agents from `.claude/skills/` and `.claude/agents/`

**Examples**: `integration-tests`, `api-refactor`, `bug-fix`, `documentation`

### Contexts

A **context** is a named snapshot of a Claude Code session saved within a task.

**Examples**: `initial-setup`, `edge-cases`, `timeout-work`, `refactor-v2`

### The @-import Mechanism

Your project's `.claude/CLAUDE.md` contains:
1. **Universal instructions** - Project-wide guidelines shared across all tasks
2. **@-import line** - Points to the current task's CLAUDE.md

```markdown
# Project: My Application

## Universal Instructions
[Project-wide guidelines]

## Task-Specific Context

@import .context-curator/tasks/integration-tests/CLAUDE.md

<!-- This line is managed by context-curator. Do not edit manually. -->
```

When you run `/task api-refactor`, the @-import line updates to point to `api-refactor/CLAUDE.md`.

**Why this works**: Claude Code reads CLAUDE.md once at session start and never reloads. This means:
- Each session is isolated with its startup task context
- Updating @-import affects only the NEXT new session
- Multiple instances can run simultaneously without interference

## Commands

### Task Management

#### /task <task-id> [context-name]

Activate a task environment with optional saved context.

```bash
/task integration-tests              # Fresh session
/task integration-tests edge-cases   # Load saved context
```

**What happens**:
1. Updates @-import line in .claude/CLAUDE.md
2. Checks current session for unsaved work (offers to save)
3. Executes `/clear` to reset session
4. Prepares new session with context (if specified)
5. Shows task focus and instructions

#### /task-create <task-id>

Create a new task with interactive configuration.

```bash
/task-create integration-tests
```

You'll be asked for the task's focus, then a CLAUDE.md will be created with task-specific guidelines.

#### /task-save <context-name>

Save current session as a named context in the active task.

```bash
/task-save edge-cases
```

Context names must match `/^[a-z0-9-]+$/`

#### /task-list [task-id]

List all tasks or show details for a specific task.

```bash
/task-list                    # List all tasks
/task-list integration-tests  # Show task details
```

#### /task-manage

Interactive task management (rename, edit, delete tasks).

#### /task-delete <task-id>

Delete a task and all its contexts.

### Context Management

#### /context-list [task-id]

List all contexts in the active task or specified task.

```bash
/context-list                    # Active task's contexts
/context-list integration-tests  # Specific task's contexts
```

#### /context-manage [task-id]

Interactive context management (rename, view, compare, delete contexts).

#### /context-delete <context-name> [task-id]

Delete a saved context.

```bash
/context-delete edge-cases                    # Delete from active task
/context-delete edge-cases integration-tests  # Delete from specific task
```

## Architecture

### Directory Structure

```
my-project/
├── .claude/
│   ├── CLAUDE.md                 # Universal + @-import line
│   ├── skills/                   # Shared by ALL tasks
│   ├── agents/                   # Shared by ALL tasks
│   └── commands/                 # Custom slash commands (symlinks)
│
├── .context-curator/
│   ├── tasks/
│   │   ├── default/
│   │   │   ├── CLAUDE.md
│   │   │   └── contexts/
│   │   ├── integration-tests/
│   │   │   ├── CLAUDE.md
│   │   │   └── contexts/
│   │   │       ├── edge-cases.jsonl
│   │   │       └── initial-setup.jsonl
│   │   └── session-task-map.json
│   ├── src/
│   ├── scripts/
│   ├── commands/
│   └── package.json
│
└── [project files...]
```

### How @-import Works

1. **Session Start**: Claude Code reads `.claude/CLAUDE.md` once
2. **@-import Resolution**: Loads the task-specific CLAUDE.md
3. **Session Isolation**: Content is cached, never reloaded during session
4. **Task Switching**: Updates @-import for the NEXT session only

This enables:
- ✅ Multiple running instances with different tasks
- ✅ No interference between sessions
- ✅ Atomic task switching
- ✅ Simple, transparent mechanism

## Multi-Instance Workflow

Run multiple Claude Code instances simultaneously on different tasks:

```bash
# Terminal 1: Integration testing
$ cd ~/myproject && claude
You: /task integration-tests edge-cases
     [Session gets integration-tests context]
     [Keeps this context even if @-import changes]

# Terminal 2: API refactoring (while T1 running)
$ cd ~/myproject && claude
You: /task api-refactor initial-design
     [New session gets api-refactor context]

# Terminal 3: Bug fixing
$ cd ~/myproject && claude
You: /task bug-fix
     [New session gets bug-fix context]
```

Each instance is completely isolated!

## Example Task CLAUDE.md

Here's an example task for integration testing:

```markdown
# Task: Integration Tests

## Focus
API integration testing with Jest. Prioritize edge cases and error handling.

## Guidelines
- Use supertest for HTTP testing
- Mock external services with jest.mock()
- Test error paths: timeouts, malformed data, auth failures
- Minimum 90% coverage on critical integration paths

## Tool Usage

### Preferred Skills for This Task
- **test-generator**: Use the "integration" template
- **coverage-analyzer**: Run after each test suite
- **api-mocker**: For external service simulation

### Preferred Agents
- **test-reviewer**: Review for edge case coverage

## Patterns

### Integration Test Structure
\`\`\`typescript
describe('Auth API Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  it('handles timeout gracefully', async () => {
    const response = await request(app)
      .post('/auth/login')
      .timeout(100);
    expect(response.status).toBe(408);
  });
});
\`\`\`

## Reference
- [Internal testing guidelines](https://wiki.example.com/testing)
- [Jest best practices](https://jestjs.io/docs/api)
```

## Workflow Example

```bash
# Create a task for API refactoring
You: /task-create api-refactor
Claude: What should this task focus on?
You: Redesigning API endpoints for better REST principles

# Claude creates the task CLAUDE.md
Claude: ✓ Task 'api-refactor' created!

# Start working on the task
You: /task api-refactor
Claude: [Updates @-import, clears session]
        ✓ Task context: api-refactor
        ✓ Session ready: sess-abc123
        Type: /resume sess-abc123

You: /resume sess-abc123
Claude: [Now working with api-refactor specific instructions]

# Do some work...
# [Refactor endpoints, update documentation]

# Save progress
You: /task-save initial-refactor
Claude: ✓ Saved as 'initial-refactor' (89 msgs, 19k tokens)

# Switch to another task
You: /task integration-tests
Claude: Current session: 89 messages (unsaved). Save? (yes/no)
You: no
Claude: [Switches to integration-tests task]

# Later, resume the API refactor work
You: /task api-refactor initial-refactor
Claude: [Loads the 89 messages from where you left off]
```

## Requirements

- Claude Code installed
- Node.js 18+
- TypeScript 5+
- tsx for running scripts
- **No Anthropic API key required!**

## Advanced Features

### Shared Skills and Agents

All tasks use the same skills and agents from `.claude/skills/` and `.claude/agents/`. Task-specific CLAUDE.md files guide HOW and WHEN to use them for that task.

### Default Task

Every project has an implicit **default** task that:
- Contains the original project configuration
- Stores contexts created without an explicit task
- Allows context-curator to work without thinking about tasks

### Session Tracking

The system tracks which session belongs to which task in `session-task-map.json`, enabling smart context management.

## Troubleshooting

### @-import line not updating

1. Check PreToolUse hook in `/task` command
2. Run manually: `npx tsx .context-curator/scripts/update-import.ts <task-id>`
3. Verify task exists

### Session not finding context

1. List contexts: `/context-list <task-id>`
2. Check file exists in `.context-curator/tasks/<task-id>/contexts/`
3. Verify context name format (lowercase, numbers, hyphens only)

### Multi-instance interference

This shouldn't happen! If it does:
1. Verify instances were started AFTER their respective `/task` commands
2. Check each instance's CLAUDE.md wasn't manually edited
3. Confirm Claude Code version doesn't reload CLAUDE.md mid-session

## Version History

- **v10.0** (2026-01-10): Task-based architecture with @-import mechanism
- **v0.3.0** (2026-01-08): Conversational manage - SUPERSEDED
- **v0.2.0** (2026-01-07): Unified context command - SUPERSEDED
- **v0.1.0**: Initial session management - SUPERSEDED

## License

MIT

## Contributing

Contributions welcome! Please:
- Fork the repository
- Create feature branch
- Add tests for new functionality
- Update documentation
- Submit pull request

## Built with ❤️ for the Claude Code community
