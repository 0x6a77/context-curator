# Skill Marketplace

Context Curator ships as a set of installable skill bundles. Teams can install only the parts they need — document authoring skills without session management, or vice versa. Teams can also publish their own bundles alongside Context Curator's.

## Bundles

Context Curator organizes its skills into three bundles:

| Bundle | What's Included | Who Should Install It |
|--------|----------------|----------------------|
| `authoring` | `/prd`, `/test-plan`, `/dev-plan`, `/test-inventory` | Any team using PRD-driven development |
| `session` | `/task`, `/context-save`, `/context-list`, `/context-manage`, `/context-promote` | Teams using context management |
| `monitor` | Status line, zone warnings, cost tracking | Teams using session management |
| `full` | Everything | Install everything at once |

The `authoring` bundle is fully standalone — it works without the session or monitor bundles. Teams that want the document authoring skills but not the full context management stack can install just `authoring`.

The `monitor` bundle requires `session` (it needs the task skill to know which task is active).

---

## Installing a Specific Bundle

```bash
# Install only the authoring bundle
/plugin marketplace add context-curator/authoring

# Install only session management
/plugin marketplace add context-curator/session

# Install everything
/plugin marketplace add context-curator/full
```

Bundle scope (user vs. project) depends on where you run the command. In a project directory with `--project-install`, skills go into `.claude/skills/`; otherwise they go into `~/.claude/skills/`.

---

## Browsing Available Bundles

```bash
/plugin marketplace list context-curator
```

Lists all available bundles and individual skills with their descriptions. Output shows what each bundle contains and whether it's installed.

---

## Manifest Format

The marketplace discovery mechanism reads a manifest file. Context Curator's manifest is installed to `~/.claude/context-curator-manifest.json` (global) and optionally `.claude/context-curator-manifest.json` (project). The manifest format:

```json
{
  "name": "context-curator",
  "version": "21.0",
  "bundles": {
    "authoring": {
      "description": "PRD, test plan, dev plan, and test inventory authoring skills",
      "skills": ["authoring/prd", "authoring/test-plan", "authoring/dev-plan", "authoring/test-inventory"]
    },
    "session": {
      "description": "Full context management stack",
      "skills": ["session/task", "session/context-save", "session/context-list", "session/context-manage", "session/context-promote"]
    }
  }
}
```

### Version Verification

The manifest version must match the installed `dist/version.json`. If there's a mismatch:

```bash
npx tsx scripts/verify-manifest.ts
```

Exits non-zero with a message naming the version conflict. Re-run `install.sh` to repair.

---

## Team Manifests

Teams can publish custom skill bundles by committing a manifest to their project. The format is the same as Context Curator's manifest; the content is whatever the team wants to share.

**Example:** A team has a custom `/code-review` skill. They add it to the project manifest:

```json
{
  "bundles": {
    "custom": {
      "description": "Team-specific custom skills",
      "skills": ["authoring/code-review"]
    }
  }
}
```

Commit `.claude/context-curator-manifest.json` and any developer who runs `/plugin marketplace list` will see the custom bundle.

---

## Skill Locations

After installation, skills live at:

| Scope | Location |
|-------|----------|
| User (global) | `~/.claude/skills/context-curator/<bundle>/<skill>/` |
| Project | `.claude/skills/context-curator/<bundle>/<skill>/` |

Each skill directory contains a `SKILL.md` (the instruction file Claude reads) and a `scripts/` directory (supporting TypeScript scripts).

When both user-scope and project-scope versions of a skill exist, project scope takes precedence. This lets teams pin a specific version without affecting other projects.

---

## Next Steps

- [Boss-Fight Workflow](boss-fight-workflow.md) — the authoring bundle's document skills in context
- [Getting Started](getting-started.md) — project-scope install for zero-setup team sharing
