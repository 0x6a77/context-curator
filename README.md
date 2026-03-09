# Context Curator

Task-based context management for Claude Code. Preserve your hard-won Claude understanding.

Version 13.0 • [PRD](prod-mgmt/context-curator-prd.md) • [Dev Plan](prod-mgmt/context-curator-devplan.md)

## The Problem

Working on large, legacy codebases requires hours to warm Claude up on a specific subsystem. Once Claude understands the quirks, patterns, and gotchas, it performs exceptionally. But auto-compact destroys this hard-won understanding, forcing you to start over.

```
Hour 0: Start fresh on auth subsystem
Hour 1-3: Claude warms up (understands OAuth flow, session tokens, edge cases)
Hour 4-6: SWEET SPOT ✨ (Claude is crushing it)
Hour 7: Auto-compact happens 💥
😤 Back to generic suggestions, hours of knowledge lost
```

## The Solution

Context Curator lets you:
- **Save warmed-up sessions** as named context snapshots
- **Organize work into tasks** with focused instructions
- **Share valuable contexts** with your team (golden contexts)
- **Keep personal contexts private** by default

**Key Innovation:** Claude Code's `/resume` re-reads CLAUDE.md from disk. We swap task-specific instructions at resume-time without polluting your project or causing git conflicts.

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/0x6a77/context-curator.git
cd context-curator

# Run the installer
./install.sh
```

The installer compiles the TypeScript source and copies everything into place:
- Scripts: `~/.claude/context-curator/dist/`
- Slash commands: `~/.claude/commands/task/`

### Per-Project Setup

To add Context Curator to a new git project, you need to set up three things:
1. Claude Code project configuration (`.claude/` directory)
2. Container-use for sandboxed development (optional but recommended)
3. Git commit message conventions

#### 1. Claude Code Configuration

Create the `.claude/` directory and config files in your project root:

```bash
cd ~/my-project
mkdir -p .claude
```

**`.claude/settings.json`** — Project-level Claude Code settings:

```json
{
  "env": {
    "INHERIT_FROM_SHELL": "true"
  },
  "sandbox": {
    "enabled": true,
    "excludedCommands": [
      "node ~/.claude/context-curator/dist/scripts/"
    ]
  }
}
```

The `sandbox.enabled: true` setting turns on Claude Code's built-in sandboxing, which restricts file system writes to the project directory and a few safe locations. This prevents Claude from accidentally modifying files outside your project.

The `excludedCommands` entry is required when using sandboxing with Context Curator. Context Curator stores task and context data in `~/.claude/projects/`, which is outside the sandbox's default write allowlist. Without this exemption, commands like `/task` will fail with `EPERM: operation not permitted`. The exemption is scoped to Context Curator's compiled scripts only — Claude's code changes remain fully sandboxed.

**`.claude/CLAUDE.md`** — Auto-generated file for task switching (git-ignored):

```markdown
# Project: my-project

## Universal Instructions

Add your project-wide guidelines here:
- Coding standards
- Common commands
- Shared practices

## Task-Specific Context

<!-- This line is managed by context-curator. Do not edit manually. -->
```

This file gets modified when you switch tasks — the `@import` line is updated to point at the active task's CLAUDE.md. Since each developer has their own active task, this file must be git-ignored.

**`.claude/.gitignore`** — Prevent per-developer files from being committed:

```
CLAUDE.md
settings.local.json
```

The `settings.local.json` file holds per-developer permission grants (auto-populated as you approve tool use). It should never be committed.

#### 2. Root CLAUDE.md

Your project root should have a `CLAUDE.md` with project-wide instructions. Context Curator never modifies this file. The easiest way to create one is with Claude's built-in `/init` command:

```bash
cd ~/my-project
claude
You: /init
```

Claude will analyze your project and generate a `CLAUDE.md` with relevant build commands, code style conventions, and project structure. You can then edit it to add any additional context.

For tips on writing effective CLAUDE.md files, see the [Claude Code best practices](https://code.claude.com/docs/en/best-practices).

#### 3. Container-Use Setup (Recommended)

[Container-use](https://github.com/anthropics/container-use) runs Claude's file and shell operations inside containers, giving you an extra layer of isolation and reproducible environments.

To enable container-use with Claude Code, add these instructions to your global `~/.claude/CLAUDE.md`:

```markdown
## container use

ALWAYS use ONLY Environments for ANY and ALL file, code, or shell operations—NO EXCEPTIONS—even for simple or generic requests.

DO NOT install or use the git cli with the environment_run_cmd tool. All environment tools will handle git operations for you. Changing ".git" yourself will compromise the integrity of your environment.

You MUST inform the user how to view your work using `container-use log <env_id>` AND `container-use checkout <env_id>`. Failure to do this will make your work inaccessible to others.
```

With container-use enabled, Claude creates isolated environments for each piece of work. You review and merge changes with:

```bash
container-use log <env_id>     # View what Claude did
container-use checkout <env_id> # Apply changes to your working tree
```

#### 4. Git Commit Message Instructions

To get consistent commit messages from Claude, add this to your global `~/.claude/CLAUDE.md`:

```markdown
## Git Commits

For every prompt YOU MUST suggest a commit message of the form: first line fits into 50 characters that summarizes the prompt and ends in "(claude 4)", followed by a blank line, followed by the prompt.
```

This produces commits like:

```
Update README with install docs (claude 4)

please update the readme to include information about how to install
context-curator into a new git project. include the initial claude-code
setup along with container-use and claude sandboxing.
```

The `(claude 4)` suffix makes it easy to identify AI-assisted commits in your git log.

#### 5. Initialize Context Curator

Start Claude Code in your project and initialize:

```bash
cd ~/my-project
claude
You: /task-init
```

This creates the two-file CLAUDE.md system (see [How It Works](#how-it-works)).

#### Summary of Files

After setup, your project should have:

```
my-project/
├── CLAUDE.md                    # Project instructions (committed)
├── .claude/
│   ├── CLAUDE.md                # Task switcher (git-ignored)
│   ├── settings.json            # Sandbox + env config (committed)
│   ├── settings.local.json      # Personal permissions (git-ignored)
│   └── .gitignore               # Ignores CLAUDE.md, settings.local.json
└── .gitignore                   # Your normal project gitignore
```

And globally:

```
~/.claude/
├── CLAUDE.md                    # Global instructions (commit msgs, container-use)
├── commands/task/               # Context Curator slash commands
└── context-curator/dist/        # Compiled scripts
```

### Basic Usage

```bash
# Start a new task
/task oauth-refactor
> What should this task focus on?
"Refactoring the legacy OAuth implementation in src/auth/"

✓ Created task: oauth-refactor
Run: /resume sess-abc123

# Work for hours, Claude gets warmed up...
# Save your hard-won understanding
/context-save oauth-deep-dive
> Save as: 1. Personal  2. Golden
2

✓ Saved as golden context

# Later, or on a teammate's machine:
/task oauth-refactor
> Which context?
> 1. oauth-deep-dive (47 msgs) ⭐
1

Run: /resume sess-xyz789
# Claude is INSTANTLY warmed up! ✨
```

## Native Claude Code Tools

Claude Code ships several built-in commands that complement Context Curator:

| Command | What it does |
|---------|-------------|
| `/fork [name]` | Fork the current conversation at this point — great for exploring alternatives without losing your main thread |
| `/rewind` | Roll back to a previous checkpoint (restores code and/or conversation). Use `Esc+Esc` as shortcut |
| `/rename [name]` | Give the current session a memorable name so it's easy to find with `/resume` |
| `/compact [instructions]` | Manually compact conversation with optional focus instructions (Context Curator auto-saves before this fires) |
| `/context` | Visualize current token usage as a colored grid |
| `/export [filename]` | Export the conversation as plain text |

**How these work with Context Curator:**
- Use `/rename` to give sessions meaningful names, then `/resume <name>` to come back to them
- Use `/fork` to branch explorations — save the branch with `/context-save` if it works out
- Context Curator's `PreCompact` hook fires automatically before `/compact`, so your context is always saved before compaction
- `/rewind` works at the code/file level; Context Curator works at the conversation level — they complement each other

## Tutorial

This step-by-step tutorial walks you through a complete workflow with Context Curator.

### Scenario

You're working on a complex legacy codebase. The authentication system uses a mix of OAuth 2.0, session tokens, and API keys scattered across multiple files. You need to refactor it, but first you need Claude to understand all the quirks.

### Step 1: Initialize Your Project

First, set up Context Curator for your project:

```bash
cd ~/my-legacy-app
claude

You: /task-init
```

This creates the two-file CLAUDE.md system. Your project now has:
- `./CLAUDE.md` — Your canonical project docs (unchanged)
- `./.claude/CLAUDE.md` — Auto-generated, git-ignored, swapped at task-switch time

### Step 2: Create Your First Task

Create a task for the auth refactor:

```bash
You: /task auth-refactor

Claude: What should this task focus on?

You: Refactoring the legacy authentication system. It has OAuth 2.0
     in src/auth/oauth.js, session tokens in lib/sessions/, and
     API keys scattered throughout. Need to consolidate into a
     single auth service.

Claude: ✓ Created task: auth-refactor
        Task instructions saved.

        To start: /resume <session-id>
```

### Step 3: Build Up Understanding

Now work with Claude to understand the codebase. This is where the magic happens:

```bash
You: Let's start by mapping out all the authentication entry points.

Claude: [Explores codebase, finds OAuth flow, session handling, API key validation]

You: What about the refresh token logic? It seems broken.

Claude: [Deep dives into token refresh, finds edge cases, explains the bug]

You: Walk me through the session invalidation flow.

Claude: [Traces through lib/sessions/, understands the race condition]
```

After a few hours, Claude has deep understanding of your auth system — the patterns, the bugs, the gotchas, the tribal knowledge that's nowhere in the docs.

### Step 4: Save Your Hard-Won Context

Before auto-compact destroys this understanding, save it:

```bash
You: /context-save auth-deep-understanding

Claude: Scanning for secrets... ✓ None found

        Save as:
        1. Personal (only you)
        2. Golden (shared via git)

You: 1

Claude: ✓ Saved as 'auth-deep-understanding'
        47 messages, ~12k tokens
```

### Step 5: Handle Interruptions Gracefully

An urgent bug comes in. You need to context-switch:

```bash
You: /context-save pre-interruption

Claude: ✓ Saved as 'pre-interruption'

You: /task urgent-bug

Claude: What should this task focus on?

You: Payment webhook failing in production

Claude: ✓ Created task: urgent-bug
```

Fix the bug, then return exactly where you left off:

```bash
You: /task auth-refactor

Claude: Which context?
        Personal:
          1. auth-deep-understanding (47 msgs)
          2. pre-interruption (52 msgs)

You: 2

Claude: Loading context...
        Run: /resume sess-abc123
```

After `/resume`, Claude remembers everything — the OAuth quirks, the session race condition, exactly where you stopped.

### Step 6: Share Valuable Knowledge

You've figured out the complete auth flow. Share it with your team:

```bash
You: /context-promote auth-deep-understanding

Claude: Scanning for secrets...
        ✓ None found

        ✓ Promoted to golden context

        Next steps:
        git add .claude/tasks/auth-refactor/contexts/auth-deep-understanding.jsonl
        git commit -m "Share auth system understanding"
        git push
```

Now when teammates run `/task auth-refactor`, they'll see your golden context:

```bash
# On Bob's machine, after git pull
Bob: /task auth-refactor

Claude: Which context?
        Golden:
          1. auth-deep-understanding (47 msgs) ⭐ by: alice

Bob: 1

# Bob now has Alice's full understanding of the auth system
```

### Step 7: List and Manage Contexts

See what contexts you have:

```bash
You: /context-list auth-refactor

Claude: Sessions:
          8e14f625... (current)  23 msgs  ~6k - just now

        Personal contexts:
          pre-interruption       52 msgs - today [auth-refactor]

        Golden contexts:
          auth-deep-understanding  47 msgs - today [auth-refactor] ⭐
```

Manage contexts interactively:

```bash
You: /context-manage

Claude: Available actions:
        - rename, delete, merge
        - promote (personal → golden)
        - demote (golden → personal)
        - view, diff, secrets, clean

        Which action?
```

### Putting It All Together

Here's the complete workflow in practice:

```
┌─────────────────────────────────────────────────────────────────┐
│  Day 1 Morning                                                  │
│  /task auth-refactor                                            │
│  ... 3 hours of exploration, Claude gets warmed up ...          │
│  /context-save morning-progress                                 │
├─────────────────────────────────────────────────────────────────┤
│  Day 1 Afternoon                                                │
│  /task auth-refactor → load: morning-progress                   │
│  /resume sess-xxx                                               │
│  ... continue exactly where you left off ...                    │
│  /context-save found-the-bug                                    │
├─────────────────────────────────────────────────────────────────┤
│  Day 2                                                          │
│  /task auth-refactor → load: found-the-bug                      │
│  ... implement the fix with full context ...                    │
│  /context-save refactor-complete                                │
│  /context-promote refactor-complete → share with team           │
└─────────────────────────────────────────────────────────────────┘
```

### Tips for Success

1. **Save early, save often** — Don't wait for auto-compact. Save whenever Claude reaches peak understanding.

2. **Use descriptive names** — `auth-token-edge-cases` beats `work-tuesday`.

3. **Keep tasks focused** — One subsystem per task. `auth-refactor` not `backend-stuff`.

4. **Promote thoughtfully** — Only share contexts that would genuinely help teammates.

5. **Resume, don't continue** — Always use `/resume` after switching tasks to reload CLAUDE.md from disk.

---

## Core Concepts

### Tasks

A **task** is a focused work environment with:
- Custom CLAUDE.md instructions
- Personal context snapshots (private)
- Golden context snapshots (shared with team)

**Examples:** `oauth-refactor`, `payment-integration`, `legacy-migration`

### Contexts

A **context** is a named snapshot of a Claude Code session.

**Personal contexts** (default):
- Saved in `~/.claude/projects/.../contexts/`
- Never committed to git
- Your private work history

**Golden contexts** (explicitly shared):
- Saved in `./.claude/tasks/.../contexts/`
- Committed to git
- Team knowledge base

### The Two CLAUDE.md Files

This is how we avoid git conflicts:

**`./CLAUDE.md` (Root, Committed)**
- Your canonical project knowledge
- **Never modified by context-curator**
- Committed, reviewed, shared normally

**`./.claude/CLAUDE.md` (Auto-generated, Git-ignored)**
- What Claude Code actually reads
- Contains `@import` to current task
- Each developer has their own
- Modified when you switch tasks

## Commands

### /task \<task-id\>

Switch to a task. Creates if new, shows context menu if exists.

```bash
/task oauth-refactor

# If new:
> What should this task focus on?

# If exists:
> Which context?
> Personal: 1. my-progress (15 msgs)
> Golden:   2. oauth-deep-dive (47 msgs) ⭐
```

### /context-save \<name\>

Save current session as a context.

```bash
/context-save edge-cases

Scanning for secrets... ✓ None found

Save as:
1. Personal (only you)
2. Golden (shared via git)

Choice: 1

✓ Saved as 'edge-cases'
```

### /context-list [task-id]

List contexts and sessions in compact format (newest first).

```bash
/context-list oauth-refactor

Sessions:
  8e14f625... (current)  23 msgs   ~6k - just now

Personal contexts:
  my-progress           15 msgs - today [oauth-refactor]

Golden contexts:
  oauth-deep-dive       47 msgs - yesterday [oauth-refactor] ⭐
```

### /context-manage

Interactive context management.

```bash
/context-manage

Available actions:
- rename, delete, merge
- promote (personal → golden)
- demote (golden → personal)
- view, diff, secrets, clean
```

### /context-promote \<name\>

Promote a personal context to golden (shared with team).

```bash
/context-promote edge-cases

Scanning for secrets...
⚠️ Found: Line 89: API key pattern

Options:
1. Continue anyway
2. Redact secrets first
3. Cancel

Choice: 2

✓ Promoted to golden context

Next steps:
git add .claude/tasks/oauth-refactor/contexts/edge-cases.jsonl
git commit -m "Share edge-cases context"
```

## How It Works

### The @import Mechanism

Your `.claude/CLAUDE.md` contains:

```markdown
# Project: my-app

## Universal Instructions
[Your project-wide guidelines]

## Task-Specific Context
@import ~/.claude/projects/-Users-dev-my-app/tasks/oauth-refactor/CLAUDE.md
```

When you run `/task payment-integration`:
1. Context-curator updates the @import line
2. You run `/resume sess-xyz`
3. Claude Code re-reads CLAUDE.md (fresh from disk!)
4. New task instructions take effect

### File Locations

**Project (committed to git):**
```
my-project/
├── CLAUDE.md                     # Never modified
└── .claude/
    ├── CLAUDE.md                 # Git-ignored, auto-generated
    ├── tasks/
    │   └── oauth-refactor/
    │       ├── CLAUDE.md         # Task instructions
    │       └── contexts/         # Golden contexts
    │           └── oauth-deep-dive.jsonl
    └── .gitignore
```

**Personal (never committed):**
```
~/.claude/
├── commands/                     # Global commands
└── projects/
    └── -Users-dev-my-project/
        └── tasks/
            └── oauth-refactor/
                └── contexts/     # Personal contexts
                    └── my-work.jsonl
```

## Workflows

### Solo Developer

```bash
# Create task
/task auth-fixes
> "Fix authentication bugs in the mobile app"

# Work for a few hours, Claude gets warmed up
# ... fixing bugs, understanding the auth system ...

# Save before auto-compact strikes
/context-save auth-deep-dive
> 1 (Personal)

# Next day
/task auth-fixes
> 1. auth-deep-dive
/resume sess-abc

# Instantly back to full understanding
```

### Team Collaboration

```bash
# Alice creates and shares a golden context
/task payment-integration
# ... extensive work understanding Stripe flow ...
/context-save stripe-complete
> 2 (Golden)

git add .claude/tasks/payment-integration/contexts/stripe-complete.jsonl
git commit -m "Add Stripe integration golden context"
git push

# Bob pulls and uses Alice's context
git pull
/task payment-integration
> 1. stripe-complete (by: alice) ⭐

# Bob is instantly productive on payments
```

### Context Switching

```bash
# Working on API refactor
/task api-refactor
# ... 2 hours of deep work ...

# Urgent bug! Need to switch
/context-save pre-interruption
> 1 (Personal)

# Switch to bug fix
/task bug-fix
# ... fix the bug ...

# Back to API work, exactly where you left off
/task api-refactor
> pre-interruption
/resume sess-xyz
```

## Best Practices

### Save Often

Don't wait for auto-compact. Save whenever Claude reaches peak understanding:

```bash
# Good checkpoints
/context-save after-understanding-auth
/context-save found-the-bug
/context-save refactor-plan-ready
```

### Use Descriptive Names

```bash
# Good
/context-save oauth-token-edge-cases
/context-save stripe-webhook-debugging

# Avoid
/context-save work
/context-save tuesday
```

### Promote Thoughtfully

Only promote contexts that would help teammates:
- Complete understanding of a subsystem
- Debugging approaches that worked
- Architecture decisions with rationale

### Keep Tasks Focused

```bash
# Good: Focused tasks
/task oauth-refactor
/task payment-webhooks
/task mobile-auth-bugs

# Avoid: Vague tasks
/task backend-work
/task misc-fixes
```

## Troubleshooting

### Context not loading

1. Verify context exists: `/context-list <task>`
2. Check file location (personal vs golden)
3. Ensure valid name (lowercase, numbers, hyphens)

### @import not taking effect

1. Check `.claude/CLAUDE.md` has @import line
2. Use `/resume` to reload (not just continue)
3. Verify task CLAUDE.md exists

### Secrets warning on promote

1. Review flagged lines
2. Choose "Redact secrets first" if real secrets
3. Use "Continue anyway" for false positives

### Git conflicts in .claude/

1. `.claude/CLAUDE.md` should be git-ignored
2. Check `.claude/.gitignore` contains `CLAUDE.md`
3. Only `tasks/*/` contents should be committed

### EPERM error when using sandbox + container-use

If you see `EPERM: operation not permitted, mkdir '~/.claude/projects/...'` when running `/task`, the sandbox is blocking Context Curator from writing outside the project directory.

Add `excludedCommands` to your `.claude/settings.json`:

```json
{
  "sandbox": {
    "enabled": true,
    "excludedCommands": [
      "node ~/.claude/context-curator/dist/scripts/"
    ]
  }
}
```

This lets Context Curator scripts write to `~/.claude/projects/` while keeping all other sandbox restrictions in place.

## Technical Details

**Requirements:** Claude Code (that's it!)

**No API key needed:** Works entirely within Claude Code using:
- Custom slash commands
- `context: fork` for session analysis
- Native `/resume` behavior
- Standard file operations

**Session format:** JSONL (one JSON message per line)

## Version History

- **v13.1** (2026-02-21): Document excludedCommands requirement for sandbox + container-use
- **v13.0** (2026-01-17): Two-file CLAUDE.md system, golden contexts, secret detection
- **v10.0** (2026-01-10): Task-based architecture with @-import mechanism

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

BSD-3-Clause. See [LICENSE](LICENSE).

## Credits

- Claude Code team at Anthropic for extensibility features
- Every developer who's lost hours of hard-won context to auto-compact

---

**Built with ❤️ to preserve developer sanity and hard-won knowledge**
