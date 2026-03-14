# Test Inventory
**Adversarial Analysis — Context Curator**
**Run date:** 2026-03-14
**Risk Acceptances loaded:** RA-001 (ACCEPTED, expires 2026-09-12), RA-002 (ACCEPTED, expires v2.0-release)

---

## PRD Section Audit

Audit of every PRD feature section for presence and falsifiability of acceptance criteria.

| PRD Section | Has AC? | All Behaviors Have AC? | Result |
|-------------|---------|------------------------|--------|
| F-INIT | YES | YES | PASS |
| F-TASK-CREATE | YES | YES | PASS |
| F-TASK-SWITCH | YES | YES | PASS |
| F-CTX-SAVE | YES | YES | PASS |
| F-CTX-LIST | YES | YES | PASS |
| F-CTX-MANAGE | YES | YES | PASS |
| F-CTX-PROMOTE | YES | YES | PASS |
| F-CLMD | YES | YES (T-RESUME-MANUAL accepted via RA-002) | PASS |
| F-SEC | YES | YES — note: T-SEC-1 does not exist; AC table begins at T-SEC-2, consistent with no test claiming T-SEC-1 | PASS |
| F-SUMMARY | YES | YES | PASS |
| F-GIT | YES | YES | PASS |
| F-XPLAT | YES | YES | PASS |
| F-ERR | YES | YES | PASS |
| F-HOOK | YES | YES | PASS |
| F-SPEC | YES | YES | PASS |
| F-ADVERSARY | YES | YES | PASS |

---

## Section 1 — Test Inventory

| TEST_ID | DESCRIPTION | AC_CLAUSE | COVERAGE_RATIONALE | VERDICT |
|---------|-------------|-----------|-------------------|---------|
| initialization.test.ts:"should create .claude/ directory structure" | Runs init-project on a fresh project and verifies .claude/CLAUDE.md contains a valid @import pointing to tasks/default/CLAUDE.md, and that the imported file exists on disk. | T-INIT-1 | Pre-condition asserts .claude/CLAUDE.md does not exist. Post-conditions assert @import regex, path contains tasks/default/CLAUDE.md, and fileExists(importedPath). A stub creating .claude/CLAUDE.md with a dead import path would fail the fileExists check. No conditional guards. | PASS |
| initialization.test.ts:"should create backup of original CLAUDE.md" | Verifies init-project creates the stash backup with byte-for-byte identical content to root CLAUDE.md. | T-INIT-2 | Pre-condition asserts backup does not exist. Post-condition asserts backup exists and content === originalContent. CLAUDE_HOME is passed to scope the stash path correctly. The script must create the backup — setup does not. | PASS |
| initialization.test.ts:"should create default task with copy of original CLAUDE.md" | Verifies .claude/tasks/default/CLAUDE.md equals root CLAUDE.md after init-project. | T-INIT-3 | Pre-condition asserts default task file does not exist. Post-condition asserts content identity. No conditional guard. A stub copying empty content would fail. | PASS |
| initialization.test.ts:"should produce identical files on second run and not duplicate stash" | Verifies init-project exits 0 twice, produces identical .claude/CLAUDE.md content, and stash directory has exactly 1 CLAUDE file. | T-INIT-4 | Both runs assert exitCode === 0. Content equality checked between runs. Stash directory asserted unconditionally; stash file count asserted === 1. All three AC requirements covered. | PASS |
| initialization.test.ts:"should handle multiple projects independently" | Uses save-context implementation to write to project A's personal storage, then asserts the file exists in project A and does NOT exist in project B. | T-INIT-5 | Uses save-context through the implementation (not direct createJsonl). Asserts file exists in project A path and does NOT exist in project B path. Comment explicitly rejects the path-formula-only approach. | PASS |
| task-operations.test.ts:"should create task CLAUDE.md with description" | Verifies task-create produces CLAUDE.md with all four required section headers and the description keyword appears under the ## Focus section. | T-TASK-1 | Checks all four section headers with anchored regex. Extracts Focus section by slicing between section indices and checks focusSection.toLowerCase().toContain('oauth'). A template with hardcoded empty sections would fail the Focus keyword check. | PASS |
| task-operations.test.ts:"should capture full multi-line description" | Verifies a four-line description has all four lines preserved verbatim in the Focus section. | T-TASK-3 | Asserts all four literal lines: "This is a complex refactor involving:", "- OAuth 2.0 migration", "- Session state cleanup", "- Token refresh logic". A keyword-rewriting implementation fails these literal assertions. | PASS |
| task-operations.test.ts:"T-TASK-4: should reject empty description" | Verifies task-create exits non-zero and creates no directory when given empty description. | T-TASK-4 | Asserts exitCode !== 0 and fileExists(taskDir) === false, both unconditional. | PASS |
| task-operations.test.ts:"should reject task name with uppercase" | Verifies task-create exits non-zero and creates no directory for an uppercase task name. | T-TASK-2 | Asserts exitCode !== 0 and neither the exact nor lowercased task directory exists. Unconditional. | PASS |
| task-operations.test.ts:"T-SWITCH-1: .claude/CLAUDE.md must contain exactly one @import pointing to the selected task after each switch" | Verifies that after each of four task switches (A→B→C→A), .claude/CLAUDE.md contains exactly one @import line pointing to the correct task. | T-SWITCH-1 | assertSingleImport splits on newlines, filters startsWith('@import'), asserts length === 1 and importLines[0] contains taskId. Run after all four switches with exitCode === 0 on each. An appending implementation would fail (length > 1). | PASS |
| task-operations.test.ts:"T-SWITCH-2: should indicate no contexts available and offer fresh start" | Verifies task-list for a no-context task exits 0 and output matches /no contexts\|\bfresh\b/i. | T-SWITCH-2 | Uses \bfresh\b word boundary — "Refreshed task listing" would not satisfy the assertion. An implementation emitting only a numbered menu with no contexts message would fail. | PASS |
| task-operations.test.ts:"T-SWITCH-3: should list both personal and golden contexts" | Verifies all three specific context names appear and personal-1 appears before golden-1 in output. | T-SWITCH-3 | All three names required. Section labels required. indexOf('personal-1') < indexOf('golden-1') enforces ordering via content names rather than section headers. | PASS |
| task-operations.test.ts:"T-SWITCH-4: context-list --json returns empty contexts array even when UUID sessions exist" | Verifies context-list --json returns contexts:[] while sessions.length > 0 when only UUID session files exist. | T-SWITCH-4 | Parses JSON output. Asserts data.contexts strictly equals []. Asserts data.sessions.length > 0. UUID files planted in beforeEach; no named context save run. | PASS |
| task-operations.test.ts:"T-SWITCH-5: human-readable output does not show UUID sessions under Personal or Golden contexts sections" | Verifies human-readable context-list omits "personal contexts" / "golden contexts" section labels and contains no numbered UUID options when only UUID sessions exist. | T-SWITCH-5 | Checks not.toContain('personal contexts') and not.toContain('golden contexts') (lowercased). Checks not.toMatch numbered-UUID pattern. Does not check "Personal:" alone — an implementation outputting "Personal: (none)" without "contexts" would pass. The numbered-UUID assertion remains the meaningful guard. | PASS |
| task-operations.test.ts:"T-SWITCH-6: should confirm vanilla mode restored and verify @import points to default task" | Verifies switching to default produces output matching /vanilla\|restored/ AND .claude/CLAUDE.md contains @import pointing to default, not the previous task. | T-SWITCH-6 | Two-part assertion: text output and @import path. Checks not.toContain('some-task') in CLAUDE.md. A correct text output with wrong @import fails. | PASS |
| context-operations.test.ts:"should save context to personal storage" | Verifies save-context --personal creates file at the exact specified personal path and validates JSONL. | T-CTX-1 | Asserts exitCode === 0, fileExists(expectedPath) === true, isValidJsonl(expectedPath) === true. No conditional guard on fileExists. | PASS |
| context-operations.test.ts:"should create valid JSONL file" | Verifies saved context is valid JSONL and non-empty. | T-CTX-2 | Asserts file exists, isValidJsonl === true, and readFile().trim().length > 0. The non-empty check prevents a trivially valid empty file from satisfying isValidJsonl. | PASS |
| context-operations.test.ts:"should block golden save when session contains a real AWS key" | Verifies save-context --golden exits non-zero, output names the secret type (aws/akia), and creates no golden file when session contains an AWS key. | T-CTX-3 | Asserts exitCode !== 0, output matches /aws\|akia/i, golden path does NOT exist (unconditional). The prompt-based AC path (exit 0 + user prompt) is not covered — if implementation uses interactive prompting, these tests incorrectly fail on AC-compliant behavior. This is a test overcoverage issue (false fail on correct interactive impl), not a false pass on incorrect impl. The tests correctly catch a silent exit-0-no-prompt-no-file implementation. | PASS |
| context-operations.test.ts:"should reject golden save when context exceeds 100KB" | Verifies save-context --golden exits non-zero with size-limit message and creates no golden file for a 150KB session. | T-CTX-4 | Pre-condition asserts statSync(filePath).size > 100*1024 before running the script. Output matches /100KB\|too large/i. Golden path NOT created (unconditional). | PASS |
| context-operations.test.ts + new-features.test.ts:"T-CTX-6: should create a backup file when saving to an existing name" | Verifies saving to an existing context name creates a .backup- file containing the original content. | T-CTX-6 | Runs save-context twice. Captures original content after first save. Asserts backupFiles.length >= 1 and backupContent === originalContent. | PASS |
| context-operations.test.ts + new-features.test.ts:"T-MEM-1: should update MEMORY.md with task-id and context-name after save" | Verifies MEMORY.md appears at personalDir/memory/MEMORY.md containing task ID and context name after save-context. | T-MEM-1 | Test path (personalDir/memory/MEMORY.md) matches the PRD AC exactly — no path mismatch. Asserts fileExists unconditionally then checks content contains both task-id and context-name. | PASS |
| context-operations.test.ts:"T-LIST-2: should show correct message count adjacent to each context name" | Verifies each context's line in context-list output shows the exact message count as a word-bounded number. | T-LIST-2 | Finds line containing context name and checks it matches /\b5\b/ and /\b30\b/. Word boundaries prevent 5 matching 50. Count and name on same line. | PASS |
| context-operations.test.ts:"T-LIST-3: should indicate no contexts found using one of the AC-specified phrases" | Verifies context-list for a no-context task exits 0 and output matches /\bfresh\b\|\bempty\b\|\bno contexts\b/i. | T-LIST-3 | Uses word boundaries on "fresh" and "empty". Corrects the gap present in T-SWITCH-2. | PASS |
| context-operations.test.ts:"T-LIST-4: should display content-derived summary alongside context name" | Verifies context-list shows a content-derived summary after a — separator on the context name line. | T-LIST-4 | Uses save-context (not direct file creation) so meta.json is generated by the implementation. Verifies meta.json summary contains auth keyword. Finds the context name line in output and checks — separator and auth keyword after it. T-SUM-2 prevents hardcoded keyword tricks by requiring different summaries for different source topics. | PASS |
| context-operations.test.ts:"T-PROM-1: should successfully promote clean context" | Verifies that after promote-context, both personal original and golden copy exist and are byte-for-byte identical. | T-PROM-1 | Asserts exitCode === 0, fileExists for both paths (unconditional), readFile(golden) === readFile(personal). | PASS |
| context-operations.test.ts:"should detect secrets and warn/block" (T-PROM-2) | Verifies promote-context exits non-zero and output matches /ghp_\|github token\|github pat/i when context contains a GitHub token. | T-PROM-2 | Requires token prefix (ghp_) or explicit type label ("GitHub Token" / "GitHub PAT"). The word "github" alone is not sufficient. An implementation emitting "Found github content, promotion blocked" now fails. | PASS |
| context-operations.test.ts:"T-PROM-3: should warn and fail when context is already golden" | Verifies second promote-context attempt exits non-zero with output matching /already.*golden\|already exists/i. | T-PROM-3 | Setup promotes once (first success verified, golden file existence confirmed), then promotes again. The "already exists" alternative is satisfied by a raw EEXIST filesystem error without implementation-level detection of the golden state. The AC permits exits-non-zero which a filesystem error satisfies, so the test faithfully implements the AC. The AC wording is permissive; this is not a test deficiency. | PASS |
| secret-detection.test.ts:"should detect AWS access key pattern" | Verifies scan-secrets exits non-zero and output contains "akia" for a context with AKIA-format key. | T-SEC-2 | Asserts exitCode !== 0 and output.match(/akia/i). Requires AKIA prefix explicitly. | PASS |
| secret-detection.test.ts:"should detect both test and live keys" | Verifies output literally contains both sk_test_ and sk_live_ substrings. | T-SEC-3 | expect(output).toContain('sk_test_') and toContain('sk_live_') — exact prefix matches. Both must appear. | PASS |
| secret-detection.test.ts:"should detect secrets in user, assistant, and tool_result messages" | Verifies secrets in all three message type positions are independently detected. | T-SEC-4 | Three patterns checked (akia/aws, sk_test/stripe, ghp_/github) mapped to three message type positions. If any type is skipped by the scanner, its pattern won't appear. The user message uses AKIAIOSFODNN7EXAMPLE123 (23 chars after AKIA prefix); under the FP-preferring policy established by T-SEC-5, scanners that detect AKIA-prefixed strings broadly will flag this. | PASS |
| secret-detection.test.ts:"should treat AKIAIOSFODNN7EXAMPLE as a true positive" | Verifies the documentation example key is flagged, not excluded as a known-safe placeholder. | T-SEC-5 | Uses an isolated fixture containing ONLY that key. Asserts exitCode !== 0 and output matches /akia/i. Isolation prevents the AWS_KEY_CONTEXT fixture from masking a gap where the example key is filtered. | PASS |
| secret-detection.test.ts:"should produce clean valid JSONL after redaction" | Verifies redact-secrets produces valid JSONL and a second scan-secrets run returns clean. | T-SEC-6 | Asserts redacted file exists, isValidJsonl === true, rescan exits 0 and output matches /clean/i. Rescan is unconditional. | PASS |
| secret-detection.test.ts:"T-SEC-7: should report exactly 5 secrets with word-boundary count in output" | Verifies scan-secrets on a 5-secret context reports the count with adjacency to "found" or "secret". | T-SEC-7 | Regex /\bfound\s+5\s+secret\|\b5\s+secrets?\s+found/i requires adjacency. MULTIPLE_SECRETS_CONTEXT contains exactly 5 secrets (AKIAIOSFODNN7EXAMPLE, wJalrXUtnFEMI AWS secret key, sk_live Stripe key, ghp_ GitHub token, DATABASE_PASSWORD). Coverage validity depends on the scanner detecting all 5 patterns — if the scanner does not detect the AWS secret key (non-AKIA format), it would report 4 and this test would FAIL rather than pass vacuously. | PASS |
| secret-detection.test.ts:"should detect secrets in user, assistant, and tool_result messages" (T-SEC-8 coverage: GitHub token ghp_) | Verifies scan-secrets exits non-zero with /ghp_\|github/i for a GitHub token context. | T-SEC-8 | Test 9.3 uses GITHUB_TOKEN_CONTEXT and requires /ghp_/i in output. | PASS |
| secret-detection.test.ts:"should detect RSA private key header" (T-SEC-9) | Verifies scan-secrets exits non-zero with output matching /rsa.*private\|private.*key\|BEGIN.*PRIVATE/i for RSA private key content. | T-SEC-9 | PRIVATE_KEY_CONTEXT fixture used. Pattern is specific to RSA/private key markers. | PASS |
| secret-detection.test.ts:"should detect password assignment patterns" (T-SEC-10) | Verifies scan-secrets exits non-zero with output containing "password" for password= patterns. | T-SEC-10 | PASSWORD_CONTEXT fixture used. /password/i is broad but meaningful for this AC clause. | PASS |
| context-operations.test.ts:"T-SUM-1: saved context meta.json must contain a summary between 20 and 500 characters" | Verifies save-context writes a .meta.json with a length-bounded, content-derived summary. | T-SUM-1 | Asserts fileExists(metaPath) unconditionally, parses JSON, checks summary type, length 20-500, and summaryLower matches one of four auth-domain keywords. A static "authentication" string (10 chars) fails the length lower bound; a generic UUID fails the keyword check. T-SUM-2 prevents keyword-only hardcoding. | PASS |
| context-operations.test.ts:"T-SUM-2: two contexts from different conversations must produce different summary strings" | Verifies auth-topic and database-topic contexts produce different summaries each containing source-specific keywords. | T-SUM-2 | Both meta paths asserted to exist unconditionally. summaryAuth !== summaryDb. Each summary must match its domain keywords. Prevents hardcoded summaries, UUID summaries, and content-agnostic summaries. | PASS |
| context-operations.test.ts:"T-SUM-3: source session file is byte-for-byte identical before and after save-context" | Verifies save-context does not mutate the source session file — summary generation uses forked context. | T-SUM-3 | Snapshots current-session.jsonl content before save-context, asserts byte-for-byte equality after. | PASS |
| context-operations.test.ts:"T-MANAGE-1: list-all-contexts includes context names from multiple tasks" | Verifies list-all-contexts exits 0 and stderr contains context names and task names from at least 2 different tasks. | T-MANAGE-1 | Creates contexts in two tasks (task-alpha, task-beta). Asserts both context names and both task names appear in human-readable stderr output. | PASS |
| context-operations.test.ts:"T-MANAGE-2: list-all-contexts marks context as stale when older than 30 days" | Verifies list-all-contexts marks a context as stale when its mtime is > 30 days ago. | T-MANAGE-2 | Plants context file with mtime set to 31 days ago via utimesSync. Finds the context's output line in stderr, asserts it contains "stale". If implementation uses a timestamp source other than file mtime (e.g., meta.json creation date), utimesSync would not affect detection and this test would fail — catching that wrong implementation. | PASS |
| context-operations.test.ts:"T-MANAGE-3: list-all-contexts flags identical context files as duplicates" | Verifies list-all-contexts marks byte-for-byte identical context files as [DUPLICATE]. | T-MANAGE-3 | Creates two files with identical serialized content (not via save-context, so no meta.json). Both output lines must contain "duplicate". If implementation only compares meta.json hashes, files with no meta.json would not be flagged — the test would fail, catching that wrong implementation. | PASS |
| context-operations.test.ts:"T-MANAGE-4: delete-context --dry-run shows what would be deleted without deleting" | Verifies delete-context --dry-run exits 0, names the context in output, and leaves the file intact. | T-MANAGE-4 | Asserts exitCode === 0, output contains context name, fileExists(ctxFile) === true after dry-run. | PASS |
| context-operations.test.ts:"T-MANAGE-5: rename-context renames context file; old path gone, new path valid JSONL" | Verifies rename-context exits 0, removes the old file, and creates a valid non-empty JSONL at the new path. | T-MANAGE-5 | Asserts exitCode === 0, old path does not exist, new path is valid JSONL with length > 0. | PASS |
| context-operations.test.ts:"T-MANAGE-6: archive-context moves context to archives/ subdirectory" | Verifies archive-context exits 0, creates file at contexts/archives/<name>.jsonl under the personal dir, and removes the original. | T-MANAGE-6 | Asserts exitCode === 0, original path does not exist, archive path is valid JSONL. Archive path is within the same personal contexts directory: join(ctxDir, 'archives', 'old-work.jsonl'). | PASS |
| git-integration.test.ts:"T-GIT-1: git check-ignore .claude/CLAUDE.md exits 0 in a real git repo after init" | Verifies .claude/CLAUDE.md is git-ignored in a real git repo after init-project. | T-GIT-1 | Uses real git repo. Commits .claude/.gitignore before calling git check-ignore (portable, version-independent). isGitIgnored uses git check-ignore which must exit 0. | PASS |
| git-integration.test.ts:"T-GIT-2: git status --porcelain does not list any path containing personal storage prefix after full workflow" | Verifies personal storage paths do not appear in git status after a full workflow including save-context. | T-GIT-2 | Two assertions: (1) `not.toContain(personalPrefix)` where personalPrefix is an absolute path like `/tmp/...` — git status --porcelain shows relative paths only, so this assertion is vacuous and can NEVER fail regardless of implementation behavior. (2) `not.toContain('tgit-ctx')` — meaningful; catches the specific case where the implementation saves the named context inside the project directory. An implementation that routes personal contexts inside the project under any name other than 'tgit-ctx' (e.g., `.claude/tasks/tgit-task/contexts/other.jsonl`) would pass both assertions while violating the AC. | INADEQUATE |
| error-handling.test.ts:"T-ERR-1: should handle missing .claude directory gracefully" | Verifies task-create without prior init exits non-zero with "init" message and no Node.js stack trace. | T-ERR-1 | Asserts exitCode !== 0, output matches /init\|not initialized/i, stderr does NOT contain stack trace patterns at Object.<anonymous> or at\s+\w+\s+\(. | PASS |
| error-handling.test.ts:"T-ERR-2: should detect corrupt JSONL" | Verifies scan-secrets on malformed JSONL exits non-zero with corruption message and no stack trace. | T-ERR-2 | Asserts exitCode !== 0, no stack trace, output matches /invalid\|corrupt\|malformed\|parse.*error\|json/i. | PASS |
| error-handling.test.ts:"T-ERR-3: should handle paths with spaces" | Verifies init-project, task-create, and update-import all exit 0 and produce expected output files when project path contains a space. | T-ERR-3 | Three operations run sequentially; each asserts exitCode === 0 AND fileExists for the expected output file. | PASS |
| context-operations.test.ts:"T-HOOK-1: should save session content to timestamped file in auto-saves/" | Verifies auto-save-context with a mock stdin payload creates a timestamped JSONL file in auto-saves/ containing the session content. | T-HOOK-1 | Plants UUID session file. Passes JSON payload via stdin file redirect. Asserts exitCode === 0, timestamped file exists in auto-saves/, file is valid JSONL, non-empty, and content contains 'authentication' from SMALL_CONTEXT. Hook registration in Claude Code hooks configuration is not tested — the AC explicitly specifies "mock stdin payload" so this scope is intentional. | PASS |
| adversary.test.ts T-ADV-1 block:"should exist at ~/.claude/context-curator/specialized/adversary/CLAUDE.md and contain ADVERSARY and STRICT" | Verifies the DNA copy step of install.sh places adversary DNA at the correct path with required content strings. | T-ADV-1 | beforeAll uses cpSync to mirror install.sh step 5 into an isolated temp HOME, then asserts unconditionally. Runs on every machine. No skipIf. | PASS |
| adversary.test.ts:"T-SPEC-4: imported path should resolve to a file on disk whose content contains ADVERSARY" and "T-ADV-2: imported path must end with specialized/adversary/CLAUDE.md" | Verifies update-import adversary sets exactly one @import, the imported path resolves to an existing file containing ADVERSARY, and the path ends with specialized/adversary/CLAUDE.md. | T-ADV-2, T-SPEC-4 | Three tests in the describe block. Path resolution handles ~/, absolute, and relative forms. fileExists(resolvedPath) and toContain('ADVERSARY') both unconditional. Separate test asserts path.endsWith('specialized/adversary/CLAUDE.md'). Uses isolated CLAUDE_HOME — test is self-contained. | PASS |
| adversary.test.ts:"should be byte-for-byte identical before and after task-create, update-import, save-context" | Verifies three user task operations do not modify the adversary DNA at the isolated specialized path. | T-ADV-3, T-SPEC-1 | Reads DNA content before all operations and after. Compares with ===. Uses isolated CLAUDE_HOME. | PASS |
| adversary.test.ts:"should exit non-zero with a strict-isolation message" | Verifies save-context with adversary task active exits non-zero with isolation message. | T-ADV-4, T-SPEC-2 | exitCode !== 0 and output matches /strict.isolation\|not.*available\|specialized.*task/i. | PASS |
| adversary.test.ts:"should not create a context file at the adversary personal context path" | Verifies no .jsonl file is created at the adversary personal context path when save-context is blocked. | T-ADV-4, T-SPEC-2 | Checks exactly one path: `tasks/adversary/contexts/should-not-exist.jsonl`. The AC states "no .jsonl file is created at any personal or golden context path." An implementation that writes to an adjacent path — `tasks/adversary/contexts/should-not-exist-backup.jsonl`, `tasks/adversary/contexts/fallback.jsonl`, or any other path within the adversary task — would pass this test while violating the AC. Only one specific filename at one specific location is checked. | INADEQUATE |
| adversary.test.ts:"should exit 0 and output a strict-isolation message" + "should not surface any UUID session as a selectable context" | Verifies context-list for the adversary task exits 0 with isolation message and no UUID pattern in output. | T-SPEC-3 | Isolation message matches /strict.isolation\|no contexts.*isolation\|isolation.*no contexts/i. UUID check: /[0-9a-f]{8}-[0-9a-f]{4}/.test(output) === false. | PASS |
| claude-md-system.test.ts Test 8.1 (multiple tests) | Verifies root CLAUDE.md content is unchanged after init, task creation, task switching, and git status shows no root CLAUDE.md modification. | T-CLMD-1 | Multiple tests check readFile(CLAUDE.md) === originalContent after each category of operation. Git status test verifies no line ending with CLAUDE.md (excluding .claude/) appears. | PASS |
| claude-md-system.test.ts:"should contain exactly one @import after multiple switches" | Verifies exactly one @import line after two task switches, pointing to the second task. | T-CLMD-2 | Splits content, filters startsWith('@import'), asserts importLines.length === 1 and contains task-2 but not task-1. | PASS |
| T-RESUME-MANUAL | MANUAL: After /task <id> + /resume <session>, Claude's response references task CLAUDE.md content. | T-RESUME-MANUAL | RA-002 applies. DISPOSITION: ACCEPTED. EXPIRY: v2.0-release. | ACCEPTED (RA-002) |
| error-handling.test.ts Test 13.6:"should handle permission errors gracefully" | Verifies task-create exits non-zero with permission message when tasks directory is read-only. | F-ERR / Test 13.6 | RA-001 applies. DISPOSITION: ACCEPTED. EXPIRY: 2026-09-12. | ACCEPTED (RA-001) |

---

## Section 2 — Acceptance Criteria Coverage Gaps

### F-INIT
| Clause | Tests | Status |
|--------|-------|--------|
| T-INIT-1 | initialization.test.ts | ADEQUATE |
| T-INIT-2 | initialization.test.ts | ADEQUATE |
| T-INIT-3 | initialization.test.ts | ADEQUATE |
| T-INIT-4 | initialization.test.ts | ADEQUATE |
| T-INIT-5 | initialization.test.ts | ADEQUATE |

### F-TASK-CREATE
| Clause | Tests | Status |
|--------|-------|--------|
| T-TASK-1 | task-operations.test.ts | ADEQUATE |
| T-TASK-2 | task-operations.test.ts | ADEQUATE |
| T-TASK-3 | task-operations.test.ts | ADEQUATE |
| T-TASK-4 | task-operations.test.ts | ADEQUATE |

### F-TASK-SWITCH
| Clause | Tests | Status |
|--------|-------|--------|
| T-SWITCH-1 | task-operations.test.ts | ADEQUATE |
| T-SWITCH-2 | task-operations.test.ts | ADEQUATE |
| T-SWITCH-3 | task-operations.test.ts | ADEQUATE |
| T-SWITCH-4 | task-operations.test.ts | ADEQUATE |
| T-SWITCH-5 | task-operations.test.ts | ADEQUATE — numbered-UUID assertion is the meaningful guard; "Personal:" label (without "contexts") is not checked but does not undermine UUID suppression coverage |
| T-SWITCH-6 | task-operations.test.ts | ADEQUATE |

### F-CTX-SAVE
| Clause | Tests | Status |
|--------|-------|--------|
| T-CTX-1 | context-operations.test.ts | ADEQUATE |
| T-CTX-2 | context-operations.test.ts | ADEQUATE |
| T-CTX-3 | context-operations.test.ts | ADEQUATE for exit-non-zero path. The interactive prompt path (exit 0 + user prompt) has no test coverage. If an implementation uses interactive prompting, these tests fail on AC-compliant behavior. This is test overcoverage (false fail on correct interactive impl), not a false pass on incorrect impl. |
| T-CTX-4 | context-operations.test.ts | ADEQUATE |
| T-CTX-6 | context-operations.test.ts + new-features.test.ts | ADEQUATE |
| T-MEM-1 | context-operations.test.ts + new-features.test.ts | ADEQUATE — test path (personalDir/memory/MEMORY.md) matches PRD AC exactly |

### F-CTX-LIST
| Clause | Tests | Status |
|--------|-------|--------|
| T-LIST-1 | context-operations.test.ts | ADEQUATE |
| T-LIST-2 | context-operations.test.ts | ADEQUATE |
| T-LIST-3 | context-operations.test.ts | ADEQUATE |
| T-LIST-4 | context-operations.test.ts | ADEQUATE |

### F-CTX-MANAGE
| Clause | Tests | Status |
|--------|-------|--------|
| T-CTX-7 | context-operations.test.ts | ADEQUATE |
| T-MANAGE-1 | context-operations.test.ts | ADEQUATE |
| T-MANAGE-2 | context-operations.test.ts | ADEQUATE |
| T-MANAGE-3 | context-operations.test.ts | ADEQUATE |
| T-MANAGE-4 | context-operations.test.ts | ADEQUATE |
| T-MANAGE-5 | context-operations.test.ts | ADEQUATE |
| T-MANAGE-6 | context-operations.test.ts | ADEQUATE |
| [Interactive menu: rename, merge, promote, demote, view, diff] | Manual scope | Claude-invoked behaviors — not scriptable via CLI. Accepted as manual scope (analogous to T-RESUME-MANUAL). |

### F-CTX-PROMOTE
| Clause | Tests | Status |
|--------|-------|--------|
| T-CTX-5 | context-operations.test.ts + new-features.test.ts | ADEQUATE — new-features.test.ts includes pre-condition size verification; context-operations.test.ts does not, but 150 messages × 1000 chars reliably exceeds 100KB |
| T-PROM-1 | context-operations.test.ts | ADEQUATE |
| T-PROM-2 | context-operations.test.ts | ADEQUATE |
| T-PROM-3 | context-operations.test.ts | ADEQUATE — AC wording permits EEXIST-based failure; test faithfully implements the AC |

### F-CLMD
| Clause | Tests | Status |
|--------|-------|--------|
| T-CLMD-1 | claude-md-system.test.ts | ADEQUATE |
| T-CLMD-2 | claude-md-system.test.ts | ADEQUATE |
| T-RESUME-MANUAL | None (manual) | RISK_ACCEPTED — RA-002, expires v2.0-release |

### F-SEC
| Clause | Tests | Status |
|--------|-------|--------|
| T-SEC-2 | secret-detection.test.ts | ADEQUATE |
| T-SEC-3 | secret-detection.test.ts | ADEQUATE |
| T-SEC-4 | secret-detection.test.ts | ADEQUATE |
| T-SEC-5 | secret-detection.test.ts | ADEQUATE |
| T-SEC-6 | secret-detection.test.ts | ADEQUATE |
| T-SEC-7 | secret-detection.test.ts | ADEQUATE — count correctness depends on scanner detecting all 5 secrets in MULTIPLE_SECRETS_CONTEXT including the AWS secret key (non-AKIA format); a scanner that misses this pattern would report 4 and fail the test, not pass it |
| T-SEC-8 | secret-detection.test.ts | ADEQUATE |
| T-SEC-9 | secret-detection.test.ts | ADEQUATE |
| T-SEC-10 | secret-detection.test.ts | ADEQUATE |

### F-SUMMARY
| Clause | Tests | Status |
|--------|-------|--------|
| T-SUM-1 | context-operations.test.ts | ADEQUATE |
| T-SUM-2 | context-operations.test.ts | ADEQUATE |
| T-SUM-3 | context-operations.test.ts | ADEQUATE |

### F-GIT
| Clause | Tests | Status |
|--------|-------|--------|
| T-GIT-1 | git-integration.test.ts | ADEQUATE |
| T-GIT-2 | git-integration.test.ts | INADEQUATE — the assertion `not.toContain(personalPrefix)` uses an absolute path that git status porcelain never emits; this assertion is vacuous and constitutes no enforcement of the AC. The only meaningful check is `not.toContain('tgit-ctx')` — a single named file. An implementation that saves personal contexts inside the project directory under any filename other than 'tgit-ctx' passes both assertions while violating the AC clause "does not list any path containing the personal storage prefix." |

### F-XPLAT
| Clause | Tests | Status |
|--------|-------|--------|
| T-ERR-3 | error-handling.test.ts | ADEQUATE |

### F-ERR
| Clause | Tests | Status |
|--------|-------|--------|
| T-ERR-1 | error-handling.test.ts | ADEQUATE |
| T-ERR-2 | error-handling.test.ts | ADEQUATE |

### F-HOOK
| Clause | Tests | Status |
|--------|-------|--------|
| T-HOOK-1 | context-operations.test.ts | ADEQUATE |

### F-SPEC
| Clause | Tests | Status |
|--------|-------|--------|
| T-SPEC-1 | adversary.test.ts | ADEQUATE |
| T-SPEC-2 | adversary.test.ts | INADEQUATE — second it block checks only one specific file path (`tasks/adversary/contexts/should-not-exist.jsonl`). The AC requires "no .jsonl file is created at any personal or golden context path." An implementation that routes the context file to any adjacent path within the adversary task directories (different filename, different subdirectory, golden location) passes undetected. |
| T-SPEC-3 | adversary.test.ts | ADEQUATE |
| T-SPEC-4 | adversary.test.ts | ADEQUATE |

### F-ADVERSARY
| Clause | Tests | Status |
|--------|-------|--------|
| T-ADV-1 | adversary.test.ts | ADEQUATE |
| T-ADV-2 | adversary.test.ts | ADEQUATE |
| T-ADV-3 | adversary.test.ts | ADEQUATE |
| T-ADV-4 | adversary.test.ts | INADEQUATE — file existence check covers only `tasks/adversary/contexts/should-not-exist.jsonl`. An implementation that creates the context at any other path (different name, golden location, adjacent directory) passes while violating "no file matching 'adversary' exists in any personal context path." |
