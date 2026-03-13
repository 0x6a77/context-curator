# Test Inventory

**Generated:** 2026-03-12  
**Adversary run:** prepared-werewolf  
**Context isolation:** STRICT — no knowledge of prior runs

---

## Risk Acceptances Loaded

| RA_ID | SCOPE | DISPOSITION | EXPIRY | STATUS |
|-------|-------|-------------|--------|--------|
| RA-001 | error-handling.test.ts:Test 13.6 | ACCEPTED | 2026-09-12 | ACTIVE |
| RA-002 | T-RESUME-MANUAL | ACCEPTED | v2.0-release | ACTIVE |

---

## Section 1 — PRD Audit

### F-INIT
AC table present. All 5 clauses (T-INIT-1 through T-INIT-5) are falsifiable. PASS.

### F-TASK-CREATE
AC table present. All 4 clauses (T-TASK-1 through T-TASK-4) are falsifiable. PASS.

### F-TASK-SWITCH
AC table present. All 6 clauses (T-SWITCH-1 through T-SWITCH-6) are falsifiable. PASS.

### F-CTX-SAVE
AC table present. T-CTX-1, T-CTX-2, T-CTX-3, T-CTX-4, T-CTX-6, T-MEM-1 — all falsifiable.  
**STRUCTURAL GAP:** The PRD feature description says "For personal saves, secrets trigger a warning with the option to redact before saving — they do not block the save." No AC clause exists for this behaviour. The described behaviour is not falsifiable via any defined test criterion.

### F-CTX-LIST
AC table present. T-LIST-1 through T-LIST-4 are falsifiable. PASS.

### F-CTX-MANAGE
AC table present. T-CTX-7 is falsifiable. PASS.

### F-CTX-PROMOTE
AC table present. T-CTX-5, T-PROM-1, T-PROM-2, T-PROM-3 are falsifiable. PASS.

### F-CLMD
AC table present. T-CLMD-1, T-CLMD-2, T-RESUME-MANUAL are falsifiable. PASS.

### F-SEC
AC table present. T-SEC-2 through T-SEC-10 are falsifiable. PASS.

### F-SUMMARY
AC table present. T-SUM-1 and T-SUM-2 are falsifiable. PASS.

### F-GIT
AC table present. T-GIT-1 and T-GIT-2 are falsifiable. PASS.

### F-XPLAT
AC table present. T-ERR-3 is falsifiable. PASS.

### F-ERR
AC table present. T-ERR-1 and T-ERR-2 are falsifiable. PASS.

### F-HOOK
AC table present. T-HOOK-1 is falsifiable. PASS.

---

## Section 2 — Test Inventory

| TEST_ID | DESCRIPTION | AC_CLAUSE | COVERAGE_RATIONALE | VERDICT |
|---------|-------------|-----------|-------------------|---------|
| initialization.test.ts:Test1.1a | Runs init-project on empty project; asserts .claude/ structure exists and .claude/CLAUDE.md contains @import pointing to tasks/default/CLAUDE.md | T-INIT-1 | Import line is regex-matched and the imported path verified to exist — rejects a vacuous @import with dead path. | PASS |
| initialization.test.ts:Test1.1b | Asserts .claude/.gitignore contains a line matching `^CLAUDE\.md$` | F-INIT expected behaviour | Exact line match; cannot pass with partial or wrong entry. | PASS |
| initialization.test.ts:Test1.1c | Asserts stash backup is NOT created when no root CLAUDE.md pre-exists | F-INIT expected behaviour | Positive assertion (default task created) prevents vacuous pass. | PASS |
| initialization.test.ts:Test1.1d | Runs init in git-initialized dir; asserts .claude/CLAUDE.md is git-ignored | T-GIT-1 (partial proxy) | Uses isGitIgnored which calls git check-ignore. | PASS |
| initialization.test.ts:Test1.2a | Asserts root CLAUDE.md unchanged after init | T-CLMD-1 | Content compared to known string. | PASS |
| initialization.test.ts:Test1.2b (T-INIT-2) | Pre-condition asserts backup does not exist; runs init; asserts backup exists with byte-for-byte original content | T-INIT-2 | Pre-condition prevents self-fulfilling setup. Content equality check prevents a stub file. | PASS |
| initialization.test.ts:Test1.2c (T-INIT-3) | Pre-condition asserts default task file absent; runs init; asserts content equals originalContent | T-INIT-3 | Exact string equality; cannot pass with empty or different content. | PASS |
| initialization.test.ts:Test1.2d (T-INIT-1 variant) | Pre-condition asserts .claude/CLAUDE.md absent; runs init; asserts @import points to tasks/default/CLAUDE.md and that path exists | T-INIT-1 | Pre-condition plus imported-path existence check prevents dead-link @import. | PASS |
| initialization.test.ts:Test1.3a | Runs init twice; captures content after first run; asserts content identical after second run; both exit 0 | T-INIT-4 | Identity check catches an implementation that rewrites the file with different content on second run. | PASS |
| initialization.test.ts:Test1.3b | Runs init twice; asserts exactly one 'default' entry in tasks dir; content identical | T-INIT-4 | Directory count prevents duplicate task creation. | PASS |
| initialization.test.ts:Test1.3c | Runs init twice with CLAUDE_HOME; both exit 0; content identical after both runs | T-INIT-4 | Exit code + content identity. | PASS |
| initialization.test.ts:Test1.3d (T-INIT-4) | Runs init twice; content identical; stash dir exists and contains exactly 1 CLAUDE file | T-INIT-4 | Stash count assertion prevents duplicate stash creation. | PASS |
| initialization.test.ts:Test1.4a | Setup creates existing file in .claude/; runs init; asserts existing file still present | F-INIT expected behaviour | Content of preserved file verified. | PASS |
| initialization.test.ts:Test1.4b | Setup creates existing .claude/; runs init; asserts gitignore and default task still created | F-INIT expected behaviour | File existence assertions prevent vacuous pass. | PASS |
| initialization.test.ts:Test1.5 (T-INIT-5) | Creates two project dirs; inits both; uses save-context implementation to write to project-1 personal storage; asserts file appears in project-1 path but not project-2 path | T-INIT-5 | Uses the implementation (save-context script) rather than direct file creation to verify isolation. Negative assertion on project-2 is falsifiable because the path is structurally distinct. | PASS |
| task-operations.test.ts:Test2.1a | Runs task-create; asserts task dir, CLAUDE.md, contexts/ exist; exits 0 | F-TASK-CREATE expected behaviour | Structural assertions prevent vacuous pass. | PASS |
| task-operations.test.ts:Test2.1b (T-TASK-1) | Runs task-create; asserts CLAUDE.md has all 4 required sections; asserts description keyword appears under ## Focus specifically | T-TASK-1 | Focus-section slice prevents keyword appearing only in another section. | PASS |
| task-operations.test.ts:Test2.1c | Runs task-create; asserts .claude/CLAUDE.md @import contains 'oauth-refactor' | F-TASK-CREATE expected behaviour | Specific task name in import path; cannot pass with default or wrong task import. | PASS |
| task-operations.test.ts:Test2.1d | Runs task-create; asserts task dir and CLAUDE.md exist with required sections | T-TASK-1 (supplemental) | Duplicate of structural check — no new coverage. | PASS |
| task-operations.test.ts:Test2.2a | Runs task-create with name containing spaces; asserts non-zero exit, error message, no dir created | T-TASK-2 | Three-way check: exit code, message, filesystem. | PASS |
| task-operations.test.ts:Test2.2b (T-TASK-2) | Runs task-create with uppercase name 'OAuthRefactor'; asserts non-zero exit; asserts neither 'OAuthRefactor' nor 'oauthrefactor' dir created | T-TASK-2 | Checks both original and lowercased path to prevent case-folded creation. | PASS |
| task-operations.test.ts:Test2.2c | Runs task-create with 'oauth@refactor!'; asserts non-zero exit; asserts dir absent | T-TASK-2 | Unconditional no-dir assertion. | PASS |
| task-operations.test.ts:Test2.2d | Runs task-create with 'OAuth Refactor'; asserts non-zero exit; asserts dir absent for both original and lowercased name | T-TASK-2 | Covers both case variants. | PASS |
| task-operations.test.ts:Test2.3 (T-TASK-3) | Runs task-create with multi-line description; asserts all three keywords appear under ## Focus section specifically | T-TASK-3 | Focus-section slice check prevents keywords in other sections satisfying the assertion. | PASS |
| task-operations.test.ts:Test2.4 (T-TASK-4) | Runs task-create with empty description; asserts non-zero exit; asserts no task dir created | T-TASK-4 | Both exit code and filesystem check. | PASS |
| task-operations.test.ts:Test3.1 | Runs task-list with personal-only contexts; asserts 'personal' in output and 'golden' NOT in output | T-SWITCH-3 (partial) | Negative 'golden' assertion is falsifiable only because the setup contains no golden contexts. | PASS |
| task-operations.test.ts:Test3.2 | Runs task-list with golden-only contexts; asserts 'golden' in output and 'personal' NOT in output | T-SWITCH-3 (partial) | Negative 'personal' assertion is falsifiable only because no personal contexts exist in setup. | PASS |
| task-operations.test.ts:Test3.3a (T-SWITCH-3) | Both personal and golden contexts present; asserts all three specific context names appear; asserts personal-1 appears before golden-1 | T-SWITCH-3 | Ordering check uses specific context names (not section headers), preventing false matches from metadata or paths. | PASS |
| task-operations.test.ts:Test3.3b (T-LIST-1) | Same setup; asserts personal-ctx before golden-ctx by indexOf | T-LIST-1 | Ordering requirement verified with specific names. | PASS |
| task-operations.test.ts:Test3.4a (T-SWITCH-2) | Task with no contexts; asserts exit 0 and output matches /no contexts\|fresh/i | T-SWITCH-2 | The AC phrases are specific; 'fresh' and 'no contexts' are unlikely to appear accidentally. | PASS |
| task-operations.test.ts:Test3.4b | Runs update-import on task with no contexts; asserts exit 0 | F-TASK-SWITCH expected behaviour | Exit code only — no content assertion. Vacuous for the import file content. | PASS |
| task-operations.test.ts:Test3.5a | Runs update-import default; asserts @import contains 'default' | T-SWITCH-6 (partial) | Content assertion but missing the output text check for 'vanilla\|restored'. | PASS |
| task-operations.test.ts:Test3.5b (T-SWITCH-6) | Runs update-import default; asserts output contains /vanilla\|restored/; asserts @import points to default/CLAUDE.md; asserts 'some-task' NOT in .claude/CLAUDE.md | T-SWITCH-6 | Both text and import content verified. Negative check ensures prior task is removed. | PASS |
| task-operations.test.ts:Test3.6 | Four-step A→B→C→A switch; asserts exit 0 and correct import after each; asserts each prior task NOT in import after switch | T-SWITCH-1 (structural proxy) | fileContains(false) on prior task prevents accumulation. | PASS |
| task-operations.test.ts:T-SWITCH-4 | context-list --json on task with UUID sessions but no named contexts; asserts data.contexts equals [] | T-SWITCH-4 | Strict toEqual([]) on contexts array; sessions array verified non-empty proving sessions exist but don't leak into contexts. | PASS |
| task-operations.test.ts:T-SWITCH-5 | context-list human output with UUID sessions but no named contexts; asserts no numbered UUID pattern | T-SWITCH-5 | Regex `/^\s*\d+\.\s+[uuid]/im` checks numbered format. Covers the specific AC claim of "numbered selectable options." Non-numbered UUID display (bullets, plain text) is not caught, but AC is scoped to "numbered selectable options." | PASS |
| task-operations.test.ts:T-SWITCH-1 | Four-step A→B→C→A switch; counts @import lines each time asserts exactly 1; asserts it contains the selected task | T-SWITCH-1 | Exact count of `@import` lines prevents accumulation. Content check prevents wrong-task import. | PASS |
| context-operations.test.ts:Test4.1a (T-CTX-1) | Creates session; runs save-context --personal; asserts file at exact personalDir path exists; asserts valid JSONL | T-CTX-1 | Exact path assertion; isValidJsonl unconditional. | PASS |
| context-operations.test.ts:Test4.1b (T-CTX-2) | Same; also asserts file content non-empty | T-CTX-2 | Non-empty check prevents an implementation writing an empty-but-valid JSONL file. | PASS |
| context-operations.test.ts:Test4.1c | Personal save; asserts personal path exists AND project golden path does NOT exist | T-CTX-1 (negative) | Both positive and negative assertions. | PASS |
| context-operations.test.ts:Test4.2a | Golden save with CLEAN_CONTEXT; asserts exit 0 and valid JSONL at golden path | F-CTX-SAVE expected behaviour | Clean path; no secret detection required. | PASS |
| context-operations.test.ts:Test4.2b | Golden save with CLEAN_CONTEXT; asserts output mentions 'scan' or 'secret' | F-CTX-SAVE expected behaviour | Weak: `output.includes('scan') \|\| output.includes('secret')` — 'secret' could appear in unrelated messages. However combined with exit code and the clean path tests, the assertion is not vacuous in isolation. The OR is noted but not escalated because neither branch alone always fires in a correct implementation. | PASS |
| context-operations.test.ts:Test4.2c (T-CTX-3) | Golden save with STRIPE_KEY_CONTEXT; asserts non-zero exit; output matches /stripe\|sk_live/; golden file does NOT exist | T-CTX-3 | File-not-exists assertion is load-bearing: it fails if the scanner detects the secret but still writes the file. | PASS |
| context-operations.test.ts:Test4.2d (T-CTX-3) | Golden save with GITHUB_TOKEN_CONTEXT; asserts non-zero exit; output matches /github\|ghp_/; golden file absent | T-CTX-3 | Same structure as 4.2c. | PASS |
| context-operations.test.ts:Test4.2e (T-CTX-3) | Golden save with AWS_KEY_CONTEXT; asserts non-zero exit; output matches /aws\|akia/; golden file absent | T-CTX-3 | File-not-exists assertion is load-bearing. | PASS |
| context-operations.test.ts:Test4.3 | save-context with invalid name 'my work!'; asserts non-zero exit; output matches /invalid.*(name\|characters?)/; no file created | F-CTX-SAVE expected behaviour | Three-way check. | PASS |
| context-operations.test.ts:Test4.5a | save-context with empty session; asserts non-zero exit; no stack trace | F-CTX-SAVE expected behaviour | Empty context must be rejected. | PASS |
| context-operations.test.ts:Test4.5b (T-CTX-4) | Creates session file >100KB (verified by statSync before run); golden save; asserts non-zero exit; output matches /100KB\|too large/i; golden file absent | T-CTX-4 | Pre-check on file size prevents test running with an accidentally small fixture. File-not-exists is load-bearing. | PASS |
| context-operations.test.ts:T-CTX-6 | Two saves with same name; asserts backup file exists containing original content | T-CTX-6 | Content equality on backup prevents an empty backup file from passing. | PASS |
| context-operations.test.ts:Test5.1a (T-LIST-1) | context-list with personal-only contexts; asserts specific names present; 'personal' in output; 'golden' NOT in output | T-LIST-1 | Negative 'golden' check is falsifiable only because setup has no golden contexts. | PASS |
| context-operations.test.ts:Test5.1b (T-LIST-2) | Asserts ctx-1 line contains `\b5\b`; ctx-2 line contains `\b30\b` | T-LIST-2 | Word-boundary count on the same line as the context name. Passes only if count is correct. | PASS |
| context-operations.test.ts:Test5.3 (T-LIST-3) | No contexts task; asserts output matches `/\bfresh\b\|\bempty\b\|\bno contexts\b/i` | T-LIST-3 | Word boundaries prevent substring matches; the three phrases are specific to the AC. | PASS |
| context-operations.test.ts:Test5.4 (T-LIST-1) | Both personal and golden contexts; asserts specific names present; ordering of personal before golden | T-LIST-1 | indexOf comparison on specific context names. | PASS |
| context-operations.test.ts:Test5.5 | context-list for nonexistent task; asserts non-zero exit; output matches /not found\|does not exist/i | F-CTX-LIST expected behaviour | Specific error message pattern. | PASS |
| context-operations.test.ts:Test5.6 (T-LIST-4) | save-context used (not direct file creation); asserts meta.json exists with content-derived summary (keyword match); context-list output contains summary on same line as name after '—' separator, with content keyword | T-LIST-4 | Summary keyword requirement prevents hardcoded summary. Separator and keyword check on context-list output verifies end-to-end display. However: if the implementation does not generate summaries (as noted in T-SUM test comments), this test fails — the feature is unimplemented at this inventory run. | FAIL |
| context-operations.test.ts:Test6.1 | list-all-contexts with no contexts; asserts output matches /\bno contexts\b\|\bempty\b/i | F-CTX-MANAGE expected behaviour | Word-bounded phrases. | PASS |
| context-operations.test.ts:Test6.6a | list-all-contexts; asserts golden-ctx appears in output with ⭐ or 'golden' label on same line | F-CTX-MANAGE expected behaviour | Line-scoped check prevents a 'golden' label on a different line satisfying the assertion. | PASS |
| context-operations.test.ts:Test6.6b (T-CTX-7) | Pre-condition asserts golden file exists; delete-context without --confirm; asserts non-zero exit AND golden file still exists | T-CTX-7 | File-still-exists assertion is load-bearing: verifies the file was not deleted despite the non-zero exit. | PASS |
| context-operations.test.ts:Test7.1a (T-PROM-1) | promote-context on clean context; asserts exit 0; asserts both personal and golden paths exist; asserts content identical | T-PROM-1 | Byte-for-byte comparison via string equality. | PASS |
| context-operations.test.ts:Test7.1b | Same; additionally asserts valid JSONL at golden path | T-PROM-1 (supplemental) | isValidJsonl prevents an empty copy. | PASS |
| context-operations.test.ts:Test7.1c | Captures original personal content before promote; asserts personal file unchanged after promote | T-PROM-1 | String equality on personal file after promote; prevents move-instead-of-copy. | PASS |
| context-operations.test.ts:T-CTX-5 | promote-context on >100KB personal context; asserts non-zero exit; output matches /100kb\|too large/i; golden file absent | T-CTX-5 | File-not-exists is load-bearing. | PASS |
| context-operations.test.ts:Test7.2 (T-PROM-2) | promote-context with GITHUB_TOKEN_CONTEXT; asserts non-zero exit; output matches /github\|ghp_/i | T-PROM-2 | Pattern match identifies GitHub token type. Non-zero exit required. No check that golden file is absent — but AC only requires "output names specific secret type," which the pattern satisfies. | PASS |
| context-operations.test.ts:Test7.3 | scan-secrets on STRIPE_KEY_CONTEXT path; asserts non-zero exit; output matches /stripe\|sk_/i | T-PROM-2 (partial) | Redirection option not tested — only scanning. AC clause T-PROM-2 says "output names specific secret type"; this test verifies scanning is called. | PASS |
| context-operations.test.ts:Test7.4 | promote-context on nonexistent context; asserts non-zero exit; output matches /not found\|does not exist/i | F-CTX-PROMOTE expected behaviour | Specific message pattern. | PASS |
| context-operations.test.ts:Test7.5 (T-PROM-3) | beforeEach creates personal context and runs first promotion successfully (golden exists); test runs second promotion; asserts non-zero exit; output matches /already.*golden\|already exists/i | T-PROM-3 | **FAIL.** The test verifies exit non-zero and error message but does NOT assert the golden file is unchanged after the failed second promotion. A motivated wrong implementation could copy the personal file to golden, then exit non-zero with "already golden." The golden file would be overwritten but the test would pass because exit code and message are correct. The missing assertion is `expect(readFile(goldenPath)).toBe(contentBeforeSecondPromotion)`. |
| context-operations.test.ts:T-MEM-1 | save-context; asserts MEMORY.md at personalDir/memory/MEMORY.md contains task-id and context-name | T-MEM-1 | Both task-id and context-name checked; prevents a MEMORY.md that contains only one. | PASS |
| context-operations.test.ts:T-HOOK-1 | Runs auto-save-context with mock stdin payload; asserts exit 0; asserts auto-saves/ dir exists; asserts a .jsonl file exists; asserts content contains 'authentication' | T-HOOK-1 | **FAIL.** The AC specifies a "timestamped .jsonl file." The test asserts only that any `.jsonl` file exists in auto-saves/. An implementation creating a fixed filename like `auto-save.jsonl` (no timestamp) would pass the test. The filename timestamp requirement is not verified. |
| context-operations.test.ts:T-SUM-1 | save-context; asserts meta.json exists; summary string length between 20 and 500 | T-SUM-1 | **FAIL.** Test comment explicitly states the implementation does not generate summaries and meta.json is not written by save-context. If this remains true, the `expect(fileExists(metaPath)).toBe(true)` assertion fails, leaving T-SUM-1 with zero passing coverage. Test design is adequate for when feature is implemented. |
| context-operations.test.ts:T-SUM-2 | Two save-contexts from auth and DB conversations; asserts summaries differ; each contains content-specific keywords | T-SUM-2 | **FAIL** (same reason as T-SUM-1 — unimplemented). When implemented, keyword specificity prevents hardcoded summaries. |
| claude-md-system.test.ts:Test8.1a | Root CLAUDE.md content unchanged after init | T-CLMD-1 | String equality. | PASS |
| claude-md-system.test.ts:Test8.1b (T-CLMD-1) | Root CLAUDE.md unchanged after two task creates | T-CLMD-1 | String equality after task operations. | PASS |
| claude-md-system.test.ts:Test8.1c | Root CLAUDE.md unchanged after multiple task switches | T-CLMD-1 | String equality after switch operations. | PASS |
| claude-md-system.test.ts:Test8.1d | git status after task create + switch does not include root CLAUDE.md as modified | T-CLMD-1 | Git-layer verification prevents an implementation that modifies root CLAUDE.md but then reverts it. | PASS |
| claude-md-system.test.ts:Test8.2a | .claude/CLAUDE.md created by init | F-CLMD expected behaviour | File existence. | PASS |
| claude-md-system.test.ts:Test8.2b | .claude/CLAUDE.md contains @import directive | F-CLMD expected behaviour | Regex match. | PASS |
| claude-md-system.test.ts:Test8.2c | .claude/CLAUDE.md @import contains 'task-1' after switch | F-CLMD expected behaviour | Content assertion. | PASS |
| claude-md-system.test.ts:Test8.2d (T-CLMD-2) | Two switches; counts @import lines; asserts exactly 1; asserts content contains task-2 and NOT task-1 | T-CLMD-2 | Line count prevents accumulation; negative task-1 check prevents stale lines. | PASS |
| claude-md-system.test.ts:Test8.3a | .claude/.gitignore exists and contains `^CLAUDE\.md$` | F-CLMD expected behaviour | Exact line match. | PASS |
| claude-md-system.test.ts:Test8.3b (T-GIT-1 proxy) | isGitIgnored on .claude/CLAUDE.md returns true | T-GIT-1 (partial) | Uses git check-ignore. | PASS |
| claude-md-system.test.ts:Test8.3c | git status does not contain '.claude/CLAUDE.md' after staging .claude/ | F-CLMD expected behaviour | git layer verification. | PASS |
| claude-md-system.test.ts:Test8.4a | update-import auth; asserts @import contains 'auth' and NOT 'payment' | F-CLMD expected behaviour | Negative check prevents both imports surviving. | PASS |
| claude-md-system.test.ts:Test8.4b | update-import payment; asserts @import contains 'payment' and NOT 'auth' | F-CLMD expected behaviour | Same. | PASS |
| claude-md-system.test.ts:Test8.4c | update-import default after auth; asserts @import contains 'default' | F-CLMD expected behaviour | Return to default verified. | PASS |
| claude-md-system.test.ts:Test8.5 (T-CLMD-2 / T-RESUME-MANUAL proxy) | task-create + update-import oauth-work; asserts @import contains 'oauth-work'; asserts referenced task CLAUDE.md exists on disk | T-CLMD-2 | Imported-path existence check prevents a valid @import pointing to a nonexistent file. This is the structural proxy for T-RESUME-MANUAL. | PASS |
| claude-md-system.test.ts:Test8.6 | Two developer workspaces; each creates different task; asserts each workspace has its own @import content; root CLAUDE.md identical | F-CLMD expected behaviour | Cross-workspace isolation verified. | PASS |
| secret-detection.test.ts:Test9.1a (T-SEC-2) | scan-secrets on AWS_KEY_CONTEXT; asserts non-zero exit; output matches /akia/i | T-SEC-2 | AKIA prefix is unambiguous. Non-zero exit required. | PASS |
| secret-detection.test.ts:Test9.1b | scan-secrets on AWS_KEY_CONTEXT; asserts output matches /aws.*key\|secret.*key\|akia/i | T-SEC-2 (supplemental) | Pattern is slightly weaker than 9.1a (aws.*key matches generic messages) but layered with exit code. | PASS |
| secret-detection.test.ts:Test9.2a (T-SEC-3) | scan-secrets on STRIPE_KEY_CONTEXT; asserts non-zero exit; output matches /sk_live/i | T-SEC-3 (partial) | Live key detected; test key coverage is in 9.2b. | PASS |
| secret-detection.test.ts:Test9.2b (T-SEC-3) | scan-secrets on STRIPE_KEY_CONTEXT; asserts non-zero exit; output contains 'sk_test_' AND 'sk_live_' | T-SEC-3 | Both prefix strings in output proves both were detected (assuming scanner outputs detected values, not full file echo). Coverage rationale: if scanner echoes entire file, both strings appear trivially. However the clean-context test (Test9.last) requires exit 0 on clean content, which rules out always-exiting-non-zero, and the paired exit code check rules out no-op. The output-contains check is adequate given those constraints. | PASS |
| secret-detection.test.ts:Test9.3 (T-SEC-8) | scan-secrets on GITHUB_TOKEN_CONTEXT; asserts non-zero exit; output matches /ghp_/i | T-SEC-8 | ghp_ prefix is specific to GitHub tokens. | PASS |
| secret-detection.test.ts:Test9.4 (T-SEC-9) | scan-secrets on PRIVATE_KEY_CONTEXT; asserts non-zero exit; output matches /rsa.*private\|private.*key\|BEGIN.*PRIVATE/i | T-SEC-9 | Pattern covers RSA key header. | PASS |
| secret-detection.test.ts:Test9.5 (T-SEC-10) | scan-secrets on PASSWORD_CONTEXT; asserts non-zero exit; output matches /password/i | T-SEC-10 | 'password' is in the AC verbatim; case-insensitive match is appropriate. | PASS |
| secret-detection.test.ts:Test9.6 (T-SEC-5) | Isolated fixture with only AKIAIOSFODNN7EXAMPLE; asserts non-zero exit; output matches /akia/i | T-SEC-5 | Isolation of example key from AWS_KEY_CONTEXT removes confounding real keys, making this a clean true-positive policy test. | PASS |
| secret-detection.test.ts:Test9.7 (T-SEC-7) | scan-secrets on MULTIPLE_SECRETS_CONTEXT (1 message, 5 credentials); asserts output matches `/\bfound\s+5\s+secret\|\b5\s+secrets?\s+found/i` | T-SEC-7 | **ESCALATE.** The expected count of 5 depends on whether the AWS secret access key `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` is independently detectable. AWS secret keys have no standard prefix (unlike AKIA access keys). An implementation detecting only AKIA, sk_live_, ghp_, and password= patterns would report 4 secrets, failing this test even though it correctly implements all specified F-SEC patterns. The test over-constrains correct implementations that choose not to detect generic 40-char base64 strings as AWS secrets. |
| secret-detection.test.ts:Test9.8 (T-SEC-4) | Context with one secret per message type (user/assistant/tool_result); asserts each type's pattern appears in output | T-SEC-4 | Three independent pattern checks ensure no message type is skipped. | PASS |
| secret-detection.test.ts:Test9.9a (T-SEC-6) | redact-secrets; asserts exit 0; asserts redacted file is valid JSONL; rescans and asserts exit 0 with 'clean' in output | T-SEC-6 | Two-phase: isValidJsonl plus second scan. Both are unconditional. | PASS |
| secret-detection.test.ts:Test9.9b | redact-secrets on STRIPE_KEY_CONTEXT; asserts redacted file exists; is non-empty valid JSONL; does not contain original key; contains REDACTED/\*\*\*/[REMOVED] | T-SEC-6 (supplemental) | Key-absence check catches partial redaction. Marker-presence check catches delete-instead-of-redact. | PASS |
| secret-detection.test.ts:TestClean | scan-secrets on CLEAN_CONTEXT; asserts exit 0; output matches /clean/i | F-SEC expected behaviour | Exit 0 is required — rules out always-non-zero scanner. | PASS |
| error-handling.test.ts:Test13.1a (T-ERR-1) | task-create without init; asserts non-zero exit; output matches /init\|not initialized/i; no stack trace in stderr | T-ERR-1 | Three-way: exit code, message, no stack trace. | PASS |
| error-handling.test.ts:Test13.1b | update-import without init; asserts non-zero exit; output matches /init/i | T-ERR-1 (supplemental) | Second script type covered. | PASS |
| error-handling.test.ts:Test13.2 | Creates task, deletes .claude/, runs task-list; asserts non-zero exit; output matches /not.*initialized\|run init/i | F-ERR expected behaviour | Mid-operation destruction handled gracefully. | PASS |
| error-handling.test.ts:Test13.3a (T-ERR-2) | scan-secrets on malformed JSONL; asserts non-zero exit; no stack trace pattern in stderr; output matches /invalid\|corrupt\|malformed\|parse.*error\|json/i | T-ERR-2 | Non-zero exit is the primary AC; error message and no-stack-trace are quality requirements on top. | PASS |
| error-handling.test.ts:Test13.3b | scan-secrets on truncated JSON; asserts non-zero exit; no stack trace | T-ERR-2 (supplemental) | Second malformed variant. | PASS |
| error-handling.test.ts:Test13.5 | context-list with corrupt .meta.json; asserts exit 0; no stack trace | F-ERR expected behaviour | Exit 0 proves graceful degradation for metadata corruption. | PASS |
| error-handling.test.ts:Test13.6 (RA-001) | Permission denied test with chmod; checks graceful error handling | F-ERR expected behaviour | ACCEPTED (RA-001, expires 2026-09-12). Conditional skip for root execution is the accepted risk. |
| error-handling.test.ts:TestInputValidation-task | Iterates invalid task IDs; asserts non-zero exit and error message for each | F-ERR expected behaviour | Covers multiple invalid formats. | PASS |
| error-handling.test.ts:TestInputValidation-context | Iterates invalid context names; asserts non-zero exit and error message for each | F-ERR expected behaviour | Same pattern. | PASS |
| error-handling.test.ts:TestGraceful-noTask | context-list for nonexistent task; asserts non-zero exit; output matches /not found\|does not exist/i | F-ERR expected behaviour | Specific message. | PASS |
| error-handling.test.ts:TestGraceful-noContext | promote-context for nonexistent context; asserts non-zero exit; output matches /not found\|does not exist/i | F-ERR expected behaviour | Specific message. | PASS |
| error-handling.test.ts:Test12.4 (T-ERR-3) | init-project, task-create, update-import all run with path containing a space; asserts exit 0 and output files exist for each | T-ERR-3 | Three operations tested; both exit code and file existence verified per operation. | PASS |
| error-handling.test.ts:Test12.6 | save-context; checks all .jsonl files in contexts dir have no CRLF | F-XPLAT expected behaviour | CRLF absence prevents Windows line endings in generated files. | PASS |
| error-handling.test.ts:Test12.7 | init + task-create; checks .gitignore and task CLAUDE.md have no CRLF | F-XPLAT expected behaviour | Same for init-generated files. | PASS |
| git-integration.test.ts:Test11.1a | init; asserts .claude/.gitignore exists | F-GIT expected behaviour | File existence. | PASS |
| git-integration.test.ts:Test11.1b | init; asserts .gitignore contains `^CLAUDE\.md$` | F-GIT expected behaviour | Exact line match. | PASS |
| git-integration.test.ts:Test11.2a | task-create; git add task CLAUDE.md; asserts it appears in git status | F-GIT expected behaviour | git status string contains path. | PASS |
| git-integration.test.ts:Test11.2b | task-create; git add + commit .claude/tasks/; asserts no throw | F-GIT expected behaviour | Commit success. | PASS |
| git-integration.test.ts:Test11.3a | Create golden JSONL; git add; asserts filename in git status | F-GIT expected behaviour | git status verification. | PASS |
| git-integration.test.ts:Test11.3b | Create golden JSONL; git add + commit; asserts no throw | F-GIT expected behaviour | Commit success. | PASS |
| git-integration.test.ts:Test11.4 (T-GIT-2 proxy) | Structural isolation: asserts personalBase is outside projectDir; save-context creates file outside projectDir; git add .; asserts no personal paths in git status | T-GIT-2 | Uses implementation (save-context) not direct file creation. Both positive (personal file exists) and negative (not in git status) assertions. | PASS |
| git-integration.test.ts:Test11.5 | Two independent workspaces; each creates distinct tasks; verifies cross-isolation; verifies .claude/CLAUDE.md absent from both status outputs | F-GIT expected behaviour | Cross-workspace structural isolation verified at git level. | PASS |
| git-integration.test.ts:Test11.6 | Golden context created; context-list lists it | F-GIT expected behaviour | Context name in output. | PASS |
| git-integration.test.ts:Test11.7a | task-create + update-import; commit .gitignore; modify .claude/CLAUDE.md; asserts not in git status | F-GIT / F-CLMD | git status string absence. | PASS |
| git-integration.test.ts:Test11.7b (T-GIT-1) | Commit .gitignore; isGitIgnored asserts true for .claude/CLAUDE.md | T-GIT-1 | git check-ignore via helper. | PASS |
| git-integration.test.ts:T-GIT-1 | isGitIgnored on .claude/CLAUDE.md in real git repo after init; asserts true | T-GIT-1 | Explicit AC-labeled test; uses git check-ignore. | PASS |
| git-integration.test.ts:T-GIT-2 | Full workflow; save-context via implementation; git add .; asserts no personal storage prefix and no 'tgit-ctx' in git status lines | T-GIT-2 | Uses implementation not direct file write. Checks both prefix and context name. | PASS |
| new-features.test.ts:T-CTX-5 | promote-context on >100KB personal context; asserts non-zero exit; output contains '100kb' or 'too large'; golden file absent | T-CTX-5 | Duplicate of context-operations T-CTX-5; both provide independent coverage. File-not-exists is load-bearing in both. | PASS |
| new-features.test.ts:T-CTX-6 | Two saves with same name; asserts backup file exists with original content | T-CTX-6 | Duplicate of context-operations T-CTX-6. Content equality on backup. | PASS |
| new-features.test.ts:T-MEM-1 | save-context; waitFor MEMORY.md to appear; asserts task-id and context-name present | T-MEM-1 | waitFor prevents race condition failure. Both identifiers checked. | PASS |

---

## Section 3 — Acceptance Criteria Coverage Gaps

### F-INIT

**T-INIT-1** — Tests: initialization.test.ts:Test1.1a, Test1.2d. Coverage: ADEQUATE.

**T-INIT-2** — Tests: initialization.test.ts:Test1.2b. Coverage: ADEQUATE. Pre-condition prevents self-fulfilling setup.

**T-INIT-3** — Tests: initialization.test.ts:Test1.2c. Coverage: ADEQUATE.

**T-INIT-4** — Tests: initialization.test.ts:Test1.3a, Test1.3b, Test1.3c, Test1.3d. Coverage: ADEQUATE.

**T-INIT-5** — Tests: initialization.test.ts:Test1.5. Coverage: ADEQUATE.

---

### F-TASK-CREATE

**T-TASK-1** — Tests: task-operations.test.ts:Test2.1b, Test2.1d. Coverage: ADEQUATE.

**T-TASK-2** — Tests: task-operations.test.ts:Test2.2a, Test2.2b, Test2.2c, Test2.2d. Coverage: ADEQUATE.

**T-TASK-3** — Tests: task-operations.test.ts:Test2.3. Coverage: ADEQUATE.

**T-TASK-4** — Tests: task-operations.test.ts:Test2.4. Coverage: ADEQUATE.

---

### F-TASK-SWITCH

**T-SWITCH-1** — Tests: task-operations.test.ts:T-SWITCH-1. Coverage: ADEQUATE.

**T-SWITCH-2** — Tests: task-operations.test.ts:Test3.4a. Coverage: ADEQUATE.

**T-SWITCH-3** — Tests: task-operations.test.ts:Test3.3a, Test3.3b. Coverage: ADEQUATE.

**T-SWITCH-4** — Tests: task-operations.test.ts:T-SWITCH-4. Coverage: ADEQUATE.

**T-SWITCH-5** — Tests: task-operations.test.ts:T-SWITCH-5. Coverage: ADEQUATE. Scoped to numbered-format UUIDs as per AC wording.

**T-SWITCH-6** — Tests: task-operations.test.ts:Test3.5b. Coverage: ADEQUATE.

---

### F-CTX-SAVE

**T-CTX-1** — Tests: context-operations.test.ts:Test4.1a. Coverage: ADEQUATE.

**T-CTX-2** — Tests: context-operations.test.ts:Test4.1b. Coverage: ADEQUATE.

**T-CTX-3** — Tests: context-operations.test.ts:Test4.2c, Test4.2d, Test4.2e. Coverage: ADEQUATE. All three secret types tested with file-not-exists assertions.

**T-CTX-4** — Tests: context-operations.test.ts:Test4.5b. Coverage: ADEQUATE.

**T-CTX-6** — Tests: context-operations.test.ts:T-CTX-6, new-features.test.ts:T-CTX-6. Coverage: ADEQUATE.

**T-MEM-1** — Tests: context-operations.test.ts:T-MEM-1, new-features.test.ts:T-MEM-1. Coverage: ADEQUATE.

**[NO AC DEFINED] — Personal save with secrets warns but does not block.** The PRD F-CTX-SAVE feature description states personal saves trigger a warning with redact option but do not block. No AC clause exists for this behaviour. No test exists for this behaviour.
CLAUSE: F-CTX-SAVE personal-save-with-secrets — NO AC DEFINED — STRICT FAIL

---

### F-CTX-LIST

**T-LIST-1** — Tests: context-operations.test.ts:Test5.1a, Test5.4, task-operations.test.ts:Test3.3b. Coverage: ADEQUATE.

**T-LIST-2** — Tests: context-operations.test.ts:Test5.1b. Coverage: ADEQUATE.

**T-LIST-3** — Tests: context-operations.test.ts:Test5.3. Coverage: ADEQUATE.

**T-LIST-4** — Tests: context-operations.test.ts:Test5.6. Coverage: INADEQUATE. The test is well-designed but depends on save-context generating .meta.json with summaries. Test file comment states this feature is not implemented; test5.6 currently fails at the fileExists(metaPath) assertion.

---

### F-CTX-MANAGE

**T-CTX-7** — Tests: context-operations.test.ts:Test6.6b. Coverage: ADEQUATE.

---

### F-CTX-PROMOTE

**T-CTX-5** — Tests: context-operations.test.ts:T-CTX-5, new-features.test.ts:T-CTX-5. Coverage: ADEQUATE.

**T-PROM-1** — Tests: context-operations.test.ts:Test7.1a, Test7.1b, Test7.1c. Coverage: ADEQUATE.

**T-PROM-2** — Tests: context-operations.test.ts:Test7.2. Coverage: ADEQUATE.

**T-PROM-3** — Tests: context-operations.test.ts:Test7.5. Coverage: INADEQUATE. Test verifies exit non-zero and error message but does not assert that the golden file content is unchanged after the failed second promotion. A wrong implementation that overwrites-then-exits-non-zero would pass.

---

### F-CLMD

**T-CLMD-1** — Tests: claude-md-system.test.ts:Test8.1a, Test8.1b, Test8.1c, Test8.1d. Coverage: ADEQUATE.

**T-CLMD-2** — Tests: claude-md-system.test.ts:Test8.2d, task-operations.test.ts:T-SWITCH-1. Coverage: ADEQUATE.

**T-RESUME-MANUAL** — RISK_ACCEPTED. RA_ID: RA-002. Expiry: v2.0-release. Structural proxy covered by claude-md-system.test.ts:Test8.5.

---

### F-SEC

**T-SEC-2** — Tests: secret-detection.test.ts:Test9.1a, Test9.1b. Coverage: ADEQUATE.

**T-SEC-3** — Tests: secret-detection.test.ts:Test9.2a, Test9.2b. Coverage: ADEQUATE.

**T-SEC-4** — Tests: secret-detection.test.ts:Test9.8. Coverage: ADEQUATE.

**T-SEC-5** — Tests: secret-detection.test.ts:Test9.6. Coverage: ADEQUATE.

**T-SEC-6** — Tests: secret-detection.test.ts:Test9.9a, Test9.9b. Coverage: ADEQUATE.

**T-SEC-7** — Tests: secret-detection.test.ts:Test9.7. Coverage: INADEQUATE. Expected count of 5 depends on detecting the AWS secret access key (no standard prefix). A conforming implementation detecting only AKIA, sk_*, ghp_, and password= patterns would report 4, causing test failure with a count mismatch rather than a coverage gap.

**T-SEC-8** — Tests: secret-detection.test.ts:Test9.3. Coverage: ADEQUATE.

**T-SEC-9** — Tests: secret-detection.test.ts:Test9.4. Coverage: ADEQUATE.

**T-SEC-10** — Tests: secret-detection.test.ts:Test9.5. Coverage: ADEQUATE.

---

### F-SUMMARY

**T-SUM-1** — Tests: context-operations.test.ts:T-SUM-1. Coverage: INADEQUATE. Implementation does not generate summaries per test file comment. Test is well-designed for when the feature is implemented; currently fails.

**T-SUM-2** — Tests: context-operations.test.ts:T-SUM-2. Coverage: INADEQUATE. Same reason as T-SUM-1.

---

### F-GIT

**T-GIT-1** — Tests: git-integration.test.ts:T-GIT-1, Test11.7b, claude-md-system.test.ts:Test8.3b. Coverage: ADEQUATE.

**T-GIT-2** — Tests: git-integration.test.ts:T-GIT-2, Test11.4. Coverage: ADEQUATE.

---

### F-XPLAT

**T-ERR-3** — Tests: error-handling.test.ts:Test12.4. Coverage: ADEQUATE.

---

### F-ERR

**T-ERR-1** — Tests: error-handling.test.ts:Test13.1a, Test13.1b. Coverage: ADEQUATE.

**T-ERR-2** — Tests: error-handling.test.ts:Test13.3a, Test13.3b. Coverage: ADEQUATE.

---

### F-HOOK

**T-HOOK-1** — Tests: context-operations.test.ts:T-HOOK-1. Coverage: INADEQUATE. Test verifies a .jsonl file is created but does not verify the "timestamped" filename requirement from the AC. A fixed filename implementation passes.
