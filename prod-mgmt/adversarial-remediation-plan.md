# Adversarial Review Remediation Plan

**Version:** 1.0  
**Date:** 2026-03-09  
**Scope:** PRD, DoD, and Test Plan changes in response to adversarial review findings

---

## Overview

The second adversarial review identified three systemic anti-patterns affecting the entire test suite, ten DoD clauses with zero test coverage, and one architecturally untestable requirement. This plan defines the changes needed to the PRD, DoD, and test plan to address these findings.

---

## Part 1: PRD Changes

### 1.1 Add a Test Contract Section

Add a section to the PRD titled "Test Contract" that establishes binding rules for all tests in this project. The rules are:

**Rule T1 — No Vacuous OR Fallbacks**  
Assertions must not contain trailing OR clauses broad enough to always fire. Specifically banned patterns:
- `|| output.includes('context')`
- `|| result.exitCode === 0`
- `|| /\d+/.test(output)`
- `|| typeof x === 'number'`

Every assertion must be able to fail on a conforming implementation that has a bug.

**Rule T2 — No Conditional Assertions on File Existence**  
The pattern `if (await fileExists(path)) { expect(...) }` is banned. If a file must exist, assert it exists unconditionally first with `expect(await fileExists(path)).toBe(true)`. Then assert its contents.

**Rule T3 — No Self-Fulfilling Setup**  
Test setup must not create the artifacts that the test then checks. If a test verifies that a script creates a backup, the backup must not be created in `beforeEach`.

**Rule T4 — No Tautological Type Assertions**  
`typeof x === 'number'` when x is always a number is banned. Assert specific values or ranges.

**Rule T5 — Exit Codes Must Be Specific**  
For error scenarios, assert `exitCode !== 0` or `exitCode === 1`. For success scenarios, assert `exitCode === 0`. Never skip the assertion.

**Rule T6 — String Assertions Must Be Specific**  
When asserting output contains a specific value (e.g., a count, a path, a formatted string), the pattern to match must be specific enough that it cannot fire on unrelated content. For example, to verify a message count of 47 is displayed: `/\b47\b/.test(output)` not `/\d+/.test(output)`.

### 1.2 Clarify `/resume` Architectural Boundary

Add the following to the PRD's "Implementation Notes" section:

> **Test Boundary: `/resume` Behavior**
>
> The claim that `/resume` re-reads CLAUDE.md from disk is architecturally untestable in the automated integration test suite because it requires a running Claude Code instance. This claim must instead be validated by:
>
> 1. **Manual smoke test** (run once per Claude Code version update): Open Claude Code, switch tasks via `/task`, run `/resume <session-id>`, verify the task's CLAUDE.md instructions appear in the system context. Document the Claude Code version tested.
>
> 2. **Structural proxy test** (automated, runs in CI): Verify that `.claude/CLAUDE.md` is updated with the correct `@import` path before `/resume` would be called. This tests our part of the contract; Claude Code's part is covered by the manual test.
>
> Remove "8.5 – /resume loads task instructions" from the automated test suite and replace it with a manual test checklist entry.

### 1.3 Scope the 100KB Size Cap Requirement

Clarify in the PRD that the 100KB cap must be tested against the golden save path explicitly:

> The 100KB size cap applies when: (a) `/context-save --golden` is called with an oversized session, and (b) `/context-promote` is called with an oversized personal context. Both paths must independently enforce and test the limit.

---

## Part 2: DoD Changes

Replace the current "MVP Complete When" checklist in the PRD with an explicit Definition of Done table. Each row must have: the feature, the binary acceptance criterion, and the test ID that validates it.

The new DoD table:

| Feature | Acceptance Criterion | Test ID |
|---------|---------------------|---------|
| Project initialization | Running `init-project` creates `.claude/CLAUDE.md` containing an `@import` line pointing to the default task path, with the file not existing before the script runs | T-INIT-1 |
| CLAUDE.md backup | `init-project` copies root `CLAUDE.md` content byte-for-byte to the stash path; the stash file must not exist before the script runs | T-INIT-2 |
| Default task copy | The `.claude/tasks/default/CLAUDE.md` content equals the root `CLAUDE.md` content character-for-character | T-INIT-3 |
| Idempotent init | Running `init-project` twice produces identical file contents on both runs and exits 0 both times | T-INIT-4 |
| Multi-project isolation | Two projects initialized in different directories produce different project IDs; personal storage dirs for each are distinct and non-overlapping | T-INIT-5 |
| Task creation | `task-create` produces a CLAUDE.md containing all required sections (# Task:, ## Focus, ## Key Areas, ## Guidelines) with the user description in the Focus section | T-TASK-1 |
| Task name validation | `task-create` with an uppercase name exits non-zero and does not create any files (normalization is not acceptable as rejection) | T-TASK-2 |
| Multi-line description | `task-create` with a multi-line description preserves all lines in the Focus section | T-TASK-3 |
| Empty description handling | `task-create` with no description exits non-zero and produces no task directory | T-TASK-4 |
| Personal context save | `save-context --personal` creates a file at exactly `~/.claude/projects/<project-id>/tasks/<task-id>/contexts/<name>.jsonl` | T-CTX-1 |
| Valid JSONL output | The saved context file parses as valid JSONL (every line is valid JSON); asserted unconditionally, not conditionally on file existence | T-CTX-2 |
| Secret scan on all saves | `scan-secrets` returns a non-zero exit code and specific secret type in stdout when scanning a file containing `AKIAIOSFODNN7EXAMPLE` followed by realistic chars | T-SEC-1 |
| Secret scan blocks golden | `save-context --golden` on a session containing a real AWS key exits non-zero or produces confirmation prompt output; exit 0 with no prompt is a test failure | T-CTX-3 |
| 100KB golden cap (save) | `save-context --golden` on a 150KB session exits non-zero with output containing "100KB" or "too large" | T-CTX-4 |
| 100KB golden cap (promote) | `promote-context` on a 150KB personal context exits non-zero with output containing "100KB" or "too large" | T-CTX-5 |
| Overwrite protection | `save-context` called twice with the same name creates a `.backup-` file on the second call; the backup contains the original content | T-CTX-6 |
| Context list personal/golden sections | `context-list` output contains the string "Personal" before the string "Golden" (index comparison, not substring contains) AND contains the specific context names set up in the test | T-LIST-1 |
| Message count display | `context-list` output contains the exact message count of the test context as `\b<N>\b` (word-boundary match, not `\d+`) | T-LIST-2 |
| No-contexts fresh start | When no contexts exist for a task, `context-list` output contains "fresh" or "empty" or "no contexts"; and context-manage offers to start fresh | T-LIST-3 |
| Golden deletion warning | `delete-context` on a golden context exits non-zero unless an explicit confirmation flag is passed; the golden file must still exist after a non-confirmed deletion attempt | T-CTX-7 |
| Promote copies not moves | After `promote-context`, both the personal original AND the golden copy exist; the personal file is byte-for-byte identical to the golden file | T-PROM-1 |
| Secret detection for promotion | `promote-context` on a context containing `ghp_` followed by 36 alphanumeric chars exits non-zero or prompts; the word "secret" or the specific pattern type appears in output | T-PROM-2 |
| Already-golden warns | `promote-context` when a golden context with the same name already exists exits non-zero or warns; the setup must create a personal context only — not a golden one | T-PROM-3 |
| Root CLAUDE.md unchanged | After any task operation, the root `CLAUDE.md` SHA256 hash equals its pre-operation hash | T-CLMD-1 |
| @import replaces not appends | After two task switches, `.claude/CLAUDE.md` contains exactly one `@import` line | T-CLMD-2 |
| .claude/CLAUDE.md git-ignored | After init, `git check-ignore .claude/CLAUDE.md` exits 0 in a real git repo | T-GIT-1 |
| Personal storage never committed | In a real git repo after a full workflow, `git status --porcelain` does not list any path under `~/.claude/` | T-GIT-2 |
| AWS key detection | `scan-secrets` on a file containing a real-format AWS access key (`AKIA` + 16 uppercase alphanumeric chars) exits non-zero and output contains "AWS" or "AKIA" | T-SEC-2 |
| Stripe key detection | `scan-secrets` detects both `sk_test_` and `sk_live_` format keys; output names the specific key type found | T-SEC-3 |
| All message types scanned | A context with one secret in user message, one in assistant message, and one in a tool_result is scanned; all three must be reported | T-SEC-4 |
| False positive: AKIAIOSFODNN7EXAMPLE | This exact string is Amazon's documented example key. Document whether the scanner treats it as a positive or negative, and test that behavior consistently | T-SEC-5 |
| Redaction produces valid JSONL | After `redact-secrets`, every line of the output parses as valid JSON; and a second `scan-secrets` run on the output returns "clean" | T-SEC-6 |
| Multiple secrets count | `scan-secrets` on a context with exactly 4 secrets reports a count matching `\b4\b` in the output | T-SEC-7 |
| Missing .claude/ graceful error | Running any script without init exits non-zero and output contains "initialized" or "init" (not a stack trace) | T-ERR-1 |
| Corrupt JSONL handled | `save-context` or `scan-secrets` on a malformed JSONL file exits non-zero (not 0); `typeof exitCode === 'number'` is not an assertion | T-ERR-2 |
| Paths with spaces | All operations work when the project path contains a space; verified by exitCode === 0 and output file existence check | T-ERR-3 |
| /resume smoke test | MANUAL TEST: After `/task <id>` + `/resume <session>`, verify task CLAUDE.md content appears in system context. Run once per Claude Code version update. Document version tested. | T-RESUME-MANUAL |
| AI-generated summaries | `context-list` output for a context with known content contains a non-empty string after the context name that is not just metadata | T-LIST-4 |
| PreCompact hook saves context | After `auto-save-context` is called with a mock stdin payload containing a session_id, a file exists at the expected timestamped path and parses as valid JSONL | T-HOOK-1 |
| MEMORY.md updated after save | After `save-context`, the MEMORY.md at the personal memory path contains the task-id and context-name that were saved | T-MEM-1 |

---

## Part 3: Test Plan Changes

### 3.1 Banned Patterns (add to test plan as a mandatory pre-commit check)

Add a section "Test Quality Rules" to the test plan:

> **These patterns are banned and will cause test review rejection:**
>
> 1. `|| output.includes('context')` or any OR fallback where the right side matches general output
> 2. `if (fileExists(path)) { expect(...) }` — replace with unconditional `expect(await fileExists(path)).toBe(true)` first
> 3. `typeof x === 'number'` as an assertion
> 4. `expect(true).toBe(true)` placeholder
> 5. `|| result.exitCode === 0` in error path tests
> 6. Broad regex like `/\d+/.test(output)` when a specific value is known
> 7. Setup that creates the file the test then checks for

### 3.2 Fix Priority Order

Group fixes by effort and impact:

**Tier 1 — Fix immediately (tautologies and self-fulfilling tests, <1 hour each):**
- T-11.5: Replace `expect(true).toBe(true)` with real git status check
- T-13.3, T-13.5, T-12.4: Replace `typeof exitCode === 'number'` with specific exit code assertion
- T-1.2 backup: Remove backup creation from setup; let script create it
- T-8.1: Fix inverted boolean logic

**Tier 2 — Strengthen assertions (remove OR fallbacks, 1-2 hours each):**
- T-9.1, T-9.2: Replace OR chains with `output.includes('AWS')` / `output.includes('Stripe')` exactly
- T-5.1: Replace `/\d+/.test(output)` with `new RegExp(`\\b${expectedCount}\\b`).test(output)`
- T-5.4: Replace `|| output.includes('context')` with specific section header check
- T-3.1, T-3.3: Replace OR with specific context name in output; use indexOf for ordering
- T-4.2: Remove `|| result.exitCode === 0` from secret scan assertion
- T-2.1, T-2.2, T-2.3, T-2.4: Remove double-conditionals
- T-13.1: Replace `|| output.includes('run')` with `output.includes('initialized')`

**Tier 3 — Replace conditional file existence guards:**
- T-1.2 @import check, T-4.1, T-4.1 JSONL: Add unconditional `expect(await fileExists(path)).toBe(true)` before content checks

**Tier 4 — Add missing tests (new test files needed):**
- T-CTX-4, T-CTX-5: 100KB cap tests
- T-CTX-6: Overwrite protection
- T-LIST-3, T-LIST-4: No-contexts + AI summary
- T-CTX-7: Golden deletion protection
- T-SEC-4: All message types scanned
- T-SEC-5: False positive policy (AKIAIOSFODNN7EXAMPLE)
- T-SEC-6: Redaction + rescan
- T-SEC-7: Exact count assertion
- T-HOOK-1: PreCompact hook
- T-MEM-1: MEMORY.md update
- T-RESUME-MANUAL: Manual smoke test checklist

**Tier 5 — Architectural fix (git integration tests):**
- T-GIT-1: Use real git repo in test (git init in temp dir)
- T-GIT-2: Simulate git pull by copying files into repo and running `git pull` on a bare remote

### 3.3 `/resume` Test Strategy

Remove test 8.5 from the automated suite entirely. Add to the test plan:

> **Manual Test Checklist: /resume Smoke Test (T-RESUME-MANUAL)**
>
> Run this test manually when: (a) Claude Code updates, (b) a new version of context-curator is released.
>
> Steps:
> 1. In a test project, run `/task test-smoke-task`
> 2. Note the session ID returned
> 3. Run `/resume <session-id>`
> 4. Type: "What are your current task instructions?"
> 5. PASS if Claude's response references content from `.claude/tasks/test-smoke-task/CLAUDE.md`
> 6. FAIL if Claude gives generic response without task-specific content
>
> Record: Claude Code version, date tested, pass/fail.

### 3.4 False Positive Policy for AKIAIOSFODNN7EXAMPLE

Add an explicit policy decision to the test plan:

> **Policy: AKIAIOSFODNN7EXAMPLE**
>
> Amazon's documentation uses `AKIAIOSFODNN7EXAMPLE` as an example key. Our scanner currently DOES match this pattern (it matches `AKIA[A-Z0-9]{16}`). This is intentional: we prefer false positives over false negatives for secrets. Test 9.6 must be updated to reflect this: `shouldDetect: true` for this fixture, and the fixture must be moved from the false-positives set to the true-positives set.

---

## Appendix: Issue → Fix Cross-Reference

| Adversarial Finding | Root Cause | Fix Location | Priority |
|--------------------|-----------|-------------|----------|
| 1.1 stub passes existence check | No content verification | T-INIT-1: add content assertion | Tier 2 |
| 1.2 backup self-created | Setup writes what test checks | T-INIT-2: remove from setup | Tier 1 |
| 1.2 length > 0 | No equality check | T-INIT-3: byte-for-byte comparison | Tier 2 |
| 1.2 conditional @import | if(fileExists) guard | T-INIT-1: unconditional exists then content | Tier 3 |
| 1.3 idempotent OR crash | OR accepts error message | T-INIT-4: check exitCode=0 AND contents equal | Tier 2 |
| 1.5 path math only | No runtime isolation | T-INIT-5: write file in project A, verify absent in project B | Tier 4 |
| 2.1 one keyword | No structure check | T-TASK-1: verify all required sections | Tier 2 |
| 2.1 @import substring | Not format-verified | T-CLMD-2: regex for exact format | Tier 2 |
| 2.2 OR accepts normalize | Rejection ≠ normalization | T-TASK-2: assert no files created + non-zero exit | Tier 2 |
| 2.3–2.4 double-conditional | Conditional assertions | T-TASK-3,4: unconditional | Tier 2 |
| 3.1 any output passes | OR escape hatch | T-LIST-1: specific context name | Tier 2 |
| 3.3 string index not list order | Wrong ordering check | T-LIST-1: indexOf personal < indexOf golden | Tier 2 |
| 3.4 fresh start not checked | Behavior not verified | T-LIST-3: new test | Tier 4 |
| 4.1 exitCode only | No path check | T-CTX-1: verify exact file path | Tier 2 |
| 4.1 conditional JSONL | Conditional assertion | T-CTX-2: unconditional | Tier 3 |
| 4.2 OR destroys assertion | OR exitCode=0 | T-CTX-3: remove OR | Tier 2 |
| 4.5 wrong path + no size test | Tests personal, not golden | T-CTX-4: golden save with 150KB file | Tier 4 |
| 5.1 any digit | Vacuous regex | T-LIST-2: exact count with word boundary | Tier 2 |
| 5.4 OR escape hatch | Broad OR | T-LIST-1: remove OR | Tier 2 |
| 6.6 display not deletion | No deletion attempt | T-CTX-7: attempt delete, verify file remains | Tier 4 |
| 7.2 'found' too broad | Matches any found message | T-PROM-2: match specific secret type name | Tier 2 |
| 7.3 interactive untested | No interaction test | T-PROM-2: mock stdin confirm | Tier 4 |
| 7.5 wrong setup | Creates golden not personal | T-PROM-3: fix setup | Tier 1 |
| 8.1 inverted boolean | Logic error | T-CLMD-1: fix assertion | Tier 1 |
| 8.2 append passes | Substring not structure | T-CLMD-2: count @import lines = 1 | Tier 2 |
| 8.3 gitignore unclear | Harness uncertainty | T-GIT-1: real git repo | Tier 5 |
| 8.5 untestable | Architectural | T-RESUME-MANUAL: manual checklist | PRD change |
| 9.1 'secret' in startup | Background noise | T-SEC-2: match 'AWS' or 'AKIA' exactly | Tier 2 |
| 9.2 word 'key' anywhere | Broad match | T-SEC-3: match specific prefix | Tier 2 |
| 9.6 fixture misclassified | FP set with shouldDetect:true | T-SEC-5: move to TP set + document policy | Tier 1 |
| 9.7 timestamp digit matches | Regex matches timestamps | T-SEC-7: exact count with \b | Tier 2 |
| 9.8 1-of-3 passes | Insufficient count check | T-SEC-4: assert all 3 reported | Tier 4 |
| 9.9 no rescan | Incomplete redaction test | T-SEC-6: rescan after redact | Tier 4 |
| 11.4 /tmp outside repo | Not a real git scenario | T-GIT-2: real repo with tracking | Tier 5 |
| 11.5 placeholder | expect(true).toBe(true) | T-GIT-2: real git status check | Tier 1 |
| 11.6 no pull simulated | Files placed directly | T-GIT-2: bare remote + pull simulation | Tier 5 |
| 13.1 stack trace matches | OR too broad | T-ERR-1: assert specific message | Tier 2 |
| 13.2 pre-op deletion | Atomicity not tested | T-ERR-2: mid-op deletion (future) | Tier 4 |
| 13.3, 13.5, 12.4 typeof | Tautology | T-ERR-2, T-ERR-3: specific exitCode | Tier 1 |
| AI summaries (zero coverage) | No test exists | T-LIST-4: new test | Tier 4 |
| 100KB cap (zero coverage) | No test exists | T-CTX-4, T-CTX-5: new tests | Tier 4 |
| Overwrite protection (zero coverage) | No test exists | T-CTX-6: new test | Tier 4 |
| context-manage ops (zero coverage) | No test exists | Future: interactive mock | Tier 4 |
| Memory update (zero coverage) | No test exists | T-MEM-1: new test | Tier 4 |
| PreCompact hook (zero coverage) | No test exists | T-HOOK-1: new test | Tier 4 |

---

*End of remediation plan.*
