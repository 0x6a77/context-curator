# Adversarial Test Inventory

## DoD / PRD Audit

### PRD Sections Missing Acceptance Criteria

All PRD feature sections now have Acceptance Criteria tables. No missing AC sections.

Note: F-CTX-MANAGE has T-CTX-7 defined but remaining behaviors (interactive cleanup, dry-run, merge, archive) have no AC clauses — tracked separately in Section 2.

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
| task-operations.test.ts:Test-3.1-list-personal | Asserts exit 0, 'my-progress' in output, 'personal' section present, 'golden' NOT present. | T-SWITCH-3 (partial) | PASS | No attack vector found. |
| task-operations.test.ts:Test-3.2-list-golden | Asserts exit 0, 'oauth-deep-dive' in output, 'golden' present, 'personal' NOT present. | T-SWITCH-3 (partial) | PASS | No attack vector found. |
| task-operations.test.ts:T-SWITCH-3-list-both | Asserts all three context names present, section labels present, personal-1 index < golden-1 index. | T-SWITCH-3 | PASS | No attack vector found. |
| task-operations.test.ts:Test-3.3-personal-before-golden | Asserts personal-1 appears before golden-1 by index comparison. | T-LIST-1 (ordering) | PASS | No attack vector found. |
| task-operations.test.ts:T-SWITCH-2-no-contexts | Asserts exit 0 and output matches /no contexts\|fresh/i. | T-SWITCH-2 | PASS | No attack vector found. |
| task-operations.test.ts:Test-3.4-switch-empty-allows | Asserts update-import exits 0 for task with no contexts. | T-SWITCH-2 (partial) | PASS | No attack vector found. |
| task-operations.test.ts:Test-3.5-switch-default | Asserts exit 0, @import specifically resolves to default/CLAUDE.md. | T-SWITCH-6 (partial) | PASS | No attack vector found. |
| task-operations.test.ts:T-SWITCH-6-vanilla-mode | Asserts exit 0, output matches /vanilla\|restored/, AND @import points to default/CLAUDE.md. | T-SWITCH-6 | PASS | Both the text claim and the @import content are checked; a hardcoded string satisfying the text without actually switching would fail the @import assertion. No attack vector found. |
| task-operations.test.ts:Test-3.6-multiple-switches | Asserts after each of four update-import calls: exit 0, file exists, correct task name in content, prior task name absent. | T-CLMD-2 | PASS | No attack vector found. |
| task-operations.test.ts:T-SWITCH-1-single-import | After four switches through tasks a/b/c/a, asserts exactly one @import line each time pointing to the correct task. | T-SWITCH-1 | PASS | No attack vector found. |
| task-operations.test.ts:T-SWITCH-4-json-empty-contexts | Plants two UUID session files; runs context-list --json; asserts sessions.length > 0 and contexts equals []. | T-SWITCH-4 | PASS | No attack vector found; sessions and contexts are checked independently and the empty-array assertion is strict. |
| task-operations.test.ts:T-SWITCH-5-no-uuid-in-ctx-output | Plants UUID sessions; runs context-list (human-readable); asserts Sessions section IS present; asserts no "Personal contexts"/"Golden contexts" sections appear; asserts no numbered UUID pattern (e.g. "1. aaaabbbb-...") in output. | T-SWITCH-5 | PASS | No attack vector found; Sessions section presence confirms script ran; absence of named-context section headers and numbered UUID pattern confirm sessions are not presented as selectable contexts. |
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
| context-operations.test.ts:T-LIST-2-message-counts | Finds line containing ctx-1; asserts \b5\b appears on that line; finds line containing ctx-2; asserts \b30\b appears on that line. | T-LIST-2 | PASS | Count assertion is anchored to the specific context name line. An implementation producing wrong counts adjacent to the context name would fail. No attack vector found. |
| context-operations.test.ts:T-LIST-3-no-contexts | Asserts exit 0, output matches /\bfresh\b\|\bempty\b\|\bno contexts\b/i. | T-LIST-3 | PASS | No attack vector found; word boundaries and specific phrase list are adequate. |
| context-operations.test.ts:T-LIST-1-ordering | Asserts personal-ctx index < golden-ctx index in output. | T-LIST-1 | PASS | No attack vector found. |
| context-operations.test.ts:Test-5.5-nonexistent-task | Asserts exit non-zero, output matches /not found\|does not exist/i. | F-CTX-LIST (error behavior) | PASS | No attack vector found. |
| context-operations.test.ts:T-LIST-4-summary-display | Uses save-context to create fixture (generating meta.json); finds line with 'summary-ctx'; asserts text after '—' separator matches /authentication\|oauth\|token\|auth/i. | T-LIST-4 | PASS | Content-specific keyword assertion prevents metadata tokens like "msgs"/"just" from satisfying the test. The save-context fixture generates a real meta.json with content-derived summary. An implementation printing only metadata would fail the keyword match. No attack vector found. |
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
| context-operations.test.ts:T-PROM-3-already-golden | beforeEach creates personal context only; calls promote-context once to create golden legitimately (first call exits 0); test calls promote-context again and asserts exit non-zero, output matches /already.*golden\|already exists/i. | T-PROM-3 | PASS | Setup uses the implementation itself to reach the golden state (no direct artifact planting). An implementation that creates golden on first call but silently no-ops on second call would fail the exit-code assertion. No attack vector found. |
| context-operations.test.ts:T-MEM-1-memory-update | Asserts exit 0, MEMORY.md exists at personalDir/memory/MEMORY.md, contains task-id and context-name. | T-MEM-1 | PASS | No attack vector found; both strings must appear. |
| context-operations.test.ts:T-HOOK-1-auto-save | Plants UUID session file at personalDir/<uuid>.jsonl with SMALL_CONTEXT; pipes stdin payload with matching session-id; asserts exit 0; asserts a .jsonl file exists in auto-saves/; asserts isValidJsonl; asserts saved content contains "authentication" from SMALL_CONTEXT. | T-HOOK-1 | PASS | Content verification prevents empty-file bypass. An implementation creating an empty auto-saves file would fail the "authentication" assertion. No attack vector found. |
| context-operations.test.ts:T-SUM-1-summary-length | Asserts meta.json exists, summary is a string, length between 20 and 500 chars. | T-SUM-1 | PASS | T-SUM-1 now defined in PRD AC. A hardcoded 100-char string satisfies length bounds, but T-SUM-2's keyword assertions would catch non-content-derived hardcoded strings. Together they provide adequate coverage. No independent attack vector. |
| context-operations.test.ts:T-SUM-2-different-summaries | Saves two contexts from different fixtures; asserts summaries are not equal; asserts summaryAuth matches /authentication\|oauth\|token\|auth/i; asserts summaryDb matches /database\|migration\|postgresql\|schema\|column\|index/i. | T-SUM-2 | PASS | Keyword assertions prove content-derivation — random UUIDs or timestamps would fail both keyword matches. Different sources produce different content-specific summaries. No attack vector found. |
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
| secret-detection.test.ts:T-SEC-7-count-five | Asserts exit non-zero; asserts output matches /\b5\b.*secrets?\|secrets?.*\b5\b\|5\s+secrets?\s+found/i. | T-SEC-7 | PASS | Removed the vacuous `found\s+5\s+` branch that could match non-secret counts. All remaining branches require "secret" adjacent to "5". An implementation reporting "found 5 warnings" would no longer satisfy any branch. No attack vector found. |
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
| new-features.test.ts:T-HOOK-1-dup | Plants UUID session file at personalDir/<uuid>.jsonl with SMALL_CONTEXT; pipes stdin payload; asserts exit 0; asserts auto-saves/ has a .jsonl file; asserts isValidJsonl; asserts saved content contains "authentication". | T-HOOK-1 | PASS | Content verification matches context-operations version. No attack vector found. Duplicate coverage. |
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

### T-SWITCH-1 — After task switches A→B→C→A, `.claude/CLAUDE.md` has exactly one `@import` pointing to selected task

Tests: task-operations.test.ts:T-SWITCH-1-single-import, Test-3.6-multiple-switches, claude-md-system.test.ts:Test-8.2-one-import

Coverage: ADEQUATE

### T-SWITCH-2 — When a task has no saved contexts, `context-list` exits 0 and output contains "no contexts" or "fresh"

Tests: task-operations.test.ts:T-SWITCH-2-no-contexts, Test-3.4-switch-empty-allows

Coverage: ADEQUATE

### T-SWITCH-3 — When task has both personal and golden contexts, all names appear with personal contexts listed before golden

Tests: task-operations.test.ts:T-SWITCH-3-list-both, Test-3.3-personal-before-golden, Test-3.1-list-personal, Test-3.2-list-golden

Coverage: ADEQUATE

### T-SWITCH-4 — `context-list --json` returns `contexts: []` when sessions exist but no named contexts saved

Tests: task-operations.test.ts:T-SWITCH-4-json-empty-contexts

Coverage: ADEQUATE

### T-SWITCH-5 — When `contexts` is empty, output does not present UUID session files under Personal or Golden contexts sections

Tests: task-operations.test.ts:T-SWITCH-5-no-uuid-in-ctx-output

Coverage: ADEQUATE

### T-SWITCH-6 — Switching to `default` task: `@import` points to `default/CLAUDE.md` AND output confirms the switch

Tests: task-operations.test.ts:T-SWITCH-6-vanilla-mode, Test-3.5-switch-default

Coverage: ADEQUATE

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

Coverage: ADEQUATE — Test finds the line containing ctx-1 and asserts \b5\b on that line; finds line containing ctx-2 and asserts \b30\b on that line. Count is anchored to the specific context name, preventing false passes from unrelated output.

### T-LIST-3 — When no contexts exist, output contains "fresh", "empty", or "no contexts"

Tests: context-operations.test.ts:T-LIST-3-no-contexts

Coverage: ADEQUATE

### T-LIST-4 — `context-list` shows a non-empty description string after each context name, not just metadata

Tests: context-operations.test.ts:T-LIST-4-summary-display

Coverage: ADEQUATE — Test uses save-context to create fixture (which generates meta.json with content-derived summary). Context-list.ts reads meta.json and appends ` — <summary>` after context name. Test asserts text after '—' matches /authentication|oauth|token|auth/i — a domain-specific keyword that cannot be produced by metadata tokens alone.

### T-PROM-1 — After `promote-context`, both personal original and golden copy exist; byte-for-byte identical

Tests: context-operations.test.ts:T-PROM-1-promote-clean, Test-7.1-copy-to-golden, Test-7.1-preserve-original

Coverage: ADEQUATE

### T-PROM-2 — `promote-context` on context with `ghp_` + 36 alphanumeric chars: output names specific secret type

Tests: context-operations.test.ts:T-PROM-2-github-token

Coverage: ADEQUATE

### T-PROM-3 — `promote-context` when golden already exists exits non-zero or warns; setup creates personal context only

Tests: context-operations.test.ts:T-PROM-3-already-golden

Coverage: ADEQUATE — beforeEach creates personal context only; first promote-context call exits 0 and creates golden legitimately; test calls promote-context again and asserts exit non-zero. No self-fulfilling setup; implementation must handle double-promotion semantically.

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

Coverage: ADEQUATE — Removed the vacuous `found\s+5\s+` branch. Remaining branches all require "secret" adjacent to "5": `/\b5\b.*secrets?|secrets?.*\b5\b|5\s+secrets?\s+found/i`. "found 5 warnings" no longer satisfies any branch.

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

Coverage: ADEQUATE — Both tests plant a real UUID session file with SMALL_CONTEXT and assert that saved file contains "authentication" from that content. Empty file bypass is prevented. Both tests are equivalent; duplicate coverage.

### T-MEM-1 — After `save-context`, MEMORY.md contains task-id and context-name

Tests: context-operations.test.ts:T-MEM-1-memory-update, new-features.test.ts:T-MEM-1-dup

Coverage: ADEQUATE — both strings must appear. No structural format verified beyond presence.

### T-SUM-1 — After save-context, `.meta.json` exists with summary string between 20 and 500 characters

Tests: context-operations.test.ts:T-SUM-1-summary-length

Coverage: ADEQUATE — T-SUM-1 is now defined in PRD AC for F-SUMMARY. Length bounds are asserted. T-SUM-2's keyword assertions prevent trivially hardcoded strings from satisfying both clauses together.

### T-SUM-2 — Two contexts from different conversations produce different summaries; each contains a keyword from the source content

Tests: context-operations.test.ts:T-SUM-2-different-summaries

Coverage: ADEQUATE — T-SUM-2 is now defined in PRD AC for F-SUMMARY. Tests assert summaryAuth matches /authentication|oauth|token|auth/i and summaryDb matches /database|migration|postgresql|schema|column|index/i. Random/timestamp summaries cannot satisfy domain-specific keyword requirements.

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
