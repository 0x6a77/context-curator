# Glossary

---

### adversary task

A specialized Claude Code task that reviews your tests against your PRD from a position of enforced ignorance — no prior session context, no knowledge of your intent. Used in the [Boss-Fight Workflow](boss-fight-workflow.md) to catch tests that pass vacuously rather than verifying the requirement they claim to cover.

---

### auto-save

A timestamped snapshot of the current session, written automatically before every compaction event by the [PreCompact hook](hooks-automation.md). Auto-saves are emergency fallbacks, not named contexts. They live in `~/.claude/projects/<project>/auto-saves/` and are never committed to git.

---

### boss fight

The adversarial review phase of the [Boss-Fight Workflow](boss-fight-workflow.md). You must pass the adversary's test inventory review to advance to implementation. The adversary cannot be appeased by tweaking tests — only genuinely adequate tests pass.

---

### bundle

A named collection of skills that can be installed together. Context Curator ships three bundles: `authoring` (PRD document skills), `session` (context management), and `monitor` (status line). See [For Teams](for-teams.md).

---

### compaction

Claude Code's process of summarizing old conversation history to free up context space when the token count approaches the limit. After compaction, Claude's understanding of session-specific details — subsystem quirks, open threads, warm context — is partially or fully lost.

---

### context

A named snapshot of a Claude Code session. Contexts capture the conversation state at peak understanding and can be restored later, letting Claude resume without the warm-up cost. Contexts are either [personal](#personal-context) or [golden](#golden-context).

---

### context rot

Degradation of Claude's session quality before the token ceiling is reached. As context fills, Claude's ability to recall multiple relevant details simultaneously (multi-needle recall) declines and suggestions become generic. The session is "rotting" even though it hasn't compacted yet.

---

### context zone

A label for the current state of context utilization, derived from real-time metrics. The three zones are: **Healthy** (performance near baseline), **Degrading** (recall dropping, save recommended), and **Critical** (imminent compaction, save now). Displayed in the [status line](context-monitoring.md).

---

### default task

The base task active when no specific task has been switched to via `/task`. In the default task, `.claude/CLAUDE.md` contains universal project instructions and no task-specific import. The [post-compaction hook](hooks-automation.md) does not inject context when the default task is active.

---

### dev plan

A structured implementation roadmap tied to a specific PRD version. Organized into phases, with each phase stating files to change, design decisions, and expected test outcomes. Authored with the `/dev-plan` skill. See [Boss-Fight Workflow](boss-fight-workflow.md).

---

### docs brief

The documentation design brief (`docs/docs-brief.md`). Defines the core message that anchors every page, reader journey gates (1–4) that determine what is revealed at each stage, navigation architecture, editorial rules, and the feature routing table. Maintained by the designer-developer; read by the `/docs-markdown` skill before updating any page.

---

### gate

A stage in the reader journey defined in the [docs brief](boss-fight-workflow.md#user-documentation). Gate 1 delivers the core insight in five minutes. Gate 2 covers solo use over the first week. Gate 3 covers team workflows. Gate 4 covers the Boss-Fight governance methodology. A feature's gate assignment determines how prominently it appears in the documentation — not just which page it lands on.

---

### golden context

A context that has been [promoted](managing-contexts.md#promoting-to-golden) from personal to shared. Golden contexts are stored in the project repository (`.claude/tasks/<task>/contexts/`) and available to any teammate. All golden contexts are scanned for secrets before promotion.

---

### hook

A shell command that Claude Code runs automatically in response to lifecycle events. Context Curator registers a [PreCompact hook](hooks-automation.md#precompact-auto-save-hook) (saves session before compaction) and a [PostCompact hook](hooks-automation.md#postcompact-task-re-injection-hook) (re-injects task context after compaction). Hooks are registered in `~/.claude/settings.json`.

---

### manifest

A JSON file (`context-curator-manifest.json`) that describes the available skill bundles and their contents. Used by `/plugin marketplace list` to enumerate installable skills. Version-matched against `dist/version.json`; a mismatch is flagged by `verify-manifest.ts`.

---

### monitor

The real-time context health tracking subsystem. Tracks token consumption, burn rate, estimated time to compaction, and accumulated cost. Displays status in the Claude Code [status line](context-monitoring.md) and emits zone warnings at degradation thresholds.

---

### personal context

A context saved to your home directory (`~/.claude/projects/<project>/tasks/<task>/contexts/`). Personal contexts are never committed to git and never visible to teammates. They may contain secrets and sensitive session content that should not be shared.

---

### permuted index

A documentation index in which every significant term is rotated to the front of its entry, so the index can be scanned from any angle. If "context rot" appears under both "context rot" and "rot, context", a reader who knows either word finds it. See `docs/markdown/permuted-index.md`.

---

### PRD

Product Requirements Document. In the Boss-Fight Workflow, the PRD is the authoritative source of acceptance criteria. All features are assigned F-XXX codes; all acceptance criteria are assigned T-XXX codes. The PRD is authored first, before tests or code.

---

### re-injection

The PostCompact hook's action of inserting a concise task context summary into the session immediately after compaction. Re-injection prevents the session from going cold after compaction events. It reads the active task's CLAUDE.md and generates a one-paragraph reminder.

---

### risk acceptance

A documented decision to accept a specific adversary finding rather than fix it. Stored in `prod-mgmt/risk-acceptances.md`. Re-running the adversary after adding an acceptance marks the finding ACCEPTED rather than FAIL. Each acceptance includes a rationale, approver, and expiry.

---

### session

A Claude Code conversation, stored as a `.jsonl` file in `~/.claude/projects/<project>/`. Sessions are UUID-named. Context Curator operates on sessions for the current project directory only.

---

### skill

A SKILL.md file that Claude Code reads to gain specialized knowledge for a specific task. Skills are installed into `~/.claude/skills/` (user-scope) or `.claude/skills/` (project-scope). Context Curator's skills are organized into [bundles](#bundle). Project scope takes precedence over user scope.

---

### status line

The metadata line shown in Claude Code's UI that displays real-time session health metrics: current zone, token count, burn rate, estimated time to compaction, and session cost. Populated by the monitor subsystem.

---

### task

A focused work environment in Context Curator. Each task has a unique ID, its own CLAUDE.md with instructions for Claude, and its own context store. Switching tasks (via `/task <id>`) updates which instructions Claude loads on the next `/resume`. See [Getting Started](getting-started.md).

---

### task DNA

The SKILL.md file that defines how a specialized task (like the adversary) behaves. Stored in `~/.claude/context-curator/specialized/<task-name>/CLAUDE.md`. DNA is read-only for the task; it cannot be modified by the task itself.

---

### test inventory

The adversary's output document (`prod-mgmt/test-inventory.md`). A table with one row per test, stating what the test actually does, which AC clause it covers, and a verdict (PASS, FAIL, ESCALATE, or ACCEPTED). Regenerated fresh on every adversary run.

---

### test plan

A document that maps PRD acceptance criteria to concrete test cases (Setup / Execution / Validation). Authored with the `/test-plan` skill. Includes a banned patterns list that the adversary checks for vacuous test constructs.

---

### warm-up

The ramp-up period at the start of a Claude session before Claude has absorbed enough context to give useful, project-specific answers. Warm-up time is the cost Context Curator is designed to reduce. A restored context skips warm-up entirely.

---

### warm-up baseline

A calibration value set during initial monitor configuration. Used to estimate how much context has been consumed relative to the starting state and to estimate remaining time before the [degrading zone](#context-zone) is reached.
