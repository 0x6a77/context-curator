# Context Curator

Task-based context management for Claude Code.

Version 10.0 • [PRD](prod-mgmt/context-curator-prd.md) • [Dev Plan](prod-mgmt/context-curator-devplan.md)

## The Problem

When you work on multiple aspects of a project with Claude Code, context gets messy. Integration testing sessions leak into API design work. Bug fix context pollutes refactoring sessions. You end up with bloated sessions that confuse Claude and waste tokens.

## The Solution

Context Curator lets you organize work into **tasks** - each with its own focused instructions and saved context snapshots. Switch between tasks cleanly. Run multiple Claude instances simultaneously without interference. Keep every work stream isolated and efficient.

**Use cases:**
- Multi-tasking developers switching between integration tests, API design, bug fixes, and documentation
- Running multiple Claude instances on different tasks in parallel
- Long-running projects where you save progress snapshots and resume days later
- Keeping contexts lean by organizing work into task-specific snapshots

## Quick Start

### Installation

```bash
# Clone and install globally
git clone https://github.com/yourusername/context-curator.git
cd context-curator
./install.sh
```

This will:
1. Copy context-curator to `~/.claude/context-curator/`
2. Install npm dependencies
3. Install slash commands to `~/.claude/commands/task/`

The commands are now globally available in Claude Code for **all your projects**.

### ⚠️ Important: Session Management

**Always manage tasks and contexts in a dedicated `context-curator` session:**

```bash
# When setting up tasks or managing contexts
claude -r context-curator
```

This keeps your context-curator management work separate from your actual project work. Think of it as the "meta" session where you organize your real work sessions.

**Pattern:**
- **Setup/management**: Use `claude -r context-curator` to create tasks, save contexts, view lists
- **Real work**: Use `claude` (normal session) to switch tasks and do actual coding

On first use in any project (when you run `/task-create` in the curator session), the system will automatically:
- Back up your current `.claude/CLAUDE.md` to a `default` task
- Create the @-import structure in `.claude/CLAUDE.md`
- Set up project-specific task storage in `.context-curator/tasks/`

### Basic Usage

After running the installer once, commands are available in all your projects.

```bash
# In any project directory
cd ~/my-project

# ==================================================
# STEP 1: Setup tasks (in curator session)
# ==================================================
claude -r context-curator

# Create a task for integration testing
/task-create integration-tests
# Claude asks: "What should this task focus on?"
# You respond: "API integration testing with Jest. Focus on edge cases and error handling."

# Exit curator session
# (Ctrl+D or type 'exit')

# ==================================================
# STEP 2: Do real work (in normal session)
# ==================================================
claude

# Switch to that task
/task integration-tests
# Claude: ✓ Task context: integration-tests
#         ✓ Session ready: sess-abc123
#         Type: /resume sess-abc123

/resume sess-abc123

# Work on your task...
# Claude now has task-specific instructions

# ==================================================
# STEP 3: Save progress (back to curator session)
# ==================================================
# Exit your work session first (Ctrl+D)

claude -r context-curator

# Save your progress
/task-save edge-cases
# ✓ Saved as 'edge-cases' (156 msgs, 34k tokens)

# Exit curator session

# ==================================================
# STEP 4: Resume later (in normal session)
# ==================================================
claude

/task integration-tests edge-cases
# Loads your saved context and continues where you left off
```

## Session Management Pattern

Context Curator uses **two types of sessions**:

### 1. Curator Session (`claude -r context-curator`)
Use this for **managing** your work:
- Creating tasks (`/task-create`)
- Saving contexts (`/task-save`)
- Listing tasks (`/task-list`)
- Managing tasks (`/task-manage`, `/task-delete`)
- Managing contexts (`/context-list`, `/context-manage`, `/context-delete`)

Think of this as your "meta" session - where you organize and curate your work.

### 2. Normal Session (`claude`)
Use this for **doing** your work:
- Switching tasks (`/task`)
- Resuming with contexts (`/task <task-id> <context-name>`)
- Writing code, fixing bugs, implementing features

This is where your actual development happens.

### Why Separate?

1. **Prevents pollution**: Management activities (creating tasks, saving contexts) don't clutter your work sessions
2. **Clean histories**: Your real work sessions contain only relevant work, not setup/management overhead
3. **Clear mental model**: Setup activities are distinct from development activities
4. **Better context**: When you save a work session, it captures only the work, not the meta-discussion about organizing it

## How It Works

Context Curator uses an @-import mechanism that leverages Claude Code's startup behavior.

Your `.claude/CLAUDE.md` structure:

```markdown
# Project: My Application

## Universal Instructions
[Guidelines that apply to ALL tasks]

## Task-Specific Context

@import .context-curator/tasks/integration-tests/CLAUDE.md
```

When you run `/task api-refactor`:
1. PreToolUse hook updates @-import to point to `api-refactor/CLAUDE.md`
2. Offers to save your current work
3. Runs `/clear` to reset session
4. Creates new session (optionally loading saved context)
5. You resume with api-refactor instructions

**Why this is multi-instance safe**: Claude Code reads CLAUDE.md once at session start and never reloads. Running sessions stay isolated - their context won't change. @-import only affects new sessions.

```bash
# Terminal 1
$ claude
/task integration-tests edge-cases
# Working on tests

# Terminal 2 (while T1 is still running)
$ claude
/task api-refactor initial-design
# Working on API - T1 is unaffected

# Terminal 3 (while T1 & T2 are still running)
$ claude
/task bug-fix
# Working on bug - T1 & T2 are unaffected
```

## Core Concepts

**Tasks**: Work environments with custom CLAUDE.md and saved contexts. Examples: `integration-tests`, `api-refactor`, `bug-fix`, `documentation`

**Contexts**: Named snapshots of Claude Code sessions saved within a task. Examples: `edge-cases`, `initial-setup`, `refactor-v2`

**Default task**: Every project has a `default` task containing your original CLAUDE.md configuration. You can ignore tasks entirely and just use default.

## Commands

### /task <task-id> [context-name]

Activate a task environment with optional saved context.

```bash
/task integration-tests              # Fresh session
/task integration-tests edge-cases   # Load saved context
```

### /task-create <task-id>

Create a new task with interactive configuration. Claude asks for the task's focus and creates a structured CLAUDE.md with guidelines, tool recommendations, and patterns.

On first task creation, the system automatically backs up your current CLAUDE.md to the `default` task and sets up the @-import structure.

### /task-save <context-name>

Save current session as a named context in the active task.

```bash
/task-save edge-cases
# ✓ Saved as 'edge-cases' (156 msgs, 34k tokens)
#   Task: integration-tests
```

Context names must match `/^[a-z0-9-]+$/` (lowercase, numbers, hyphens only).

### /task-list [task-id]

List all tasks or show details for a specific task.

```bash
/task-list                    # List all
/task-list integration-tests  # Show details
```

### /task-manage

Interactive task management (rename, edit, delete tasks).

### /task-delete <task-id>

Delete a task and all its contexts (with confirmation).

### /context-list [task-id]

List all contexts in the active task or specified task.

```bash
/context-list                    # Active task
/context-list integration-tests  # Specific task
```

### /context-manage [task-id]

Interactive context management (rename, view, compare, delete contexts).

### /context-delete <context-name> [task-id]

Delete a saved context (with confirmation).

## Workflows

### Feature Development with Snapshots

```bash
# Day 1: Setup
claude -r context-curator
/task-create user-auth
# Exit

# Day 1: Work
claude
/task user-auth
/resume <session-id>
# ... work on JWT implementation ...
# Exit

# Day 1: Save progress
claude -r context-curator
/task-save jwt-initial
# Exit

# Day 2: Resume and continue
claude
/task user-auth jwt-initial
/resume <session-id>
# ... update based on feedback ...
# Exit

claude -r context-curator
/task-save jwt-v2
# Exit

# Day 3: Continue
claude
/task user-auth jwt-v2
/resume <session-id>
# ... implement refresh tokens ...
# Exit

claude -r context-curator
/task-save jwt-complete
# Exit
```

### Multi-Instance Parallel Work

```bash
# Terminal 1: Integration tests
$ claude
/task integration-tests edge-cases

# Terminal 2: Bug fix
$ claude
/task bug-fix production-issue

# Terminal 3: Documentation
$ claude
/task documentation api-reference

# All instances completely isolated
```

### Context Switching

```bash
# Working on API refactor (normal session)
claude
/task api-refactor
/resume <session-id>
# ... 2 hours of work ...

# Urgent bug! Need to switch
# Exit current session (Ctrl+D)

# Save your progress
claude -r context-curator
/task-save pre-interruption
# Exit

# Switch to bug-fix task
claude
/task bug-fix
/resume <session-id>
# ... fix the bug ...
# Exit

# Save bug fix work
claude -r context-curator
/task-save hotfix-applied
# Exit

# Back to API refactor exactly where you left off
claude
/task api-refactor pre-interruption
/resume <session-id>
# Continue working with all context restored
```

### Team Collaboration

```bash
# Developer A creates task template
claude -r context-curator
/task-create integration-tests
# ... Claude creates CLAUDE.md for the task ...
# Exit

# Commit the task definition
git add .context-curator/tasks/integration-tests/CLAUDE.md
git commit -m "Add integration testing task template"
git push

# Developer B uses the template
git pull

# Now B can use the task immediately
claude
/task integration-tests
/resume <session-id>
# Work begins with A's task template instructions
```

## Architecture

### Architecture

```
~/.claude/
├── context-curator/              # Globally installed
│   ├── commands/
│   │   └── task/                 # Command definitions (source)
│   │       ├── task.md
│   │       ├── task-create.md
│   │       └── task-save.md
│   ├── scripts/
│   │   ├── init-project.ts
│   │   ├── update-import.ts
│   │   ├── prepare-context.ts
│   │   └── task-save.ts
│   ├── src/
│   │   ├── task-manager.ts
│   │   ├── session-reader.ts
│   │   └── utils.ts
│   └── node_modules/
│
└── commands/
    └── task/                     # Commands installed here
        ├── task.md
        ├── task-create.md
        └── task-save.md

my-project/
├── .claude/
│   ├── CLAUDE.md                 # Universal + @-import line
│   ├── skills/                   # Shared by ALL tasks
│   └── agents/                   # Shared by ALL tasks
│
├── .context-curator/
│   └── tasks/                    # Task data (per-project)
│       ├── default/
│       │   ├── CLAUDE.md
│       │   └── contexts/
│       ├── integration-tests/
│       │   ├── CLAUDE.md
│       │   └── contexts/
│       │       ├── edge-cases.jsonl
│       │       └── initial-setup.jsonl
│       └── session-task-map.json
│
└── [your project files...]
```

**Key Points**: 
- **Global installation**: Context-curator lives in `~/.claude/context-curator/` (one install, works everywhere)
- **Global commands**: Slash commands in `~/.claude/commands/task/` (available in all projects)
- **Per-project data**: Task definitions and contexts in each project's `.context-curator/tasks/` directory
- **Portable**: Commands reference scripts at `~/.claude/context-curator/scripts/` (absolute path, works from any project)

## Example Task CLAUDE.md

```markdown
# Task: integration-tests

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
- **test-generator**: Use "integration" template for API endpoints
- **coverage-analyzer**: Run after each test suite
- **api-mocker**: Mock payment gateways with realistic delays

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

## Technical Details

**Requirements**: Claude Code, Node.js 18+, TypeScript 5+, tsx

**No API key needed**: Works entirely within Claude Code using native features.

**Shared skills/agents**: All tasks use skills and agents from `.claude/skills/` and `.claude/agents/`. Task CLAUDE.md files guide when and how to use them.

**Session tracking**: `session-task-map.json` tracks which session belongs to which task, enabling smart context management.

## Troubleshooting

**Context-curator tasks appearing in /task-list**

If your management sessions are creating tasks in your project:
- Always use `claude -r context-curator` for management
- This keeps curator's own session separate from your project work
- The curator session will have its own `.context-curator/tasks/` in a separate location

**@-import line not updating**
1. Check PreToolUse hook in command definition
2. Run manually: `npx tsx ~/.claude/context-curator/scripts/update-import.ts <task-id>`
3. Verify task exists: `ls .context-curator/tasks/<task-id>/CLAUDE.md`

**Session not finding context**
1. List contexts: `/context-list <task-id>`
2. Check file exists: `ls .context-curator/tasks/<task-id>/contexts/<context>.jsonl`
3. Verify context name format (lowercase, numbers, hyphens only)

**Multi-instance interference**
This shouldn't happen. If it does:
1. Verify each instance was started after its `/task` command
2. Check CLAUDE.md wasn't manually edited during sessions
3. Restart affected instances (run `/task` command first, then resume)

**Commands not found**
1. Check global installation: `ls -la ~/.claude/context-curator/`
2. Check commands: `ls -la ~/.claude/commands/task/`
3. Re-run installer if needed:
   ```bash
   cd ~/.claude/context-curator
   ./install.sh
   ```
4. Verify Claude Code can see custom commands

## Best Practices

**Use the curator session for management**: Always use `claude -r context-curator` when creating tasks, saving contexts, or managing your work organization. Keep this separate from your actual development work.

**Keep contexts lean**: Instead of one massive context, use multiple focused ones.

```bash
# Instead of
/task-save everything  # 500 msgs, 120k tokens

# Use
/task-save initial-setup     # 45 msgs, 12k tokens
/task-save edge-cases        # 89 msgs, 19k tokens
/task-save refactor-phase-1  # 67 msgs, 15k tokens
```

**Make task instructions specific**: Each task's CLAUDE.md should be focused and actionable, not generic.

**Organize by work type**: Structure tasks by the kind of work, not temporal or project boundaries.

```
Good:
tasks/
├── integration-tests/
├── api-refactor/
├── bug-fix/
└── documentation/

Avoid:
tasks/
├── monday-work/      # Temporal
├── various-stuff/    # Too broad
└── project-alpha/    # By project
```

**Git integration**: Task definitions can be committed and shared with team. Add to `.gitignore`:

```gitignore
# Option 1: Share task definitions with team (recommended)
# Ignore user-specific contexts but commit task CLAUDE.md files
.context-curator/tasks/*/contexts/
.context-curator/tasks/session-task-map.json

# Option 2: Keep tasks completely private
.context-curator/tasks/
```

To share task templates with your team:
```bash
git add .context-curator/tasks/integration-tests/CLAUDE.md
git commit -m "Add integration testing task template"
git push
```

## Version History

- **v10.0** (2026-01-10): Task-based architecture with @-import mechanism
- **v0.3.0** (2026-01-08): Conversational manage - superseded
- **v0.2.0** (2026-01-07): Unified context command - superseded
- **v0.1.0** (2026-01-06): Initial session management - superseded

## Quick Reference

### Session Types

| Session Type | Command | Use For |
|--------------|---------|---------|
| **Curator** | `claude -r context-curator` | Setup, management, saving |
| **Work** | `claude` | Development, coding, real work |

### Common Workflows

```bash
# Create a task
claude -r context-curator → /task-create <id> → Exit

# Start working
claude → /task <id> → /resume <session-id> → Work → Exit

# Save progress
claude -r context-curator → /task-save <name> → Exit

# Resume work
claude → /task <id> <context> → /resume <session-id> → Work

# List tasks/contexts
claude -r context-curator → /task-list or /context-list → Exit
```

### Rule of Thumb

**If you're organizing, use curator session.**
**If you're coding, use normal session.**

## Design Philosophy

**Why @-import?** Claude Code reads CLAUDE.md once at startup. This is perfect for multi-instance workflows - simple, transparent, one-line changes.

**Why task-based?** Research shows optimal context is task-specific. Isolation prevents contamination between different work types.

**Why hard reset?** Atomic operations are predictable. No partial state, no confusion about what's loaded.

**Why custom slash commands?** Official extension mechanism that aligns with Anthropic's vision for Claude Code. PreToolUse hooks enable atomic updates.

## Roadmap

**v1.1**: Task templates library, auto-suggest task for new work, context analytics, usage statistics

**v1.2**: Task collaboration features, context diff viewer, automated optimization, cross-project templates

**v2.0** (if officially adopted): Native Claude Code integration, task picker UI, session-scoped configuration, per-task skills/agents, cloud sync

## Contributing

Contributions welcome. Fork the repo, create a feature branch, add tests, update docs, and submit a PR.

Development:
```bash
git clone <repo-url> context-curator
cd context-curator
npm install
npm test
npx tsc

# To test locally (install to ~/.claude)
./install.sh

# Then use in any project
cd ~/test-project
/task-create test-task
```

## License

MIT

## Credits

- Claude Code team at Anthropic for extensibility features
- Boris Cherny for multi-instance workflow inspiration
- Community contributors
