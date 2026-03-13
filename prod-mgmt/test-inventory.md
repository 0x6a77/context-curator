# Test Inventory
**Generated:** 2026-03-13
**Analyst:** Red Team / Second Line of Defence

---

## Section 1 — Test Inventory

| TEST_ID | DESCRIPTION | AC_CLAUSE | COVERAGE_RATIONALE | VERDICT |
|---------|-------------|-----------|-------------------|---------|
| initialization.test.ts::Test-1.1-a "should create .claude/ directory structure" | Runs init-project on empty dir, asserts exit 0, asserts .claude, .gitignore, default/CLAUDE.md exist, and that .claude/CLAUDE.md @import points to tasks/default/CLAUDE.md | T-INIT-1 | Asserts the file exists unconditionally, checks @import line is present, resolves import path and asserts it exists on disk. Exit code asserted. No conditional guard. | PASS |
| initialization.test.ts::Test-1.1-b "should create .gitignore with CLAUDE.md entry" | Asserts exit 0, reads .claude/.gitignore, matches `/^CLAUDE\.md$/m` | T-INIT-1 (partial) | Covers the gitignore side-effect of init but is separate from T-INIT-1's primary criterion. No gap for this clause here. | PASS |
| initialization.test.ts::Test-1.1-c "should not create backup when no original CLAUDE.md exists" | Asserts exit 0, asserts stash path does not exist, asserts default task was created (positive anchor) | T-INIT-2 (negative case) | Correctly anchors the negative assertion with a positive pre-condition. Does not cover the positive T-INIT-2 case. | PASS |
| initialization.test.ts::Test-1.1-d "should work with git initialized" | Inits git first, then runs init-project, asserts exit 0, checks isGitIgnored | T-GIT-1 (partial) | Vacuity risk: isGitIgnored calls `git check-ignore` BEFORE committing the .gitignore. If init-project does not `git add` the .gitignore automatically, `git check-ignore` may fail or succeed vacuously depending on git version behavior with untracked .gitignore files. The file may be parsed even when untracked on some git versions — this is not a reliable test of T-GIT-1. | ESCALATE |
| initialization.test.ts::Test-1.2-a "should not modify root CLAUDE.md" | Pre-creates CLAUDE.md, runs init-project, reads and asserts identical content | T-CLMD-1 | Covers post-init case only. Does not cover post-task-create or post-update-import. Covered more broadly by claude-md-system.test.ts. | PASS |
| initialization.test.ts::Test-1.2-b "should create backup of original CLAUDE.md" | Pre-condition asserts backup does NOT exist, runs script with CLAUDE_HOME, asserts backup exists and content equals original | T-INIT-2 | Self-fulfilling setup risk eliminated — pre-condition explicitly asserts backup absent before run. Content equality checked. | PASS |
| initialization.test.ts::Test-1.2-c "should create default task with copy of original CLAUDE.md" | Pre-condition: default task CLAUDE.md does not exist. Runs script. Asserts content equality. | T-INIT-3 | Content is asserted to be character-for-character identical. Pre-condition eliminates self-fulfilling setup. | PASS |
| initialization.test.ts::Test-1.2-d "should create .claude/CLAUDE.md with @import directive" | Pre-condition: file absent. Runs script. Asserts @import present, import path contains 'tasks/default/CLAUDE.md', imported file exists. | T-INIT-1 | Covers T-INIT-1 with pre-existence check and path resolution. | PASS |
| initialization.test.ts::Test-1.3-a "should succeed on both initializations" | Runs init twice, captures content after first, asserts equality after second. | T-INIT-4 | Covers both exit 0 and content identity. Does not check stash deduplication. Partial T-INIT-4 coverage. | PASS |
| initialization.test.ts::Test-1.3-b "should not create duplicate directories" | Runs init twice, checks tasks dir has only one 'default' entry, checks content identity. | T-INIT-4 (partial) | Covers directory deduplication and content identity. Does not check stash deduplication. | PASS |
| initialization.test.ts::Test-1.3-c "should indicate already initialized on second run" | Runs init twice, checks exit 0 both times, checks content identity. Note: does NOT assert any output message about "already initialized". | T-INIT-4 | The test name claims to check "already initialized" output but the test body only checks exit codes and file content. AC T-INIT-4 only requires exit 0 and identical files, so the test does satisfy T-INIT-4. The misleading name is a documentation issue, not a coverage gap. | PASS |
| initialization.test.ts::Test-1.3-d "should produce identical files on second run and not duplicate stash" | Runs init twice, checks content identity, asserts stash dir exists unconditionally, asserts exactly one CLAUDE stash file. | T-INIT-4 | Covers stash deduplication unconditionally. The assertion `stashFiles.length === 1` fails if the implementation creates 0 or 2+ stash files. | PASS |
| initialization.test.ts::Test-1.4 "should preserve existing .claude/ content" | Pre-creates .claude/existing-file.txt, runs init, asserts existing file untouched | T-INIT-1 (side effect) | Not directly an AC clause but tests a documented expected behavior. No AC gap introduced. | PASS |
| initialization.test.ts::Test-1.5 "should handle multiple projects independently" | Creates two project dirs, runs save-context through implementation, asserts project A's context does not appear in project B's personal dir and vice versa. | T-INIT-5 | Uses save-context through the implementation rather than direct file writes, satisfying the spirit of T-INIT-5. Critical gap: the test creates a session file at `join(personalPath1, 'current-session.jsonl')` — but personalPath1 is `join(ctx.personalBase, 'projects', sanitizePath(ctx.projectDir))`. This is the per-project directory, not the personalBase itself. If save-context looks for current-session.jsonl in a different location, the script will silently fail to find it, save-context will exit non-zero, and the test will fail at `expect(saveResult.exitCode).toBe(0)`. However that is a test environment correctness issue, not a vacuity issue. If save-context does find the file, the test legitimately exercises T-INIT-5. Assuming the path formula is correct, test PASSES for the AC. | PASS |
| task-operations.test.ts::Test-2.1-a "should create task directory structure" | Runs task-create, asserts exit 0, asserts task dir, CLAUDE.md, contexts/ exist | T-TASK-1 (structural) | Only asserts directory existence, not CLAUDE.md section content. T-TASK-1 requires specific sections. Partially covered by Test-2.1-b. | PASS |
| task-operations.test.ts::Test-2.1-b "should create task CLAUDE.md with description" | Asserts exit 0, asserts all four required sections present via regex, asserts description keyword appears specifically under ## Focus section. | T-TASK-1 | Covers all four required sections. The Focus section check extracts text between ## Focus and the next ## header and looks for the description keyword. This is genuine content verification. | PASS |
| task-operations.test.ts::Test-2.1-c "should update .claude/CLAUDE.md with import directive" | Asserts exit 0, asserts @import matches `@import\s+\S+oauth-refactor\S+CLAUDE\.md`, extracts path and asserts it contains 'oauth-refactor' | T-CLMD-2 (partial) | Does not check for exactly one @import (T-CLMD-2 / T-SWITCH-1). Checks presence and correct task name, but a buggy implementation could append a second @import and this test would still pass. | FAIL |
| task-operations.test.ts::Test-2.1-d "should confirm task structure is complete after create" | Redundant with 2.1-a and 2.1-b. Adds no new coverage. | T-TASK-1 | Redundant. Not a gap but also not independent coverage. | PASS |
| task-operations.test.ts::Test-2.2-a "should reject task name with spaces" | Asserts non-zero exit, asserts error message matches `/invalid.*(name|task)|uppercase|lowercase/i`, asserts task dir does not exist. | T-TASK-2 | Covers non-zero exit and no directory created. The error message pattern is somewhat broad (`uppercase|lowercase` could match error messages about the task name format generally). Acceptable specificity. | PASS |
| task-operations.test.ts::Test-2.2-b "should reject task name with uppercase" | Asserts non-zero exit, asserts neither OAuthRefactor nor oauthrefactor dir created. | T-TASK-2 | Checks both case variants of the dir. Adequate. | PASS |
| task-operations.test.ts::Test-2.2-c "should reject task name with special characters" | Asserts non-zero exit, asserts dir does not exist. | T-TASK-2 | No assertion on the error message. A script that exits non-zero for ANY reason (e.g., wrong arg count) would pass this test. Vacuity: an implementation that exits 1 with "Unknown error" satisfies this. | FAIL |
| task-operations.test.ts::Test-2.2-d "should not create directory for invalid task" | Asserts non-zero exit, asserts neither "OAuth Refactor" nor "oauth refactor" dir exists. | T-TASK-2 | Same vacuity issue as 2.2-c — no error message assertion. | FAIL |
| task-operations.test.ts::Test-2.3 "should capture full multi-line description" | Asserts exit 0, extracts Focus section, checks oauth, session, token keywords under Focus. | T-TASK-3 | Coverage is adequate. All three keywords are required in the Focus section specifically (not just anywhere in the file). | PASS |
| task-operations.test.ts::Test-2.4 "T-TASK-4: should reject empty description" | Asserts non-zero exit, asserts task dir does not exist. | T-TASK-4 | No error message assertion. Vacuity: any non-zero exit satisfies this. An implementation that crashes on empty args would pass. However T-TASK-4 only specifies exit non-zero and no dir created — the AC does not require a specific error message. AC is met. | PASS |
| task-operations.test.ts::Test-3.1 "should list personal contexts when switching" | Asserts exit 0, asserts 'my-progress' and 'personal' appear, asserts 'golden' does not appear. | T-SWITCH-3 (partial — personal-only case) | The negative assertion (no 'golden') is meaningful only if no golden contexts were created. Since no golden is set up, this correctly validates the single-type listing. | PASS |
| task-operations.test.ts::Test-3.2 "should list golden contexts when switching" | Asserts exit 0, asserts 'oauth-deep-dive' and 'golden' appear, asserts 'personal' does not appear. | T-SWITCH-3 (partial — golden-only case) | Same logic as 3.1 in reverse. | PASS |
| task-operations.test.ts::Test-3.3-a "T-SWITCH-3: should list both personal and golden contexts" | Asserts all three names appear, checks section labels, checks personal-1 appears before golden-1 by indexOf. | T-SWITCH-3 | indexOf ordering check is meaningful only if neither context name appears in section header text. 'personal-1' and 'golden-1' are unlikely to appear in headers. Coverage adequate. | PASS |
| task-operations.test.ts::Test-3.3-b "should show personal contexts before golden" | Redundant with 3.3-a. Same ordering check with less section-label checking. | T-LIST-1 | Redundant but not harmful. | PASS |
| task-operations.test.ts::Test-3.4 "T-SWITCH-2: should indicate no contexts available" | Asserts exit 0, output matches `/no contexts|fresh/i` | T-SWITCH-2 | AC requires "fresh", "empty", or "no contexts". Test only checks "no contexts" or "fresh" — omits "empty". This is a gap: an implementation that outputs "empty" would pass the AC but fail this test. Not a false pass — a false fail risk. Not an ESCALATE condition for the red team because the concern is false passes, not false fails. However, the test is also incomplete for a separate reason: the AC phrase "empty" is a valid implementation choice that this test would reject. For adversarial purposes: this cannot produce a false pass. | PASS |
| task-operations.test.ts::Test-3.5-a "should switch to default task" | Asserts exit 0, asserts @import matches `\S+default\S+CLAUDE\.md` | T-SWITCH-6 (partial) | Does not check for "vanilla" or "restored" in output, which T-SWITCH-6 requires. The test covers the file-system side only. T-SWITCH-6 is not fully covered by this test alone. | FAIL |
| task-operations.test.ts::Test-3.5-b "T-SWITCH-6: should confirm vanilla mode restored and verify @import points to default task" | Asserts exit 0, output matches `/vanilla|restored/`, AND asserts @import points to default, asserts 'some-task' absent. | T-SWITCH-6 | Both the output text requirement and the file-system state are checked. Covers T-SWITCH-6 fully. The `output` variable is `result.stdout.toLowerCase()` — if the script writes the confirmation to stderr only, this test would fail, but that is a genuine bug rather than a test gap. | PASS |
| task-operations.test.ts::Test-3.6 "should update .claude/CLAUDE.md on each switch" | Asserts exit 0 each time, asserts fileContains for current task name, asserts NOT contains for previous task name. | T-SWITCH-1 (partial) | Does not assert exactly ONE @import line after each switch (T-SWITCH-1 requires this). `fileContains(workingMdPath, 'task-a')` passes even if there are two @import lines both containing 'task-a'. Gap exists for the "exactly one" part of T-SWITCH-1. | FAIL |
| task-operations.test.ts::T-SWITCH-1 "T-SWITCH-1: .claude/CLAUDE.md must contain exactly one @import pointing to the selected task after each switch" | Defines assertSingleImport() that counts @import lines, asserts exactly 1 and that it contains the task ID. Runs 4 switches. | T-SWITCH-1 | This test correctly addresses the "exactly one" requirement. The only gap is: the test does not verify that the @import path resolves to an existing file. A buggy implementation that writes `@import /nonexistent/path` would pass. However T-SWITCH-1 does not require path resolution — it only requires "exactly one @import pointing to the selected task". Acceptable. | PASS |
| task-operations.test.ts::T-SWITCH-4 "context-list --json returns empty contexts array even when UUID sessions exist" | Plants UUID .jsonl files in personalDir, runs context-list with --json flag, parses output as JSON, asserts contexts:[] and sessions.length > 0. | T-SWITCH-4 | Covers both parts of T-SWITCH-4. The UUID files are planted in personalDir (not in a tasks/*/contexts/ subdirectory) which correctly simulates active sessions. The --json flag is required. | PASS |
| task-operations.test.ts::T-SWITCH-5 "human-readable output does not show UUID sessions under Personal or Golden contexts sections" | Asserts 'sessions' appears in output, asserts 'personal contexts' and 'golden contexts' do NOT appear, asserts no numbered UUID pattern. | T-SWITCH-5 | The phrase checks are case-sensitive via `outputLower.toContain`. The numbered UUID regex `^\s*\d+\.\s+[0-9a-f]{8}-...` uses multiline flag `im` and checks start-of-line — this is specific and non-vacuous. | PASS |
| context-operations.test.ts::Test-4.1-a "should save context to personal storage" | Asserts exit 0, asserts file at exact personal path, asserts isValidJsonl. | T-CTX-1, T-CTX-2 | Covers exact path (T-CTX-1) and JSONL validity (T-CTX-2). | PASS |
| context-operations.test.ts::Test-4.1-b "should create valid JSONL file" | Asserts exit 0, asserts file exists, asserts isValidJsonl, asserts non-empty. | T-CTX-2 | The non-empty check is crucial — isValidJsonl returns true on empty files (empty string has zero lines, all "parse"). | PASS |
| context-operations.test.ts::Test-4.1-c "should not save to project .claude/ directory for personal" | Asserts personal file exists AND project golden path does NOT exist. | T-CTX-1 (isolation aspect) | The positive anchor (personal file exists) makes the negative check non-vacuous. Correctly structured. | PASS |
| context-operations.test.ts::Test-4.2-a "should save context to project directory for golden" | Asserts exit 0, asserts golden path exists, asserts isValidJsonl. | T-CTX-1 (golden), T-CTX-2 | Does not assert that the secret scan ran. T-CTX-3 requires that the scan runs. This test only uses CLEAN_CONTEXT but does not assert "scan" or "secret" in output. Partial gap for T-CTX-3's "scan ran" requirement. | FAIL |
| context-operations.test.ts::Test-4.2-b "should run secret scan before saving golden" | Asserts exit 0, asserts output contains 'scan' or 'secret'. | T-CTX-3 (scan-ran aspect) | The AC says exit 0 with no prompt is a failure for a session WITH secrets. This test uses CLEAN_CONTEXT — so it only proves the scan *output* appears, not that a secret blocks saving. The blocking behavior is covered by separate tests. The OR ('scan' || 'secret') is valid here since both would indicate a scan occurred. | PASS |
| context-operations.test.ts::Test-4.2-c "should block golden save when session contains a Stripe live key" | Asserts non-zero exit, output matches `/stripe|sk_live/`, asserts golden file NOT created. | T-CTX-3 | Covers blocking. The output pattern is specific (sk_live). The file non-existence check proves blocking. | PASS |
| context-operations.test.ts::Test-4.2-d "should block golden save when session contains a GitHub token" | Asserts non-zero exit, output matches `/github|ghp_/`, asserts golden file NOT created. | T-CTX-3 | Adequate. | PASS |
| context-operations.test.ts::Test-4.2-e "should block golden save when session contains a real AWS key" | Asserts non-zero exit, output matches `/aws|akia/`, asserts golden file NOT created. | T-CTX-3 | Covers the AC's explicit "real AWS key" case. | PASS |
| context-operations.test.ts::Test-4.3 "should reject context name with invalid characters" | Asserts non-zero exit, output matches `/invalid.*(name|characters?)|name.*invalid/i`, asserts file not created. | No specific AC clause for this | The AC clauses do not separately enumerate name validation for context-save beyond T-CTX-1's implicit correct-path requirement. This tests the error path. The pattern `/invalid.*(name|characters?)|name.*invalid/i` is specific. However, the test does NOT pass CLAUDE_HOME to runScript for the file-nonexistence check, meaning the personalDir used in the assertion may differ from what the script would use. This is a test isolation bug: the path check `join(ctx.personalDir, 'tasks', 'save-test', 'contexts', 'my work!.jsonl')` uses ctx.personalDir but the script runs without CLAUDE_HOME env so it uses the real home directory. The negative check may be vacuously true (file never existed at that path regardless). | ESCALATE |
| context-operations.test.ts::Test-4.5-a "should handle empty context gracefully" | Asserts non-zero exit, asserts no Node.js stack trace. | T-CTX-4 (edge) | T-CTX-4 as written in the PRD is specifically about the 100KB size cap. Empty context rejection is a different behavior, only tested here. This test does not cover T-CTX-4. | PASS |
| context-operations.test.ts::Test-4.5-b "should reject golden save when context exceeds 100KB" | Pre-condition asserts file is actually >100KB, asserts non-zero exit, output matches `/100KB|too large/i`, asserts golden file NOT created. | T-CTX-4 | Pre-condition eliminates vacuous setup. Output pattern requires specific text. File non-existence check proves blocking. The regex is case-insensitive so "100kb" and "100KB" both match. | PASS |
| context-operations.test.ts::T-CTX-6 "should create a backup file when saving to an existing name" | Saves twice, finds .backup- files, asserts backup content equals original. | T-CTX-6 | Content equality check is present. Backup filename pattern `.backup-` is checked. The original file content is captured BEFORE the second save, so the comparison is meaningful. | PASS |
| context-operations.test.ts::Test-5.1-a "should list all contexts for task" | Asserts exit 0, asserts 'ctx-1' and 'ctx-2' appear, asserts 'personal' appears, asserts 'golden' does NOT appear (none set up). | T-LIST-1 | The no-golden assertion is meaningful because no golden contexts were set up. | PASS |
| context-operations.test.ts::T-LIST-2 "should show correct message count adjacent to each context name" | Finds the line containing 'ctx-1', asserts that line matches `\b5\b`. Finds line with 'ctx-2', asserts `\b30\b`. | T-LIST-2 | The line-level check ensures adjacency — counting matches the word-boundary pattern on the same output line as the context name. This is the correct interpretation of T-LIST-2. | PASS |
| context-operations.test.ts::Test-5.3 "T-LIST-3: should indicate no contexts found" | Asserts exit 0, output matches `/\bfresh\b|\bempty\b|\bno contexts\b/i` | T-LIST-3 | All three AC-specified phrases are present in the regex. Word boundaries prevent false matches. | PASS |
| context-operations.test.ts::Test-5.4 "should show both personal and golden sections" | Asserts both specific names appear, asserts section labels appear, asserts personal-ctx appears before golden-ctx by indexOf. | T-LIST-1 | indexOf ordering check uses specific context names. Section label check uses `.toContain`. Adequate for T-LIST-1. | PASS |
| context-operations.test.ts::Test-5.5 "should error for non-existent task" | Asserts non-zero exit, output matches `/not found|does not exist/i` | No specific AC clause — but covered under documented expected behavior | No dedicated AC ID for this in the PRD table. The PRD lists it under "Expected Behaviors". Not a gap in the AC table. | PASS |
| context-operations.test.ts::T-LIST-4 "should display content-derived summary alongside context name, not just metadata" | Uses save-context to create context (not direct file write), checks meta.json exists with content-derived summary keyword, runs context-list, finds the line with 'summary-ctx', asserts '—' separator present and content keyword after it. | T-LIST-4 | This test calls save-context and relies on it writing a meta.json with a content-derived summary. If save-context does NOT write meta.json (i.e. T-SUM-1 is failing), then `expect(fileExists(metaPath)).toBe(true)` will fail — meaning T-LIST-4 cannot be green unless T-SUM-1 is also implemented. This is correct coupling — context-list can only display summaries if they exist. The test does genuinely verify T-LIST-4 IF the summary infrastructure exists. | PASS |
| context-operations.test.ts::Test-6.1 "should report zero contexts" | Asserts exit 0, output matches `/\bno contexts\b|\bempty\b/i` | No dedicated AC clause | No AC ID for list-all-contexts empty state. | PASS |
| context-operations.test.ts::Test-6.6-a "should list golden context with special indicator" | Checks stderr for 'golden-ctx', finds line in stderr containing 'golden-ctx', asserts line contains ⭐ OR 'golden' (with the context name stripped from the line before checking 'golden'). | T-CTX-7 (setup/verify side) | This test only verifies display, not deletion protection. The line-level check with context name stripped is a good technique to avoid 'golden' in 'golden-ctx' counting as the section label. | PASS |
| context-operations.test.ts::Test-6.6-b "should prevent golden context deletion without confirmation" | Pre-condition asserts file exists, runs delete-context without --confirm, asserts non-zero exit, asserts file still exists. | T-CTX-7 | Direct coverage of T-CTX-7. The file must be re-checked after the failed delete. | PASS |
| context-operations.test.ts::T-PROM-1 "T-PROM-1: should successfully promote clean context" | Asserts exit 0, asserts golden exists, asserts personal exists, asserts contents identical. | T-PROM-1 | Both existence checks and byte-equality are present. | PASS |
| context-operations.test.ts::Test-7.1-b "should copy to project golden directory" | Asserts golden exists, asserts isValidJsonl, asserts personal still exists. | T-PROM-1 (copy, not move) | JSONL validity added. Copy vs move verified. | PASS |
| context-operations.test.ts::Test-7.1-c "should preserve original personal context" | Captures original content, promotes, re-reads personal, asserts byte equality. | T-PROM-1 | Content before/after comparison. | PASS |
| context-operations.test.ts::T-CTX-5 "should reject promote when personal context exceeds 100KB" | Creates 150-message file, asserts non-zero exit, output matches `/100kb|too large/i`, asserts golden NOT created. | T-CTX-5 | Adequate. But does not pre-condition assert that the file is actually >100KB before running the script — meaning a test environment where the file is somehow smaller would pass the exit-code assertion vacuously. ESCALATE because the parallel test in context-operations.test.ts::Test-4.5-b DOES have this pre-condition check, but this duplicate in new-features.test.ts::T-CTX-5 does not. | ESCALATE |
| context-operations.test.ts::Test-7.2 "should detect secrets and warn/block" | Asserts non-zero exit, output matches `/github|ghp_/i` | T-PROM-2 | T-PROM-2 requires output names the "specific secret type". The test uses GITHUB_TOKEN_CONTEXT and asserts `github|ghp_` — this is specific to the GitHub token type. | PASS |
| context-operations.test.ts::Test-7.3 "should offer redaction option" | Runs scan-secrets directly (not promote-context), asserts non-zero exit, output matches `/stripe|sk_/i` | T-PROM-2 (different type) / T-SEC-3 | This test runs scan-secrets, not promote-context. It does not test "offer redaction option" as the test name claims. It is effectively a duplicate of a secret-detection test, not a promotion test. For T-PROM-2 (which specifies ghp_), this test is OUT_OF_SCOPE — it uses Stripe, not GitHub token. For the secret detection AC it partially covers T-SEC-3. | FAIL |
| context-operations.test.ts::Test-7.4 "should error for non-existent context" | Asserts non-zero exit, output matches `/not found|does not exist/i` | No dedicated AC (expected behavior) | Adequate for expected behavior documentation. No AC gap. | PASS |
| context-operations.test.ts::T-PROM-3 "T-PROM-3: should warn and fail when context is already golden" | Setup: creates personal, runs first promotion (asserts exit 0, asserts golden exists). Second promotion: asserts non-zero exit, output matches `/already.*golden|already exists/i`. | T-PROM-3 | The setup rule "personal context only" is satisfied — no golden is manually created in beforeEach. The first promotion creates it, proving the implementation detects it. | PASS |
| context-operations.test.ts::T-MEM-1 "should update MEMORY.md with task-id and context-name after save" | Saves context, asserts MEMORY.md exists at personalDir/memory/MEMORY.md, asserts contains task-id and context-name. | T-MEM-1 | Note in test acknowledges the MEMORY.md path differs from what the DoD specifies (spec says `~/.claude/projects/<sanitized>/MEMORY.md`, impl uses `/memory/` subdirectory). The test tests what the implementation does, not what the AC says. This is a compliance gap: if the DoD path is authoritative, the implementation is wrong and the test is masking that by testing the wrong path. | ESCALATE |
| context-operations.test.ts::T-HOOK-1 "should save session content to timestamped file in auto-saves/" | Plants UUID session file, invokes auto-save-context via execSync with stdin payload, asserts exit 0, asserts .jsonl file exists in auto-saves/, asserts file is valid non-empty JSONL, asserts content contains 'authentication'. | T-HOOK-1 | The content check ('authentication') verifies the right session was copied. However the test uses execSync (synchronous) but the comment says "Wait for MEMORY.md to appear (up to 5 seconds)". The auto-save-context invocation itself is synchronous via execSync so timing is not a concern here. The CLAUDE_HOME env var is passed correctly. | PASS |
| context-operations.test.ts::T-SUM-1 "saved context meta.json must contain a summary between 20 and 500 characters" | Saves context, asserts meta.json exists, asserts summary is string between 20 and 500 chars. | T-SUM-1 | Length range check is present. No check that summary is content-derived (covered by T-SUM-2). A hardcoded "This is a test summary string." (31 chars) would pass T-SUM-1. | FAIL |
| context-operations.test.ts::T-SUM-2 "two contexts from different conversations must produce different summary strings" | Saves auth context, saves db context, asserts summaries differ, asserts each summary contains a keyword from its source. | T-SUM-2 | Both differentiation AND content-derivation are checked. Keywords are specific to each domain. | PASS |
| error-handling.test.ts::T-ERR-1 "should handle missing .claude directory gracefully" | Does NOT run init, runs task-create, asserts non-zero exit, output matches `/init|not initialized/i`, asserts no stack trace. | T-ERR-1 | The anti-stack-trace checks look for `at Object.<anonymous>` and `at\s+\w+\s+(`. These patterns cover the most common Node.js stack trace formats. | PASS |
| error-handling.test.ts::Test-13.1-b "should suggest running init" | Same setup, tests update-import instead of task-create. Asserts non-zero exit and /init/i in output. | T-ERR-1 (second script) | Covers a different script for the same AC. | PASS |
| error-handling.test.ts::Test-13.2 "should handle missing .claude directory on task operations" | Inits, creates task, deletes .claude dir, runs task-list, asserts non-zero, output matches `/not.*initialized|run init/i` | T-ERR-1 (mid-operation) | Mid-operation deletion scenario. | PASS |
| error-handling.test.ts::T-ERR-2 "should detect corrupt JSONL" | Creates malformed JSONL, runs scan-secrets, asserts non-zero exit, no stack trace (two patterns), output matches `/invalid|corrupt|malformed|parse.*error|json/i` | T-ERR-2 | The AC only requires non-zero exit on malformed JSONL. The additional error message assertion is strengthening. The two stack trace patterns are present. | PASS |
| error-handling.test.ts::Test-13.3-b "should not crash on invalid JSON in context" | Creates truncated JSON, runs scan-secrets, asserts non-zero exit, no stack trace (two patterns). | T-ERR-2 | Slightly different malformed input. Two stack trace checks. | PASS |
| error-handling.test.ts::Test-13.5 "should handle invalid metadata gracefully" | Creates valid JSONL with invalid meta.json, runs context-list, asserts exit 0, no stack trace. | No specific AC clause | No T-ERR AC covers this. The test verifies graceful handling but cannot be mapped to an AC clause. OUT_OF_SCOPE for AC coverage but tests documented expected behavior. | PASS |
| error-handling.test.ts::Test-13.6 "should handle permission errors gracefully" | RA-001 applies | T-ERR (permission) | RA-001: SCOPE=error-handling.test.ts:Test 13.6, DISPOSITION=ACCEPTED, EXPIRY=2026-09-12. | ACCEPTED (RA-001) |
| error-handling.test.ts::Test-input-validation-a "should validate task ID format" | Loops over 6 invalid IDs, asserts each: non-zero exit, output matches `/invalid.*(name|task|id)|uppercase|lowercase/i` | T-TASK-2 | Coverage of T-TASK-2 validation breadth. The empty string `''` and whitespace-only `'   '` cases are non-trivially tested. | PASS |
| error-handling.test.ts::Test-input-validation-b "should validate context name format" | Loops over 3 invalid names, asserts non-zero exit, output matches invalid-name pattern. NOTE: does NOT pass CLAUDE_HOME to runScript. | No specific AC | CLAUDE_HOME omission means the script runs against real home. Non-zero exit for invalid name should be independent of CLAUDE_HOME path resolution, so the exit code assertion is valid. No file-existence check is performed for these invalid names, so no path confusion issue. | PASS |
| error-handling.test.ts::T-ERR-3 "should handle paths with spaces" | Creates path with space, runs init, task-create, and update-import in it, asserts exit 0 AND file existence for all three. | T-ERR-3 | Both exit code and file existence asserted for all three operations. | PASS |
| error-handling.test.ts::Test-12.6 "should create JSONL with consistent line endings" | Saves context, reads all .jsonl files in personal contexts dir, asserts no `\r\n`. | No specific AC clause | No AC ID. Tests documented expected behavior. | PASS |
| error-handling.test.ts::Test-12.7 "should use LF line endings in generated files" | Runs init and task-create, reads two specific files, asserts no `\r\n`. | No specific AC clause | No AC ID. | PASS |
| git-integration.test.ts::Test-11.1-a "should create .gitignore during initialization" | Asserts .gitignore exists. | T-GIT-1 (prereq) | No git check-ignore call here. Prerequisite check only. | PASS |
| git-integration.test.ts::Test-11.1-b "should include CLAUDE.md in .gitignore" | Reads .gitignore, matches `/^CLAUDE\.md$/m` | T-GIT-1 (prereq) | File content check, not git behavior. | PASS |
| git-integration.test.ts::Test-11.2-a "should allow task CLAUDE.md to be tracked" | Runs git add, checks git status contains the path. | No specific AC | Tests expected behavior, not an AC. | PASS |
| git-integration.test.ts::Test-11.2-b "should allow task directory to be committed" | Commits task dir, asserts no throw. | No specific AC | No assertion on what WAS committed. A vacuous commit (empty) would pass. | FAIL |
| git-integration.test.ts::Test-11.3-a "should allow golden context to be tracked" | Adds golden context file, checks git status contains filename. | No specific AC | Not a T-GIT-2 test — this is about golden being trackable (expected behavior). | PASS |
| git-integration.test.ts::Test-11.3-b "should commit golden context successfully" | Commits .claude/, asserts no throw. | No specific AC | Same vacuous commit risk as 11.2-b. | FAIL |
| git-integration.test.ts::Test-11.4 "should not include personal storage in git" | Asserts personal base is outside project dir, saves context via implementation, asserts git status lines do not contain 'my-work' or 'personal-ctx'. | T-GIT-2 | The structural isolation check (personalBase outside projectDir) is separate from the git status check. Git status check stages everything in project dir (`git add .`) then checks none of the personal path names appear. This is T-GIT-2 coverage. | PASS |
| git-integration.test.ts::Test-11.5 "should isolate task files between two independent developer workspaces" | Creates two repos, each creates different tasks, verifies cross-isolation, verifies .claude/CLAUDE.md not in status after commit. | T-GIT-2 (cross-isolation) | The .claude/CLAUDE.md check requires the .gitignore to have been committed first. In this test, `gitAdd(ctx.projectDir, '.claude/')` stages .claude/ contents. If .claude/.gitignore was committed BEFORE this add, then .claude/CLAUDE.md would be ignored. If .claude/.gitignore was NOT yet committed, git may or may not respect it for staged files. The test does commit `.claude/` after the add — if CLAUDE.md gets staged before .gitignore is respected, it could appear in status. The test ordering is: init (creates .gitignore), add '.claude/', commit — the .gitignore has not been committed before the first add. This could be a test reliability issue. | ESCALATE |
| git-integration.test.ts::Test-11.6 "should recognize golden contexts after they exist" | Directly creates golden context (not via promote), runs context-list, asserts exit 0 and 'shared-ctx' in output. | No specific AC | No AC ID. Tests expected behavior. | PASS |
| git-integration.test.ts::Test-11.7-a "should not show .claude/CLAUDE.md in status" | Commits .gitignore, modifies CLAUDE.md, runs git status --porcelain, asserts CLAUDE.md absent. | T-GIT-1, T-GIT-2 | Correct: .gitignore committed before checking status. | PASS |
| git-integration.test.ts::Test-11.7-b "should be ignored by git check-ignore" | Commits .gitignore, runs isGitIgnored. | T-GIT-1 | .gitignore committed before check. Correct. | PASS |
| git-integration.test.ts::T-GIT-1 "git check-ignore .claude/CLAUDE.md exits 0 in a real git repo after init" | Commits .gitignore via gitAdd+gitCommit before calling isGitIgnored. | T-GIT-1 | Correct sequence: .gitignore committed, then check-ignore called. | PASS |
| git-integration.test.ts::T-GIT-2 "git status --porcelain does not list any path containing personal storage prefix after full workflow" | Runs save-context through implementation, stages '.', checks no statusLine contains personalDir or 'tgit-ctx'. | T-GIT-2 | The two-check approach (personalDir prefix AND 'tgit-ctx') is robust. | PASS |
| claude-md-system.test.ts::Test-8.1-a "should not modify root CLAUDE.md during init" | Reads root CLAUDE.md after init, asserts byte equality. | T-CLMD-1 | Single operation covered. | PASS |
| claude-md-system.test.ts::Test-8.1-b "should not modify root CLAUDE.md during task creation" | Creates two tasks, reads root, asserts byte equality. | T-CLMD-1 | Two task-create operations covered. | PASS |
| claude-md-system.test.ts::Test-8.1-c "should not modify root CLAUDE.md during task switching" | Creates two tasks, switches between them and back to default, asserts byte equality. | T-CLMD-1 | Multiple switch operations covered. | PASS |
| claude-md-system.test.ts::Test-8.1-d "should show no git changes to root CLAUDE.md" | Runs task-create and update-import, checks git status lines for 'CLAUDE.md' NOT in path not containing '.claude/'. | T-CLMD-1 (git-level) | The filter logic `line.trim().endsWith('CLAUDE.md') && !line.includes('.claude/')` correctly distinguishes root CLAUDE.md from .claude/CLAUDE.md. | PASS |
| claude-md-system.test.ts::Test-8.2-a "should create .claude/CLAUDE.md on init" | Asserts file exists after init. | T-INIT-1 (partially) | Basic existence check. | PASS |
| claude-md-system.test.ts::Test-8.2-b "should contain @import directive" | Reads .claude/CLAUDE.md, matches `/@import\s+\S+CLAUDE\.md/` | T-INIT-1 | Looser than initialization.test.ts which also checks path resolution. Not a gap given initialization tests are more thorough. | PASS |
| claude-md-system.test.ts::Test-8.2-c "should update on task switch" | Creates task-1, runs update-import, checks content matches `/@import\s+\S+task-1\S+CLAUDE\.md/` | T-CLMD-2 (partial) | Does not check for exactly one @import. | FAIL |
| claude-md-system.test.ts::Test-8.2-d "should contain exactly one @import after multiple switches" | Switches task-1 then task-2, counts @import lines, asserts exactly 1, asserts contains 'task-2' and NOT 'task-1'. | T-CLMD-2 | Covers "exactly one @import" directly. | PASS |
| claude-md-system.test.ts::Test-8.3-a "should have .gitignore with CLAUDE.md entry" | Asserts .gitignore exists and content matches `/^CLAUDE\.md$/m` | T-GIT-1 (prereq) | No git behavior tested. | PASS |
| claude-md-system.test.ts::Test-8.3-b "should be ignored by git" | Asserts .claude/CLAUDE.md exists, calls isGitIgnored. NOTE: Does NOT commit the .gitignore first. | T-GIT-1 | isGitIgnored is called without committing the .gitignore first. The init creates and adds .gitignore but does not commit it. `git check-ignore` behavior for an untracked .gitignore is git-version-dependent. On most versions, git respects .gitignore files even when untracked for `git check-ignore`. However this is not guaranteed and differs from the canonically correct test in git-integration.test.ts::T-GIT-1 which commits first. This test may produce false passes or false fails depending on git version. | ESCALATE |
| claude-md-system.test.ts::Test-8.3-c "should not appear in git status" | Commits .gitignore first, stages .claude/, checks status. | T-GIT-1 | Commits .gitignore before staging. Correct. | PASS |
| claude-md-system.test.ts::Test-8.4-a "should update import to auth task" | Switches to auth, checks content. | T-CLMD-2 | No exactly-one check. | FAIL |
| claude-md-system.test.ts::Test-8.4-b "should update import to payment task" | Same as 8.4-a for payment. | T-CLMD-2 | No exactly-one check. | FAIL |
| claude-md-system.test.ts::Test-8.4-c "should update import to default task" | Switches auth then default, checks default content. | T-SWITCH-6 (partial) | No output text check for "vanilla"/"restored". | FAIL |
| claude-md-system.test.ts::Test-8.5 "should set up the correct @import path for /resume to read" | Creates oauth-work task, switches to it, asserts @import contains 'oauth-work', asserts referenced file exists. | T-CLMD-2 (structural proxy for T-RESUME-MANUAL) | Covers the verifiable side of the /resume contract. T-RESUME-MANUAL is a named risk acceptance. | DEFERRED (T-RESUME-MANUAL via RA-002 for the manual part; automated part PASS) |
| claude-md-system.test.ts::Test-8.6 "should allow different task states" | Creates two project envs, switches to different tasks in each, asserts their .claude/CLAUDE.md differ. | T-CLMD-1 (multi-dev) | Multi-developer independence check. Root CLAUDE.md equality also verified. | PASS |
| secret-detection.test.ts::Test-9.1-a "should detect AWS access key pattern" | Creates context with AWS_KEY_CONTEXT, runs scan-secrets, asserts non-zero exit, output matches `/akia/i`. | T-SEC-2 | AKIA prefix required. Non-zero exit required. | PASS |
| secret-detection.test.ts::Test-9.1-b "should identify AWS secret key pattern" | Same context, asserts non-zero exit, output matches `/aws.*key|secret.*key|akia/i` | T-SEC-2 | The `|akia` escape makes this always pass if AKIA was found, which was already required by 9.1-a. This OR is redundant-but-not-vacuous because the alternative patterns add specificity beyond AKIA. Acceptable. | PASS |
| secret-detection.test.ts::Test-9.2-a "should detect Stripe live key pattern" | Asserts non-zero exit, output matches `/sk_live/i` | T-SEC-3 | Specific prefix required. | PASS |
| secret-detection.test.ts::Test-9.2-b "should detect both test and live keys" | Asserts non-zero exit, output contains 'sk_test_' and 'sk_live_' (exact strings). | T-SEC-3 | Both specific strings required. | PASS |
| secret-detection.test.ts::Test-9.3 "should detect GitHub personal access token" | Asserts non-zero exit, output matches `/ghp_/i` | T-SEC-8 | ghp_ prefix required. | PASS |
| secret-detection.test.ts::Test-9.4 "should detect RSA private key header" | Asserts non-zero exit, output matches `/rsa.*private|private.*key|BEGIN.*PRIVATE/i` | T-SEC-9 | Pattern matches three specific RSA key indicators. | PASS |
| secret-detection.test.ts::Test-9.5 "should detect password assignment patterns" | Asserts non-zero exit, output matches `/password/i` | T-SEC-10 | 'password' is the required keyword. | PASS |
| secret-detection.test.ts::Test-9.6 "should treat AKIAIOSFODNN7EXAMPLE as true positive" | Creates isolated fixture with ONLY that string, runs scan-secrets, asserts non-zero exit, output matches `/akia/i`. | T-SEC-5 | Isolated fixture eliminates cross-contamination from other secrets. The policy (false positive preferred) is enforced by the non-zero exit requirement. | PASS |
| secret-detection.test.ts::T-SEC-7 "T-SEC-7: should report exactly 5 secrets" | Asserts non-zero exit, output matches `/\bfound\s+5\s+secret|\b5\s+secrets?\s+found/i`. | T-SEC-7 | The tight adjacency requirement prevents the "5 messages... found N secrets" bypass. | PASS |
| secret-detection.test.ts::Test-9.8 "should detect secrets in user, assistant, and tool_result messages" | Creates one secret per message type, asserts non-zero exit, each of three type-specific patterns appears in output. | T-SEC-4 | All three message types covered with type-specific pattern checks. | PASS |
| secret-detection.test.ts::Test-9.9-a "should produce clean valid JSONL after redaction and pass rescan" | Redacts, asserts exit 0, asserts file exists, asserts valid JSONL, asserts rescan returns 'clean'. | T-SEC-6 | The rescan 'clean' check is the key assertion. | PASS |
| secret-detection.test.ts::Test-9.9-b "should remove or mask secrets in output" | Redacts Stripe context, checks redacted file exists, valid JSONL, non-empty, original secret absent, redaction marker present. | T-SEC-6 (supplemental) | The OR for redaction markers `REDACTED || *** || [REMOVED]` is acceptable — all three are valid redaction forms. The original key absence check is specific. | PASS |
| secret-detection.test.ts::Test-clean-context "should report clean when no secrets found" | Asserts exit 0 AND output matches `/clean/i`. | T-SEC-2 (negative case) | Exit 0 required for clean. Output text required. | PASS |
| new-features.test.ts::T-CTX-5 "should reject promote when personal context exceeds 100KB" | Creates 150-message file, asserts non-zero exit, output contains '100kb' or 'too large', asserts golden NOT created. | T-CTX-5 | Duplicate of context-operations.test.ts T-CTX-5. Missing pre-condition file-size check (see note above). | ESCALATE |
| new-features.test.ts::T-CTX-6 "should create a .backup- file when saving to an existing name" | Saves twice with same name, finds .backup- files, asserts backup content equals original. | T-CTX-6 | Full duplicate of context-operations.test.ts::T-CTX-6. | PASS |
| new-features.test.ts::T-MEM-1 "should add task-id and context-name to personal MEMORY.md after save" | Uses waitFor (5s timeout, 200ms interval) to wait for MEMORY.md, then asserts content. | T-MEM-1 | waitFor handles async memory update. Path is personalDir/memory/MEMORY.md — same DoD path compliance gap as the duplicate in context-operations.test.ts. | ESCALATE |
| adversary.test.ts::T-ADV-1 "should exist at specialized path and contain ADVERSARY and STRICT" | beforeAll WRITES the adversary DNA to the real system path, then the test asserts it exists and contains those strings. | T-ADV-1 | SELF-FULFILLING SETUP. T-ADV-1 requires the file to exist "after install.sh" — the test setup manually creates the file that the test then asserts. This satisfies the assertion vacuously: beforeAll creates it, the test finds it. An implementation where install.sh was NEVER run would still pass this test. The pre-condition is supposed to be install.sh; the test substitutes its own file creation. | FAIL |
| adversary.test.ts::T-SPEC-4 / T-ADV-2-a "should exit 0 and produce exactly one @import line in .claude/CLAUDE.md" | Sets up isolated env, runs init-project, calls setupSpecializedAdversaryTask (creates DNA in isolated CLAUDE_HOME), runs update-import adversary, asserts exit 0, asserts exactly one @import line. | T-ADV-2, T-SPEC-4 | The "exactly one @import" requirement is checked. The adversary DNA is created in the isolated CLAUDE_HOME via setupSpecializedAdversaryTask, which is correct simulation of install.sh scoped to the test's home. | PASS |
| adversary.test.ts::T-SPEC-4 / T-ADV-2-b "T-SPEC-4: imported path should resolve to a file on disk whose content contains ADVERSARY" | Same setup, resolves import path, asserts file exists at resolved path, content contains 'ADVERSARY'. | T-SPEC-4 | Path resolution handles ~/, absolute, and relative paths. Content check ensures the correct DNA is referenced. | PASS |
| adversary.test.ts::T-ADV-2-c "T-ADV-2: imported path must end with specialized/adversary/CLAUDE.md" | Same setup, extracts import path, asserts it ends with 'specialized/adversary/CLAUDE.md'. | T-ADV-2 | Path suffix check is specific and sufficient. | PASS |
| adversary.test.ts::T-ADV-3 / T-SPEC-1 "should be byte-for-byte identical before and after task-create, update-import, save-context" | Uses `.skipIf(!existsSync(SPECIALIZED_DNA_PATH))` — skips when file absent. Reads DNA before, runs three operations, reads DNA after, asserts equality. | T-SPEC-1, T-ADV-3 | The skipIf guard means this test ONLY runs if SPECIALIZED_DNA_PATH already exists. Per the AC specification for T-SPEC-1: "setup must NOT pre-create any file under specialized/". The T-ADV-1 beforeAll DOES pre-create the file. So in the test run, T-ADV-1 beforeAll creates the file, then T-ADV-3's skipIf finds it present, runs the test, and asserts it's unchanged. If T-ADV-1 beforeAll had NOT run, the test would be skipped — meaning T-ADV-3 provides NO coverage when install.sh has not been run. This is an unconditional conditional guard — the test is structurally dependent on T-ADV-1's beforeAll side effect. If T-ADV-1 is fixed to not pre-create the file, T-ADV-3 will be skipped on all clean systems. | ESCALATE |
| adversary.test.ts::T-ADV-4 / T-SPEC-2-a "should exit non-zero with a strict-isolation message" | Sets up golden adversary task, runs update-import adversary, runs save-context, asserts non-zero exit, output matches `/strict.isolation|not.*available|specialized.*task/i`. | T-SPEC-2, T-ADV-4 | The setupGoldenAdversaryTask function creates the adversary CLAUDE.md in the PROJECT's .claude/tasks/adversary/ directory (not in specialized/). Then update-import adversary is called. For update-import to correctly route to the specialized path (via setupSpecializedAdversaryTask), the golden task alone may not be sufficient — update-import must detect that 'adversary' is a specialized task, not just a user task. If update-import finds the golden task CLAUDE.md and uses it instead of the specialized path, the @import will point to a user-task-like path. Then save-context may not recognize the STRICT isolation flag. This test could pass vacuously if save-context rejects for a different reason (e.g., the adversary task CLAUDE.md via the golden path also contains STRICT). The test does NOT call setupSpecializedAdversaryTask, meaning the specialized path may be empty. Outcome depends on implementation's routing logic. | ESCALATE |
| adversary.test.ts::T-ADV-4 / T-SPEC-2-b "should not create a context file at the adversary personal context path" | Same setup as 2-a, runs save-context, asserts context file does not exist at personal path. | T-SPEC-2, T-ADV-4 | The non-existence check is meaningful only if the test can establish that save-context would normally write to that path. The path checked is `join(ctx.personalDir, 'tasks', 'adversary', 'contexts', 'should-not-exist.jsonl')`. This is correct — same ESCALATE concern as 2-a about whether the STRICT detection fires correctly. | ESCALATE |
| adversary.test.ts::T-SPEC-3-a "should exit 0 and output a strict-isolation message" | Same setup (golden task only, no specialized path), runs context-list, asserts exit 0, output matches `/strict.isolation|no contexts.*isolation|isolation.*no contexts/i`. | T-SPEC-3 | Same routing concern as T-ADV-4 tests. If context-list detects STRICT from the golden task CLAUDE.md content (which contains ADVERSARY and STRICT from ADVERSARY_FIXTURE_CONTENT), this could work. But the mechanism by which the system detects STRICT isolation is ambiguous here — golden task vs specialized path. | ESCALATE |
| adversary.test.ts::T-SPEC-3-b "should not surface any UUID session as a selectable context" | Same setup, runs context-list, asserts exit 0, output does not match UUID pattern. | T-SPEC-3 | UUID regex `/[0-9a-f]{8}-[0-9a-f]{4}/` is sufficient to catch 8-4 UUID segments. The absence check is meaningful. | PASS |

---

## Section 2 — AC Coverage Gaps

### T-INIT-1
Tests: initialization.test.ts::Test-1.1-a, Test-1.2-d, claude-md-system.test.ts::Test-8.2-a, Test-8.2-b
**ADEQUATE** — Multiple tests cover @import existence and path resolution. Pre-condition checks present.

### T-INIT-2
Tests: initialization.test.ts::Test-1.1-c (negative), Test-1.2-b (positive), Test-1.3-d (dedup)
**ADEQUATE** — Positive, negative, and idempotency cases all covered. Pre-condition eliminates self-fulfilling setup.

### T-INIT-3
Tests: initialization.test.ts::Test-1.2-c
**ADEQUATE** — Content equality check present. Pre-condition present.

### T-INIT-4
Tests: initialization.test.ts::Test-1.3-a, Test-1.3-b, Test-1.3-c, Test-1.3-d
**ADEQUATE** — Exit codes, content identity, directory dedup, and stash dedup all covered.

### T-INIT-5
Tests: initialization.test.ts::Test-1.5
**ADEQUATE** — Uses implementation (save-context) rather than direct file writes.

### T-TASK-1
Tests: task-operations.test.ts::Test-2.1-a, Test-2.1-b, Test-2.1-d
**ADEQUATE** — Section content and keyword-under-Focus checks present.

### T-TASK-2
Tests: task-operations.test.ts::Test-2.2-a, Test-2.2-b, Test-2.2-c, Test-2.2-d, error-handling.test.ts::Test-input-validation-a
**INADEQUATE** — Test-2.2-c and Test-2.2-d lack error message assertions. An implementation that exits non-zero for ANY reason on special characters would pass. Relying on Test-2.2-a for message assertion, but 2.2-a only tests spaces. Special character and multi-word cases lack message specificity.

### T-TASK-3
Tests: task-operations.test.ts::Test-2.3
**ADEQUATE** — All three keywords required under Focus section.

### T-TASK-4
Tests: task-operations.test.ts::Test-2.4
**ADEQUATE** — Non-zero exit and no directory. AC does not require specific message.

### T-SWITCH-1
Tests: task-operations.test.ts::T-SWITCH-1 "exactly one @import"
**ADEQUATE** — Directly counts @import lines after each of 4 switches.

### T-SWITCH-2
Tests: task-operations.test.ts::Test-3.4
**ADEQUATE** — Output regex covers two of three AC phrases. "empty" omitted from regex but that is a false-fail risk, not a false-pass risk.

### T-SWITCH-3
Tests: task-operations.test.ts::Test-3.3-a, Test-3.3-b, Test-3.1, Test-3.2
**ADEQUATE** — Personal-only, golden-only, and mixed cases all covered with ordering checks.

### T-SWITCH-4
Tests: task-operations.test.ts::T-SWITCH-4
**ADEQUATE** — JSON output parsed, contexts:[] asserted.

### T-SWITCH-5
Tests: task-operations.test.ts::T-SWITCH-5
**ADEQUATE** — Section label absence and numbered UUID absence both checked.

### T-SWITCH-6
Tests: task-operations.test.ts::Test-3.5-b (PASS), Test-3.5-a (FAIL - no output text check)
**ADEQUATE** — Test-3.5-b covers both the output text AND the @import state. Test-3.5-a is weaker but does not undermine 3.5-b.

### T-CTX-1
Tests: context-operations.test.ts::Test-4.1-a, Test-4.1-c
**ADEQUATE** — Exact path verified and isolation from project golden path verified.

### T-CTX-2
Tests: context-operations.test.ts::Test-4.1-a, Test-4.1-b
**ADEQUATE** — Valid JSONL and non-empty asserted.

### T-CTX-3
Tests: context-operations.test.ts::Test-4.2-b (scan-ran), Test-4.2-c (Stripe block), Test-4.2-d (GitHub block), Test-4.2-e (AWS block)
**INADEQUATE** — Test-4.2-a (golden save, clean context) does NOT assert that the secret scan ran. The AC states "exit 0 with no prompt is a failure" for a session WITH secrets. The blocking tests cover this. However, Test-4.2-a does not verify the scan ran for a clean context save — an implementation that skips scanning for clean contexts and only scans for dirty ones would not be caught. **ESCALATE**: Test-4.2-a does not confirm the scan mechanism ran, only that the file was created.

### T-CTX-4
Tests: context-operations.test.ts::Test-4.5-b
**ADEQUATE** — Pre-condition file size check present, output text required, file non-existence checked.

### T-CTX-5
Tests: context-operations.test.ts::T-CTX-5 (in promote section), new-features.test.ts::T-CTX-5
**INADEQUATE** — new-features.test.ts::T-CTX-5 is missing the pre-condition file-size check that context-operations.test.ts has. If the file creation silently fails below 100KB in the test environment (unlikely but possible with resource constraints), the implementation's "too large" exit would still fire for size >0 if logic is inverted. This is a latent test reliability issue.

### T-CTX-6
Tests: context-operations.test.ts::T-CTX-6, new-features.test.ts::T-CTX-6
**ADEQUATE** — Both copies cover backup content equality.

### T-CTX-7
Tests: context-operations.test.ts::Test-6.6-b
**ADEQUATE** — Non-zero exit and file re-existence both checked.

### T-MEM-1
Tests: context-operations.test.ts::T-MEM-1, new-features.test.ts::T-MEM-1
**INADEQUATE** — Both tests check `personalDir/memory/MEMORY.md`. The PRD DoD specifies `~/.claude/projects/<sanitized>/MEMORY.md` (no `memory/` subdirectory). The test explicitly acknowledges this discrepancy in a comment but proceeds to test the implementation's actual path, not the DoD path. If the DoD path is authoritative, neither test covers T-MEM-1 as specified. The test is masking a compliance gap by asserting the wrong path. ESCALATE.

### T-LIST-1
Tests: context-operations.test.ts::Test-5.1-a, Test-5.4
**ADEQUATE** — Both specific names and ordering checked.

### T-LIST-2
Tests: context-operations.test.ts::T-LIST-2
**ADEQUATE** — Line-level word-boundary count check.

### T-LIST-3
Tests: context-operations.test.ts::Test-5.3
**ADEQUATE** — All three AC phrases covered with word boundaries.

### T-LIST-4
Tests: context-operations.test.ts::T-LIST-4
**INADEQUATE** — Test depends on T-SUM-1 infrastructure being present. If save-context does not write meta.json, T-LIST-4 fails at the meta.json existence check before it can evaluate T-LIST-4. The test is structurally coupled to T-SUM-1 implementation status. T-LIST-4 cannot be ADEQUATE until T-SUM-1 is implemented and passing. Currently: MISSING if meta.json is not written.

### T-HOOK-1
Tests: context-operations.test.ts::T-HOOK-1
**ADEQUATE** — Content verification (authentication keyword) proves correct session was copied.

### T-PROM-1
Tests: context-operations.test.ts::T-PROM-1, Test-7.1-b, Test-7.1-c
**ADEQUATE** — All three tests together cover both-exist, byte-equality, and copy-not-move.

### T-PROM-2
Tests: context-operations.test.ts::Test-7.2
**ADEQUATE** — GitHub token type identified specifically.

### T-PROM-3
Tests: context-operations.test.ts::T-PROM-3
**ADEQUATE** — First promotion setup is through implementation, not manual file creation. Second promotion rejected.

### T-CLMD-1
Tests: initialization.test.ts::Test-1.2-a, claude-md-system.test.ts::Test-8.1-a through d
**ADEQUATE** — Init, task-create, task-switch all covered. Git-level check present.

### T-CLMD-2
Tests: claude-md-system.test.ts::Test-8.2-d, task-operations.test.ts::T-SWITCH-1
**ADEQUATE** — Test-8.2-d counts exactly one @import after two switches. T-SWITCH-1 counts after each of 4 switches.

### T-RESUME-MANUAL
Status: RA-002 applies — DISPOSITION=ACCEPTED, EXPIRY=v2.0-release (not yet met, still active).
**RISK_ACCEPTED (RA-002)**

### T-SEC-2
Tests: secret-detection.test.ts::Test-9.1-a, Test-9.1-b
**ADEQUATE** — AKIA prefix required. Non-zero exit required.

### T-SEC-3
Tests: secret-detection.test.ts::Test-9.2-a, Test-9.2-b
**ADEQUATE** — Both sk_test_ and sk_live_ required.

### T-SEC-4
Tests: secret-detection.test.ts::Test-9.8
**ADEQUATE** — All three message types covered with distinct patterns.

### T-SEC-5
Tests: secret-detection.test.ts::Test-9.6
**ADEQUATE** — Isolated fixture, non-zero exit, AKIA pattern.

### T-SEC-6
Tests: secret-detection.test.ts::Test-9.9-a, Test-9.9-b
**ADEQUATE** — Rescan clean and original key absence both checked.

### T-SEC-7
Tests: secret-detection.test.ts::T-SEC-7
**ADEQUATE** — Tight adjacency regex prevents bypass.

### T-SEC-8
Tests: secret-detection.test.ts::Test-9.3
**ADEQUATE** — ghp_ required.

### T-SEC-9
Tests: secret-detection.test.ts::Test-9.4
**ADEQUATE** — Three RSA-specific patterns required.

### T-SEC-10
Tests: secret-detection.test.ts::Test-9.5
**ADEQUATE** — 'password' keyword required.

### T-GIT-1
Tests: git-integration.test.ts::T-GIT-1, Test-11.7-b (commit before check), Test-11.7-a
**ADEQUATE** — Canonical T-GIT-1 commits .gitignore before calling check-ignore. NOTE: claude-md-system.test.ts::Test-8.3-b does NOT commit first — this creates a reliability gap in that specific test but does not undermine T-GIT-1 coverage overall.

### T-GIT-2
Tests: git-integration.test.ts::T-GIT-2, Test-11.4
**ADEQUATE** — Two independent tests cover personal path exclusion from git status.

### T-ERR-1
Tests: error-handling.test.ts::T-ERR-1, Test-13.1-b, Test-13.2
**ADEQUATE** — Two scripts tested without init, and mid-operation deletion covered.

### T-ERR-2
Tests: error-handling.test.ts::T-ERR-2, Test-13.3-b
**ADEQUATE** — Two malformed JSONL inputs tested.

### T-ERR-3
Tests: error-handling.test.ts::T-ERR-3
**ADEQUATE** — All three operations (init, task-create, update-import) tested with spaces in path.

### T-SUM-1
Tests: context-operations.test.ts::T-SUM-1
**INADEQUATE** — Length range check (20-500) is necessary but not sufficient. A hardcoded or template-generated summary of appropriate length passes. The test does not require the summary to contain any content-derived word. T-SUM-2 partially compensates by requiring content keywords, but T-SUM-1 in isolation is insufficiently falsifiable. An implementation that writes a 50-character static placeholder summary for every context would pass T-SUM-1.

### T-SUM-2
Tests: context-operations.test.ts::T-SUM-2
**ADEQUATE** — Differentiation and content-keyword checks both required.

### T-ADV-1
Tests: adversary.test.ts::T-ADV-1
**INADEQUATE** — beforeAll pre-creates the exact file the test asserts. Self-fulfilling setup. A system where install.sh was never run passes this test because beforeAll creates the file. ESCALATE.

### T-ADV-2
Tests: adversary.test.ts::T-ADV-2-c (path suffix), T-ADV-2-b (content), T-ADV-2-a (exactly one @import)
**ADEQUATE** — Path suffix, content, and count all checked in separate sub-tests.

### T-ADV-3 / T-SPEC-1
Tests: adversary.test.ts::T-ADV-3
**INADEQUATE** — Test uses `it.skipIf(!existsSync(SPECIALIZED_DNA_PATH))`. The DNA is pre-created by T-ADV-1's beforeAll. If T-ADV-1 is corrected (self-fulfilling setup removed), T-ADV-3 will be skipped on all clean systems. The test is not independently runnable. ESCALATE.

### T-ADV-4 / T-SPEC-2
Tests: adversary.test.ts::T-ADV-4-a, T-ADV-4-b
**INADEQUATE** — The test setup uses setupGoldenAdversaryTask (project-level golden task) but NOT setupSpecializedAdversaryTask. The mechanism for STRICT detection is ambiguous — if the implementation detects STRICT from the CLAUDE.md content regardless of path, these tests would pass. If the implementation requires the specialized path, the tests may fail. Either way, the test does not isolate the specialized-path detection mechanism from the content-detection mechanism. ESCALATE.

### T-SPEC-1
Tests: adversary.test.ts::T-ADV-3 (same test)
**INADEQUATE** — Same ESCALATE as T-ADV-3.

### T-SPEC-2
Tests: adversary.test.ts::T-ADV-4-a, T-ADV-4-b
**INADEQUATE** — Same ESCALATE as T-ADV-4.

### T-SPEC-3
Tests: adversary.test.ts::T-SPEC-3-a, T-SPEC-3-b
**INADEQUATE** — Same ambiguous routing concern as T-ADV-4. The isolation message could come from content-based detection rather than framework-level STRICT enforcement. The test cannot distinguish between these two mechanisms. ESCALATE for T-SPEC-3-a. T-SPEC-3-b (no UUID in output) is PASS.

### T-SPEC-4
Tests: adversary.test.ts::T-SPEC-4 / T-ADV-2-b
**ADEQUATE** — Path resolution and content check present.
