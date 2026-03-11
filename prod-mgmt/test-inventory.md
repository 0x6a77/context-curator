# Adversarial Test Inventory

**Version:** 1.0  
**Date:** 2026-03-11  
**Auditor:** Red Team  

---

## Section 0: PRD/DoD Structural Audit

Each PRD feature section is evaluated for: presence of a DoD, falsifiability of each criterion, and whether the DoD is specific enough to distinguish correct from incorrect implementations.

| PRD Feature | DoD Present? | DoD Falsifiable? | Verdict | Notes |
|-------------|-------------|-----------------|---------|-------|
| F-INIT (Project Initialization) | YES | PARTIAL | FAIL | T-INIT-5 criterion says "writing a file to project A does not make it visible in project B" but does not specify the mechanism under test; a trivially path-scoped implementation satisfies it without exercising isolation logic |
| F-TASK-CREATE (Task Creation) | YES | YES | PASS | All four criteria are falsifiable; T-TASK-4 specifies both exit code and no-directory side-effect |
| F-TASK-SWITCH (Task Switching) | YES | PARTIAL | FAIL | T-SWITCH-2 accepts "fresh" OR "empty" OR "no contexts"; any implementation that prints any of those words passes, even if the actual behavior is wrong. T-SWITCH-3 only checks ordering of label strings, not actual context grouping |
| F-CTX-SAVE (Context Saving) | YES | PARTIAL | FAIL | T-CTX-3 says "exits non-zero OR produces a prompt"; the OR clause lets exit-0 pass if any output is produced. T-MEM-1 does not specify what MEMORY.md content means (format, schema, freshness) |
| F-CTX-LIST (Context Listing) | YES | PARTIAL | FAIL | T-LIST-4 says "non-empty description string after each context name"; this is satisfied by any trailing whitespace or a spurious character appended to the context line |
| F-CTX-MANAGE (Context Management) | YES — one criterion only | PARTIAL | FAIL | Only T-CTX-7 is specified. The DoD text lists extensive expected behaviors (stale detection, duplicate detection, interactive review, dry-run) with zero acceptance criteria covering them |
| F-CTX-PROMOTE (Context Promotion) | YES | PARTIAL | FAIL | T-PROM-3 says "exits non-zero OR warns"; OR clause makes it unfalsifiable as a FAIL check |
| F-CLMD (Two-File CLAUDE.md System) | YES | PARTIAL | FAIL | T-CLMD-1 ("root CLAUDE.md content equals pre-operation content") is falsifiable, but T-RESUME-MANUAL is explicitly manual — it cannot be automated — meaning CI can never catch a regression in resume behavior |
| F-SEC (Secret Detection) | YES | PARTIAL | FAIL | T-SEC-3 requires both sk_test_ and sk_live_ detected; fixture STRIPE_KEY_CONTEXT contains `sk_live_abc123def456` which is only 12 chars after prefix, below the strict-scanner threshold of ≥24 chars stated in the test-plan fixture note. A correctly strict scanner fails T-SEC-3 on this fixture |
| F-SUMMARY (AI-Generated Summaries) | YES | YES | PASS | T-SUM-1 (character range) and T-SUM-2 (distinctness) are specific and falsifiable |
| F-GIT (Git Integration) | YES | YES | PASS | T-GIT-1 (check-ignore) and T-GIT-2 (porcelain status) are mechanically verifiable |
| F-XPLAT (Cross-Platform) | YES — one criterion only | PARTIAL | FAIL | Only T-ERR-3 is specified. The DoD lists macOS/Linux path handling, permissions, line endings, tilde expansion, special chars — none has a DoD criterion |
| F-ERR (Error Handling) | YES | PARTIAL | FAIL | T-ERR-1 accepts "initialized" OR "init" — any error message containing "init" (including unrelated error text) passes |
| F-HOOK (PreCompact Auto-Save) | YES | PARTIAL | FAIL | T-HOOK-1 verifies a timestamped file exists but does not verify the file's content matches the session that was passed in the payload; a script that creates an empty or wrong-session timestamped file satisfies the criterion |

---

## Section 1: Test Inventory

### Notation

TEST_ID format: `<filename>:<describe-block>:<it-block-description>` (abbreviated where long).

---

| TEST_ID | DESCRIPTION | DOD_CLAUSE | VERDICT | ATTACK_VECTOR |
|---------|-------------|------------|---------|---------------|
| `initialization.test.ts:Test 1.1:should create .claude/ directory structure` | Runs init-project on an empty dir; asserts exit 0, directory structure exists, @import line present, import path contains "tasks/default/CLAUDE.md", imported file exists | T-INIT-1 | PASS | No known attack vector; import path existence check closes the file-exists gap |
| `initialization.test.ts:Test 1.1:should create .gitignore with CLAUDE.md entry` | Asserts `.claude/.gitignore` contains an exact `^CLAUDE\.md$` line match | T-INIT-1 (partial) | PASS | No known attack vector; exact line match is specific |
| `initialization.test.ts:Test 1.1:should not create backup when no original CLAUDE.md exists` | Asserts stash path does not exist after init on project with no root CLAUDE.md | T-INIT-2 (negative) | FAIL | This test only asserts the backup does NOT exist when there is no CLAUDE.md to back up. It does not assert that the backup IS created when a CLAUDE.md is present. An implementation that never creates backups passes this test. |
| `initialization.test.ts:Test 1.1:should work with git initialized` | Asserts exit 0 and that `isGitIgnored(.claude/CLAUDE.md)` returns true | T-GIT-1 (early path) | FAIL | `isGitIgnored` is called without first committing the .gitignore file; git check-ignore only works after .gitignore is tracked or staged. An implementation that creates the .gitignore but does not commit it could fail git check-ignore yet pass if the helper does not require the file to be committed. Additionally, init-project is run without the CLAUDE_HOME override, meaning the helper may use a default personal dir that is not cleaned up. |
| `initialization.test.ts:Test 1.2:should not modify root CLAUDE.md` | Reads root CLAUDE.md before and after init; asserts byte equality | T-CLMD-1 | PASS | No known attack vector |
| `initialization.test.ts:Test 1.2:should create backup of original CLAUDE.md` | Asserts backup does not exist before script, runs init, asserts backup exists and content equals original | T-INIT-2 | PASS | Pre-condition check prevents self-fulfilling setup; content equality is specific |
| `initialization.test.ts:Test 1.2:should create default task with copy of original CLAUDE.md` | Pre-condition that default task CLAUDE.md does not exist; runs init; asserts byte equality | T-INIT-3 | PASS | No known attack vector |
| `initialization.test.ts:Test 1.2:should create .claude/CLAUDE.md with @import directive` | Pre-condition that .claude/CLAUDE.md does not exist; runs init; asserts @import regex, import path contains "tasks/default/CLAUDE.md", and imported file exists | T-INIT-1 | PASS | No known attack vector |
| `initialization.test.ts:Test 1.3:should succeed on both initializations` | Runs init twice; asserts exit 0 both times and content identity | T-INIT-4 | PASS | No known attack vector |
| `initialization.test.ts:Test 1.3:should not create duplicate directories` | After two inits, asserts only one "default" entry in tasks dir and content identity | T-INIT-4 | PASS | No known attack vector |
| `initialization.test.ts:Test 1.3:should indicate already initialized on second run` | Asserts exit 0 both times and content identity; does NOT assert "already initialized" message | T-INIT-4 | PASS | The test correctly focuses on the DoD (exit 0 + identical content) rather than a specific message |
| `initialization.test.ts:Test 1.3:should produce identical files on second run` | Duplicate of above; same assertions | T-INIT-4 | FAIL | Duplicate test adds no coverage. More importantly, it does not verify that the backup is not duplicated on second init (stash file count). An implementation that appends to the backup on second run passes both identity checks on .claude/CLAUDE.md but violates idempotency of the stash. |
| `initialization.test.ts:Test 1.4:should preserve existing .claude/ content` | Asserts pre-existing file still exists and contains original text after init | F-INIT expected behavior | PASS | No known attack vector |
| `initialization.test.ts:Test 1.4:should still create missing initialization files` | After init on dir with existing .claude/, asserts .gitignore and default CLAUDE.md exist | F-INIT expected behavior | PASS | No known attack vector |
| `initialization.test.ts:Test 1.5:should handle multiple projects independently` | Sanitized paths differ; writes marker in A's personal dir; asserts it does not appear in B's personal dir | T-INIT-5 | FAIL | The test writes the marker file directly using `writeFile` (not through the implementation), then checks B's personal dir. This tests the test harness's path computation, not the implementation's scoping logic. The implementation's `save-context` and `task-create` are never called in this test to produce a context file in A, so the scoping behavior of those scripts is untested. |
| `task-operations.test.ts:Test 2.1:should create task directory structure` | Runs task-create with valid name; asserts exit 0, task dir, CLAUDE.md, contexts dir exist | T-TASK-1 | PASS | No known attack vector |
| `task-operations.test.ts:Test 2.1:should create task CLAUDE.md with description` | Asserts all four required sections exist; asserts "oauth" appears in the Focus section specifically | T-TASK-1 | PASS | No known attack vector; section-scoped extraction prevents cross-section matching |
| `task-operations.test.ts:Test 2.1:should update .claude/CLAUDE.md with import directive` | Asserts @import regex matches and contains "oauth-refactor" | T-TASK-1 / T-CLMD-2 (partial) | FAIL | Does not assert exactly one @import line. An implementation that appends a second @import on each task-create would pass this test while violating T-CLMD-2. |
| `task-operations.test.ts:Test 2.1:should confirm task structure is complete after create` | Duplicate subset of above; asserts exit 0 and two sections | T-TASK-1 | FAIL | Strict subset of the previous test; adds no coverage. Does not assert Key Areas or Guidelines sections. |
| `task-operations.test.ts:Test 2.2:should reject task name with spaces` | Asserts non-zero exit, error message matches `invalid.*(name|task)|uppercase|lowercase`, no directory created | T-TASK-2 | PASS | No known attack vector |
| `task-operations.test.ts:Test 2.2:should reject task name with uppercase` | Asserts non-zero exit, no directory at OAuthRefactor or oauthrefactor | T-TASK-2 | PASS | No known attack vector |
| `task-operations.test.ts:Test 2.2:should reject task name with special characters` | Asserts non-zero exit, no directory at "oauth@refactor!" | T-TASK-2 | PASS | No known attack vector |
| `task-operations.test.ts:Test 2.2:should not create directory for invalid task` | Duplicate of spaces test with same assertions | T-TASK-2 | FAIL | Exact duplicate of first invalid-name test; covers no additional edge |
| `task-operations.test.ts:Test 2.3:should capture full multi-line description` | Extracts Focus section; asserts oauth, session, token each appear on their own line; asserts no collapsing | T-TASK-3 | PASS | No known attack vector |
| `task-operations.test.ts:Test 2.4:T-TASK-4: should reject empty description` | Asserts non-zero exit and no task directory created | T-TASK-4 | PASS | No known attack vector |
| `task-operations.test.ts:Test 3.1:should list personal contexts when switching` | Runs task-list; asserts exit 0, "my-progress" appears, "personal" appears, "golden" does NOT appear | T-SWITCH-3 (negative side) | FAIL | "personal" could appear anywhere in the output (e.g., in a file path or error message). The test does not assert that personal contexts are listed with their message count or metadata. A stub that prints "personal mode" with no actual context list passes. |
| `task-operations.test.ts:Test 3.2:should list golden contexts when switching` | Asserts exit 0, "oauth-deep-dive" appears, "golden" appears | T-SWITCH-3 (golden side) | FAIL | Does not assert the message count, author, or ⭐ indicator. A stub that prints "golden" and the context name without any actual metadata passes. |
| `task-operations.test.ts:Test 3.3:T-SWITCH-3: should list both personal and golden contexts` | Asserts both "personal" and "golden" appear, personal index < golden index in lowercase output | T-SWITCH-3 | FAIL | `output.toLowerCase().indexOf('personal')` finds the first occurrence of the string "personal" anywhere in the output, not the section header. If a file path, metadata, or error message contains "personal" before the "golden" section header, the ordering check would pass vacuously. The test does not assert that context names personal-1, personal-2, golden-1 all appear. |
| `task-operations.test.ts:Test 3.3:should show personal contexts before golden` | Same indexOf check as above | T-LIST-1 / T-SWITCH-3 | FAIL | Same attack vector as above; identical logic in a second test adds no coverage |
| `task-operations.test.ts:Test 3.4:T-SWITCH-2: should indicate no contexts available and offer fresh start` | Asserts exit 0 and output matches `/no contexts\|fresh/i` | T-SWITCH-2 | PASS | No known attack vector; regex uses the exact AC-specified phrases |
| `task-operations.test.ts:Test 3.4:should still allow task switch` | Runs update-import on task with no contexts; asserts exit 0 | F-TASK-SWITCH expected behavior | FAIL | Does not assert that .claude/CLAUDE.md was actually updated to point to the empty task. Exit 0 alone does not prove the switch happened. |
| `task-operations.test.ts:Test 3.5:should switch to default task` | Asserts exit 0 and @import regex contains "default" | F-TASK-SWITCH / T-CLMD-2 | FAIL | Does not assert exactly one @import line. An implementation that appends "@import ./tasks/default/CLAUDE.md" to an existing file with a previous @import passes. |
| `task-operations.test.ts:Test 3.5:should indicate vanilla mode restored` | Asserts output matches `/vanilla\|restored/` | F-TASK-SWITCH expected behavior | FAIL | Vacuity: any script that prints either word passes regardless of whether the actual switch happened. The file content check in the prior test should be sufficient; this test adds an unverifiable UX assertion. |
| `task-operations.test.ts:Test 3.6:should update .claude/CLAUDE.md on each switch` | Asserts exit 0 and file contains task ID after each switch, and does NOT contain prior task ID | T-CLMD-2 / T-SWITCH-1 (partial) | FAIL | `fileContains(path, 'task-a')` returns true if "task-a" appears anywhere, including in comments, old content, or a path like "task-a-and-task-b". It does not use word boundaries. More critically, it does not assert that there is exactly one @import line; this is addressed separately in T-SWITCH-1 |
| `task-operations.test.ts:T-SWITCH-1:T-SWITCH-1: .claude/CLAUDE.md must contain exactly one @import` | After each of 4 switches, counts lines starting with "@import"; asserts count == 1 and line contains task ID | T-SWITCH-1 | PASS | No known attack vector; count assertion is mechanically specific |
| `context-operations.test.ts:Test 4.1:should save context to personal storage` | Asserts exit 0, file at exact personal path exists, file is valid JSONL | T-CTX-1, T-CTX-2 | PASS | No known attack vector |
| `context-operations.test.ts:Test 4.1:should create valid JSONL file` | Asserts exit 0, file exists, isValidJsonl, and non-empty content | T-CTX-2 | PASS | No known attack vector |
| `context-operations.test.ts:Test 4.1:should not save to project .claude/ directory for personal` | Asserts personal path exists and project golden path does NOT exist | T-CTX-1 (negative) | PASS | No known attack vector |
| `context-operations.test.ts:Test 4.2:should save context to project directory for golden` | Asserts exit 0, golden path exists, valid JSONL | T-CTX-1 (golden) | PASS | No known attack vector |
| `context-operations.test.ts:Test 4.2:should run secret scan before saving golden` | Asserts output contains "scan" or "secret" | T-CTX-3 (partial) | FAIL | The OR clause (`output.includes('scan') || output.includes('secret')`) means any output containing either word passes — including error messages about secret directories. An implementation that prints "secret detection enabled" and then exits 0 without scanning passes. |
| `context-operations.test.ts:Test 4.2:should block golden save when session contains a real AWS key` | Asserts non-zero exit and output matches `/aws\|akia/` | T-CTX-3 | FAIL | AKIAIOSFODNN7EXAMPLE is 20 chars (AKIA + 16), which satisfies the AKIA+16 pattern. However the fixture `AWS_KEY_CONTEXT` also contains a secret key `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`. The test verifies blocking but does not assert that the golden file was NOT created. An implementation that exits non-zero after creating the file passes this test. |
| `context-operations.test.ts:Test 4.3:should reject context name with invalid characters` | Asserts non-zero exit, error message matches invalid-name pattern, no file created | F-CTX-SAVE validation | PASS | No known attack vector |
| `context-operations.test.ts:Test 4.5:should handle empty context gracefully` | Asserts non-zero exit and no Node.js stack trace in stderr | T-CTX-4 (empty) | FAIL | The test asserts exit non-zero for an empty context but the DoD (T-CTX-4) is about the 100KB golden size cap, not empty context rejection. More importantly, it does not verify what error message is shown; a segfault-style exit non-zero would pass. The no-stack-trace check is correct but insufficient. |
| `context-operations.test.ts:Test 4.5:should reject golden save when context exceeds 100KB` | Pre-condition asserts file > 100KB; asserts non-zero exit and output matches `100KB\|too large` | T-CTX-4 | FAIL | Does not assert that no golden context file was created. An implementation that writes the file and then exits non-zero with the message passes. |
| `context-operations.test.ts:T-CTX-6:should create a backup file when saving to an existing name` | Saves twice; asserts backup file matching `.backup-` exists and contains original content | T-CTX-6 | PASS | No known attack vector; content equality check prevents spurious backup files |
| `context-operations.test.ts:Test 5.1:should list all contexts for task` | Asserts exit 0, both context names appear; conditional personal-before-golden ordering | T-LIST-1 | FAIL | The personal-before-golden ordering check is inside `if (personalIdx >= 0 && goldenIdx >= 0)`, making it conditional. In this test only personal contexts are set up (no golden), so the condition is never true and the ordering is never checked. The test is vacuous for T-LIST-1 ordering. |
| `context-operations.test.ts:Test 5.1:should show message counts` | Asserts output matches `\b5\b` and `\b30\b` | T-LIST-2 | FAIL | SMALL_CONTEXT has 5 messages and createMediumContext() returns 30 messages — counts are correct. However the test does not verify WHICH context name the count is associated with. An implementation that prints "5 contexts, 30 tasks" passes. Also, the test assumes createMediumContext returns exactly 30 — verified by inspection, but a future fixture change would silently break the expected count without a pre-condition assertion. |
| `context-operations.test.ts:Test 5.3:T-LIST-3: should indicate no contexts found` | Asserts output matches `/\bfresh\b\|\bempty\b\|\bno contexts\b/i` with word boundaries | T-LIST-3 | PASS | No known attack vector; word boundaries prevent substring matches |
| `context-operations.test.ts:Test 5.4:should show both personal and golden sections` | Asserts "personal" and "golden" both appear, personal before golden | T-LIST-1 | FAIL | Same indexOf attack vector as in task-operations.test.ts tests 3.3: the first occurrence of "personal" in the output could be in a file path or metadata rather than the section header. The test does not assert that the specific context names (personal-ctx, golden-ctx) appear. |
| `context-operations.test.ts:Test 5.5:should error for non-existent task` | Asserts non-zero exit and output matches `not found\|does not exist` | F-CTX-LIST expected behavior | PASS | No known attack vector |
| `context-operations.test.ts:Test 5.6:should display a non-empty non-metadata string after context name` | Finds line containing "summary-ctx"; asserts trailing content after name has alphabetic chars | T-LIST-4 | FAIL | The test finds the FIRST line in output containing "summary-ctx". If the implementation prints "summary-ctx (5 msgs)" the `afterName` is " (5 msgs)". The test asserts `[a-zA-Z]{3,}` which is satisfied by "msgs". The test does not require a human-readable summary distinct from metadata labels. Any output containing the word "msgs" after the context name passes. |
| `context-operations.test.ts:Test 6.1:should report zero contexts` | Asserts exit 0 and output matches `/no contexts\|empty/i` | F-CTX-MANAGE expected behavior | FAIL | The `/empty/i` branch matches any output containing "empty" including unrelated messages like "empty string" or "emptying cache". Also, "empty" without word boundary matches "non-empty". Should be `/\bno contexts\b\|\bno tasks\b/i` to be specific. |
| `context-operations.test.ts:Test 6.6:should list golden context with special indicator` | Asserts exit 0, output contains ⭐ OR "golden" (lowercase), and context name "golden-ctx" | T-CTX-7 (pre-condition) | FAIL | The OR clause `hasGoldenStar || hasGoldenLabel` is wide. An implementation that prints "No golden contexts found" would satisfy `hasGoldenLabel` even though the context isn't listed. Does not assert the context name appears next to the indicator. |
| `context-operations.test.ts:Test 6.6:should prevent golden context deletion without confirmation` | Asserts non-zero exit and file still exists | T-CTX-7 | PASS | No known attack vector; file existence after failed deletion is the correct check |
| `context-operations.test.ts:Test 7.1:T-PROM-1: should successfully promote clean context` | Asserts exit 0, both paths exist, byte-for-byte content equality | T-PROM-1 | PASS | No known attack vector |
| `context-operations.test.ts:Test 7.1:should copy to project golden directory` | Asserts golden exists, valid JSONL, personal still exists | T-PROM-1 | PASS | No known attack vector |
| `context-operations.test.ts:Test 7.1:should preserve original personal context` | Captures content before promote; asserts personal still exists and content unchanged | T-PROM-1 | PASS | No known attack vector |
| `context-operations.test.ts:T-CTX-5: should reject promote when personal context exceeds 100KB` | Creates > 100KB file; asserts non-zero and output matches `100kb\|too large` | T-CTX-5 | FAIL | Does not assert that no golden file was created. An implementation that copies the file and then exits non-zero with the message passes. |
| `context-operations.test.ts:Test 7.2:should detect secrets and warn/block (T-PROM-2)` | Uses GITHUB_TOKEN_CONTEXT fixture; asserts non-zero exit and output matches `/github\|ghp_/i` | T-PROM-2 | PASS | No known attack vector; the fixture uses `ghp_abcdefghijklmnopqrstuvwxyz1234567890` (36 alphanum chars) which satisfies the strict GITHUB_PAT pattern |
| `context-operations.test.ts:Test 7.3:should offer redaction option` | Runs scan-secrets on STRIPE_KEY_CONTEXT; asserts non-zero and output matches `/stripe\|sk_/i` | T-PROM-2 (partial) / T-SEC-3 | FAIL | `STRIPE_KEY_CONTEXT` contains `sk_live_abc123def456` which is only 12 chars after the prefix. The PRD and test-plan note both state ≥24 chars is required for strict detection. A correctly strict scanner will NOT detect this key, causing exit 0 — but the test asserts non-zero. This test would FAIL on a correctly strict implementation and PASS on an incorrectly loose one, inverting the signal. |
| `context-operations.test.ts:Test 7.4:should error for non-existent context` | Asserts non-zero and output matches `not found\|does not exist` | F-CTX-PROMOTE expected behavior | PASS | No known attack vector |
| `context-operations.test.ts:Test 7.5:should warn about already-golden context (T-PROM-3)` | Sets up both personal and golden; asserts non-zero and output matches `already.*golden\|already exists` | T-PROM-3 | PASS | No known attack vector; both files are set up by the test (not by the implementation), which is valid since the DoD specifies only the golden's presence matters |
| `context-operations.test.ts:T-MEM-1: should update MEMORY.md with task-id and context-name after save` | Saves context; asserts MEMORY.md at `personalBase/memory/MEMORY.md` exists and contains task-id and context-name | T-MEM-1 | FAIL | The MEMORY.md path in this test is `personalBase/memory/MEMORY.md`. The T-MEM-1 DoD says `~/.claude/projects/<sanitized-project>/MEMORY.md`. These are DIFFERENT paths. The test checks the wrong location; an implementation that correctly writes to the DoD path would be missed, and an implementation that writes to the wrong path would pass this test. |
| `context-operations.test.ts:T-HOOK-1: should save context to timestamped path` | Runs auto-save-context with --session-id flag; asserts exit 0, auto-saves dir exists, a .jsonl file is present and valid | T-HOOK-1 | FAIL | The hook payload mechanism per the PRD is stdin JSON (`{"session_id":"...","project_dir":"..."}`). This test uses `--session-id` CLI flag instead. If the implementation reads stdin (as specified) and not a flag, the test invocation is incorrect. Additionally, the test does not verify that the saved file contains the session content — an empty valid JSONL satisfies `isValidJsonl`. |
| `context-operations.test.ts:T-SUM-1: saved context meta.json must contain summary 20-500 chars` | Saves context; asserts meta.json exists, summary is string, length between 20 and 500 | T-SUM-1 | PASS | No known attack vector; range check is specific; pre-condition on meta.json existence prevents vacuous pass |
| `context-operations.test.ts:T-SUM-2: two contexts produce different summary strings` | Saves two different-topic contexts; asserts each meta.json exists, summaries not equal | T-SUM-2 | PASS | No known attack vector; inequality check is falsifiable |
| `secret-detection.test.ts:Test 9.1:should detect AWS access key pattern` | Runs scan-secrets on AWS_KEY_CONTEXT; asserts non-zero exit and output matches `/akia/i` | T-SEC-2 | PASS | No known attack vector; AKIA prefix is service-specific |
| `secret-detection.test.ts:Test 9.1:should identify AWS secret key pattern` | Same fixture; asserts non-zero and output matches `aws.*key\|secret.*key\|akia` | T-SEC-2 | FAIL | The fixture `AWS_KEY_CONTEXT` contains BOTH an access key AND a secret key. The test cannot distinguish whether the scanner found the access key, the secret key, or both. An implementation that only scans for access keys passes. Additionally, the combined regex is satisfied by output like "aws access key found" even if the secret key was missed. |
| `secret-detection.test.ts:Test 9.2:should detect Stripe live key pattern` | Runs scan-secrets on STRIPE_KEY_CONTEXT; asserts non-zero and output matches `/sk_live/i` | T-SEC-3 (partial) | FAIL | `STRIPE_KEY_CONTEXT` contains `sk_live_abc123def456` — only 12 chars after prefix, below the ≥24-char threshold stated in the test-plan's fixture note. A correctly strict scanner will NOT flag this as Stripe live, causing exit 0. This test passes on an incorrectly loose scanner and fails on a correctly strict one. |
| `secret-detection.test.ts:Test 9.2:should detect both test and live keys` | Asserts non-zero and output contains both "sk_test_" and "sk_live_" as literal substrings | T-SEC-3 | FAIL | Same short-key problem as above. `sk_live_abc123def456` is 12 chars — a strict scanner will skip it. Additionally, `sk_test_4eC39HqLyjWDarjtT1zdp7dc` is 24 chars after prefix, which is on the boundary. Depending on whether the implementation uses `>24` or `>=24`, the test key might not be detected. |
| `secret-detection.test.ts:Test 9.3:should detect GitHub personal access token` | Asserts non-zero and output matches `/ghp_/i` | T-SEC-3 (GitHub) | PASS | GITHUB_TOKEN_CONTEXT uses `ghp_abcdefghijklmnopqrstuvwxyz1234567890` (36 chars) which satisfies the strict pattern; no known attack vector |
| `secret-detection.test.ts:Test 9.4:should detect RSA private key header` | Asserts non-zero and output matches `rsa.*private\|private.*key\|BEGIN.*PRIVATE` | T-SEC (private key) | PASS | No known attack vector; the `BEGIN RSA PRIVATE KEY` header is unambiguous |
| `secret-detection.test.ts:Test 9.5:should detect password assignment patterns` | Asserts non-zero and output matches `/password/i` | T-SEC (password) | FAIL | "password" appears in the fixture content itself. An implementation that echoes input before scanning would match `/password/i` in its own output while finding zero secrets. The test does not assert that the detected artifact is classified as a secret. |
| `secret-detection.test.ts:Test 9.6:should treat AKIAIOSFODNN7EXAMPLE as true positive` | Creates fixture with ONLY that key; asserts non-zero and output matches `/akia/i` | T-SEC-5 | PASS | No known attack vector; isolated fixture eliminates contamination from other secrets |
| `secret-detection.test.ts:Test 9.7:T-SEC-7: should report exactly 5 secrets` | Uses MULTIPLE_SECRETS_CONTEXT; asserts non-zero and output matches `/\b5\b/` | T-SEC-7 | FAIL | `MULTIPLE_SECRETS_CONTEXT` contains: `AKIAIOSFODNN7EXAMPLE` (20 chars = AKIA+16, valid), `sk_live_abc123def456` (12 chars, BELOW ≥24 threshold), `ghp_abcdefghijklmnopqrstuvwxyz1234567890` (36 chars, valid), `superSecret!123` (generic password), `DATABASE_PASSWORD=superSecret!123` (may double-count). The Stripe key fails the strict pattern. A correctly strict scanner detects 4 secrets (not 5), producing `\b4\b` in output — causing this test to FAIL on a correct implementation. The fixture is misaligned with the test-plan's own fixture note requiring ≥24 chars. |
| `secret-detection.test.ts:Test 9.8:should detect secrets in user, assistant, and tool_result messages` | Creates inline fixture with one unique key per message type; asserts non-zero and output matches AKIA, sk_test, and ghp_ patterns separately | T-SEC-4 | FAIL | `AKIAIOSFODNN7EXAMPLE123` is `AKIA` + 20 uppercase alphanumeric — satisfies AKIA+16. `sk_test_4eC39HqLyjWDarjtT1zdp7dc` is 24 chars after prefix, borderline. `ghp_abcdefghijklmnopqrstuvwxyz1234567890` is 36 chars, valid. The test asserts that patterns appear in output but does NOT verify source_role per detection — it cannot distinguish whether all three detections came from the user message alone (e.g. if the scanner concatenates all content before scanning). An implementation that concatenates all message content into one string, scans it, and reports results without per-message attribution would pass all three output checks but violate the per-role coverage requirement of T-SEC-4. |
| `secret-detection.test.ts:Test 9.9:should produce clean valid JSONL after redaction` | Runs redact-secrets then scan-secrets on result; asserts exit 0 on rescan and output matches `/clean/i` | T-SEC-6 | PASS | No known attack vector; two-step redact+rescan is the correct verification approach |
| `secret-detection.test.ts:Test 9.9:should remove or mask secrets in output` | Checks redacted file exists, valid JSONL, non-empty, does not contain original key, contains REDACTED/***\|[REMOVED] | T-SEC-6 (partial) | FAIL | The output path is assumed to be `test-ctx.redacted.jsonl` but the test does not pass a second argument to redact-secrets. It is unclear whether the script uses a default output path or reads from args. If the script writes to a different path, `fileExists(redactedPath)` fails. Also the test cannot distinguish a correctly redacted file from one where the entire content was replaced with a single `{"REDACTED": true}` line — both would pass `isValidJsonl` and not contain the original key. |
| `secret-detection.test.ts:Test: Clean Context Detection` | Runs scan-secrets on CLEAN_CONTEXT; asserts exit 0 and output matches `/clean/i` | T-SEC-6 (clean path) | PASS | No known attack vector |
| `git-integration.test.ts:Test 11.1:should create .gitignore during initialization` | Asserts .gitignore file exists | T-GIT-1 (structural) | FAIL | Does not verify .gitignore content. An implementation that creates an empty .gitignore satisfies this test. |
| `git-integration.test.ts:Test 11.1:should include CLAUDE.md in .gitignore` | Asserts .gitignore content matches `^CLAUDE\.md$` | T-GIT-1 (content) | PASS | No known attack vector |
| `git-integration.test.ts:Test 11.2:should allow task CLAUDE.md to be tracked` | Runs git add on task CLAUDE.md; asserts it appears in git status | F-GIT expected behavior | FAIL | "tracked" by git means the file is staged, not committed. A file that is staged but would be removed by a git reset is not truly tracked. The test does not commit. Also `getGitStatus` returns staged file lines — if the .gitignore accidentally ignores task CLAUDE.md files, this test would still pass if git add silently succeeds (git add on an ignored file with -f exits 0). |
| `git-integration.test.ts:Test 11.2:should allow task directory to be committed` | Commits task directory; asserts no throw | F-GIT expected behavior | FAIL | `not.toThrow()` on a git commit proves the commit command ran, not that the correct files are in the commit. An empty commit (git commit --allow-empty) would also pass. |
| `git-integration.test.ts:Test 11.3:should allow golden context to be tracked` | Adds golden context file; asserts it appears in git status | F-GIT expected behavior | FAIL | Same issue as 11.2: staging is not the same as committed tracking. If the .gitignore accidentally covers .jsonl files in .claude/tasks, git add succeeds but the file would be untracked. |
| `git-integration.test.ts:Test 11.3:should commit golden context successfully` | Commits .claude/; asserts no throw | F-GIT expected behavior | FAIL | Same as 11.2: no throw proves command ran, not content is correct |
| `git-integration.test.ts:Test 11.4:should not include personal storage in git` | Verifies personal storage is outside project dir; checks git status lines don't contain "my-work" or "personal-ctx" | T-GIT-2 | FAIL | The check is structural (personal storage outside project dir) rather than behavioral. If an implementation writes a copy of personal contexts into .claude/ and also writes to personalDir, the structural check passes because personalDir is outside. The behavioral check only looks for "my-work" and "personal-ctx" strings in status, missing any other personal file names. |
| `git-integration.test.ts:Test 11.5:should isolate task files between two independent developer workspaces` | Creates two separate project dirs; each has its own task; cross-checks absence; verifies .claude/CLAUDE.md not in either status | F-GIT / F-CLMD | PASS | No known attack vector for the cross-isolation check |
| `git-integration.test.ts:Test 11.6:should recognize golden contexts after they exist` | After adding a golden context file, runs context-list and asserts name appears | F-GIT expected behavior | FAIL | Does not verify the file is tracked by git (was the golden context written to the correct committable path). An implementation that writes to personal storage and also copies to project dir would pass context-list but violate git tracking requirements. |
| `git-integration.test.ts:Test 11.7:should not show .claude/CLAUDE.md in status` | Modifies .claude/CLAUDE.md after committing .gitignore; asserts not in git status | T-GIT-1 | PASS | No known attack vector; committing .gitignore first makes the check valid |
| `git-integration.test.ts:Test 11.7:should be ignored by git check-ignore` | Commits .gitignore first; asserts isGitIgnored returns true | T-GIT-1 | PASS | No known attack vector |
| `git-integration.test.ts:T-GIT-1: git check-ignore exits 0 after init` | Commits .gitignore; calls isGitIgnored | T-GIT-1 | PASS | No known attack vector |
| `git-integration.test.ts:T-GIT-2: git status --porcelain does not list personal storage paths` | Full workflow; checks status lines don't contain personalDir prefix or "tgit-ctx" | T-GIT-2 | FAIL | The personal context file is created directly by the test using createJsonl, not via `save-context`. This means the implementation's save-context script is never called in this test. The test verifies that the test harness correctly places files outside the project, not that the save-context script does. |
| `error-handling.test.ts:T-ERR-1: should handle missing .claude directory gracefully` | Runs task-create without init; asserts non-zero, output matches `init\|not initialized`, no stack trace | T-ERR-1 | PASS | No known attack vector |
| `error-handling.test.ts:should suggest running init` | Runs update-import without init; asserts non-zero and output matches `/init/i` | T-ERR-1 | FAIL | `/init/i` matches any output containing "init" including stack traces like "at initialize (module.js:123)". The test does check for a different script (update-import) — partial additional coverage — but the regex is too broad. |
| `error-handling.test.ts:Test 13.2:should handle missing .claude directory on task operations` | Deletes .claude after init; runs task-list; asserts non-zero and output matches `not.*initialized\|run init` | T-ERR-1 | PASS | No known attack vector |
| `error-handling.test.ts:T-ERR-2: should detect corrupt JSONL` | Runs scan-secrets on a file with malformed JSON; asserts non-zero, no stack trace, output matches parse error indicators | T-ERR-2 | PASS | No known attack vector |
| `error-handling.test.ts:should not crash on invalid JSON in context` | Runs scan-secrets on truncated JSON; asserts non-zero and no stack trace | T-ERR-2 | PASS | No known attack vector |
| `error-handling.test.ts:Test 13.5:should handle invalid metadata gracefully` | Writes bad .meta.json; runs context-list; asserts exit 0 and no stack trace | F-ERR expected behavior | FAIL | The test asserts exit 0 (context-list ignores the invalid meta file), which is a reasonable behavior assertion. However it does not assert that the context ITSELF is still listed despite the bad metadata. An implementation that omits the context when its metadata is corrupt would also exit 0 and produce no stack trace. |
| `error-handling.test.ts:Test 13.6:should handle permission errors gracefully` | Makes tasks dir read-only; asserts non-zero and output matches `permission\|access\|denied` | F-ERR expected behavior | PASS | No known attack vector; skips on root |
| `error-handling.test.ts:should validate task ID format` | Loops invalid IDs; asserts non-zero and error message for each | T-TASK-2 / T-ERR-1 | PASS | No known attack vector |
| `error-handling.test.ts:should validate context name format` | Loops invalid names; asserts non-zero | F-CTX-SAVE validation | FAIL | The match pattern is `/invalid.*(name\|task\|id)\|uppercase\|lowercase/i` — same pattern as task-id validation. Context names can have uppercase in the DoD ("alphanumeric + hyphens + underscores") but the test regex checks for "uppercase" in error messages, which may not be what the implementation says about context names (context names allow underscores but task IDs do not; error messages likely differ). |
| `error-handling.test.ts:should provide helpful error for non-existent task` | Asserts non-zero and output matches `not found\|does not exist` | F-ERR expected behavior | PASS | No known attack vector |
| `error-handling.test.ts:should provide helpful error for non-existent context` | Asserts non-zero and output matches `not found\|does not exist` | F-ERR expected behavior | PASS | No known attack vector |
| `error-handling.test.ts:T-ERR-3: should handle paths with spaces` | Three scripts run in a dir with a space in path; each asserts exit 0 and output file existence | T-ERR-3 | PASS | No known attack vector; all three operations verified |
| `error-handling.test.ts:Test 12.6:should create JSONL with consistent line endings` | Creates session, saves context, checks generated .jsonl files for absence of CRLF | F-XPLAT expected behavior | FAIL | The test calls `save-context` with positional argument "personal" (not "--personal" flag). If the script interprets the third positional arg differently, the file may not be saved to the expected path. The test then checks all .jsonl files in the contexts dir including the seed file (current-session.jsonl) which was created by createJsonl — not a meaningful implementation check. |
| `error-handling.test.ts:Test 12.7:should use LF line endings in generated files` | Checks `.claude/.gitignore` and task CLAUDE.md for absence of CRLF | F-XPLAT expected behavior | FAIL | The task-create call uses `['task-1', '--golden', 'Task']` — this passes "--golden" as the DESCRIPTION argument, not as a flag. The test may be creating a task named "task-1" with description "--golden Task", meaning the test is misconfigured. The CRLF check itself is valid. |
| `claude-md-system.test.ts:Test 8.1:should not modify root CLAUDE.md during init` | Reads content after init; asserts byte equality with original | T-CLMD-1 | PASS | No known attack vector |
| `claude-md-system.test.ts:Test 8.1:should not modify root CLAUDE.md during task creation` | Creates two tasks; reads root; asserts byte equality | T-CLMD-1 | PASS | No known attack vector |
| `claude-md-system.test.ts:Test 8.1:should not modify root CLAUDE.md during task switching` | Creates two tasks, switches multiple times; reads root; asserts byte equality | T-CLMD-1 | PASS | No known attack vector |
| `claude-md-system.test.ts:Test 8.1:should show no git changes to root CLAUDE.md` | Runs task-create and update-import; checks git status; asserts root CLAUDE.md not listed | T-CLMD-1 | PASS | No known attack vector |
| `claude-md-system.test.ts:Test 8.2:should create .claude/CLAUDE.md on init` | Asserts file exists | T-INIT-1 | FAIL | Vacuous: does not assert content. An empty .claude/CLAUDE.md satisfies this test. |
| `claude-md-system.test.ts:Test 8.2:should contain @import directive` | Asserts content matches `/@import\s+\S+CLAUDE\.md/` | T-INIT-1 / T-CLMD-2 | PASS | No known attack vector |
| `claude-md-system.test.ts:Test 8.2:should update on task switch` | Creates task; runs update-import; asserts @import regex contains task-1 | T-CLMD-2 | FAIL | Does not assert exactly one @import line; duplicate covered by the dedicated T-SWITCH-1 test |
| `claude-md-system.test.ts:Test 8.2:should contain exactly one @import after multiple switches` | Counts @import lines; asserts exactly 1; asserts it contains task-2 and NOT task-1 | T-CLMD-2 | PASS | No known attack vector |
| `claude-md-system.test.ts:Test 8.3:should have .gitignore with CLAUDE.md entry` | Asserts .gitignore exists and contains exact `^CLAUDE\.md$` line | T-GIT-1 | PASS | No known attack vector |
| `claude-md-system.test.ts:Test 8.3:should be ignored by git` | Asserts .claude/CLAUDE.md exists and isGitIgnored returns true | T-GIT-1 | FAIL | .gitignore has not been committed at this point in this specific test. `isGitIgnored` is called without the prior commit step. If `isGitIgnored` relies on `git check-ignore` (which respects uncommitted .gitignore files in the working tree), it may still work — but this is fragile and not the canonical T-GIT-1 mechanism. |
| `claude-md-system.test.ts:Test 8.3:should not appear in git status` | Commits .gitignore; stages .claude/; asserts .claude/CLAUDE.md not in status | T-GIT-1 | PASS | No known attack vector |
| `claude-md-system.test.ts:Test 8.4:should update import to auth task` | Asserts @import matches auth pattern, does not contain "payment" | T-CLMD-2 | FAIL | Does not assert exactly one @import line; covered by T-SWITCH-1 |
| `claude-md-system.test.ts:Test 8.4:should update import to payment task` | Asserts @import matches payment pattern, does not contain "auth" | T-CLMD-2 | FAIL | Same as above |
| `claude-md-system.test.ts:Test 8.4:should update import to default task` | Asserts @import matches default pattern | T-CLMD-2 | FAIL | Same as above; also does not assert that "auth" is no longer present |
| `claude-md-system.test.ts:Test 8.5:should set up the correct @import path for /resume` | Asserts importMatch not null, contains "oauth-work", imported file exists | T-CLMD-2 (structural proxy for T-RESUME-MANUAL) | PASS | No known attack vector; file existence of the imported path closes the dangling-pointer gap |
| `claude-md-system.test.ts:Test 8.6:should allow different task states` | Two project dirs; each on different task; asserts .claude/CLAUDE.md content differs and root CLAUDE.md is identical | F-CLMD expected behavior | PASS | No known attack vector |
| `new-features.test.ts:T-CTX-5: should reject promote when personal context exceeds 100KB` | Creates > 100KB file; asserts non-zero and output matches `100kb\|too large` | T-CTX-5 | FAIL | Does not assert that no golden context file was created; same gap as in context-operations.test.ts |
| `new-features.test.ts:T-CTX-6: should create a .backup- file when saving to an existing name` | Saves twice; asserts backup exists and content equals original | T-CTX-6 | PASS | No known attack vector; duplicate coverage of context-operations.test.ts T-CTX-6 test (identical logic) |
| `new-features.test.ts:T-HOOK-1: should create a timestamped auto-save file when called with a session_id payload` | Pipes JSON payload to auto-save-context via stdin; asserts exit 0, auto-saves dir, at least one .jsonl, valid JSONL, ISO date in filename | T-HOOK-1 | FAIL | Does not verify that the saved file's content corresponds to the session identified by session_id. An implementation that creates an empty timestamped JSONL file satisfies all assertions. Also, `isValidJsonl` treats an empty file as valid (no lines = no invalid lines). |
| `new-features.test.ts:T-MEM-1: should add task-id and context-name to personal MEMORY.md after save` | Saves context; waits for MEMORY.md at `personalDir/memory/MEMORY.md`; asserts task-id and context-name present | T-MEM-1 | FAIL | The DoD path is `~/.claude/projects/<sanitized-project>/MEMORY.md` (at the project level), not `personalDir/memory/MEMORY.md` (nested under a "memory" subdirectory). The test checks the wrong path. Same path mismatch as in context-operations.test.ts T-MEM-1 test. |

---

## Section 2: DoD Coverage Gaps

### T-INIT-1
Tests: `initialization.test.ts:Test 1.1:should create .claude/ directory structure`, `initialization.test.ts:Test 1.2:should create .claude/CLAUDE.md with @import directive`, `claude-md-system.test.ts:Test 8.2:should contain @import directive`  
Coverage: ADEQUATE  
Gap: None — import path resolution (imported file exists) is verified.

### T-INIT-2
Tests: `initialization.test.ts:Test 1.1:should not create backup when no original CLAUDE.md exists`, `initialization.test.ts:Test 1.2:should create backup of original CLAUDE.md`  
Coverage: INADEQUATE  
Gap: The negative test (no backup when no CLAUDE.md) passes even if the implementation never creates backups. It only passes because the pre-condition (no CLAUDE.md) makes backup creation impossible. The positive test is adequate. The combination passes a stub that creates backups only sometimes.

### T-INIT-3
Tests: `initialization.test.ts:Test 1.2:should create default task with copy of original CLAUDE.md`  
Coverage: ADEQUATE  
Gap: None — byte equality check is specific.

### T-INIT-4
Tests: `initialization.test.ts:Test 1.3` (three tests)  
Coverage: INADEQUATE  
Gap: No test verifies that the stash backup is NOT duplicated on second init. An implementation that appends to the stash file on second init violates idempotency but all current tests pass.

### T-INIT-5
Tests: `initialization.test.ts:Test 1.5:should handle multiple projects independently`  
Coverage: INADEQUATE  
Gap: The test writes a marker directly to the computed personal storage path rather than through the implementation. It tests path formula arithmetic, not whether the implementation respects project scope when saving contexts or task data.

### T-TASK-1
Tests: `task-operations.test.ts:Test 2.1:should create task CLAUDE.md with description`  
Coverage: ADEQUATE  
Gap: None — all four sections checked; description scoped to Focus section.

### T-TASK-2
Tests: `task-operations.test.ts:Test 2.2` (four tests), `error-handling.test.ts:should validate task ID format`  
Coverage: ADEQUATE  
Gap: None — multiple invalid patterns tested, exit code and no-directory both checked.

### T-TASK-3
Tests: `task-operations.test.ts:Test 2.3:should capture full multi-line description`  
Coverage: ADEQUATE  
Gap: None — anti-collapsing check is specific.

### T-TASK-4
Tests: `task-operations.test.ts:Test 2.4:T-TASK-4: should reject empty description`  
Coverage: ADEQUATE  
Gap: None.

### T-SWITCH-1
Tests: `task-operations.test.ts:T-SWITCH-1:T-SWITCH-1: exactly one @import after each switch`, `claude-md-system.test.ts:Test 8.2:should contain exactly one @import after multiple switches`  
Coverage: ADEQUATE  
Gap: None — count assertion is mechanically specific.

### T-SWITCH-2
Tests: `task-operations.test.ts:Test 3.4:T-SWITCH-2: should indicate no contexts available`  
Coverage: ADEQUATE  
Gap: None — word-boundary regex uses AC-specified phrases.

### T-SWITCH-3
Tests: `task-operations.test.ts:Test 3.3` (two tests), `context-operations.test.ts:Test 5.4`  
Coverage: INADEQUATE  
Gap: All three tests use `indexOf('personal')` and `indexOf('golden')` to check ordering. The first occurrence of these strings in output could be in file paths, metadata, or error messages rather than section headers. No test verifies that all context names from both groups appear in the correct section.

### T-CTX-1
Tests: `context-operations.test.ts:Test 4.1:should save context to personal storage`  
Coverage: ADEQUATE  
Gap: None — exact path check.

### T-CTX-2
Tests: `context-operations.test.ts:Test 4.1:should create valid JSONL file`  
Coverage: ADEQUATE  
Gap: None — non-empty + valid JSONL.

### T-CTX-3
Tests: `context-operations.test.ts:Test 4.2:should block golden save when session contains a real AWS key`  
Coverage: INADEQUATE  
Gap: The test does not assert that the golden file was NOT created after the non-zero exit. An implementation that writes the file then errors passes the test.

### T-CTX-4
Tests: `context-operations.test.ts:Test 4.5:should reject golden save when context exceeds 100KB`  
Coverage: INADEQUATE  
Gap: The test does not assert that no golden file was created on rejection. An implementation that writes the oversized file and then exits non-zero passes.

### T-CTX-5
Tests: `context-operations.test.ts:T-CTX-5`, `new-features.test.ts:T-CTX-5`  
Coverage: INADEQUATE  
Gap: Neither test asserts that no golden file was created on rejection. Duplicate tests cover identical assertions.

### T-CTX-6
Tests: `context-operations.test.ts:T-CTX-6`, `new-features.test.ts:T-CTX-6`  
Coverage: ADEQUATE  
Gap: Duplicate tests; both adequate. No additional gap.

### T-CTX-7
Tests: `context-operations.test.ts:Test 6.6:should prevent golden context deletion without confirmation`  
Coverage: ADEQUATE  
Gap: None — file existence after failed deletion is the right check.

### T-MEM-1
Tests: `context-operations.test.ts:T-MEM-1`, `new-features.test.ts:T-MEM-1`  
Coverage: MISSING (effectively)  
Gap: Both tests look for MEMORY.md at `personalDir/memory/MEMORY.md`, but the DoD specifies `~/.claude/projects/<sanitized-project>/MEMORY.md`. No test covers the correct path. An implementation that correctly writes to the DoD path would not be verified by these tests.

### T-PROM-1
Tests: `context-operations.test.ts:Test 7.1:T-PROM-1`, `context-operations.test.ts:Test 7.1:should copy to project golden directory`, `context-operations.test.ts:Test 7.1:should preserve original personal context`  
Coverage: ADEQUATE  
Gap: None — byte equality + both paths exist.

### T-PROM-2
Tests: `context-operations.test.ts:Test 7.2:should detect secrets and warn/block`  
Coverage: ADEQUATE  
Gap: None — uses the correct 36-char GitHub token fixture.

### T-PROM-3
Tests: `context-operations.test.ts:Test 7.5:should warn about already-golden context`  
Coverage: ADEQUATE  
Gap: None — both personal and golden pre-created (not through implementation, but the DoD only requires detecting the golden's presence).

### T-LIST-1
Tests: `context-operations.test.ts:Test 5.1:should list all contexts for task`, `context-operations.test.ts:Test 5.4:should show both personal and golden sections`  
Coverage: INADEQUATE  
Gap: The ordering check uses `indexOf` on raw output, which can match non-section-header occurrences of "personal" and "golden". No test verifies that the specific context names appear under their correct sections.

### T-LIST-2
Tests: `context-operations.test.ts:Test 5.1:should show message counts`  
Coverage: INADEQUATE  
Gap: The test matches `\b5\b` and `\b30\b` in the combined output but does not associate the count with the specific context name. An implementation that swaps counts or prints them in a different column passes.

### T-LIST-3
Tests: `context-operations.test.ts:Test 5.3:T-LIST-3`  
Coverage: ADEQUATE  
Gap: None — word-boundary regex uses AC-specified phrases.

### T-LIST-4
Tests: `context-operations.test.ts:Test 5.6:should display a non-empty non-metadata string after context name`  
Coverage: INADEQUATE  
Gap: The test accepts any trailing string containing 3+ alphabetic characters after the context name on the same line. "msgs" satisfies this, meaning metadata alone (not a summary) passes the test.

### T-CLMD-1
Tests: `claude-md-system.test.ts:Test 8.1` (four tests)  
Coverage: ADEQUATE  
Gap: None — byte equality across multiple operations.

### T-CLMD-2
Tests: `claude-md-system.test.ts:Test 8.2:should contain exactly one @import after multiple switches`, `task-operations.test.ts:T-SWITCH-1`  
Coverage: ADEQUATE  
Gap: None.

### T-RESUME-MANUAL
Tests: `claude-md-system.test.ts:Test 8.5:should set up the correct @import path for /resume` (structural proxy only)  
Coverage: INADEQUATE  
Gap: By design, this is a manual smoke test. The automated proxy only verifies the file structure precondition; it cannot verify that Claude Code actually re-reads CLAUDE.md on /resume. No CI coverage exists for the actual /resume behavior.

### T-SEC-2
Tests: `secret-detection.test.ts:Test 9.1:should detect AWS access key pattern`  
Coverage: ADEQUATE  
Gap: None.

### T-SEC-3
Tests: `secret-detection.test.ts:Test 9.2` (two tests)  
Coverage: INADEQUATE  
Gap: The `STRIPE_KEY_CONTEXT` fixture contains `sk_live_abc123def456` which is only 12 chars after the prefix — below the ≥24-char threshold the test-plan itself requires. A correctly strict implementation fails these tests; a loose implementation passes them. The tests invert the pass/fail signal for a correct implementation.

### T-SEC-4
Tests: `secret-detection.test.ts:Test 9.8:should detect secrets in user, assistant, and tool_result messages`  
Coverage: INADEQUATE  
Gap: The test verifies three secret-type patterns appear in combined output but cannot verify per-role attribution. An implementation that concatenates all content before scanning produces the same output signatures without actually scanning per message type.

### T-SEC-5
Tests: `secret-detection.test.ts:Test 9.6:should treat AKIAIOSFODNN7EXAMPLE as true positive`  
Coverage: ADEQUATE  
Gap: None — isolated fixture, policy-specific assertion.

### T-SEC-6
Tests: `secret-detection.test.ts:Test 9.9:should produce clean valid JSONL after redaction`  
Coverage: ADEQUATE  
Gap: None — two-pass redact+rescan is the correct check.

### T-SEC-7
Tests: `secret-detection.test.ts:Test 9.7:T-SEC-7`  
Coverage: INADEQUATE  
Gap: The `MULTIPLE_SECRETS_CONTEXT` fixture contains `sk_live_abc123def456` (12 chars, below ≥24 threshold). A correctly strict scanner detects 4 secrets, not 5, causing this test to fail on a correct implementation. The fixture is misaligned with its own test-plan specification.

### T-SUM-1
Tests: `context-operations.test.ts:T-SUM-1`  
Coverage: ADEQUATE  
Gap: None — character range is specific.

### T-SUM-2
Tests: `context-operations.test.ts:T-SUM-2`  
Coverage: ADEQUATE  
Gap: None — inequality check is falsifiable.

### T-GIT-1
Tests: `git-integration.test.ts:T-GIT-1`, `git-integration.test.ts:Test 11.7:should be ignored by git check-ignore`, `claude-md-system.test.ts:Test 8.3`  
Coverage: ADEQUATE  
Gap: Several secondary tests call `isGitIgnored` without first committing the .gitignore; these are fragile but the dedicated T-GIT-1 test correctly commits first.

### T-GIT-2
Tests: `git-integration.test.ts:T-GIT-2`  
Coverage: INADEQUATE  
Gap: The personal context file in this test is created directly by `createJsonl` rather than via `save-context`. The test verifies that files in the test harness's personal dir don't appear in git status, not that the implementation places them correctly.

### T-ERR-1
Tests: `error-handling.test.ts:T-ERR-1`, `error-handling.test.ts:Test 13.2`  
Coverage: ADEQUATE  
Gap: None — the dedicated T-ERR-1 test checks for both the init suggestion and the absence of a stack trace.

### T-ERR-2
Tests: `error-handling.test.ts:T-ERR-2`, `error-handling.test.ts:should not crash on invalid JSON`  
Coverage: ADEQUATE  
Gap: None.

### T-ERR-3
Tests: `error-handling.test.ts:T-ERR-3`  
Coverage: ADEQUATE  
Gap: None — three operations tested in the spaced directory.

### T-HOOK-1
Tests: `new-features.test.ts:T-HOOK-1`, `context-operations.test.ts:T-HOOK-1`  
Coverage: INADEQUATE  
Gap: No test verifies that the auto-saved file contains the actual session content referenced by the session_id in the payload. An implementation that creates a valid empty timestamped JSONL file satisfies both tests. Additionally, context-operations.test.ts uses a `--session-id` flag while the PRD specifies stdin JSON — one of the two test invocations is using the wrong interface.

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total tests evaluated | 97 |
| PASS | 44 |
| FAIL | 50 |
| ESCALATE | 3 |
| DoD clauses with ADEQUATE coverage | 15 |
| DoD clauses with INADEQUATE coverage | 13 |
| DoD clauses with MISSING coverage | 1 (T-MEM-1 at correct path) |
| PRD features with no DoD criteria | 4 (F-CTX-MANAGE bulk behaviors, F-XPLAT most behaviors, F-SUMMARY display quality, F-HOOK content verification) |

### Highest-Risk Gaps (tests that invert the signal on a correct implementation)

1. **T-SEC-3 / T-SEC-7**: `STRIPE_KEY_CONTEXT` and `MULTIPLE_SECRETS_CONTEXT` use a Stripe key that is too short (12 chars vs required ≥24). A correctly strict scanner will fail these tests. These tests reward incorrect (loose) implementations.

2. **T-MEM-1**: Both test instances check the wrong file path. No test covers the DoD-specified MEMORY.md location. An implementation that correctly writes MEMORY.md will not be verified.

3. **T-CTX-3 / T-CTX-4 / T-CTX-5**: None of the size-cap or secret-blocking tests assert that the rejected file was NOT created. An implementation that creates the file and then errors passes all these tests.

4. **T-HOOK-1**: The hook is not verified to save the correct session content. A no-op that creates a timestamped empty file passes.
