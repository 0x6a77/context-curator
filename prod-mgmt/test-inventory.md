# Test Inventory

**Generated:** 2026-03-12 (revised 2026-03-12)  
**PRD Version:** 17.1  
**Risk Acceptances loaded:** RA-001 (exp 2026-09-12), RA-002 (exp v2.0-release)

---

## Section 1 — Test Inventory

| TEST_ID | DESCRIPTION | AC_CLAUSE | COVERAGE_RATIONALE | VERDICT |
|---------|-------------|-----------|-------------------|---------|
| initialization.test.ts:Test1.1:create-structure | Runs init-project on empty project; asserts .claude/, .gitignore, tasks/default/CLAUDE.md exist; verifies @import points to tasks/default/CLAUDE.md; imported file exists | T-INIT-1 | @import line presence AND path correctness AND referenced file existence — all three must hold. Motivated error (wrong path, missing file) is caught. | PASS |
| initialization.test.ts:Test1.1:gitignore-entry | Runs init-project; reads .claude/.gitignore; matches `^CLAUDE\.md$` on its own line | T-GIT-1 setup | Exact-line match prevents matching a comment or combined entry. | PASS |
| initialization.test.ts:Test1.1:no-backup-without-source | Asserts stash path does not exist after init with no root CLAUDE.md; positive anchor: default task created | T-INIT-2 (negative) | Positive anchor (default task exists) prevents vacuous pass if init exits early. Negative stash check is meaningful. | PASS |
| initialization.test.ts:Test1.1:git-initialized | init-project in a git repo; asserts .claude/CLAUDE.md is git-ignored | T-GIT-1 | Uses git check-ignore via isGitIgnored. Correct. | PASS |
| initialization.test.ts:Test1.2:no-modify-root | Asserts root CLAUDE.md content unchanged after init | T-CLMD-1 | Byte-for-byte string equality. Catches any write to root CLAUDE.md. | PASS |
| initialization.test.ts:Test1.2:create-backup | Pre-condition: backup absent; runs init; asserts backup exists with exact content | T-INIT-2 | Pre-condition prevents self-fulfilling setup. Content equality is exact. | PASS |
| initialization.test.ts:Test1.2:default-task-content | Pre-condition: default task absent; runs init; asserts content equals root CLAUDE.md | T-INIT-3 | Pre-condition prevents self-fulfilling setup. Content equality is exact. | PASS |
| initialization.test.ts:Test1.2:import-directive | Pre-condition: .claude/CLAUDE.md absent; runs init; asserts @import matches and path contains 'tasks/default/CLAUDE.md' | T-INIT-1 | Pre-condition plus path specificity. Catches wrong path. | PASS |
| initialization.test.ts:Test1.3:succeed-both | Runs init twice; asserts exit 0 both times; asserts file contents identical | T-INIT-4 | Both conditions from the AC clause. Content identity catches silent state corruption on second run. | PASS |
| initialization.test.ts:Test1.3:no-duplicate-dirs | Runs init twice; asserts single 'default' in tasks dir; content identity | T-INIT-4 | Single-entry check prevents duplicate task creation. Content identity covers the AC. | PASS |
| initialization.test.ts:Test1.3:already-initialized | Runs init twice; asserts exit 0 and content identity | T-INIT-4 | Covers the AC. Does not check for "already initialized" message — AC does not require one. | PASS |
| initialization.test.ts:Test1.3:no-duplicate-stash | Runs init twice; asserts stash dir has exactly one CLAUDE file | T-INIT-4 | Stash count check prevents duplicate backup accumulation. | PASS |
| initialization.test.ts:Test1.4:preserve-existing-content | Creates .claude/existing-file.txt before init; asserts it survives | F-INIT (preservation) | Direct file-existence check after init. | PASS |
| initialization.test.ts:Test1.4:create-missing-files | Creates .claude/ dir before init; asserts missing files still created | F-INIT (completeness) | Checks both .gitignore and default CLAUDE.md. | PASS |
| initialization.test.ts:Test1.5:multiple-projects | Runs init on two project dirs; uses save-context to write a context in project 1; asserts the context path exists under project 1 and does not exist under project 2 | T-INIT-5 | Uses the implementation (not direct file writes) to create the context, then checks cross-isolation. Correctly catches a buggy implementation that writes to both projects. | PASS |
| task-operations.test.ts:Test2.1:create-directory-structure | Runs task-create; asserts exit 0, task dir, task CLAUDE.md, contexts dir exist | T-TASK-1 | Exit code plus structure. | PASS |
| task-operations.test.ts:Test2.1:description-in-focus | Runs task-create; reads CLAUDE.md; asserts required sections present; asserts description keyword appears specifically under ## Focus | T-TASK-1 | Focus-section scoping prevents a keyword appearing in an unrelated section from satisfying the check. | PASS |
| task-operations.test.ts:Test2.1:import-directive-for-new-task | Runs task-create; asserts @import specifically contains 'oauth-refactor' | T-SWITCH-1 | Task-name specificity. | PASS |
| task-operations.test.ts:Test2.1:structure-complete | Runs task-create; asserts exit 0, task dir exists, required sections in CLAUDE.md | T-TASK-1 | Redundant with Test2.1:create-directory-structure. PASS. | PASS |
| task-operations.test.ts:Test2.2:reject-spaces | Runs task-create with spaces in name; asserts non-zero exit, specific error message, no dir created | T-TASK-2 | Three conditions — exit code, message pattern, no artifact. A silent ignore would fail the message check. | PASS |
| task-operations.test.ts:Test2.2:reject-uppercase | Asserts non-zero exit AND neither casing of dir exists | T-TASK-2 | Both casing variants checked. | PASS |
| task-operations.test.ts:Test2.2:reject-special-chars | Asserts non-zero exit AND dir does not exist | T-TASK-2 | Minimal but sufficient. | PASS |
| task-operations.test.ts:Test2.2:no-dir-for-invalid | Asserts non-zero exit AND neither casing of dir exists | T-TASK-2 | Redundant with Test2.2:reject-spaces. PASS. | PASS |
| task-operations.test.ts:Test2.3:multiline-description | Runs task-create with multi-line description; asserts three keywords appear under ## Focus | T-TASK-3 | Focus-section scoping. Three keywords from different lines of the description. | PASS |
| task-operations.test.ts:Test2.4:empty-description | Runs task-create with empty string; asserts non-zero exit and no task dir | T-TASK-4 | Both conditions from the AC. | PASS |
| task-operations.test.ts:Test3.1:list-personal-only | Runs task-list; asserts 'my-progress' present, 'personal' section present, 'golden' absent | T-SWITCH-3 partial | Absence of 'golden' when only personal contexts exist prevents false-positive section injection. | PASS |
| task-operations.test.ts:Test3.2:list-golden-only | Runs task-list; asserts 'oauth-deep-dive' present, 'golden' present, 'personal' absent | T-SWITCH-3 partial | Absence of 'personal' when only golden contexts exist. | PASS |
| task-operations.test.ts:Test3.3:list-both-T-SWITCH-3 | Runs task-list with both types; asserts all three context names present, both section labels, personal-1 before golden-1 | T-SWITCH-3 | Specific context names (not section labels) used for ordering check — prevents false match on section-label text. | PASS |
| task-operations.test.ts:Test3.3:personal-before-golden | Same as above; uses indexOf on specific context names | T-SWITCH-3 | Redundant with T-SWITCH-3 test. PASS. | PASS |
| task-operations.test.ts:Test3.4:no-contexts-fresh-start | Runs task-list on empty task; asserts exit 0 and output matches /no contexts\|fresh/i | T-SWITCH-2 | Correct phrase set per AC. | PASS |
| task-operations.test.ts:Test3.4:task-switch-no-contexts | Runs update-import on task with no contexts; asserts exit 0 | F-TASK-SWITCH | No AC clause — tests operational completeness. | PASS |
| task-operations.test.ts:Test3.5:switch-to-default | Runs update-import default; asserts @import contains 'default' | T-SWITCH-6 partial | Path check only, no output check. T-SWITCH-6 requires output confirmation too — that is covered by Test3.5:T-SWITCH-6. | PASS |
| task-operations.test.ts:Test3.5:T-SWITCH-6 | Runs update-import default; asserts output matches /vanilla\|restored/ AND @import contains 'default' AND does not contain 'some-task' | T-SWITCH-6 | Both conditions: text confirmation AND structural verification. Implementation cannot fake by outputting the right text without updating the file. | PASS |
| task-operations.test.ts:Test3.6:multiple-switches | Runs update-import through A→B→C→A; after each: exit 0, file contains current task, does not contain prior | T-SWITCH-1 | Absence check after each switch prevents accumulation. | PASS |
| task-operations.test.ts:T-SWITCH-4:json-contexts-empty | Runs context-list --json with UUID session files planted; parses JSON; asserts contexts:[] | T-SWITCH-4 | Exact empty array check. Sessions field confirmed non-empty (proving the setup worked). | PASS |
| task-operations.test.ts:T-SWITCH-5:no-uuid-as-numbered-option | Runs context-list (human output) with UUID sessions; asserts no numbered UUID pattern; asserts 'sessions' present; asserts 'personal contexts' and 'golden contexts' absent | T-SWITCH-5 | Regex `/^\s*\d+\.\s+[0-9a-f]{8}-...`  is specific. Absence of section labels when no named contexts exist. | PASS |
| task-operations.test.ts:T-SWITCH-1:exact-one-import | Switches A→B→C→A; after each: reads file, counts @import lines, asserts exactly 1, asserts it contains the task name | T-SWITCH-1 | Exact count 1. Content points to selected task. Catches both accumulation and wrong-target bugs. | PASS |
| context-operations.test.ts:Test4.1:save-to-personal | Plants session; runs save-context --personal; asserts exact path, isValidJsonl | T-CTX-1, T-CTX-2 | Exact path (not just any file). JSONL validity. | PASS |
| context-operations.test.ts:Test4.1:valid-jsonl | Plants session; runs save-context --personal; asserts exit 0, path exists, isValidJsonl, non-empty | T-CTX-2 | Non-empty check prevents trivially empty file satisfying isValidJsonl. | PASS |
| context-operations.test.ts:Test4.1:not-in-project-dir | Plants session; runs save-context --personal; asserts personal path exists AND project golden path does not exist | T-CTX-1 | Positive + negative. Catches misrouted personal saves. | PASS |
| context-operations.test.ts:Test4.2:golden-to-project-dir | Plants clean session; runs save-context --golden; asserts exact golden path, isValidJsonl | T-CTX-1 golden | Exact path for golden location. | PASS |
| context-operations.test.ts:Test4.2:scan-before-golden | Runs save-context --golden on clean context; asserts output contains 'scan' or 'secret' | T-CTX-3 signal | Weak signal only — proves scanning was invoked, not that blocking works. Blocking is covered by subsequent tests. | PASS |
| context-operations.test.ts:Test4.2:block-stripe-golden | Plants STRIPE_KEY_CONTEXT; runs save-context --golden; asserts non-zero exit, output matches /stripe\|sk_live/, golden file absent | T-CTX-3 | Three conditions. File absence check proves blocking, not just warning. | PASS |
| context-operations.test.ts:Test4.2:block-github-golden | Plants GITHUB_TOKEN_CONTEXT; runs save-context --golden; asserts non-zero exit, output matches /github\|ghp_/, golden file absent | T-CTX-3 | Same pattern. | PASS |
| context-operations.test.ts:Test4.2:block-aws-golden | Plants AWS_KEY_CONTEXT; runs save-context --golden; asserts non-zero exit, output matches /aws\|akia/, golden file absent | T-CTX-3 | Same pattern. | PASS |
| context-operations.test.ts:Test4.3:invalid-context-name | Runs save-context with spaces/special chars; asserts non-zero exit, specific error message pattern, no file | Input validation | No AC clause — defensive test. | PASS |
| context-operations.test.ts:Test4.5:empty-context | Plants empty session; runs save-context --personal; asserts non-zero exit, no stack trace | T-CTX-4 edge | Empty rejection + no unhandled exception. | PASS |
| context-operations.test.ts:Test4.5:golden-size-cap | Creates 150KB JSONL, verifies size before run; runs save-context --golden; asserts non-zero exit, output matches /100KB\|too large/i, golden file absent | T-CTX-4 | Pre-size verification prevents a test that passes even if the fixture is too small. File absence proves cap enforcement. | PASS |
| context-operations.test.ts:T-CTX-6:backup-on-overwrite | Saves twice with same name; asserts .backup- file exists; asserts backup content equals original | T-CTX-6 | Content equality check on the backup file. | PASS |
| context-operations.test.ts:Test5.1:list-all-contexts | Runs context-list; asserts both context names, 'personal' section present, 'golden' absent | T-LIST-1 | Name presence + section presence + golden absence when no golden contexts. | PASS |
| context-operations.test.ts:Test5.1:T-LIST-2:message-count | Finds line containing each context name; asserts `\b5\b` on ctx-1 line, `\b30\b` on ctx-2 line | T-LIST-2 | Word-boundary count on the SAME LINE as the context name. Prevents count appearing anywhere in output from satisfying the check. | PASS |
| context-operations.test.ts:Test5.3:T-LIST-3:no-contexts | Runs context-list on empty task; asserts output matches `/\bfresh\b\|\bempty\b\|\bno contexts\b/i` | T-LIST-3 | Word boundaries prevent substring matches. Exact three-phrase set from AC. | PASS |
| context-operations.test.ts:Test5.4:personal-before-golden | Asserts both names present, both sections, personal-ctx before golden-ctx by indexOf | T-LIST-1 | Same pattern as T-SWITCH-3. indexOf on specific context names, not section labels. | PASS |
| context-operations.test.ts:Test5.5:nonexistent-task | Runs context-list on nonexistent task; asserts non-zero, output matches /not found\|does not exist/i | F-ERR | Correct. | PASS |
| context-operations.test.ts:Test5.6:T-LIST-4:content-derived-summary | Calls save-context; checks meta.json exists; summary contains keyword from SMALL_CONTEXT; context-list line contains '—' separator with content word after it | T-LIST-4 | save-context writes .meta.json; context-list reads and appends summary. All conditions verified. | PASS |
| context-operations.test.ts:Test6.1:zero-contexts | Runs list-all-contexts; asserts output matches `/\bno contexts\b\|\bempty\b/i` | T-LIST-3 adjacent | Correct phrase set with word boundaries. | PASS |
| context-operations.test.ts:Test6.6:golden-indicator | Runs list-all-contexts; finds line containing 'golden-ctx' in stderr; asserts ⭐ or 'golden' label on that line | F-CTX-MANAGE display | Same-line check prevents a stray section label elsewhere satisfying it. | PASS |
| context-operations.test.ts:Test6.6:T-CTX-7:no-confirm-blocks | Pre-asserts file exists; runs delete-context without --confirm; asserts non-zero exit; re-asserts file still exists | T-CTX-7 | File existence before AND after. Catches a delete that silently succeeds. | PASS |
| context-operations.test.ts:Test7.1:T-PROM-1:both-copies-exist | Runs promote-context; asserts exit 0, golden path exists, personal path exists, contents byte-for-byte identical | T-PROM-1 | All three conditions from AC. Byte equality catches partial copies. | PASS |
| context-operations.test.ts:Test7.1:copy-to-golden | Same; adds isValidJsonl on golden and confirms personal still exists | T-PROM-1 | Redundant with T-PROM-1 but adds JSONL validation. | PASS |
| context-operations.test.ts:Test7.1:preserve-personal | Captures content before promote; asserts content unchanged after | T-PROM-1 | Byte equality before/after. | PASS |
| context-operations.test.ts:T-CTX-5:promote-size-cap | Creates 150KB personal context; runs promote-context; asserts non-zero exit, output matches /100kb\|too large/i, golden file absent | T-CTX-5 | File absence proves cap enforcement. | PASS |
| context-operations.test.ts:Test7.2:T-PROM-2:github-detected | Plants GITHUB_TOKEN_CONTEXT; runs promote-context; asserts non-zero exit, output matches /github\|ghp_/i | T-PROM-2 | Type-specific identification. | PASS |
| context-operations.test.ts:Test7.3:redaction-option | Runs scan-secrets on stripe context; asserts non-zero exit, output matches /stripe\|sk_/i | T-SEC-3 | Tests the scanner, not the promoter. AC for T-PROM-2 requires type identification on promote; this test is complementary. | PASS |
| context-operations.test.ts:Test7.4:nonexistent-context | Runs promote-context on nonexistent context; asserts non-zero, /not found\|does not exist/i | F-ERR | Correct. | PASS |
| context-operations.test.ts:Test7.5:T-PROM-3:already-golden | First promote creates golden legitimately (verified); second promote attempt asserts non-zero and /already.*golden\|already exists/i | T-PROM-3 | First-promote success verified before second attempt. Catches an implementation that silently overwrites instead of rejecting. | PASS |
| context-operations.test.ts:T-MEM-1:memory-updated | Runs save-context; asserts MEMORY.md at personalDir/memory/MEMORY.md contains task-id and context-name | T-MEM-1 | Both required strings checked. Path is implementation-specific subdirectory; test notes this deviation from spec. | PASS |
| context-operations.test.ts:T-HOOK-1:auto-save-timestamped | Uses execSync to call auto-save-context with stdin payload; asserts exit 0, file in auto-saves/ dir, valid JSONL, non-empty, contains 'authentication' | T-HOOK-1 | Content check ('authentication' from SMALL_CONTEXT) proves the hook copied the planted session, not an empty stub. | PASS |
| context-operations.test.ts:T-SUM-1:summary-length | Calls save-context; asserts meta.json exists; asserts summary is string between 20 and 500 chars | T-SUM-1 | save-context now writes .meta.json with content-derived summary. Length bounds enforced. | PASS |
| context-operations.test.ts:T-SUM-2:different-summaries | Saves two contexts from different topics; asserts summaries differ AND each contains keyword from source content | T-SUM-2 | Keyword-from-content check prevents hardcoded or random summaries. Distinct contexts produce distinct summaries. | PASS |
| secret-detection.test.ts:Test9.1:aws-access-key | Runs scan-secrets on AWS_KEY_CONTEXT; asserts non-zero exit, output matches /akia/i | T-SEC-2 | AKIA prefix specificity. Non-zero exit. | PASS |
| secret-detection.test.ts:Test9.1:aws-secret-key | Same fixture; asserts output matches /aws.*key\|secret.*key\|akia/i | T-SEC-2 | Redundant with Test9.1:aws-access-key. PASS. | PASS |
| secret-detection.test.ts:Test9.2:stripe-live-key | Runs scan-secrets on STRIPE_KEY_CONTEXT; asserts non-zero exit, output matches /sk_live/i | T-SEC-3 | sk_live_ specificity. | PASS |
| secret-detection.test.ts:Test9.2:stripe-both-types | Same fixture; asserts output contains both 'sk_test_' AND 'sk_live_' | T-SEC-3 | Dual-presence check. A scanner detecting only one type fails. | PASS |
| secret-detection.test.ts:Test9.3:github-token | Runs scan-secrets on GITHUB_TOKEN_CONTEXT; asserts non-zero exit, output matches /ghp_/i | T-SEC-8 | ghp_ specificity. Non-zero exit. Covered by newly added T-SEC-8 AC clause. | PASS |
| secret-detection.test.ts:Test9.4:rsa-private-key | Runs scan-secrets on PRIVATE_KEY_CONTEXT; asserts non-zero exit, output matches /rsa.*private\|private.*key\|BEGIN.*PRIVATE/i | T-SEC-9 | Private key header specificity. Covered by newly added T-SEC-9 AC clause. | PASS |
| secret-detection.test.ts:Test9.5:password-patterns | Runs scan-secrets on PASSWORD_CONTEXT; asserts non-zero exit, output matches /password/i | T-SEC-10 | Password pattern specificity. Covered by newly added T-SEC-10 AC clause. | PASS |
| secret-detection.test.ts:Test9.6:akiaiosfodnn7example-policy | Isolates AKIAIOSFODNN7EXAMPLE in its own fixture; runs scan-secrets; asserts non-zero exit, output matches /akia/i | T-SEC-5 | Isolated fixture ensures no other secrets could trigger the detection. Policy requirement correctly enforced. | PASS |
| secret-detection.test.ts:Test9.7:T-SEC-7:exact-five-count | Runs scan-secrets on MULTIPLE_SECRETS_CONTEXT; asserts non-zero; asserts output matches `/\bfound\s+5\s+secret\|\b5\s+secrets?\s+found/i` | T-SEC-7 | Tightened: "5" must be adjacent to "found"/"secret". Eliminates the bypass where "Scanning 5 messages… found 3 secrets" matched the old loose `\b5\b.*secrets?` alternative. | PASS |
| secret-detection.test.ts:Test9.8:T-SEC-4:all-message-types | Creates one secret per message type (user/assistant/tool_result); asserts output contains type-specific patterns for all three | T-SEC-4 | Each pattern is specific to its secret type; a scanner that skips any message type will miss that pattern. | PASS |
| secret-detection.test.ts:Test9.9:T-SEC-6:clean-after-redact | Runs redact-secrets; asserts exit 0, file exists, isValidJsonl; runs scan-secrets on redacted; asserts exit 0 and output matches /clean/i | T-SEC-6 | Full round-trip. Rescan must return clean and exit 0. | PASS |
| secret-detection.test.ts:Test9.9:mask-secrets | Runs redact-secrets; asserts redacted file exists, isValidJsonl, non-empty; asserts original secret absent; asserts redaction marker present | T-SEC-6 | Marker presence check prevents an implementation that merely deletes lines satisfying the original-secret-absent check. | PASS |
| secret-detection.test.ts:Test:clean-detection | Runs scan-secrets on CLEAN_CONTEXT; asserts exit 0, output matches /clean/i | T-SEC-2 negative | Exit 0 for clean input. | PASS |
| git-integration.test.ts:Test11.1:gitignore-created | Asserts .claude/.gitignore exists after init | T-GIT-1 setup | Prerequisite for T-GIT-1. | PASS |
| git-integration.test.ts:Test11.1:gitignore-content | Reads .gitignore; matches `^CLAUDE\.md$` | T-GIT-1 setup | Exact-line match. | PASS |
| git-integration.test.ts:Test11.2:task-tracked | Stages task CLAUDE.md; asserts it appears in git status | F-GIT | Verifies task files are git-trackable. No AC clause. | PASS |
| git-integration.test.ts:Test11.2:task-committable | Commits task dir; asserts no exception | F-GIT | No AC clause. | PASS |
| git-integration.test.ts:Test11.3:golden-tracked | Creates golden JSONL; stages it; asserts it appears in git status | F-GIT | No AC clause. | PASS |
| git-integration.test.ts:Test11.3:golden-committable | Commits golden context; asserts no exception | F-GIT | No AC clause. | PASS |
| git-integration.test.ts:Test11.4:personal-not-in-git | Verifies personalBase is outside projectDir; runs save-context; verifies personal path is outside projectDir; stages everything; asserts status lines don't contain context names | T-GIT-2 structural | Structural isolation is a necessary precondition; the status check verifies git staging does not pick up personal files. | PASS |
| git-integration.test.ts:Test11.5:cross-workspace-isolation | Two independent project dirs; each creates task and golden context; commits each; asserts cross-isolation (task from dev1 absent in dev2, vice versa); asserts .claude/CLAUDE.md not in status for either | F-GIT | No direct AC clause; validates git hygiene in multi-developer scenario. | PASS |
| git-integration.test.ts:Test11.6:golden-recognized | Creates golden context; runs context-list; asserts output contains context name | F-CTX-LIST | No AC clause; integration check. | PASS |
| git-integration.test.ts:Test11.7:not-in-status | Commits .gitignore; modifies .claude/CLAUDE.md; asserts status does not contain '.claude/CLAUDE.md' | T-GIT-2 | Direct porcelain status check. | PASS |
| git-integration.test.ts:Test11.7:check-ignore | Commits .gitignore; calls isGitIgnored; asserts true | T-GIT-1 | Uses git check-ignore. Correct. | PASS |
| git-integration.test.ts:T-GIT-1:check-ignore-exits-0 | Commits .gitignore; calls isGitIgnored on .claude/CLAUDE.md; asserts true | T-GIT-1 | Dedicated test. Correct. | PASS |
| git-integration.test.ts:T-GIT-2:porcelain-no-personal | Full workflow via save-context; stages everything; asserts porcelain status lines don't contain personalDir prefix or context name | T-GIT-2 | Uses implementation (not direct file creation) to create personal context, then verifies it doesn't leak into git. | PASS |
| error-handling.test.ts:Test13.1:T-ERR-1:no-claude-dir | Runs task-create without init; asserts non-zero exit, output matches /init\|not initialized/i, no stack trace | T-ERR-1 | Three conditions: exit, message, no raw exception. | PASS |
| error-handling.test.ts:Test13.1:suggest-init | Runs update-import without init; asserts non-zero exit, output matches /init/i | T-ERR-1 | Separate script, same AC. | PASS |
| error-handling.test.ts:Test13.2:deleted-claude-dir | Creates task, deletes .claude/, runs task-list; asserts non-zero and /not.*initialized\|run init/i | T-ERR-1 | Runtime deletion scenario. | PASS |
| error-handling.test.ts:Test13.3:T-ERR-2:corrupt-jsonl | Creates malformed JSONL; runs scan-secrets; asserts non-zero, no stack trace patterns, output matches /invalid\|corrupt\|malformed\|parse.*error\|json/i | T-ERR-2 | Both the exit code requirement and the no-stack-trace requirement from T-ERR-2. | PASS |
| error-handling.test.ts:Test13.3:no-crash-invalid-json | Creates incomplete JSON; runs scan-secrets; asserts non-zero, no stack trace | T-ERR-2 | Redundant with Test13.3 above. PASS. | PASS |
| error-handling.test.ts:Test13.5:invalid-metadata | Creates valid JSONL with invalid .meta.json; runs context-list; asserts exit 0 and no stack trace | F-ERR | No AC clause. context-list is expected to skip .meta.json files. | PASS |
| error-handling.test.ts:Test13.6:permission-denied | Chmod tasks dir to 0o444; runs task-create; asserts non-zero and permission message | RA-001 | ACCEPTED: RA-001 (exp 2026-09-12). Early-return for root user and chmod failure are standard conditional-skip patterns. | ACCEPTED |
| error-handling.test.ts:Test:validate-task-ids | Loops over six invalid task ID formats; each asserts non-zero and error message | T-TASK-2 | Extends T-TASK-2 to six variants. | PASS |
| error-handling.test.ts:Test:validate-context-names | Loops over three invalid context names; each asserts non-zero | Input validation | No AC clause. | PASS |
| error-handling.test.ts:Test:degrade-nonexistent-task | Runs context-list on nonexistent task; asserts non-zero and /not found\|does not exist/i | F-ERR | Correct. | PASS |
| error-handling.test.ts:Test:degrade-nonexistent-context | Runs promote-context on nonexistent context; asserts non-zero and /not found\|does not exist/i | F-ERR | Correct. | PASS |
| error-handling.test.ts:Test12.4:T-ERR-3:paths-with-spaces | Creates dir with space in path; runs init-project, task-create, update-import; asserts exit 0 AND output files exist for each | T-ERR-3 | Both conditions from AC: exit code AND file existence. | PASS |
| error-handling.test.ts:Test12.6:jsonl-line-endings | Runs save-context; reads resulting files; asserts no CRLF | F-XPLAT | No AC clause. | PASS |
| error-handling.test.ts:Test12.7:generated-file-line-endings | Runs init and task-create; reads .gitignore and task CLAUDE.md; asserts no CRLF | F-XPLAT | No AC clause. | PASS |
| claude-md-system.test.ts:Test8.1:no-modify-during-init | Reads root CLAUDE.md after init; asserts byte equality | T-CLMD-1 | Direct equality. | PASS |
| claude-md-system.test.ts:Test8.1:no-modify-during-task-create | Creates two tasks; reads root CLAUDE.md; asserts unchanged | T-CLMD-1 | Two task creates. | PASS |
| claude-md-system.test.ts:Test8.1:no-modify-during-switch | Multiple switches; reads root CLAUDE.md; asserts unchanged | T-CLMD-1 | Covers all task operations. | PASS |
| claude-md-system.test.ts:Test8.1:no-git-changes | Creates task, switches; asserts git status does not show root CLAUDE.md modified | T-CLMD-1 | Git side of the invariant. | PASS |
| claude-md-system.test.ts:Test8.2:created-on-init | Asserts .claude/CLAUDE.md exists after init | T-CLMD-2 | Existence check. | PASS |
| claude-md-system.test.ts:Test8.2:contains-import | Reads .claude/CLAUDE.md; asserts @import pattern | T-CLMD-2 | Pattern check. | PASS |
| claude-md-system.test.ts:Test8.2:updates-on-switch | Switches to task-1; asserts @import contains 'task-1' | T-CLMD-2 | Update check. | PASS |
| claude-md-system.test.ts:Test8.2:exactly-one-import | Switches task-1 then task-2; counts @import lines; asserts exactly 1; asserts points to task-2; asserts does not contain task-1 | T-CLMD-2 | Exact count plus old-task absence. | PASS |
| claude-md-system.test.ts:Test8.3:gitignore-entry | Reads .gitignore; asserts `^CLAUDE\.md$` | T-GIT-1 | Same as initialization.test.ts:Test1.1:gitignore-entry. | PASS |
| claude-md-system.test.ts:Test8.3:git-ignored | Asserts isGitIgnored returns true | T-GIT-1 | Direct check. | PASS |
| claude-md-system.test.ts:Test8.3:not-in-status | Commits .gitignore; modifies .claude/CLAUDE.md; stages .claude/; asserts status doesn't include '.claude/CLAUDE.md' | T-GIT-1 | Staging test. | PASS |
| claude-md-system.test.ts:Test8.4:update-to-auth | Switches to auth; asserts @import matches auth; asserts no 'payment' | T-CLMD-2 | Old-task absence check. | PASS |
| claude-md-system.test.ts:Test8.4:update-to-payment | Switches to payment; asserts @import matches payment; asserts no 'auth' | T-CLMD-2 | Old-task absence check. | PASS |
| claude-md-system.test.ts:Test8.4:update-to-default | Switches to auth then default; asserts @import matches default | T-CLMD-2 | Default restoration. | PASS |
| claude-md-system.test.ts:Test8.5:T-CLMD-2:resume-proxy | Creates oauth-work task; switches to it; reads @import; asserts contains 'oauth-work'; asserts task CLAUDE.md file exists | T-CLMD-2 (T-RESUME-MANUAL structural proxy) | Verifies our side of the /resume contract. Claude Code's side (re-reading on resume) is the manual test, accepted under RA-002. | PASS |
| claude-md-system.test.ts:T-RESUME-MANUAL | Manual: after /task + /resume, Claude references task CLAUDE.md content | T-RESUME-MANUAL | ACCEPTED: RA-002 (exp v2.0-release). Cannot be automated without live Claude Code session. | ACCEPTED |
| claude-md-system.test.ts:Test8.6:multi-dev-different-states | Two project dirs; each switches to different task; asserts different .claude/CLAUDE.md contents; asserts identical root CLAUDE.md | F-CLMD | No AC clause beyond T-CLMD-1; validates multi-developer independence. | PASS |
| new-features.test.ts:T-CTX-5:promote-size-cap | Creates 150KB personal context; runs promote-context; asserts non-zero, /100kb\|too large/i, golden absent | T-CTX-5 | Duplicate of context-operations.test.ts:T-CTX-5. PASS. | PASS |
| new-features.test.ts:T-CTX-6:backup-on-overwrite | Saves twice with same name; asserts .backup- file exists; asserts backup content equals original | T-CTX-6 | Duplicate of context-operations.test.ts:T-CTX-6. PASS. | PASS |
| new-features.test.ts:T-MEM-1:memory-updated | Runs save-context; waitFor MEMORY.md; asserts contains task-id and context-name | T-MEM-1 | Uses waitFor (5s) to handle async write. If MEMORY.md is never written, waitFor returns false and test fails. | PASS |

---

## Section 2 — Acceptance Criteria Coverage Gaps

### PRD Audit: All Sections Checked for AC

All 14 PRD feature sections contain acceptance criteria. All AC clauses are falsifiable.

**PRD AC gaps:** None. All tests are attributed to AC clauses. T-SEC-8/9/10 were added to PRD v17.0 to cover GitHub token, private key, and password detection respectively.

---

### Per-Clause Coverage

**T-INIT-1** — `init-project` creates .claude/CLAUDE.md with @import line; file must not exist before script  
Tests: Test1.1:create-structure, Test1.2:import-directive  
Coverage: ADEQUATE — both tests have pre-condition checks and verify path specificity.

**T-INIT-2** — backup created byte-for-byte; must not exist before script  
Tests: Test1.1:no-backup-without-source (negative), Test1.2:create-backup (positive)  
Coverage: ADEQUATE

**T-INIT-3** — default task content equals root CLAUDE.md  
Tests: Test1.2:default-task-content  
Coverage: ADEQUATE — byte equality with pre-condition.

**T-INIT-4** — init twice: exit 0 both times, identical file contents  
Tests: Test1.3:succeed-both, Test1.3:no-duplicate-dirs, Test1.3:already-initialized, Test1.3:no-duplicate-stash  
Coverage: ADEQUATE

**T-INIT-5** — project A context not visible in project B  
Tests: Test1.5:multiple-projects  
Coverage: ADEQUATE — uses implementation to create context, then verifies cross-isolation.

**T-TASK-1** — CLAUDE.md has required sections; description in Focus  
Tests: Test2.1:description-in-focus, Test2.1:structure-complete  
Coverage: ADEQUATE — Focus-section scoping prevents false attribution.

**T-TASK-2** — invalid name: non-zero exit AND no directory  
Tests: Test2.2:reject-spaces, Test2.2:reject-uppercase, Test2.2:reject-special-chars, Test:validate-task-ids  
Coverage: ADEQUATE

**T-TASK-3** — multi-line description preserved in Focus  
Tests: Test2.3:multiline-description  
Coverage: ADEQUATE — three keywords under Focus section.

**T-TASK-4** — empty description: non-zero exit, no directory  
Tests: Test2.4:empty-description  
Coverage: ADEQUATE

**T-SWITCH-1** — exactly one @import, pointing to selected task, after each switch  
Tests: Test3.6:multiple-switches, T-SWITCH-1:exact-one-import  
Coverage: ADEQUATE — exact count of @import lines plus old-task absence.

**T-SWITCH-2** — no contexts: exit 0, output contains "no contexts" or "fresh"  
Tests: Test3.4:no-contexts-fresh-start  
Coverage: ADEQUATE

**T-SWITCH-3** — personal before golden in listing  
Tests: Test3.3:T-SWITCH-3, Test3.3:personal-before-golden  
Coverage: ADEQUATE — indexOf on specific context names, not section labels.

**T-SWITCH-4** — context-list --json returns contexts:[] when only sessions exist  
Tests: T-SWITCH-4:json-contexts-empty  
Coverage: ADEQUATE — exact empty array assertion, sessions field confirmed non-empty.

**T-SWITCH-5** — no UUID sessions as numbered options in human output  
Tests: T-SWITCH-5:no-uuid-as-numbered-option  
Coverage: ADEQUATE — specific numbered-UUID regex and section-label absence checks.

**T-SWITCH-6** — switching to default: @import points to default, output confirms with "vanilla" or "restored"  
Tests: Test3.5:T-SWITCH-6  
Coverage: ADEQUATE — both text and structural conditions verified.

**T-CTX-1** — save-context --personal creates file at exact path  
Tests: Test4.1:save-to-personal, Test4.1:not-in-project-dir  
Coverage: ADEQUATE — positive (correct path exists) and negative (wrong path absent).

**T-CTX-2** — saved file is valid JSONL, unconditionally asserted  
Tests: Test4.1:valid-jsonl  
Coverage: ADEQUATE — non-empty check prevents trivially empty JSONL.

**T-CTX-3** — golden save with real secret: non-zero exit or prompt; file blocked  
Tests: Test4.2:block-stripe-golden, Test4.2:block-github-golden, Test4.2:block-aws-golden  
Coverage: ADEQUATE for blocking behavior. Tests require non-zero exit (stricter than the AC's "or prompt" wording) AND file absence — both conditions catch wrong implementations.  
Note: The AC permits "produces a prompt; exit 0" as a valid implementation. Tests reject that implementation (they require non-zero exit). This is a test-is-stricter-than-AC situation, not a coverage gap.

**T-CTX-4** — golden save on 150KB session: non-zero exit, output contains "100KB" or "too large"  
Tests: Test4.5:golden-size-cap  
Coverage: ADEQUATE — pre-size verification and file-absence check.

**T-CTX-5** — promote-context on 150KB context: non-zero exit, output contains "100KB" or "too large"  
Tests: context-operations.test.ts:T-CTX-5, new-features.test.ts:T-CTX-5  
Coverage: ADEQUATE

**T-CTX-6** — save-context twice: .backup- file created, contains original content  
Tests: context-operations.test.ts:T-CTX-6, new-features.test.ts:T-CTX-6  
Coverage: ADEQUATE

**T-CTX-7** — delete-context golden without --confirm: non-zero exit, file intact  
Tests: Test6.6:T-CTX-7:no-confirm-blocks  
Coverage: ADEQUATE — file existence verified before and after.

**T-MEM-1** — MEMORY.md updated after save-context with task-id and context-name  
Tests: context-operations.test.ts:T-MEM-1, new-features.test.ts:T-MEM-1  
Coverage: ADEQUATE

**T-LIST-1** — personal listed before golden, specific context names present  
Tests: Test5.1:list-all-contexts, Test5.4:personal-before-golden  
Coverage: ADEQUATE — indexOf on context names (not section labels).

**T-LIST-2** — exact message count with word boundary on same line as context name  
Tests: Test5.1:T-LIST-2:message-count  
Coverage: ADEQUATE — same-line constraint is correctly applied.

**T-LIST-3** — no contexts: output contains "fresh", "empty", or "no contexts"  
Tests: Test5.3:T-LIST-3:no-contexts, Test6.1:zero-contexts  
Coverage: ADEQUATE — word-boundary regex.

**T-LIST-4** — context-list shows content-derived summary alongside context name  
Tests: Test5.6:T-LIST-4:content-derived-summary  
Coverage: ADEQUATE — save-context writes .meta.json with content-derived summary; context-list reads it and appends " — <summary>" on the context name line.

**T-PROM-1** — after promote, both copies exist, byte-for-byte identical  
Tests: Test7.1:T-PROM-1:both-copies-exist  
Coverage: ADEQUATE

**T-PROM-2** — promote with ghp_ + 36 chars: output names specific type  
Tests: Test7.2:T-PROM-2:github-detected  
Coverage: ADEQUATE — ghp_ specificity.

**T-PROM-3** — promote when golden already exists: non-zero exit  
Tests: Test7.5:T-PROM-3:already-golden  
Coverage: ADEQUATE — first promotion verified before second attempt.

**T-CLMD-1** — root CLAUDE.md never modified by any operation  
Tests: Test8.1 (four tests), Test1.2:no-modify-root  
Coverage: ADEQUATE — tested across init, task-create, and switch operations.

**T-CLMD-2** — after two switches, exactly one @import line  
Tests: Test8.2:exactly-one-import, T-SWITCH-1:exact-one-import  
Coverage: ADEQUATE

**T-RESUME-MANUAL** — manual test  
Coverage: RISK_ACCEPTED — RA-002 (exp v2.0-release)

**T-SEC-2** — AKIA + 16 chars: non-zero exit, output contains "AWS" or "AKIA"  
Tests: Test9.1:aws-access-key, Test9.1:aws-secret-key  
Coverage: ADEQUATE

**T-SEC-3** — detects sk_test_ AND sk_live_, names specific type  
Tests: Test9.2:stripe-live-key, Test9.2:stripe-both-types  
Coverage: ADEQUATE — dual-presence check.

**T-SEC-4** — all three message types (user/assistant/tool_result) scanned  
Tests: Test9.8:T-SEC-4:all-message-types  
Coverage: ADEQUATE — one secret per type, each with a type-specific pattern.

**T-SEC-5** — AKIAIOSFODNN7EXAMPLE treated as true positive  
Tests: Test9.6:akiaiosfodnn7example-policy  
Coverage: ADEQUATE — isolated fixture.

**T-SEC-6** — after redact, every line parses as JSON; rescan returns clean  
Tests: Test9.9:T-SEC-6:clean-after-redact, Test9.9:mask-secrets  
Coverage: ADEQUATE — full round-trip plus marker check.

**T-SEC-7** — scan reports exactly 5 secrets; count adjacent to "found"/"secret"  
Tests: Test9.7:T-SEC-7:exact-five-count  
Coverage: ADEQUATE — regex tightened to `/\bfound\s+5\s+secret|\b5\s+secrets?\s+found/i`; adjacency requirement closes the "5 messages" bypass.

**T-SUM-1** — .meta.json summary between 20 and 500 characters  
Tests: context-operations.test.ts:T-SUM-1  
Coverage: ADEQUATE — save-context writes .meta.json with content-derived summary; test verifies length bounds.

**T-SUM-2** — different conversations produce different summaries with content keywords  
Tests: context-operations.test.ts:T-SUM-2  
Coverage: ADEQUATE — two distinct contexts produce different summaries each containing keywords from their source content.

**T-GIT-1** — git check-ignore .claude/CLAUDE.md exits 0  
Tests: git-integration.test.ts:T-GIT-1:check-ignore-exits-0, claude-md-system.test.ts:Test8.3:git-ignored  
Coverage: ADEQUATE

**T-GIT-2** — git status --porcelain does not list personal storage paths  
Tests: git-integration.test.ts:T-GIT-2:porcelain-no-personal  
Coverage: ADEQUATE — uses implementation to create personal context.

**T-ERR-1** — script without init: non-zero, output contains "initialized" or "init", no stack trace  
Tests: Test13.1:T-ERR-1:no-claude-dir, Test13.1:suggest-init, Test13.2:deleted-claude-dir  
Coverage: ADEQUATE

**T-ERR-2** — scan-secrets on malformed JSONL: non-zero exit  
Tests: Test13.3:T-ERR-2:corrupt-jsonl, Test13.3:no-crash-invalid-json  
Coverage: ADEQUATE — both exit code and no-stack-trace conditions.

**T-ERR-3** — paths with spaces: exit 0 AND output files exist  
Tests: Test12.4:T-ERR-3:paths-with-spaces  
Coverage: ADEQUATE — both conditions verified for three operations.

**T-HOOK-1** — auto-save creates timestamped .jsonl in auto-saves/ flat directory  
Tests: context-operations.test.ts:T-HOOK-1:auto-save-timestamped  
Coverage: ADEQUATE — content check proves real session was copied.

**T-SEC-8** — ghp_ + 36 chars: non-zero exit, output contains "ghp_" or "github"  
Tests: Test9.3:github-token  
Coverage: ADEQUATE — ghp_ specificity, non-zero exit required.

**T-SEC-9** — BEGIN RSA PRIVATE KEY header: non-zero exit, output matches private key pattern  
Tests: Test9.4:rsa-private-key  
Coverage: ADEQUATE — private key header specificity.

**T-SEC-10** — password assignment pattern: non-zero exit, output contains "password"  
Tests: Test9.5:password-patterns  
Coverage: ADEQUATE — password pattern specificity.
