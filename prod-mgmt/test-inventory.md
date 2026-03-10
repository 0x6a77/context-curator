# Adversarial Test Inventory

---

## Section 1 — Test Inventory

| TEST_ID | DESCRIPTION | DOD_CLAUSE | VERDICT | ATTACK_VECTOR |
|---------|-------------|------------|---------|---------------|
| initialization.test.ts / Test 1.1 "should create .claude/ directory structure" | Runs init-project in a fresh dir, checks that .claude/, .gitignore, tasks/default/CLAUDE.md, and .claude/CLAUDE.md exist and that CLAUDE.md contains an @import pointing at tasks/default/CLAUDE.md. | T-INIT-1: `init-project` creates `.claude/CLAUDE.md` containing an `@import` line; file must not exist before script runs | FAIL | The pre-condition "file must not exist before script runs" is not asserted. The test calls `createTestEnvironment` and does not explicitly verify `.claude/CLAUDE.md` is absent before running the script. An implementation that ships the file pre-populated would pass every assertion. The DoD requires the file to be absent before the run; the test does not assert that. |
| initialization.test.ts / Test 1.2 "should create backup of original CLAUDE.md" | Pre-creates root CLAUDE.md, runs init-project, checks backup path exists and its content equals the original. | T-INIT-2: `init-project` copies root CLAUDE.md byte-for-byte to stash path; backup must not exist before script runs (not created in test setup) | FAIL | The DoD explicitly forbids creating the backup in test setup. The test uses `beforeEach` to write the root CLAUDE.md but correctly does not pre-create the backup. However, the backup path is `join(ctx.personalDir, '.stash', 'original-CLAUDE.md')` which is derived from `personalDir`. If the implementation writes ANY file to that path (e.g., a zero-byte placeholder created by setup scaffolding), `fileExists` returns true and the byte equality check on an empty file would fail — but the test would still pass `fileExists`. More critically: the test reads backup content and compares to `originalContent`, but `readFile` returning the same string would pass even if the backup was created by setup (because the setup wrote that exact content). The guard "backup must not exist before script runs" is asserted only for the stash path; an implementation that copies to a slightly different path (e.g. appending a timestamp) would fail `fileExists` but the DoD clause is still violated. The test does assert `expect(fileExists(backupPath)).toBe(false)` before the script runs — this IS present. However: the path checked pre-run is hardcoded. If the implementation uses a different but valid stash path, the pre-run assertion passes vacuously and the post-run assertion never fires. VERDICT downgraded to FAIL on incompleteness: the test does not assert that the backup path is the ONLY newly created file; an implementation could create the backup in a sibling path and pass. |
| initialization.test.ts / Test 1.2 "should create default task with copy of original CLAUDE.md" | Checks that .claude/tasks/default/CLAUDE.md equals original content character-for-character. | T-INIT-3: `.claude/tasks/default/CLAUDE.md` content equals root CLAUDE.md character-for-character | FAIL | Pre-condition is not asserted. The test asserts `expect(fileExists(defaultTaskPath)).toBe(false)` before the script runs — this IS present. Content equality via `toBe(originalContent)` is correct. However: the `createTestEnvironment` scaffolding could technically create this file if its implementation changes; there is no structural guarantee. More critically: `readFile` is a test utility whose implementation is not shown; if it silently returns empty string on missing files and `originalContent` is also empty, the assertion passes vacuously. The test depends on `writeFileSync` in `beforeEach` setting `originalContent = '# My Project Instructions\n\nUse Python 3.11 for all scripts\n'` which is non-empty, so vacuity is unlikely here. VERDICT: PASS — pre-condition and content are both asserted, content is non-trivially non-empty. |
| initialization.test.ts / Test 1.3 "should succeed on both initializations" | Runs init-project twice, checks exit code 0 both times and that .claude/CLAUDE.md content is identical after both runs. | T-INIT-4: Running `init-project` twice exits 0 both times and produces identical file contents | PASS | Both exit codes checked, file content compared with `toBe`. An implementation that truncates the file on second run would be caught. No meaningful attack vector found. |
| initialization.test.ts / Test 1.3 "should produce identical files on second run" | Same as above — additional redundant check on idempotence. | T-INIT-4 | PASS | Duplicate of the above assertion pattern. No additional attack vector. |
| initialization.test.ts / Test 1.5 "should handle multiple projects independently" | Inits two projects in distinct dirs, writes a marker file to personalPath1, checks it does not appear in personalPath2. | T-INIT-5: Writing a file to project A's personal dir does not make it visible in project B's personal dir | FAIL | The test manually writes the marker AFTER init and checks isolation by filesystem path. It does not run any production script to write to project A — it calls `writeFile(join(personalPath1, 'marker.txt'), 'project-1')` directly. This tests filesystem isolation of temp dirs, not isolation enforced by the implementation. An implementation that actively writes to the wrong project's personal dir during a real operation would not be caught. The test is vacuous with respect to the DoD clause: any two distinct filesystem paths will trivially not share files unless explicitly linked. |
| task-operations.test.ts / Test 2.1 "should create task CLAUDE.md with description" | Runs task-create with 'oauth-refactor' and a description, checks CLAUDE.md has required sections and Focus section contains 'oauth'. | T-TASK-1: `task-create` produces CLAUDE.md with all required sections | PASS | All four required section headers are asserted (`# Task:`, `## Focus`, `## Key Areas`, `## Guidelines`). The description keyword 'oauth' is verified in the Focus section. An implementation that includes sections with wrong content would not be caught, but all four headers must be present. No meaningful attack vector that passes all four header checks while violating the DoD. |
| task-operations.test.ts / Test 2.2 "should reject task name with uppercase" | Runs task-create with 'OAuthRefactor', checks non-zero exit and that no task directory is created (either under the exact name or lowercased). | T-TASK-2: `task-create` with uppercase name exits non-zero AND creates no task directory | PASS | Both conditions (exit code and directory absence) are checked. Checks both the exact-case path and a lowercased alternative. No meaningful attack vector. |
| task-operations.test.ts / Test 2.3 "should capture full multi-line description" | Runs task-create with a multi-line description string containing 'OAuth', 'session', 'token'; asserts all three appear in the Focus section. | T-TASK-3: `task-create` with multi-line description preserves all lines in the Focus section | FAIL | The test checks for three keywords but does NOT check that the lines are preserved verbatim. An implementation that collapses all lines into a single sentence containing the three keywords would pass. The DoD clause says "preserves all lines" which implies structural preservation, not keyword presence. This test is insufficient to cover the DoD clause. |
| task-operations.test.ts / Test 2.4 "should reject empty description" | Runs task-create with empty string, checks non-zero exit and no directory created. | T-TASK-4: `task-create` with empty description exits non-zero and creates no task directory | PASS | Both conditions checked. No meaningful attack vector. |
| context-operations.test.ts / Test 4.1 "should save context to personal storage" | Runs save-context with --personal, checks file exists at exact path and isValidJsonl passes. | T-CTX-1: `save-context --personal` creates file at exactly `<personalDir>/tasks/<task-id>/contexts/<name>.jsonl` | FAIL | `isValidJsonl` is a test utility whose implementation is not shown. If it returns true for an empty file or a file with a single line that is valid JSON (even `null`), an implementation that writes garbage with one valid header line would pass. More critically: the DoD says "asserted unconditionally, not inside an `if (fileExists)` guard" — that constraint applies to T-CTX-2, not T-CTX-1. For T-CTX-1 the path assertion is the key check, and `fileExists(expectedPath)` is called unconditionally. No attack vector for the path itself. VERDICT revised: PASS for path check. |
| context-operations.test.ts / Test 4.1 "should create valid JSONL file" | Same save-context run; calls `isValidJsonl(expectedPath)` and checks `readFile(expectedPath).trim().length > 0`. | T-CTX-2: Saved context file parses as valid JSONL — asserted unconditionally, not inside an `if (fileExists)` guard | FAIL | `isValidJsonl` is called after `fileExists` is checked in the PREVIOUS line (`expect(fileExists(expectedPath)).toBe(true)`). The DoD clause explicitly requires the JSONL assertion to be unconditional — not inside a fileExists guard. The test structurally puts `isValidJsonl` after a `fileExists` assertion, which means if the file does not exist, the test would fail at fileExists, not at JSONL parsing. This is borderline but the DoD is explicit: the JSONL check must not be gated. Additionally, `isValidJsonl` is opaque — its definition is not shown; a stub that always returns `true` would make this test pass regardless of file contents. |
| context-operations.test.ts / Test 4.2 "should block golden save when session contains a real AWS key" | Creates a JSONL with AWS_KEY_CONTEXT, runs save-context --golden, checks non-zero exit and output matches /aws|akia/. | T-CTX-3: `save-context --golden` on a session with a real AWS key exits non-zero or produces a prompt; exit 0 with no prompt is a failure | FAIL | The DoD says "exits non-zero OR produces a prompt; exit 0 with no prompt is a failure." The test only checks `expect(result.exitCode).not.toBe(0)` — it does not assert that a prompt is produced when exit is 0. An implementation that prompts (prints a warning and returns exit 0) would violate the DoD but pass this test because the DoD allows prompting as an alternative. The test forces the stricter interpretation (non-zero exit) but the DoD allows exit 0 with prompt — these are inconsistent. More importantly: `AWS_KEY_CONTEXT` is a test fixture whose definition is not shown. If it contains a pattern that matches the regex but is not a real credential format (e.g. just the string "AKIA"), the scanner could detect it without the full 16-char pattern required by T-SEC-2. The test does not verify the key conforms to `AKIA` + 16 uppercase alphanumeric chars. |
| context-operations.test.ts / Test 4.5 "should reject golden save when context exceeds 100KB" | Creates a 150-message JSONL with 1000-char messages, verifies fileSize > 100KB, runs save-context --golden, checks non-zero exit and output matches /100KB|too large/i. | T-CTX-4: `save-context --golden` on a 150KB session exits non-zero with output containing "100KB" or "too large" | PASS | File size is explicitly verified before the script run. Both exit code and output message are checked. No meaningful attack vector. |
| context-operations.test.ts / T-CTX-5 "should reject promote when personal context exceeds 100KB" | Creates large context (details elided in excerpt), runs promote-context, checks non-zero exit and output contains '100kb', 'too large', or 'size'. | T-CTX-5: `promote-context` on a 150KB personal context exits non-zero with output containing "100KB" or "too large" | FAIL | The output check is `output.includes('100kb') || output.includes('too large') || output.includes('size')`. The word 'size' is a trivial match — any output mentioning file size in any context would satisfy this. An implementation that prints "checking file size..." then exits non-zero for any reason would pass. The DoD requires the output to contain "100KB" or "too large" specifically; the test adds 'size' as a third alternative that is not in the DoD. |
| context-operations.test.ts / T-CTX-6 "should create a backup file when saving to an existing name" | Saves same context name twice, checks a .backup- file exists in contexts dir and its content equals the original first save. | T-CTX-6: `save-context` called twice with same name creates a `.backup-` file; backup contains original content | PASS | Both structural conditions (backup file pattern, content equality) are checked. `readFile` on the backup is compared byte-for-byte with `originalContent`. No meaningful attack vector. |
| context-operations.test.ts / Test 5.1 "should list all contexts for task" | Runs context-list, checks output contains 'ctx-1', 'ctx-2', and Personal appears before Golden in output. | T-LIST-1: `context-list` output: indexOf("Personal") < indexOf("Golden") AND specific context names appear | PASS | Both ordering and name presence are checked. The conditional `if (personalIdx >= 0 && goldenIdx >= 0)` weakens the ordering check — if either section label is absent, ordering is not verified. An implementation that omits "Golden" label entirely would skip the ordering assertion. However, Test 5.3 separately checks for "golden" content. For T-LIST-1 specifically this is a weak point. VERDICT: FAIL — the ordering assertion is gated on both labels being present; an implementation that omits section labels but still lists contexts would pass name checks while violating ordering requirements. |
| context-operations.test.ts / Test 5.1 "should show message counts" | Checks output matches `\b5\b` and `\b30\b` using word boundaries. | T-LIST-2: `context-list` shows exact message count matching `\b<N>\b` (word boundary, not `\d+`) | PASS | Word boundary regex is used correctly as specified. Depends on test fixture having exactly 5 and 30 messages — fixture setup not shown in excerpt but counts are specific. No meaningful attack vector assuming fixture is correctly built. |
| context-operations.test.ts / Test 5.3 "should indicate no contexts found" | Runs context-list on 'no-contexts' task, checks output matches /no contexts|empty/i. | T-LIST-3: When no contexts exist, output contains "fresh", "empty", or "no contexts" | FAIL | The DoD requires "fresh", "empty", or "no contexts". The test only checks `/no contexts|empty/i` — it omits "fresh". An implementation that outputs only "fresh start!" would pass the DoD but fail the test regex. More importantly: the test creates a task named 'no-contexts' implying the task exists but has no contexts. It does not verify the task itself exists in .claude/tasks. If context-list exits non-zero for a nonexistent task (as Test 5.5 establishes), the `expect(result.exitCode)` is not checked here — only the output message. An implementation that exits non-zero with "task not found" would not be caught by this test's assertions (no exitCode check present). |
| context-operations.test.ts / Test 5.6 "should display a non-empty non-metadata string after context name" | Finds the line containing 'summary-ctx', slices text after the name, checks length > 0 and matches /[a-zA-Z]{3,}/. | T-LIST-4: `context-list` shows a non-empty description string after each context name, not just metadata | FAIL | The test checks only the line for 'summary-ctx', not for all contexts. An implementation that hardcodes a description only for contexts whose names end with 'ctx' would pass. The regex `/[a-zA-Z]{3,}/` matches any three consecutive letters — a timestamp like "2024-01-01" would not match but "msg" or "UTC" would. More critically: the test finds one specific context line and checks the rest of that line; it does not verify that descriptions are AI-generated or meaningful — any three-letter string appended after the name suffices. This is vacuous with respect to "AI-generated summary." |
| context-operations.test.ts / Test 6.6 "should prevent golden context deletion without confirmation" | Runs delete-context without --confirm flag, checks non-zero exit and that golden file still exists. | T-CTX-7: `delete-context` on golden context exits non-zero without `--confirm` flag; file still exists after failed attempt | PASS | Both conditions (exit code, file existence) checked. No meaningful attack vector. |
| context-operations.test.ts / Test 7.1 "should successfully promote clean context" | Promotes clean-ctx, checks both personal and golden paths exist and their contents are equal. | T-PROM-1: After `promote-context`, both personal original and golden copy exist; contents are byte-for-byte identical | PASS | Both files checked for existence and content equality via `toBe`. No meaningful attack vector. |
| context-operations.test.ts / Test 7.2 "should detect secrets and warn/block" | Promotes 'secret-ctx' containing `ghp_` token, checks non-zero exit and output matches /github|ghp_/i. | T-PROM-2: `promote-context` on context with `ghp_` + 36 alphanumeric chars: output names the specific secret type | FAIL | The DoD requires the output to name the specific secret type AND the secret must be `ghp_` + exactly 36 alphanumeric chars. The test checks `/github|ghp_/i` — matching either "github" or "ghp_" in output. An implementation that prints "secret detected" with no mention of GitHub or ghp_ would fail, but one that prints "github token detected" without scanning the actual `ghp_` pattern would pass. More critically: the fixture 'secret-ctx' contents are not shown — there is no assertion that the fixture actually contains `ghp_` + 36 alphanum chars as the DoD specifies. A fixture with just "ghp_short" would test a different pattern. |
| context-operations.test.ts / Test 7.5 "should warn about already-golden context" | Runs promote-context on 'already-golden' which has golden but no personal context (per T-PROM-3 DoD), checks non-zero exit and output matches /already.*golden|already exists/i. | T-PROM-3: `promote-context` when golden already exists exits non-zero or warns; setup must create personal context only | FAIL | The DoD says "setup must create personal context only." The test setup (not shown in excerpt) must not pre-create the golden context — the implementation is expected to find that golden already exists. However the test description names the context 'already-golden', implying setup DOES create a golden context. If setup creates both personal and golden, the test is not testing the right precondition. The test body does not assert the personal context exists before the call. A legitimate PROM-3 test would assert: personal exists, golden exists, then verify the script refuses. Without seeing the beforeEach, this is ESCALATE. |
| context-operations.test.ts / T-MEM-1 "should update MEMORY.md with task-id and context-name after save" | Saves a context, checks MEMORY.md exists at personalBase/memory/MEMORY.md and contains both the task-id and context-name strings. | T-MEM-1: After `save-context`, personal memory MEMORY.md contains the task-id and context-name saved | FAIL | Contains checks (`toContain('mem-task')`, `toContain('mem-check-ctx')`) are substring matches. An implementation that writes a MEMORY.md containing a single line "last saved: mem-task/mem-check-ctx" passes, as does one that writes a giant log with all task/context names ever used. The test does not check recency, structure, or that the file accurately reflects the LAST save rather than accumulating all saves. The DoD says "contains the task-id and context-name saved" — which is exactly what toContain checks. VERDICT: PASS by narrow DoD reading — the DoD only says "contains", which toContain correctly tests. However, the DoD does not specify structure so cumulative log is compliant. |
| context-operations.test.ts / T-HOOK-1 "should save context to timestamped path" | Runs auto-save-context with --session-id arg, checks autoSaveDir exists and contains at least one .jsonl file that parses as valid JSONL. | T-HOOK-1: `auto-save-context` with a mock stdin payload creates a timestamped file at the expected personal context path | FAIL | The DoD requires the file be at "the expected personal context path" — `<personalDir>/tasks/<task-id>/contexts/<name>.jsonl`. The test checks `join(ctx.personalBase, 'auto-saves')` which is NOT the personal context path specified in the DoD. The DoD path is task-scoped; this test looks in a flat `auto-saves` directory. Either the test is testing a different path than the DoD specifies, or the DoD path is wrong. In either case: the test does not verify the path matches the DoD formula. |
| new-features.test.ts / T-HOOK-1 "should create a timestamped auto-save file when called with a session_id payload" | Provides a session_id + project_dir payload, checks `auto-saves` dir is absent (replaced by task-scoped contexts dir), checks for auto- prefixed .jsonl files. | T-HOOK-1: `auto-save-context` with a mock stdin payload creates a timestamped file at the expected personal context path | FAIL | The test looks in `join(ctx.personalDir, 'tasks', 'hook1-task', 'contexts')` — a task-named path. But `hook1-task` appears to be hardcoded or derived from fixture setup not shown. The payload only carries `session_id` and `project_dir` — there is no task_id in the payload, so how does the implementation know to store under 'hook1-task'? If the implementation stores under a default task or uses a different path derivation, it would fail the existence check. The test relies on an implicit mapping from payload to task dir that is not validated. Additionally, the file is found by `f.startsWith('auto-')` — an implementation that writes `auto-` prefixed files anywhere in that dir would pass regardless of timestamping. |
| new-features.test.ts / T-MEM-1 "should add task-id and context-name to personal MEMORY.md after save" | Saves context for 'mem1-task'/'mem1-ctx', polls for MEMORY.md existence up to 5s, then checks contains both strings. | T-MEM-1: After `save-context`, personal memory MEMORY.md contains the task-id and context-name saved | FAIL | Uses `waitFor` with 5000ms polling — suggests MEMORY.md may be written asynchronously. If the implementation writes MEMORY.md synchronously but with wrong content, `waitFor` only checks existence not content; the content check is after. The `waitFor` polling `fileExists(memoryPath)` would pass as soon as any file appears at that path — then content is checked. An implementation that creates the file immediately but writes content 10 seconds later would pass the waitFor and fail the content check. More critically: `waitFor(() => fileExists(memoryPath), 5000, 200)` returns a boolean, then `expect(appeared).toBe(true)` is a separate assertion. If `appeared` is false (timeout), the test fails with a confusing assertion error rather than a timeout error. This is a test quality issue, not a coverage gap per se. |
| secret-detection.test.ts / Test 9.1 "should detect AWS access key pattern" | Runs scan-secrets on a file containing an AWS key pattern, checks non-zero exit and output matches /akia/i. | T-SEC-2: `scan-secrets` on file with `AKIA` + 16 uppercase alphanumeric chars exits non-zero; output contains "AWS" or "AKIA" | FAIL | The test output check is only `/akia/i` — it does not also check for "AWS". The DoD says output must contain "AWS" OR "AKIA". The test only checks for AKIA. This is technically sufficient (DoD is OR) but the fixture content is not shown — we cannot verify it contains `AKIA` + exactly 16 uppercase alphanumeric chars. If the fixture contains `AKIAIOSFODNN7EXAMPLE` (the false-positive-policy key from T-SEC-5), it conflates two separate DoD clauses. |
| secret-detection.test.ts / Test 9.2 "should detect both test and live keys" | Checks non-zero exit, output contains 'sk_test' and 'sk_live'. | T-SEC-3: `scan-secrets` detects both `sk_test_` and `sk_live_`; output names the specific key type | FAIL | The DoD requires detection of `sk_test_` and `sk_live_` (with trailing underscore). The test checks `output.toContain('sk_test')` and `output.toContain('sk_live')` without the trailing underscore. An implementation that outputs "sk_testing key found" would match `sk_test` but not be detecting the Stripe key pattern. This is a boundary failure in the assertion. |
| secret-detection.test.ts / Test 9.3 "should detect GitHub personal access token" | Checks non-zero exit and output matches /ghp_/i. | T-PROM-2 (indirectly) / no direct DoD clause for standalone GitHub detection | ESCALATE | No standalone DoD clause for GitHub token detection in the DoD table — T-PROM-2 covers promotion context. The output check `/ghp_/i` only requires the literal "ghp_" appear in output; an implementation that echoes back the input would pass. The fixture content is not shown. Cannot evaluate coverage adequacy without a defined DoD clause to measure against. |
| secret-detection.test.ts / Test 9.6 "should treat AKIAIOSFODNN7EXAMPLE as a true positive" | Checks non-zero exit and output matches /akia/i for the known example key. | T-SEC-5: `AKIAIOSFODNN7EXAMPLE` is treated as a true positive | PASS | The exact key string is well-defined. Exit code and pattern match are checked. No meaningful attack vector — the implementation must treat this specific string as a positive match. |
| secret-detection.test.ts / Test 9.7 "should report correct count of multiple secrets" | Fixture contains exactly 5 secrets; checks output matches `\b5\b` with flexible count-extraction regex. | T-SEC-7: `scan-secrets` on context with exactly 4 secrets reports count matching `\b4\b` | FAIL | Critical mismatch: the DoD says "exactly 4 secrets" and `\b4\b`, but the test comment says "MULTIPLE_SECRETS_CONTEXT contains exactly 5 distinct secrets" and checks for `\b5\b`. Either the fixture has 4 and the test comment is wrong, or the fixture has 5 and the DoD table is wrong. In either case: the test and DoD are inconsistent. An implementation calibrated to the test (5 secrets) would fail the DoD (4 secrets) or vice versa. |
| secret-detection.test.ts / Test 9.8 "should detect secrets in user, assistant, and tool_result messages" | Checks non-zero exit and output matches three patterns for three secret types, one from each message type. | T-SEC-4: A context with one secret in user, one in assistant, one in tool_result: all three reported | FAIL | The test checks three regex patterns in a single output string but does not verify WHICH message type each secret came from. An implementation that only scans user messages and reports all three (because the user message fixture contains all three secrets) would pass. The DoD requires secrets be found across three distinct message types; the test does not enforce that the fixture has secrets in distinct types, nor that the output attributes findings to message types. |
| secret-detection.test.ts / Test 9.9 "should produce clean valid JSONL after redaction" | Runs redact-secrets, rescans, checks exit 0 and output matches /clean/i, checks JSONL validity. | T-SEC-6: After `redact-secrets`, every line parses as JSON; second `scan-secrets` run returns "clean" | PASS | All conditions checked: JSONL validity, rescan exit 0, rescan output contains "clean". The specific string `sk_live_abc123def456` is checked absent. No meaningful attack vector. |
| secret-detection.test.ts / Test 9.9 "should remove or mask secrets in output" | Checks that `sk_live_abc123def456` is absent from redacted file and that REDACTED/\*\*\*/[REMOVED] is present. | T-SEC-6 (partial) | PASS | Specific secret string checked for absence, masking indicator checked for presence. No meaningful attack vector given the specific fixture value. |
| claude-md-system.test.ts / Test 8.2 "should contain exactly one @import after multiple switches" | Switches to task-1 then task-2, checks exactly one @import line pointing to task-2 (not task-1). | T-CLMD-2: After two task switches, `.claude/CLAUDE.md` contains exactly one `@import` line | PASS | Both the count (exactly 1) and the correct target (task-2, not task-1) are verified. No meaningful attack vector. |
| git-integration.test.ts / Test 11.4 "should not include personal storage in git" | Runs save-context, stages all files, checks git status lines do not contain 'my-work' or 'personal-ctx'. | T-GIT-2: After full workflow, `git status --porcelain` does not list any path containing personal storage prefix | FAIL | The test checks that status lines don't contain 'my-work' or 'personal-ctx' — two specific strings — rather than the personal storage prefix itself. An implementation that stores personal data under a different filename (e.g., 'work-my' or 'ctx-personal') would pass this check while still committing personal data. The DoD says "does not list any path containing the personal storage prefix" — the test does not check the prefix, it checks two hardcoded filename fragments. Additionally, `personalBase` is asserted to be outside `projectDir`, which means the git add won't find it anyway — this test is largely vacuous because personal storage being outside the project root means `git add .` from the project dir can never reach it regardless of implementation. |
| error-handling.test.ts / Test 13.1 "should handle missing .claude directory gracefully" | Runs task-create without prior init, checks non-zero exit, output contains 'init', and stderr contains no stack trace patterns. | T-ERR-1: Any script run without init exits non-zero with output containing "initialized" or "init" — not a stack trace | PASS | Exit code, keyword, and stack-trace absence are all checked. The stack trace check uses two patterns. No meaningful attack vector. |
| error-handling.test.ts / Test 13.3 "should detect corrupt JSONL" | Runs scan-secrets on a malformed JSONL file, checks non-zero exit, no stack trace in stderr, and output contains parse-related keyword. | T-ERR-2: `scan-secrets` on malformed JSONL exits non-zero (not 0) | PASS | All conditions checked. Stack trace absence is a quality indicator. The corrupt JSONL keyword check covers the meaningful error response. No meaningful attack vector. |
| initialization.test.ts / Test 1.1 "should work with git initialized" | Inits git, runs init-project, calls `isGitIgnored(ctx.projectDir, '.claude/CLAUDE.md')`. | T-GIT-1: `git check-ignore .claude/CLAUDE.md` exits 0 in real git repo after init | PASS | `isGitIgnored` is a test utility — its implementation is not shown, but the test specifically checks `.claude/CLAUDE.md` is git-ignored. If `isGitIgnored` correctly delegates to `git check-ignore`, this is adequate coverage. No meaningful attack vector assuming utility is correctly implemented. |

---

## Section 2 — DoD Coverage Gaps

**T-INIT-1** (`init-project` creates `.claude/CLAUDE.md` containing `@import` line; file must not exist before script runs)
- Tests: initialization.test.ts Test 1.1 "should create .claude/ directory structure"
- Coverage: INADEQUATE
- Gap: Pre-condition (file must not exist before script runs) is asserted, but test setup via `createTestEnvironment` may not guarantee the project directory is entirely clean. The test does not read `.claude/CLAUDE.md` before running the script and assert its absence.

**T-INIT-2** (`init-project` copies root CLAUDE.md byte-for-byte to stash path; backup must not exist before script runs)
- Tests: initialization.test.ts Test 1.2 "should create backup of original CLAUDE.md"
- Coverage: INADEQUATE
- Gap: The backup path is hardcoded; an implementation using a different valid path would be undetected. No assertion that ONLY that path is created as a new file.

**T-INIT-3** (`.claude/tasks/default/CLAUDE.md` content equals root CLAUDE.md character-for-character)
- Tests: initialization.test.ts Test 1.2 "should create default task with copy of original CLAUDE.md"
- Coverage: ADEQUATE
- Gap: None identified.

**T-INIT-4** (Running `init-project` twice exits 0 both times and produces identical file contents)
- Tests: initialization.test.ts Test 1.3 (multiple sub-tests)
- Coverage: ADEQUATE
- Gap: None identified.

**T-INIT-5** (Writing a file to project A's personal dir does not make it visible in project B's personal dir)
- Tests: initialization.test.ts Test 1.5
- Coverage: INADEQUATE
- Gap: Test manually writes to dir A and checks dir B — never invokes a production script. Filesystem isolation of temp dirs is trivially guaranteed; the test does not exercise the implementation's isolation enforcement.

**T-TASK-1** (`task-create` produces CLAUDE.md with all required sections)
- Tests: task-operations.test.ts Test 2.1
- Coverage: ADEQUATE
- Gap: None identified.

**T-TASK-2** (`task-create` with uppercase name exits non-zero AND creates no task directory)
- Tests: task-operations.test.ts Test 2.2
- Coverage: ADEQUATE
- Gap: None identified.

**T-TASK-3** (`task-create` with multi-line description preserves all lines in Focus section)
- Tests: task-operations.test.ts Test 2.3
- Coverage: INADEQUATE
- Gap: Test checks keyword presence, not line-by-line structural preservation. An implementation that summarizes or reformats while retaining keywords passes.

**T-TASK-4** (`task-create` with empty description exits non-zero and creates no task directory)
- Tests: task-operations.test.ts Test 2.4
- Coverage: ADEQUATE
- Gap: None identified.

**T-CTX-1** (`save-context --personal` creates file at exactly `<personalDir>/tasks/<task-id>/contexts/<name>.jsonl`)
- Tests: context-operations.test.ts Test 4.1
- Coverage: ADEQUATE
- Gap: None identified.

**T-CTX-2** (Saved context file parses as valid JSONL — asserted unconditionally, not inside `if (fileExists)` guard)
- Tests: context-operations.test.ts Test 4.1 "should create valid JSONL file"
- Coverage: INADEQUATE
- Gap: JSONL assertion follows a `fileExists` assertion — structurally gated by existence check. DoD explicitly prohibits this pattern. Additionally, `isValidJsonl` implementation is opaque.

**T-CTX-3** (`save-context --golden` on session with real AWS key exits non-zero or produces a prompt)
- Tests: context-operations.test.ts Test 4.2 "should block golden save when session contains a real AWS key"
- Coverage: INADEQUATE
- Gap: Test does not verify fixture contains `AKIA` + 16 uppercase alphanumeric chars. Fixture definition not shown; test may be testing a weaker pattern.

**T-CTX-4** (`save-context --golden` on 150KB session exits non-zero with output containing "100KB" or "too large")
- Tests: context-operations.test.ts Test 4.5 "should reject golden save when context exceeds 100KB"
- Coverage: ADEQUATE
- Gap: None identified.

**T-CTX-5** (`promote-context` on 150KB personal context exits non-zero with output containing "100KB" or "too large")
- Tests: context-operations.test.ts T-CTX-5
- Coverage: INADEQUATE
- Gap: Test adds 'size' as a third acceptable output string not present in DoD. Any output mentioning file size satisfies this weakened check.

**T-CTX-6** (`save-context` called twice with same name creates `.backup-` file; backup contains original content)
- Tests: context-operations.test.ts T-CTX-6
- Coverage: ADEQUATE
- Gap: None identified.

**T-CTX-7** (`delete-context` on golden context exits non-zero without `--confirm`; file still exists after failed attempt)
- Tests: context-operations.test.ts Test 6.6 "should prevent golden context deletion without confirmation"
- Coverage: ADEQUATE
- Gap: None identified.

**T-LIST-1** (`context-list` output: indexOf("Personal") < indexOf("Golden") AND specific context names appear)
- Tests: context-operations.test.ts Test 5.1 "should list all contexts for task"
- Coverage: INADEQUATE
- Gap: Ordering assertion is gated on both "Personal" and "Golden" labels being present in output. Absence of either label bypasses the ordering check.

**T-LIST-2** (`context-list` shows exact message count matching `\b<N>\b`)
- Tests: context-operations.test.ts Test 5.1 "should show message counts"
- Coverage: ADEQUATE
- Gap: None identified.

**T-LIST-3** (When no contexts exist, output contains "fresh", "empty", or "no contexts")
- Tests: context-operations.test.ts Test 5.3
- Coverage: INADEQUATE
- Gap: Test regex omits "fresh". Test does not assert exit code 0, so an implementation that exits non-zero with "task not found" could produce output matching the regex and pass.

**T-LIST-4** (`context-list` shows non-empty description string after each context name, not just metadata)
- Tests: context-operations.test.ts Test 5.6
- Coverage: INADEQUATE
- Gap: Test checks only one specific context line. Any three-letter string suffix satisfies the non-metadata requirement. "AI-generated" is not verifiable by this test.

**T-PROM-1** (After `promote-context`, both personal original and golden copy exist; contents byte-for-byte identical)
- Tests: context-operations.test.ts Test 7.1
- Coverage: ADEQUATE
- Gap: None identified.

**T-PROM-2** (`promote-context` on context with `ghp_` + 36 alphanumeric chars: output names specific secret type)
- Tests: context-operations.test.ts Test 7.2; secret-detection.test.ts Test 9.3
- Coverage: INADEQUATE
- Gap: Fixture content showing `ghp_` + exactly 36 alphanumeric chars is not verified by the test. Output check accepts "github" as an alternative to "ghp_" — an implementation that hardcodes "github token" without pattern-matching would pass.

**T-PROM-3** (`promote-context` when golden already exists exits non-zero or warns; setup must create personal context only)
- Tests: context-operations.test.ts Test 7.5
- Coverage: ESCALATE
- Gap: Test fixture setup is not shown in the excerpt. The DoD explicitly requires "setup must create personal context only" — cannot verify this constraint is enforced without seeing beforeEach. The test name 'already-golden' implies golden IS pre-created but this may be setup-created, violating the DoD setup constraint.

**T-CLMD-1** (After any task operation, root CLAUDE.md content equals pre-operation content)
- Tests: None identified in provided excerpts.
- Coverage: MISSING
- Gap: No test asserts root CLAUDE.md is unchanged after task operations. Task-operations tests do not save root content before running scripts and compare after.

**T-CLMD-2** (After two task switches, `.claude/CLAUDE.md` contains exactly one `@import` line)
- Tests: claude-md-system.test.ts Test 8.2
- Coverage: ADEQUATE
- Gap: None identified.

**T-GIT-1** (`git check-ignore .claude/CLAUDE.md` exits 0 in real git repo after init)
- Tests: initialization.test.ts Test 1.1 "should work with git initialized"
- Coverage: ADEQUATE
- Gap: Depends on `isGitIgnored` utility being correctly implemented; utility definition not shown.

**T-GIT-2** (After full workflow, `git status --porcelain` does not list any path containing personal storage prefix)
- Tests: git-integration.test.ts Test 11.4
- Coverage: INADEQUATE
- Gap: Personal storage is outside the project directory, so `git add .` from project root cannot stage it regardless of implementation. The test is structurally vacuous — it cannot fail for any implementation that stores personal data outside the project root.

**T-SEC-2** (`scan-secrets` on file with `AKIA` + 16 uppercase alphanumeric chars exits non-zero; output contains "AWS" or "AKIA")
- Tests: secret-detection.test.ts Test 9.1
- Coverage: INADEQUATE
- Gap: Test only checks for AKIA in output, not "AWS". Fixture content definition not shown; cannot verify it contains the exact pattern specified in DoD.

**T-SEC-3** (`scan-secrets` detects both `sk_test_` and `sk_live_`; output names specific key type)
- Tests: secret-detection.test.ts Test 9.2
- Coverage: INADEQUATE
- Gap: Test checks `sk_test` and `sk_live` without trailing underscore. An implementation detecting `sk_test_foo` would match the DoD but a different substring match passes the test for wrong reasons.

**T-SEC-4** (Context with one secret in user, one in assistant, one in tool_result: all three reported)
- Tests: secret-detection.test.ts Test 9.8
- Coverage: INADEQUATE
- Gap: Test checks that three patterns appear in combined output but does not verify secrets originated from three distinct message types. An implementation scanning only user messages that happen to contain all three secret types would pass.

**T-SEC-5** (`AKIAIOSFODNN7EXAMPLE` is treated as a true positive)
- Tests: secret-detection.test.ts Test 9.6
- Coverage: ADEQUATE
- Gap: None identified.

**T-SEC-6** (After `redact-secrets`, every line parses as JSON; second `scan-secrets` run returns "clean")
- Tests: secret-detection.test.ts Test 9.9 (two sub-tests)
- Coverage: ADEQUATE
- Gap: None identified.

**T-SEC-7** (`scan-secrets` on context with exactly 5 secrets reports count matching `\b5\b`)
- Tests: secret-detection.test.ts Test 9.7
- Coverage: INADEQUATE
- Gap: Test and DoD are inconsistent — DoD says 4 secrets, test fixture comment says 5. At least one of them is wrong; cannot be ADEQUATE under this contradiction.

**T-ERR-1** (Any script run without init exits non-zero with output containing "initialized" or "init" — not a stack trace)
- Tests: error-handling.test.ts Test 13.1
- Coverage: ADEQUATE
- Gap: None identified.

**T-ERR-2** (`scan-secrets` on malformed JSONL exits non-zero)
- Tests: error-handling.test.ts Test 13.3
- Coverage: ADEQUATE
- Gap: None identified.

**T-ERR-3** (All operations work when project path contains a space; verified by exitCode === 0 AND output file existence)
- Tests: None identified in provided excerpts.
- Coverage: MISSING
- Gap: No test exercises any operation with a space in the project path.

**T-HOOK-1** (`auto-save-context` with mock stdin payload creates timestamped file at expected personal context path)
- Tests: context-operations.test.ts T-HOOK-1; new-features.test.ts T-HOOK-1
- Coverage: INADEQUATE
- Gap: context-operations test checks `auto-saves` flat dir, not the DoD-specified `<personalDir>/tasks/<task-id>/contexts/<name>.jsonl` path. new-features test uses a task-scoped path but relies on an implicit payload-to-task mapping not validated. Neither test verifies the file is "timestamped" beyond the `auto-` prefix.

**T-MEM-1** (After `save-context`, personal memory MEMORY.md contains task-id and context-name saved)
- Tests: context-operations.test.ts T-MEM-1; new-features.test.ts T-MEM-1
- Coverage: ADEQUATE (by narrow DoD reading)
- Gap: None identified given DoD says only "contains" — cumulative log is compliant.

**T-RESUME-MANUAL** (MANUAL: After `/task <id>` + `/resume <session>`, Claude's response references task CLAUDE.md content)
- Tests: None (marked MANUAL in DoD)
- Coverage: MISSING (by design, manual test)
- Gap: No automated coverage. Marked MANUAL in DoD.

---

ESCALATE: T-PROM-3 — cannot evaluate without seeing beforeEach fixture setup. DoD constraint "setup must create personal context only" is unverifiable from provided excerpt. A human must inspect the full test file to confirm the setup constraint is honored.

ESCALATE: T-GIT-2 — test is structurally vacuous because personal storage is placed outside the project directory by design, making the git status check incapable of detecting any violation. A human must determine whether this test can ever fail for a compliant implementation and whether the DoD clause needs a different testing approach.

ESCALATE: T-CTX-3 — DoD says "exits non-zero OR produces a prompt; exit 0 with no prompt is a failure." The test enforces only exit non-zero, creating a structural inconsistency with the DoD's permissive OR. A human must decide whether the DoD or the test is authoritative.
