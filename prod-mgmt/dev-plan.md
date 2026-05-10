# Developer Implementation Plan: Context Curator v15.1

**Version:** 15.1  
**Last Updated:** May 9, 2026  
**Status:** Implementation Complete (tests pending)  
**Based on:** PRD v21.0

---

## Executive Summary

This plan implements the **task-based context management system** described in PRD v21.0. The core innovation solves the **warm-up problem**: preserving hard-won Claude understanding that gets lost to auto-compact.

**Core Architecture:**
- **Tasks** = Focused work environments with custom CLAUDE.md
- **Contexts** = Named snapshots of warmed-up Claude sessions
- **Personal by default** = Contexts stay private unless explicitly shared
- **Golden contexts** = Team knowledge base of valuable warmed-up sessions
- **Two-file CLAUDE.md** = No git conflicts (root committed, `.claude/` git-ignored)
- **Skills architecture** = Commands packaged as skills under `~/.claude/skills/context-curator/`, surviving auto-compaction and supporting auto-invocation
- **Hooks integration** = PreCompact auto-save and PostCompact task re-injection run deterministically regardless of model behavior
- **Context monitor** = Passive, zero-cost status line with threshold warnings and burn-rate/cost tracking
- **Document authoring skills** = PRD, test plan, dev plan, and test inventory skills enforce idiomatic format at authoring time
- **User documentation system** = Markdown-first, HTML-derived docs generated immediately after every PRD update
- **Skill Marketplace** = Manifest-driven selective install; authoring bundle available standalone

**Key Innovation:** Claude Code's `/resume` re-reads CLAUDE.md from disk, enabling task-specific instructions to take effect at resume-time without polluting the project directory or causing git conflicts. Skills carry forward through compaction. Hooks fire deterministically — together these enable automatic context protection without manual intervention.

> **Known Risk:** The `/resume`-rereads-CLAUDE.md behavior is not officially documented by Anthropic. Mitigation: add a smoke test verifying a known string from the task CLAUDE.md appears in Claude's system context after `/resume`.

**No API key required. Works entirely within Claude Code using native features.**

---

## Architecture Overview

### The Two-File System

**`./CLAUDE.md` (Root, Committed)**
- Canonical project knowledge; universal instructions
- **Never modified by context-curator**

**`./.claude/CLAUDE.md` (Auto-generated, Git-ignored)**
- What Claude Code actually reads
- Contains `@import` directive pointing to current task
- Updated by `/task` to switch contexts

### Skills Architecture

As of Claude Code v2.x, **skills** are the idiomatic packaging for reusable behaviors. Context Curator commands are implemented as skills, not raw slash commands. Key advantages:
- Skills survive auto-compaction (re-attached within the 25K-token compaction budget)
- Auto-invocable via description matching (e.g., opening `*prd*.md` loads the PRD skill)
- Co-located supporting scripts live in `skill-name/scripts/`

**SKILL.md frontmatter convention:**
```yaml
---
name: context-save
description: >
  Save the current Claude Code session as a named context.
invocation: explicit   # user types /context-save; Claude does not auto-invoke
---
```

Skills are namespaced into three bundles installable independently:
- `authoring/` — document authoring (PRD, test plan, dev plan, test inventory, docs-markdown, docs-html)
- `session/` — session management (task, context-save, context-list, context-manage, context-promote)
- `monitor/` — context monitoring (status, warn, cost)

### Storage Structure

**Project Directory (Committed):**
```
my-project/
├── CLAUDE.md                              # ← Committed, never modified
├── .claude/
│   ├── CLAUDE.md                          # ← Auto-generated, git-ignored
│   ├── skills/context-curator/            # ← Project-scope skills (optional, committed)
│   │   ├── authoring/prd/SKILL.md
│   │   ├── session/task/SKILL.md
│   │   └── ...
│   ├── tasks/
│   │   ├── oauth-refactor/
│   │   │   ├── CLAUDE.md                  # ← Task knowledge (committed)
│   │   │   └── contexts/                  # ← Golden contexts (committed, ≤100KB each)
│   │   └── default/CLAUDE.md
│   └── .gitignore
├── prod-mgmt/
│   ├── risk-acceptances.md                # ← Committed
│   └── test-inventory.md                  # ← Adversary output (NOT committed)
└── docs/
    ├── index.html
    ├── feature-section-map.md
    ├── markdown/
    │   ├── toc.md
    │   ├── introduction.md
    │   ├── glossary.md
    │   ├── permuted-index.md
    │   └── [product-section].md
    └── html/
        ├── style.md                       # ← Human-editable style guide
        └── [product-section].html
```

**Personal Storage (Never Committed):**
```
~/.claude/
├── skills/context-curator/               # Global skills (installed by install.sh)
│   ├── authoring/{prd,test-plan,dev-plan,test-inventory,docs-markdown,docs-html}/
│   ├── session/{task,context-save,context-list,context-manage,context-promote}/
│   └── monitor/{status,warn,cost}/
├── hooks/
│   ├── precompact-autosave.sh
│   └── postcompact-reinject.sh
├── context-curator/
│   ├── monitor-state.json                 # Written by async PostToolUse hook
│   ├── monitor-config.json                # Model rates, zone thresholds
│   └── specialized/adversary/CLAUDE.md   # Read-only after install
└── projects/-Users-dev-my-project/
    ├── tasks/*/contexts/                  # Personal contexts
    ├── auto-saves/                        # PreCompact hook output
    └── .stash/original-CLAUDE.md
```

> **Immutability contract:** No script operation on user tasks may write to `~/.claude/context-curator/specialized/`. Only `install.sh` writes there.

---

## Implementation Phases

### Phase 1: Foundation (Critical Path) ✅
1. Installation mechanism
2. Project initialization (`init-project.ts`)
3. Two-file CLAUDE.md system
4. @import update mechanism (`update-import.ts`)

### Phase 2: Core Session Commands ✅
1. `task-create.ts`, `update-import.ts`
2. `save-context.ts` (personal/golden)
3. `context-list.ts`

### Phase 3: Context Management ✅
1. `promote-context.ts`
2. `delete-context.ts`, `rename-context.ts`, `archive-context.ts`

### Phase 4: Advanced Features ✅
1. `scan-secrets.ts`, `redact-secrets.ts`
2. AI-generated summaries (meta.json)

### Phase 5: Specialized Tasks ✅
1. Adversary task DNA (`src/specialized/adversary/CLAUDE.md`)
2. STRICT isolation enforcement in `save-context.ts` and `context-list.ts`
3. `install.sh` copies DNA and write-protects `specialized/`

### Phase 6: Skills Architecture Migration ✅
1. Convert all commands from `~/.claude/commands/*.md` to skills
2. Add `scripts/` subdirectories with extracted TypeScript logic
3. Write SKILL.md files for all 15 skills with correct frontmatter
4. Update `install.sh` to install to `~/.claude/skills/context-curator/`

### Phase 7: Hooks (PreCompact + PostCompact) ✅
1. `precompact-autosave.sh` / `auto-save-context.ts` — auto-save to timestamped file before compaction
2. `postcompact-reinject.ts` — re-inject task context summary after compaction
3. `session-start-hook.ts` — clear zone sentinels on session start/resume

### Phase 8: Context Monitor ✅
1. `update-monitor-state.ts` — async state file writer (PostToolUse hook)
2. `status-line.ts` — read state file, render `[🟢 47% | +31k | ~$0.18 | 2.1k tok/msg]`
3. `warn.ts` — zone boundary warnings with sentinel suppression
4. `estimate-cost.ts` — cost from rate config; burn rate computation embedded in `update-monitor-state.ts`
5. `on-compaction.ts` — clear zone sentinels after compaction
6. Note: `compute-burn-rate.ts` was not created as a standalone file — burn rate logic is inlined in `update-monitor-state.ts`

### Phase 9: Document Authoring Skills (F-DOC-SKILLS) ✅
1. `authoring/prd/SKILL.md` — PRD format, F-XXX codes, AC rules, `/prd check-ac`
2. `authoring/test-plan/SKILL.md` — test plan format, banned patterns, fix tiers
3. `authoring/dev-plan/SKILL.md` — dev plan format, phase structure conventions
4. `authoring/test-inventory/SKILL.md` — adversary-only output format
5. `authoring/prd-process/SKILL.md` + `prd-process-status.ts` — F-PROCESS phase detection (PRD v21.0)

### Phase 10: User Documentation System (F-DOC) ✅
1. `authoring/docs-markdown/SKILL.md` — markdown base update, feature-section mapping
2. `authoring/docs-html/SKILL.md` — HTML generation, a11y validation, style.md bootstrap
3. `docs/feature-section-map.md` — created and populated
4. `docs/html/style.md` — created with full color/typography spec
5. `docs/html/*.html` — all 14 HTML pages generated

### Phase 11: Skill Marketplace (F-MARKETPLACE) ✅
1. `install.sh` writes `~/.claude/context-curator-manifest.json`
2. Manifest format with `bundles.authoring`, `bundles.session`, `bundles.monitor`
3. `dist/version.json` written during build
4. `verify-manifest.ts` — validates manifest version matches dist/version.json

### Phase 12: Project-Scope Install (T-INIT-7/8/9) ✅
1. `--project-install` flag on `install.sh`
2. Copies skill directories into `.claude/skills/context-curator/`
3. Adds manifest at `.claude/context-curator-manifest.json`

---

## Phase 6: Skills Architecture Migration

### 6.1 Skill Directory Layout

For each existing command, create the skill directory alongside extracted scripts:

```
~/.claude/skills/context-curator/
├── session/
│   ├── task/
│   │   ├── SKILL.md
│   │   └── scripts/
│   │       ├── task-create.ts   ← existing scripts/task-create.ts
│   │       └── context-list.ts
│   ├── context-save/
│   │   ├── SKILL.md
│   │   └── scripts/
│   │       └── save-context.ts
│   └── ... (context-list, context-manage, context-promote)
├── authoring/
│   └── ... (prd, test-plan, dev-plan, test-inventory, docs-markdown, docs-html)
└── monitor/
    └── ... (status, warn, cost)
```

### 6.2 SKILL.md Template

```markdown
---
name: context-save
description: >
  Save the current Claude Code session as a named context snapshot.
  Triggered when the user says "save context", "checkpoint this session",
  or uses /context-save. Prompts for personal vs golden, scans for secrets.
invocation: explicit
allowed-tools: Bash, Read, Write
---

# /context-save

[implementation instructions referencing scripts/ for heavy lifting]
```

### 6.3 install.sh Update

```bash
SKILLS_DIR="$HOME/.claude/skills/context-curator"

# Install each bundle
for bundle in authoring session monitor; do
  mkdir -p "$SKILLS_DIR/$bundle"
  cp -r "src/skills/$bundle/"* "$SKILLS_DIR/$bundle/"
done

# Install specialized DNA
mkdir -p "$HOME/.claude/context-curator/specialized"
cp -r src/specialized/* "$HOME/.claude/context-curator/specialized/"
chmod -R a-w "$HOME/.claude/context-curator/specialized/"
```

**Testing (T-ADV-1, T-SPEC-1):**
- [ ] All 13 skill directories created with SKILL.md and scripts/
- [ ] `~/.claude/context-curator/specialized/adversary/CLAUDE.md` exists and contains "ADVERSARY" and "STRICT"
- [ ] Specialized directory is write-protected after install

---

## Phase 7: Hooks

### 7.1 PreCompact Auto-Save Hook (F-HOOK)

**Script:** `scripts/auto-save-context.ts`

```typescript
#!/usr/bin/env tsx
// Reads stdin JSON payload from Claude Code PreCompact hook
// Writes session to <personalBase>/auto-saves/<timestamp>.jsonl

import fs from 'fs/promises';
import path from 'path';
import { getClaudeHome, getProjectId } from '../src/utils.js';

async function autoSave() {
  const payload = JSON.parse(await readStdin());
  const sessionData = payload.session ?? payload;

  const cwd = process.cwd();
  const projectId = getProjectId(cwd);
  const autoSavesDir = path.join(
    getClaudeHome(), 'projects', projectId, 'auto-saves'
  );
  await fs.mkdir(autoSavesDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(autoSavesDir, `${timestamp}.jsonl`);
  await fs.writeFile(outPath, JSON.stringify(sessionData) + '\n');
  console.error(`[precompact] auto-saved: ${outPath}`);
}
```

**Hook registration** (`~/.claude/hooks/settings.json`):
```json
{
  "hooks": {
    "PreCompact": [{ "type": "command", "command": "npx tsx ~/.claude/skills/context-curator/session/context-save/scripts/auto-save-context.ts" }]
  }
}
```

**Testing (T-HOOK-1):**
- [ ] With mock stdin payload, creates timestamped `.jsonl` in `<personalBase>/auto-saves/`
- [ ] File is valid JSONL

### 7.2 PostCompact Re-Injection Hook (F-HOOK-POST)

**Script:** `scripts/postcompact-reinject.ts`

```typescript
#!/usr/bin/env tsx
// Reads active task from .claude/CLAUDE.md @import line
// Outputs task context summary for injection into session
// Exits 0 silently when default task is active

import fs from 'fs/promises';
import path from 'path';

async function reInject() {
  const claudeMd = path.join(process.cwd(), '.claude', 'CLAUDE.md');
  let content: string;
  try {
    content = await fs.readFile(claudeMd, 'utf-8');
  } catch {
    process.stderr.write('[postcompact] warning: .claude/CLAUDE.md not found\n');
    process.exit(0);
  }

  const match = content.match(/@import\s+(\S+)/);
  if (!match) { process.exit(0); }

  const importPath = match[1];
  // Default task → no injection
  if (importPath.includes('default')) { process.exit(0); }

  const taskId = importPath.match(/tasks\/([^/]+)\//)?.[1];
  if (!taskId) { process.exit(0); }

  const taskMdPath = path.join(process.cwd(), '.claude', 'tasks', taskId, 'CLAUDE.md');
  let taskContent: string;
  try {
    taskContent = await fs.readFile(taskMdPath, 'utf-8');
  } catch {
    process.stderr.write(`[postcompact] warning: task CLAUDE.md not found for ${taskId}\n`);
    process.exit(0);
  }

  // Output the injection text to stdout (Claude Code reads this as the prompt injection)
  process.stdout.write(
    `[Context restored after compaction]\nActive task: ${taskId}\n\n${taskContent.slice(0, 2000)}`
  );
}

reInject().catch(() => process.exit(0));
```

**Testing (T-HOOK-POST-1/2/3):**
- [ ] T-HOOK-POST-1: Non-default task active → stdout contains task ID
- [ ] T-HOOK-POST-2: Default task active → stdout is empty, exits 0
- [ ] T-HOOK-POST-3: Missing task CLAUDE.md → exits 0, stderr matches `/warning|not found/i`

### 7.3 SessionStart Hook

**Script:** `scripts/session-start-hook.ts`

```typescript
// Clears zone sentinels so zone warnings re-fire in new sessions
import fs from 'fs/promises';
import path from 'path';
import { getClaudeHome } from '../src/utils.js';

async function clearSentinels() {
  const statePath = path.join(getClaudeHome(), 'context-curator', 'monitor-state.json');
  try {
    const state = JSON.parse(await fs.readFile(statePath, 'utf-8'));
    state.zoneSentinels = { degrading: false, critical: false };
    await atomicWrite(statePath, JSON.stringify(state, null, 2));
  } catch { /* state file may not exist yet */ }
}
```

**Testing (T-MON-9):**
- [ ] After running hook with sentinels set to true, both sentinels are false in re-read state file

---

## Phase 8: Context Monitor

The monitor uses a **single-writer pattern**: one async `PostToolUse` hook owns all writes to `monitor-state.json`; the status line and warning hooks are read-only consumers. This prevents race conditions and ensures JSONL parsing happens at most once per tool call.

### 8.1 State File Schema

`~/.claude/context-curator/monitor-state.json`:
```json
{
  "sessionId": "<uuid>",
  "currentTokens": 95000,
  "contextWindowSize": 200000,
  "fillPct": 47.5,
  "baselineTokens": 42000,
  "tokensSinceBaseline": 53000,
  "burnRatePerMessage": 2100,
  "estimatedCost": 0.47,
  "currentZone": "productive",
  "zoneSentinels": { "degrading": false, "critical": false },
  "model": "claude-sonnet-4-6",
  "lastUpdated": "2026-05-09T14:32:00Z"
}
```

### 8.2 Atomic Write Utility

All state file writes use atomic write-then-rename to prevent partial reads:

```typescript
async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmp = `${filePath}.tmp.${process.pid}`;
  await fs.writeFile(tmp, content, 'utf-8');
  await fs.rename(tmp, filePath);
}
```

**Testing (T-MON-13):**
- [ ] Concurrent reader never observes partial JSON

### 8.3 update-monitor-state.ts (Async PostToolUse Hook)

```typescript
// Parses session JSONL, computes all metrics, writes state file atomically
// Called via PostToolUse hook — runs async, never delays Claude's response

async function updateMonitorState() {
  const sessionPath = getSessionPath(); // from env vars or known location
  const messages = await parseSessionJsonl(sessionPath);
  
  const currentTokens = sumTokens(messages);
  const contextWindowSize = getContextWindowSize(); // from env
  const fillPct = (currentTokens / contextWindowSize) * 100;

  const baselineTokens = await readBaselineFromCheckpoint() ?? null;
  const tokensSinceBaseline = baselineTokens !== null
    ? currentTokens - baselineTokens
    : currentTokens;

  const burnRatePerMessage = computeBurnRate(messages, 10);
  const estimatedCost = estimateCost(messages, getModelRates());
  const currentZone = fillPct >= 80 ? 'critical'
    : fillPct >= 65 ? 'degrading' : 'productive';

  const existing = await readStateOrDefault();
  const state = {
    ...existing,
    currentTokens, contextWindowSize, fillPct,
    baselineTokens, tokensSinceBaseline,
    burnRatePerMessage, estimatedCost, currentZone,
    lastUpdated: new Date().toISOString(),
  };
  await atomicWrite(STATE_PATH, JSON.stringify(state, null, 2));
}
```

**Testing (T-MON-4, T-MON-12):**
- [ ] T-MON-4: No baseline → `tokensSinceBaseline === currentTokens`
- [ ] T-MON-12: `baselineTokens=42000`, `currentTokens=95000` → `tokensSinceBaseline=53000`

### 8.4 status-line.ts

```typescript
// Reads state file only — no model calls, no network
// Suppressed if CLAUDE_SESSION_TYPE=headless

async function statusLine() {
  if (process.env.CLAUDE_SESSION_TYPE === 'headless') { process.exit(0); }

  const state = JSON.parse(await fs.readFile(STATE_PATH, 'utf-8'));
  const { fillPct, tokensSinceBaseline, estimatedCost, burnRatePerMessage, currentZone } = state;

  const emoji = { productive: '🟢', degrading: '🟡', critical: '🔴' }[currentZone] ?? '⚪';
  const sinceK = `+${Math.round(tokensSinceBaseline / 1000)}k`;
  const costStr = `~$${estimatedCost.toFixed(2)}`;
  const burnK = `${(burnRatePerMessage / 1000).toFixed(1)}k tok/msg`;

  process.stderr.write(`[${emoji} ${Math.round(fillPct)}% | ${sinceK} since warm-up | ${costStr} | ${burnK}]\n`);
}
```

**Testing (T-MON-1/2/3):**
- [ ] T-MON-1: No network calls during execution
- [ ] T-MON-2: Known state values → output matches `/47/`, `/31k/`, `/0\.18/`, `/2\.1k/`
- [ ] T-MON-3: `CLAUDE_SESSION_TYPE=headless` → stdout and stderr empty

### 8.5 warn.ts

```typescript
// Zone boundary warnings — fires once per zone entry via sentinel suppression

async function warn() {
  const state = JSON.parse(await fs.readFile(STATE_PATH, 'utf-8'));
  const { fillPct, zoneSentinels } = state;

  if (fillPct >= 80 && !zoneSentinels.critical) {
    process.stderr.write(
      `🔴  Context at ${Math.round(fillPct)}% — critical. Compaction is imminent.\n` +
      `    Start a fresh session: /task <current-task> to reload a saved context.\n` +
      `    (This warning will not repeat in this zone.)\n`
    );
    state.zoneSentinels.critical = true;
    await atomicWrite(STATE_PATH, JSON.stringify(state, null, 2));
  } else if (fillPct >= 65 && !zoneSentinels.degrading) {
    process.stderr.write(
      `⚠️  Context at ${Math.round(fillPct)}% — entering degrading zone.\n` +
      `    Recall quality is declining. Consider: /context-save checkpoint-name\n` +
      `    (This warning will not repeat in this zone.)\n`
    );
    state.zoneSentinels.degrading = true;
    await atomicWrite(STATE_PATH, JSON.stringify(state, null, 2));
  }
}
```

**Testing (T-MON-5/6/7/8):**
- [ ] T-MON-5: 65% fires degrading warning with save suggestion; 64% silent
- [ ] T-MON-6: 80% fires critical; 79% fires degrading only
- [ ] T-MON-7: Second invocation at 66% with sentinel=true → stderr empty
- [ ] T-MON-8: After `on-compaction.ts`, sentinel cleared; re-crossing 65% fires again

### 8.6 Burn Rate (embedded in update-monitor-state.ts)

The `compute-burn-rate.ts` standalone script was not created — burn rate calculation is inlined in `update-monitor-state.ts` for simplicity. The algorithm is the same: mean tokens-per-message over the last N messages (default N=10, configurable in `monitor-config.json`).

```typescript
// Inlined in update-monitor-state.ts
function computeBurnRate(messages: Message[], n: number = 10): number {
  const recent = messages.slice(-n);
  if (recent.length === 0) return 0;
  const total = recent.reduce((sum, m) => sum + (m.tokens ?? 0), 0);
  return Math.round(total / recent.length);
}
```

**Testing (T-MON-10):**
- [ ] 15-message fixture with known counts: output within 5% of hand-calculated mean of last 10

### 8.7 estimate-cost.ts

```typescript
// Reads model rates from monitor-config.json
// Cost = (inputTokens / 1e6) * inputRate + (outputTokens / 1e6) * outputRate
function estimateCost(inputTokens: number, outputTokens: number, model: string, config: MonitorConfig): number {
  const rates = config.models[model] ?? config.models.default;
  return (inputTokens / 1e6) * rates.input + (outputTokens / 1e6) * rates.output;
}
```

**monitor-config.json example:**
```json
{
  "zones": { "degrading": 65, "critical": 80 },
  "burnRateWindow": 10,
  "models": {
    "claude-sonnet-4-6": { "input": 3.00, "output": 15.00 },
    "claude-opus-4-7":   { "input": 15.00, "output": 75.00 },
    "claude-haiku-4-5":  { "input": 0.80, "output": 4.00 }
  }
}
```

**Testing (T-MON-11):**
- [ ] 50k input + 10k output @ sonnet rates = $0.30; actual within 1%

---

## Phase 9: Document Authoring Skills (F-DOC-SKILLS)

Authoring skills enforce idiomatic format at authoring time. They are **guidance skills**, not session management skills. The authoring bundle can be installed without the session bundle.

### 9.1 prd/SKILL.md

```markdown
---
name: prd
description: >
  PRD authoring assistant. Load when working on a file matching *prd*.md.
  Enforces F-XXX/T-XXX code structure, falsifiable AC rules, and feature section format.
  Use /prd new-feature to scaffold, /prd check-ac to audit criteria.
invocation: auto
trigger-pattern: "*prd*.md"
---

# /prd — PRD Format Skill

## Feature Section Template

Every feature section must contain all four elements:
1. Heading: `### F-XXX · Feature Name`
2. `**Expected Behaviors:**` bullet list
3. `**Test Scenarios:**` numbered list
4. `**Acceptance Criteria:**` table with `| T-XXX-N | Criterion |` rows

## On /prd new-feature

Scaffold a complete feature section with:
- Placeholder `### F-NEW · [Feature Name]` heading
- `**Expected Behaviors:**` with 3–5 placeholder bullets
- `**Test Scenarios:**` with 3 numbered scenarios
- `**Acceptance Criteria:**` table with 2 placeholder T-XXX rows

## On /prd check-ac

Review each AC row in the PRD. Flag any criterion that is:
- Vague ("handles gracefully", "works correctly")
- Circular (references the implementation rather than observable behavior)
- Not independently testable (requires inspecting internal state)

Output flagged criteria with rationale. Output nothing for clean criteria.

## Code Rules

- F-XXX codes: assigned once, never reused, even after feature removal
- T-XXX codes: globally unique across the entire PRD
- AC criteria: statements not questions; falsifiable; no "should" hedging
```

**Testing (T-DOC-1/2/5):**
- [ ] T-DOC-1: `/prd new-feature` produces all four required elements
- [ ] T-DOC-2: Opening `*prd*.md` auto-loads skill without `/prd`
- [ ] T-DOC-5: `/prd check-ac` on vague criterion outputs non-empty flag; clean PRD produces no flags

### 9.2 test-plan/SKILL.md

```markdown
---
name: test-plan
description: >
  Test plan authoring assistant. Load when working on a file matching *test-plan*.md.
  Enforces banned patterns, fix priority tiers, and feature-group structure.
invocation: auto
trigger-pattern: "*test-plan*.md"
---

# /test-plan — Test Plan Format Skill

## Mandatory Sections (for /test-plan new)

1. Testing Philosophy
2. Banned Patterns (numbered list, minimum 6 items)
3. Fix Priority Tiers (Tier 1–5 or similar)
4. Environment Setup / Prerequisites
5. Feature Test Groups (one per F-XXX, same order as PRD)
6. Summary / Coverage Matrix

## Banned Patterns (enforce in all test code)

1. **Vacuous OR fallbacks** — `|| output.includes('context')`
2. **Conditional file-existence guards** — `if (fileExists(path)) { expect(...) }`
3. **Tautological type assertions** — `typeof x === 'number'`
4. **Placeholder assertions** — `expect(true).toBe(true)`
5. **Self-fulfilling setup** — Creating the file the test then checks for
6. **Broad digit regex** — `/\d+/.test(output)` when count is known
7. **Missing exit code assertion** — success must assert `exitCode === 0`
```

**Testing (T-DOC-3):**
- [ ] `/test-plan new` produces document containing all mandatory sections with ≥6 numbered banned patterns

### 9.3 dev-plan/SKILL.md

```markdown
---
name: dev-plan
description: >
  Dev plan authoring assistant. Load when working on a file matching *dev-plan*.md.
  Enforces phase structure, design decision conventions, and PRD version reference.
invocation: auto
trigger-pattern: "*dev-plan*.md"
---

# /dev-plan — Dev Plan Format Skill

## Mandatory Sections (for /dev-plan new)

- Header with `Based on: PRD vX.Y` (populate from current PRD version)
- Executive Summary
- Architecture Overview
- Implementation Phases (ordered; each with sub-tasks and - [ ] testing checklists)
- File Structure table (artifact, location, committed/not-committed)
- Key Design Decisions (record *why*, not just *what*)
- Troubleshooting (known failure modes and resolutions)
- Version History
```

**Testing (T-DOC-4):**
- [ ] `/dev-plan new` produces document with `Based on: PRD vX.Y`, executive summary, ≥1 phase section, file structure, design decisions, troubleshooting

### 9.4 test-inventory/SKILL.md

```markdown
---
name: test-inventory
description: >
  Adversary task output format skill. Only available when adversary task is active.
  Loads the test inventory output schema and verdict definitions for consistent LoD2 reporting.
invocation: auto
guard: adversary-task-active   # skill refuses to load outside adversary task
---

# /test-inventory — LoD2 Test Inventory Output Format

[Full output schema for the adversary's findings table and coverage gaps section]
```

**Guard enforcement:** The SKILL.md opens with a check:
```
If the adversary task is NOT active, output:
"Error: /test-inventory is only available when the adversary task is active."
and exit.
```

**Testing (T-DOC-6):**
- [ ] `/test-inventory` outside adversary task exits with error message containing "adversary"
- [ ] Inside adversary task, skill loads successfully

### 9.5 prd-process/SKILL.md (F-PROCESS)

The process sequencing skill is part of the authoring bundle. The underlying state-machine logic lives in `scripts/prd-process-status.ts` (already implemented); the SKILL.md wraps it with guidance for Claude.

```markdown
---
name: prd-process
description: >
  PRD-driven development process sequencing guard. Detects current phase and warns
  when steps are attempted out of order — most critically, when prd.md is newer
  than test-inventory.md (adversary run is stale).
invocation: explicit
---
```

**Implementation:** `scripts/prd-process-status.ts`

Key logic:
- Scans `prod-mgmt/` for artifact presence
- Compares `prd.md` mtime vs `test-inventory.md` mtime → `adversaryStale`
- Outputs JSON: `{ completedPhases, currentPhase, nextPhase, adversaryStale, warnings, artifacts }`
- Non-zero exit if `prod-mgmt/prd.md` is absent

**Testing (T-PROC-1 through T-PROC-6):**
- [ ] T-PROC-1: PRD-only project → `currentPhase=1`, `nextPhase=2`
- [ ] T-PROC-2: `test-inventory.md` older than `prd.md` → `adversaryStale=true`, non-empty `warnings` matching `/stale|adversary/i`
- [ ] T-PROC-3: `test-inventory.md` newer than `prd.md` → `adversaryStale=false`, no stale warning
- [ ] T-PROC-4: No `prd.md` → non-zero exit, output contains "PRD"
- [ ] T-PROC-5: test-plan + dev-plan + tests, no test-inventory → `currentPhase=4`, `nextPhase=5`
- [ ] T-PROC-6: Output always valid JSON with `completedPhases`, `currentPhase`, `nextPhase`, `adversaryStale`, `warnings`

---

## Phase 10: User Documentation System (F-DOC)

The documentation system has a strict invariant: **markdown is always updated first; HTML is always derived from markdown and never hand-edited.**

### 10.1 docs-markdown/SKILL.md

```markdown
---
name: docs-markdown
description: >
  Update the markdown documentation base after a PRD change. Identifies new or changed
  features, prompts for product section assignments, updates affected pages,
  regenerates glossary and permuted index.
invocation: explicit
---

# /docs-markdown

## Bootstrapping Constraint

This skill requires the authoring bundle to exist at
~/.claude/skills/context-curator/authoring/ before it can be invoked.
The dev process (Phase 9) must complete before running /docs-markdown.

## Workflow

1. Read PRD to identify features added or changed since last docs run
2. For each new F-XXX feature not yet in docs/feature-section-map.md:
   - Prompt: "Assign F-XXX to a product section (or create new):"
   - Update feature-section-map.md with the assignment
3. For each affected product section, update docs/markdown/[section].md
4. Regenerate docs/markdown/toc.md (link to all sections)
5. Update docs/markdown/glossary.md (all Core Concepts terms)
6. Regenerate docs/markdown/permuted-index.md

## Linking Conventions

- Every product section name: linked on first mention in each page
- Every glossary term: linked on first mention per page only
- Internal links: relative paths
```

**Testing (T-UDOC-1/2/3):**
- [ ] T-UDOC-1: New F-XXX not in feature-section-map.md → skill prompts; after assignment, map contains row
- [ ] T-UDOC-2: toc.md links to every section in feature-section-map.md
- [ ] T-UDOC-3: glossary.md contains every Core Concepts term from PRD

### 10.2 docs-html/SKILL.md

```markdown
---
name: docs-html
description: >
  Generate accessible HTML documentation from the markdown base.
  Reads docs/html/style.md for visual conventions. Bootstraps style.md if absent.
  Validates WCAG 2.1 AA compliance. Always run after /docs-markdown.
invocation: explicit
---

# /docs-html

## Generation Constraints

- Read docs/html/style.md first; if absent, generate sensible accessible defaults
  and write them to style.md before generating HTML
- style.md defaults must contain "color" and "typeface" or "font"
- All output HTML: WCAG 2.1 AA compliant
- Every page: consistent <nav> with links to home (index.html) and glossary
- Heading hierarchy must not skip levels (no h3 without h2, no h2 without h1)
- All <img> elements: non-empty alt attribute

## Output

- docs/index.html: rendered from introduction.md + toc.md inline
- docs/html/[section].html: one file per product section
```

**Testing (T-UDOC-4/5/6/7/8):**
- [ ] T-UDOC-4: `docs/index.html` exists, contains content from introduction.md and toc.md
- [ ] T-UDOC-5: All HTML pages contain `<nav>` with home and glossary links
- [ ] T-UDOC-6: No heading level skips in any generated HTML page
- [ ] T-UDOC-7: Absent style.md → skill writes file containing "color" and "typeface"/"font"
- [ ] T-UDOC-8: All `<img>` elements have non-empty alt

---

## Phase 11: Skill Marketplace (F-MARKETPLACE)

### 11.1 Manifest Format

`~/.claude/context-curator-manifest.json`:
```json
{
  "name": "context-curator",
  "version": "15.1",
  "description": "Task-based context management and PRD-driven development for Claude Code",
  "bundles": {
    "authoring": {
      "description": "PRD, test plan, dev plan, test inventory, and process sequencing authoring skills",
      "skills": ["authoring/prd", "authoring/test-plan", "authoring/dev-plan", "authoring/test-inventory", "authoring/prd-process", "authoring/docs-markdown", "authoring/docs-html"]
    },
    "session": {
      "description": "Full context management stack",
      "skills": ["session/task", "session/context-save", "session/context-list", "session/context-manage", "session/context-promote"]
    },
    "monitor": {
      "description": "Context usage monitoring and threshold warnings",
      "skills": ["monitor/status", "monitor/warn", "monitor/cost"]
    },
    "full": {
      "description": "Everything",
      "skills": ["authoring/*", "session/*", "monitor/*"]
    }
  }
}
```

### 11.2 install.sh Additions

```bash
# Write global manifest
VERSION=$(cat dist/version.json | jq -r '.version')
cat > "$HOME/.claude/context-curator-manifest.json" << EOF
{ "name": "context-curator", "version": "$VERSION", ... }
EOF

# Write project manifest if --project-install
if [ "$PROJECT_INSTALL" = "true" ]; then
  cp "$HOME/.claude/context-curator-manifest.json" ".claude/context-curator-manifest.json"
fi
```

### 11.3 dist/version.json

Generated during build (`npm run build`):
```json
{ "version": "15.1", "built": "2026-05-09T00:00:00Z" }
```

> Note: `dist/version.json` currently contains `"version": "15.0.0"` — update to `"15.1.0"` before releasing v15.1 to keep `verify-manifest.ts` (T-MKT-3) in sync.

**Testing (T-MKT-1/2/3/4):**
- [ ] T-MKT-1: After `install.sh`, manifest is valid JSON with `bundles.authoring`, `.session`, `.monitor`
- [ ] T-MKT-2: Authoring-only install: `/prd`, `/test-plan`, `/dev-plan`, `/test-inventory` available; `/context-save` not
- [ ] T-MKT-3: Manifest version matches `dist/version.json`; mismatch exits non-zero with "version" in output
- [ ] T-MKT-4: Team manifest at `.claude/context-curator-manifest.json` discoverable via `/plugin marketplace list`

---

## Phase 12: Project-Scope Install (T-INIT-7/8/9)

### 12.1 --project-install Flag on init-project.ts

```typescript
async function initProject() {
  // ... existing init logic ...

  const projectInstall = process.argv.includes('--project-install');
  if (projectInstall) {
    await installProjectScopeSkills(cwd);
  }
}

async function installProjectScopeSkills(projectRoot: string) {
  const skillsSrc = path.join(getClaudeHome(), 'skills', 'context-curator');
  const skillsDest = path.join(projectRoot, '.claude', 'skills', 'context-curator');

  // Copy all skill bundles
  for (const bundle of ['authoring', 'session', 'monitor']) {
    const bundleSrc = path.join(skillsSrc, bundle);
    const bundleDest = path.join(skillsDest, bundle);
    await fs.mkdir(bundleDest, { recursive: true });
    await copyDir(bundleSrc, bundleDest);
  }

  // Write project-scope manifest
  const manifestSrc = path.join(getClaudeHome(), 'context-curator-manifest.json');
  const manifestDest = path.join(projectRoot, '.claude', 'context-curator-manifest.json');
  await fs.copyFile(manifestSrc, manifestDest);

  console.log('✓ Project-scope skills installed at .claude/skills/context-curator/');
  console.log('✓ Commit .claude/skills/ to share with your team');
}
```

**Testing (T-INIT-7/8/9):**
- [ ] T-INIT-7: `--project-install` creates `.claude/skills/context-curator/` with all five session skill directories, each having `SKILL.md` and `scripts/`
- [ ] T-INIT-8: After project-scope install, `/context-save` resolves to `.claude/skills/context-curator/context-save/SKILL.md`
- [ ] T-INIT-9: Cloned repo with `.claude/skills/` committed has `/task` available without `install.sh`

---

## File Structure

### Scripts (in `scripts/`)

| File | Purpose | Phase |
|------|---------|-------|
| `init-project.ts` | Project initialization | 1 ✅ |
| `update-import.ts` | Update @import on task switch | 1 ✅ |
| `task-create.ts` | Create new task | 2 ✅ |
| `save-context.ts` | Save session (personal/golden) | 2 ✅ |
| `context-list.ts` | List contexts | 2 ✅ |
| `promote-context.ts` | Personal → Golden | 3 ✅ |
| `delete-context.ts` | Delete with --force guard | 3 ✅ |
| `rename-context.ts` | Rename context | 3 ✅ |
| `archive-context.ts` | Archive to contexts/archives/ | 3 ✅ |
| `scan-secrets.ts` | Secret detection | 4 ✅ |
| `redact-secrets.ts` | Secret redaction | 4 ✅ |
| `prd-process-status.ts` | Process phase detection + adversary-staleness check | 9 |
| `verify-manifest.ts` | Validate manifest version vs dist/version.json | 11 |
| `auto-save-context.ts` | PreCompact hook auto-save | 7 |
| `postcompact-reinject.ts` | PostCompact task re-injection | 7 |
| `session-start-hook.ts` | SessionStart sentinel clear | 7 |
| `update-monitor-state.ts` | Async PostToolUse state writer | 8 |
| `status-line.ts` | Status line display | 8 |
| `warn.ts` | Zone boundary warnings | 8 |
| `compute-burn-rate.ts` | Token burn rate calculation | 8 |
| `estimate-cost.ts` | Session cost estimation | 8 |
| `on-compaction.ts` | Post-compaction sentinel clear | 8 |

### Skills (in `src/skills/`)

| Path | Slash command | Bundle | Phase |
|------|--------------|--------|-------|
| `authoring/prd/SKILL.md` | `/prd` | authoring | 9 |
| `authoring/test-plan/SKILL.md` | `/test-plan` | authoring | 9 |
| `authoring/dev-plan/SKILL.md` | `/dev-plan` | authoring | 9 |
| `authoring/test-inventory/SKILL.md` | `/test-inventory` | authoring | 9 |
| `authoring/prd-process/SKILL.md` | `/prd-process` | authoring | 9 |
| `authoring/docs-markdown/SKILL.md` | `/docs-markdown` | authoring | 10 |
| `authoring/docs-html/SKILL.md` | `/docs-html` | authoring | 10 |
| `session/task/SKILL.md` | `/task` | session | 6 |
| `session/context-save/SKILL.md` | `/context-save` | session | 6 |
| `session/context-list/SKILL.md` | `/context-list` | session | 6 |
| `session/context-manage/SKILL.md` | `/context-manage` | session | 6 |
| `session/context-promote/SKILL.md` | `/context-promote` | session | 6 |
| `monitor/status/SKILL.md` | status line | monitor | 8 |
| `monitor/warn/SKILL.md` | threshold warnings | monitor | 8 |
| `monitor/cost/SKILL.md` | cost/burn display | monitor | 8 |

### Project Files

| Path | Committed | Purpose |
|------|-----------|---------|
| `CLAUDE.md` | Yes | Root project instructions; never modified by CC |
| `.claude/CLAUDE.md` | No (git-ignored) | Auto-generated @import |
| `.claude/.gitignore` | Yes | Ignores CLAUDE.md only |
| `.claude/tasks/*/CLAUDE.md` | Yes | Task knowledge |
| `.claude/tasks/*/contexts/*.jsonl` | Yes | Golden contexts (≤100KB each) |
| `.claude/skills/context-curator/**` | Yes (if project-scope) | Project-committed skills |
| `.claude/context-curator-manifest.json` | Yes (if project-scope) | Plugin manifest |
| `prod-mgmt/risk-acceptances.md` | Yes | Human-reviewed risk decisions |
| `prod-mgmt/test-inventory.md` | No | Adversary output; regenerated each run |
| `docs/**` | Yes | All documentation (markdown, HTML, style guide) |

### Personal Files (in `~/.claude/projects/<project-id>/`)

| Path | Purpose |
|------|---------|
| `tasks/*/contexts/*.jsonl` | Personal contexts |
| `auto-saves/*.jsonl` | PreCompact hook auto-saves |
| `.stash/original-CLAUDE.md` | Backup of root CLAUDE.md |
| `active-task.json` | Active task ID and isolation mode |
| `memory/MEMORY.md` | Task/context memory log (updated by save-context) |

---

## Key Design Decisions

### 1. Skills Over Raw Commands

**Why:** Skills survive auto-compaction (re-attached within the 25K-token budget), support auto-invocation via description matching, and can co-locate scripts alongside SKILL.md. Raw commands in `~/.claude/commands/` get lost after compaction.

**Trade-off:** More complex install structure; mitigated by consistent namespacing and `install.sh` automation.

### 2. Single-Writer Monitor State

**Why:** Multiple concurrent hook invocations could corrupt the state file if all wrote to it. Assigning all writes to one async `PostToolUse` hook eliminates race conditions.

**Trade-off:** Status line is one tool-call delayed. Acceptable — exact timing not critical for passive monitoring.

### 3. Atomic State File Writes

**Why:** Concurrent readers (status line, warn) could observe a half-written file if writes used standard `writeFile`. Write-to-temp + rename is atomic on POSIX systems.

**Implementation:** `await fs.writeFile(tmp); await fs.rename(tmp, final);`

### 4. Authoring Skills Standalone

**Why:** Teams wanting only the document authoring discipline (PRD format, test plan structure) should not have to install the full session management stack. The authoring bundle has zero dependency on the session bundle.

**Implementation:** Authoring skills are namespaced to `authoring/` and the marketplace manifest declares no cross-bundle dependency.

### 5. Markdown-First Documentation

**Why:** Markdown is editable by everyone, diffable in git, and survives toolchain changes. HTML is a delivery artifact that should never be hand-edited to avoid markdown/HTML drift.

**Invariant enforced by skill:** `/docs-html` reads markdown source; it never reads existing HTML as input.

### 6. Two-File CLAUDE.md

**Why:** Eliminates git conflicts. Root `./CLAUDE.md` is canonical and committed. `.claude/CLAUDE.md` is per-developer and git-ignored. Each developer's import points to their current task without conflicting with teammates.

### 7. Personal by Default

**Why:** Prevents accidental secret leaks. Explicit `/context-promote` with secret scanning required to share. This is a security-first default — reversal requires deliberate action.

### 8. STRICT Isolation Via Hooks, Not Instructions

**Why:** The adversary task's value depends entirely on isolation from prior context. Instructions can be overridden by model behavior; hooks cannot. `PreCompact` blocks compaction saves and `SessionStart` (resume) validates no prior context was loaded.

---

## Troubleshooting

### @import not taking effect after task switch

1. Verify `.claude/CLAUDE.md` contains exactly one `@import` line
2. Confirm the imported path resolves to a file on disk
3. Use `/resume` to reload (continuing a session doesn't re-read CLAUDE.md)

### Status line not appearing

1. Check `~/.claude/context-curator/monitor-state.json` exists (created by first `PostToolUse` hook invocation)
2. Verify the `PostToolUse` hook is registered in `~/.claude/settings.json`
3. Confirm `CLAUDE_SESSION_TYPE` is not set to `headless`

### PostCompact hook fires but injects wrong task

1. Check `.claude/CLAUDE.md` @import points to the correct task directory
2. The hook reads the task CLAUDE.md from the project directory at `process.cwd()`; verify the hook runs from the correct cwd

### `/docs-markdown` says "skill not found"

The docs-markdown skill requires the authoring bundle to be installed first (Phase 9). Run `install.sh` or `init-project.ts --project-install` before invoking documentation skills.

### Golden context size limit exceeded

Context files are capped at 100KB for golden (committed) contexts. Personal contexts have no limit. If a personal context exceeds 100KB, trim it before promoting: `/context-manage` → trim the context → `/context-promote`.

### Adversary task save-context exits non-zero

Correct — STRICT isolation blocks all context saves. Use the adversary task only for red-team runs; switch back to your development task before saving context.

### Zone warning fires repeatedly

The sentinel should suppress repeats. If it fires again in the same zone, check whether `session-start-hook.ts` is resetting sentinels on every tool call instead of only on session start.

### Manifest version mismatch

Run `npm run build` to regenerate `dist/version.json`, then re-run `install.sh` to update `~/.claude/context-curator-manifest.json`.

---

## Version History

- **v15.1** (2026-05-09): All phases implemented; F-PROCESS added — PRD v21.0
  - **Phase 6 complete**: All 15 SKILL.md files created; `install.sh` updated for three-bundle install
  - **Phase 7 complete**: `auto-save-context.ts`, `postcompact-reinject.ts`, `session-start-hook.ts` implemented
  - **Phase 8 complete**: `update-monitor-state.ts`, `status-line.ts`, `warn.ts`, `estimate-cost.ts`, `on-compaction.ts` implemented; burn rate calculation inlined in `update-monitor-state.ts` (no separate `compute-burn-rate.ts`)
  - **Phase 9 complete** (with F-PROCESS): `prd-process-status.ts` + `authoring/prd-process/SKILL.md`; all 7 authoring skills implemented; T-PROC-1 through T-PROC-6 added
  - **Phase 10 complete**: HTML docs generated for all 14 pages; `docs/html/style.md` and `docs/feature-section-map.md` created
  - **Phase 11 complete**: `install.sh` writes manifest; `verify-manifest.ts` validates version; `dist/version.json` present (update to 15.1.0 before release)
  - **Phase 12 complete**: `--project-install` flag in `install.sh` copies skills + manifest to `.claude/`
  - **Doc headers corrected**: PRD header updated to v21.0; dev-plan header updated to v15.1/PRD v21.0
- **v15.0** (2026-05-09): Major update for PRD v20.1
  - **Phase 6**: Skills architecture migration — all commands converted from `~/.claude/commands/` to skills under `~/.claude/skills/context-curator/`; three-bundle namespace (`authoring/`, `session/`, `monitor/`)
  - **Phase 7**: Hooks — PreCompact auto-save (`auto-save-context.ts`), PostCompact re-injection (`postcompact-reinject.ts`), SessionStart sentinel clear (`session-start-hook.ts`)
  - **Phase 8**: Context Monitor — state file with single-writer pattern, atomic writes, status line, zone warnings, burn rate, cost estimation (T-MON-1 through T-MON-13)
  - **Phase 9**: Document Authoring Skills — prd, test-plan, dev-plan, test-inventory SKILL.md files with auto-invocation (T-DOC-1 through T-DOC-6)
  - **Phase 10**: User Documentation System — docs-markdown and docs-html skills, markdown-first invariant, a11y generation constraints (T-UDOC-1 through T-UDOC-8)
  - **Phase 11**: Skill Marketplace — manifest format, bundle install, dist/version.json (T-MKT-1 through T-MKT-4)
  - **Phase 12**: Project-scope install — `--project-install` flag, `.claude/skills/` committed layout (T-INIT-7/8/9)
  - Updated file structure tables, design decisions, and troubleshooting for all new features
  - **Bootstrapping note**: Phase 9 (authoring skills) must complete before Phase 10 (docs system) can bootstrap
- **v14.0** (2026-03-13): Specialized task framework (F-SPEC), adversary task (F-ADVERSARY), Phase 5
- **v13.0** (2026-01-17): Two-file CLAUDE.md system, golden contexts, secret detection
- **v10.1** (2026-01-13): Global installation model
- **v10.0** (2026-01-10): Initial @-import architecture

---

**Built to preserve developer sanity and hard-won knowledge.**
