# LoD2 Test Inventory & Coverage Audit

**Reviewer:** LoD2 Adversary (Opus 4.7) — independent session
**Date:** 2026-05-17
**PRD Version:** 21.3
**Risk Acceptances Loaded:** RA-001 (active to 2026-09-12), RA-002 (active until v2.0-release)

---

## Section 0 — PRD Structural Audit

Audit of every `### F-XXX` feature section and its decomposition: does it embed a falsifiable AC table directly?

| Section | AC Embedded? | Falsifiable? | Verdict |
|---------|--------------|--------------|---------|
| F-INIT | YES (T-INIT-1..9, T-INST-1..6) | YES | PASS |
| F-TASK-CREATE | YES (T-TASK-1..7) | YES | PASS |
| F-TASK-SWITCH | YES (T-SWITCH-1..6) | YES | PASS |
| F-TASK-DELETE | YES (T-TASK-DEL-1..3) | YES | PASS |
| F-CTX-SAVE | YES (T-CTX-1..6, T-MEM-1) | YES | PASS |
| F-CTX-LIST | YES (T-LIST-1..4) | YES | PASS |
| F-CTX-MANAGE | YES (T-CTX-7, T-MANAGE-1..6) | YES | PASS |
| F-CTX-PROMOTE | YES (T-CTX-5, T-PROM-1..3) | YES | PASS |
| F-CLMD | YES (T-CLMD-1, T-CLMD-2, T-RESUME-MANUAL) | T-RESUME-MANUAL is a MANUAL clause; rest falsifiable | PASS |
| F-SEC | YES (T-SEC-2..10; T-SEC-1 absent — numbering gap, not a coverage gap) | YES | PASS |
| F-SUMMARY | YES (T-SUM-1..3) | YES | PASS |
| F-GIT | YES (T-GIT-1, T-GIT-2) | YES | PASS |
| F-XPLAT | YES (T-ERR-3 only) | YES — minimal but falsifiable | PASS |
| F-ERR | YES (T-ERR-1, T-ERR-2) | YES | PASS |
| F-DOC-SKILLS | YES (T-DOC-1..6; T-DOC-7 missing — renumbering artifact; T-DOC-8 referenced only in changelog §1589, no AC row) | YES — but several clauses describe runtime behavior of skills | PASS structurally |
| F-MARKETPLACE | YES (T-MKT-1..4) | YES | PASS |
| F-HOOK | YES (T-HOOK-1) | YES | PASS |
| F-HOOK-POST | YES (T-HOOK-POST-1..3) | YES | PASS |
| F-CTX-MONITOR (parent) | NO — decomposition section only | N/A | PASS (parent section, ACs in sub-features) |
| F-CTX-MONITOR-STATUS | YES (T-MON-1..4, T-MON-14, T-MON-15) | YES | PASS |
| F-CTX-MONITOR-WARN | YES (T-MON-5..9) | YES | PASS |
| F-CTX-MONITOR-COST | YES (T-MON-10..13, T-MON-16..18) | YES | PASS |
| F-SPEC | YES (T-SPEC-1..5) | YES | PASS |
| F-ADVERSARY | YES (T-ADV-1..4) | YES | PASS |
| F-PRD | YES (T-PRD-1..4) | YES | PASS |
| F-DOC | YES (T-UDOC-1..8) | YES — though some describe skill runtime behavior | PASS |
| F-PROCESS | YES (T-PROC-1..6) | YES | PASS |

**Structural notes:**
- T-DOC-7 and T-DOC-8: T-DOC-7 absent from PRD AC tables (numbering gap). T-DOC-8 referenced only in v20.1 changelog (§1589) — no AC table row defines it. Both are renumbering artifacts, not coverage failures.
- T-SEC-1 absent (codes start at T-SEC-2) — numbering convention, no gap.
- F-CTX-MONITOR is a decomposition section without its own AC table; the three sub-features each carry their own ACs. Acceptable per the structural rule: AC must be embedded in the feature section whose behaviors it certifies; parent decomposition sections without behavior of their own do not require duplicated AC.

---

## Section 1 — Test Inventory

| F-CODE | T-CODE | DESCRIPTION | AC_CLAUSE | COVERAGE_RATIONALE | VERDICT |
|--------|--------|-------------|-----------|---------------------|---------|
| F-INIT | T-INIT-1 | Pre-asserts no `.claude/CLAUDE.md`, runs init-project, asserts file exists with @import resolving to `tasks/default/CLAUDE.md` | init-project creates `.claude/CLAUDE.md` containing an @import line; file must not exist before script runs | Pre-condition removes self-fulfilling setup; resolved-path check is specific. A stub returning a generic @import without resolving to default/CLAUDE.md would fail. | PASS |
| F-INIT | T-INIT-2 | Pre-asserts no backup, runs init, asserts backup created and content equals original byte-for-byte | init-project copies root CLAUDE.md byte-for-byte to stash; backup must not exist before script runs | Pre-condition + byte-equality. | PASS |
| F-INIT | T-INIT-3 | Pre-asserts default task CLAUDE.md does not exist, runs init, asserts content equals root verbatim | default/CLAUDE.md content equals root char-for-char | Strict byte-equality with pre-condition. | PASS |
| F-INIT | T-INIT-4 | Two init runs; asserts exit 0 each, identical `.claude/CLAUDE.md` content, exactly one stash backup file | Two runs exit 0 and produce identical file contents | Exit codes + content identity + non-duplication of stash. | PASS |
| F-INIT | T-INIT-5 | Two project envs initialized; save-context run in project 1; asserts file appears only in project 1's personal path, not project 2's | Writing to project A's personal dir does not make it visible in project B's | End-to-end exercise of save-context with disjoint personalBase roots. Positive + negative assertions. | PASS |
| F-INIT | T-INIT-6 | After init: asserts prod-mgmt/risk-acceptances.md exists containing DISPOSITION, EXPIRY, RA_ID; idempotency check verifies file not overwritten on second init | risk-acceptances.md exists with required strings; idempotent | All three required strings asserted; idempotency separately verified. | PASS |
| F-INIT | T-INIT-7 | First `it.todo` placeholder; second describe block replicates install.sh cpSync of bundles into temp project, then asserts five session skill dirs each have SKILL.md and scripts/ | `init-project --project-install` creates `.claude/skills/context-curator/` with five skill dirs each with SKILL.md and scripts/ | The test does NOT invoke `init-project --project-install`. It mirrors install.sh's copy logic, validating that the source tree (src/skills/...) has the required shape. A regression in `init-project --project-install` that fails to copy bundles when the flag is passed would not be caught. The AC's subject is the script's behavior under the flag, not the source artifact. | FAIL |
| F-INIT | T-INIT-8 | `it.todo` only; no test exists | Project-scope `/context-save` resolves to .claude/skills/.../context-save not user-scope | No implementation. | FAIL (MISSING) |
| F-INIT | T-INIT-9 | `it.todo` only; no test exists | Cloned repo with committed skills has `/task` available without install.sh | No implementation. | FAIL (MISSING) |
| F-INIT (Install) | T-INST-1 | Runs install.sh in temp HOME; asserts settings.json hooks.PostToolUse has an entry whose command ends with update-monitor-state.js | PostToolUse contains **exactly one** entry ending with update-monitor-state.js | Test uses `.some()` not `.length === 1`. AC says "exactly one"; duplicate entries would not fail this test (T-INST-4 separately covers idempotency but T-INST-1 alone does not enforce uniqueness). | FAIL |
| F-INIT (Install) | T-INST-2 | Same shape as T-INST-1 for Stop hook | Stop contains **exactly one** entry ending with status-line.js | Same `.some()` gap. | FAIL |
| F-INIT (Install) | T-INST-3 | Same shape as T-INST-1 for SessionStart hook | SessionStart contains **exactly one** entry ending with session-start-hook.js | Same `.some()` gap. | FAIL |
| F-INIT (Install) | T-INST-4 | Two install.sh runs; asserts each hook array has `.length === 1` | After two runs, each hook array has exactly one entry | Direct length check. | PASS |
| F-INIT (Install) | T-INST-5 | Walks repo bundles, filters `invocation: explicit` SKILL.md files, asserts each installed at `~/.claude/commands/<bundle>/<skill>.md` | Every explicit-invocation SKILL.md exists at the expected commands path | Iterates source then checks installed path; falsifiable. | PASS |
| F-INIT (Install) | T-INST-6 | Walks `~/.claude/commands/` recursively; asserts no session-bundle skill name appears | No file under `~/.claude/commands/` whose path contains task/context-save/context-list/context-manage/context-promote | Early-return when `commandsDir` does not exist — if install.sh fails to create commands/ at all, this test passes vacuously. T-INST-5 mitigates by independently checking the directory exists, but T-INST-6 alone is not robust. | ESCALATE |
| F-TASK-CREATE | T-TASK-1 | Runs task-create; asserts required headers in CLAUDE.md, description keyword in extracted Focus section, @import directive updated | task-create produces CLAUDE.md with required headers; description keyword appears under ## Focus | Focus section extraction by string offset; per-section keyword check. | PASS |
| F-TASK-CREATE | T-TASK-2 | Asserts uppercase task name → non-zero exit AND no directory at either uppercase or lowercased name | Exit non-zero AND no directory created for uppercase task name | Both clauses verified. | PASS |
| F-TASK-CREATE | T-TASK-3 | Creates task with 4-line description; extracts Focus section; asserts every line verbatim | Four-line description preserved verbatim in Focus section | Strict per-line `toContain`. A keyword-rewriting impl would fail. | PASS |
| F-TASK-CREATE | T-TASK-4 | Empty description → non-zero exit AND no task directory | Empty description rejected; no directory | Both clauses verified. | PASS |
| F-TASK-CREATE | T-TASK-5 | Runs task-create with positional description; asserts CLAUDE.md contains description; .claude/CLAUDE.md references task | Inline description creates task without second prompt; updates .claude/CLAUDE.md | The "without any intermediate prompt" clause is not falsifiably tested — there is no interactive harness; the script runs in non-interactive mode. An implementation that prints a non-blocking confirmation and proceeds with defaults would pass. The file-output checks confirm the create succeeded; they do not exclude a no-op prompt. | ESCALATE |
| F-TASK-CREATE | T-TASK-6 | Sub-test 1: empty description → no directory, non-zero exit. Sub-test 2: reads SKILL.md and verifies it contains usage example string | Output (of the running command) contains `/task <id> <description>` usage example and does NOT create a task directory | Sub-test 1 verifies non-creation. Sub-test 2 verifies documentation strings in SKILL.md, not the actual stdout/stderr from invoking the command without a description. The AC names the command's output as the subject; the test substitutes the static skill docs. | FAIL |
| F-TASK-CREATE | T-TASK-7 | In a fresh project with no .claude/, runs init-project then task-create; asserts both files exist | On a project with no `.claude/`, `/task <id> <description>` completes successfully | The AC's subject is `/task <id> <description>` completing on an uninitialized project (per PRD §540, the v21.3 expected behavior). The test pre-invokes init-project explicitly as a separate step; auto-init via task-create alone is not exercised. An impl that fails to auto-init when invoked without prior init would pass this test. | FAIL |
| F-TASK-SWITCH | T-SWITCH-1 | Switches A→B→C→A; after each, asserts `.claude/CLAUDE.md` has exactly one @import line containing the selected task ID | Exactly one @import line on each switch, pointing to selected task | Strict 1-line + ID-containment assertion per switch. | PASS |
| F-TASK-SWITCH | T-SWITCH-2 | context-list on empty task; asserts output matches `/no contexts|\bfresh\b/i` and exit 0 | When task has no contexts: exit 0, output contains "no contexts" or "fresh" (complete word) | Word boundary on "fresh" avoids "Refreshed" substring match. | PASS |
| F-TASK-SWITCH | T-SWITCH-3 | Task with both personal and golden contexts; asserts personal context name appears before golden context name in output | All context names appear; personal listed before golden | Ordering check uses specific context names, not generic section labels. | PASS |
| F-TASK-SWITCH | T-SWITCH-4 | Plants UUID session files; runs `context-list --json`; asserts `contexts: []` and `sessions` populated | --json returns contexts:[] even with active UUID sessions | Direct JSON shape assertion. | PASS |
| F-TASK-SWITCH | T-SWITCH-5 | Same plant; human-readable output: asserts no "personal contexts"/"golden contexts" headers, no numbered-UUID pattern | UI does not present UUID sessions as numbered selectable options | Numbered-UUID regex is specific and falsifiable. | PASS |
| F-TASK-SWITCH | T-SWITCH-6 | Switches to default; asserts output mentions vanilla/restored AND @import points to default/CLAUDE.md AND no longer contains the previous task ID | Switch to default sets @import to default/CLAUDE.md and confirms switch in output | Conjunctive check + negation of previous task ID. | PASS |
| F-TASK-DELETE | T-TASK-DEL-1 | Creates task; runs delete-task; asserts exit 0 and both golden and personal directories removed | delete-task exits 0 and removes both directories | Direct assertion on both directories. | PASS |
| F-TASK-DELETE | T-TASK-DEL-2 | Runs delete-task default; asserts non-zero exit and default directory still exists | delete-task exits non-zero for default and removes no directories | Asserts default persists. Does NOT enumerate other tasks to verify they remain — an impl that rejected default but deleted other tasks could slip through. AC says "removes no directories"; coverage is partial. | ESCALATE |
| F-TASK-DELETE | T-TASK-DEL-3 | Runs delete-task on non-existent task; asserts non-zero exit and matching error output | delete-task exits non-zero for non-existent task-id and removes no directories | Same gap as T-TASK-DEL-2 — does not verify other directories untouched. | ESCALATE |
| F-CTX-SAVE | T-CTX-1 | save-context --personal; asserts exit 0 and file at exact expected path; asserts valid JSONL | save-context --personal creates file at exact expected path | Direct path + JSONL validity. | PASS |
| F-CTX-SAVE | T-CTX-2 | Same save; asserts file exists, isValidJsonl true, non-empty content | Saved context file parses as valid JSONL unconditionally | Both validity and non-emptiness asserted; non-empty check prevents trivial-pass on isValidJsonl for empty file. | PASS |
| F-CTX-SAVE | T-CTX-3 | Multiple sub-tests: clean save outputs scan/secret evidence; AWS/Stripe/GitHub key saves exit non-zero with type-specific output AND no golden file created | Real-secret saves exit non-zero or produce a prompt; exit 0 with no prompt is a failure; scan must BLOCK file creation | Block-file-creation assertion is strong. The "produces a prompt" branch in the AC is not directly exercised (test asserts only non-zero), but combined with the no-creation assertion this is acceptable — the PRD framing favors blocking and the no-creation assertion forecloses the "prompt then save anyway" path. | PASS |
| F-CTX-SAVE | T-CTX-4 | (Implicit in test 4.5) Empty session → non-zero exit; 150KB session → non-zero with "100KB"/"too large" output and no file created. Size precondition `statSync.size > 100KB` asserted | save-context --golden on 150KB session exits non-zero with "100KB"/"too large" output | Size precondition prevents vacuous pass; output regex specific; file-non-creation asserted. | PASS |
| F-CTX-SAVE | T-CTX-6 | Saves with same name twice; captures original content; asserts backup file exists in contexts dir matching pattern and contains captured original | Second save with same name creates `.backup-` file containing original content | Captures + asserts byte-equality. Duplicate coverage in two test files. | PASS |
| F-CTX-SAVE | T-MEM-1 | After save-context, asserts `<personalDir>/memory/MEMORY.md` contains task-id and context-name | After save-context, file `<personalDir>/memory/MEMORY.md` contains the task-id and context-name | Test comment in source: "the DoD spec says ~/.claude/projects/<sanitized>/MEMORY.md but the implementation adds a memory/ subdirectory. Test what the implementation actually writes." This is a Coupling heuristic violation. The PRD AC (§627) was updated to match the impl path, so the test currently matches PRD. The vulnerability: this is a coupling-by-rewrite pattern — the AC was reshaped to match what the impl does rather than the spec. Conditional on the current PRD text, the test is correct. | PASS |
| F-CTX-LIST | T-LIST-1 | (Multi-test) Personal-only case asserts "Personal" present, "Golden" absent; mixed case asserts personal-ctx index < golden-ctx index | Output: indexOf("Personal") < indexOf("Golden") AND specific context names appear | Ordering uses specific context names; negative assertion when only one section. | PASS |
| F-CTX-LIST | T-LIST-2 | Asserts ctx-1 line matches `\b5\b` and ctx-2 line matches `\b30\b` | Exact message count word-boundary match (not `\d+`) | Per-context line check with word-boundary regex. | PASS |
| F-CTX-LIST | T-LIST-3 | Asserts output matches `/\bfresh\b|\bempty\b|\bno contexts\b/i` | Output contains "fresh", "empty", or "no contexts" | Word boundaries on all three alternatives. | PASS |
| F-CTX-LIST | T-LIST-4 | Saves a context; asserts meta.json has content-derived summary keyword AND context-list output line for the context contains the `—` separator and a content keyword after it | Non-empty content-derived description after each context name, not just metadata | Two-part check: metadata correctness + display separator + content-derived keyword. | PASS |
| F-CTX-MANAGE | T-CTX-7 | Asserts delete-context on golden (no --force) exits non-zero and file still exists | delete-context on golden exits non-zero without --force; file still exists | Direct. | PASS |
| F-CTX-MANAGE | T-MANAGE-1 | Creates contexts in two tasks; asserts list-all-contexts stderr contains both context names and both task names | list-all-contexts shows context names from ≥2 tasks | Four specific strings asserted. | PASS |
| F-CTX-MANAGE | T-MANAGE-2 | Sets mtime 31 days ago; asserts "stale" appears on same line as context name | Marks context stale when mtime > 30 days | Same-line `lines.find().toContain('stale')`. | PASS |
| F-CTX-MANAGE | T-MANAGE-3 | Writes two byte-identical files; asserts both lines contain "duplicate" | Identifies byte-identical files as duplicates | Per-line assertion on both. | PASS |
| F-CTX-MANAGE | T-MANAGE-4 | Runs delete-context --dry-run; asserts exit 0, output contains context name, file still exists | --dry-run exits 0, prints what would be deleted, does not delete | All three clauses. | PASS |
| F-CTX-MANAGE | T-MANAGE-5 | Runs rename-context; asserts old path absent, new path is valid non-empty JSONL | rename-context exits 0; old absent; new valid non-empty | Three unconditional assertions. | PASS |
| F-CTX-MANAGE | T-MANAGE-6 | Runs archive-context; asserts file at archives/<name>.jsonl, original absent, valid JSONL | archive-context exits 0; file at archives path; original gone | Direct. | PASS |
| F-CTX-PROMOTE | T-CTX-5 | Promotes 150KB context; asserts non-zero exit, output matches `/100kb|too large/i`, golden file not created; size precondition `statSync.size > 100_000` | promote on 150KB context exits non-zero with "100KB"/"too large"; promotion blocked | Size precondition prevents vacuous pass. Block-creation assertion present. Two test files. | PASS |
| F-CTX-PROMOTE | T-PROM-1 | Promotes clean context; asserts both personal original and golden copy exist with byte-identical content | Both exist; contents byte-for-byte identical | Direct byte-equality. | PASS |
| F-CTX-PROMOTE | T-PROM-2 | Promotes context with GitHub token; asserts non-zero exit and output matches `/ghp_|github token|github pat/i` | Output names the specific secret type | Tightened from prior `/github/i` substring vacuity to require the prefix or an explicit type label. | PASS |
| F-CTX-PROMOTE | T-PROM-3 | First promotion legit-creates golden; second promotion asserted non-zero with "already golden"/"already exists" message | Setup must create personal context only; second promotion fails | Setup confirms golden didn't exist before first promotion. | PASS |
| F-CLMD | T-CLMD-1 | Multi sub-test: asserts root CLAUDE.md content unchanged after init, task-create x2, switching A↔B↔default; git status doesn't show root CLAUDE.md modified | Root CLAUDE.md content equals pre-operation content | Multiple operation paths covered. | PASS |
| F-CLMD | T-CLMD-2 | After two task switches, asserts exactly one @import line containing task-2, not task-1 | After two task switches, .claude/CLAUDE.md contains exactly one @import line | Strict line count + content negation. | PASS |
| F-CLMD | T-RESUME-MANUAL | Test 8.5 is a structural proxy: asserts @import is correctly set after task-create + update-import; the AC itself is MANUAL | After /task + /resume, Claude's response references task CLAUDE.md content | Risk-accepted RA-002 (expires v2.0-release). Structural proxy verifies only the writing-side of the contract. Manual verification pending. | ACCEPTED (RA-002) |
| F-SEC | T-SEC-2 | scan-secrets on AWS fixture; asserts non-zero exit, output matches `/akia/i` | AKIA + 16 chars exits non-zero; output contains "AWS" or "AKIA" | Specific pattern check. | PASS |
| F-SEC | T-SEC-3 | scan-secrets on Stripe fixture; asserts output contains `sk_test_` and `sk_live_` and exit non-zero | Detects both `sk_test_` and `sk_live_`; names specific type | Both prefixes required. | PASS |
| F-SEC | T-SEC-4 | Fixture with one secret per user/assistant/tool_result; asserts pattern from each appears in output | All three message types reported | Three pattern assertions; an impl skipping a type would fail. | PASS |
| F-SEC | T-SEC-5 | Isolated fixture containing only AKIAIOSFODNN7EXAMPLE; asserts non-zero exit and `/akia/i` | AKIAIOSFODNN7EXAMPLE treated as true positive | Isolated fixture removes accidental masking. | PASS |
| F-SEC | T-SEC-6 | Redacts AWS fixture; asserts redacted file valid JSONL; rescan returns "clean" | After redact, every line parses as JSON; rescan returns "clean" | Pipeline check + final state assertion. | PASS |
| F-SEC | T-SEC-7 | scan-secrets on 5-secret fixture; asserts output matches `/\bfound\s+5\s+secret|\b5\s+secrets?\s+found/i` | Output matches "found 5 secret" or "5 secret(s) found" | Tightened adjacency regex prevents "5 messages" + later "secrets" false match. | PASS |
| F-SEC | T-SEC-8 | scan-secrets on GitHub fixture; asserts non-zero exit and `/ghp_/i` | ghp_ + 36 chars exits non-zero; output contains "ghp_" or "github" | Tightened to `ghp_` prefix. | PASS |
| F-SEC | T-SEC-9 | scan-secrets on RSA private-key fixture; asserts non-zero exit and `/rsa.*private|private.*key|BEGIN.*PRIVATE/i` | RSA private key header exits non-zero; output matches private-key patterns | Three OR alternatives explicitly listed in AC. | PASS |
| F-SEC | T-SEC-10 | scan-secrets on password fixture; asserts non-zero exit and `/password/i` | password=<value> exits non-zero; output contains "password" | Direct. | PASS |
| F-SUMMARY | T-SUM-1 | After save-context, asserts .meta.json exists; summary is 20-500 chars; contains auth-related keyword from SMALL_CONTEXT | summary between 20 and 500 chars; content-derived | Range + content-keyword check. | PASS |
| F-SUMMARY | T-SUM-2 | Saves auth-content and DB-migration content; asserts summaries differ AND each contains source-content keyword | Two different contexts → different summaries | Both must differ AND each contain its source keyword; very strong falsifiability. | PASS |
| F-SUMMARY | T-SUM-3 | Captures source session content before save-context; asserts byte-identity after | Source session JSONL byte-for-byte identical before and after | Direct byte-equality. | PASS |
| F-GIT | T-GIT-1 | Real git repo + committed .gitignore + git check-ignore call returns true on `.claude/CLAUDE.md` | git check-ignore exits 0 after init | Real git invocation. | PASS |
| F-GIT | T-GIT-2 | After full workflow, runs git status --porcelain; asserts personal context file exists outside projectDir and its filename absent from each status line | git status does not list any path resolving into personal storage; path expressed as relative prefix | Test asserts the personal file exists outside projectDir AND the filename does not appear in any status line. The AC's stated form ("personal storage path must be expressed as a relative prefix") is not enumerated in the test — but the relative form of any path inside personalBase that ALSO lives under projectDir would have to be checked, and the personal path being demonstrably outside projectDir makes the relative-form concern moot. Reasonable interpretation; the per-line filename-substring check is the strongest tractable assertion. | PASS |
| F-XPLAT | T-ERR-3 | Creates project at path with space; runs init, task-create, update-import; asserts each exits 0 and produces expected file | All operations work with space in path; exit 0 AND output exists | Three operations checked. AC says "all operations" — only a representative sample; reasonable. | PASS |
| F-ERR | T-ERR-1 | Calls task-create without prior init; asserts non-zero exit, output contains "init"/"not initialized", no stack-trace patterns in stderr | Any script run without init exits non-zero with "init" in output, not a stack trace | Both positive and negative assertions. | PASS |
| F-ERR | T-ERR-2 | scan-secrets on corrupt JSONL; asserts non-zero exit and no stack-trace patterns | Malformed JSONL exits non-zero (not 0) | Direct. | PASS |
| F-ERR | (companion: 13.6) | Test makes tasks dir read-only and asserts permission error; early-returns when running as root or when chmod fails | (Graceful permission handling per F-ERR expected behaviors) | Risk-accepted RA-001 (expires 2026-09-12). Early-return guards can cause vacuous pass on root CI. | ACCEPTED (RA-001) |
| F-DOC-SKILLS | T-DOC-1 | Iterates every `### F-` section in prd.md; asserts each has Expected Behaviors, Acceptance Criteria, and a T-XXX row | `/prd new-feature` produces a markdown section containing the four required elements | The AC's subject is the SCAFFOLDING behavior of `/prd new-feature`. The test validates the LIVE PRD's structural compliance. An impl of `/prd new-feature` that produced broken scaffolding would NOT be caught — the live PRD is hand-authored. Coupling violation. | FAIL |
| F-DOC-SKILLS | T-DOC-2 | Parses prd/SKILL.md frontmatter; asserts `invocation: auto` and `trigger-pattern: *prd*.md`; runtime check is `it.todo` | Auto-invocation: when active file matches *prd*.md, PRD skill description appears in session context | Static spec check only; runtime claim is `it.todo`. The actual auto-invocation behavior is not tested. | FAIL (runtime portion MISSING) |
| F-DOC-SKILLS | T-DOC-3 | Asserts LIVE test-plan.md has required sections and ≥6 numbered banned-pattern items | `/test-plan new` produces a document containing all mandatory sections | Same Coupling violation as T-DOC-1: tests the live artifact, not the scaffolding. | FAIL |
| F-DOC-SKILLS | T-DOC-4 | Asserts LIVE dev-plan.md has required sections (Based on: PRD v, executive summary, phases, file structure, design decisions, troubleshooting) | `/dev-plan new` produces a document with required sections | Same Coupling violation. | FAIL |
| F-DOC-SKILLS | T-DOC-5 | Filters live PRD AC rows for "handles gracefully"/"works correctly"; asserts none match | `/prd check-ac` on a PRD with one vague criterion flags it; PRD with only falsifiable criteria produces no flags | The test does NOT invoke `/prd check-ac` — it checks the live PRD for vague patterns. An impl of `check-ac` that flagged nothing on every input would pass trivially because the test never runs it. | FAIL |
| F-DOC-SKILLS | T-DOC-6 | Parses test-inventory/SKILL.md frontmatter; asserts `guard: adversary-task-active` and adversary-only error string. Runtime is `it.todo` | test-inventory skill is only loadable when adversary task is active; otherwise errors | Static spec check only. The runtime guard claim is `it.todo`. | FAIL (runtime portion MISSING) |
| F-MARKETPLACE | T-MKT-1 | Extracts manifest template heredoc from install.sh; substitutes shell vars; parses as JSON; asserts bundles.authoring, .session, .monitor exist | install.sh creates ~/.claude/context-curator-manifest.json; valid JSON with the three bundle keys | Validates the TEMPLATE inside install.sh, not the produced file. An install.sh that has correct heredoc but a shell error preventing the actual cat would still pass. | ESCALATE |
| F-MARKETPLACE | T-MKT-2 | Sub-test A: cpSync authoring bundle source to temp; asserts the four authoring SKILL.md files exist and context-save/task absent. Sub-test B: parses manifest template; asserts authoring.skills has no session/ paths or context-save | Authoring-only install: 4 authoring commands available, /context-save NOT available | Tests bundle source structure and manifest declaration text; does NOT exercise actual `/plugin marketplace add` flow. The AC's subject is command availability after install. Static checks alone cannot prove a runtime command is or isn't available. | ESCALATE |
| F-MARKETPLACE | T-MKT-3 | Sub-tests: dist/version.json parses; install.sh sources $VERSION from it; mismatched manifest → verify-manifest exits non-zero with "version" output | Manifest version matches dist/version.json; mismatch exits non-zero with "version" message | Case B (mismatch) is exercised end-to-end against verify-manifest. Case A (match) is transitive via the template referencing $VERSION. | PASS |
| F-MARKETPLACE | T-MKT-4 | Writes a team manifest with `custom` bundle to temp; reads back; asserts custom.description present. Runtime via `/plugin marketplace list` is `it.todo` | Team manifest is discoverable via /plugin marketplace list; description appears in output | Static read-back only; the AC's actual claim — runtime discovery — is unverified. | FAIL (runtime portion MISSING) |
| F-HOOK | T-HOOK-1 | Plants UUID session JSONL with auth content; runs auto-save-context.ts with payload via stdin; asserts a timestamped .jsonl in auto-saves/ contains the planted "authentication" content | auto-save-context with mock stdin creates timestamped .jsonl in auto-saves/ | Content verification proves it copied real session content, not an empty placeholder. | PASS |
| F-HOOK-POST | T-HOOK-POST-1 | Creates non-default task; runs postcompact-reinject; asserts exit 0, non-empty stdout, stdout contains task ID | With non-default task active, output contains task ID; not empty | Three-part assertion. | PASS |
| F-HOOK-POST | T-HOOK-POST-2 | Default task active; runs postcompact-reinject; asserts exit 0, stdout empty (trimmed) | With default task active, exits 0 and outputs nothing | Direct. | PASS |
| F-HOOK-POST | T-HOOK-POST-3 | Sets @import to non-existent task; runs hook; asserts exit 0 and filtered stderr matches `/warning|not found/i` | Missing task CLAUDE.md exits 0; stderr warns | Filters DEP0205 deprecation noise. | PASS |
| F-CTX-MONITOR-STATUS | T-MON-1 | Sets state file; runs status-line; asserts exit 0 + non-empty output; greps status-line.ts source for imports of @anthropic-ai/sdk, node-fetch/cross-fetch/axios, node:http/https, require('http(s)) | Status line reads only from monitor state file — no API/model calls | Source-grep negative list is non-exhaustive. Common alternatives (`undici`, `got`, `request`, `https.get` without explicit `node:` prefix in TS) would not be caught. The test passes if the code uses an HTTP client whose import string is not in the listed patterns. | ESCALATE |
| F-CTX-MONITOR-STATUS | T-MON-2 | Sets state with fillPct 47.5, tokensSinceBaseline 31000, cost 0.18, burnRate 2100; asserts output matches /47/, /31k/, /0.18/, /2.1k/ | Output matches 47 AND 31k AND 0.18 AND 2.1k | Direct AC-named pattern checks. | PASS |
| F-CTX-MONITOR-STATUS | T-MON-3 | Sets CLAUDE_SESSION_TYPE=headless; asserts exit 0 and empty stdout AND empty stderr | Headless mode produces no stdout or stderr | Direct. | PASS |
| F-CTX-MONITOR-STATUS | T-MON-4 | Session with 240k chars, baselineTokens=null; runs update-monitor-state then status-line; asserts tokensSinceBaseline=currentTokens and status-line exits 0 | tokensSinceBaseline equals currentTokens when baseline null; status line renders without error | Both clauses asserted. | PASS |
| F-CTX-MONITOR-STATUS | T-MON-14 | Asserts status-line.js stdout is parseable JSON with non-empty `systemMessage`; filtered stderr is empty | status-line writes JSON to stdout; stderr empty | Filtered-stderr (DEP0205 stripped) and JSON-shape check. | PASS |
| F-CTX-MONITOR-STATUS | T-MON-15 | Asserts `systemMessage` matches strict format regex | systemMessage matches `^\[.+ \d+% \| \+\d+k since warm-up \| ~\$[\d.]+ \| [\d.]+k tok\/msg\]$` | Direct regex match. | PASS |
| F-CTX-MONITOR-WARN | T-MON-5 | Two sub-tests: 65% → warn stderr "degrading" + save suggestion; 64.9% → filtered stderr empty | Warning fires at 65%; silent below | Both cases. | PASS |
| F-CTX-MONITOR-WARN | T-MON-6 | 80% → "critical" + restart suggestion; 79.9% → "degrading" without "critical" | Critical at 80%; degrading-only at 79% | Both presence and absence asserted. | PASS |
| F-CTX-MONITOR-WARN | T-MON-7 | First call at 65% sets sentinel; second at 66% with sentinel=true asserted to produce filtered-empty stderr | Sentinel suppresses repeat warning | Sentinel mutation verified then suppression verified. | PASS |
| F-CTX-MONITOR-WARN | T-MON-8 | Sentinel=true at 30%; runs on-compaction; asserts sentinel cleared; re-fires warning at 65% | Sentinel cleared after compaction; re-fires on re-entry | End-to-end sequence. | PASS |
| F-CTX-MONITOR-WARN | T-MON-9 | Writes both sentinels=true; runs session-start-hook; asserts both false | SessionStart hook clears all zone sentinels | Direct. | PASS |
| F-CTX-MONITOR-COST | T-MON-10 | 15-message JSONL using char-content (`'x'.repeat(t*4)`); asserts burnRatePerMessage within 5% of 255 (hand-calculated mean of last 10) | Burn rate = mean of last 10 messages within 5% | Test relies on update-monitor-state's char-based fallback (no `usage` field in messages). T-MON-16 requires API usage; the implementation has both paths. If implementation strictly enforced API usage path, char-based messages might yield zero or error. The test passes in current state but verifies the fallback semantic which is not itself an AC. Coupling-ambiguity. | ESCALATE |
| F-CTX-MONITOR-COST | T-MON-11 | Sets state with currentTokens=100000 + claude-sonnet-4-6 rates; runs estimate-cost --verbose; extracts "Total:" line and asserts within 1% of hand-calculated 0.54 | Cost estimation matches hand-calculated value within 1% | Pre-condition removes if-guard (T2 fix); Total: regex non-null required. | PASS |
| F-CTX-MONITOR-COST | T-MON-12 | Session JSONL with content producing 95000 char-tokens; baseline=42000; asserts state.currentTokens=95000 AND state.tokensSinceBaseline=53000 | tokensSinceBaseline = currentTokens − baselineTokens = 53000 | Same char-fallback dependency as T-MON-10. The arithmetic is meaningfully checked but only via the char-count path. | ESCALATE |
| F-CTX-MONITOR-COST | T-MON-13 | Worker_threads tight-loop reader for 3s while 20 concurrent update-monitor-state writes occur; asserts no JSON parse errors | State file writes are atomic | Real OS-thread interleaving via worker_threads; 20 writes; 30s timeout. | PASS |
| F-CTX-MONITOR-COST | T-MON-16 | Session with 1M-char user msg + assistant msg with usage.input_tokens=500; asserts state.currentTokens=500 (NOT char-estimated ~250k) | currentTokens reads from message.usage; no char-count | Extreme magnitude difference (500 vs ~250000) discriminates char vs API path decisively. | PASS |
| F-CTX-MONITOR-COST | T-MON-17 | Single assistant msg with usage (80k, 10k, 50k); window 200k; asserts currentTokens=140000 AND fillPct≈70.0 | (input + cache_creation + cache_read) / window = 70.0 ±0.1 | Direct three-field sum arithmetic. | PASS |
| F-CTX-MONITOR-COST | T-MON-18 | 20 large messages (no usage) + final assistant with usage summing to 100k; asserts fillPct ≤100, currentTokens ≤200000, fillPct≈50.0 | Historical content > window but last usage = 100k → fillPct ≤100 | Three conjunctive bounds. | PASS |
| F-SPEC | T-SPEC-1 | (in adversary.test.ts under T-ADV-3) Reads DNA before; runs 3 user task operations; reads after; byte-equality | DNA byte-for-byte identical across 3 operations | Isolated test DNA path; planted before; byte-equality. | PASS |
| F-SPEC | T-SPEC-2 | Updates import to adversary; attempts save-context; recursively scans both personal and golden adversary trees for any .jsonl | save-context with adversary active exits non-zero; output matches strict-isolation regex; no .jsonl at ANY path within adversary task directories | findJsonlFiles walks both trees. Strict pattern + recursive negative. | PASS |
| F-SPEC | T-SPEC-3 | After update-import adversary, runs context-list; asserts strict-isolation regex AND no UUID pattern | context-list for adversary exits 0; output matches strict-isolation regex; does NOT match any UUID | Direct positive + negative. | PASS |
| F-SPEC | T-SPEC-4 | Plants DNA in isolated CLAUDE_HOME; runs update-import adversary; asserts @import resolves to file containing ADVERSARY | imported path resolves to a file on disk whose content contains "ADVERSARY" | Resolution + content check. | PASS |
| F-SPEC | T-SPEC-5 | Plants DNA only at specialized path; runs task-check adversary; asserts exit 0 AND stdout exactly "exists:specialized" AND not "not-found" | task-check returns exists:specialized; does NOT return not-found | Two sub-tests cover both clauses. | PASS |
| F-ADVERSARY | T-ADV-1 | Replicates install.sh step 5 (cpSync specialized/ into temp HOME); asserts installed CLAUDE.md exists with ADVERSARY and STRICT | After ./install.sh, ~/.claude/context-curator/specialized/adversary/CLAUDE.md exists; content contains "ADVERSARY" and "STRICT" | Test does NOT invoke install.sh — it replicates the copy step. The AC's subject is "After ./install.sh"; a regression in install.sh's step 5 (wrong destination, missing variable expansion, ordering bug) would not be caught. Source-artifact validation only. | FAIL |
| F-ADVERSARY | T-ADV-2 | After update-import adversary, asserts exactly one @import line ending with `specialized/adversary/CLAUDE.md`; resolved file contains ADVERSARY | imported path ends with specialized/adversary/CLAUDE.md; file exists and contains "ADVERSARY" | Three chained assertions. | PASS |
| F-ADVERSARY | T-ADV-3 | Identical to T-SPEC-1 verification | DNA byte-for-byte identical across 3 user task operations | Direct. | PASS |
| F-ADVERSARY | T-ADV-4 | Same as T-SPEC-2 with recursive jsonl scan of both directories | No .jsonl at any path within adversary task context directories | Recursive walk; AC fix per PRD §1198. | PASS |
| F-PRD | T-PRD-1 | Parses live prd.md; collects all `### F-XXX` sections; asserts each has "Acceptance Criteria" string AND a `\| T-` row | Every feature section has AC table with ≥1 row | Whole-PRD scan; falsifiable by adding a feature without AC. | PASS |
| F-PRD | T-PRD-2 | Extracts all AC-row T-XXX codes; asserts no duplicates | Every T-XXX code in PRD is unique | Counts only AC table rows (not prose). | PASS |
| F-PRD | T-PRD-3 | After init-project, asserts prod-mgmt/risk-acceptances.md contains DISPOSITION, EXPIRY, RA_ID | risk-acceptances.md contains DISPOSITION, EXPIRY, RA_ID after init | Three-string check. | PASS |
| F-PRD | T-PRD-4 | If test-inventory.md exists, asserts all T-XXX in inventory exist in PRD | Test-inventory.md references only T-XXX codes appearing in current PRD | Early-return when inventory absent. Conditional. | PASS |
| F-DOC | T-UDOC-1 | Asserts docs-brief.md has "Feature Routing" AND ≥15 F-XXX entries | SKILL.md references docs-brief.md; workflow specifies reading docs-brief.md before updating any page; Feature Routing table format appears in SKILL.md | The test validates the live docs-brief.md artifact; it does NOT verify that SKILL.md references docs-brief.md or that the SKILL.md workflow specifies reading it before updating pages. The AC's subject is SKILL.md content. Coupling violation. | FAIL |
| F-DOC | T-UDOC-2 | Asserts toc.md links to a HARDCODED list of nine required pages | toc.md links to every page listed in Navigation Architecture of docs-brief.md; any page in Primary or Secondary nav without a TOC link is a FAIL | Required-page list is hardcoded in the test, not extracted from docs-brief.md at runtime. If docs-brief.md's Navigation Architecture adds or removes pages, the test would not detect drift between docs-brief.md and toc.md. The AC explicitly grounds the requirement in docs-brief.md, not in a snapshot. | FAIL |
| F-DOC | T-UDOC-3 | Asserts glossary.md has ≥1 `### ` term and contains "context", "task", "compaction", "hook" | glossary.md non-empty after /docs-markdown runs; every term in Core Concepts appears in glossary | Hardcoded core-terms list rather than extracted from PRD Core Concepts. If a new core term is introduced (e.g., "warm-up" mentioned in AC) and glossary misses it, the test would not detect drift. | ESCALATE |
| F-DOC | T-UDOC-4 | Asserts docs/index.html exists, contains "Context Curator", has ≥4 unique non-index page links, contains getting-started.html | After /docs-html runs, docs/index.html exists; content contains text of introduction.md and toc.md | "Contains the text of introduction.md and toc.md" is not directly verified — only product name presence. An impl that placed "Context Curator" only in a nav header but omitted introduction content would pass. | ESCALATE |
| F-DOC | T-UDOC-5 | For each docs/*.html, asserts `<nav` tag present, link to index.html present, string "glossary" appears anywhere | All HTML pages contain `<nav>` with home (index.html) and glossary links | "glossary" as a free-text string match is loose — it would match the page title "Glossary" even when no glossary <a> link existed. The AC says "links to at least the home page and glossary" — a link, not a string. | ESCALATE |
| F-DOC | T-UDOC-6 | For each HTML, extracts heading levels; asserts no level skips | No HTML page has h-level skipping previous heading | Direct sequence analysis. | PASS |
| F-DOC | T-UDOC-7 | Asserts docs/style.md exists with "color" and ("typeface" or "font") | When style.md is absent at invocation time, /docs-html writes the file with non-empty content; file contains "color" and "typeface"/"font" | Test only checks that style.md exists. The AC subject is bootstrap-when-absent behavior. style.md is already present in the repo; the bootstrap path is not exercised. | FAIL |
| F-DOC | T-UDOC-8 | For each docs/*.html, finds all <img> tags; asserts each has non-empty alt attribute | All <img> in generated HTML have non-empty alt | Direct per-image check. | PASS |
| F-PROCESS | T-PROC-1 | PRD-only project; asserts exit 0 AND JSON with currentPhase=1, nextPhase=2 | currentPhase=1 nextPhase=2 with only prd.md | Direct. | PASS |
| F-PROCESS | T-PROC-2 | test-inventory mtime older; prd mtime newer; asserts adversaryStale=true and warnings contains stale/adversary string | adversaryStale=true and warnings contains stale/adversary | Direct with mtime control. | PASS |
| F-PROCESS | T-PROC-3 | Inverse setup; asserts adversaryStale=false and no stale/adversary warning | adversaryStale=false; no adversary-stale warning | Direct. | PASS |
| F-PROCESS | T-PROC-4 | Empty project; asserts exit non-zero AND "PRD" in output | No prd.md → exit non-zero, "PRD" in output | Direct. | PASS |
| F-PROCESS | T-PROC-5 | test-plan + dev-plan + tests present, no inventory; asserts currentPhase=4, nextPhase=5 | Phase 4 / nextPhase 5 when no inventory | Direct. | PASS |
| F-PROCESS | T-PROC-6 | Two sub-cases: asserts JSON shape with completedPhases, currentPhase, nextPhase, adversaryStale, warnings | Output always valid JSON with required fields | Shape + type checks. | PASS |

---

## Section 2 — Verdict Code Definitions

| VERDICT | Meaning |
|---------|---------|
| PASS | Test would catch a motivated implementation error within the AC's intended scope |
| FAIL | Test would NOT catch a motivated implementation error; gap is material |
| ESCALATE | Adequacy cannot be confidently determined by automated review; requires human review |
| ACCEPTED | A documented risk acceptance applies (RA-NNN); finding suppressed for the duration |
| DEFERRED | Acknowledged finding, scheduled for later iteration (none in this run) |
| OUT_OF_SCOPE | Valid finding, but outside this feature's boundary (none in this run) |

---

## Section 3 — Acceptance Criteria Coverage Gaps

### F-INIT / F-INST

| Clause | Coverage | Note |
|--------|----------|------|
| T-INIT-1 | ADEQUATE | |
| T-INIT-2 | ADEQUATE | |
| T-INIT-3 | ADEQUATE | |
| T-INIT-4 | ADEQUATE | |
| T-INIT-5 | ADEQUATE | |
| T-INIT-6 | ADEQUATE | |
| T-INIT-7 | INADEQUATE | Test mirrors install.sh's source-tree copy, does not invoke `init-project --project-install` script path |
| T-INIT-8 | MISSING | `it.todo` placeholder |
| T-INIT-9 | MISSING | `it.todo` placeholder |
| T-INST-1 | INADEQUATE | `.some()` not `.length===1` — "exactly one" clause not enforced |
| T-INST-2 | INADEQUATE | Same as T-INST-1 |
| T-INST-3 | INADEQUATE | Same as T-INST-1 |
| T-INST-4 | ADEQUATE | |
| T-INST-5 | ADEQUATE | |
| T-INST-6 | INADEQUATE | Vacuous-pass path when commands/ directory does not exist |

### F-TASK-CREATE

| Clause | Coverage | Note |
|--------|----------|------|
| T-TASK-1 | ADEQUATE | |
| T-TASK-2 | ADEQUATE | |
| T-TASK-3 | ADEQUATE | |
| T-TASK-4 | ADEQUATE | |
| T-TASK-5 | INADEQUATE | "Without any intermediate prompt" clause not falsifiably tested |
| T-TASK-6 | INADEQUATE | Tests static SKILL.md doc string instead of actual command output |
| T-TASK-7 | INADEQUATE | Pre-invokes init-project manually; does not exercise auto-init via task-create alone |

### F-TASK-SWITCH

| Clause | Coverage | Note |
|--------|----------|------|
| T-SWITCH-1 | ADEQUATE | |
| T-SWITCH-2 | ADEQUATE | |
| T-SWITCH-3 | ADEQUATE | |
| T-SWITCH-4 | ADEQUATE | |
| T-SWITCH-5 | ADEQUATE | |
| T-SWITCH-6 | ADEQUATE | |

### F-TASK-DELETE

| Clause | Coverage | Note |
|--------|----------|------|
| T-TASK-DEL-1 | ADEQUATE | |
| T-TASK-DEL-2 | INADEQUATE | Does not verify other (non-default) tasks remain after a default-deletion attempt |
| T-TASK-DEL-3 | INADEQUATE | Does not verify other directories remain untouched after non-existent-task error |

### F-CTX-SAVE

| Clause | Coverage | Note |
|--------|----------|------|
| T-CTX-1 | ADEQUATE | |
| T-CTX-2 | ADEQUATE | |
| T-CTX-3 | ADEQUATE | |
| T-CTX-4 | ADEQUATE | |
| T-CTX-6 | ADEQUATE | |
| T-MEM-1 | ADEQUATE | (Conditional: AC text matches the implementation path the test asserts; if the AC is restored to the original spec path the test would need to follow) |

### F-CTX-LIST

| Clause | Coverage | Note |
|--------|----------|------|
| T-LIST-1 | ADEQUATE | |
| T-LIST-2 | ADEQUATE | |
| T-LIST-3 | ADEQUATE | |
| T-LIST-4 | ADEQUATE | |

### F-CTX-MANAGE

| Clause | Coverage | Note |
|--------|----------|------|
| T-CTX-7 | ADEQUATE | |
| T-MANAGE-1 | ADEQUATE | |
| T-MANAGE-2 | ADEQUATE | |
| T-MANAGE-3 | ADEQUATE | |
| T-MANAGE-4 | ADEQUATE | |
| T-MANAGE-5 | ADEQUATE | |
| T-MANAGE-6 | ADEQUATE | |

### F-CTX-PROMOTE

| Clause | Coverage | Note |
|--------|----------|------|
| T-CTX-5 | ADEQUATE | |
| T-PROM-1 | ADEQUATE | |
| T-PROM-2 | ADEQUATE | |
| T-PROM-3 | ADEQUATE | |

### F-CLMD

| Clause | Coverage | Note |
|--------|----------|------|
| T-CLMD-1 | ADEQUATE | |
| T-CLMD-2 | ADEQUATE | |
| T-RESUME-MANUAL | RISK_ACCEPTED | RA-002, expires v2.0-release |

### F-SEC

| Clause | Coverage | Note |
|--------|----------|------|
| T-SEC-2 | ADEQUATE | |
| T-SEC-3 | ADEQUATE | |
| T-SEC-4 | ADEQUATE | |
| T-SEC-5 | ADEQUATE | |
| T-SEC-6 | ADEQUATE | |
| T-SEC-7 | ADEQUATE | |
| T-SEC-8 | ADEQUATE | |
| T-SEC-9 | ADEQUATE | |
| T-SEC-10 | ADEQUATE | |

### F-SUMMARY

| Clause | Coverage | Note |
|--------|----------|------|
| T-SUM-1 | ADEQUATE | |
| T-SUM-2 | ADEQUATE | |
| T-SUM-3 | ADEQUATE | |

### F-GIT

| Clause | Coverage | Note |
|--------|----------|------|
| T-GIT-1 | ADEQUATE | |
| T-GIT-2 | ADEQUATE | |

### F-XPLAT

| Clause | Coverage | Note |
|--------|----------|------|
| T-ERR-3 | ADEQUATE | (Sample-based — three operations cover the AC's "all operations" claim in practice) |

### F-ERR

| Clause | Coverage | Note |
|--------|----------|------|
| T-ERR-1 | ADEQUATE | |
| T-ERR-2 | ADEQUATE | |
| Permission-denied behavior | RISK_ACCEPTED | RA-001, expires 2026-09-12 |

### F-DOC-SKILLS

| Clause | Coverage | Note |
|--------|----------|------|
| T-DOC-1 | INADEQUATE | Tests live PRD structure, not `/prd new-feature` scaffolding output |
| T-DOC-2 | INADEQUATE | Static spec check only; runtime auto-invocation is `it.todo` |
| T-DOC-3 | INADEQUATE | Tests live test-plan.md, not `/test-plan new` scaffolding |
| T-DOC-4 | INADEQUATE | Tests live dev-plan.md, not `/dev-plan new` scaffolding |
| T-DOC-5 | INADEQUATE | Tests live PRD content; does NOT invoke `/prd check-ac` |
| T-DOC-6 | INADEQUATE | Static spec check only; runtime adversary-task guard is `it.todo` |

### F-MARKETPLACE

| Clause | Coverage | Note |
|--------|----------|------|
| T-MKT-1 | INADEQUATE (low confidence) | Tests template content, not produced file — ESCALATE |
| T-MKT-2 | INADEQUATE (low confidence) | Tests source bundle and manifest text, not installation/availability — ESCALATE |
| T-MKT-3 | ADEQUATE | |
| T-MKT-4 | INADEQUATE | Runtime `/plugin marketplace list` claim is `it.todo` |

### F-HOOK / F-HOOK-POST

| Clause | Coverage | Note |
|--------|----------|------|
| T-HOOK-1 | ADEQUATE | |
| T-HOOK-POST-1 | ADEQUATE | |
| T-HOOK-POST-2 | ADEQUATE | |
| T-HOOK-POST-3 | ADEQUATE | |

### F-CTX-MONITOR-STATUS

| Clause | Coverage | Note |
|--------|----------|------|
| T-MON-1 | INADEQUATE (low confidence) | Negative network-import list non-exhaustive — ESCALATE |
| T-MON-2 | ADEQUATE | |
| T-MON-3 | ADEQUATE | |
| T-MON-4 | ADEQUATE | |
| T-MON-14 | ADEQUATE | |
| T-MON-15 | ADEQUATE | |

### F-CTX-MONITOR-WARN

| Clause | Coverage | Note |
|--------|----------|------|
| T-MON-5 | ADEQUATE | |
| T-MON-6 | ADEQUATE | |
| T-MON-7 | ADEQUATE | |
| T-MON-8 | ADEQUATE | |
| T-MON-9 | ADEQUATE | |

### F-CTX-MONITOR-COST

| Clause | Coverage | Note |
|--------|----------|------|
| T-MON-10 | INADEQUATE (low confidence) | Test exercises char-count fallback; AC and T-MON-16 specify API path — ESCALATE |
| T-MON-11 | ADEQUATE | |
| T-MON-12 | INADEQUATE (low confidence) | Same char/API ambiguity as T-MON-10 — ESCALATE |
| T-MON-13 | ADEQUATE | |
| T-MON-16 | ADEQUATE | |
| T-MON-17 | ADEQUATE | |
| T-MON-18 | ADEQUATE | |

### F-SPEC

| Clause | Coverage | Note |
|--------|----------|------|
| T-SPEC-1 | ADEQUATE | |
| T-SPEC-2 | ADEQUATE | |
| T-SPEC-3 | ADEQUATE | |
| T-SPEC-4 | ADEQUATE | |
| T-SPEC-5 | ADEQUATE | |

### F-ADVERSARY

| Clause | Coverage | Note |
|--------|----------|------|
| T-ADV-1 | INADEQUATE | Test replicates install.sh step 5 in temp HOME; install.sh itself never runs. A regression in install.sh's copy step would not be caught. |
| T-ADV-2 | ADEQUATE | |
| T-ADV-3 | ADEQUATE | |
| T-ADV-4 | ADEQUATE | |

### F-PRD

| Clause | Coverage | Note |
|--------|----------|------|
| T-PRD-1 | ADEQUATE | |
| T-PRD-2 | ADEQUATE | |
| T-PRD-3 | ADEQUATE | |
| T-PRD-4 | ADEQUATE | |

### F-DOC (User Documentation System)

| Clause | Coverage | Note |
|--------|----------|------|
| T-UDOC-1 | INADEQUATE | Tests docs-brief.md content, not that SKILL.md references and reads it |
| T-UDOC-2 | INADEQUATE | Required pages hardcoded in test; drift between docs-brief.md and toc.md not detected |
| T-UDOC-3 | INADEQUATE (low confidence) | Core-terms hardcoded; drift from PRD Core Concepts not detected — ESCALATE |
| T-UDOC-4 | INADEQUATE (low confidence) | "Text of introduction.md and toc.md" not compared; presence of product name is necessary but not sufficient — ESCALATE |
| T-UDOC-5 | INADEQUATE (low confidence) | "glossary" free-text substring match does not prove a link exists — ESCALATE |
| T-UDOC-6 | ADEQUATE | |
| T-UDOC-7 | INADEQUATE | Tests existence of style.md, not the bootstrap-when-absent behavior named in the AC |
| T-UDOC-8 | ADEQUATE | |

### F-PROCESS

| Clause | Coverage | Note |
|--------|----------|------|
| T-PROC-1 | ADEQUATE | |
| T-PROC-2 | ADEQUATE | |
| T-PROC-3 | ADEQUATE | |
| T-PROC-4 | ADEQUATE | |
| T-PROC-5 | ADEQUATE | |
| T-PROC-6 | ADEQUATE | |

---

ESCALATE
