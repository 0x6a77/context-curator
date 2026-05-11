# Security

Context Curator scans for secrets before every save operation and maintains a minimal, conflict-free git footprint.

## Secret Detection

Before any context is saved as golden or promoted to a golden context, Context Curator scans the entire session for secrets — all messages, including tool calls and results.

### What Gets Detected

| Secret Type | Example Pattern |
|-------------|----------------|
| AWS access keys | `AKIA` + 16 uppercase alphanumeric chars |
| Stripe keys | `sk_test_` or `sk_live_` |
| GitHub personal access tokens | `ghp_` + 36 alphanumeric chars |
| RSA private keys | `-----BEGIN RSA PRIVATE KEY-----` |
| Generic passwords | `password=<value>` or `PASSWORD=<value>` |

The scanner intentionally prefers false positives over false negatives. If something looks like a secret pattern, it's flagged. The cost of a false positive (manual review) is much lower than the cost of a leaked credential.

### When Scanning Happens

- **Before `/context-save --golden`** — blocks if secrets found
- **Before `/context-promote`** — blocks if secrets found
- **Before `/context-save` (personal)** — warns but does not block; personal contexts never leave your machine

For personal saves, a warning tells you a secret pattern was detected but lets you save anyway — you may intentionally be storing a session that included credentials, and that's your machine. For golden contexts shared with the team, there's no ambiguity: secrets block the operation.

### Redaction

If secrets are detected, you can redact them before promoting:

```bash
/context-promote deep-understanding
# → "Found AWS key in message 34. Redact? (y/n)"
```

Redaction masks the secret in place and re-scans. The redacted context is what gets promoted — your personal original is unchanged.

## Git Footprint

Context Curator is designed to add nothing to `git status` that you don't want there.

**What gets committed:**
- Task `CLAUDE.md` files (`.claude/tasks/<task>/CLAUDE.md`)
- Golden contexts (`.claude/tasks/<task>/contexts/*.jsonl`)
- Project-scope skills (`.claude/skills/`) if you used `--project-install`
- `prod-mgmt/risk-acceptances.md` (governance artifact)

**What never gets committed:**
- `.claude/CLAUDE.md` — the active working file; each developer has their own
- Personal contexts (`~/.claude/projects/...`) — live in home directory, never in the project
- Auto-saves — timestamped files in `~/.claude/projects/.../auto-saves/`
- Monitor state — `~/.claude/context-curator/monitor-state.json`

The key mechanism is `.claude/.gitignore`, which contains an entry for `CLAUDE.md`. This file is created by `/task-init`. The working `CLAUDE.md` that gets updated every time you switch tasks is ignored by git, while the task-specific `CLAUDE.md` files you write are tracked normally.

### No Git Conflicts

Two developers on the same project can both use Context Curator and switch tasks independently without ever creating a merge conflict. The file they each modify (`.claude/CLAUDE.md`) is git-ignored; the files they share (task `CLAUDE.md` files and golden contexts) are read-only for this purpose — they're committed once and consumed by everyone.

## Checking the Git Footprint

After a full workflow, verify nothing leaked into the working tree:

```bash
git status --porcelain
```

No Context Curator files should appear except items you explicitly committed (golden contexts, task CLAUDE.md files). If you see `.claude/CLAUDE.md` in the output, the `.gitignore` entry is missing — re-run `/task-init`.

## Next Steps

- [Managing Contexts](managing-contexts.md) — save, list, and promote contexts
- [Reference](reference.md) — CLAUDE.md two-file system details
