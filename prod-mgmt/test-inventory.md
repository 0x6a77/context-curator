# Adversarial Test Inventory

Generated: 2026-03-11
Prior run findings addressed per constructor commit on main.

---

## Section 0: PRD/DoD Structural Audit

| PRD Section | DoD Exists | Falsifiable | Verdict |
|-------------|------------|-------------|---------|
| F-INIT · Project Initialization | YES — T-INIT-1 through T-INIT-5 | YES — each criterion has a concrete pass/fail state | PASS |
| F-TASK-CREATE · Task Creation | YES — T-TASK-1 through T-TASK-4 | YES | PASS |
| F-TASK-SWITCH · Task Switching | YES — T-SWITCH-1, T-SWITCH-2, T-SWITCH-3 | YES | PASS |
| F-CTX-SAVE · Context Saving | YES — T-CTX-1, T-CTX-2, T-CTX-3, T-CTX-4, T-CTX-6, T-MEM-1 | YES | PASS |
| F-CTX-LIST · Context Listing | YES — T-LIST-1 through T-LIST-4 | YES | PASS |
| F-CTX-MANAGE · Context Management | YES — T-CTX-7 | YES | PASS |
| F-CTX-PROMOTE · Context Promotion | YES — T-CTX-5, T-PROM-1, T-PROM-2, T-PROM-3 | YES | PASS |
| F-CLMD · Two-File CLAUDE.md System | YES — T-CLMD-1, T-CLMD-2, T-RESUME-MANUAL (manual) | T-CLMD-1 and T-CLMD-2 are falsifiable; T-RESUME-MANUAL is manual only | PASS |
| F-SEC · Secret Detection | YES — T-SEC-2 through T-SEC-7 | YES | PASS |
| F-SUMMARY · AI-Generated Summaries | NO automated ACs defined. Test plan states: "No automated AC clauses defined — summary quality is evaluated through F-CTX-LIST criterion T-LIST-4." T-SUM-1/T-SUM-2 appear only as commit message labels for implementation tasks, not as PRD ACs. | T-LIST-4 is the only falsifiable proxy; the core DoD behaviors (summary length 2-3 sentences, content quality, stored in metadata) have no machine-verifiable test | FAIL — DoD is non-empty but no automated AC clauses assert summary content, length, or presence in .meta.json |
| F-GIT · Git Integration | YES — T-GIT-1, T-GIT-2 | YES | PASS |
| F-XPLAT · Cross-Platform Compatibility | YES — T-ERR-3 (space in path) | T-ERR-3 is falsifiable; PRD scope note limits to macOS/Linux | PASS |
| F-ERR · Error Handling & Edge Cases | YES — T-ERR-1, T-ERR-2 | YES | PASS |
| F-HOOK · PreCompact Auto-Save Hook | YES — T-HOOK-1 | YES | PASS |

---

## Section 1: Test Inventory

### File: initialization.test.ts

| TEST_ID | DESCRIPTION | DOD_CLAUSE | VERDICT | ATTACK_VECTOR |
|---------|-------------|------------|---------|---------------|
| init/Test-1.1/should-create-.claude-directory-structure | Runs `init-project`, checks that `.claude/`, `.gitignore`, `tasks/default/CLAUDE.md` exist, asserts `@import` line in `.claude/CLAUDE.md` and that the import path contains `tasks/default/CLAUDE.md` and the imported file exists. | T-INIT-1: `init-project` creates `.claude/CLAUDE.md` containing an `@import` line | PASS | No practical attack: the import path is verified to exist on disk, and the pattern is specific. |
| init/Test-1.1/should-create-.gitignore-with-CLAUDE.md-entry | Runs `init-project`, reads `.claude/.gitignore`, asserts the line `CLAUDE.md` appears (exact line match via `^CLAUDE\.md$`). | T-INIT-1 (supporting) | PASS | A stub that writes `# CLAUDE.md` or `*CLAUDE.md` would fail the anchored regex. |
| init/Test-1.1/should-not-create-backup-when-no-original-CLAUDE.md-exists | Runs `init-project` on a project with no `CLAUDE.md`, asserts stash path does not exist, and positively asserts that `tasks/default/CLAUDE.md` was created (makes the negative non-vacuous). | T-INIT-2 (negative case) | PASS | Pre-condition on default task creation prevents vacuity. |
| init/Test-1.1/should-work-with-git-initialized | Inits git, runs `init-project`, asserts exit 0, checks `isGitIgnored` for `.claude/CLAUDE.md`. | T-GIT-1: `git check-ignore .claude/CLAUDE.md` exits 0 after init | PASS | Relies on real `git check-ignore` command, not a mock. |
| init/Test-1.2/should-not-modify-root-CLAUDE.md | Runs `init-project` on project with existing `CLAUDE.md`, reads root file and asserts content equals pre-run value. | T-CLMD-1 (partial) | PASS | A stub would have to actively overwrite the file to fail this. |
| init/Test-1.2/should-create-backup-of-original-CLAUDE.md | Asserts backup does NOT exist pre-run, runs `init-project`, asserts backup exists, asserts backup content equals original. | T-INIT-2: backup must not exist before script runs, then be created with byte-exact content | PASS | No attack vector found. |
| init/Test-1.2/should-create-default-task-with-copy-of-original-CLAUDE.md | Asserts default task CLAUDE.md does NOT exist pre-run, runs `init-project`, asserts file exists, asserts content equals original root content. | T-INIT-3: content equals root CLAUDE.md character-for-character | PASS | No attack vector found. |
| init/Test-1.2/should-create-.claude-CLAUDE.md-with-@import-directive | Asserts `.claude/CLAUDE.md` does NOT exist pre-run, runs `init-project`, asserts file exists, asserts `@import` regex, asserts import path contains `tasks/default/CLAUDE.md`, asserts imported file exists. | T-INIT-1: `@import` line present and pointing to a real file | PASS | No attack vector found. |
| init/Test-1.3/should-succeed-on-both-initializations | Runs `init-project` twice, captures `.claude/CLAUDE.md` content after first run, asserts it equals content after second run. Both runs must exit 0. | T-INIT-4: exit 0 both times, identical file contents | PASS | No attack vector found. |
| init/Test-1.3/should-not-create-duplicate-directories | Runs twice, asserts only one `default` entry in tasks dir, asserts file content identity. | T-INIT-4 (structural) | PASS | No attack vector found. |
| init/Test-1.3/should-indicate-already-initialized-on-second-run | Runs twice, asserts exit 0 both times, asserts content identity of `.claude/CLAUDE.md`. | T-INIT-4 | PASS | This test does NOT assert any output message about "already initialized" — the comment in original test plan required that, but the actual assertion is only exit-0 + content identity. A stub that silently re-runs without any message would still pass. However, the DoD clause T-INIT-4 only requires exit 0 and identical files, so the missing message check is not a DoD gap for this clause. |
| init/Test-1.3/should-produce-identical-files-on-second-run | Runs twice with `CLAUDE_HOME` env, asserts exit 0 both times, asserts content identity. | T-INIT-4 | PASS | No attack vector found. |
| init/Test-1.4/should-preserve-existing-.claude-content | Creates `.claude/existing-file.txt` before init, runs `init-project`, asserts file still exists with expected content. | F-INIT: preserves existing `.claude/` content | PASS | No attack vector found. |
| init/Test-1.4/should-still-create-missing-initialization-files | After pre-existing `.claude/`, runs `init-project`, asserts `.gitignore` and default task CLAUDE.md created. | F-INIT: creates missing files when `.claude/` already exists | PASS | No attack vector found. |
| init/Test-1.5/should-handle-multiple-projects-independently | Inits two projects, asserts different sanitized paths, asserts personal storage dirs are disjoint, writes marker to project-1 personal dir and asserts it does NOT appear in project-2 personal dir. | T-INIT-5: project A's personal dir isolated from project B | PASS | The marker cross-check is concrete. The `sanitizePath` assertion is necessary but only tests the path formula, not actual filesystem isolation — the marker write/read test is the real guard. |

### File: task-operations.test.ts

| TEST_ID | DESCRIPTION | DOD_CLAUSE | VERDICT | ATTACK_VECTOR |
|---------|-------------|------------|---------|---------------|
| task/Test-2.1/should-create-task-directory-structure | Runs `task-create` with valid name and description, asserts task directory, `CLAUDE.md`, and `contexts/` exist, asserts exit 0. | T-TASK-1 (structural) | PASS | No attack vector found. |
| task/Test-2.1/should-create-task-CLAUDE.md-with-description | Asserts exit 0, checks four required section headers (`# Task:`, `## Focus`, `## Key Areas`, `## Guidelines`), then slices the Focus section and checks the keyword "oauth" appears within it. | T-TASK-1: CLAUDE.md has all required sections and description appears under Focus | PASS | An implementation that generates all four headers but places the description under `## Guidelines` instead of `## Focus` would still fail the focused-section check. |
| task/Test-2.1/should-update-.claude-CLAUDE.md-with-import-directive | Asserts exit 0, asserts `.claude/CLAUDE.md` exists, asserts `@import` regex pointing to `oauth-refactor`, asserts import path contains `oauth-refactor`. | T-TASK-1 and T-SWITCH-1 (partial): import updated after create | PASS | No attack vector found. |
| task/Test-2.1/should-confirm-task-structure-is-complete-after-create | Asserts exit 0, asserts task CLAUDE.md exists with `# Task:` and `## Focus` headers. | T-TASK-1 | PASS (but slightly redundant with above) | No additional attack vector beyond prior test. |
| task/Test-2.2/should-reject-task-name-with-spaces | Asserts non-zero exit, asserts output matches `/invalid.*(name\|task)\|uppercase\|lowercase/i`, asserts task directory does NOT exist. | T-TASK-2: non-zero exit AND no task directory | PASS | No attack vector found. |
| task/Test-2.2/should-reject-task-name-with-uppercase | Asserts non-zero exit, asserts neither `OAuthRefactor` nor `oauthrefactor` directories created. | T-TASK-2 | PASS | No attack vector found. |
| task/Test-2.2/should-reject-task-name-with-special-characters | Asserts non-zero exit, asserts `oauth@refactor!` directory not created. | T-TASK-2 | PASS | No attack vector found. |
| task/Test-2.2/should-not-create-directory-for-invalid-task | Asserts non-zero exit, asserts neither `OAuth Refactor` nor `oauth refactor` directories exist. | T-TASK-2 | PASS | No attack vector found. |
| task/Test-2.3/should-capture-full-multi-line-description | Asserts exit 0, slices the `## Focus` section, checks `oauth`, `session`, and `token` appear within that section specifically. | T-TASK-3: all lines of multi-line description appear in Focus section | PASS | No attack vector found. |
| task/Test-2.4/should-reject-empty-description | Asserts non-zero exit for empty string description, asserts task directory not created. | T-TASK-4: empty description exits non-zero, no task directory | PASS | No attack vector found. |
| task/Test-3.1/should-list-personal-contexts-when-switching | Runs `task-list` for a task that has one personal context (`my-progress`) and no golden contexts. Asserts exit 0, asserts `my-progress` in output, asserts `personal` section index >= 0, asserts `golden` index < 0. | T-SWITCH-2: task with no golden shows personal only; T-SWITCH-3: personal listed before golden | FAIL | The golden check `indexOf('golden') < 0` passes if the output contains the string "golden" anywhere — e.g., in a header like "No golden contexts found." A stub that emits `No golden contexts found.\npersonal-ctx: my-progress` would pass the `indexOf('personal') >= 0` check AND the `indexOf('golden') < 0` check is `< 0` meaning it MUST NOT be present. However, a stub that outputs "golden contexts: none" (i.e., the word golden appears) would fail the `< 0` check. The actual attack: an implementation that outputs both `personal` and `golden` sections even with no golden contexts would cause `indexOf('golden')` to be `>= 0`, failing the test. So the golden-must-not-appear check IS meaningful. However, the test does not assert that the `my-progress` context is listed under a personal section header — it only checks the string appears somewhere. An implementation that lists contexts without section headers would still pass. **Verdict revised: PASS** — the overall combination of checks is meaningful. |
| task/Test-3.2/should-list-golden-contexts-when-switching | Runs `task-list` for task with one golden context (`oauth-deep-dive`), asserts exit 0, asserts context name in output, asserts `golden` in output. | T-SWITCH-3: golden contexts listed | FAIL | The test does NOT assert that `personal` is absent. If an implementation always emits a `Personal contexts:` header (even empty), the test still passes because it only requires `golden` to appear. More critically, the test does not assert that the word `⭐` appears or that the golden context is marked as golden — it only checks the section label. An implementation that marks the context as personal but emits the word "golden" in a footer would pass. ATTACK: emit `Golden contexts: (ask teammate for access)` plus the context name as personal — test passes. |
| task/Test-3.3/should-list-both-personal-and-golden-contexts | Asserts both `personal` and `golden` appear in output, asserts `personal` index < `golden` index (T-LIST-1 ordering). | T-SWITCH-3: personal before golden | PASS | indexOf ordering is a real check. No attack vector. |
| task/Test-3.3/should-show-personal-contexts-before-golden | Same ordering check but with `CLAUDE_HOME` env, asserts both indices >= 0, asserts personal < golden. | T-SWITCH-3 / T-LIST-1 | PASS | No attack vector found. |
| task/Test-3.4/should-indicate-no-contexts-available-and-offer-fresh-start | Asserts exit 0, asserts output matches `/no contexts\|fresh/i`. | T-SWITCH-2: output indicates no contexts | PASS | No attack vector found. |
| task/Test-3.4/should-still-allow-task-switch | Runs `update-import` for empty-task, asserts exit 0. | T-SWITCH-2: task switch succeeds even with no contexts | PASS | No attack vector found. |
| task/Test-3.5/should-switch-to-default-task | Runs `update-import` for default, asserts exit 0, asserts `.claude/CLAUDE.md` contains `@import` pointing to `default`. | T-CLMD-2 / T-SWITCH-1 (default case) | PASS | No attack vector found. |
| task/Test-3.5/should-indicate-vanilla-mode-restored | Runs `update-import` for default, asserts output matches `/vanilla\|restored/`. | F-TASK-SWITCH: output message | ESCALATE | The pattern `/vanilla\|restored/` is specific enough on its face, but the test only checks `result.stdout` not `stdout + stderr`. If the message is emitted to stderr, test passes vacuously. Additionally, "vanilla" and "restored" are implementation-defined strings — a correct implementation that outputs "✓ Switched to default" would fail this test. This tests a specific string choice, not the DoD behavior. |
| task/Test-3.6/should-update-.claude-CLAUDE.md-on-each-switch | Runs four `update-import` calls for task-a, task-b, task-c, back to task-a; after each asserts exit 0, file exists, and the new task name IS present while the previous task name is NOT. | T-SWITCH-1: exactly one `@import` after each switch; T-CLMD-2 implied | PASS — but see attack vector | The test asserts `fileContains(path, 'task-a')` is false after switching to task-b, but only checks for the literal task name string, not that there is exactly one `@import` line. An implementation that comments out old imports (e.g., `# @import task-a`) would leave the task-a string present and fail `fileContains(..., 'task-a') === false`. However, an implementation that writes `@import ./tasks/task-b/CLAUDE.md @import ./tasks/task-a/CLAUDE.md` on one line would pass because `fileContains('task-a')` would be `true` (causing the test to fail). So the negative check does guard against stacking. **PASS**. |
| task/T-SWITCH-1/exactly-one-@import-after-multiple-switches | (This test lives in claude-md-system.test.ts as "should contain exactly one @import after multiple switches" — see that entry.) | T-SWITCH-1 / T-CLMD-2 | See claude-md-system entry | — |

### File: context-operations.test.ts

| TEST_ID | DESCRIPTION | DOD_CLAUSE | VERDICT | ATTACK_VECTOR |
|---------|-------------|------------|---------|---------------|
| ctx-ops/Test-4.1/should-save-context-to-personal-storage | Creates a session JSONL, runs `save-context --personal`, asserts exit 0, asserts exact path `<personalDir>/tasks/save-test/contexts/my-work.jsonl` exists, asserts valid JSONL. | T-CTX-1: exact personal path; T-CTX-2: valid JSONL | PASS | No attack vector found. |
| ctx-ops/Test-4.1/should-create-valid-JSONL-file | Same save flow, asserts exit 0, asserts file exists, asserts `isValidJsonl`, asserts non-empty. | T-CTX-2: unconditional valid JSONL, non-empty | PASS | Empty-file guard (`.trim().length > 0`) prevents vacuous pass. |
| ctx-ops/Test-4.1/should-not-save-to-project-.claude-directory-for-personal | Asserts personal file exists, asserts project golden path does NOT exist. | T-CTX-1: personal save goes to personal storage only | PASS | No attack vector found. |
| ctx-ops/Test-4.2/should-save-context-to-project-directory-for-golden | Creates clean session, runs `save-context --golden`, asserts exit 0, asserts golden path exists, asserts valid JSONL. | T-CTX-1 (golden variant), T-CTX-2 | PASS | No attack vector found. |
| ctx-ops/Test-4.2/should-run-secret-scan-before-saving-golden | Asserts output contains `scan` OR `secret` (OR operator). | T-CTX-3 (partial): scan must run | FAIL | The OR makes this weak but the alternatives are both meaningful secret-scan signal words. However, `output.includes('scan') || output.includes('secret')` would pass for an implementation that writes "No secrets found, scan complete" or just has a line "Scanning..." — both are plausible in any scan path. More critically: a stub that outputs "Scanning configuration..." before doing something completely different passes. The OR is technically not a banned vacuous OR (both branches indicate scan activity), but the test does NOT verify that the scan ran against the correct file or that the scan result influenced the save decision. It is an output-string test for a side-effect, not a behavioral test. ATTACK: emit "Scanning environment..." during init, skip actual secret scan, save golden anyway. |
| ctx-ops/Test-4.2/should-block-golden-save-when-session-contains-a-real-AWS-key | Feeds `AWS_KEY_CONTEXT` as session, runs `save-context --golden`, asserts non-zero exit, asserts output matches `/aws\|akia/`. | T-CTX-3: exits non-zero on real secret | PASS | `AWS_KEY_CONTEXT` contains `AKIAIOSFODNN7EXAMPLE` (only 20 chars, not 16 after AKIA prefix), but the fixture also contains the secret access key. The pattern matches. No practical attack vector. |
| ctx-ops/Test-4.3/should-reject-context-name-with-invalid-characters | Asserts non-zero exit, asserts output matches `/invalid.*(name\|characters?)\|name.*invalid/i`, asserts no file created. | F-CTX-SAVE: name validation | PASS | No attack vector found. |
| ctx-ops/Test-4.5/should-handle-empty-context-gracefully | Creates empty JSONL, runs `save-context --personal`, asserts non-zero exit, asserts no stack trace in stderr. | F-ERR: graceful error on empty context | PASS | No attack vector found. |
| ctx-ops/Test-4.5/should-reject-golden-save-when-context-exceeds-100KB | Creates 150-message large file, pre-asserts file > 100KB, runs `save-context --golden`, asserts non-zero exit, asserts output matches `/100KB\|too large/i`. | T-CTX-4: golden save blocked at 100KB | PASS | Pre-size assertion prevents test from passing vacuously if the fixture is accidentally small. |
| ctx-ops/T-CTX-6/should-create-a-backup-file-when-saving-to-an-existing-name | Saves `dup-ctx` twice, captures original content, asserts `.backup-` file exists after second save, asserts backup contains original content. | T-CTX-6: overwrite creates `.backup-` with original content | PASS | No attack vector found. |
| ctx-ops/Test-5.1/should-list-all-contexts-for-task | Runs `context-list`, asserts both `ctx-1` and `ctx-2` in output, checks personal/golden ordering only if both present (conditional). | T-LIST-1: specific context names appear | FAIL | The ordering check is inside a conditional `if (personalIdx >= 0 && goldenIdx >= 0)` — in a listing of only personal contexts, neither `golden` nor ordering is enforced here. This is the banned "conditional assertion on file existence" pattern applied to output sections. The test passes trivially if the implementation never emits the word "personal". More critically, the ordering check fires only when both sections are present — in this test, only personal contexts exist, so the golden check is never exercised. |
| ctx-ops/Test-5.1/should-show-message-counts | Asserts `\b5\b` and `\b30\b` appear in output. | T-LIST-2: exact message counts with word boundaries | PASS — but see attack vector | The fixture `SMALL_CONTEXT` has 5 messages and `createMediumContext()` returns 30. The word-boundary regex is correct. ATTACK: an implementation that prints "ctx-1: 5+ messages" or "5 messages (approx)" would match `\b5\b`. However, "5+" has `\b5\b` as a match because `+` is not a word character. Practically this is fine. |
| ctx-ops/Test-5.3/should-indicate-no-contexts-found | Creates a task with no contexts, runs `context-list`, asserts output matches `/no contexts\|empty\|fresh/i`. | T-LIST-3: empty-task output message | PASS | No attack vector found. |
| ctx-ops/Test-5.4/should-show-both-personal-and-golden-sections | Asserts both `personal` and `golden` in output, asserts `personal` index < `golden` index. | T-LIST-1: ordering | PASS | No attack vector found. |
| ctx-ops/Test-5.5/should-error-for-non-existent-task | Asserts non-zero exit, asserts output matches `/not found\|does not exist/i`. | F-CTX-LIST: error on non-existent task | PASS | No attack vector found. |
| ctx-ops/Test-5.6/should-display-non-empty-non-metadata-string-after-context-name | Finds the line containing `summary-ctx`, slices the content after the name, asserts length > 0, asserts at least 3 alphabetic characters. | T-LIST-4: non-empty description after context name | FAIL | The test only checks the portion of the line AFTER `summary-ctx`. An implementation that formats output as `summary-ctx (5 msgs) - 2026-01-18 auth` would pass because `(5 msgs) - 2026-01-18 auth` contains alphabetic characters. However, this is NOT a summary — it is a metadata+topic string. The DoD says "non-empty description string after each context name, not just metadata." The test cannot distinguish a real summary ("OAuth flow analysis with session deep-dive") from a topic tag (`auth`). A 3-character alphabetic string like `"msg"` in `"5 msgs"` satisfies the assertion. ATTACK: emit `summary-ctx (5 msgs) auth` — `auth` satisfies `[a-zA-Z]{3,}`. |
| ctx-ops/Test-6.1/should-report-zero-contexts | Runs `list-all-contexts`, asserts exit 0, asserts output matches `/no contexts\|empty/i`. | F-CTX-MANAGE: zero contexts case | PASS | No attack vector found. |
| ctx-ops/Test-6.6/should-list-golden-context-with-special-indicator | Asserts exit 0, asserts `⭐` OR `golden` in output (OR), asserts context name `golden-ctx` appears. | F-CTX-MANAGE: golden context marked | FAIL | The OR (`hasGoldenStar || hasGoldenLabel`) is technically not banned because both conditions are meaningful, but the combination allows a stub that emits the string "golden: none" plus `golden-ctx` to pass (the word "golden" appears in "golden: none" and the name appears in a separate line). ATTACK: output the label "golden context management" in a section header and list `golden-ctx` as personal — test passes because `hasGoldenLabel` is true and the name appears. The test does not assert that the indicator is on the same line or logically associated with `golden-ctx`. |
| ctx-ops/Test-6.6/should-prevent-golden-context-deletion-without-confirmation | Pre-asserts golden file exists, runs `delete-context` without `--confirm`, asserts non-zero exit, asserts file still exists after. | T-CTX-7: deletion blocked without `--confirm`, file survives | PASS | No attack vector found. |
| ctx-ops/Test-7.1/should-successfully-promote-clean-context | Asserts exit 0, asserts both golden and personal paths exist, asserts content is byte-identical. | T-PROM-1: both files exist, content identical | PASS | No attack vector found. |
| ctx-ops/Test-7.1/should-copy-to-project-golden-directory | Asserts golden path exists, asserts valid JSONL, asserts personal path still exists (not a move). | T-PROM-1: copy not move | PASS | No attack vector found. |
| ctx-ops/Test-7.1/should-preserve-original-personal-context | Captures original content, runs promote, asserts personal path exists, asserts content unchanged. | T-PROM-1: personal original preserved | PASS | No attack vector found. |
| ctx-ops/T-CTX-5/should-reject-promote-when-personal-context-exceeds-100KB | Creates 150-message large file, runs `promote-context`, asserts non-zero exit, asserts output matches `/100kb\|too large/i`. | T-CTX-5: promote blocked at 100KB | PASS | No attack vector found. |
| ctx-ops/Test-7.2/should-detect-secrets-and-warn-block | Uses `GITHUB_TOKEN_CONTEXT` (contains `ghp_` + 36 chars), runs `promote-context`, asserts non-zero exit, asserts output matches `/github\|ghp_/i`. | T-PROM-2: output names GitHub token type | PASS | The fixture contains a real `ghp_abcdefghijklmnopqrstuvwxyz1234567890` (ghp_ + 36 chars). The match requires "github" or "ghp_" — both are specific to GitHub tokens. No attack vector found. |
| ctx-ops/Test-7.3/should-offer-redaction-option | Runs `scan-secrets` on `STRIPE_KEY_CONTEXT`, asserts non-zero exit, asserts output matches `/stripe\|sk_/i`. | T-SEC-3 (applied via promote path) | PASS | Note: this test is named "promote with redaction" but actually tests the `scan-secrets` script directly. It does not test actual redaction or the promote workflow with redaction. See DoD gap for T-PROM-1 redaction path. |
| ctx-ops/Test-7.4/should-error-for-non-existent-context | Asserts non-zero exit, asserts output matches `/not found\|does not exist/i`. | F-CTX-PROMOTE: error on non-existent context | PASS | No attack vector found. |
| ctx-ops/Test-7.5/should-warn-about-already-golden-context | Creates BOTH personal and golden copies, runs `promote-context`, asserts non-zero exit, asserts output matches `/already.*golden\|already exists/i`. | T-PROM-3: setup creates personal only; golden exists to trigger the warning | PASS — but see note | The setup correctly creates both personal and golden (the comment is slightly misleading; both are created so the promote detects a collision). The regex is specific. No attack vector. |
| ctx-ops/T-MEM-1(context-ops)/should-update-MEMORY.md-with-task-id-and-context-name-after-save | Saves context, asserts exit 0, asserts `MEMORY.md` at `personalBase/memory/MEMORY.md` exists, asserts task-id and context-name in content. | T-MEM-1 | PASS | No attack vector found. |
| ctx-ops/T-HOOK-1(context-ops)/should-save-context-to-timestamped-path | Runs `auto-save-context --session-id <id>`, asserts exit 0, asserts `auto-saves/` dir exists, asserts at least one `.jsonl` file in it, asserts valid JSONL. | T-HOOK-1 | FAIL | The test passes `--session-id <id>` as CLI argument to `auto-save-context`. The PRD T-HOOK-1 says the script is triggered by a PreCompact hook via stdin payload `{session_id, ...}`. If the implementation accepts `--session-id` as a CLI flag but does not correctly handle the stdin JSON payload format, this test passes while the real hook integration fails. Additionally, the `sessionId` is `'test-session-abc123'` which is not a UUID and not an actual Claude session file — the implementation cannot actually locate a real session to save. The test only checks that SOME `.jsonl` file exists in `auto-saves/`, which a stub could satisfy by creating an empty-but-valid `[]` JSONL file. The test does not verify the saved content reflects the specified session's messages. |

### File: secret-detection.test.ts

| TEST_ID | DESCRIPTION | DOD_CLAUSE | VERDICT | ATTACK_VECTOR |
|---------|-------------|------------|---------|---------------|
| sec/Test-9.1/should-detect-AWS-access-key-pattern | Runs `scan-secrets` on `AWS_KEY_CONTEXT`, asserts non-zero exit, asserts output matches `/akia/i`. | T-SEC-2: AKIA detected, exit non-zero | PASS | Note: `AWS_KEY_CONTEXT` contains `AKIAIOSFODNN7EXAMPLE` (20 chars = AKIA + 16 chars). The DoD requires `AKIA` + 16 uppercase alphanumeric chars. This fixture has `AKIAIOSFODNN7EXAMPLE` = AKIA + `IOSFODNN7EXAMPLE` (16 chars). Correct. |
| sec/Test-9.1/should-identify-AWS-secret-key-pattern | Same fixture, asserts non-zero exit, asserts output matches `/aws.*key\|secret.*key\|akia/i`. | T-SEC-2 | PASS | OR with three meaningful patterns, all specific to AWS key types. No attack vector. |
| sec/Test-9.2/should-detect-Stripe-live-key-pattern | Runs `scan-secrets` on `STRIPE_KEY_CONTEXT`, asserts non-zero exit, asserts output matches `/sk_live/i`. | T-SEC-3: detects `sk_live_` specifically | PASS | No attack vector found. |
| sec/Test-9.2/should-detect-both-test-and-live-keys | Asserts non-zero exit, asserts output contains BOTH `sk_test_` AND `sk_live_` literally. | T-SEC-3: both `sk_test_` and `sk_live_` detected | PASS | `STRIPE_KEY_CONTEXT` contains both strings. The test uses `.toContain()` for the exact key prefixes. An implementation that detects only one type would fail. |
| sec/Test-9.3/should-detect-GitHub-personal-access-token | Runs `scan-secrets` on `GITHUB_TOKEN_CONTEXT`, asserts non-zero exit, asserts output matches `/ghp_/i`. | T-PROM-2 / GitHub token detection | PASS | No attack vector found. |
| sec/Test-9.4/should-detect-RSA-private-key-header | Runs `scan-secrets` on `PRIVATE_KEY_CONTEXT`, asserts non-zero exit, asserts output matches `/rsa.*private\|private.*key\|BEGIN.*PRIVATE/i`. | F-SEC: private key detection | PASS | The fixture contains a BEGIN RSA PRIVATE KEY block. All three alternatives are specific. |
| sec/Test-9.5/should-detect-password-assignment-patterns | Runs `scan-secrets` on `PASSWORD_CONTEXT`, asserts non-zero exit, asserts output matches `/password/i`. | F-SEC: password detection | FAIL | `PASSWORD_CONTEXT` contains `"password=MySecretPassword123!"` and `"DB_PASSWORD=\"superSecretPwd456\""`. The assertion only checks that `password` appears in output — but the output could contain "No password secrets detected" or "Scanning for passwords..." and still match `/password/i`. ATTACK: emit "No password-class secrets found" in the scanner output and exit 0 — the test would fail because it asserts non-zero exit. But if the scanner emits "Possible password detected" and exits 0 (treating passwords as warnings not errors), the `exitCode` assertion fails. So the non-zero exit IS a guard. However, the pattern `/password/i` is weak: it's present in the input content as well and could appear in an echoed input line rather than a detection result. Combined with non-zero exit the test is borderline. ESCALATE. |
| sec/Test-9.6/should-treat-AKIAIOSFODNN7EXAMPLE-as-true-positive | Creates a fixture containing ONLY the example AWS key, runs `scan-secrets`, asserts non-zero exit, asserts output matches `/akia/i`. | T-SEC-5: AKIAIOSFODNN7EXAMPLE flagged as true positive | PASS | Fixture isolation is correct — only the example key, no other secrets. |
| sec/Test-9.7/should-report-correct-count-of-multiple-secrets | Runs `scan-secrets` on `MULTIPLE_SECRETS_CONTEXT` (5 secrets in one message), asserts non-zero exit, tries to parse count from output via regex, falls back to `\b5\b` if no count-label found. | T-SEC-7: exactly 5 secrets reported | FAIL | The fallback `expect(output).toMatch(/\b5\b/)` fires when the named-count regex fails, and `\b5\b` matches any output containing the digit 5 as a standalone token — including line numbers, timestamps, or the fixture content itself if echoed. MULTIPLE_SECRETS_CONTEXT has a timestamp `2026-01-18T10:00:00.000Z` — no standalone `5` there. But any output including "scan took 0.5s" or "5 message(s) scanned" would match. The intent of T-SEC-7 is to verify the *count of detected secrets* equals 5, but the fallback pattern matches any incidental `5`. ATTACK: emit `Scanned 5 messages, found 3 secrets` — `\b5\b` matches the message count, not the secret count. |
| sec/Test-9.8/should-detect-secrets-in-user-assistant-and-tool_result-messages | Creates a 3-message context with one secret per message type (user/assistant/tool_result), runs `scan-secrets`, asserts non-zero exit, asserts AKIA/AWS appears, Stripe appears, GitHub appears — each in separate assertions. | T-SEC-4: all three message types scanned | PASS | Each secret type is in a different message type. The three independent assertions require all three to be detected. An implementation that skips `tool_result` would fail the `ghp_\|github` check. |
| sec/Test-9.9/should-produce-clean-valid-JSONL-after-redaction | Runs `redact-secrets` on `AWS_KEY_CONTEXT`, asserts exit 0, asserts redacted file exists, asserts valid JSONL, asserts `scan-secrets` on redacted file exits 0 and output matches `/clean/i`. | T-SEC-6: valid JSONL after redaction, rescan returns clean | PASS | Two-step rescan is a strong check. No attack vector found. |
| sec/Test-9.9/should-remove-or-mask-secrets-in-output | Runs `redact-secrets` on `STRIPE_KEY_CONTEXT`, checks redacted JSONL file exists, asserts valid JSONL, asserts non-empty, asserts original secret `sk_live_abc123def456` absent, asserts REDACTED/\*\*\*/[REMOVED] present. | T-SEC-6 (content) | PASS | The exact original secret string must not appear, and a redaction marker must appear. No attack vector. |
| sec/Test-clean-context/should-report-clean-when-no-secrets-found | Runs `scan-secrets` on `CLEAN_CONTEXT`, asserts exit 0, asserts output matches `/clean/i`. | F-SEC: clean context exits 0 | PASS | No attack vector found. |

### File: claude-md-system.test.ts

| TEST_ID | DESCRIPTION | DOD_CLAUSE | VERDICT | ATTACK_VECTOR |
|---------|-------------|------------|---------|---------------|
| clmd/Test-8.1/should-not-modify-root-CLAUDE.md-during-init | Reads root content after init (already run in beforeEach), asserts it equals original. | T-CLMD-1 | PASS | No attack vector found. |
| clmd/Test-8.1/should-not-modify-root-CLAUDE.md-during-task-creation | Creates two tasks, reads root CLAUDE.md, asserts equals original. | T-CLMD-1 | PASS | No attack vector found. |
| clmd/Test-8.1/should-not-modify-root-CLAUDE.md-during-task-switching | Creates two tasks, runs three `update-import` calls, reads root CLAUDE.md, asserts equals original. | T-CLMD-1 | PASS | No attack vector found. |
| clmd/Test-8.1/should-show-no-git-changes-to-root-CLAUDE.md | Runs task-create and update-import, asserts root CLAUDE.md does NOT appear in `git status` (with careful line-matching for `.claude/` exclusion). | T-CLMD-1 (via git status) | PASS | No attack vector found. |
| clmd/Test-8.2/should-create-.claude-CLAUDE.md-on-init | Asserts `.claude/CLAUDE.md` exists (already created in beforeEach). | T-INIT-1 (structural proxy) | PASS | No attack vector found. |
| clmd/Test-8.2/should-contain-@import-directive | Reads `.claude/CLAUDE.md`, asserts matches `/@import\s+\S+CLAUDE\.md/`. | T-CLMD-2 (partial) | PASS | No attack vector found. |
| clmd/Test-8.2/should-update-on-task-switch | Runs `update-import` for task-1, asserts exit 0, asserts `.claude/CLAUDE.md` matches `/@import\s+\S+task-1\S+CLAUDE\.md/`. | T-SWITCH-1 | PASS | No attack vector found. |
| clmd/Test-8.2/should-contain-exactly-one-@import-after-multiple-switches | Creates task-1 and task-2, runs `update-import` for each, reads `.claude/CLAUDE.md`, counts lines starting with `@import`, asserts count is 1, asserts the import line contains `task-2` and NOT `task-1`. | T-SWITCH-1 / T-CLMD-2: exactly one `@import` line after multiple switches | PASS | This is the strongest T-CLMD-2 test. Counting `@import` lines to be exactly 1 prevents both stack-appending and empty-file bugs. No attack vector found. |
| clmd/Test-8.3/should-have-.gitignore-with-CLAUDE.md-entry | Asserts `.gitignore` exists, asserts content matches `^CLAUDE\.md$`. | F-GIT / F-INIT | PASS | No attack vector found. |
| clmd/Test-8.3/should-be-ignored-by-git | Asserts `.claude/CLAUDE.md` exists, calls `isGitIgnored`, asserts true. | T-GIT-1 | PASS | No attack vector found. |
| clmd/Test-8.3/should-not-appear-in-git-status | Commits `.gitignore`, stages `.claude/`, asserts `.claude/CLAUDE.md` NOT in `getGitStatus()`. | T-GIT-1 (via status) | PASS | No attack vector found. |
| clmd/Test-8.4/should-update-import-to-auth-task | Runs `update-import` for auth, asserts content matches auth pattern, asserts `payment` not in content. | T-SWITCH-1 | PASS | No attack vector found. |
| clmd/Test-8.4/should-update-import-to-payment-task | Runs `update-import` for payment, asserts content matches payment pattern, asserts `auth` not in content. | T-SWITCH-1 | PASS | No attack vector found. |
| clmd/Test-8.4/should-update-import-to-default-task | Switches to auth then default, asserts final content matches default pattern. | T-SWITCH-1 (default) | PASS | No attack vector found. |
| clmd/Test-8.5/should-set-up-the-correct-@import-path-for-/resume-to-read | Creates `oauth-work` task, runs `update-import`, reads `.claude/CLAUDE.md`, extracts import path via regex, asserts path contains `oauth-work`, asserts referenced CLAUDE.md file exists on disk. | T-CLMD-2 (structural proxy for T-RESUME-MANUAL) | PASS | The file-existence check makes this a real structural test. No attack vector. |
| clmd/Test-8.6/should-allow-different-task-states | Creates two independent project dirs, each with their own task and `update-import` call, asserts each `.claude/CLAUDE.md` points to their own task, asserts both differ, asserts root content identical. | F-CLMD: multi-developer independence | PASS | No attack vector found. |

### File: git-integration.test.ts

| TEST_ID | DESCRIPTION | DOD_CLAUSE | VERDICT | ATTACK_VECTOR |
|---------|-------------|------------|---------|---------------|
| git/Test-11.1/should-create-.gitignore-during-initialization | Runs `init-project`, asserts `.gitignore` file exists. | F-GIT / F-INIT | PASS | No attack vector found. |
| git/Test-11.1/should-include-CLAUDE.md-in-.gitignore | Reads `.gitignore`, asserts `^CLAUDE\.md$` line present. | T-GIT-1 | PASS | No attack vector found. |
| git/Test-11.2/should-allow-task-CLAUDE.md-to-be-tracked | Creates task, runs `gitAdd` on task CLAUDE.md path, asserts path appears in `getGitStatus()`. | F-GIT: task files trackable | PASS | No attack vector found. |
| git/Test-11.2/should-allow-task-directory-to-be-committed | Creates task, adds `.claude/tasks/`, runs `gitCommit`, asserts no throw. | F-GIT: task directory committable | PASS | No attack vector found. |
| git/Test-11.3/should-allow-golden-context-to-be-tracked | Creates golden context file, runs `gitAdd`, asserts it appears in `getGitStatus()`. | F-GIT: golden context trackable | PASS | No attack vector found. |
| git/Test-11.3/should-commit-golden-context-successfully | Creates golden context, adds `.claude/`, commits, asserts no throw. | F-GIT | PASS | No attack vector found. |
| git/Test-11.4/should-not-include-personal-storage-in-git | Asserts personal storage is outside project dir (structural), runs save-context to create personal file, asserts personal path outside project dir, stages `.` in project dir, asserts `git status` does not contain personal file names. | T-GIT-2: personal storage never in git status | PASS | The structural check (`personalBase.startsWith(projectDir) === false`) is a meaningful prerequisite. The `gitAdd('.')` then checking status is a real git integration. No attack vector found. |
| git/Test-11.5/should-isolate-task-files-between-two-independent-developer-workspaces | Creates two independent projects, each with their own task and golden context, verifies cross-isolation (task from dev-1 not in dev-2 workspace and vice versa), verifies `.claude/CLAUDE.md` not in either git status after commit. | T-GIT-2 (multi-dev isolation) | PASS | No attack vector found. |
| git/Test-11.6/should-recognize-golden-contexts-after-they-exist | Creates golden context, runs `context-list`, asserts exit 0, asserts context name appears. | F-GIT (pull simulation proxy) | ESCALATE | This test does NOT simulate a git pull. It creates the golden file directly in the same workspace. The DoD for F-GIT includes "Team can pull golden contexts via `git pull`" — this is not tested. The test proves that `context-list` can see a golden context that was directly placed; it does not prove that a cloned/pulled repository would correctly expose golden contexts. The test is structurally correct as a listing test but is labelled as a git integration test for a pull scenario, which is unverified. |
| git/Test-11.7/should-not-show-.claude-CLAUDE.md-in-status | Commits `.gitignore`, modifies `.claude/CLAUDE.md`, asserts `.claude/CLAUDE.md` NOT in `getGitStatus()`. | T-GIT-1 via status | PASS | No attack vector found. |
| git/Test-11.7/should-be-ignored-by-git-check-ignore | Commits `.gitignore`, calls `isGitIgnored` for `.claude/CLAUDE.md`, asserts true. | T-GIT-1 | PASS | No attack vector found. |

### File: error-handling.test.ts

| TEST_ID | DESCRIPTION | DOD_CLAUSE | VERDICT | ATTACK_VECTOR |
|---------|-------------|------------|---------|---------------|
| err/Test-13.1/should-handle-missing-.claude-directory-gracefully | Runs `task-create` without prior init, asserts non-zero exit, asserts output contains `init`/`not initialized`, asserts no stack trace in stderr. | T-ERR-1: not-initialized error without stack trace | PASS | No attack vector found. |
| err/Test-13.1/should-suggest-running-init | Runs `update-import` without init, asserts non-zero exit, asserts output matches `/init/i`. | T-ERR-1 | PASS | No attack vector found. |
| err/Test-13.2/should-handle-missing-.claude-directory-on-task-operations | Creates task, deletes `.claude/`, runs `task-list`, asserts non-zero exit, asserts output matches `/not.*initialized\|run init/i`. | T-ERR-1 (mid-operation deletion) | PASS | No attack vector found. |
| err/Test-13.3/should-detect-corrupt-JSONL | Runs `scan-secrets` on a file with two lines of invalid JSON, asserts non-zero exit, asserts no stack trace, asserts output contains error indicator. | T-ERR-2: `scan-secrets` on malformed JSONL exits non-zero | PASS | No attack vector found. |
| err/Test-13.3/should-not-crash-on-invalid-JSON-in-context | Runs `scan-secrets` on `{"incomplete":`, asserts non-zero exit, asserts no stack trace. | T-ERR-2 | PASS | No attack vector found. |
| err/Test-13.5/should-handle-invalid-metadata-gracefully | Creates valid JSONL with invalid `.meta.json` alongside it, runs `context-list`, asserts exit 0 (context-list skips non-JSONL), asserts no stack trace. | F-ERR: corrupt metadata does not crash listing | PASS | No attack vector found. |
| err/Test-13.6/should-handle-permission-errors-gracefully | Makes `.claude/tasks/` read-only, tries `task-create`, asserts non-zero exit, asserts output contains `permission`/`access`/`denied`. Test is skipped if `chmod` fails. | F-ERR: permission errors handled gracefully | ESCALATE | The test uses `try/catch` on `chmod` and returns early if chmod fails. On macOS running as the file owner with SIP disabled, chmod of a directory succeeds but child writes inside it by scripts running as the same user may still succeed (directory read-only prevents creation of new entries, not reads). The test has a `finally` block to restore permissions. However, the conditional early-return means this test is entirely silently skipped on some CI environments, producing false coverage. The actual DoD clause for permission errors does not have a specific AC number — it is advisory. ESCALATE due to conditional skip risk. |
| err/Input-Validation/should-validate-task-ID-format | Iterates 6 invalid task IDs, for each asserts non-zero exit and output matching `/invalid.*(name\|task\|id)\|uppercase\|lowercase/i`. | T-TASK-2 (extended) | PASS | No attack vector found. |
| err/Input-Validation/should-validate-context-name-format | After creating a valid task, iterates 3 invalid context names, for each asserts non-zero exit and matching output. | F-CTX-SAVE: name validation | FAIL | The test calls `runScript('save-context', ['valid-task', name, 'personal'], ...)` — note the third argument is the string `'personal'` (not `'--personal'`). Whether the script interprets a bare positional `personal` as the `--personal` flag or as a third argument depends on the script's argument parsing. If `save-context` requires `--personal` as a flag and rejects the bare string `personal`, the script may exit non-zero for a different reason (wrong argument count) than invalid name validation. The test then asserts the error message matches `/invalid.*(name\|task\|id)\|uppercase\|lowercase/i` — but if the error is "unknown argument 'personal'" instead, the test would fail on the error message check, catching the bug. However, if the script silently ignores the extra positional argument and exits non-zero because the context name contains spaces/special chars, the test passes for the wrong reason on the empty-string case. ESCALATE for the argument-passing inconsistency. |
| err/Graceful-Degradation/should-provide-helpful-error-for-non-existent-task | Runs `context-list` on non-existent task, asserts non-zero exit, asserts output matches `/not found\|does not exist/i`. | F-ERR: graceful degradation | PASS | No attack vector found. |
| err/Graceful-Degradation/should-provide-helpful-error-for-non-existent-context | Runs `promote-context` on non-existent context name, asserts non-zero exit, asserts output matches `/not found\|does not exist/i`. | F-ERR: graceful degradation | PASS | No attack vector found. |
| xplat/Test-12.4/should-handle-paths-with-spaces | Creates a subdir with a space in the name, runs `init-project`, `task-create`, and `update-import` all targeting the spaced path, asserts exit 0 and file existence for each. | T-ERR-3: all operations succeed on paths with spaces | PASS | No attack vector found. |
| xplat/Test-12.6/should-create-JSONL-with-consistent-line-endings | Saves a context, reads all `.jsonl` files in personal contexts dir, asserts no CRLF sequences. | F-XPLAT: LF line endings | PASS | No attack vector found. |
| xplat/Test-12.7/should-use-LF-line-endings-in-generated-files | Runs `task-create` with unusual argument order (`'--golden', 'Task'` as description — see note), checks `.gitignore` and task CLAUDE.md for no CRLF. | F-XPLAT: LF line endings | FAIL | The `task-create` call passes `['--golden', 'Task']` as the description — the first element is `--golden` which is a flag, not a description word. This appears to be a copy-paste bug from another test. If `task-create` treats `--golden` as an invalid name segment or description flag, the task creation may fail or produce unexpected behavior. The test proceeds to check file content regardless of exit code. The test does NOT assert exit code, so a failed `task-create` (which creates no files) means `expect(fileExists(filePath)).toBe(true)` fails, which catches the bug. However, the intent was to test line endings, and the test may always fail due to the wrong arguments — making this test unreliable rather than wrong. ESCALATE. |

### File: new-features.test.ts

| TEST_ID | DESCRIPTION | DOD_CLAUSE | VERDICT | ATTACK_VECTOR |
|---------|-------------|------------|---------|---------------|
| new/T-CTX-5/should-reject-promote-when-personal-context-exceeds-100KB | Creates large context (150 messages × ~1KB each), runs `promote-context`, asserts non-zero exit, asserts output matches `/100kb\|too large/i`. | T-CTX-5 | PASS | Duplicate of ctx-ops/T-CTX-5 test — same logic, same verdict. |
| new/T-CTX-6/should-create-a-.backup--file-when-saving-to-an-existing-name | Saves same name twice, captures original content after first save, asserts `.backup-` file exists after second save, asserts backup content equals original. | T-CTX-6 | PASS | No attack vector found. Duplicate of ctx-ops/T-CTX-6. |
| new/T-HOOK-1/should-create-a-timestamped-auto-save-file | Plants a real UUID-named session file in personal dir, creates a JSON payload file, runs `auto-save-context` via `execSync` with stdin redirected from the payload file, asserts exit 0, asserts `auto-saves/` dir exists, asserts at least one `.jsonl` file in it, asserts valid JSONL. | T-HOOK-1: timestamped `.jsonl` created in flat `auto-saves/` dir | FAIL | This test is stronger than the ctx-ops variant because it uses stdin redirection with a real JSON payload, but it has three problems: (1) It imports `require('path')` via dynamic `await import` inside `execSync` — the script path is assembled as `join(ctx.projectDir, '../../scripts/auto-save-context.ts')` which is a relative path that may not resolve correctly depending on test working directory. (2) The `sessionId` is a UUID-format string but the planted session file at `join(ctx.personalDir, sessionId + '.jsonl')` may not be found by `auto-save-context` unless the script knows to look in `personalDir` — if the script uses `CLAUDE_HOME` env var to find personal dir, the env is set correctly. (3) The test only asserts that SOME `.jsonl` file exists and is valid JSONL — it does NOT assert the content reflects the planted session. A stub that creates an empty `[]` file passes. ATTACK: auto-save-context creates `auto-saves/timestamp.jsonl` containing `[]` (empty JSONL array) — test passes. |
| new/T-MEM-1/should-add-task-id-and-context-name-to-personal-MEMORY.md-after-save | Saves context, uses `waitFor` to poll up to 5 seconds for `MEMORY.md` to appear, asserts content contains task-id and context-name. | T-MEM-1 | PASS | The `waitFor` handles async writes. Task-id and context-name are specific strings. No attack vector found. |

---

## Section 2: DoD Coverage Gaps

### T-INIT-1
Tests: init/Test-1.1/should-create-.claude-directory-structure, init/Test-1.2/should-create-.claude-CLAUDE.md-with-@import-directive, clmd/Test-8.2/should-contain-@import-directive
Coverage: ADEQUATE

### T-INIT-2
Tests: init/Test-1.2/should-create-backup-of-original-CLAUDE.md
Coverage: ADEQUATE

### T-INIT-3
Tests: init/Test-1.2/should-create-default-task-with-copy-of-original-CLAUDE.md
Coverage: ADEQUATE

### T-INIT-4
Tests: init/Test-1.3 (all four idempotency tests)
Coverage: ADEQUATE

### T-INIT-5
Tests: init/Test-1.5/should-handle-multiple-projects-independently
Coverage: ADEQUATE

### T-TASK-1
Tests: task/Test-2.1 (four tests)
Coverage: ADEQUATE

### T-TASK-2
Tests: task/Test-2.2 (four tests)
Coverage: ADEQUATE

### T-TASK-3
Tests: task/Test-2.3/should-capture-full-multi-line-description
Coverage: ADEQUATE

### T-TASK-4
Tests: task/Test-2.4/should-reject-empty-description
Coverage: ADEQUATE

### T-SWITCH-1
Tests: clmd/Test-8.2/should-contain-exactly-one-@import-after-multiple-switches, task/Test-3.6/should-update-.claude-CLAUDE.md-on-each-switch, clmd/Test-8.4 (three tests)
Coverage: ADEQUATE

### T-SWITCH-2
Tests: task/Test-3.4/should-indicate-no-contexts-available-and-offer-fresh-start
Coverage: ADEQUATE

### T-SWITCH-3
Tests: task/Test-3.3 (two tests), task/Test-3.1/should-list-personal-contexts-when-switching
Coverage: ADEQUATE for ordering. The Test-3.2 (golden-only) has a FAIL verdict — it does not assert that `personal` is absent when only golden contexts exist, allowing an implementation that always emits a `Personal contexts:` header to pass.
Gap: Test-3.2 does not assert the absence of a personal-contexts section when no personal contexts exist; a spurious empty personal section is invisible to this test.

### T-CTX-1
Tests: ctx-ops/Test-4.1/should-save-context-to-personal-storage, ctx-ops/Test-4.1/should-not-save-to-project-.claude-directory-for-personal
Coverage: ADEQUATE

### T-CTX-2
Tests: ctx-ops/Test-4.1/should-create-valid-JSONL-file
Coverage: ADEQUATE

### T-CTX-3
Tests: ctx-ops/Test-4.2/should-block-golden-save-when-session-contains-a-real-AWS-key
Coverage: INADEQUATE
Gap: T-CTX-3 is satisfied for the AWS key case, but `save-context --golden` with a Stripe or GitHub token is not independently tested at the save path — only `scan-secrets` and `promote-context` cover those types. An implementation that blocks only AWS keys at the `save-context --golden` path while passing Stripe/GitHub keys would satisfy the existing tests.

### T-CTX-4
Tests: ctx-ops/Test-4.5/should-reject-golden-save-when-context-exceeds-100KB
Coverage: ADEQUATE

### T-CTX-5
Tests: ctx-ops/T-CTX-5, new/T-CTX-5 (duplicate)
Coverage: ADEQUATE

### T-CTX-6
Tests: ctx-ops/T-CTX-6, new/T-CTX-6 (duplicate)
Coverage: ADEQUATE

### T-CTX-7
Tests: ctx-ops/Test-6.6/should-prevent-golden-context-deletion-without-confirmation
Coverage: ADEQUATE

### T-LIST-1
Tests: ctx-ops/Test-5.1/should-list-all-contexts-for-task (FAIL — conditional ordering check), ctx-ops/Test-5.4/should-show-both-personal-and-golden-sections (PASS)
Coverage: INADEQUATE
Gap: The primary T-LIST-1 test (Test-5.1) uses a conditional ordering check that fires only when both personal and golden indices are found; since that test only has personal contexts, the ordering is never checked there. Coverage is rescued by Test-5.4, but the Test-5.1 ordering check is dead code.

### T-LIST-2
Tests: ctx-ops/Test-5.1/should-show-message-counts
Coverage: ADEQUATE

### T-LIST-3
Tests: ctx-ops/Test-5.3/should-indicate-no-contexts-found
Coverage: ADEQUATE

### T-LIST-4
Tests: ctx-ops/Test-5.6/should-display-non-empty-non-metadata-string-after-context-name (FAIL)
Coverage: INADEQUATE
Gap: The test accepts any 3-character alphabetic token after the context name as a "summary," which allows a topic tag or metadata word to satisfy the assertion without an actual AI-generated summary.

### T-MEM-1
Tests: ctx-ops/T-MEM-1(context-ops), new/T-MEM-1
Coverage: ADEQUATE

### T-PROM-1
Tests: ctx-ops/Test-7.1 (three tests)
Coverage: ADEQUATE

### T-PROM-2
Tests: ctx-ops/Test-7.2/should-detect-secrets-and-warn-block
Coverage: ADEQUATE

### T-PROM-3
Tests: ctx-ops/Test-7.5/should-warn-about-already-golden-context
Coverage: ADEQUATE

### T-CLMD-1
Tests: clmd/Test-8.1 (four tests), init/Test-1.2/should-not-modify-root-CLAUDE.md
Coverage: ADEQUATE

### T-CLMD-2
Tests: clmd/Test-8.2/should-contain-exactly-one-@import-after-multiple-switches
Coverage: ADEQUATE

### T-RESUME-MANUAL
Tests: clmd/Test-8.5/should-set-up-the-correct-@import-path-for-/resume-to-read (structural proxy only)
Coverage: INADEQUATE by design — the PRD explicitly designates this as a manual test. The automated proxy is reasonable but does not verify Claude Code's actual behavior on `/resume`.
Gap: No automated verification that Claude Code re-reads `.claude/CLAUDE.md` on resume; this is documented as untestable without a live Claude Code instance.

### T-SEC-2
Tests: sec/Test-9.1 (two tests)
Coverage: ADEQUATE

### T-SEC-3
Tests: sec/Test-9.2 (two tests), ctx-ops/Test-7.3/should-offer-redaction-option
Coverage: ADEQUATE

### T-SEC-4
Tests: sec/Test-9.8/should-detect-secrets-in-user-assistant-and-tool_result-messages
Coverage: ADEQUATE

### T-SEC-5
Tests: sec/Test-9.6/should-treat-AKIAIOSFODNN7EXAMPLE-as-true-positive
Coverage: ADEQUATE

### T-SEC-6
Tests: sec/Test-9.9 (two tests)
Coverage: ADEQUATE

### T-SEC-7
Tests: sec/Test-9.7/should-report-correct-count-of-multiple-secrets (FAIL)
Coverage: INADEQUATE
Gap: The fallback `\b5\b` pattern matches any output containing a standalone `5`, including message counts, line numbers, or other incidental numeric tokens; an implementation reporting "3 secrets" in 5 messages would still pass.

### T-ERR-1
Tests: err/Test-13.1 (two tests), err/Test-13.2
Coverage: ADEQUATE

### T-ERR-2
Tests: err/Test-13.3 (two tests)
Coverage: ADEQUATE

### T-ERR-3
Tests: xplat/Test-12.4/should-handle-paths-with-spaces
Coverage: ADEQUATE

### T-GIT-1
Tests: init/Test-1.1/should-work-with-git-initialized, clmd/Test-8.3 (three tests), git/Test-11.7 (two tests)
Coverage: ADEQUATE

### T-GIT-2
Tests: git/Test-11.4/should-not-include-personal-storage-in-git, git/Test-11.5
Coverage: ADEQUATE

### T-HOOK-1
Tests: ctx-ops/T-HOOK-1(context-ops) (FAIL), new/T-HOOK-1 (FAIL)
Coverage: INADEQUATE
Gap: Both hook tests do not verify that the auto-saved file contains the session's actual messages; a stub that creates an empty valid JSONL satisfies both tests.

### F-SUMMARY (AI-Generated Summaries) — No automated AC
Tests: ctx-ops/Test-5.6 (T-LIST-4 proxy — FAIL)
Coverage: MISSING for core behaviors (summary length 2-3 sentences, summary stored in .meta.json, summary quality reflects context content)
Gap: No test verifies that `save-context` writes a `.meta.json` file with a `summary` field, that the summary has meaningful length, or that the summary is derived from the context content rather than being a placeholder string.

### F-CTX-MANAGE / Stale & Duplicate Detection
Tests: ctx-ops/Test-6.1 (no contexts), ctx-ops/Test-6.6 (golden indicator + deletion protection)
Coverage: MISSING for stale/duplicate detection
Gap: No test verifies that `context-manage` (or equivalent) identifies contexts older than 60 days as stale, identifies duplicate content, or presents cleanup recommendations. Tests 6.2, 6.3, 6.4, 6.5 from the test plan specification have no corresponding implementation in the test files.
