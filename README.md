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
cd ~/my-project
git clone <repo-url> .context-curator
cd .context-curator
./install.sh
```

This sets up `.claude/CLAUDE.md` with @-import structure, creates the default task, and links slash commands.

### Basic Usage

```bash
# Create a task for testing
/task-create integration-tests
# Claude asks: "What should this task focus on?"
# You respond: "API integration testing with Jest. Focus on edge cases and error handling."

# Switch to that task
/task integration-tests
# Claude: ✓ Task context: integration-tests
#         ✓ Session ready: sess-abc123
#         Type: /resume sess-abc123

/resume sess-abc123

# Work on your task...
# Claude now has task-specific instructions

# Save your progress
/task-save edge-cases
# ✓ Saved as 'edge-cases' (156 msgs, 34k tokens)

# Later, resume where you left off
/task integration-tests edge-cases
```

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
# Day 1
/task-create user-auth
/task user-auth
# ... work on JWT implementation ...
/task-save jwt-initial

# Day 2
/task user-auth jwt-initial
# ... update based on feedback ...
/task-save jwt-v2

# Day 3
/task user-auth jwt-v2
# ... implement refresh tokens ...
/task-save jwt-complete
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
# Working on API refactor
/task api-refactor
# ... 2 hours of work ...

# Urgent bug!
/task bug-fix
# Claude: Current session: 89 messages. Save? (yes/no)
yes
# Claude: Context name?
pre-interruption

# Fix the bug...
/task-save hotfix-applied

# Back to API refactor exactly where you left off
/task api-refactor pre-interruption
```

### Team Collaboration

```bash
# Developer A creates task template
/task-create integration-tests

# Commit the task definition
git add .context-curator/tasks/integration-tests/CLAUDE.md
git commit -m "Add integration testing task template"
git push

# Developer B uses the template
git pull
/task integration-tests
```

## Architecture

```
my-project/
├── .claude/
│   ├── CLAUDE.md                 # Universal + @-import line
│   ├── skills/                   # Shared by ALL tasks
│   ├── agents/                   # Shared by ALL tasks
│   └── commands/                 # Slash commands (symlinked)
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
│   │   ├── task-manager.ts
│   │   ├── session-reader.ts
│   │   └── utils.ts
│   ├── scripts/
│   │   ├── init-project.ts
│   │   ├── update-import.ts
│   │   ├── prepare-context.ts
│   │   └── task-save.ts
│   └── commands/
│       ├── task.md
│       ├── task-create.md
│       └── task-save.md
│
└── [your project files...]
```

**Storage**: Tasks in `.context-curator/tasks/<task-id>/`, contexts in `.context-curator/tasks/<task-id>/contexts/<context-name>.jsonl`

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

**@-import line not updating**
1. Check PreToolUse hook in `commands/task.md`
2. Run manually: `npx tsx .context-curator/scripts/update-import.ts <task-id>`
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
1. Check symlinks: `ls -la .claude/commands/`
2. Re-run: `cd .context-curator && ./install.sh`

## Best Practices

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

**Git integration**: Add to `.gitignore`:

```gitignore
# Ignore user-specific contexts
.context-curator/tasks/*/contexts/
.context-curator/tasks/session-task-map.json

# Commit task templates
!.context-curator/tasks/*/CLAUDE.md
```

## Version History

- **v10.0** (2026-01-10): Task-based architecture with @-import mechanism
- **v0.3.0** (2026-01-08): Conversational manage - superseded
- **v0.2.0** (2026-01-07): Unified context command - superseded
- **v0.1.0** (2026-01-06): Initial session management - superseded

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
git clone <repo-url>
cd context-curator
npm install
npm test
npx tsc
```

## License

MIT

## Credits

- Claude Code team at Anthropic for extensibility features
- Boris Cherny for multi-instance workflow inspiration
- Community contributors
