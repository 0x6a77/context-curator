# Claude Code Context Curator

**Task-based context management for Claude Code developers**

Version 10.0 • [PRD](prod-mgmt/context-curator-prd.md) • [Dev Plan](prod-mgmt/context-curator-devplan.md)

---

## Why This Exists

**The Problem**: When you work on multiple aspects of a project with Claude Code, context gets messy. Integration testing sessions leak into API design work. Bug fix context pollutes refactoring sessions. You end up with bloated sessions that confuse Claude and waste tokens.

**The Solution**: Context Curator lets you organize work into **tasks** - each with its own focused instructions and saved context snapshots. Switch between tasks cleanly. Run 8-9 Claude instances simultaneously without interference. Keep every work stream isolated and efficient.

### Perfect For:

- 🔧 **Multi-tasking developers** - Switch between integration tests, API design, bug fixes, and documentation without context contamination
- 👥 **Team workflows** - Run multiple Claude instances on different tasks in parallel (Boris's 8-9 instance workflow!)
- 📦 **Long-running projects** - Save progress snapshots, resume exactly where you left off days later
- 🎯 **Focused work** - Each task has exactly the instructions it needs, nothing more
- 💰 **Token optimization** - Keep contexts lean by organizing work into task-specific snapshots

---

## Quick Start

### 1. Installation (30 seconds)

```bash
cd ~/my-project
git clone https://github.com/your-org/context-curator.git .context-curator
cd .context-curator
./install.sh
```

This automatically:
- ✅ Installs dependencies
- ✅ Sets up `.claude/CLAUDE.md` with @-import structure
- ✅ Creates default task with your current config
- ✅ Links slash commands to `.claude/commands/`

### 2. Create Your First Task (1 minute)

```bash
# Start Claude Code
claude

# Create a task for testing
/task-create integration-tests
```

Claude will ask: "What should this task focus on?"

You respond: "API integration testing with Jest. Focus on edge cases and error handling."

Claude creates a custom CLAUDE.md with testing-specific instructions.

### 3. Start Working

```bash
# Activate the task
/task integration-tests

# Claude shows:
# ✓ Task context: integration-tests
# ✓ Session ready: sess-abc123
# Type: /resume sess-abc123

/resume sess-abc123

# Now Claude has task-specific instructions!
# Do your work...
```

### 4. Save Your Progress

```bash
# Save the current session
/task-save edge-cases

# Output:
# ✓ Saved as 'edge-cases' (156 msgs, 34k tokens)
#   Task: integration-tests
```

### 5. Resume Anytime

```bash
# Later, resume exactly where you left off
/task integration-tests edge-cases

# Claude loads all 156 messages and continues!
```

**That's it!** You now have task-based context management.

---

## How It Works: The @-import Mechanism

Context Curator uses a simple, transparent mechanism that leverages Claude Code's startup behavior:

### Your `.claude/CLAUDE.md` Structure

```markdown
# Project: My Application

## Universal Instructions
[Guidelines that apply to ALL tasks]
- Coding standards
- Project structure
- Common commands

## Task-Specific Context

@import .context-curator/tasks/integration-tests/CLAUDE.md

<!-- This line is managed by context-curator. Do not edit manually. -->
```

### What Happens When You Switch Tasks

```bash
/task api-refactor
```

1. **PreToolUse Hook**: Updates @-import to point to `api-refactor/CLAUDE.md`
2. **Save Check**: Offers to save your current work
3. **Hard Reset**: Runs `/clear` to clean the session
4. **Prepare Context**: Creates new session (optionally loading saved context)
5. **Resume**: You start fresh with api-refactor instructions

### Why This Is Multi-Instance Safe

**Key Insight**: Claude Code reads CLAUDE.md **once at session start** and never reloads it.

This means:
- 🛡️ **Running sessions stay isolated** - Their context won't change
- 🔄 **@-import only affects new sessions** - Not currently running ones
- 🚀 **Run unlimited instances** - Each captures its startup task
- 🎯 **No race conditions** - Sessions can't interfere with each other

```bash
# Terminal 1: Integration testing
$ claude
/task integration-tests edge-cases
# [Working on tests, @-import = integration-tests]

# Terminal 2: API refactoring (T1 still running!)
$ claude
/task api-refactor initial-design
# [Working on API, @-import = api-refactor]
# Terminal 1 still has integration-tests! ✅

# Terminal 3: Bug fixing (T1 & T2 still running!)
$ claude
/task bug-fix
# [Working on bug, @-import = bug-fix]
# Terminal 1 & 2 unchanged! ✅
```

---

## Core Concepts

### Tasks

A **task** is a work environment with:
- Custom `CLAUDE.md` with task-specific instructions
- Saved context snapshots
- Shared access to project skills/agents

**Examples**:
- `integration-tests` - API testing with Jest
- `api-refactor` - Redesigning endpoints for REST
- `bug-fix` - Debugging production issues
- `documentation` - Writing docs and examples

### Contexts

A **context** is a named snapshot of a Claude Code session saved within a task.

**Examples**:
- `edge-cases` - Progress on edge case testing
- `initial-setup` - First pass at implementation
- `refactor-v2` - Second iteration of refactoring
- `timeout-work` - Debugging timeout issues

### Default Task

Every project has a `default` task that:
- Contains your original CLAUDE.md configuration
- Works without any task commands
- Stores contexts created before task setup

You can ignore tasks entirely and just use the default task!

---

## Commands

### Task Management

#### `/task <task-id> [context-name]`

Activate a task environment with optional saved context.

**Examples**:
```bash
/task integration-tests              # Fresh session
/task integration-tests edge-cases   # Load saved context (156 messages)
/task api-refactor                   # Switch to different task
```

**What it does**:
1. Updates @-import line automatically (PreToolUse hook)
2. Checks for unsaved work (offers to save)
3. Clears session (`/clear`)
4. Prepares new session with context (if specified)
5. Shows task focus and resume command

---

#### `/task-create <task-id>`

Create a new task with interactive configuration.

**Example**:
```bash
/task-create integration-tests
```

Claude asks: "What should this task focus on?"

You describe the task, and Claude creates a structured CLAUDE.md with:
- Focus section
- Guidelines
- Tool usage recommendations
- Code patterns
- Reference links

**On first task creation**, the system automatically:
- Backs up current CLAUDE.md to `default` task
- Creates new CLAUDE.md with @-import structure
- Sets up task tracking

---

#### `/task-save <context-name>`

Save current session as a named context in the active task.

**Example**:
```bash
/task-save edge-cases
```

**Output**:
```
✓ Saved as 'edge-cases' (156 msgs, 34k tokens)
  Task: integration-tests
  Location: .context-curator/tasks/integration-tests/contexts/edge-cases.jsonl
```

**Context name rules**: Lowercase letters, numbers, hyphens only (`/^[a-z0-9-]+$/`)

**Examples**: `edge-cases`, `initial-setup`, `bug-fix-v2`, `refactor-round-2`

If context already exists, a backup is created automatically.

---

#### `/task-list [task-id]`

List all tasks or show details for a specific task.

**Examples**:
```bash
# List all tasks
/task-list

# Output:
# # Available Tasks
#
# default (current)
# • 2 contexts
# • Last used: 2 hours ago
#
# integration-tests
# • 3 contexts
# • Last used: 1 day ago
#
# api-refactor
# • 1 context
# • Last used: 3 days ago
#
# Total: 3 tasks, 6 saved contexts

# Show specific task details
/task-list integration-tests

# Output:
# # Task: integration-tests
#
# ## Overview
# API integration testing with Jest. Edge cases and error handling.
#
# ## CLAUDE.md
# 147 lines
#
# ## Saved Contexts
# 1. initial-setup (45 msgs, 12k tokens) - 3 days ago
# 2. edge-cases (156 msgs, 34k tokens) - 1 day ago
# 3. timeout-work (89 msgs, 19k tokens) - 2 hours ago
```

---

#### `/task-manage`

Interactive task management interface.

**Features**:
- Rename tasks
- Edit task CLAUDE.md
- View task statistics
- Delete tasks

---

#### `/task-delete <task-id>`

Delete a task and all its contexts (with confirmation).

**Example**:
```bash
/task-delete integration-tests

# Output:
# ⚠️ Delete task 'integration-tests'?
#
# This will permanently delete:
# • Task CLAUDE.md (147 lines)
# • 3 saved contexts:
#   - initial-setup (45 msgs)
#   - edge-cases (156 msgs)
#   - timeout-work (89 msgs)
#
# Type 'delete integration-tests' to confirm:
```

---

### Context Management

#### `/context-list [task-id]`

List all contexts in the active task or specified task.

**Examples**:
```bash
# List contexts in active task
/context-list

# List contexts in specific task
/context-list integration-tests

# Output:
# # Contexts: integration-tests
#
# 1. initial-setup
#    • 45 messages, 12k tokens
#    • Created: 3 days ago
#    • Last modified: 3 days ago
#
# 2. edge-cases
#    • 156 messages, 34k tokens
#    • Created: 1 day ago
#    • Last modified: 2 hours ago
#
# Total: 2 contexts
#
# Load: /task integration-tests <context-name>
```

---

#### `/context-manage [task-id]`

Interactive context management interface.

**Features**:
- Rename contexts
- View context details
- Compare contexts
- Delete contexts

---

#### `/context-delete <context-name> [task-id]`

Delete a saved context (with confirmation).

**Example**:
```bash
/context-delete edge-cases

# Output:
# ⚠️ Delete context 'edge-cases' from task 'integration-tests'?
#
#     156 messages, 34k tokens
#     Created: 1 day ago
#     Last modified: 2 hours ago
#
# Type 'delete edge-cases' to confirm:
```

---

## Real-World Workflows

### Workflow 1: Feature Development with Context Snapshots

```bash
# Day 1: Start feature
/task-create user-auth
/task user-auth

# ... work on JWT implementation ...
/task-save jwt-initial

# Day 2: Continue after code review feedback
/task user-auth jwt-initial

# ... update based on feedback ...
/task-save jwt-v2

# Day 3: Add refresh tokens
/task user-auth jwt-v2

# ... implement refresh tokens ...
/task-save jwt-complete

# Now you have a progression:
# jwt-initial → jwt-v2 → jwt-complete
```

### Workflow 2: Multi-Instance Parallel Work

```bash
# Terminal 1: Integration tests
$ claude
/task integration-tests edge-cases
# [Working on edge case tests]

# Terminal 2: Bug fix (while T1 runs)
$ claude
/task bug-fix production-issue
# [Debugging production bug]

# Terminal 3: Documentation (while T1 & T2 run)
$ claude
/task documentation api-reference
# [Writing API docs]

# Terminal 4: Code review (while T1, T2, T3 run)
$ claude
/task code-review pr-1234
# [Reviewing pull request]

# All 4 instances completely isolated! ✅
```

### Workflow 3: Context Switching Without Loss

```bash
# Working on API refactor
/task api-refactor
# ... 2 hours of work ...

# Urgent bug reported!
/task bug-fix
# Claude: Current session: 89 messages. Save? (yes/no)
yes
# Claude: Context name?
pre-interruption
# ✓ Saved!

# Fix the bug...
/task-save hotfix-applied

# Back to API refactor exactly where you left off
/task api-refactor pre-interruption
# [All 89 messages restored]
```

### Workflow 4: Team Collaboration

```bash
# Developer A creates task template
/task-create integration-tests
# [Creates comprehensive testing CLAUDE.md]

# Commit .context-curator/tasks/integration-tests/CLAUDE.md
git add .context-curator/tasks/integration-tests/CLAUDE.md
git commit -m "Add integration testing task template"
git push

# Developer B pulls and uses the template
git pull
/task integration-tests
# [Gets the same testing instructions Developer A defined]
```

---

## Architecture

### Directory Structure

```
my-project/
├── .claude/
│   ├── CLAUDE.md                         # Universal + @-import line
│   ├── skills/                           # Shared by ALL tasks
│   ├── agents/                           # Shared by ALL tasks
│   └── commands/                         # Slash commands (symlinked)
│
├── .context-curator/
│   ├── tasks/
│   │   ├── default/
│   │   │   ├── CLAUDE.md
│   │   │   └── contexts/
│   │   │       ├── quick-fix.jsonl
│   │   │       └── experiment.jsonl
│   │   ├── integration-tests/
│   │   │   ├── CLAUDE.md
│   │   │   └── contexts/
│   │   │       ├── initial-setup.jsonl
│   │   │       ├── edge-cases.jsonl
│   │   │       └── refactor-v2.jsonl
│   │   ├── api-refactor/
│   │   │   ├── CLAUDE.md
│   │   │   └── contexts/
│   │   └── session-task-map.json        # Session tracking
│   │
│   ├── src/
│   │   ├── task-manager.ts              # Core task utilities
│   │   ├── session-reader.ts
│   │   ├── session-writer.ts
│   │   └── utils.ts
│   │
│   ├── scripts/
│   │   ├── init-project.ts              # Project initialization
│   │   ├── update-import.ts             # @-import updater
│   │   ├── prepare-context.ts           # Session preparation
│   │   ├── task-save.ts                 # Save contexts
│   │   ├── task-list.ts                 # List tasks
│   │   └── context-list.ts              # List contexts
│   │
│   ├── commands/                         # Command definitions
│   │   ├── task.md
│   │   ├── task-create.md
│   │   ├── task-save.md
│   │   └── ...
│   │
│   └── package.json
│
└── [your project files...]
```

### Storage Details

**Tasks are stored in**: `.context-curator/tasks/<task-id>/`

**Contexts are stored in**: `.context-curator/tasks/<task-id>/contexts/<context-name>.jsonl`

**Session tracking**: `.context-curator/tasks/session-task-map.json`

**Format**: Standard JSONL (one message per line, matches Claude Code's format)

---

## Example Task CLAUDE.md

Here's what a task looks like after creation:

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
- **test-generator**: Use the "integration" template for API endpoints
- **coverage-analyzer**: Run after each test suite to ensure 90%+ coverage
- **api-mocker**: Mock payment gateways and third-party APIs with realistic delays

### Preferred Agents
- **test-reviewer**: Review for edge case coverage and test isolation

## Patterns

### Integration Test Structure
\`\`\`typescript
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
    expect(response.body.error).toContain('Invalid credentials');
  });
});
\`\`\`

## Reference
- [Internal testing guidelines](https://wiki.example.com/testing)
- [API contract docs](https://api.example.com/docs)
- [Jest best practices](https://jestjs.io/docs/api)
```

---

## Technical Requirements

### Prerequisites
- Claude Code installed
- Node.js 18+
- TypeScript 5+
- tsx for running scripts

### No Additional Accounts Needed
- ✅ No Anthropic API key required
- ✅ Works entirely within Claude Code
- ✅ Uses native features only

---

## Advanced Topics

### Shared Skills and Agents

**Design Decision**: Skills and agents are project-wide, not task-specific.

**Why?**
- Most tools (linters, formatters, test generators) work across all tasks
- Simpler mental model
- Can be enhanced in future versions if needed

**How it works**:
- All tasks use skills from `.claude/skills/`
- All tasks use agents from `.claude/agents/`
- Task CLAUDE.md provides guidance on WHEN and HOW to use them for that task

### Session Tracking

`session-task-map.json` tracks which session belongs to which task:

```json
{
  "sess-a1b2c3d4": {
    "task_id": "integration-tests",
    "context_name": "edge-cases",
    "created_at": "2026-01-10T15:30:00Z"
  },
  "sess-e5f6g7h8": {
    "task_id": "api-refactor",
    "context_name": null,
    "created_at": "2026-01-10T16:45:00Z"
  }
}
```

This enables:
- Smart task detection in `/task-save`
- Session history tracking
- Future analytics and recommendations

### Git Integration

**Recommended `.gitignore` additions**:

```gitignore
# Context Curator - Ignore user-specific contexts
.context-curator/tasks/*/contexts/
.context-curator/tasks/session-task-map.json

# Context Curator - Commit task templates
!.context-curator/tasks/*/CLAUDE.md
```

**Share task templates with team**:
```bash
# Commit task definitions
git add .context-curator/tasks/integration-tests/CLAUDE.md
git add .context-curator/tasks/api-refactor/CLAUDE.md
git commit -m "Add integration-tests and api-refactor task templates"
git push

# Team members get the task templates
git pull
/task integration-tests  # Uses the shared template!
```

---

## Troubleshooting

### Issue: @-import line not updating

**Symptoms**: Running `/task <id>` but CLAUDE.md still has old import.

**Solutions**:
1. Check PreToolUse hook is present in `commands/task.md`
2. Run manually: `npx tsx .context-curator/scripts/update-import.ts <task-id>`
3. Verify task exists: `ls .context-curator/tasks/<task-id>/CLAUDE.md`
4. Check for file permissions

### Issue: Session not finding context

**Symptoms**: `/task <id> <context>` says context not found.

**Solutions**:
1. List available contexts: `/context-list <task-id>`
2. Check file exists: `ls .context-curator/tasks/<task-id>/contexts/<context>.jsonl`
3. Verify context name format (must be lowercase, numbers, hyphens only)
4. Check for typos in context name

### Issue: Multi-instance interference

**Symptoms**: Running instances seem to affect each other.

**This shouldn't happen!** If it does:
1. Verify each instance was started AFTER its `/task` command
2. Check CLAUDE.md wasn't manually edited during sessions
3. Confirm Claude Code version doesn't reload CLAUDE.md mid-session
4. Restart affected instances in the correct order (task command first, then resume)

### Issue: Task CLAUDE.md not being used

**Symptoms**: Session doesn't follow task-specific instructions.

**Solutions**:
1. Check @-import line: `grep '@import' .claude/CLAUDE.md`
2. Verify you ran `/resume` AFTER the `/task` command
3. Ensure you started a NEW session, not resuming an old one
4. Read the task CLAUDE.md to confirm it has content

### Issue: Commands not found

**Symptoms**: `/task` or other commands don't work.

**Solutions**:
1. Check symlinks exist: `ls -la .claude/commands/`
2. Re-run install: `cd .context-curator && ./install.sh`
3. Manually create symlinks: `ln -sf ../.context-curator/commands/* .claude/commands/`

---

## Performance Tips

### Keep Contexts Lean

```bash
# Instead of one massive context
/task-save everything  # 500 msgs, 120k tokens ❌

# Use multiple focused contexts
/task-save initial-setup     # 45 msgs, 12k tokens ✅
/task-save edge-cases        # 89 msgs, 19k tokens ✅
/task-save refactor-phase-1  # 67 msgs, 15k tokens ✅
```

### Use Task-Specific Instructions

Make each task's CLAUDE.md focused:

❌ **Too general**:
```markdown
# Task: testing
Follow testing best practices.
```

✅ **Specific and actionable**:
```markdown
# Task: integration-tests

## Focus
API integration testing with Jest. Edge cases and error handling.

## Guidelines
- Use supertest for HTTP testing
- Mock with jest.mock(), avoid real API calls
- Test timeouts, malformed data, auth failures
- 90%+ coverage on critical paths
```

### Organize Tasks by Work Type

Good task structure:
```
tasks/
├── integration-tests/      # API testing
├── unit-tests/             # Component testing
├── api-refactor/           # Endpoint redesign
├── bug-fix/                # Production issues
├── documentation/          # Docs and examples
└── code-review/            # PR reviews
```

Poor task structure:
```
tasks/
├── monday-work/            # ❌ Temporal, not focused
├── various-stuff/          # ❌ Too broad
├── project-alpha/          # ❌ By project, not work type
```

---

## Version History

- **v10.0** (2026-01-10): Task-based architecture with @-import mechanism for multi-instance safety
- **v0.3.0** (2026-01-08): Conversational manage - SUPERSEDED
- **v0.2.0** (2026-01-07): Unified context command - SUPERSEDED  
- **v0.1.0** (2026-01-06): Initial session management - SUPERSEDED

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Update documentation (README, PRD, Dev Plan)
5. Commit with clear messages
6. Push to your branch
7. Open a pull request

### Development Setup

```bash
git clone https://github.com/your-org/context-curator.git
cd context-curator
npm install
npm test  # Run tests
npx tsc   # Check TypeScript compilation
```

### Sharing Task Templates

Create a task template and share it:

```bash
# Create a great task template
/task-create your-task

# Commit just the CLAUDE.md
git add .context-curator/tasks/your-task/CLAUDE.md
git commit -m "Add <task-name> template"
git push
```

---

## Roadmap

### v1.1 (Planned)
- Task templates library (integration-tests, api-design, bug-fix, etc.)
- Auto-suggest task when starting new work
- Context analytics and token optimization suggestions
- Task usage statistics dashboard

### v1.2 (Planned)
- Task collaboration features (share task definitions)
- Context diff viewer (compare contexts)
- Automated context optimization (summarize old messages)
- Cross-project task templates (global library)

### v2.0 Vision (If Officially Adopted by Anthropic)
- Built into Claude Code natively
- Native task picker UI in Claude Code
- Session-scoped configuration
- Per-task skills and agents (not just guidance)
- Cloud sync for task templates
- Official Anthropic support

---

## Philosophy & Design

### Why @-import?

**Claude Code reads CLAUDE.md once at startup** - Perfect for multi-instance workflows!

**One line changes** - Minimal surface area, low risk, easy to debug.

**Transparent** - Developers can grep CLAUDE.md to see current task anytime.

### Why Task-Based?

**Research shows optimal context is task-specific** - Exactly what's needed for current work.

**Isolation prevents contamination** - Test context doesn't leak into API design.

**Natural organization** - Humans think in tasks, not sessions.

### Why Hard Reset (/clear)?

**Atomic operations are predictable** - No partial state, no confusion.

**Clean slate** - Each task switch starts fresh with clear focus.

**Multi-instance safe** - No residual context from previous work.

### Why Custom Slash Commands?

**Official extension mechanism** - Aligns with Anthropic's vision for Claude Code.

**PreToolUse hooks** - Enable atomic updates before command execution.

**No API key needed** - Uses only Claude Code native features.

### Path to Official Adoption

This design:
- ✅ Uses only official features (no hacks)
- ✅ Solves real user pain (multi-instance + context management)
- ✅ Aligns with Claude Code's architecture
- ✅ Could be integrated with minimal changes
- ✅ Demonstrates value through community adoption

**Goal**: Build something so useful that Anthropic wants to make it official.

---

## License

MIT License - See LICENSE file for details

---

## Acknowledgments

- **Claude Code team at Anthropic** - For extensibility features that make this possible
- **Boris Cherny** - For the multi-instance workflow inspiration (8-9 instances!)
- **Community contributors** - For testing, feedback, and improvements

---

**Built with ❤️ for the Claude Code community**

Questions? Issues? Ideas? → [Open an issue](https://github.com/your-org/context-curator/issues)
