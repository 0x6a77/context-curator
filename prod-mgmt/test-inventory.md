# Test Inventory — Adversarial Red Team Analysis

---

## Section 1 — Test Inventory

| TEST_ID | DESCRIPTION | DOD_CLAUSE | VERDICT | ATTACK_VECTOR |
|---------|-------------|------------|---------|---------------|
| initialization.test.ts:Test1.1/"should create .claude/ directory structure" | Runs init-project, checks .claude, .gitignore, tasks/default/CLAUDE.md exist, then checks .claude/CLAUDE.md contains `@import` | T-INIT-1 | FAIL | **T2 violation**: The @import assertion is only reached if `runScript` returns successfully—there is no explicit `expect(result.exitCode).toBe(0)` before the file assertions. An implementation that exits non-zero but still creates partial files could leave the assertions in an indeterminate state. More critically, `expect(claudeMdContent).toMatch(/@import/)` matches any `@import` substring regardless of what follows—an implementation that emits `@import` followed by a garbage path would pass. The DoD requires the file "must not exist before the script runs" and that the file contains a valid import; this test does not assert the pre-condition, and it does not verify the imported path resolves to an actual file. Missing exit-code assertion (T5). |
| initialization.test.ts:Test1.1/"should create .gitignore with CLAUDE.md entry" | Asserts `fileContains(gitignorePath, 'CLAUDE.md')` after init | (supporting) | FAIL | Missing `expect(result.exitCode).toBe(0)` (T5). `fileContains` does a plain `includes` — a file containing the comment `# CLAUDE.md is ignored` would pass even if the actual ignore rule is missing. No assertion that the entry is an effective gitignore rule, only that the string appears anywhere. |
| initialization.test.ts:Test1.1/"should not create backup when no original CLAUDE.md exists" | Asserts stash backup does not exist after init with no CLAUDE.md | (supporting) | FAIL | Negative assertion only. A stub that never creates a backup anywhere would pass. Missing exit-code assertion (T5). There is no corresponding positive assertion that the system otherwise functioned correctly, so the test passes vacuously if the script crashes before reaching backup logic. |
| initialization.test.ts:Test1.1/"should work with git initialized" | Calls `isGitIgnored` to check `.claude/CLAUDE.md` is ignored | T-GIT-1 | FAIL | `isGitIgnored` uses `git check-ignore` but the test does NOT commit `.claude/.gitignore` before calling it. `git check-ignore` only respects `.gitignore` files that are reachable from the worktree; the `.claude/.gitignore` created by init-project has not been staged or committed. On some git versions and configurations, untracked `.gitignore` files inside subdirectories ARE respected by `git check-ignore`, but this is configuration-dependent and the test does not enforce it. Contrast with the deliberate `gitCommit` step in `git-integration.test.ts:Test11.7/"should be ignored by git check-ignore"`, which correctly commits the `.gitignore` first. Missing exit-code assertion for `runScript` (T5). |
| initialization.test.ts:Test1.2/"should not modify root CLAUDE.md" | Reads root CLAUDE.md after init, asserts it equals `originalContent` | T-CLMD-1 | PASS | No attack vector found—byte-exact equality check is sufficient. |
| initialization.test.ts:Test1.2/"should create backup of original CLAUDE.md" | Asserts backup exists and contents equal `originalContent` | T-INIT-2 | FAIL | Missing `expect(result.exitCode).toBe(0)` (T5). The DoD clause states "backup must not exist before script runs (not created in test setup)." The test does not assert the backup path did NOT exist before calling `runScript`. A stub that creates the backup in a wrong location and also copies to the stash path would still pass. The byte-exact comparison (`expect(backupContent).toBe(originalContent)`) is correct for what it checks, but the pre-condition gap means the test cannot distinguish between the script creating the backup versus the backup pre-existing from a prior run. |
| initialization.test.ts:Test1.2/"should create default task with copy of original CLAUDE.md" | Asserts default task CLAUDE.md exists and equals `originalContent` | T-INIT-3 | FAIL | Missing `expect(result.exitCode).toBe(0)` (T5). The test does not assert the pre-condition that the default task directory did not exist before the script ran—required by the DoD for T-INIT-3 ("character-for-character"). The byte-exact string match is correct. However, a script that writes the wrong content and then overwrites it with the correct content would pass. |
| initialization.test.ts:Test1.2/"should create .claude/CLAUDE.md with @import directive" | Asserts .claude/CLAUDE.md exists and matches `/@import\s+\S+CLAUDE\.md/` | T-INIT-1 | FAIL | The regex `/@import\s+\S+CLAUDE\.md/` matches any non-whitespace string between `@import` and `CLAUDE.md`. An implementation emitting `@import ./../../etc/passwd/CLAUDE.md` would pass. The DoD says the file "must not exist before the script runs"—not asserted. Missing exit-code assertion (T5). |
| initialization.test.ts:Test1.3/"should succeed on both initializations" | Asserts both runs return exitCode 0 | T-INIT-4 | PASS | Exit codes checked. However, the test does not assert file contents are identical after both runs—that is handled by a separate test. No attack vector on this specific assertion. |
| initialization.test.ts:Test1.3/"should not create duplicate directories" | Counts tasks named 'default' after two inits, expects 1 | (supporting) | FAIL | The `readdirSync` counts directory entries named exactly `'default'`. A stub that creates `default`, `default (copy)`, or `DEFAULT` would pass. Missing exit-code assertion on second run (T5). |
| initialization.test.ts:Test1.3/"should indicate already initialized on second run" | Checks output contains 'already', 'exists', or 'initialized' | (supporting) | FAIL | **T1 violation**: OR chain across three alternative strings. An implementation that outputs "The process has already begun" would match 'already'. An implementation that outputs "exists" in a stack trace error message would also pass. This is a content-free assertion. |
| initialization.test.ts:Test1.3/"should produce identical files on second run" | Reads .claude/CLAUDE.md after each init, asserts string equality | T-INIT-4 | PASS | Byte-exact equality, exit code checked on second run. First run exit code not checked (T5 partial miss), but the read would fail if the file didn't exist. No attack vector on the idempotency check itself. |
| initialization.test.ts:Test1.4/"should preserve existing .claude/ content" | Asserts `existing-file.txt` still exists and contains original string | (supporting) | FAIL | Missing exit-code assertion (T5). The test writes the existing file in `beforeEach`, then checks it after init. This is **T3 (self-fulfilling setup)**: the test itself created the artifact it then verifies was "preserved." If the script deletes and recreates the `.claude/` directory, this test would correctly catch it—but only if the init script does not also recreate `existing-file.txt`, which it has no reason to do. The self-fulfilling nature means the test cannot distinguish "preserved" from "script crashed before reaching deletion logic." |
| initialization.test.ts:Test1.4/"should still create missing initialization files" | Asserts .gitignore and default task created despite pre-existing .claude/ | (supporting) | FAIL | Missing exit-code assertion (T5). |
| initialization.test.ts:Test1.5/"should handle multiple projects independently" | Compares sanitized paths, then writes isolation-marker to project 1's personal dir and asserts it doesn't appear in project 2's | T-INIT-5 | FAIL | **T3 (self-fulfilling setup)**: The test itself writes the isolation marker (`writeFile(file1, 'project-1-only')`) and then asserts `file2` doesn't exist. The script under test (`init-project`) is not involved in creating or reading the isolation marker at all. This test validates the file system (two different directories are different directories), not any behavior of the implementation. A null implementation of init-project that does nothing would pass this test. The DoD clause requires that the isolation be a property of the system; this test proves only that `path1 !== path2` as strings. ESCALATE. |
| task-operations.test.ts:Test2.1/"should create task directory structure" | Asserts three directories/files exist after task-create | (supporting) | FAIL | Missing `expect(result.exitCode).toBe(0)` (T5). |
| task-operations.test.ts:Test2.1/"should create task CLAUDE.md with description" | Asserts all four section headers present AND content contains 'oauth' | T-TASK-1 | FAIL | Missing exit-code assertion (T5). The section header regexes (`/^# Task:/m`, etc.) test only that these strings begin a line—they do not test ordering or that each section has content following it. An implementation could emit all four headers on consecutive empty lines. The word 'oauth' check is a single keyword from the description `'Refactoring OAuth implementation in src/auth/'`—an implementation that echoes the raw description as a bullet under `## Focus` without interpreting or templating it would pass. The DoD says "all required sections"—section content is not validated. |
| task-operations.test.ts:Test2.1/"should update .claude/CLAUDE.md with import directive" | Asserts .claude/CLAUDE.md exists and matches `/@import\s+\S+oauth-refactor\S+CLAUDE\.md/` | T-TASK-1 | FAIL | Same regex weakness as T-INIT-1 analysis: the path between `oauth-refactor` and `CLAUDE.md` is `\S+` and is not validated as a real absolute or relative path. The imported file's existence is not asserted. Missing exit-code assertion (T5). |
| task-operations.test.ts:Test2.1/"should provide resume instruction in output" | Checks stdout contains 'oauth-refactor' | (supporting) | FAIL | **T6 violation**: 'oauth-refactor' appears in the task name argument passed to the script; any script that echoes its arguments would pass. This is circular—the test does not verify the output is a resume instruction. |
| task-operations.test.ts:Test2.2/"should reject task name with spaces" | Asserts non-zero exit AND output matches `/invalid|error/i` | (supporting) | FAIL | OR between stdout and stderr, then `/invalid|error/i`. The word 'error' will match Node.js exception text, a usage error, or any message containing the word. The regex is too broad to distinguish a meaningful error message from a crash. Missing specific assertion that no directory was created (only covered by the next test). |
| task-operations.test.ts:Test2.2/"should reject task name with uppercase" | Asserts non-zero exit AND two specific directory paths don't exist | T-TASK-2 | PASS | Exit code checked. Two plausible directory names checked (original case and lowercased). The DoD says "creates no task directory"—both the exact input and a lowercased variant are checked. No obvious attack vector, though an implementation could create a differently-cased directory that neither check covers (e.g., `oauthrefactor` is checked but `oauth-refactor` is not). Acceptable given the test covers the principal cases. |
| task-operations.test.ts:Test2.2/"should reject task name with special characters" | Asserts non-zero exit for `oauth@refactor!` | (supporting) | FAIL | Missing `expect(fileExists(...)).toBe(false)` to confirm no directory was created (T5 variant—incomplete assertion per DoD). |
| task-operations.test.ts:Test2.2/"should not create directory for invalid task" | Asserts two directory paths don't exist for 'OAuth Refactor' (with space) | (supporting) | PASS | Negative assertion is meaningful here since the script had to run; no attack vector. |
| task-operations.test.ts:Test2.3/"should capture full multi-line description" | Asserts three keywords from a multi-line description appear in task CLAUDE.md | T-TASK-3 | FAIL | Missing exit-code assertion (T5). The three words ('oauth', 'session', 'token') are checked with `.toLowerCase().toContain()` individually—an implementation that dumps the raw description string verbatim into any section of the file would pass. The DoD requires "all lines preserved in the Focus section"—the test does not assert they appear in the Focus section specifically, or that newlines/structure are preserved. An implementation that collapses all lines into a single sentence would pass if the words still appear. |
| task-operations.test.ts:Test2.4/"should handle empty description" | Branches: if exitCode 0, checks file exists and length > 0; if non-zero, checks no directory | T-TASK-4 | FAIL | **T2 violation (conditional assertion)**: The entire body is an if/else on `result.exitCode`. The DoD says "task-create with empty description exits non-zero AND creates no task directory." This test accepts exitCode 0 as a valid outcome, which directly contradicts the DoD clause. A passing implementation that accepts empty descriptions and creates a stub file would satisfy this test but violate the DoD. ESCALATE. |
| task-operations.test.ts:Test3.1/"should list personal contexts when switching" | Asserts exit 0 and output contains 'my-progress' | T-LIST-1 | FAIL | Missing assertion that "Personal" appears before "Golden" in the output (the DoD clause requires `indexOf("Personal") < indexOf("Golden")`). The test only checks for the context name. The `beforeEach` creates the context file directly in the personal dir—this is **T3** only if `task-list` is supposed to create the context; since task-list only reads, setup creation is correct. No attack vector on the name check itself, but the ordering constraint is untested. |
| task-operations.test.ts:Test3.2/"should list golden contexts when switching" | Checks output contains 'golden', 'oauth-deep-dive', or 'team' | T-LIST-1 | FAIL | **T1 violation**: OR chain. An implementation that outputs "golden retriever" or any string containing 'golden' would pass. The 'team' branch is entirely vacuous—'team' is a generic word. Missing exit-code assertion (T5). |
| task-operations.test.ts:Test3.3/"should list both personal and golden contexts" | OR chain: output contains 'personal', 'golden', or 'context' | T-LIST-1 | FAIL | **T1 violation**: The final OR branch `output.includes('context')` makes the entire assertion a tautology—any help text or error message containing the word 'context' would pass. This is a banned pattern T1. |
| task-operations.test.ts:Test3.3/"should show personal contexts before golden" | Asserts both 'personal' and 'golden' appear with personal's index lower | T-LIST-1 | PASS | Both indices are independently asserted `>= 0`, then ordering is checked. No OR escape. No attack vector. |
| task-operations.test.ts:Test3.4/"should indicate no contexts available and offer fresh start" | OR chain on 'no context', 'none', '0 context', 'empty' OR 'fresh', 'start' | T-LIST-3 | FAIL | **T1 violation**: The assertion is `indicatesEmpty || offersFresh`. An implementation that outputs "no context" but does NOT offer a fresh start would pass; an implementation that outputs "start" in any other context would pass. The DoD says the output must contain "fresh", "empty", or "no contexts"—the test adds 'none' and '0 context', weakening specificity. Missing exit-code assertion (T5). |
| task-operations.test.ts:Test3.4/"should still allow task switch" | Asserts update-import exits 0 with no contexts | (supporting) | PASS | Exit code checked. No attack vector. |
| task-operations.test.ts:Test3.5/"should switch to default task" | Conditionally checks .claude/CLAUDE.md contains 'default' | (supporting) | FAIL | **T2 violation**: `if (fileExists(workingMdPath)) { ... }`. If the file doesn't exist, the content assertion is silently skipped. Missing exit-code assertion (T5). |
| task-operations.test.ts:Test3.5/"should indicate vanilla mode restored" | OR chain: 'default', 'vanilla', or 'restored' | (supporting) | FAIL | **T1 violation**: Three alternative words, any of which appears in many possible unrelated outputs. |
| task-operations.test.ts:Test3.6/"should update .claude/CLAUDE.md on each switch" | Wraps all assertions in `if (fileExists(workingMdPath))` | T-CLMD-2 | FAIL | **T2 violation**: Every single assertion in this test is guarded by `if (fileExists(workingMdPath))`. If the file is never created, all assertions are silently skipped and the test passes vacuously. This is a direct instance of the banned T2 pattern applied to the most critical DoD clause for the two-file system. A null implementation of `update-import` would pass this entire test. ESCALATE. |
| context-operations.test.ts:Test4.1/"should save context to personal storage" | Asserts exit 0 and exact path exists | T-CTX-1 | FAIL | Missing assertion that the file was NOT there before the script ran (T3 risk—the context source file is created in the test, but the saved output path is not pre-created, so T3 is not directly triggered). However, the test passes the session file location as an implicit convention; if `save-context` uses `current-session.jsonl` from a hardcoded path rather than the one created, the test may still pass. Missing content validation (file could be empty). |
| context-operations.test.ts:Test4.1/"should create valid JSONL file" | Asserts file exists then `isValidJsonl(expectedPath)` | T-CTX-2 | PASS | Unconditional existence check followed by JSONL validation. The DoD states "asserted unconditionally, not inside an if(fileExists) guard"—this test complies. `isValidJsonl` parses each line. No attack vector on this specific assertion. |
| context-operations.test.ts:Test4.1/"should not save to project .claude/ directory for personal" | Asserts a specific project-golden path does NOT exist | (supporting) | PASS | Negative assertion is meaningful—the path is specific. No attack vector. |
| context-operations.test.ts:Test4.2/"should save context to project directory for golden" | Asserts exit 0 and golden path exists | (supporting) | FAIL | No content validation. File could be empty or contain wrong data. |
| context-operations.test.ts:Test4.2/"should run secret scan before saving golden" | Checks output contains 'scan', 'secret', or 'clean' | T-CTX-3 | FAIL | **T1 violation**: OR chain. 'clean' is a single common word. The DoD says `save-context --golden` on a session WITH secrets must exit non-zero or produce a prompt—this test uses `CLEAN_CONTEXT` (no secrets), so it is testing the wrong scenario for T-CTX-3. T-CTX-3 requires testing a session with a real AWS key; this test uses a clean session and only checks whether scan-related terminology appears in the output. The critical failure path (secret detected → block) is NOT tested here at all. ESCALATE. |
| context-operations.test.ts:Test4.3/"should reject context name with invalid characters" | Asserts non-zero exit for 'my work!' | (supporting) | FAIL | Missing assertion that no file was created (T5 incomplete per DoD). |
| context-operations.test.ts:Test4.5/"should handle empty context gracefully" | Accepts either exitCode 0 or 1; asserts no stack trace | (supporting) | FAIL | **T1 violation**: `expect(result.exitCode === 0 || result.exitCode === 1).toBe(true)` — this accepts any standard exit code and is trivially true. Any process exits 0 or 1 in the vast majority of cases. |
| context-operations.test.ts:Test4.5/"should reject golden save when context exceeds 100KB" | Asserts non-zero exit and output contains '100kb', 'too large', or 'size' | T-CTX-4 | FAIL | **T1 violation**: OR chain. 'size' is a generic word that appears in many error messages, file listings, and help texts. The DoD specifies the output must contain "100KB" or "too large"—'size' is not in the DoD and is too broad. The test creates messages with `'x'.repeat(1000)` × 150 = 150,000 bytes of content, but the actual serialized JSONL may be larger due to JSON encoding overhead; the test does not verify the fixture actually exceeds 100KB as a JSONL file on disk before running the script. |
| context-operations.test.ts:Test5.1/"should list all contexts for task" | Asserts both 'ctx-1' and 'ctx-2' appear in output | T-LIST-1 | PASS | Specific context names, no OR. Exit code checked. No attack vector. |
| context-operations.test.ts:Test5.1/"should show message counts" | Asserts `/\b\d+\s*(msg|message)/i` matches output | T-LIST-2 | FAIL | **T6 violation**: The regex `\b\d+\s*(msg|message)/i` accepts any digit followed by 'msg' or 'message'. The DoD clause T-LIST-2 requires "exact message count matching `\b<N>\b`." The test does not know the exact count of messages in SMALL_CONTEXT (5) or createMediumContext() (30), and does not assert specific counts. An implementation that always outputs "1 message" regardless of actual content would pass. The test plan rule says use `\b47\b` not `\d+` when a specific count is known—SMALL_CONTEXT has 5 messages and createMediumContext() has 30; those counts are known and must be tested specifically. ESCALATE. |
| context-operations.test.ts:Test5.3/"should indicate no contexts found" | OR chain: 'no context', 'none', '0 context', 'empty' | T-LIST-3 | FAIL | **T1 violation**: Four alternative strings in OR chain. 'none' and 'empty' are too generic. |
| context-operations.test.ts:Test5.4/"should show both personal and golden sections" | Asserts both 'personal' and 'golden' appear, with personal index lower | T-LIST-1 | PASS | Both presence and ordering verified without OR. No attack vector. |
| context-operations.test.ts:Test5.5/"should error for non-existent task" | OR chain: non-zero exit OR output contains 'not found'/'does not exist'/'error' | (supporting) | FAIL | **T1 violation**: `result.exitCode !== 0 || output.includes(...)`. The exit-code OR makes the string assertions irrelevant—if exit code is non-zero the test always passes regardless of output content. Accepts a silent non-zero exit with no user-facing error message. |
| context-operations.test.ts:Test6.1/"should report zero contexts" | OR chain on 'no context', 'none', '0 context', 'nothing' | (supporting) | FAIL | **T1 violation**: 'nothing' is a generic English word. Missing exit-code assertion (T5). |
| context-operations.test.ts:Test6.6/"should list golden context with special indicator" | OR chain: output contains '⭐', 'golden', or 'team' | (supporting) | FAIL | **T1 violation**: 'team' is a generic word. Missing exit-code assertion (T5). |
| context-operations.test.ts:Test6.6/"should prevent golden context deletion without confirmation" | Asserts non-zero exit AND golden file still exists | T-CTX-7 | FAIL | The `beforeEach` creates the golden context file directly (bypassing the save-context script). This is **T3**: the test creates the artifact it then checks for. If `delete-context` deletes the file and the test checks it still exists, the test serves as a true negative—so the T3 concern is less severe for a "file should NOT be deleted" check. However, the test setup uses `task-create` with `--golden` as an argument to the description field (`'--golden', 'Test task'`), which is almost certainly a bug in the test setup—`--golden` would be interpreted as the task description, not a flag. The golden context is then created manually anyway, so the task-create call's --golden flag being wrong doesn't matter for the test. The DoD says "without `--confirm` flag; the file still exists after the failed attempt"—exit code is checked, file existence is checked. The --confirm mechanism is not verified to exist or be the correct mechanism. ESCALATE. |
| context-operations.test.ts:Test7.1/"should successfully promote clean context" | Asserts exit 0 | T-PROM-1 (partial) | FAIL | Exit code only. No content verification. Missing assertion that both personal and golden copies exist with identical content (the full T-PROM-1 requirement). |
| context-operations.test.ts:Test7.1/"should copy to project golden directory" | Asserts golden path exists | T-PROM-1 (partial) | FAIL | No content verification. File could be empty. |
| context-operations.test.ts:Test7.1/"should preserve original personal context" | Asserts personal path still exists | T-PROM-1 | FAIL | No byte-for-byte content comparison between personal and golden copies. The DoD says "contents are byte-for-byte identical"—only existence is checked, not identity. A "move" implementation that copies an empty or different file to golden while leaving the original would pass. |
| context-operations.test.ts:Test7.2/"should detect secrets and warn/block" | Asserts output names specific type AND exit non-zero | T-PROM-2 | FAIL | The test uses `AWS_KEY_CONTEXT` which contains `AKIAIOSFODNN7EXAMPLE`—this is the AWS documentation example key. T-SEC-5 establishes this IS a true positive per policy. The assertion `namesSpecificType` checks four OR alternatives: 'aws', 'akia', 'secret key', 'access key'. Then separately `expect(namesSpecificType).toBe(true)` is re-asserted without the exit-code OR, so exit-code non-zero AND type identification are both required. However, the four alternatives include 'secret key' which is a generic phrase that could appear in any error or help text. Better than most OR assertions here—PASS on exit code + type specificity. However, T-PROM-2 specifically requires the output "names the specific secret type" for a `ghp_` GitHub token scenario—this test uses AWS keys, not `ghp_`. The DoD clause for T-PROM-2 says "output names the specific secret type" for a `ghp_` + 36 char token. The test uses AWS data, not the ghp_ scenario specified in the DoD. ESCALATE. |
| context-operations.test.ts:Test7.3/"should offer redaction option" | Runs scan-secrets on stripe context, checks output contains 'secret', 'stripe', or 'sk_' | (supporting) | FAIL | **T1 violation**: OR chain. This test is labeled "should offer redaction option" but does not assert any redaction option is offered—it only checks that the scan finds something. Missing exit-code assertion (T5). |
| context-operations.test.ts:Test7.4/"should error for non-existent context" | Asserts non-zero exit and output contains 'not found', 'does not exist', or 'error' | (supporting) | FAIL | **T1 violation**: 'error' matches any error output including stack traces. |
| context-operations.test.ts:Test7.5/"should warn about already-golden context" | OR chain on 'already', 'golden', 'exists' | T-PROM-3 | FAIL | **T1 violation**: Three alternatives. 'exists' and 'golden' would appear in any output referencing the context at all. The DoD clause requires "exits non-zero or warns"—the test does not assert exit code. An implementation that silently overwrites the golden context with a success exit code and no output mentioning these words would fail the DoD but an implementation that outputs "Context golden-ctx.jsonl exists" on a success exit would pass this test while violating the "exits non-zero or warns" requirement. Missing exit-code assertion (T5). |
| context-operations.test.ts:Test4.5/"should reject golden save when context exceeds 100KB" | (covers T-CTX-5 via T-CTX-4) | T-CTX-5 | MISSING | T-CTX-5 is the promote-context 100KB cap. The test file contains a test for save-context golden cap (T-CTX-4) but no separate test for `promote-context` on a 150KB personal context. The T-CTX-5 DoD clause is not covered. |
| error-handling.test.ts:Test13.1/"should handle missing .claude directory gracefully" | Asserts non-zero exit, output contains 'init'/'not initialized', no stack trace | T-ERR-1 | FAIL | The OR `output.includes('init') || output.includes('not initialized')` is redundant ('not initialized' contains 'init'), but the pattern is acceptable. However, `expect(result.stderr).not.toContain('at Object.<anonymous>')` is a weak anti-stack-trace check—Node.js stack traces use many other function call patterns. A crash producing `at processTicksAndRejections (node:internal/process/task_queues:95:5)` would pass. |
| error-handling.test.ts:Test13.1/"should suggest running init" | OR chain: output contains 'init'/'first'/'not found' OR exitCode non-zero | (supporting) | FAIL | **T1 violation**: `exitCode !== 0` as a trailing OR makes the string assertions irrelevant. Any non-zero exit passes. |
| error-handling.test.ts:Test13.2/"should handle missing .claude directory on task operations" | OR chain: non-zero exit OR output contains 'not found'/'error' | (supporting) | FAIL | **T1 violation**: exit-code OR makes string checks irrelevant. |
| error-handling.test.ts:Test13.3/"should detect corrupt JSONL" | Only asserts `result.exitCode).toBeDefined()` | T-ERR-2 | FAIL | **Vacuous assertion (T1/Vacuity)**: `exitCode` is always defined—it is set to `error.code || 1` in the catch block of `runScript`. This assertion is never false. The DoD for T-ERR-2 says "scan-secrets on malformed JSONL exits non-zero (not 0)." This test runs `context-list`, not `scan-secrets`, and asserts only that exitCode exists. A null implementation passes trivially. ESCALATE. |
| error-handling.test.ts:Test13.3/"should not crash on invalid JSON in context" | Asserts non-zero exit and no stack trace on scan-secrets with corrupt file | T-ERR-2 | PASS | Exit code checked (`not.toBe(0)`). Anti-stack-trace check is weak but present. This is the correct test for T-ERR-2—it tests scan-secrets specifically. The weak stack trace check is noted. |
| error-handling.test.ts:Test13.5/"should handle invalid metadata gracefully" | Accepts exitCode 0 or 1, asserts no stack trace | (supporting) | FAIL | **T1 violation**: `expect(result.exitCode === 0 || result.exitCode === 1).toBe(true)` is trivially true. |
| error-handling.test.ts:Test13.6/"should handle permission errors gracefully" | OR chain on non-zero exit, 'permission', 'access', or 'error' | (supporting) | FAIL | **T1 violation**: 'error' OR exit-code OR makes this tautological. The `try/catch` on chmod means the test silently skips on macOS/Linux systems where chmod may fail, producing a false green. |
| error-handling.test.ts:Test:"should validate task ID format" | Loops invalid IDs, asserts non-zero exit OR output contains 'invalid'/'error' for each | (supporting) | FAIL | **T1 violation**: exit-code OR makes string check irrelevant. Also, the empty string `''` and whitespace `'   '` are tested—an implementation that crashes on empty input with exit code 1 passes, but the user-facing error message is never verified. |
| error-handling.test.ts:Test:"should validate context name format" | Asserts non-zero exit OR stderr contains 'error' per invalid name | (supporting) | FAIL | **T1 violation**: exit-code OR. |
| error-handling.test.ts:Test:"should provide helpful error for non-existent task" | OR chain on 'not found', 'does not exist', 'no such task', 'available' | (supporting) | FAIL | **T1 violation**: 'available' would match any output listing available tasks even on success. |
| error-handling.test.ts:Test:"should provide helpful error for non-existent context" | OR chain on 'not found', 'does not exist' OR non-zero exit | (supporting) | FAIL | **T1 violation**: exit-code OR. |
| error-handling.test.ts:Test12.4/"should handle paths with spaces" | Asserts exit 0 and file exists | T-ERR-3 | FAIL | The DoD requires "exitCode === 0 AND output file existence"—exit code IS checked, file existence IS checked. However, the test only checks `.claude/CLAUDE.md` exists; the DoD for T-ERR-3 says "verified by exitCode === 0 AND output file existence" without specifying which file. An implementation that creates only `.claude/CLAUDE.md` but fails to create `.claude/tasks/default/CLAUDE.md` would pass. Missing content validation. |
| error-handling.test.ts:Test12.6/"should create JSONL with consistent line endings" | Conditionally reads files in personalDir if it exists | (supporting) | FAIL | **T2 violation**: Entire file-content assertion is inside `if (existsSync(personalDir))`. The `save-context` script may silently fail to create the file; the test would pass vacuously. Missing exit-code assertion on save-context (T5). |
| error-handling.test.ts:Test12.7/"should use LF line endings in generated files" | Conditionally checks files if they exist | (supporting) | FAIL | **T2 violation**: Both file checks are inside `if (fileExists(path))`. If the files don't exist, all assertions are skipped. |
| secret-detection.test.ts:Test9.1/"should detect AWS access key pattern" | Asserts non-zero exit and output contains 'aws' or 'akia' | T-SEC-2 | PASS | Exit code checked. OR is limited to two specific AWS-related terms. Both alternatives are meaningful. No attack vector for a correct assertion on these two patterns. |
| secret-detection.test.ts:Test9.1/"should identify AWS secret key pattern" | OR chain: output contains 'secret'/'key' OR matches `/\d+/` | (supporting) | FAIL | **T1 violation**: `/\d+/.test(output)` is the exact banned pattern from the test quality rules. 'key' and 'secret' are generic words. |
| secret-detection.test.ts:Test9.2/"should detect Stripe live key pattern" | OR chain: 'stripe'/'sk_live'/'sk_test'/'secret'/'detected' | (supporting) | FAIL | **T1 violation**: 'secret' and 'detected' are too generic. Five OR alternatives. |
| secret-detection.test.ts:Test9.2/"should detect both test and live keys" | Asserts non-zero exit and output contains 'stripe', 'sk_test', or 'sk_live' | T-SEC-3 | FAIL | The DoD says "detects both `sk_test_` and `sk_live_`; output names the specific key type." The OR means only one of the two needs to be detected and reported. An implementation that only detects `sk_live_` and reports "stripe key found" would pass. The "both" requirement is not enforced. ESCALATE. |
| secret-detection.test.ts:Test9.3/"should detect GitHub personal access token" | OR chain: 'github'/'ghp_'/'token'/'detected' | (supporting) | FAIL | **T1 violation**: 'token' and 'detected' are too generic. Missing exit-code assertion (T5). |
| secret-detection.test.ts:Test9.4/"should detect RSA private key header" | OR chain: 'private'/'key'/'rsa'/'detected' | (supporting) | FAIL | **T1 violation**: 'key' is a single common word. Missing exit-code assertion (T5). |
| secret-detection.test.ts:Test9.5/"should detect password assignment patterns" | OR chain: 'password'/'credential'/'detected' | (supporting) | FAIL | **T1 violation**: 'detected' is vacuous. Missing exit-code assertion (T5). |
| secret-detection.test.ts:Test9.6/"should treat AKIAIOSFODNN7EXAMPLE as a true positive" | Asserts non-zero exit and output contains 'aws' or 'akia' | T-SEC-5 | PASS | Exit checked. OR limited to two AWS-specific terms. Uses AWS_KEY_CONTEXT which contains AKIAIOSFODNN7EXAMPLE. No attack vector. |
| secret-detection.test.ts:Test9.7/"should report correct count of multiple secrets" | Asserts non-zero exit and output matches regex for count > 1 near 'secret/found/detect' | T-SEC-7 | FAIL | The regex `output.match(/\b([2-9]|\d{2,})\b.*?(secret|found|detect)/i)` is complicated and fragile. `\d{2,}` matches any two-digit number including timestamps in the output. The DoD says "exactly 4 secrets"—this test only requires "more than 1." An implementation that reports 99 secrets would pass. The word-boundary count for exactly 4 (`\b4\b`) is not asserted. ESCALATE. |
| secret-detection.test.ts:Test9.8/"should detect secrets in user, assistant, and tool_result messages" | Attempts `JSON.parse` on the entire scan output, asserts array length >= 3 | T-SEC-4 | FAIL | The test does `JSON.parse(output.trim() === 'clean' ? '[]' : output.trim())`. This assumes the scanner outputs a JSON array. If the scanner outputs a non-JSON report (e.g., human-readable text), `JSON.parse` throws and the test crashes rather than fails gracefully. More critically: `AWS_KEY_CONTEXT` uses `AKIAIOSFODNN7EXAMPLE` (16 chars after AKIA—valid format) and the mixed-type context uses the same key in the user message, `sk_test_4eC39HqLyjWDarjtT1zdp7dc` in the assistant message, and `ghp_abcdefghijklmnopqrstuvwxyz123456` (36 chars) in tool_result. The test checks array length >= 3 but does not verify that the three reports correspond to three different message types (user/assistant/tool_result). An implementation that scans only user messages and finds 3+ secrets in that single message would pass. ESCALATE. |
| secret-detection.test.ts:Test9.9/"should produce clean valid JSONL after redaction" | Asserts exit 0, file exists, isValidJsonl, then rescan exits 0 and output is 'clean' | T-SEC-6 | FAIL | The rescan assertion `expect(rescanResult.stdout.trim()).toBe('clean')` requires exit code 0 from rescan. But the test separately checks `expect(redactResult.exitCode).toBe(0)`. However, the rescan exit code is not checked—`rescanResult.exitCode` is not asserted. A scanner that exits non-zero but outputs 'clean' on stdout would pass. The DoD says `scan-secrets` returns "clean"—this is ambiguous between stdout and exit code. Missing exit-code assertion on rescan (T5). |
| secret-detection.test.ts:Test9.9/"should remove or mask secrets in output" | Conditionally checks redacted file if it exists | (supporting) | FAIL | **T2 violation**: `if (fileExists(redactedPath))`. If the redacted file is never created, all assertions are skipped. Missing exit-code assertion (T5). |
| secret-detection.test.ts:Test:"should report clean when no secrets found" | OR chain on 'clean'/'no secret'/'0 secret'/'none' OR negation of 'found' | (supporting) | FAIL | **T1 violation**: `!output.includes('found')` — any output that doesn't contain the word 'found' passes, including an empty output or a crash output. The negation OR branch is a tautology for many failure modes. |
| claude-md-system.test.ts:Test8.1/"should not modify root CLAUDE.md during init" | Asserts root content equals originalContent | T-CLMD-1 | PASS | Byte-exact equality. No attack vector. |
| claude-md-system.test.ts:Test8.1/"should not modify root CLAUDE.md during task creation" | Asserts root content equals originalContent after two task-creates | T-CLMD-1 | PASS | Byte-exact equality, two task operations exercised. No attack vector. |
| claude-md-system.test.ts:Test8.1/"should not modify root CLAUDE.md during task switching" | Asserts root content equals originalContent after multiple switches | T-CLMD-1 | PASS | Byte-exact equality, multiple operations exercised. No attack vector. |
| claude-md-system.test.ts:Test8.1/"should show no git changes to root CLAUDE.md" | Parses git status lines, asserts no line ends with 'CLAUDE.md' unless under .claude/ | T-CLMD-1 | FAIL | The check `line.trim().endsWith('CLAUDE.md') && !line.includes('.claude/')` misses the case where the root CLAUDE.md is modified but git status shows it as `M CLAUDE.md` (where the line is `M CLAUDE.md`, which ends with `CLAUDE.md` and does not include `.claude/`). So the test WOULD catch that case. However, the check uses `line.trim().endsWith('CLAUDE.md')`—git status --porcelain format is ` M CLAUDE.md` (space+M+space+path), so after trim it becomes `M CLAUDE.md` which does end with 'CLAUDE.md'. The logic is correct. However, missing exit-code assertions for the `task-create` and `update-import` calls (T5). |
| claude-md-system.test.ts:Test8.2/"should create .claude/CLAUDE.md on init" | Asserts file exists | (supporting) | PASS (trivial) | Existence only, but a supporting check for a higher-level invariant. |
| claude-md-system.test.ts:Test8.2/"should contain @import directive" | Asserts content contains '@import' | (supporting) | FAIL | Same weakness as prior @import checks: any occurrence of the string passes. No path validation. |
| claude-md-system.test.ts:Test8.2/"should update on task switch" | Asserts .claude/CLAUDE.md contains 'task-1' after update-import | (supporting) | FAIL | `fileContains` does a plain includes—'task-1' appearing anywhere in the file would pass even if it's in a comment or wrong context. Missing exit-code assertion (T5). |
| claude-md-system.test.ts:Test8.2/"should contain exactly one @import after multiple switches" | Counts lines starting with '@import', asserts length == 1 and content | T-CLMD-2 | PASS | Line count checked (==1), content of the single import line checked for 'task-2' and absence of 'task-1'. No attack vector found. This is the most robust test for T-CLMD-2. |
| claude-md-system.test.ts:Test8.3/"should have .gitignore with CLAUDE.md entry" | Asserts file exists and contains 'CLAUDE.md' | T-GIT-1 (partial) | FAIL | Same issue as initialization.test.ts: `fileContains` checks for any occurrence of the string 'CLAUDE.md'. A comment line would pass. |
| claude-md-system.test.ts:Test8.3/"should be ignored by git" | Conditionally calls `isGitIgnored` only if .claude/CLAUDE.md exists | T-GIT-1 | FAIL | **T2 violation**: `if (fileExists(workingMdPath)) { expect(isGitIgnored(...)).toBe(true) }`. If the file doesn't exist, the assertion is skipped. Additionally, `.claude/.gitignore` has not been committed before this test calls `git check-ignore`, so the behavior depends on git version handling of untracked nested `.gitignore` files. |
| claude-md-system.test.ts:Test8.3/"should not appear in git status" | Asserts git status does not contain '.claude/CLAUDE.md' after staging with gitAdd | T-GIT-1 | FAIL | `gitAdd(ctx.projectDir, '.claude/')` stages all files in `.claude/` including `.claude/CLAUDE.md`. If `.claude/.gitignore` is not yet committed, `.claude/CLAUDE.md` may be stageable and would then appear in git status, causing the test to fail—but more importantly, if it IS properly git-ignored, `git add .claude/` will skip it, making the test pass. The test relies on git's ignore behavior being correct, which is the very thing being tested. The `.gitignore` was not committed before this test. |
| claude-md-system.test.ts:Test8.4/"should update import to auth task" | Asserts content contains 'auth' and not 'payment' | (supporting) | FAIL | `content.includes('auth')` matches any occurrence of 'auth' in the file, including in path components or comments. Missing exit-code assertion (T5). |
| claude-md-system.test.ts:Test8.4/"should update import to payment task" | Asserts content contains 'payment' and not 'auth' | (supporting) | FAIL | Same weakness. Missing exit-code assertion (T5). |
| claude-md-system.test.ts:Test8.4/"should update import to default task" | Asserts content contains 'default' after switching back | (supporting) | FAIL | 'default' is a generic word. Missing exit-code assertion (T5). |
| claude-md-system.test.ts:Test8.5/"should set up the correct @import path for /resume to read" | Asserts .claude/CLAUDE.md exists, matches `/@import\s+\S+oauth-work\S+CLAUDE\.md/`, and task CLAUDE.md exists with length > 0 | T-CLMD-2 | FAIL | The regex `/@import\s+\S+oauth-work\S+CLAUDE\.md/` does not validate the path is syntactically correct or that the imported file is at the location specified by the @import—it only checks the string. The task CLAUDE.md existence check and length > 0 check are correct supporting assertions, but do not validate that the @import path in .claude/CLAUDE.md actually points to the task CLAUDE.md that exists. An implementation could emit `@import /oauth-work/nonexistent/CLAUDE.md` and separately create the task file at a different location, passing both assertions. |
| claude-md-system.test.ts:Test8.6/"should allow different task states" | Asserts different content in two project .claude/CLAUDE.md files, same root CLAUDE.md | (supporting) | PASS | Cross-project isolation verified with specific task names. String equality checks on root files. No attack vector. |
| git-integration.test.ts:Test11.1/"should create .gitignore during initialization" | Asserts file exists | (supporting) | PASS | Simple existence check. No attack vector. |
| git-integration.test.ts:Test11.1/"should include CLAUDE.md in .gitignore" | Asserts `fileContains(gitignorePath, 'CLAUDE.md')` | T-GIT-1 (partial) | FAIL | Same issue: `fileContains` is a plain includes. The comment `# CLAUDE.md` would pass. |
| git-integration.test.ts:Test11.2/"should allow task CLAUDE.md to be tracked" | Stages task CLAUDE.md, asserts it appears in git status | (supporting) | PASS | Meaningful git integration check. No attack vector. |
| git-integration.test.ts:Test11.2/"should allow task directory to be committed" | Commits and asserts no throw | (supporting) | PASS | Negative assertion (no exception) is meaningful here. |
| git-integration.test.ts:Test11.3/"should allow golden context to be tracked" | Stages golden context, asserts it appears in git status | (supporting) | PASS | Meaningful. No attack vector. |
| git-integration.test.ts:Test11.3/"should commit golden context successfully" | Commits and asserts no throw | (supporting) | PASS | No attack vector. |
| git-integration.test.ts:Test11.4/"should not include personal storage in git" | Stages all project files, asserts personal storage paths absent from status | T-GIT-2 | FAIL | The personal storage directory is in `ctx.personalBase` which is in the system temp directory, entirely outside the git repository. `git add .` in the project dir cannot stage files outside the repo. This test proves only that `git add` doesn't stage files outside the repository—a property of git itself, not of the implementation. An implementation that somehow symlinks personal storage into the project directory would not be caught by this test. The test is **vacuous for the stated DoD clause**—it passes regardless of what the implementation does with personal storage. ESCALATE. |
| git-integration.test.ts:Test11.5/"should not cause conflicts when multiple developers work" | Asserts no UU conflict markers in git status in two isolated repos | (supporting) | FAIL | The test uses two completely separate git repositories with no shared remote. Real git conflicts occur when merging branches from a shared remote. This test only shows that committing to two separate repos doesn't cause conflicts in either—trivially true. The DoD concern about git conflicts is specifically about team workflow with shared golden contexts. The test is vacuous for that concern. |
| git-integration.test.ts:Test11.6/"should recognize golden contexts after they exist" | Asserts exit 0 and output contains 'shared-ctx' | (supporting) | PASS | Specific context name check, exit code checked. No attack vector. |
| git-integration.test.ts:Test11.7/"should not show .claude/CLAUDE.md in status" | Modifies .claude/CLAUDE.md, asserts it doesn't appear in git status | T-GIT-1 | FAIL | The `.claude/.gitignore` is created by `init-project` but not committed before this test modifies the file. Whether `git status --porcelain` shows an ignored-but-modified file depends on whether the `.gitignore` is tracked. The test may pass because git respects untracked nested `.gitignore` files, or may fail depending on git version. The correct test (as done in Test11.7/"should be ignored by git check-ignore") commits the `.gitignore` first. |
| git-integration.test.ts:Test11.7/"should be ignored by git check-ignore" | Commits .claude/.gitignore, then asserts isGitIgnored returns true | T-GIT-1 | PASS | This is the one correct git-ignore test: `.gitignore` is committed before checking. `git check-ignore` will correctly reflect the committed rule. No attack vector. |

---

## Section 2 — DoD Coverage Gaps

### T-INIT-1: Project initialization — `.claude/CLAUDE.md` contains `@import` line; file must not exist before script runs

Tests claiming coverage: initialization.test.ts:Test1.1/"should create .claude/ directory structure", initialization.test.ts:Test1.2/"should create .claude/CLAUDE.md with @import directive"

**Coverage: INADEQUATE**

No test asserts the file does not exist before the script runs (pre-condition of DoD). The `@import` regex `/@import\s+\S+CLAUDE\.md/` accepts any path including garbage. No test verifies the imported path resolves to an existing file.

---

### T-INIT-2: CLAUDE.md backup — byte-for-byte copy to stash path; backup must not exist before script runs

Tests claiming coverage: initialization.test.ts:Test1.2/"should create backup of original CLAUDE.md"

**Coverage: INADEQUATE**

Pre-condition (backup must not exist before script runs) is not asserted. Byte-exact content comparison is present but is insufficient without the pre-condition. Missing exit-code assertion.

---

### T-INIT-3: Default task copy — content equals root CLAUDE.md character-for-character

Tests claiming coverage: initialization.test.ts:Test1.2/"should create default task with copy of original CLAUDE.md"

**Coverage: INADEQUATE**

Pre-condition (default task must not exist before script runs) not asserted. Byte-exact comparison is present but could pass if test setup pre-created the file. Missing exit-code assertion.

---

### T-INIT-4: Idempotent init — exits 0 both times, identical file contents

Tests claiming coverage: initialization.test.ts:Test1.3/"should succeed on both initializations", initialization.test.ts:Test1.3/"should produce identical files on second run"

**Coverage: ADEQUATE**

Exit codes checked for both runs. Content equality checked. The "should succeed on both initializations" test is missing exit-code assertion on first run but second run covers idempotency. Combined, these are marginally adequate.

---

### T-INIT-5: Multi-project isolation — file in project A's personal dir not visible in project B's

Tests claiming coverage: initialization.test.ts:Test1.5/"should handle multiple projects independently"

**Coverage: INADEQUATE**

The isolation marker is written by the test itself, not by any implementation code. The test validates filesystem directory separation only, not that any implementation-managed operation maintains isolation. A null implementation of init-project passes this test. The DoD requires isolation to be a property of the system's path computation, not merely a property of the filesystem.

---

### T-TASK-1: Task creation structure — CLAUDE.md contains all required sections

Tests claiming coverage: task-operations.test.ts:Test2.1/"should create task CLAUDE.md with description", task-operations.test.ts:Test2.1/"should update .claude/CLAUDE.md with import directive"

**Coverage: INADEQUATE**

Section headers are detected by regex but section content is not validated. The @import path regex accepts garbage paths. The imported file's existence is not verified by the @import test. Missing exit-code assertion.

---

### T-TASK-2: Task name validation — uppercase name exits non-zero AND creates no task directory

Tests claiming coverage: task-operations.test.ts:Test2.2/"should reject task name with uppercase"

**Coverage: ADEQUATE**

Exit code checked, two directory variants checked. Marginally adequate—a thorough implementation could create a third variant but the principal cases are covered.

---

### T-TASK-3: Multi-line description — all lines preserved in Focus section

Tests claiming coverage: task-operations.test.ts:Test2.3/"should capture full multi-line description"

**Coverage: INADEQUATE**

Keywords are checked anywhere in the file, not specifically in the Focus section. Line structure and preservation of newlines are not tested. A single-line concatenation of the description would pass.

---

### T-TASK-4: Empty description handling — exits non-zero and creates no task directory

Tests claiming coverage: task-operations.test.ts:Test2.4/"should handle empty description"

**Coverage: INADEQUATE**

The test accepts exit code 0 as a valid outcome, directly contradicting the DoD clause which requires exit non-zero. An implementation that accepts empty descriptions violates the DoD but passes the test.

---

### T-CTX-1: Personal context save path — creates file at exactly `<personalDir>/tasks/<task-id>/contexts/<name>.jsonl`

Tests claiming coverage: context-operations.test.ts:Test4.1/"should save context to personal storage"

**Coverage: INADEQUATE**

Path existence is checked but file contents are not validated. Missing exit-code assertion. The test cannot distinguish a correctly saved file from an empty file written to the correct path.

---

### T-CTX-2: Valid JSONL output — parses as valid JSONL, asserted unconditionally

Tests claiming coverage: context-operations.test.ts:Test4.1/"should create valid JSONL file"

**Coverage: ADEQUATE**

Unconditional existence check + JSONL parsing. The DoD's "unconditionally, not inside an if(fileExists) guard" requirement is met.

---

### T-CTX-3: Secret scan blocks golden — `save-context --golden` with real AWS key exits non-zero or produces prompt; exit 0 with no prompt is a failure

Tests claiming coverage: context-operations.test.ts:Test4.2/"should run secret scan before saving golden"

**Coverage: MISSING**

The test uses `CLEAN_CONTEXT` (no secrets). The DoD clause requires testing a session WITH a real AWS key. No test calls `save-context --golden` with a secret-containing session and asserts non-zero exit or interactive prompt. The failure mode specified in the DoD ("exit 0 with no prompt is a failure") is completely untested.

---

### T-CTX-4: 100KB golden cap (save) — exits non-zero with output containing "100KB" or "too large"

Tests claiming coverage: context-operations.test.ts:Test4.5/"should reject golden save when context exceeds 100KB"

**Coverage: INADEQUATE**

The OR clause includes 'size' which is not in the DoD and is too broad. The test does not verify the fixture actually exceeds 100KB as serialized JSONL. The DoD specifies "100KB" or "too large" as required output strings; 'size' is an unauthorized expansion.

---

### T-CTX-5: 100KB golden cap (promote) — `promote-context` on 150KB personal context exits non-zero with output containing "100KB" or "too large"

Tests claiming coverage: NONE

**Coverage: MISSING**

No test exercises `promote-context` with an oversized context. This is an entirely untested DoD clause. The promote-context code path is independent from save-context and must be independently tested.

---

### T-CTX-6: Overwrite protection — saving same name twice creates `.backup-` file; backup contains original content

Tests claiming coverage: NONE

**Coverage: MISSING**

No test in any file exercises the overwrite protection workflow. This DoD clause is entirely untested.

---

### T-CTX-7: Golden deletion warning — `delete-context` on golden exits non-zero without `--confirm`; file still exists

Tests claiming coverage: context-operations.test.ts:Test6.6/"should prevent golden context deletion without confirmation"

**Coverage: INADEQUATE**

Exit code and file existence are checked. However, the test setup uses `task-create` with `'--golden'` as the task description argument (not a valid flag), creating a subtle setup bug. The `--confirm` mechanism's existence is not verified. The test does confirm the correct behavioral outcome (non-zero exit, file survives) but the setup irregularity creates uncertainty about the test environment's validity.

---

### T-LIST-1: Context list ordering — indexOf("Personal") < indexOf("Golden"); specific context names appear

Tests claiming coverage: Multiple tests across context-operations.test.ts and task-operations.test.ts

**Coverage: INADEQUATE**

The ordering requirement is tested in context-operations.test.ts:Test5.4 and task-operations.test.ts:Test3.3 ordering test. The specific context name requirement is tested in Test5.1. However, Test3.2 (golden only) and Test3.1 (personal only) use banned OR patterns that dilute coverage. The ordering tests do not cover the single-type scenario (only personal or only golden) where the ordering constraint is vacuously satisfied or untestable.

---

### T-LIST-2: Message count display — exact count matching `\b<N>\b`

Tests claiming coverage: context-operations.test.ts:Test5.1/"should show message counts"

**Coverage: INADEQUATE**

The test uses `/\b\d+\s*(msg|message)/i` which matches any digit. The DoD clause and the test quality rules both require `\b<N>\b` with a known specific count. SMALL_CONTEXT has exactly 5 messages and createMediumContext() produces exactly 30 messages. Neither count is asserted. An implementation that always outputs "1 message" passes this test.

---

### T-LIST-3: No-contexts fresh start — output contains "fresh", "empty", or "no contexts"

Tests claiming coverage: task-operations.test.ts:Test3.4, context-operations.test.ts:Test5.3

**Coverage: INADEQUATE**

Both tests use broader OR chains than the DoD specifies. The DoD says "fresh", "empty", or "no contexts"—tests add 'none', '0 context', 'start', 'no context' (singular). The "offers fresh start" requirement is combined with the empty-state detection via OR, so an implementation satisfying one condition without the other passes.

---

### T-LIST-4: AI-generated summary — non-empty description string after each context name, not just metadata

Tests claiming coverage: NONE

**Coverage: MISSING**

No test in any file asserts that context-list output contains a non-empty description string per context. The DoD clause explicitly says "not just metadata." This is entirely untested.

---

### T-SEC-2: AWS key detection — `scan-secrets` exits non-zero; output contains "AWS" or "AKIA"

Tests claiming coverage: secret-detection.test.ts:Test9.1/"should detect AWS access key pattern"

**Coverage: ADEQUATE**

Exit code and specific term checked. No OR escape. This is one of the better tests.

---

### T-SEC-3: Stripe key detection — detects both `sk_test_` and `sk_live_`; output names specific key type

Tests claiming coverage: secret-detection.test.ts:Test9.2/"should detect both test and live keys"

**Coverage: INADEQUATE**

The OR between 'sk_test' and 'sk_live' means only one needs to be detected. The DoD requires both. No test structure enforces that both are independently reported in a single scan run.

---

### T-SEC-4: All message types scanned — user, assistant, tool_result each with one secret; all three reported

Tests claiming coverage: secret-detection.test.ts:Test9.8/"should detect secrets in user, assistant, and tool_result messages"

**Coverage: INADEQUATE**

The test parses output as a JSON array and checks length >= 3. If the scanner outputs non-JSON, the test crashes rather than fails. The array-length check does not verify that the three detections map to three different message types—a scanner that only reads user messages but finds 3 secrets in one user message would pass.

---

### T-SEC-5: False positive policy — AKIAIOSFODNN7EXAMPLE treated as true positive

Tests claiming coverage: secret-detection.test.ts:Test9.6/"should treat AKIAIOSFODNN7EXAMPLE as a true positive"

**Coverage: ADEQUATE**

Policy is verified correctly. The key is present in the test fixture, exit code is non-zero, and specific AWS terms are required.

---

### T-SEC-6: Redaction produces valid JSONL — every line parses as JSON; second scan returns "clean"

Tests claiming coverage: secret-detection.test.ts:Test9.9/"should produce clean valid JSONL after redaction"

**Coverage: INADEQUATE**

The rescan exit code is not asserted. A scanner that outputs 'clean' but exits non-zero would pass the stdout check while violating the DoD. The second test for this clause (masked secrets check) is guarded by `if (fileExists(redactedPath))` in T2 violation.

---

### T-SEC-7: Multiple secrets exact count — `scan-secrets` on context with exactly 4 secrets reports count matching `\b4\b`

Tests claiming coverage: secret-detection.test.ts:Test9.7/"should report correct count of multiple secrets"

**Coverage: INADEQUATE**

The test checks for count > 1 instead of count == 4. The MULTIPLE_SECRETS_CONTEXT contains 5 distinct secret strings (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, STRIPE_SECRET_KEY, GITHUB_TOKEN, DATABASE_PASSWORD). The DoD says "exactly 4 secrets"—neither the fixture count nor the assertion count matches the DoD. The regex accepts any count >= 2 and also accepts timestamps or line numbers as false matches.

---

### T-ERR-1: Missing `.claude/` graceful — exits non-zero; output contains "initialized" or "init"; not a stack trace

Tests claiming coverage: error-handling.test.ts:Test13.1/"should handle missing .claude directory gracefully"

**Coverage: INADEQUATE**

The anti-stack-trace check only catches `at Object.<anonymous>`. Node.js stack traces have many forms. The OR `'init' || 'not initialized'` is redundant but acceptable. Missing from the DoD: "initialized" is also listed but not tested (only 'init' and 'not initialized').

---

### T-ERR-2: Corrupt JSONL handled — `scan-secrets` on malformed JSONL exits non-zero (not 0)

Tests claiming coverage: error-handling.test.ts:Test13.3/"should detect corrupt JSONL", error-handling.test.ts:Test13.3/"should not crash on invalid JSON in context"

**Coverage: INADEQUATE**

The first test (Test13.3/"should detect corrupt JSONL") runs `context-list`, not `scan-secrets`, and asserts only `result.exitCode).toBeDefined()` which is vacuous. The second test correctly targets `scan-secrets` and checks non-zero exit. Together: the first test is useless; the second test adequately covers the DoD clause on its own. Coverage is INADEQUATE because one of the two claimed tests is vacuous and the coverage depends entirely on a single test.

---

### T-ERR-3: Paths with spaces — all operations work; exitCode === 0 AND output file existence

Tests claiming coverage: error-handling.test.ts:Test12.4/"should handle paths with spaces"

**Coverage: INADEQUATE**

Only `.claude/CLAUDE.md` existence is checked. The DoD says "all operations work"—only init-project is tested with a path containing spaces. Task creation, context saving, and other operations in paths with spaces are not tested.

---

### T-HOOK-1: PreCompact auto-save — `auto-save-context` with mock stdin creates timestamped file at expected personal context path

Tests claiming coverage: NONE

**Coverage: MISSING**

No test in any file tests `auto-save-context` or the PreCompact hook behavior. This DoD clause is entirely untested.

---

### T-MEM-1: MEMORY.md updated after save — personal memory MEMORY.md contains task-id and context-name saved

Tests claiming coverage: NONE

**Coverage: MISSING**

No test in any file asserts MEMORY.md is created or updated after `save-context`. This DoD clause is entirely untested.

---

### T-CLMD-1: Root CLAUDE.md unchanged after any task operation

Tests claiming coverage: claude-md-system.test.ts:Test8.1 (three tests), initialization.test.ts:Test1.2/"should not modify root CLAUDE.md"

**Coverage: ADEQUATE**

Multiple byte-exact comparisons across init, task-create, and task-switch operations. The git status check adds a useful fourth assertion. No attack vector found across these tests combined.

---

### T-CLMD-2: @import replaces not appends — exactly one `@import` line after two task switches

Tests claiming coverage: claude-md-system.test.ts:Test8.2/"should contain exactly one @import after multiple switches", claude-md-system.test.ts:Test8.5

**Coverage: INADEQUATE**

Test8.2 is the best test in the suite for this clause—line count and content both verified. Test8.5 is weaker (regex path not validated). Test3.6 in task-operations.test.ts is entirely guarded by T2 violations and is worthless. Combined coverage is only from Test8.2, which is adequate for the "exactly one" requirement but does not test more than two switches.

---

### T-GIT-1: `.claude/CLAUDE.md` git-ignored — `git check-ignore` exits 0 in real git repo after init

Tests claiming coverage: git-integration.test.ts:Test11.7/"should be ignored by git check-ignore", claude-md-system.test.ts:Test8.3 tests, initialization.test.ts:Test1.1/"should work with git initialized"

**Coverage: INADEQUATE**

Only one test correctly commits the `.gitignore` before calling `git check-ignore` (git-integration.test.ts:Test11.7/"should be ignored by git check-ignore"). All others call `git check-ignore` or `getGitStatus` without first committing the `.gitignore`, making their results git-version-dependent. The `fileContains` checks for the gitignore rule content match any occurrence of the string 'CLAUDE.md' rather than validating it as an effective ignore rule.

---

### T-GIT-2: Personal storage never committed — `git status --porcelain` does not list personal storage paths

Tests claiming coverage: git-integration.test.ts:Test11.4/"should not include personal storage in git"

**Coverage: INADEQUATE**

The personal storage directory is in the system temp directory, outside the git repository. `git add .` cannot reach it. The test proves a property of git, not of the implementation. An implementation that symlinks or copies personal storage into the project directory would not be caught. The DoD requires testing "after a full workflow"—the test does not execute a full workflow through the scripts before checking git status.

---

### T-RESUME-MANUAL: MANUAL smoke test

Tests claiming coverage: claude-md-system.test.ts:Test8.5 (structural proxy)

**Coverage: N/A (manual)**

The DoD marks this as manual. The structural proxy (Test8.5) verifies the pre-conditions for the manual test. Marked N/A per DoD intent.

---

## Summary of MISSING DoD Clauses (no test exists)

- **T-CTX-3**: save-context --golden with real secret-containing session (test uses clean context)
- **T-CTX-5**: promote-context 100KB cap
- **T-CTX-6**: Overwrite protection backup workflow
- **T-LIST-4**: AI-generated summary present after context name
- **T-HOOK-1**: PreCompact auto-save creates timestamped file
- **T-MEM-1**: MEMORY.md updated after save-context
