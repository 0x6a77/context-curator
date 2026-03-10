# Test Inventory — Adversarial Analysis

---

## Section 1 — Test Inventory

| TEST_ID | DESCRIPTION | AC_CLAUSE | VERDICT | ATTACK_VECTOR |
|---------|-------------|------------|---------|---------------|
| initialization.test.ts:T1.1-a | Runs init-project on empty dir, asserts .claude/CLAUDE.md exists and contains @import pointing to tasks/default/CLAUDE.md, and that the imported path exists on disk. | T-INIT-1: init-project creates .claude/CLAUDE.md with @import | PASS | No exploitable gap found. |
| initialization.test.ts:T1.1-b | Asserts .gitignore in .claude/ contains exactly `^CLAUDE\.md$` on its own line. | T-INIT-1 (gitignore aspect) | PASS | No exploitable gap found. |
| initialization.test.ts:T1.2-backup | Pre-asserts backup does not exist, runs init-project, asserts backup exists with byte-identical content. | T-INIT-2: backup is byte-for-byte copy, must not exist before run | PASS | No exploitable gap found. |
| initialization.test.ts:T1.2-defaultcopy | Pre-asserts default task CLAUDE.md does not exist, runs init-project, asserts content equals originalContent via string equality. | T-INIT-3: default/CLAUDE.md equals root CLAUDE.md character-for-character | PASS | No exploitable gap found. |
| initialization.test.ts:T1.3-idempotent-a | Runs init-project twice, captures content after first run, asserts exit 0 both times, asserts content identical after second run. | T-INIT-4: exits 0 both times, identical file contents | PASS | No exploitable gap found. |
| initialization.test.ts:T1.5-isolation | Constructs personalPath1 and personalPath2 from test-computed sanitized project paths, asserts they are different strings, writes marker.txt directly to personalPath1, asserts it does not appear at personalPath2. | T-INIT-5: writing to project A's personal dir does not make it visible in project B's | FAIL | Test writes the marker directly to a test-computed path, never through the implementation. An implementation that ignores project scoping entirely and uses a shared flat personal dir would still pass, provided the marker written by the test is not stored at exactly the personalPath2 address (which is guaranteed by path arithmetic, not by implementation behavior). The isolation property of the implementation is never exercised. |
| task-operations.test.ts:T2.1-structure | Runs task-create, asserts exit 0, task directory, CLAUDE.md, contexts/ exist. | T-TASK-1: CLAUDE.md with all required sections | PASS | No exploitable gap found. |
| task-operations.test.ts:T2.1-sections | Runs task-create with description "Refactoring OAuth implementation in src/auth/", asserts all four required markdown sections exist, asserts the word "oauth" appears under the ## Focus section specifically. | T-TASK-1: all required sections present | PASS | No exploitable gap found. |
| task-operations.test.ts:T2.2-uppercase | Asserts non-zero exit and no directory created for uppercase task name. | T-TASK-2: exits non-zero AND creates no task directory | PASS | No exploitable gap found. |
| task-operations.test.ts:T2.3-multiline | Passes multi-line description, checks keywords "oauth", "session", "token" appear under ## Focus section. | T-TASK-3: multi-line description preserves all lines in Focus section | FAIL | The AC clause requires all lines to be preserved. The test only checks for three keyword substrings. An implementation that generates a single-sentence AI summary containing those keywords would satisfy this test while violating the AC (which requires verbatim multi-line preservation). |
| task-operations.test.ts:T2.4-empty | Runs task-create with empty description, asserts non-zero exit and no directory created. | T-TASK-4: exits non-zero, creates no task directory | PASS | No exploitable gap found. |
| context-operations.test.ts:T4.1-path | Runs save-context --personal, asserts file exists at exact constructed path. | T-CTX-1: file created at exactly <personalDir>/tasks/<task-id>/contexts/<name>.jsonl | PASS | No exploitable gap found. |
| context-operations.test.ts:T4.1-jsonl | Asserts exit 0, file exists, isValidJsonl returns true, non-empty content (length > 0 after trim). | T-CTX-2: valid JSONL, asserted unconditionally, not inside if-guard | PASS | No exploitable gap found. |
| context-operations.test.ts:T4.2-blocksecret | Uses AWS_KEY_CONTEXT, asserts exit != 0 and output matches /aws|akia/. | T-CTX-3: secret scan blocks golden save; exit 0 with no prompt is failure | PASS | No exploitable gap found. |
| context-operations.test.ts:T4.5-size | Pre-checks file size with statSync (asserts > 100KB), then asserts exit != 0 and output matches /100KB|too large/i. | T-CTX-4: exits non-zero with "100KB" or "too large" on 150KB session | PASS | No exploitable gap found. |
| new-features.test.ts:T-CTX-5 | Creates personal context of 150 × 1KB messages (no statSync check), asserts exit != 0 and output includes "100kb" or "too large". | T-CTX-5: promote-context exits non-zero on 150KB personal context | PASS | The file size is deterministic (150 × ~1KB overhead >> 100KB). An implementation that always exits non-zero for any reason other than the size cap would be caught by the specific text requirement ("100kb" or "too large"). No exploitable gap found. |
| context-operations.test.ts:T-CTX-5 | Same as above but in context-operations.test.ts scope — lacks statSync check but same arithmetic. | T-CTX-5 | PASS | Same reasoning as above. |
| new-features.test.ts:T-CTX-6 | Saves twice with same name, captures original content after first save, asserts a file matching `.backup-` exists, asserts its content equals the original. | T-CTX-6: .backup- file created with original content | PASS | No exploitable gap found. |
| context-operations.test.ts:T-CTX-6 | Duplicate of above in different file. | T-CTX-6 | PASS | No exploitable gap found. |
| context-operations.test.ts:T5.1-ordering | Creates two personal contexts, checks both names appear in output; checks personal before golden only if both are present (conditional branch never entered in this test since no golden is created). | T-LIST-1: indexOf("Personal") < indexOf("Golden") AND specific names appear | PASS | The ordering assertion is vacuous in Test 5.1 (the if-guard is never entered), but Test 5.4 covers it unconditionally. Coverage of the ordering clause is adequate via 5.4. |
| context-operations.test.ts:T5.1-counts | Creates SMALL_CONTEXT (5 messages) and createMediumContext() (30 messages), asserts output matches `\b5\b` and `\b30\b`. | T-LIST-2: exact message count with word boundaries | PASS | Fixture counts are verified: SMALL_CONTEXT has 5 entries, createMediumContext returns 30. No exploitable gap found. |
| context-operations.test.ts:T5.3-nocontexts | Creates task with no contexts, asserts output matches `/no contexts|empty|fresh/i`. | T-LIST-3: output contains "fresh", "empty", or "no contexts" | PASS | No exploitable gap found. |
| context-operations.test.ts:T5.6-summary | Finds the line containing context name, asserts afterName has alphabetic chars matching `[a-zA-Z]{3,}`. | T-LIST-4: non-empty description string after context name, not just metadata | FAIL | Any fixed string label (e.g., "messages", "personal", "N/A") that appears after the context name on the same output line satisfies this assertion. The test cannot distinguish a real AI-generated summary from a hardcoded format string. An implementation that prints "ctx: N/A" for every context passes unconditionally. |
| context-operations.test.ts:T6.6-deletion | Pre-asserts golden file exists, runs delete-context without --confirm, asserts non-zero exit and file still exists. | T-CTX-7: exits non-zero without --confirm, file still exists after failed attempt | PASS | No exploitable gap found. |
| context-operations.test.ts:T7.1-copies | Promotes clean context, asserts exit 0, golden exists, personal exists, readFile(golden) === readFile(personal). | T-PROM-1: both files exist, byte-for-byte identical | PASS | No exploitable gap found. |
| context-operations.test.ts:T7.2-secrettype | Uses GITHUB_TOKEN_CONTEXT (ghp_ + 36 alphanumeric chars), promotes, asserts exit != 0 and output matches /github|ghp_/i. | T-PROM-2: output names specific GitHub token secret type | PASS | No exploitable gap found. |
| context-operations.test.ts:T7.5-alreadygolden | beforeEach creates both personal and golden directly, promotes, asserts exit != 0 and output matches /already.*golden|already exists/i. | T-PROM-3: exits non-zero or warns when golden already exists | PASS | No exploitable gap found. |
| claude-md-system.test.ts:T8.1-unchanged | Reads root CLAUDE.md after init, task-create, and multiple task-switches, asserts content equals originalContent throughout. | T-CLMD-1: root CLAUDE.md content unchanged after any task operation | PASS | No exploitable gap found. |
| claude-md-system.test.ts:T8.2-oneimport | Creates two tasks, switches twice, splits content by '\n' and filters for @import lines, asserts count is exactly 1 and that line contains 'task-2' not 'task-1'. | T-CLMD-2: exactly one @import line after two switches | PASS | No exploitable gap found. |
| git-integration.test.ts:T11.7-gitignored | Commits .gitignore, then asserts isGitIgnored(.claude/CLAUDE.md) is true. | T-GIT-1: git check-ignore exits 0 in real git repo after init | PASS | No exploitable gap found. |
| git-integration.test.ts:T11.4-personal | Asserts personalBase is outside projectDir, creates personal context via save-context, stages `.` in projectDir, asserts no personal filenames appear in git status lines. | T-GIT-2: git status --porcelain does not list personal storage paths | PASS | The structural assertion (personalBase outside projectDir) makes git staging deterministic. No exploitable gap found. |
| secret-detection.test.ts:T9.1-aws | Uses AWS_KEY_CONTEXT containing AKIAIOSFODNN7EXAMPLE, asserts exit != 0 and output matches /akia/i. | T-SEC-2: exits non-zero, output contains "AWS" or "AKIA" | PASS | No exploitable gap found. |
| secret-detection.test.ts:T9.2-stripe | Uses STRIPE_KEY_CONTEXT containing both sk_test_4eC39HqLyjWDarjtT1zdp7dc and sk_live_abc123def456ghi789jkl012, asserts exit != 0 and output contains both literal strings 'sk_test_' and 'sk_live_'. | T-SEC-3: detects both sk_test_ and sk_live_, output names specific key type | PASS | No exploitable gap found. |
| secret-detection.test.ts:T9.8-alltypes | Creates context with user=AWS AKIA..., assistant=sk_test_, tool_result=ghp_...; asserts each pattern (/akia\|aws/, /sk_test\|stripe/, /ghp_\|github/) appears in combined output. | T-SEC-4: secrets in all three message types are reported | ESCALATE | (1) The user message contains `AKIAIOSFODNN7EXAMPLE123` — 19 chars after AKIA, including lowercase; an implementation using the canonical pattern AKIA+16 uppercase alphanum would not detect it. If the AWS check passes vacuously (e.g., "aws" appears in a preamble), the user-message detection is never actually validated. (2) The pattern checks do not verify WHICH message type each secret was sourced from; an implementation that scans only user+assistant messages but outputs "github" in a footer would pass the tool_result check vacuously. Human review required to determine whether the test actually confirms all three message types are scanned or only that three output patterns appear. |
| secret-detection.test.ts:T9.6-falsepositive | Isolates AKIAIOSFODNN7EXAMPLE in a single fixture message, asserts exit != 0 and output matches /akia/i. | T-SEC-5: AKIAIOSFODNN7EXAMPLE treated as true positive | PASS | No exploitable gap found. |
| secret-detection.test.ts:T9.9-redaction | Redacts AWS key context, asserts exit 0, file exists, isValidJsonl, rescan exits 0 and output matches /clean/i. | T-SEC-6: every line parses as JSON; second scan returns "clean" | PASS | No exploitable gap found. |
| secret-detection.test.ts:T9.7-count | Uses MULTIPLE_SECRETS_CONTEXT (5 secrets in one message), attempts structured count regex, falls back to `expect(output).toMatch(/\b5\b/)`. | T-SEC-7: scan-secrets reports count matching \b5\b | FAIL | (1) The fallback `\b5\b` matches any word-boundary-delimited "5" in the output, including timestamps (e.g., "10:05:00" produces \b5\b at the colon boundary), line numbers, or unrelated integers. An implementation that outputs no count at all but happens to include a "5" elsewhere passes. (2) MULTIPLE_SECRETS_CONTEXT contains `sk_live_abc123def456` (only 12 chars after prefix; strict Stripe pattern requires 24+). If the scanner applies the strict pattern, it detects 4 secrets — the fallback \b5\b would not appear, the count regex would not match "5", and the test would fail. An implementation calibrated to the strict Stripe pattern is penalized even if otherwise correct. |
| error-handling.test.ts:T13.1-noinit | Without init, runs task-create and update-import, asserts exit != 0, output matches /init|not initialized/i, stderr has no Node stack trace pattern. | T-ERR-1: exits non-zero with "initialized" or "init", not a stack trace | PASS | No exploitable gap found. |
| error-handling.test.ts:T13.3-corrupt | Creates malformed JSONL, runs scan-secrets, asserts exit != 0 and no Node stack trace in stderr. | T-ERR-2: scan-secrets exits non-zero on malformed JSONL | PASS | No exploitable gap found. |
| error-handling.test.ts:T12.4-spaces | Creates dir "my project", runs init-project, task-create, and update-import, asserts exit 0 AND output file existence for each. | T-ERR-3: all operations work with space in path; exit 0 AND file exists | PASS | No exploitable gap found. |
| new-features.test.ts:T-HOOK-1 | Pipes JSON payload `{session_id, project_dir}` to auto-save-context via stdin (execSync redirect), asserts exit 0, auto-saves/ dir exists, at least one .jsonl file present, that file is valid JSONL. | T-HOOK-1: timestamped .jsonl file in flat auto-saves/ directory | FAIL | The AC requires a "timestamped .jsonl file." The test asserts only that at least one file ending in .jsonl exists — no check that the filename contains a timestamp. An implementation that creates `auto-save.jsonl` (fixed name, no timestamp) passes this test while violating the AC. Additionally, the test does not verify the content of the auto-saved file is derived from the session payload (only that it is valid JSONL). |
| context-operations.test.ts:T-HOOK-1 | Passes --session-id as CLI argument (not stdin), asserts exit 0, auto-saves/ dir exists, one .jsonl file present, valid JSONL. | T-HOOK-1: timestamped .jsonl file in flat auto-saves/ directory | FAIL | (1) The AC specifies a stdin payload interface (preCompact hook behavior). This test exercises a CLI args interface, which may or may not exist in the implementation. An implementation that correctly handles stdin but not CLI args would fail this test; one that handles CLI args but not stdin would pass this test while violating the DoD. (2) No timestamp check on the filename. |
| context-operations.test.ts:T-MEM-1 | After save-context, asserts MEMORY.md at `join(ctx.personalBase, 'memory', 'MEMORY.md')` contains task-id and context-name. | T-MEM-1: MEMORY.md contains task-id and context-name after save | ESCALATE | Two independent tests disagree on the path for MEMORY.md: this test uses `personalBase/memory/MEMORY.md`, while new-features.test.ts:T-MEM-1 uses `personalDir/memory/MEMORY.md`. The AC does not specify which path is correct. At most one of these tests is exercising the real implementation path; the other produces a vacuous assertion (always passes because the file is never written there). Human review required to determine the authoritative path and which test, if either, is correct. |
| new-features.test.ts:T-MEM-1 | After save-context, uses waitFor to poll for MEMORY.md at `join(ctx.personalDir, 'memory', 'MEMORY.md')`, asserts contains task-id and context-name. | T-MEM-1: MEMORY.md contains task-id and context-name after save | ESCALATE | Same path disagreement as above. |

---

## Section 2 — AC Coverage Gaps

**T-INIT-1**: covered by initialization.test.ts:T1.1-a, T1.2-claudemd
Coverage: ADEQUATE

**T-INIT-2**: covered by initialization.test.ts:T1.2-backup
Coverage: ADEQUATE

**T-INIT-3**: covered by initialization.test.ts:T1.2-defaultcopy
Coverage: ADEQUATE

**T-INIT-4**: covered by initialization.test.ts:T1.3-idempotent-a and siblings
Coverage: ADEQUATE

**T-INIT-5**: covered by initialization.test.ts:T1.5-isolation
Coverage: INADEQUATE — The test verifies path-arithmetic distinctness, not implementation-enforced isolation. A broken implementation is never exercised.

**T-TASK-1**: covered by task-operations.test.ts:T2.1-structure, T2.1-sections
Coverage: ADEQUATE

**T-TASK-2**: covered by task-operations.test.ts:T2.2-uppercase and siblings
Coverage: ADEQUATE

**T-TASK-3**: covered by task-operations.test.ts:T2.3-multiline
Coverage: INADEQUATE — Keyword checks do not verify verbatim multi-line preservation. An AI-summarising implementation passes.

**T-TASK-4**: covered by task-operations.test.ts:T2.4-empty
Coverage: ADEQUATE

**T-CTX-1**: covered by context-operations.test.ts:T4.1-path
Coverage: ADEQUATE

**T-CTX-2**: covered by context-operations.test.ts:T4.1-jsonl
Coverage: ADEQUATE

**T-CTX-3**: covered by context-operations.test.ts:T4.2-blocksecret
Coverage: ADEQUATE

**T-CTX-4**: covered by context-operations.test.ts:T4.5-size (includes statSync pre-condition)
Coverage: ADEQUATE

**T-CTX-5**: covered by new-features.test.ts:T-CTX-5, context-operations.test.ts:T-CTX-5
Coverage: ADEQUATE (deterministic file size; text requirement prevents generic failure matching)

**T-CTX-6**: covered by new-features.test.ts:T-CTX-6, context-operations.test.ts:T-CTX-6
Coverage: ADEQUATE

**T-CTX-7**: covered by context-operations.test.ts:T6.6-deletion
Coverage: ADEQUATE

**T-LIST-1**: covered by context-operations.test.ts:T5.1-ordering, T5.4
Coverage: ADEQUATE (Test 5.4 covers ordering unconditionally; T5.1 ordering branch is vacuous but 5.4 compensates)

**T-LIST-2**: covered by context-operations.test.ts:T5.1-counts
Coverage: ADEQUATE

**T-LIST-3**: covered by context-operations.test.ts:T5.3-nocontexts
Coverage: ADEQUATE

**T-LIST-4**: covered by context-operations.test.ts:T5.6-summary
Coverage: INADEQUATE — Test cannot distinguish an AI-generated summary from any fixed alphabetic string. The AC clause "not just metadata" is not falsifiable by this test.

**T-PROM-1**: covered by context-operations.test.ts:T7.1-copies
Coverage: ADEQUATE

**T-PROM-2**: covered by context-operations.test.ts:T7.2-secrettype
Coverage: ADEQUATE

**T-PROM-3**: covered by context-operations.test.ts:T7.5-alreadygolden
Coverage: ADEQUATE

**T-CLMD-1**: covered by claude-md-system.test.ts:T8.1-unchanged
Coverage: ADEQUATE

**T-CLMD-2**: covered by claude-md-system.test.ts:T8.2-oneimport
Coverage: ADEQUATE

**T-GIT-1**: covered by git-integration.test.ts:T11.7-gitignored
Coverage: ADEQUATE

**T-GIT-2**: covered by git-integration.test.ts:T11.4-personal
Coverage: ADEQUATE

**T-SEC-2**: covered by secret-detection.test.ts:T9.1-aws
Coverage: ADEQUATE

**T-SEC-3**: covered by secret-detection.test.ts:T9.2-stripe
Coverage: ADEQUATE

**T-SEC-4**: covered by secret-detection.test.ts:T9.8-alltypes
Coverage: INADEQUATE — The test fixture contains a malformed AWS key (19 chars after AKIA); output patterns do not verify which message type each detection originated from. An implementation that skips tool_result messages can pass if "github" appears anywhere in its output.

**T-SEC-5**: covered by secret-detection.test.ts:T9.6-falsepositive
Coverage: ADEQUATE

**T-SEC-6**: covered by secret-detection.test.ts:T9.9-redaction
Coverage: ADEQUATE

**T-SEC-7**: covered by secret-detection.test.ts:T9.7-count
Coverage: INADEQUATE — Fallback `\b5\b` is vacuous. MULTIPLE_SECRETS_CONTEXT contains a Stripe key with only 12 chars (requires 24+), making the count of 5 implementation-dependent. If a strict scanner detects 4, the test fails for a correct implementation.

**T-ERR-1**: covered by error-handling.test.ts:T13.1-noinit
Coverage: ADEQUATE

**T-ERR-2**: covered by error-handling.test.ts:T13.3-corrupt
Coverage: ADEQUATE

**T-ERR-3**: covered by error-handling.test.ts:T12.4-spaces
Coverage: ADEQUATE

**T-HOOK-1**: covered by new-features.test.ts:T-HOOK-1 and context-operations.test.ts:T-HOOK-1
Coverage: INADEQUATE — Neither test verifies a timestamp in the filename. context-operations.test.ts version tests CLI args rather than stdin, making it irrelevant to the AC interface.

**T-MEM-1**: covered by new-features.test.ts:T-MEM-1 and context-operations.test.ts:T-MEM-1
Coverage: INADEQUATE — Two tests assert MEMORY.md at different paths (personalBase vs personalDir). At most one is correct; the other asserts a path that may never be written by the implementation, producing a vacuous pass if the file happens not to exist (the assertion would fail rather than vacuously pass — but the path disagreement means coverage is unreliable).

**T-RESUME-MANUAL**: marked MANUAL in AC
Coverage: MISSING (intentionally manual; no automated coverage exists)

**CLAUSE: /context-manage command (PRD Commands Reference section) — NO AC DEFINED — STRICT FAIL**
The `/context-manage` command is fully specified in the PRD Commands Reference section with defined behavior (list contexts, view details, interactive cleanup via natural language). No AC clause exists for this feature. No test can be evaluated for adequate coverage.

**CLAUSE: Task Switching — existing task (PRD Feature Behavior 3, Commands Reference /task <existing-id>) — NO AC DEFINED — STRICT FAIL**
Switching to an existing task (as distinct from creating a new task) is a defined PRD behavior with specified outcomes (context listing, .claude/CLAUDE.md update). No formal AC clause covers this command path. Task-operations.test.ts Group 3 tests exist but cannot be evaluated without a AC clause.
