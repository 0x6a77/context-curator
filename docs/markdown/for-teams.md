# For Teams

This page covers sharing warmed-up contexts with teammates, project-scope
installation, and team skill bundles.

## Golden Contexts

A [golden context](glossary.md#golden-context) is a personal context that's
been promoted to the project repo. Once promoted, any teammate can restore it
— they get the same warmed-up understanding without the warm-up cost.

### Promoting a Context

```bash
/context-promote deep-understanding
```

This:
1. Scans the context for secrets — blocks if any are found
2. Checks the size — blocks if over 100KB
3. Asks for confirmation
4. Copies from your personal storage to `.claude/tasks/<task>/contexts/`

Your personal original is preserved. The golden copy is committed to git
when you next push.

Teammates then see it in their context list:

```
auth-refactor — contexts

Golden (shared):
  ⭐ 1. deep-understanding (47 msgs, jsmith, 2026-05-09) — Mapped token
       refresh flow, found the session race condition
```

### Saving Directly as Golden

```bash
/context-save team-baseline --golden
```

Saves directly to the project. Useful when you're confident the session is
worth sharing and don't want a personal copy first.

---

## Project-Scope Install

By default, Context Curator installs globally — it's available on your
machine but not automatically to teammates.

To make it available to every developer who clones your repo — with no
global install required:

```bash
cd ~/my-project
./install.sh --project-install
```

This copies the skills into `.claude/skills/context-curator/` in your
project. Commit that directory and teammates get the full command set
automatically when they pull.

**What this looks like in your repo:**

```
.claude/
  skills/
    context-curator/
      session/
        task/
        context-save/
        context-list/
        context-manage/
        context-promote/
      monitor/
        ...
      authoring/
        ...
```

Commit this directory. Teammates don't need to run `install.sh`.

---

## Selective Bundle Install

Teams don't have to install everything. Context Curator ships in bundles:

| Bundle | What's Included | Good for |
|--------|----------------|----------|
| `session` | `/task`, `/context-save`, `/context-list`, `/context-manage`, `/context-promote` | Core context management |
| `monitor` | Status line, zone warnings, cost tracking | Session health monitoring |
| `authoring` | `/prd`, `/test-plan`, `/dev-plan`, `/test-inventory` | PRD-driven development |
| `full` | Everything | Install once, use everything |

```bash
# Install only what you need
/plugin marketplace add context-curator/session
/plugin marketplace add context-curator/monitor

# Or everything
/plugin marketplace add context-curator/full
```

When skills exist at both user scope (`~/.claude/skills/`) and project scope
(`.claude/skills/`), project scope takes precedence. Teams can pin a specific
bundle version without affecting other projects.

---

## Team Manifests

Teams can publish their own skill bundles alongside Context Curator's —
custom skills, internal tools, or curated subsets. Commit a manifest to the
project:

```json
{
  "bundles": {
    "custom": {
      "description": "Team-specific skills",
      "skills": ["authoring/code-review", "session/task"]
    }
  }
}
```

Save as `.claude/context-curator-manifest.json` and any developer who runs
`/plugin marketplace list` will see the custom bundle.

---

## Version Verification

The installed manifest version must match `dist/version.json`. To check:

```bash
npx tsx scripts/verify-manifest.ts
```

Exits non-zero and names the conflict if there's a mismatch. Re-run
`install.sh` to repair.

---

## Sandbox Configuration

If your project runs Claude Code with sandbox mode enabled, add to
`.claude/settings.json`:

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

This lets Context Curator write to `~/.claude/projects/` (outside the
project directory) while keeping all other sandbox restrictions. Commit
`settings.json` — all teammates need it.

---

- [Security](security.md) — what the secret scan catches before every golden save
- [Reference](reference.md) — skill directory layout, CLAUDE.md internals
