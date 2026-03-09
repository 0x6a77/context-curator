# Test Inventory

## Section 1: Test Inventory Table

| TEST_ID | DESCRIPTION | DOD_CLAUSE | VERDICT | ATTACK_VECTOR |
|---------|-------------|------------|---------|---------------|
| initialization.test.ts:Test1.1/"should create .claude/ directory structure" | Runs init-project on empty dir, checks .claude/, .gitignore, tasks/default/CLAUDE.md exist, and that .claude/CLAUDE.md contains a valid @import line pointing to an existing file | T-INIT-1 | FAIL | An implementation could create .claude/CLAUDE.md with `@import ./somefile.md` where `somefile.md` exists (even if it is the wrong file). The test resolves the imported path using `join(ctx.projectDir, importedPath)` — a relative path resolved from the project root rather than from the `.claude/` directory. If the script writes a path relative to `.claude/`, the existence check will fail silently or produce a false pass depending on resolution. More critically: the test does not assert that the @import path points *specifically* to `tasks/default/CLAUDE.md`; any existing file satisfies it. |
| initialization.test.ts:Test1.1/"should create .gitignore with CLAUDE.md entry" | Verifies .claude/.gitignore exists and contains a line matching `/^CLAUDE\.md$/m` | T-INIT-1 | PASS | No identified attack vector: the regex is anchored to line boundaries and matches exactly. |
| initialization.test.ts:Test1.1/"should not create backup when no original CLAUDE.md exists" | Verifies stash file absent after init on project with no CLAUDE.md | T-INIT-2 | FAIL | This test checks the *negative* — that no backup exists. A stub that never creates backups would pass this test trivially (vacuity). The test does not also verify that the script would create a backup *when* a CLAUDE.md exists, so it provides no coverage of the actual T-INIT-2 clause. |
| initialization.test.ts:Test1.1/"should work with git initialized" | Inits git, runs init-project, checks isGitIgnored returns true for .claude/CLAUDE.md | T-GIT-1 | ESCALATE | `isGitIgnored` runs `git check-ignore`. For this to work the .gitignore must be in a tracked or read directory. The test does not commit .claude/.gitignore before calling check-ignore; git check-ignore behaviour with uncommitted .gitignore files in subdirectories is version-dependent. Cannot confidently assess pass/fail without knowing the git version and whether .claude/.gitignore is picked up before being staged. |
| initialization.test.ts:Test1.2/"should not modify root CLAUDE.md" | After init-project, asserts root CLAUDE.md content equals pre-set original | T-CLMD-1 | PASS | No attack vector: content is compared byte-for-byte. |
| initialization.test.ts:Test1.2/"should create backup of original CLAUDE.md" (T-INIT-2) | Pre-asserts backup absent, runs init, asserts backup exists and content equals original | T-INIT-2 | PASS | Pre-condition and content equality checks are correct; self-fulfilling setup is explicitly avoided. No identified attack vector. |
| initialization.test.ts:Test1.2/"should create default task with copy of original CLAUDE.md" (T-INIT-3) | Pre-asserts default task CLAUDE.md absent, runs init, asserts file exists and content equals original character-for-character | T-INIT-3 | PASS | No attack vector: character-for-character content equality is checked. |
| initialization.test.ts:Test1.2/"should create .claude/CLAUDE.md with @import directive" | Pre-asserts file absent, runs init, asserts file exists and @import regex matches, resolves imported path and checks it exists | T-INIT-1 | FAIL | Same path-resolution ambiguity as Test1.1 first test: the test resolves `importedPath` with `join(ctx.projectDir, importedPath)` rather than from `.claude/`. If the script emits a path relative to `.claude/`, a file that exists only relative to `.claude/` will not be found by this check, yet a script that writes an absolute path (which always resolves correctly) passes trivially. The test never asserts the imported path is the default task's CLAUDE.md specifically. |
| initialization.test.ts:Test1.3/"should succeed on both initializations" | Runs init twice, asserts exitCode 0 both times | T-INIT-4 | FAIL | Checks exit codes only; does not verify file content identity. The full T-INIT-4 clause requires "identical file contents" which this test does not assert. Half the clause is untested here. |
| initialization.test.ts:Test1.3/"should not create duplicate directories" | Runs init twice, asserts exactly one 'default' entry in tasks dir | T-INIT-4 | FAIL | Does not check that file *contents* are identical between runs, only directory count. An implementation that overwrites files with different content on second run would pass. |
| initialization.test.ts:Test1.3/"should indicate already initialized on second run" | Checks second run stdout matches `/already\s*(initialized|exists)/i` | T-INIT-4 | FAIL | The DoD clause T-INIT-4 requires "exits 0 both times and produces identical file contents." This test checks for specific output text on second run, which is not required by the DoD, and does not verify content identity. This test is testing a *non-DoD* requirement while being labeled T-INIT-4. |
| initialization.test.ts:Test1.3/"should produce identical files on second run" | Runs init twice, asserts .claude/CLAUDE.md content identical after both | T-INIT-4 | PASS | Directly tests the content-identity half of T-INIT-4. No identified attack vector given byte equality check. |
| initialization.test.ts:Test1.4/"should preserve existing .claude/ content" | Pre-creates a file in .claude/, runs init, asserts it still exists and contains original text | T-INIT-1 | ESCALATE | The DoD clause T-INIT-1 does not mention preservation of existing .claude/ content. This test covers an untested concern. Mapping to T-INIT-1 is a circularity. Cannot evaluate without a specific DoD clause. |
| initialization.test.ts:Test1.4/"should still create missing initialization files" | After init on dir with existing .claude/, asserts .gitignore and tasks/default/CLAUDE.md created | T-INIT-1 | PASS | Straightforward existence check; no vacuity concern given a prior existing .claude/ dir. |
| initialization.test.ts:Test1.5/"should handle multiple projects independently" (T-INIT-5) | Writes a file to project 1 personal dir, asserts file2 path in project 2 personal dir does not exist | T-INIT-5 | FAIL | The isolation check is vacuous: the test writes `file1` to project 1's path, then asserts `file2` (a *different* path in project 2) does not exist. File2 never existed — a stub that never creates any files at all would pass. This does not actually verify that scripts operating on project 1 cannot read/write project 2 storage. The test bypasses scripts entirely for the isolation check. |
| task-operations.test.ts:Test2.1/"should create task directory structure" | Runs task-create, asserts exit 0, task dir, CLAUDE.md, and contexts subdir exist | T-TASK-1 | PASS | Existence of all required artifacts checked; exit code asserted. No identified attack vector. |
| task-operations.test.ts:Test2.1/"should create task CLAUDE.md with description" (T-TASK-1) | Asserts all four required sections exist; additionally checks 'oauth' appears in Focus section specifically | T-TASK-1 | PASS | Section-specific check avoids false pass from description appearing in wrong section. No identified attack vector. |
| task-operations.test.ts:Test2.1/"should update .claude/CLAUDE.md with import directive" | Asserts .claude/CLAUDE.md exists and contains @import matching `/@import\s+\S+CLAUDE\.md/` | T-TASK-1 | FAIL | The regex `@import\s+\S+CLAUDE\.md` would be satisfied by `@import ./tasks/other-task/CLAUDE.md` — an import pointing to the wrong task. The test does not verify the import points to the newly created `oauth-refactor` task. |
| task-operations.test.ts:Test2.1/"should provide resume instruction in output" | Asserts stdout matches `/resume/i` | T-TASK-1 | FAIL | Not a DoD clause (T-TASK-1 only requires sections in CLAUDE.md). This is a circularity: the coverage claim is that the test covers T-TASK-1, but resume output is not part of T-TASK-1. Beyond that, the check is trivially satisfied by any output containing the word "resume". |
| task-operations.test.ts:Test2.2/"should reject task name with spaces" (T-TASK-2) | Asserts non-zero exit, output matches invalid/uppercase/lowercase pattern, task dir absent | T-TASK-2 | PASS | All three required conditions (non-zero exit, specific error message, no dir created) are asserted. No identified attack vector. |
| task-operations.test.ts:Test2.2/"should reject task name with uppercase" (T-TASK-2) | Non-zero exit, no dir for uppercase or lowercase variant | T-TASK-2 | PASS | Checks both possible normalised forms. No identified attack vector. |
| task-operations.test.ts:Test2.2/"should reject task name with special characters" | Non-zero exit, no dir created | T-TASK-2 | PASS | No identified attack vector. |
| task-operations.test.ts:Test2.2/"should not create directory for invalid task" | After spaces-in-name attempt, asserts neither spaced nor un-spaced dir exists | T-TASK-2 | FAIL | Does not assert exit code; a script that silently exits 0 and creates no dir would pass. T-TASK-2 requires non-zero exit. This test is incomplete — it only checks the "no files created" half. |
| task-operations.test.ts:Test2.3/"should capture full multi-line description" (T-TASK-3) | Asserts exit 0, CLAUDE.md exists, all three keywords in Focus section | T-TASK-3 | PASS | Section-scoped check prevents false pass from keywords appearing elsewhere. No identified attack vector. |
| task-operations.test.ts:Test2.4/"should reject empty description" (T-TASK-4) | Non-zero exit, no task dir created | T-TASK-4 | PASS | Covers both required conditions. No identified attack vector. |
| task-operations.test.ts:Test3.1/"should list personal contexts when switching" (T-LIST-1) | Asserts exit 0, output contains 'my-progress'; ordering check is conditional (only when both personal AND golden appear) | T-LIST-1 | FAIL | The ordering check is guarded: `if (personalIdx >= 0 && goldenIdx >= 0)` — since only personal contexts exist in this test, goldenIdx will be -1 and the ordering assertion is never executed. The DoD requires `indexOf("Personal") < indexOf("Golden")` — this test provides no evidence of correct ordering. |
| task-operations.test.ts:Test3.2/"should list golden contexts when switching" | Asserts exit 0 and output contains 'oauth-deep-dive' | T-LIST-1 | FAIL | Does not check ordering of Personal vs Golden sections. Covers only presence of a specific context name. |
| task-operations.test.ts:Test3.3/"should list both personal and golden contexts" | Asserts output.toLowerCase() contains 'personal' and 'golden' | T-LIST-1 | FAIL | Uses `output.toLowerCase()` contains checks which match any occurrence of the words, including error messages or task names containing those strings. Does not verify section ordering. |
| task-operations.test.ts:Test3.3/"should show personal contexts before golden" (T-LIST-1) | Asserts both personal and golden indices >= 0, then personal < golden | T-LIST-1 | PASS | Unconditional ordering check with existence pre-conditions. No identified attack vector. |
| task-operations.test.ts:Test3.4/"should indicate no contexts available and offer fresh start" (T-LIST-3) | Asserts exit 0, output matches `/no contexts|fresh/i` | T-LIST-3 | PASS | The DoD requires "fresh", "empty", or "no contexts"; the regex covers two of three. However "empty" is not included — minor incompleteness but not a FAIL since any one of the alternatives satisfies the DoD. No identified attack vector. |
| task-operations.test.ts:Test3.4/"should still allow task switch" | Asserts update-import exits 0 on task with no contexts | T-TASK-1 (implicit) | ESCALATE | No DoD clause listed for this test. Cannot evaluate coverage. |
| task-operations.test.ts:Test3.5/"should switch to default task" | Asserts exit 0, .claude/CLAUDE.md exists, content contains 'default' | T-CLMD-2 | FAIL | "Contains 'default'" is not specific enough — a file with any line mentioning the word 'default' satisfies this. The DoD requires exactly one @import line after two task switches. This test runs only one switch and checks presence of a word rather than @import structure. |
| task-operations.test.ts:Test3.5/"should indicate vanilla mode restored" | OR chain: output includes 'default' or 'vanilla' or 'restored' | T-CLMD-1 | FAIL | Explicit OR chain with three alternatives — violates T1 (No Vacuous OR Fallbacks). Any output containing any of these common words satisfies the assertion. |
| task-operations.test.ts:Test3.6/"should update .claude/CLAUDE.md on each switch" | Multiple update-import calls; each assertion is wrapped in `if (fileExists(...))` guards | T-CLMD-2 | FAIL | Every assertion in this test is inside an `if (fileExists(workingMdPath))` guard — violates T2 (No Conditional Assertions on File Existence). If the file doesn't exist, all assertions are skipped and the test passes vacuously. |
| context-operations.test.ts:Test4.1/"should save context to personal storage" (T-CTX-1) | Asserts exit 0, exact path exists at `<personalDir>/tasks/<task-id>/contexts/<name>.jsonl`, JSONL valid | T-CTX-1 | PASS | Path is specific and exact; JSONL validity checked unconditionally. No identified attack vector. |
| context-operations.test.ts:Test4.1/"should create valid JSONL file" (T-CTX-2) | Asserts file exists at expected path and isValidJsonl returns true | T-CTX-2 | FAIL | Does not assert exit code. A script that exits non-zero but somehow creates a valid file would pass. More critically: `isValidJsonl` passes for an empty file (the function returns `true` when `lines` after filtering is empty). If the script creates an empty JSONL file, this test passes — but an empty file is not a valid saved context. |
| context-operations.test.ts:Test4.1/"should not save to project .claude/ directory for personal" | Asserts golden path does NOT exist after personal save | T-CTX-1 | FAIL | Negative-only check. A stub that saves to neither location would pass. The positive check (personal path exists) is tested separately, but this test in isolation is vacuous. |
| context-operations.test.ts:Test4.2/"should save context to project directory for golden" | Exit 0, golden path exists, JSONL valid | T-CTX-1 | PASS | All three conditions checked. No identified attack vector. |
| context-operations.test.ts:Test4.2/"should run secret scan before saving golden" (T-CTX-3 implicit) | OR chain: output includes 'scan' or 'secret' or 'clean' | T-CTX-3 | FAIL | Explicit OR chain — violates T1. The word 'clean' is extremely common in output, making this assertion nearly tautological. A script that outputs "Operation complete and clean" without scanning anything passes. |
| context-operations.test.ts:Test4.2/"should block golden save when session contains a real AWS key" (T-CTX-3) | Non-zero exit, output matches `/aws|akia/` | T-CTX-3 | PASS | Required behavior and specific pattern checked. No identified attack vector. |
| context-operations.test.ts:Test4.3/"should reject context name with invalid characters" | Non-zero exit, invalid path does not exist | T-CTX-1 | FAIL | Does not assert a specific error message or type. An implementation that exits non-zero for any reason (e.g. missing session file) would pass even if name validation is not implemented. |
| context-operations.test.ts:Test4.5/"should handle empty context gracefully" | Non-zero exit, no stack trace in stderr | T-CTX-4 (implicit) | ESCALATE | The DoD does not have a clause for empty context rejection specifically. This test is labeled T-CTX-4 in a comment but T-CTX-4 is the 100KB golden cap. This is a mislabeled test covering an undefined DoD requirement. |
| context-operations.test.ts:Test4.5/"should reject golden save when context exceeds 100KB" (T-CTX-4) | Pre-verifies file size > 100KB, non-zero exit, output matches `/100KB|too large/i` | T-CTX-4 | PASS | Size pre-condition verified, exit code and specific output text required. No identified attack vector. |
| context-operations.test.ts:T-CTX-6/"should create a backup file when saving to an existing name" | Two saves, backup file with .backup- in name exists and matches original content | T-CTX-6 | PASS | All three required conditions (exit 0, backup file present, backup contains original content) verified. No identified attack vector. |
| context-operations.test.ts:Test5.1/"should list all contexts for task" (T-LIST-1) | Asserts exit 0 and output contains 'ctx-1' and 'ctx-2' | T-LIST-1 | FAIL | Checks specific context names (good), but does not check ordering (Personal before Golden) which is required by T-LIST-1. The DoD requires `indexOf("Personal") < indexOf("Golden")`. |
| context-operations.test.ts:Test5.1/"should show message counts" (T-LIST-2) | Asserts output matches `\b5\b` and `\b30\b` | T-LIST-2 | PASS | Word-boundary regex prevents matching partial numbers. No identified attack vector given SMALL_CONTEXT has 5 messages and createMediumContext() returns 30. |
| context-operations.test.ts:Test5.3/"should indicate no contexts found" (T-LIST-3) | Asserts output matches `/no contexts|empty/i` | T-LIST-3 | PASS | Two of three DoD alternatives covered; any one suffices. No identified attack vector. |
| context-operations.test.ts:Test5.4/"should show both personal and golden sections" (T-LIST-1) | Checks output contains 'personal' and 'golden' and personal index < golden index | T-LIST-1 | PASS | Unconditional ordering check with both indices verified >= 0. No identified attack vector. |
| context-operations.test.ts:Test5.5/"should error for non-existent task" | Non-zero exit, output matches `/not found|does not exist/i` | T-LIST-1 (error path) | ESCALATE | No specific DoD clause for non-existent task error handling. Coverage mapping to T-LIST-1 is a stretch. |
| context-operations.test.ts:Test6.1/"should report zero contexts" | Exit 0, output matches `/no contexts|empty/i` | T-LIST-3 | PASS | No identified attack vector. |
| context-operations.test.ts:Test6.6/"should list golden context with special indicator" | OR: output includes '⭐' or output.toLowerCase includes 'golden' | T-LIST-1 | FAIL | OR chain with 'golden' as a fallback — violates T1. The word 'golden' appearing anywhere (including error messages) satisfies the assertion. |
| context-operations.test.ts:Test6.6/"should prevent golden context deletion without confirmation" (T-CTX-7) | Pre-asserts golden file exists; runs delete without --confirm; asserts non-zero exit; asserts file still exists | T-CTX-7 | PASS | Both required conditions (non-zero exit, file survives) checked. No identified attack vector. |
| context-operations.test.ts:Test7.1/"should successfully promote clean context" (T-PROM-1) | Exit 0, golden path exists, personal path exists, byte-equality | T-PROM-1 | PASS | All three conditions in the DoD ("copies not moves": both exist; "byte-for-byte identical") verified. No identified attack vector. |
| context-operations.test.ts:Test7.1/"should copy to project golden directory" | Golden path exists, JSONL valid | T-PROM-1 | FAIL | Does not verify personal file still exists; covers only half of the "copies not moves" requirement. |
| context-operations.test.ts:Test7.1/"should preserve original personal context" | Personal content captured before promote; after promote personal still exists and content matches | T-PROM-1 | PASS | Byte-equality for personal file. No identified attack vector. |
| context-operations.test.ts:T-CTX-5/"should reject promote when personal context exceeds 100KB" | Non-zero exit, output matches `/100kb|too large/i` | T-CTX-5 | PASS | Specific pattern required. No identified attack vector. |
| context-operations.test.ts:Test7.2/"should detect secrets and warn/block" (T-PROM-2) | Non-zero exit, output matches `/aws|akia|access key|secret key/` | T-PROM-2 | FAIL | The DoD requires output "names the specific secret type". The regex `aws|akia|access key|secret key` is broad and the OR chain may match incidental text. More critically: the DoD for T-PROM-2 specifies `ghp_` + 36 alphanumeric chars (GitHub token) format, but this test uses AWS_KEY_CONTEXT. The test does not match the specific DoD test case. |
| context-operations.test.ts:Test7.3/"should offer redaction option" | Runs scan-secrets, non-zero exit, output matches `/stripe|sk_/i` | T-PROM-2 | ESCALATE | This test runs scan-secrets, not promote-context, and is labeled "offer redaction option" — which is not a DoD clause. The coverage mapping is unclear. |
| context-operations.test.ts:Test7.4/"should error for non-existent context" | Non-zero exit, output matches `/not found|does not exist/i` | T-PROM-1 (error path) | ESCALATE | No DoD clause for non-existent context in promote. |
| context-operations.test.ts:Test7.5/"should warn about already-golden context" (T-PROM-3) | Pre-creates both personal and golden; non-zero exit, output matches `/already.*golden|already exists/i` | T-PROM-3 | PASS | Both personal and golden set up in beforeEach (correctly triggers already-golden path); exit code and specific output text required. No identified attack vector. |
| secret-detection.test.ts:Test9.1/"should detect AWS access key pattern" (T-SEC-2) | Non-zero exit, output includes 'aws' or 'akia' | T-SEC-2 | FAIL | OR chain `output.includes('aws') || output.includes('akia')` — violates T1. 'aws' is an extremely common substring. The DoD requires output contains "AWS" or "AKIA" — the test uses OR so either alone suffices; a script that outputs "No aws configured" without detecting the key passes. Additionally the check uses `output.includes` rather than checking for the detection specifically. |
| secret-detection.test.ts:Test9.1/"should identify AWS secret key pattern" | Non-zero exit, output matches `/secret.*key|aws/i` | T-SEC-2 | FAIL | OR with 'aws' as fallback — same vacuity problem. A script that outputs "Scanning for aws secrets" without detecting any specific key satisfies both branches. |
| secret-detection.test.ts:Test9.2/"should detect Stripe live key pattern" | Output matches `/sk_live/i` — but does NOT assert non-zero exit | T-SEC-3 | FAIL | Missing exit code assertion — violates T5. A script that outputs "sk_live keys are dangerous" without detecting the actual key and exits 0 would pass. |
| secret-detection.test.ts:Test9.2/"should detect both test and live keys" (T-SEC-3) | Non-zero exit, output contains 'sk_test' and 'sk_live' | T-SEC-3 | PASS | Both key types required in output; exit code asserted. No identified attack vector. |
| secret-detection.test.ts:Test9.3/"should detect GitHub personal access token" | Non-zero exit, output matches `/github|ghp_/i` | T-SEC-2 (implicit, no direct mapping) | FAIL | The OR pattern `github|ghp_` means a script outputting "github scanning active" without detecting the token satisfies the assertion. No DoD clause explicitly covers GitHub token detection (T-SEC-2 is AWS, T-SEC-3 is Stripe). This test covers an undocumented requirement. |
| secret-detection.test.ts:Test9.4/"should detect RSA private key header" | Non-zero exit, output matches `/rsa|private key/i` | T-SEC-2 (undocumented) | FAIL | OR with 'private key' as fallback — a script that outputs "Checking for private key material" without detecting the RSA header passes. No DoD clause for private key detection. |
| secret-detection.test.ts:Test9.5/"should detect password assignment patterns" | Non-zero exit, output matches `/password|credential/i` | T-SEC-2 (undocumented) | FAIL | OR chain. No DoD clause for password detection. 'password' is extremely common in output. |
| secret-detection.test.ts:Test9.6/"should treat AKIAIOSFODNN7EXAMPLE as a true positive" (T-SEC-5) | Non-zero exit, output includes 'aws' or 'akia' | T-SEC-5 | FAIL | The DoD says `AKIAIOSFODNN7EXAMPLE` is treated as a true positive. The test uses AWS_KEY_CONTEXT which does contain this string — but the OR chain (`output.includes('aws') || output.includes('akia')`) means a script that detects the *other* AWS key in the fixture (not AKIAIOSFODNN7EXAMPLE specifically) would pass. The test does not isolate the example key. A fixture containing ONLY `AKIAIOSFODNN7EXAMPLE` is required to properly test T-SEC-5. |
| secret-detection.test.ts:Test9.7/"should report correct count of multiple secrets" (T-SEC-7) | Non-zero exit, output matches `\b5\b` | T-SEC-7 | FAIL | MULTIPLE_SECRETS_CONTEXT contains one message with 5 credentials. The test asserts `\b5\b` in output — but the number 5 could appear in a timestamp, line number, or unrelated count. The DoD requires count matching `\b4\b` for a 4-secret context — yet the test fixture has 5 secrets. The test ID (T-SEC-7) and fixture are inconsistent with the DoD, which specifies exactly 4 secrets reporting `\b4\b`. |
| secret-detection.test.ts:Test9.8/"should detect secrets in user, assistant, and tool_result messages" (T-SEC-4) | Non-zero exit; count check `output.match(/\b([3-9]|\d{2,})\b/)` is not null | T-SEC-4 | FAIL | The count regex `\b([3-9]|\d{2,})\b` matches any number 3-9 or any 2+ digit number appearing anywhere in output, including timestamps, line numbers, or process IDs. This is essentially `/\d+/.test(output)` with a floor — a tautology. The DoD requires all three message types to be scanned; the test does not verify per-type reporting, only that some number >= 3 appears in output. |
| secret-detection.test.ts:Test9.9/"should produce clean valid JSONL after redaction" (T-SEC-6) | Exit 0 on redact, redacted file exists, isValidJsonl true, rescan exits 0 and output matches `/clean/i` | T-SEC-6 | PASS | All four conditions from the DoD verified unconditionally. No identified attack vector. |
| secret-detection.test.ts:Test9.9/"should remove or mask secrets in output" | Redacted file exists, original secret string absent, one of REDACTED/\*\*\*/[REMOVED] present | T-SEC-6 | FAIL | OR chain for redaction marker — violates T1. More importantly `isValidJsonl` passes for empty file; a script that creates an empty redacted file with no original secret (trivially absent) and no redaction marker would fail only on the marker check, but a stub outputting '***' anywhere in the file would pass. |
| claude-md-system.test.ts:Test8.1/"should not modify root CLAUDE.md during init" | After init, root content equals original | T-CLMD-1 | PASS | No identified attack vector. |
| claude-md-system.test.ts:Test8.1/"should not modify root CLAUDE.md during task creation" | After two task-creates, root content equals original | T-CLMD-1 | PASS | No identified attack vector. |
| claude-md-system.test.ts:Test8.1/"should not modify root CLAUDE.md during task switching" | After multiple update-import calls, root content equals original | T-CLMD-1 | PASS | No identified attack vector. |
| claude-md-system.test.ts:Test8.1/"should show no git changes to root CLAUDE.md" | Runs task-create and update-import; asserts no git status line ends with 'CLAUDE.md' without '.claude/' prefix | T-CLMD-1 | PASS | Specific git status line parsing. No identified attack vector. |
| claude-md-system.test.ts:Test8.2/"should contain exactly one @import after multiple switches" (T-CLMD-2) | After two update-imports, counts lines starting with @import; asserts exactly 1 and it contains 'task-2' not 'task-1' | T-CLMD-2 | PASS | Directly covers the DoD clause. No identified attack vector. |
| claude-md-system.test.ts:Test8.3/"should be ignored by git" (T-GIT-1) | Asserts isGitIgnored returns true for .claude/CLAUDE.md | T-GIT-1 | ESCALATE | Same concern as Test1.1 git test: .gitignore is committed in beforeEach (git commit 'Initial commit' does not include .claude/.gitignore; init-project is run after). The .claude/.gitignore is not committed before isGitIgnored is called, meaning git check-ignore may not honor it depending on git version. |
| claude-md-system.test.ts:Test8.3/"should not appear in git status" | Commits .gitignore, then stages .claude/, asserts status does not include .claude/CLAUDE.md | T-GIT-1 | PASS | .gitignore committed before checking; specific pattern checked. No identified attack vector. |
| claude-md-system.test.ts:Test8.5/"should set up the correct @import path for /resume to read" (T-CLMD-2 proxy) | After update-import, @import line present in .claude/CLAUDE.md; task's CLAUDE.md exists | T-CLMD-2 | FAIL | Does not verify the @import path in .claude/CLAUDE.md *resolves to* the oauth-work task CLAUDE.md. It only checks that a file exists at `tasks/oauth-work/CLAUDE.md` independently and that the @import regex matches some path. A script that writes `@import ./tasks/default/CLAUDE.md` after an oauth-work switch would satisfy this test. |
| git-integration.test.ts:Test11.1/"should include CLAUDE.md in .gitignore" | Asserts .gitignore content matches `/^CLAUDE\.md$/m` | T-GIT-1 | PASS | No identified attack vector. |
| git-integration.test.ts:Test11.4/"should not include personal storage in git" (T-GIT-2) | After save-context, stages '.', asserts no status line contains personalBase or 'personal-ctx' or 'my-work' | T-GIT-2 | FAIL | Personal storage is located outside projectDir (in a separate tmpdir). Staging '.' in projectDir cannot possibly capture files outside projectDir. The test does not verify that personal storage is gitignored; it verifies that an impossible staging never occurred. A stub that puts personal files inside projectDir would not be caught by this test. |
| git-integration.test.ts:Test11.5/"should produce no UU conflict markers when two devs work independently" | Creates two isolated git repos and asserts no 'UU' prefix in their status outputs | T-GIT-2 (implicit) | FAIL | These are two completely independent repos with no shared remote — merge conflicts between them are structurally impossible. The test proves nothing about conflict avoidance under real shared-repo conditions. Vacuous. |
| git-integration.test.ts:Test11.7/"should be ignored by git check-ignore" | Commits .gitignore, calls isGitIgnored | T-GIT-1 | PASS | .gitignore committed before check. No identified attack vector. |
| error-handling.test.ts:Test13.1/"should handle missing .claude directory gracefully" (T-ERR-1) | Non-zero exit, output matches `/init|not initialized/i`, no stack trace in stderr | T-ERR-1 | PASS | All three conditions from the DoD (non-zero, mentions init, no stack trace) verified. No identified attack vector. |
| error-handling.test.ts:Test13.3/"should detect corrupt JSONL" (T-ERR-2) | Non-zero exit, no stack trace in stderr | T-ERR-2 | FAIL | The DoD requires `exitCode !== 0`. The test asserts that — but does not assert anything about the *output* message quality. A script that crashes with exit 1 and no output satisfies this test. More importantly: `expect(result.stderr).not.toContain('at Object.<anonymous>')` is not a sufficient no-stack-trace check — other stack trace patterns (e.g. `at Module._compile`) would pass through. |
| error-handling.test.ts:Test13.3/"should not crash on invalid JSON in context" | Non-zero exit, no `at Object.<anonymous>` in stderr | T-ERR-2 | FAIL | Same insufficient stack-trace check. The regex `/at\s+\w+\s+\(/` used elsewhere in the file is stronger — this test uses a weaker string match. |
| error-handling.test.ts:Test12.4/"should handle paths with spaces" (T-ERR-3) | Exit 0 both times, .claude/CLAUDE.md exists | T-ERR-3 | FAIL | Runs init-project twice and checks exit code and file existence — but does not perform any *other operation* (task-create, save-context, etc.) with the spaced path. The DoD requires "All operations work when project path contains a space; verified by exitCode === 0 AND output file existence." This test only validates init, not all operations. |
| new-features.test.ts:T-CTX-5/"should reject promote when personal context exceeds 100KB" | Non-zero exit, output includes '100kb' or 'too large' or 'size' | T-CTX-5 | FAIL | OR chain adds 'size' as a fallback — violates T1. 'size' is extremely common in output. The context-operations.test.ts version of this test uses `output.matches(/100kb|too large/i)` without 'size'. This version is weaker. |
| new-features.test.ts:T-CTX-6/"should create a .backup- file when saving to an existing name" | Two saves, backup file exists, backup matches original content | T-CTX-6 | PASS | Duplicate of context-operations.test.ts T-CTX-6 test. No identified attack vector in this version either. |
| new-features.test.ts:T-HOOK-1/"should create a timestamped auto-save file when called with a session_id payload" | Stdin payload written; script invoked; exit 0; if contexts dir exists, auto-*.jsonl present and valid JSONL | T-HOOK-1 | FAIL | The existence check for the auto-saved file is inside `if (existsSync(contextsDir))` — violates T2. If the script never creates the contexts directory, the assertion block is skipped and the test passes despite the script failing to produce any output. |
| new-features.test.ts:T-MEM-1/"should add task-id and context-name to personal MEMORY.md after save" | After save-context, waits 2s, asserts MEMORY.md exists and contains task-id and context-name | T-MEM-1 | FAIL | The 2-second sleep is a race condition — `update-memory` is described as "spawned detached" and may not complete within 2 seconds in all environments. The test will produce intermittent false negatives. Beyond the timing issue: if update-memory is detached from the save-context process, a save-context stub that exits 0 without spawning update-memory will pass the exit code check, and the sleep makes the timing of the subsequent file check non-deterministic. |

---

## Section 2: DoD Coverage Gaps

### T-INIT-1: Project initialization — `init-project` creates `.claude/CLAUDE.md` containing an `@import` line; the file must not exist before the script runs

Tests claiming coverage: initialization.test.ts Test1.1 "should create .claude/ directory structure", initialization.test.ts Test1.2 "should create .claude/CLAUDE.md with @import directive", task-operations.test.ts Test2.1 "should update .claude/CLAUDE.md with import directive"

**INADEQUATE.** The @import path existence check resolves relative to projectDir rather than from .claude/, making the path verification incorrect. No test verifies the @import points specifically to the default task's CLAUDE.md after init (any existing file satisfies the check). The task-operations variant does not verify the import points to the newly created task.

---

### T-INIT-2: CLAUDE.md backup — `init-project` copies root `CLAUDE.md` byte-for-byte to the stash path; backup must not exist before script runs

Tests claiming coverage: initialization.test.ts Test1.2 "should create backup of original CLAUDE.md", initialization.test.ts Test1.1 "should not create backup when no original CLAUDE.md exists"

**INADEQUATE.** The positive test (T-INIT-2 proper) is PASS and correctly tests the clause. However the negative test ("should not create backup when no original CLAUDE.md exists") is vacuous — a stub that never creates backups passes it trivially without providing any evidence of correct positive behavior.

---

### T-INIT-3: Default task copy — `.claude/tasks/default/CLAUDE.md` content equals root `CLAUDE.md` character-for-character

Tests claiming coverage: initialization.test.ts Test1.2 "should create default task with copy of original CLAUDE.md"

**ADEQUATE.** Pre-condition asserts file absent; post-condition verifies byte equality. No gap.

---

### T-INIT-4: Idempotent init — Running `init-project` twice exits 0 both times and produces identical file contents

Tests claiming coverage: initialization.test.ts Test1.3 "should succeed on both initializations", "should not create duplicate directories", "should indicate already initialized on second run", "should produce identical files on second run"

**INADEQUATE.** Only "should produce identical files on second run" covers the content-identity half of the clause. The other three tests check exit codes, directory counts, or output text — not content identity. The clause requires BOTH exit-0 AND identical contents; no single test unconditionally asserts both together.

---

### T-INIT-5: Multi-project isolation — Writing a file to project A's personal dir does not make it visible in project B's personal dir

Tests claiming coverage: initialization.test.ts Test1.5 "should handle multiple projects independently"

**INADEQUATE.** The isolation check writes a file directly to the filesystem (bypassing scripts) and asserts a different path does not exist. This never exercises the scripts and does not verify that scripts running on project A cannot access project B's storage. Vacuous isolation test.

---

### T-TASK-1: Task creation structure — `task-create` produces CLAUDE.md with all required sections: `# Task:`, `## Focus`, `## Key Areas`, `## Guidelines`

Tests claiming coverage: task-operations.test.ts Test2.1 "should create task CLAUDE.md with description", "should create task directory structure", "should update .claude/CLAUDE.md with import directive"

**INADEQUATE.** The section content test (PASS) correctly checks all four sections and that description appears under Focus. The import directive test does not verify the import points to the correct newly created task. The "resume instruction" test is not a DoD requirement and pollutes coverage.

---

### T-TASK-2: Task name validation — `task-create` with uppercase name exits non-zero AND creates no task directory

Tests claiming coverage: task-operations.test.ts Test2.2 multiple tests

**INADEQUATE.** "should not create directory for invalid task" does not assert exit code — violating half the clause. The other tests are PASS. A test covering both conditions in a single assertion is missing.

---

### T-TASK-3: Multi-line description — `task-create` with multi-line description preserves all lines in the Focus section

Tests claiming coverage: task-operations.test.ts Test2.3 "should capture full multi-line description"

**ADEQUATE.** Section-scoped check with multiple keywords. No gap.

---

### T-TASK-4: Empty description handling — `task-create` with empty description exits non-zero and creates no task directory

Tests claiming coverage: task-operations.test.ts Test2.4 "should reject empty description"

**ADEQUATE.** Both conditions checked. No gap.

---

### T-CTX-1: Personal context save path — `save-context --personal` creates file at exactly `<personalDir>/tasks/<task-id>/contexts/<name>.jsonl`

Tests claiming coverage: context-operations.test.ts Test4.1 "should save context to personal storage"

**ADEQUATE.** Exact path verified, JSONL validity checked. No gap identified.

---

### T-CTX-2: Valid JSONL output — Saved context file parses as valid JSONL — asserted unconditionally, not inside an `if (fileExists)` guard

Tests claiming coverage: context-operations.test.ts Test4.1 "should create valid JSONL file"

**INADEQUATE.** `isValidJsonl` returns true for empty files (zero non-blank lines). A script creating an empty file passes T-CTX-2 under these tests. The test does not assert that the saved file contains at least the messages from the source session.

---

### T-CTX-3: Secret scan blocks golden — `save-context --golden` on a session with a real AWS key exits non-zero or produces a prompt; exit 0 with no prompt is a failure

Tests claiming coverage: context-operations.test.ts Test4.2 "should block golden save when session contains a real AWS key"

**ADEQUATE.** Non-zero exit and AWS-specific output required. The "should run secret scan before saving golden" test is FAIL (OR chain) but the hard-blocking test is PASS. Core requirement covered.

---

### T-CTX-4: 100KB golden cap (save) — `save-context --golden` on a 150KB session exits non-zero with output containing "100KB" or "too large"

Tests claiming coverage: context-operations.test.ts Test4.5 "should reject golden save when context exceeds 100KB"

**ADEQUATE.** File size pre-verified; exit code and specific text required. No gap.

---

### T-CTX-5: 100KB golden cap (promote) — `promote-context` on a 150KB personal context exits non-zero with output containing "100KB" or "too large"

Tests claiming coverage: context-operations.test.ts T-CTX-5, new-features.test.ts T-CTX-5

**INADEQUATE.** The new-features.test.ts version adds 'size' as an OR fallback, weakening the assertion. The context-operations.test.ts version is PASS. Two tests covering the same clause with inconsistent strictness; the weaker test undermines confidence.

---

### T-CTX-6: Overwrite protection — `save-context` called twice with the same name creates a `.backup-` file; the backup contains the original content

Tests claiming coverage: context-operations.test.ts T-CTX-6, new-features.test.ts T-CTX-6

**ADEQUATE.** Both tests are PASS with identical logic. Duplicate coverage, but no gap.

---

### T-CTX-7: Golden deletion warning — `delete-context` on a golden context exits non-zero without `--confirm` flag; the file still exists after the failed attempt

Tests claiming coverage: context-operations.test.ts Test6.6 "should prevent golden context deletion without confirmation"

**ADEQUATE.** Both conditions verified. No gap.

---

### T-LIST-1: Context list ordering — `context-list` output: indexOf("Personal") < indexOf("Golden") AND specific context names appear

Tests claiming coverage: task-operations.test.ts Tests 3.1, 3.2, 3.3, 3.3-ordering; context-operations.test.ts Tests 5.1, 5.4; context-operations.test.ts Test6.6

**INADEQUATE.** Multiple tests claiming T-LIST-1 fail on ordering. Only task-operations.test.ts Test3.3 "should show personal contexts before golden" and context-operations.test.ts Test5.4 unconditionally verify ordering. The golden indicator test uses a forbidden OR chain. Fragmented coverage; the DoD requires both ordering AND specific names in a single scenario.

---

### T-LIST-2: Message count display — `context-list` shows exact message count matching `\b<N>\b`

Tests claiming coverage: context-operations.test.ts Test5.1 "should show message counts"

**ADEQUATE.** Word-boundary regex used for both expected counts. No gap.

---

### T-LIST-3: No-contexts fresh start — When no contexts exist, `context-list` output contains "fresh", "empty", or "no contexts"

Tests claiming coverage: task-operations.test.ts Test3.4, context-operations.test.ts Test5.3, Test6.1

**ADEQUATE.** Multiple tests covering the three alternative outputs. No gap.

---

### T-LIST-4: AI-generated summary — `context-list` shows a non-empty description string after each context name, not just metadata

Tests claiming coverage: None identified in any test file.

**MISSING.** No test verifies that context-list displays an AI-generated summary alongside each context name. This clause is entirely untested.

---

### T-PROM-1: Promote copies not moves — After `promote-context`, both personal original and golden copy exist; contents are byte-for-byte identical

Tests claiming coverage: context-operations.test.ts Test7.1 "should successfully promote clean context", "should copy to project golden directory", "should preserve original personal context"

**INADEQUATE.** "should copy to project golden directory" only checks golden exists (not that personal also exists). The complete clause is covered across two separate tests but no single test verifies all three conditions (golden exists, personal exists, byte-equal). An implementation that moves rather than copies would pass "should copy to project golden directory" alone.

---

### T-PROM-2: Secret detection for promotion — `promote-context` on a context with `ghp_` + 36 alphanumeric chars: output names the specific secret type

Tests claiming coverage: context-operations.test.ts Test7.2 "should detect secrets and warn/block", Test7.3 "should offer redaction option"

**INADEQUATE.** The DoD specifies a GitHub token (`ghp_` + 36 chars) as the test fixture. Test7.2 uses AWS_KEY_CONTEXT, not a GitHub token context. The DoD clause is not tested with the specified fixture. Test7.3 runs scan-secrets, not promote-context. The type-specific output requirement ("names the specific secret type") is only loosely satisfied by the broad OR regex.

---

### T-PROM-3: Already-golden warns — `promote-context` when golden already exists exits non-zero or warns; setup must create personal context only

Tests claiming coverage: context-operations.test.ts Test7.5 "should warn about already-golden context"

**ADEQUATE.** beforeEach correctly creates both personal (source) and golden (trigger); exit code and specific output text required. No gap.

---

### T-GIT-1: `.claude/CLAUDE.md` git-ignored — `git check-ignore .claude/CLAUDE.md` exits 0 in a real git repo after init

Tests claiming coverage: initialization.test.ts Test1.1 "should work with git initialized", claude-md-system.test.ts Test8.3 "should be ignored by git", git-integration.test.ts Test11.7 "should be ignored by git check-ignore"

**INADEQUATE.** Two of three tests (initialization.test.ts and claude-md-system.test.ts) call `isGitIgnored` before committing .claude/.gitignore, making git check-ignore behavior version-dependent and unreliable. Only git-integration.test.ts Test11.7 commits .gitignore first and is PASS. The ESCALATE verdicts on the other two mean this clause has one reliable test.

---

### T-GIT-2: Personal storage never committed — After a full workflow in a real git repo, `git status --porcelain` does not list any path containing the personal storage prefix

Tests claiming coverage: git-integration.test.ts Test11.4 "should not include personal storage in git", Test11.5 "should produce no UU conflict markers"

**INADEQUATE.** Test11.4 stages '.' in projectDir while personal storage is in a separate tmpdir outside projectDir — making it structurally impossible for personal files to appear in git status regardless of implementation. Test11.5 tests merge conflicts between independent repos (vacuous). Neither test actually verifies that a script which incorrectly writes personal data inside the project directory would be caught.

---

### T-SEC-2: AWS key detection — `scan-secrets` on a file with `AKIA` + 16 uppercase alphanumeric chars exits non-zero; output contains "AWS" or "AKIA"

Tests claiming coverage: secret-detection.test.ts Test9.1 "should detect AWS access key pattern", "should identify AWS secret key pattern"

**INADEQUATE.** Both tests use OR chains that allow 'aws' as a fallback, enabling a script that mentions 'aws' in any context (e.g. "No aws credentials found" when incorrectly exiting 0) to pass one branch. Only the exit code check is reliable.

---

### T-SEC-3: Stripe key detection — `scan-secrets` detects both `sk_test_` and `sk_live_`; output names the specific key type

Tests claiming coverage: secret-detection.test.ts Test9.2 "should detect both test and live keys"

**ADEQUATE.** Both key type strings required in output; exit code asserted. "should detect Stripe live key pattern" is FAIL (missing exit code) but the comprehensive test covers the clause. No gap for the core requirement.

---

### T-SEC-4: All message types scanned — A context with one secret in user, one in assistant, one in tool_result: all three reported

Tests claiming coverage: secret-detection.test.ts Test9.8 "should detect secrets in user, assistant, and tool_result messages"

**INADEQUATE.** The count regex matches any number 3 or greater appearing anywhere in output (timestamps, line numbers, etc.). The test does not verify that all three message types are individually reported — only that some large-enough number appears. A scanner that scans all messages but reports count as one total would still produce a number in the output that satisfies the regex.

---

### T-SEC-5: False positive policy — `AKIAIOSFODNN7EXAMPLE` is treated as a true positive

Tests claiming coverage: secret-detection.test.ts Test9.6 "should treat AKIAIOSFODNN7EXAMPLE as a true positive"

**INADEQUATE.** The test uses AWS_KEY_CONTEXT which contains multiple AWS credentials. The OR exit check could pass due to detection of the *other* credential in the fixture, not AKIAIOSFODNN7EXAMPLE specifically. A fixture containing ONLY `AKIAIOSFODNN7EXAMPLE` with no other detectable secrets is required to isolate this clause.

---

### T-SEC-6: Redaction produces valid JSONL — After `redact-secrets`, every line parses as JSON; a second `scan-secrets` run returns "clean"

Tests claiming coverage: secret-detection.test.ts Test9.9 "should produce clean valid JSONL after redaction"

**ADEQUATE.** All four conditions (exit 0 on redact, file exists, valid JSONL, rescan clean) verified unconditionally. No gap.

---

### T-SEC-7: Multiple secrets exact count — `scan-secrets` on a context with exactly 4 secrets reports count matching `\b4\b`

Tests claiming coverage: secret-detection.test.ts Test9.7 "should report correct count of multiple secrets"

**INADEQUATE.** The DoD specifies a 4-secret fixture and `\b4\b`. The test uses MULTIPLE_SECRETS_CONTEXT (5 secrets) and checks for `\b5\b`. The fixture and count do not match the DoD. Additionally, the count digit could appear in timestamps or other output fields.

---

### T-ERR-1: Missing .claude/ graceful — Any script run without init exits non-zero with output containing "initialized" or "init" — not a stack trace

Tests claiming coverage: error-handling.test.ts Test13.1 "should handle missing .claude directory gracefully"

**ADEQUATE.** All three conditions verified. No gap.

---

### T-ERR-2: Corrupt JSONL handled — `scan-secrets` on malformed JSONL exits non-zero (not 0)

Tests claiming coverage: error-handling.test.ts Test13.3 "should detect corrupt JSONL", "should not crash on invalid JSON in context"

**INADEQUATE.** Exit code assertion is present but stack-trace detection uses `not.toContain('at Object.<anonymous>')` — insufficient to catch all Node.js stack trace patterns (e.g., `at Module._compile`, `at internal/modules`). The stronger regex `/at\s+\w+\s+\(/` used elsewhere in the codebase is absent here.

---

### T-ERR-3: Paths with spaces — All operations work when project path contains a space; verified by exitCode === 0 AND output file existence

Tests claiming coverage: error-handling.test.ts Test12.4 "should handle paths with spaces"

**INADEQUATE.** Only `init-project` (run twice) is tested with the spaced path. The DoD requires "all operations" — task-create, save-context, context-list, promote-context, etc. are not tested.

---

### T-HOOK-1: PreCompact auto-save — `auto-save-context` with a mock stdin payload creates a timestamped file at the expected personal context path

Tests claiming coverage: new-features.test.ts T-HOOK-1 "should create a timestamped auto-save file when called with a session_id payload"

**INADEQUATE.** The auto-saved file existence check is inside `if (existsSync(contextsDir))` — violates T2. A script that never creates the contexts directory causes all assertions to be skipped. The test passes vacuously when the script does nothing.

---

### T-MEM-1: MEMORY.md updated after save — After `save-context`, the personal memory MEMORY.md contains the task-id and context-name saved

Tests claiming coverage: new-features.test.ts T-MEM-1 "should add task-id and context-name to personal MEMORY.md after save"

**INADEQUATE.** The test depends on a 2-second sleep for a detached background process. This is a race condition that produces intermittent false negatives in slow environments. The test structure does not guarantee the background process has completed before assertions run.

---

### T-RESUME-MANUAL: /resume smoke test — MANUAL: After `/task <id>` + `/resume <session>`, Claude's response references task CLAUDE.md content

Tests claiming coverage: claude-md-system.test.ts Test8.5 "should set up the correct @import path for /resume to read" (structural proxy)

**INADEQUATE.** The structural proxy (Test8.5) does not verify that the @import path in .claude/CLAUDE.md resolves to the correct task's CLAUDE.md — it only checks that some @import exists and the task's file exists independently. The manual test T-RESUME-MANUAL has no automated proxy that would catch an incorrect @import target. The DoD clause remains effectively unverifiable by the automated suite.

---

### PRD Section — AI-Generated Summary (T-LIST-4)

**CLAUSE: T-LIST-4 — MISSING — STRICT FAIL.** No test exists that verifies `context-list` shows a non-empty AI-generated description string after each context name. The DoD clause is explicitly defined but has zero test coverage.

---

### PRD Sections with No Corresponding DoD Clause

The following PRD sections describe features or behaviors with no DoD clause and no test coverage:

- **CLAUSE: [Core Concepts / Warm-Up Problem] — NO DOD DEFINED — STRICT FAIL.** The executive summary and core concepts section describes the fundamental value proposition (preserving warm-up time, subsystem understanding) with no measurable acceptance criterion or test.
- **CLAUSE: [Claude Code Integration / /resume re-reads CLAUDE.md] — NO DOD DEFINED (partial) — STRICT FAIL.** The integration notes state this behavior is relied upon but T-RESUME-MANUAL is marked MANUAL with no automated DoD clause. The structural proxy (T-CLMD-2) covers the @import structure but not the /resume behavior itself.
- **CLAUSE: [Implementation Notes / Test Contract Rules T1-T6] — NO DOD DEFINED — STRICT FAIL.** The test contract rules (T1 through T6) are meta-requirements about test quality. No automated mechanism verifies that the test suite itself complies with these rules. Multiple tests in this suite violate T1 (OR chains), T2 (conditional file existence guards), and T5 (missing exit code assertions) — and no test detects these violations.
- **CLAUSE: [Git Best Practices] — NO DOD DEFINED — STRICT FAIL.** The PRD describes git best practices for the project but provides no measurable acceptance criterion.
