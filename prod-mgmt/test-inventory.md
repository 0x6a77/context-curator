# Adversarial Test Inventory

## DoD / PRD Audit

### PRD Sections Missing Acceptance Criteria

| PRD Section | Verdict | Reason |
|-------------|---------|--------|
| F-TASK-SWITCH | STRICT FAIL | Section has Test Scenarios but no Acceptance Criteria table. No falsifiable DoD clauses defined. |
| F-SUMMARY | STRICT FAIL | Section has Test Scenarios but no Acceptance Criteria table. No falsifiable DoD clauses defined. |
| T-SWITCH-1, T-SWITCH-2, T-SWITCH-3 | STRICT FAIL | Referenced as DoD clauses in test files but appear in no PRD Acceptance Criteria table. DoD clause found outside its feature section — cannot be reliably attributed. |
| T-SUM-1, T-SUM-2 | STRICT FAIL | Referenced as DoD clauses in test comments but appear in no PRD Acceptance Criteria table. F-SUMMARY has no AC table. DoD clauses found outside any feature section — treated as missing. |

### Falsifiability Check — Defined DoD Clauses

All defined DoD clauses (T-INIT-1 through T-INIT-5, T-TASK-1 through T-TASK-4, T-CTX-1 through T-CTX-7, T-LIST-1 through T-LIST-4, T-PROM-1 through T-PROM-3, T-CLMD-1, T-CLMD-2, T-SEC-2 through T-SEC-7, T-GIT-1, T-GIT-2, T-ERR-1 through T-ERR-3, T-HOOK-1, T-MEM-1) are written as falsifiable assertions. No non-falsifiable DoD language found in defined clauses.

---

## Section 1 — Test Inventory

| TEST_ID | DESCRIPTION | DOD_CLAUSE | VERDICT | ATTACK_VECTOR |
|---------|-------------|------------|---------|---------------|
| initialization.test.ts:Test-1.1-create-structure | Runs init-project on empty dir; asserts exit 0, .claude/ dirs exist, .claude/CLAUDE.md contains @import pointing to tasks/default/CLAUDE.md, imported path exists on disk. | T-INIT-1 | PASS | An implementation that hardcodes `@import ./tasks/default/CLAUDE.md` without reading any input would pass; the test checks path existence but not that the path is dynamically derived. Insufficient to FAIL on its own given other tests. |
| initialization.test.ts:Test-1.1-gitignore-content | Asserts .claude/.gitignore contains line matching `/^CLAUDE\.md$/m`. | F-INIT (no specific AC) / proximate T-GIT-1 | PASS | An implementation that writes only "CLAUDE.md\n" to the gitignore file satisfies this. No attack vector beyond vacuous compliance. |
| initialization.test.ts:Test-1.1-no-backup-without-claudemd | Asserts exit 0, stash path does not exist, default task CLAUDE.md exists. | T-INIT-1 (partial) | PASS | No attack vector found. |
| initialization.test.ts:Test-1.1-git-initialized | Initializes git, runs init-project, asserts isGitIgnored returns true for .claude/CLAUDE.md. | T-GIT-1 (proximate) | PASS | No attack vector found; git check-ignore call is real. |
| initialization.test.ts:Test-1.2-no-modify-root | Asserts root CLAUDE.md content unchanged after init. | T-CLMD-1 | PASS | No attack vector found. |
| initialization.test.ts:Test-1.2-create-backup | Asserts backup does not exist before script; asserts exit 0; asserts backup exists with byte-identical content to original. | T-INIT-2 | PASS | No attack vector found; pre-condition check prevents self-fulfilling setup. |
| initialization.test.ts:Test-1.2-default-task-copy | Asserts default task CLAUDE.md does not exist before script; asserts exit 0; asserts content equals original byte-for-byte. | T-INIT-3 | PASS | No attack vector found. |
| initialization.test.ts:Test-1.2-import-directive | Asserts .claude/CLAUDE.md does not exist before; asserts exit 0; asserts @import pointing to tasks/default/CLAUDE.md; asserts imported path exists. | T-INIT-1 | PASS | No attack vector found. |
| initialization.test.ts:Test-1.3-both-succeed | Runs init twice; asserts exit 0 both times; asserts file contents identical between runs. | T-INIT-4 | PASS | No attack vector found. |
| initialization.test.ts:Test-1.3-no-dup-dirs | Runs init twice; asserts .claude/CLAUDE.md exists; asserts tasks dir contains exactly one 'default' entry; asserts content identity. | T-INIT-4 | PASS | No attack vector found. |
| initialization.test.ts:Test-1.3-already-initialized | Runs init twice with CLAUDE_HOME; asserts both exit 0 and content identical. | T-INIT-4 | PASS | No attack vector found. |
| initialization.test.ts:Test-1.3-no-dup-stash | Runs init twice; asserts content identity; asserts stash dir has exactly one CLAUDE backup file. | T-INIT-4 | PASS | No attack vector found. |
| initialization.test.ts:Test-1.4-preserve-content | Creates .claude/ with existing-file.txt before init; asserts existing file still present afterward. | F-INIT (idempotent) | PASS | No attack vector found. |
| initialization.test.ts:Test-1.4-create-missing | Creates .claude/ without init files; asserts init creates missing .gitignore and default task. | F-INIT (idempotent) | PASS | No attack vector found. |
| initialization.test.ts:Test-1.5-multi-project | Inits two projects; creates task in project 1; saves context via implementation; asserts context in project 1 personal dir and not in project 2 personal dir. | T-INIT-5 | PASS | No attack vector found; uses implementation to save (not direct file creation). |
| task-operations.test.ts:Test-2.1-create-structure | Asserts exit 0, task dirs exist, CLAUDE.md and contexts dir created. | T-TASK-1 (partial) | PASS | No attack vector found. |
| task-operations.test.ts:Test-2.1-claude-md-content | Asserts exit 0, task CLAUDE.md has all four required sections (# Task:, ## Focus, ## Key Areas, ## Guidelines), and "oauth" appears under ## Focus specifically. | T-TASK-1 | PASS | No attack vector found; section-anchored check prevents generic content from passing. |
| task-operations.test.ts:Test-2.1-import-directive | Asserts exit 0, .claude/CLAUDE.md contains @import matching oauth-refactor/CLAUDE.md. | T-TASK-1 (structural proxy for T-CLMD-2) | PASS | No attack vector found. |
| task-operations.test.ts:Test-2.1-confirm-complete | Redundant structural check: asserts exit 0 and # Task: / ## Focus sections exist. | T-TASK-1 | PASS | Duplicate of Test-2.1-claude-md-content; no additional coverage. |
| task-operations.test.ts:Test-2.2-reject-spaces | Asserts exit non-zero, output matches invalid name pattern, task dir does not exist. | T-TASK-2 | PASS | No attack vector found. |
| task-operations.test.ts:Test-2.2-reject-uppercase | Asserts exit non-zero, neither 'OAuthRefactor' nor 'oauthrefactor' dir created. | T-TASK-2 | PASS | No attack vector found. |
| task-operations.test.ts:Test-2.2-reject-special | Asserts exit non-zero, dir with special chars not created. | T-TASK-2 | PASS | No attack vector found. |
| task-operations.test.ts:Test-2.2-no-dir-invalid | Asserts exit non-zero, no dir for 'OAuth Refactor' or 'oauth refactor'. | T-TASK-2 | PASS | No attack vector found. |
| task-operations.test.ts:Test-2.3-multiline-desc | Asserts exit 0, all three keywords (oauth, session, token) appear under ## Focus section specifically. | T-TASK-3 | PASS | No attack vector found; section-anchored check is sound. |
| task-operations.test.ts:T-TASK-4-empty-desc | Asserts exit non-zero and task dir does not exist for empty description. | T-TASK-4 | PASS | No attack vector found. |
| task-operations.test.ts:Test-3.1-list-personal | Asserts exit 0, 'my-progress' in output, 'personal' section present, 'golden' NOT present. | F-TASK-SWITCH (no AC) | PASS | No DoD clause exists for F-TASK-SWITCH. Test is sound but covers unanchored behavior. |
| task-operations.test.ts:Test-3.2-list-golden | Asserts exit 0, 'oauth-deep-dive' in output, 'golden' present, 'personal' NOT present. | F-TASK-SWITCH (no AC) | PASS | No DoD clause exists for F-TASK-SWITCH. Test is sound but covers unanchored behavior. |
| task-operations.test.ts:T-SWITCH-3-list-both | Asserts all three context names present, section labels present, personal-1 index < golden-1 index. | T-SWITCH-3 (no PRD AC) | PASS | T-SWITCH-3 has no PRD Acceptance Criteria definition. Test logic is sound but DoD attribution is invalid. |
| task-operations.test.ts:Test-3.3-personal-before-golden | Asserts personal-1 appears before golden-1 by index comparison. | T-LIST-1 (ordering) | PASS | No attack vector found. |
| task-operations.test.ts:T-SWITCH-2-no-contexts | Asserts exit 0 and output matches /no contexts\|fresh/i. | T-SWITCH-2 (no PRD AC) | PASS | T-SWITCH-2 has no PRD Acceptance Criteria definition. Test logic is sound but DoD attribution is invalid. |
| task-operations.test.ts:Test-3.4-switch-empty-allows | Asserts update-import exits 0 for task with no contexts. | F-TASK-SWITCH (no AC) | PASS | Only checks exit code. No DoD clause. |
| task-operations.test.ts:Test-3.5-switch-default | Asserts exit 0, @import specifically resolves to default/CLAUDE.md. | F-TASK-SWITCH (no AC) | PASS | No DoD clause. Sound assertion. |
| task-operations.test.ts:Test-3.5-vanilla-mode | Asserts output matches /vanilla\|restored/. | F-TASK-SWITCH (no AC) | ESCALATE | No DoD clause. Pattern /vanilla\|restored/ is satisfied by any hardcoded output containing those words regardless of whether the switch actually occurred or imported correctly. Needs DoD clause to anchor. |
| task-operations.test.ts:Test-3.6-multiple-switches | Asserts after each of four update-import calls: exit 0, file exists, correct task name in content, prior task name absent. | T-CLMD-2 | PASS | No attack vector found. |
| task-operations.test.ts:T-SWITCH-1-single-import | After four switches through tasks a/b/c/a, asserts exactly one @import line each time pointing to the correct task. | T-SWITCH-1 (no PRD AC) | PASS | T-SWITCH-1 has no PRD Acceptance Criteria definition. Test logic is sound but DoD attribution is invalid. |
| context-operations.test.ts:T-CTX-1-personal-path | Asserts exit 0, file at exact personal storage path, isValidJsonl. | T-CTX-1 | PASS | No attack vector found. |
| context-operations.test.ts:T-CTX-2-valid-jsonl | Asserts exit 0, file exists, isValidJsonl, non-empty. | T-CTX-2 | PASS | No attack vector found. |
| context-operations.test.ts:Test-4.1-not-to-golden-dir | Asserts personal file exists; asserts golden-path file does not exist. | T-CTX-1 | PASS | No attack vector found. |
| context-operations.test.ts:Test-4.2-save-golden-dir | Asserts exit 0, file at project .claude/ golden path, isValidJsonl. | T-CTX-2 (golden variant) | PASS | No attack vector found. |
| context-operations.test.ts:Test-4.2-scan-mention | Uses CLEAN_CONTEXT; asserts output contains 'scan' or 'secret'. | T-CTX-3 (weak proxy) | ESCALATE | An implementation that prints "Scanning for secrets..." before unconditionally proceeding would pass regardless of whether it actually scans. The golden-path blocking tests (below) provide stronger coverage, but this test is independently vacuous for a stub that announces scanning without performing it. |
| context-operations.test.ts:Test-4.2-block-stripe | Uses STRIPE_KEY_CONTEXT; asserts exit non-zero, output matches /stripe\|sk_live/, golden file does not exist. | T-CTX-3 | PASS | No attack vector found; file-existence check is the DoD enforcer. |
| context-operations.test.ts:Test-4.2-block-github | Uses GITHUB_TOKEN_CONTEXT; asserts exit non-zero, output matches /github\|ghp_/, golden file does not exist. | T-CTX-3 | PASS | No attack vector found. |
| context-operations.test.ts:T-CTX-3-aws | Uses AWS_KEY_CONTEXT; asserts exit non-zero, output matches /aws\|akia/, golden file does not exist. | T-CTX-3 | PASS | No attack vector found. |
| context-operations.test.ts:Test-4.3-invalid-name | Asserts exit non-zero, error output matches invalid name pattern, file not created. | F-CTX-SAVE (name validation) | PASS | No attack vector found. |
| context-operations.test.ts:Test-4.5-empty-context | Asserts exit non-zero, no Node.js stack trace in stderr. | T-CTX-4 (partial) | PASS | No attack vector found. |
| context-operations.test.ts:T-CTX-4-golden-size-cap | Pre-asserts file exceeds 100KB; asserts exit non-zero, output matches /100KB\|too large/i, golden file does not exist. | T-CTX-4 | PASS | No attack vector found; file-size pre-assertion prevents fixture failure. |
| context-operations.test.ts:T-CTX-6-overwrite | Saves twice; asserts backup file exists with .backup- in name; asserts backup content equals original. | T-CTX-6 | PASS | No attack vector found. |
| context-operations.test.ts:T-LIST-1-list-all | Asserts exit 0, ctx-1 and ctx-2 in output, 'personal' present, 'golden' absent (no golden in setup). | T-LIST-1 | PASS | No attack vector found. |
| context-operations.test.ts:T-LIST-2-message-counts | Asserts output matches \b5\b and \b30\b. | T-LIST-2 | ESCALATE | Word-boundary regex is not anchored to a specific context name. An output containing "5 errors" or "5KB" alongside context listing would trivially satisfy \b5\b. The test does not verify that 5 appears adjacent to ctx-1 or 30 adjacent to ctx-2. A compliant implementation that outputs wrong per-context counts but includes the digits elsewhere passes. |
| context-operations.test.ts:T-LIST-3-no-contexts | Asserts exit 0, output matches /\bfresh\b\|\bempty\b\|\bno contexts\b/i. | T-LIST-3 | PASS | No attack vector found; word boundaries and specific phrase list are adequate. |
| context-operations.test.ts:T-LIST-1-ordering | Asserts personal-ctx index < golden-ctx index in output. | T-LIST-1 | PASS | No attack vector found. |
| context-operations.test.ts:Test-5.5-nonexistent-task | Asserts exit non-zero, output matches /not found\|does not exist/i. | F-CTX-LIST (error behavior) | PASS | No attack vector found. |
| context-operations.test.ts:T-LIST-4-summary-display | Finds line with 'summary-ctx'; asserts text after context name is non-empty; asserts it matches /[a-zA-Z]{4,}/. | T-LIST-4 | FAIL | The DoD clause requires "a non-empty description string after each context name, not just metadata." The test comment explicitly accepts "msgs", "just" (4-char metadata tokens) as passing values. An implementation outputting `summary-ctx  5 msgs just now` satisfies /[a-zA-Z]{4,}/ via "msgs" and "just" — both pure metadata — while producing no AI-generated summary. The test directly contradicts the DoD's "not just metadata" qualifier. Additionally, the test checks only one context line, not "each context name" as the DoD requires. |
| context-operations.test.ts:Test-6.1-manage-no-contexts | Asserts exit 0, output matches /\bno contexts\b\|\bempty\b/i. | F-CTX-MANAGE (no specific AC) | PASS | No DoD clause for this behavior. Test logic sound. |
| context-operations.test.ts:Test-6.6-golden-indicator | Asserts stderr contains 'golden-ctx'; finds line; asserts ⭐ or 'golden' label on same line after removing context name. | F-CTX-MANAGE (no specific AC) | PASS | No attack vector found; name-removal prevents false match on 'golden-ctx' itself. |
| context-operations.test.ts:T-CTX-7-golden-protection | Asserts golden file exists before attempt; calls delete-context without --confirm; asserts exit non-zero; asserts file still exists. | T-CTX-7 | PASS | No attack vector found. |
| context-operations.test.ts:T-PROM-1-promote-clean | Asserts exit 0, golden file exists, personal file exists, golden content equals personal content. | T-PROM-1 | PASS | No attack vector found; byte-equality check is sound. |
| context-operations.test.ts:Test-7.1-copy-to-golden | Asserts golden exists, isValidJsonl, personal still exists. | T-PROM-1 | PASS | No attack vector found. |
| context-operations.test.ts:Test-7.1-preserve-original | Captures content before promote; asserts personal content unchanged after. | T-PROM-1 | PASS | No attack vector found. |
| context-operations.test.ts:T-CTX-5-promote-size | Creates >100KB personal context; asserts exit non-zero, output matches /100kb\|too large/i, golden file does not exist. | T-CTX-5 | PASS | No attack vector found. |
| context-operations.test.ts:T-PROM-2-github-token | Uses GITHUB_TOKEN_CONTEXT; asserts exit non-zero, output matches /github\|ghp_/i. | T-PROM-2 | PASS | No attack vector found. |
| context-operations.test.ts:Test-7.3-redaction-offer | Runs scan-secrets on stripe context; asserts exit non-zero, output matches /stripe\|sk_/i. | T-PROM-2 (proximate) | PASS | No attack vector found. |
| context-operations.test.ts:Test-7.4-nonexistent-context | Asserts exit non-zero, output matches /not found\|does not exist/i. | F-CTX-PROMOTE (error behavior) | PASS | No attack vector found. |
| context-operations.test.ts:T-PROM-3-already-golden | beforeEach creates BOTH personal AND golden; asserts exit non-zero, output matches /already.*golden\|already exists/i. | T-PROM-3 | FAIL | Violates test contract T3 (No Self-Fulfilling Setup). The test creates the golden copy directly in beforeEach — the very artifact whose existence should trigger the error. The DoD clause "setup must create personal context only" is explicitly violated. A compliant test must reach the "already exists" state by calling promote-context once, then call it again; instead the golden artifact is planted, allowing an implementation that checks for file existence (not promotion state) to pass without enforcing any semantically meaningful invariant. |
| context-operations.test.ts:T-MEM-1-memory-update | Asserts exit 0, MEMORY.md exists at personalDir/memory/MEMORY.md, contains task-id and context-name. | T-MEM-1 | PASS | No attack vector found; both strings must appear. |
| context-operations.test.ts:T-HOOK-1-auto-save | Plants session file with SMALL_CONTEXT; pipes payload via stdin; asserts exit 0; asserts a .jsonl file exists in auto-saves/; asserts isValidJsonl. | T-HOOK-1 | FAIL | Empty JSONL is valid JSONL. An implementation that creates `auto-saves/<timestamp>.jsonl` as an empty file satisfies isValidJsonl (zero JSON objects is valid JSONL) and fileExists. The planted SMALL_CONTEXT session is never verified to appear in the saved file. The DoD requires saving the session; the test only requires an empty valid file. |
| context-operations.test.ts:T-SUM-1-summary-length | Asserts meta.json exists, summary is a string, length between 20 and 500 chars. | T-SUM-1 (no PRD AC) | PASS | T-SUM-1 has no PRD AC definition. Test logic: a hardcoded 100-char string satisfies all assertions while constituting no actual summary. However, T-SUM-2 would catch hardcoded identical summaries, so the two together provide minimal coverage. Individually this test is weak but not independently FAIL. |
| context-operations.test.ts:T-SUM-2-different-summaries | Saves two contexts from different fixtures; asserts their summaries are not equal. | T-SUM-2 (no PRD AC) | ESCALATE | T-SUM-2 has no PRD AC definition. Two summaries that differ do not prove content-derivation. An implementation using random UUIDs or timestamps as summaries satisfies `summaryAuth !== summaryDb` while producing no meaningful summary. The test cannot distinguish content-derived summaries from arbitrarily different strings. |
| git-integration.test.ts:Test-11.1-gitignore-created | Asserts .claude/.gitignore exists after init. | F-GIT | PASS | No attack vector found. |
| git-integration.test.ts:Test-11.1-gitignore-content | Asserts /^CLAUDE\.md$/m in gitignore content. | T-GIT-1 (proximate) | PASS | No attack vector found. |
| git-integration.test.ts:Test-11.2-task-tracked | Calls gitAdd on task CLAUDE.md path; asserts git status contains it. | F-GIT | PASS | No attack vector found. |
| git-integration.test.ts:Test-11.2-task-committed | Calls gitCommit; asserts no throw. | F-GIT | PASS | Weak — only checks no exception. No assertion on commit success or content. Implementation that creates uncommittable files could still pass if gitCommit catches errors. Not independently FAIL given other tests. |
| git-integration.test.ts:Test-11.3-golden-tracked | Creates golden file; gitAdd; asserts git status contains filename. | F-GIT | PASS | No attack vector found. |
| git-integration.test.ts:Test-11.3-golden-committed | gitAdd + gitCommit; asserts no throw. | F-GIT | PASS | Same weakness as Test-11.2-task-committed. |
| git-integration.test.ts:Test-11.4-personal-not-committed | Asserts personal base is outside project dir; saves context; asserts personal path outside project dir; stages everything in project; asserts 'my-work' and 'personal-ctx' not in git status. | T-GIT-2 | PASS | Structural isolation check is sound. |
| git-integration.test.ts:Test-11.5-no-git-conflicts | Two dev workspaces; each creates different task and golden context; asserts cross-isolation (each project only has its own task); asserts .claude/CLAUDE.md not in either git status. | T-GIT-2 | PASS | No attack vector found. |
| git-integration.test.ts:Test-11.6-recognize-golden | Creates golden file directly; runs context-list; asserts exit 0 and filename in output. | F-GIT | PASS | No attack vector found. |
| git-integration.test.ts:Test-11.7-not-in-status | Commits gitignore; modifies .claude/CLAUDE.md; asserts .claude/CLAUDE.md not in git status. | T-CLMD-1 (proximate) | PASS | No attack vector found. |
| git-integration.test.ts:Test-11.7-check-ignore | Commits gitignore; asserts isGitIgnored. | T-GIT-1 | PASS | No attack vector found. |
| git-integration.test.ts:T-GIT-1 | Commits .claude/.gitignore; asserts isGitIgnored(.claude/CLAUDE.md) is true. | T-GIT-1 | PASS | No attack vector found. |
| git-integration.test.ts:T-GIT-2 | Creates task; saves context via implementation; stages all project files; asserts no personal storage path or 'tgit-ctx' in git status. | T-GIT-2 | PASS | No attack vector found. |
| secret-detection.test.ts:T-SEC-2-aws-key | Asserts exit non-zero, output matches /akia/i. | T-SEC-2 | PASS | No attack vector found; AKIA prefix is specific to AWS access keys. |
| secret-detection.test.ts:Test-9.1-aws-secret-key | Asserts exit non-zero, output matches /aws.*key\|secret.*key\|akia/i. | T-SEC-2 | PASS | No attack vector found. |
| secret-detection.test.ts:T-SEC-3-live-key | Asserts exit non-zero, output matches /sk_live/i. | T-SEC-3 | PASS | No attack vector found. |
| secret-detection.test.ts:T-SEC-3-both-keys | Asserts exit non-zero, output contains 'sk_test_' and 'sk_live_' literally. | T-SEC-3 | PASS | No attack vector found; requires both prefixes in output. |
| secret-detection.test.ts:Test-9.3-github-pat | Asserts exit non-zero, output matches /ghp_/i. | T-SEC (F-SEC general) | PASS | No attack vector found. |
| secret-detection.test.ts:Test-9.4-rsa-private | Asserts exit non-zero, output matches /rsa.*private\|private.*key\|BEGIN.*PRIVATE/i. | F-SEC | PASS | No attack vector found. |
| secret-detection.test.ts:Test-9.5-password | Asserts exit non-zero, output matches /password/i. | F-SEC | PASS | No attack vector found. |
| secret-detection.test.ts:T-SEC-5-example-key | Creates context with ONLY AKIAIOSFODNN7EXAMPLE; asserts exit non-zero, output matches /akia/i. | T-SEC-5 | PASS | No attack vector found; isolated fixture ensures this specific string is what's detected. |
| secret-detection.test.ts:T-SEC-7-count-five | Asserts exit non-zero; asserts output matches /\b5\b.*secret\|secret.*\b5\b\|found\s+5\s+\|5\s+secrets?\s+found/i. | T-SEC-7 | ESCALATE | The alternative `found\s+5\s+` matches any phrase "found 5 <anything>" including "found 5 warnings" or "found 5 issues". An implementation that reports 3 secrets and 2 warnings as "found 5 issues" would satisfy this branch. The DoD requires the count to be specifically a secret count. Additionally, this test relies on MULTIPLE_SECRETS_CONTEXT having exactly 5 secrets — if the fixture count changes, the test provides false assurance. |
| secret-detection.test.ts:T-SEC-4-all-types | Creates context with one secret per message type (user/assistant/tool_result); asserts all three patterns appear in output. | T-SEC-4 | PASS | No attack vector found. |
| secret-detection.test.ts:T-SEC-6-rescan-clean | Redacts context; asserts exit 0, file exists, isValidJsonl; asserts rescan exits 0 and output matches /clean/i. | T-SEC-6 | PASS | No attack vector found. |
| secret-detection.test.ts:Test-9.9-redact-mask | Asserts redacted file exists, isValidJsonl, non-empty, original secret string absent, redaction marker present. | T-SEC-6 | PASS | No attack vector found. |
| secret-detection.test.ts:Test-clean-detection | Asserts exit 0, output matches /clean/i for CLEAN_CONTEXT. | F-SEC | PASS | No attack vector found. |
| error-handling.test.ts:T-ERR-1 | Runs task-create without init; asserts exit non-zero, output matches /init\|not initialized/i, no stack trace. | T-ERR-1 | PASS | No attack vector found. |
| error-handling.test.ts:Test-13.1-suggest-init | Runs update-import without init; asserts exit non-zero, output matches /init/i. | T-ERR-1 | PASS | No attack vector found. |
| error-handling.test.ts:Test-13.2-missing-claude-dir | Creates task then deletes .claude/; asserts task-list exits non-zero with init message. | T-ERR-1 | PASS | No attack vector found. |
| error-handling.test.ts:T-ERR-2 | Creates file with malformed JSON; runs scan-secrets; asserts exit non-zero, no stack trace, output matches /invalid\|corrupt\|malformed\|parse.*error\|json/i. | T-ERR-2 | PASS | No attack vector found. |
| error-handling.test.ts:Test-13.3-no-crash-invalid-json | Creates file with incomplete JSON; asserts exit non-zero, no stack trace. | T-ERR-2 | PASS | No attack vector found. |
| error-handling.test.ts:Test-13.5-invalid-metadata | Creates valid JSONL with invalid .meta.json; asserts context-list exits 0, no stack trace. | F-ERR | PASS | No attack vector found. |
| error-handling.test.ts:Test-13.6-permission | Makes tasks dir read-only; asserts exit non-zero with permission message; skips if root. | F-ERR | PASS | No attack vector found; skip-if-root is acceptable. |
| error-handling.test.ts:Test-validate-task-ids | Loops six invalid IDs; asserts each exits non-zero with specific error pattern. | T-TASK-2 | PASS | No attack vector found. |
| error-handling.test.ts:Test-validate-context-names | Loops three invalid names; asserts each exits non-zero with specific error pattern. | F-CTX-SAVE (name validation) | PASS | No attack vector found. |
| error-handling.test.ts:Test-nonexistent-task-error | Asserts exit non-zero, output matches /not found\|does not exist/i. | F-CTX-LIST | PASS | No attack vector found. |
| error-handling.test.ts:Test-nonexistent-context-error | Asserts exit non-zero, output matches /not found\|does not exist/i. | F-CTX-PROMOTE | PASS | No attack vector found. |
| error-handling.test.ts:T-ERR-3 | Init, task-create, and update-import all run in path with a space; asserts each exits 0 and creates expected file. | T-ERR-3 | PASS | No attack vector found. |
| error-handling.test.ts:Test-12.6-line-endings-jsonl | Creates session, saves context, reads all .jsonl files in contexts dir, asserts no \r\n. | F-XPLAT | PASS | No attack vector found. |
| error-handling.test.ts:Test-12.7-line-endings-generated | Asserts .gitignore and task CLAUDE.md do not contain \r\n. | F-XPLAT | PASS | No attack vector found. |
| claude-md-system.test.ts:Test-8.1-no-modify-init | Asserts root CLAUDE.md equals originalContent after init. | T-CLMD-1 | PASS | No attack vector found. |
| claude-md-system.test.ts:Test-8.1-no-modify-create | Asserts root CLAUDE.md unchanged after two task creations. | T-CLMD-1 | PASS | No attack vector found. |
| claude-md-system.test.ts:Test-8.1-no-modify-switch | Asserts root CLAUDE.md unchanged after multiple switches including back to default. | T-CLMD-1 | PASS | No attack vector found. |
| claude-md-system.test.ts:Test-8.1-no-git-changes | Asserts no git status line ends with 'CLAUDE.md' outside .claude/. | T-CLMD-1 | PASS | No attack vector found. |
| claude-md-system.test.ts:Test-8.2-created | Asserts .claude/CLAUDE.md exists after init. | T-CLMD-2 | PASS | No attack vector found. |
| claude-md-system.test.ts:Test-8.2-import-present | Asserts .claude/CLAUDE.md contains @import. | T-CLMD-2 | PASS | No attack vector found. |
| claude-md-system.test.ts:Test-8.2-update-switch | Asserts exit 0, .claude/CLAUDE.md contains @import pointing to task-1. | T-CLMD-2 | PASS | No attack vector found. |
| claude-md-system.test.ts:Test-8.2-one-import | After two switches, asserts exactly one @import line, pointing to task-2, not task-1. | T-CLMD-2 | PASS | No attack vector found. |
| claude-md-system.test.ts:Test-8.3-gitignore-content | Asserts .gitignore has CLAUDE.md entry. | T-GIT-1 (proximate) | PASS | No attack vector found. |
| claude-md-system.test.ts:Test-8.3-git-ignored | Asserts isGitIgnored. | T-GIT-1 | PASS | No attack vector found. |
| claude-md-system.test.ts:Test-8.3-not-in-status | Commits gitignore; modifies file; asserts .claude/CLAUDE.md not staged. | T-CLMD-1 / T-GIT-1 | PASS | No attack vector found. |
| claude-md-system.test.ts:Test-8.4-switch-auth | Asserts @import points to auth, not payment. | T-CLMD-2 | PASS | No attack vector found. |
| claude-md-system.test.ts:Test-8.4-switch-payment | Asserts @import points to payment, not auth. | T-CLMD-2 | PASS | No attack vector found. |
| claude-md-system.test.ts:Test-8.4-switch-default | After switching to auth, switches to default; asserts @import points to default. | T-CLMD-2 | PASS | No attack vector found. |
| claude-md-system.test.ts:T-CLMD-2-resume-proxy | Asserts .claude/CLAUDE.md @import contains 'oauth-work'; asserts referenced CLAUDE.md exists on disk. | T-CLMD-2 | PASS | Verifies the structural proxy only (file path correct). Cannot verify that /resume actually reads it — as documented. No attack vector for the structural claim. |
| claude-md-system.test.ts:Test-8.6-multi-dev | Two dev workspaces switch to different tasks; asserts each .claude/CLAUDE.md contains its own task name; asserts they differ; asserts root CLAUDE.md identical. | T-CLMD-1 / T-CLMD-2 | PASS | No attack vector found. |
| new-features.test.ts:T-CTX-5-dup | Duplicate of context-operations.test.ts T-CTX-5. Identical assertions. | T-CTX-5 | PASS | Duplicate coverage; no additional adversarial value. |
| new-features.test.ts:T-CTX-6-dup | Duplicate of context-operations.test.ts T-CTX-6. Identical assertions. | T-CTX-6 | PASS | Duplicate coverage; no additional adversarial value. |
| new-features.test.ts:T-HOOK-1-dup | Plants session file; pipes stdin payload; asserts exit 0; asserts auto-saves/ has a .jsonl file; asserts isValidJsonl. | T-HOOK-1 | FAIL | Same attack vector as context-operations.test.ts:T-HOOK-1-auto-save. An implementation creating an empty auto-saves/timestamp.jsonl passes. Content from the planted session is never verified to appear in the output file. |
| new-features.test.ts:T-MEM-1-dup | waitFor up to 5s for MEMORY.md; asserts contains task-id and context-name. | T-MEM-1 | PASS | Duplicate of context-operations version with async handling. No additional attack vector. |

---

## Section 2 — DoD Coverage Gaps

### T-INIT-1 — `init-project` creates `.claude/CLAUDE.md` with @import line

Tests: initialization.test.ts:Test-1.1-create-structure, Test-1.2-import-directive

Coverage: ADEQUATE

### T-INIT-2 — `init-project` copies root CLAUDE.md byte-for-byte to stash; backup must not exist before script

Tests: initialization.test.ts:Test-1.2-create-backup

Coverage: ADEQUATE

### T-INIT-3 — `.claude/tasks/default/CLAUDE.md` content equals root CLAUDE.md character-for-character

Tests: initialization.test.ts:Test-1.2-default-task-copy

Coverage: ADEQUATE

### T-INIT-4 — Running `init-project` twice exits 0 both times with identical file contents

Tests: initialization.test.ts:Test-1.3-both-succeed, Test-1.3-no-dup-dirs, Test-1.3-already-initialized, Test-1.3-no-dup-stash

Coverage: ADEQUATE

### T-INIT-5 — Writing to project A's personal dir does not make it visible in project B's personal dir

Tests: initialization.test.ts:Test-1.5-multi-project

Coverage: ADEQUATE

### T-TASK-1 — `task-create` produces CLAUDE.md with all required sections

Tests: task-operations.test.ts:Test-2.1-create-structure, Test-2.1-claude-md-content, Test-2.1-import-directive, Test-2.1-confirm-complete

Coverage: ADEQUATE

### T-TASK-2 — `task-create` with uppercase name exits non-zero AND creates no task directory

Tests: task-operations.test.ts:Test-2.2-reject-spaces, Test-2.2-reject-uppercase, Test-2.2-reject-special, Test-2.2-no-dir-invalid; error-handling.test.ts:Test-validate-task-ids

Coverage: ADEQUATE

### T-TASK-3 — `task-create` with multi-line description preserves all lines in Focus section

Tests: task-operations.test.ts:Test-2.3-multiline-desc

Coverage: ADEQUATE

### T-TASK-4 — `task-create` with empty description exits non-zero and creates no task directory

Tests: task-operations.test.ts:T-TASK-4-empty-desc

Coverage: ADEQUATE

### F-TASK-SWITCH — NO DOD DEFINED — STRICT FAIL

Tests exist that probe switch behavior (T-SWITCH-1, T-SWITCH-2, T-SWITCH-3, ordering tests), but these test IDs are self-defined by the test authors with no PRD Acceptance Criteria table. Coverage cannot be evaluated: there is no DoD to cover.

Coverage: CLAUSE: F-TASK-SWITCH — NO DOD DEFINED — STRICT FAIL

### T-CTX-1 — `save-context --personal` creates file at exact personal path

Tests: context-operations.test.ts:T-CTX-1-personal-path, Test-4.1-not-to-golden-dir

Coverage: ADEQUATE

### T-CTX-2 — Saved context parses as valid JSONL; assertion unconditional

Tests: context-operations.test.ts:T-CTX-2-valid-jsonl, Test-4.2-save-golden-dir

Coverage: ADEQUATE

### T-CTX-3 — `save-context --golden` on session with real secret exits non-zero with no file created

Tests: context-operations.test.ts:Test-4.2-block-stripe, Test-4.2-block-github, T-CTX-3-aws

Coverage: ADEQUATE — three distinct secret types tested, all verify file non-existence.

### T-CTX-4 — `save-context --golden` on 150KB session exits non-zero with "100KB" or "too large" in output

Tests: context-operations.test.ts:T-CTX-4-golden-size-cap

Coverage: ADEQUATE

### T-CTX-5 — `promote-context` on 150KB personal context exits non-zero with "100KB" or "too large"

Tests: context-operations.test.ts:T-CTX-5-promote-size, new-features.test.ts:T-CTX-5-dup

Coverage: ADEQUATE (duplicate tests)

### T-CTX-6 — `save-context` twice with same name creates a `.backup-` file containing original content

Tests: context-operations.test.ts:T-CTX-6-overwrite, new-features.test.ts:T-CTX-6-dup

Coverage: ADEQUATE (duplicate tests)

### T-CTX-7 — `delete-context` on a golden context exits non-zero without `--confirm`; file still exists

Tests: context-operations.test.ts:T-CTX-7-golden-protection

Coverage: ADEQUATE

### T-LIST-1 — `context-list` output: personal contexts appear before golden; specific context names appear

Tests: context-operations.test.ts:T-LIST-1-list-all, T-LIST-1-ordering; task-operations.test.ts:T-SWITCH-3-list-both, Test-3.3-personal-before-golden

Coverage: ADEQUATE for ordering. Gap: T-LIST-1-list-all does not test the mixed-type case because it uses personal-only setup; however T-LIST-1-ordering covers the mixed case.

### T-LIST-2 — `context-list` shows exact message count matching `\b<N>\b`

Tests: context-operations.test.ts:T-LIST-2-message-counts

Coverage: INADEQUATE — The test uses `\b5\b` and `\b30\b` across the entire output, not anchored to specific context names. A count appearing in unrelated output (file sizes, error codes, timestamps) would satisfy the assertion. The DoD's word-boundary requirement is met but the test does not enforce that the count is adjacent to the named context.

### T-LIST-3 — When no contexts exist, output contains "fresh", "empty", or "no contexts"

Tests: context-operations.test.ts:T-LIST-3-no-contexts

Coverage: ADEQUATE

### T-LIST-4 — `context-list` shows a non-empty description string after each context name, not just metadata

Tests: context-operations.test.ts:T-LIST-4-summary-display

Coverage: INADEQUATE — Test accepts words matching /[a-zA-Z]{4,}/ including metadata tokens "msgs" and "just" that the DoD explicitly disallows. Test also only checks one context, not "each context name." The test fails to distinguish metadata from AI-generated description.

### T-PROM-1 — After `promote-context`, both personal original and golden copy exist; byte-for-byte identical

Tests: context-operations.test.ts:T-PROM-1-promote-clean, Test-7.1-copy-to-golden, Test-7.1-preserve-original

Coverage: ADEQUATE

### T-PROM-2 — `promote-context` on context with `ghp_` + 36 alphanumeric chars: output names specific secret type

Tests: context-operations.test.ts:T-PROM-2-github-token

Coverage: ADEQUATE

### T-PROM-3 — `promote-context` when golden already exists exits non-zero or warns; setup creates personal context only

Tests: context-operations.test.ts:T-PROM-3-already-golden

Coverage: INADEQUATE — Test violates T3 (No Self-Fulfilling Setup). The beforeEach creates the golden artifact that the test then checks triggers an error. The DoD requires "setup creates personal context only." A compliant implementation that merely checks for file existence (not whether promotion was previously called) satisfies this broken test without enforcing the semantic invariant.

### T-CLMD-1 — After any task operation, root CLAUDE.md content equals pre-operation content

Tests: claude-md-system.test.ts:Test-8.1-no-modify-init, Test-8.1-no-modify-create, Test-8.1-no-modify-switch, Test-8.1-no-git-changes; initialization.test.ts:Test-1.2-no-modify-root

Coverage: ADEQUATE

### T-CLMD-2 — After two task switches, `.claude/CLAUDE.md` contains exactly one `@import` line

Tests: claude-md-system.test.ts:Test-8.2-one-import, Test-8.2-update-switch, T-CLMD-2-resume-proxy; task-operations.test.ts:T-SWITCH-1-single-import

Coverage: ADEQUATE for import count. Gap: T-CLMD-2-resume-proxy verifies path is correct but cannot test that /resume reads it (documented as manual-only).

### T-RESUME-MANUAL — MANUAL: After `/task <id>` + `/resume <session>`, Claude's response references task CLAUDE.md content

Tests: None (manual only)

Coverage: MISSING — By design; automated proxy is T-CLMD-2.

### T-SEC-2 — `scan-secrets` on file with `AKIA` + 16 uppercase alphanumeric chars exits non-zero; output contains "AWS" or "AKIA"

Tests: secret-detection.test.ts:T-SEC-2-aws-key, Test-9.1-aws-secret-key

Coverage: ADEQUATE

### T-SEC-3 — `scan-secrets` detects both `sk_test_` and `sk_live_`; output names specific key type

Tests: secret-detection.test.ts:T-SEC-3-live-key, T-SEC-3-both-keys

Coverage: ADEQUATE — both-keys test requires exact prefixes in output.

### T-SEC-4 — Context with one secret each in user, assistant, tool_result: all three reported

Tests: secret-detection.test.ts:T-SEC-4-all-types

Coverage: ADEQUATE

### T-SEC-5 — `AKIAIOSFODNN7EXAMPLE` is treated as a true positive

Tests: secret-detection.test.ts:T-SEC-5-example-key

Coverage: ADEQUATE — isolated fixture contains only this string.

### T-SEC-6 — After `redact-secrets`, every line parses as JSON; second `scan-secrets` returns "clean"

Tests: secret-detection.test.ts:T-SEC-6-rescan-clean, Test-9.9-redact-mask

Coverage: ADEQUATE

### T-SEC-7 — `scan-secrets` on context with exactly 5 secrets reports count matching `\b5\b`

Tests: secret-detection.test.ts:T-SEC-7-count-five

Coverage: INADEQUATE — The regex alternative `found\s+5\s+` is not anchored to "secrets" and would match "found 5 warnings." A wrong count adjacent to a different noun passes.

### T-GIT-1 — `git check-ignore .claude/CLAUDE.md` exits 0 after init in real git repo

Tests: git-integration.test.ts:T-GIT-1, Test-11.7-check-ignore; claude-md-system.test.ts:Test-8.3-git-ignored

Coverage: ADEQUATE

### T-GIT-2 — After full workflow, `git status --porcelain` does not list any personal storage path

Tests: git-integration.test.ts:T-GIT-2, Test-11.4-personal-not-committed, Test-11.5-no-git-conflicts

Coverage: ADEQUATE

### T-ERR-1 — Any script without init exits non-zero with "initialized" or "init" in output; not a stack trace

Tests: error-handling.test.ts:T-ERR-1, Test-13.1-suggest-init, Test-13.2-missing-claude-dir

Coverage: ADEQUATE

### T-ERR-2 — `scan-secrets` on malformed JSONL exits non-zero

Tests: error-handling.test.ts:T-ERR-2, Test-13.3-no-crash-invalid-json

Coverage: ADEQUATE

### T-ERR-3 — All operations work when project path contains a space; exitCode === 0 AND output file existence

Tests: error-handling.test.ts:T-ERR-3

Coverage: ADEQUATE

### T-HOOK-1 — `auto-save-context` with mock stdin payload creates timestamped `.jsonl` file in flat `auto-saves/` directory

Tests: context-operations.test.ts:T-HOOK-1-auto-save, new-features.test.ts:T-HOOK-1-dup

Coverage: INADEQUATE — Both tests verify file existence and valid JSONL only. An empty .jsonl file is valid JSONL and satisfies all assertions. The planted session content is never verified to appear in the output. The DoD requires saving the session; no test enforces that the file contains session data.

### T-MEM-1 — After `save-context`, MEMORY.md contains task-id and context-name

Tests: context-operations.test.ts:T-MEM-1-memory-update, new-features.test.ts:T-MEM-1-dup

Coverage: ADEQUATE — both strings must appear. No structural format verified beyond presence.

### F-SUMMARY — NO DOD DEFINED — STRICT FAIL

T-SUM-1 and T-SUM-2 are referenced in test code but appear in no PRD Acceptance Criteria table. F-SUMMARY has no AC table. These are self-defined test identifiers without PRD authority.

Coverage: CLAUSE: F-SUMMARY — NO DOD DEFINED — STRICT FAIL

### F-CTX-MANAGE — Interactive cleanup, dry-run previews, stale/duplicate detection, merge, archive operations

Only AC defined: T-CTX-7 (golden deletion protection). All other Expected Behaviors for F-CTX-MANAGE have no DoD clause:
- Interactive cleanup flow
- Stale context identification
- Duplicate context identification  
- Dry-run preview before deletion
- Merge operation
- Archive operation
- Recommendation presentation

Coverage: MISSING for all behaviors except T-CTX-7.
