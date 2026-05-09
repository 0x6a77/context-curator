# Test Inventory — Context Curator
**Adversary Run:** 2026-05-09 (LoD2)
**PRD Version:** 20.1 (v21.0 per version history)
**Risk Acceptances loaded:** RA-001 (ACCEPTED, expires 2026-09-12), RA-002 (ACCEPTED, expires v2.0-release)
**Isolation note:** F-PROCESS (prd-process-status.ts + process-sequencing.test.ts) was implemented in the same session as this evaluation. STRICT isolation is compromised for T-PROC-1 through T-PROC-6. Structural heuristics applied mechanically; confirmation bias cannot be excluded.

---

## Section 1: Test Inventory

| TEST_ID | DESCRIPTION | AC_CLAUSE | COVERAGE_RATIONALE | VERDICT |
|---------|-------------|-----------|-------------------|---------|
| initialization.test.ts:T-INIT-1/"should create .claude/CLAUDE.md with @import directive" | Runs init-project on a project with existing CLAUDE.md; pre-asserts .claude/CLAUDE.md does not exist; then asserts it exists with @import pointing specifically to tasks/default/CLAUDE.md and the imported path resolves on disk. | T-INIT-1: `init-project` creates `.claude/CLAUDE.md` containing an `@import` line; the file must not exist before the script runs | Pre-condition guards the negative assertion. Import path is specifically verified to contain `tasks/default/CLAUDE.md`. Imported path verified to exist on disk. Satisfies the AC clause. | PASS |
| initialization.test.ts:T-INIT-2/"should create backup of original CLAUDE.md" | Pre-asserts backup does not exist. Runs init-project. Asserts backup exists at stash path and content is byte-for-byte equal to original. | T-INIT-2: `init-project` copies root `CLAUDE.md` byte-for-byte to the stash path; backup must not exist before script runs | Pre-condition check prevents self-fulfilling setup. `expect(backupContent).toBe(originalContent)` is byte-exact. Satisfies the AC clause. | PASS |
| initialization.test.ts:T-INIT-3/"should create default task with copy of original CLAUDE.md" | Pre-asserts default task path does not exist. Runs init-project. Asserts default task path exists and `defaultContent === originalContent`. | T-INIT-3: `.claude/tasks/default/CLAUDE.md` content equals root `CLAUDE.md` character-for-character | Pre-condition eliminates vacuity. `expect(defaultContent).toBe(originalContent)` is character-exact. Satisfies the AC clause. | PASS |
| initialization.test.ts:T-INIT-4/"should produce identical files on second run and not duplicate stash" | Runs init-project twice; asserts both exit 0; asserts .claude/CLAUDE.md content identical between runs; asserts stash directory has exactly 1 CLAUDE file (no duplication on re-init). | T-INIT-4: Running `init-project` twice exits 0 both times and produces identical file contents | Both exit codes checked. Content identity asserted. Stash file count capped at 1 (idempotency). Satisfies the AC clause. | PASS |
| initialization.test.ts:T-INIT-5/"should handle multiple projects independently" | Creates two test contexts; uses save-context through the implementation (not direct file creation) to place a context in project 1; asserts context exists in project 1 personal storage and is absent from project 2. | T-INIT-5: Writing a file to project A's personal dir does not make it visible in project B's personal dir | Calls `save-context` through the implementation rather than `createJsonl`, preventing false positives from path arithmetic. Explicitly checks project 2 path is absent. Satisfies the AC clause. | PASS |
| initialization.test.ts:T-INIT-6/"should create prod-mgmt/risk-acceptances.md containing DISPOSITION and EXPIRY" | Runs init-project; asserts file exists; asserts DISPOSITION and EXPIRY strings are present. | T-INIT-6: `init-project` creates `prod-mgmt/risk-acceptances.md`; the file contains the string "DISPOSITION" and the string "EXPIRY" | Both required strings asserted. Companion test also checks RA_ID. Satisfies the AC clause. | PASS |
| initialization.test.ts:T-INIT-7 | `.todo` — no test code. | T-INIT-7: `--project-install` creates `.claude/skills/context-curator/` with five skill directories each containing `SKILL.md` and `scripts/` | No test code exists. Feature not yet implemented. | ESCALATE |
| initialization.test.ts:T-INIT-8 | `.todo` — no test code. | T-INIT-8: After project-scope install, `/context-save` resolves to project-scope skill, not user-scope skill | No test code exists. Feature not yet implemented. | ESCALATE |
| initialization.test.ts:T-INIT-9 | `.todo` — no test code. | T-INIT-9: Cloned repo with `.claude/skills/context-curator/` committed has all five slash commands available without running `install.sh` | No test code exists. Feature not yet implemented. | ESCALATE |
| task-operations.test.ts:Test 2.1/"should create task CLAUDE.md with description" | Runs task-create; asserts exit 0; asserts all four section headers via regex; extracts Focus section and asserts description keyword appears within that section, not just anywhere in the file. | T-TASK-1: task-create produces a CLAUDE.md with all required section headers (`# Task: <taskId>`, `## Focus`, `## Key Areas`, `## Guidelines`) and the description keyword appears under the `## Focus` section | All four headers verified via independent regexes. Focus section extracted by slice between `## Focus` and next `##`. Description keyword asserted within that slice. Satisfies the AC clause. | PASS |
| task-operations.test.ts:Test 2.2/"should reject task name with uppercase" | Runs task-create with `OAuthRefactor`; asserts non-zero exit; asserts neither original-case nor lowercase directory created. | T-TASK-2: task-create exits non-zero and creates no directory for a task name containing uppercase letters | Non-zero exit asserted. Both case variants explicitly checked absent. Satisfies the AC clause. | PASS |
| task-operations.test.ts:Test 2.3/"should capture full multi-line description" | Runs task-create with four-line description; extracts Focus section; asserts each of the four verbatim lines with `toContain()`. | T-TASK-3: A four-line description has all four lines preserved verbatim in the Focus section | All four literal lines asserted within the Focus section specifically. A keyword-rewriting implementation would fail. Satisfies the AC clause. | PASS |
| task-operations.test.ts:Test 2.4/T-TASK-4 | Runs task-create with empty description; asserts non-zero exit; asserts task directory absent. | T-TASK-4: task-create exits non-zero and creates no directory when given empty description | Non-zero exit and directory absence both asserted. Satisfies the AC clause. | PASS |
| task-operations.test.ts:T-SWITCH-1/"T-SWITCH-1: .claude/CLAUDE.md must contain exactly one @import pointing to the selected task after each switch" | Runs update-import for A→B→C→A; after each switch asserts `importLines.length === 1` and import contains the target task name. | T-SWITCH-1: After switching tasks A→B→C→A, `.claude/CLAUDE.md` contains **exactly one** `@import` line on each switch, pointing to the selected task's `CLAUDE.md` | Four switches; each asserts single @import count and correct target. Satisfies the AC clause. | PASS |
| task-operations.test.ts:Test 3.4/T-SWITCH-2 | Runs `task-list empty-task`; asserts exit 0; asserts output matches `/no contexts|\bfresh\b/i`. | T-SWITCH-2: When a task has no saved contexts, `context-list` exits 0 and output contains "no contexts" or the word "fresh" as a complete word | AC specifies `context-list`; test runs `task-list`. These are distinct scripts in the codebase — `context-list` appears in T-SWITCH-4/5 and T-LIST-* tests with different behavior. Running the wrong script means the AC clause is not covered. | FAIL |
| task-operations.test.ts:Test 3.3/T-SWITCH-3 | Runs `task-list mixed-work`; asserts personal-1, personal-2, and golden-1 all present; asserts `personal-1` index < `golden-1` index; asserts section labels. | T-SWITCH-3: When a task has both personal and golden contexts, all context names appear in output with personal contexts listed before golden contexts | Specific context names present; ordering verified by index comparison on specific names (not generic section headers). Satisfies the AC clause. | PASS |
| task-operations.test.ts:T-SWITCH-4/"T-SWITCH-4: context-list --json returns empty contexts array even when UUID sessions exist" | Plants UUID session files; runs `context-list sessions-task --json`; parses JSON; asserts `data.contexts.toEqual([])` and `data.sessions.length > 0`. | T-SWITCH-4: `context-list --json` for a task with active sessions but no saved contexts returns `contexts: []` (empty array) — session UUIDs must never appear in the `contexts` field | Sessions field confirmed non-empty (proves sessions exist). Contexts field asserted empty. Separation between sessions and contexts verified. Satisfies the AC clause. | PASS |
| task-operations.test.ts:T-SWITCH-5/"T-SWITCH-5: human-readable output does not show UUID sessions under Personal or Golden contexts sections" | Runs `context-list sessions-task`; asserts "sessions" present; asserts "personal contexts" and "golden contexts" absent; asserts no numbered UUID pattern. | T-SWITCH-5: When `contexts` is empty, the switch UI displays a "no contexts" message and does NOT present UUID session files as numbered selectable options | "Personal contexts" and "golden contexts" labels must be absent. Numbered UUID pattern explicitly checked absent. Satisfies the AC clause. | PASS |
| task-operations.test.ts:Test 3.5/T-SWITCH-6 | Runs `update-import default`; asserts exit 0; asserts output matches `/vanilla|restored/`; asserts @import points to `default/CLAUDE.md`; asserts does not contain `some-task`. | T-SWITCH-6: Switching to `default` task sets `@import` to point to `default/CLAUDE.md` and script output confirms the switch (e.g. "vanilla" or "restored") | Both behavioral requirements verified: text output confirms switch AND @import verified structurally. Cross-contamination from previous task also asserted absent. Satisfies the AC clause. | PASS |
| context-operations.test.ts:Test 4.1/"should save context to personal storage" | Plants session; runs save-context --personal; asserts exit 0; checks explicit path `<personalDir>/tasks/save-test/contexts/my-work.jsonl` exists and is valid JSONL. | T-CTX-1: `save-context --personal` creates file at exactly `<personalDir>/tasks/<task-id>/contexts/<name>.jsonl` | Exact path checked. JSONL validity verified. No conditional guard on the existence check. Satisfies the AC clause. | PASS |
| context-operations.test.ts:Test 4.1/"should create valid JSONL file" | Plants session; runs save-context --personal; asserts exit 0; file exists (unconditional); JSONL valid; content non-empty. | T-CTX-2: Saved context file parses as valid JSONL — asserted unconditionally, not inside an `if (fileExists)` guard | `fileExists` assertion comes first, unconditionally. JSONL validity asserted after. Non-empty check prevents vacuous pass on empty file. Satisfies the AC clause. | PASS |
| context-operations.test.ts:Test 4.2/"should block golden save when session contains a real AWS key" | Tests Stripe, GitHub, and AWS key fixtures separately; each: non-zero exit; output names specific type; golden file explicitly absent. | T-CTX-3: `save-context --golden` on a session with a real AWS key exits non-zero or produces a prompt; exit 0 with no prompt is a failure | Three distinct secret types covered. Exit code specific (not a vacuous OR). Golden file absence verified for each. Type-specific output asserted (not just generic "secret"). Satisfies the AC clause. | PASS |
| context-operations.test.ts:Test 4.5/"should reject golden save when context exceeds 100KB" | `statSync.size > 100*1024` pre-asserted before running script; non-zero exit; output matches `/100KB|too large/i`; golden file absent. | T-CTX-4: `save-context --golden` on a 150KB session exits non-zero with output containing "100KB" or "too large" | Size pre-condition prevents the script from hitting a different error. Error message terms specific. File absence verified. Satisfies the AC clause. | PASS |
| context-operations.test.ts/new-features.test.ts:T-CTX-5 | 150-message fixture; `statSync.size > 100_000` pre-asserted; non-zero exit; output contains `100kb|too large`; golden file absent. | T-CTX-5: `promote-context` on a 150KB personal context exits non-zero with output containing "100KB" or "too large" | Pre-condition prevents vacuous exit from unrelated error. Two test files provide duplicate coverage. Satisfies the AC clause. | PASS |
| context-operations.test.ts:T-CTX-6/"should create a backup file when saving to an existing name" | Saves same-named context twice; captures original content; asserts backup file exists (`includes('dup-ctx') && includes('.backup-')`); asserts backup content equals original. | T-CTX-6: `save-context` called twice with the same name creates a `.backup-` file; the backup contains the original content | `backupFiles.length >= 1` asserted. Content byte-equality verified. Satisfies the AC clause. | PASS |
| context-operations.test.ts:T-MANAGE-1 | Runs list-all-contexts with two tasks having contexts; asserts both context names and both task names appear in stderr. | T-MANAGE-1: `list-all-contexts` exits 0 and output includes context names from at least 2 different tasks when such contexts exist across tasks | Both specific names verified. Task names also verified. Distinguishes between task-list (which only shows one task) and list-all. Satisfies the AC clause. | PASS |
| context-operations.test.ts:T-MANAGE-2 | Sets mtime to 31 days ago via `utimesSync`; runs list-all-contexts; finds line containing `old-ctx`; asserts "stale" on that line. | T-MANAGE-2: `list-all-contexts` marks a context as stale when its last-modified timestamp is > 30 days old | mtime manipulation explicit. "Stale" required on the same line as the context name (not adjacent but separate line). Satisfies the AC clause. | PASS |
| context-operations.test.ts:T-MANAGE-3 | Creates two files with identical byte content; runs list-all-contexts; finds lines for each file; asserts "duplicate" on both lines. | T-MANAGE-3: `list-all-contexts` identifies two byte-for-byte identical context files as duplicates | Both files must be labeled. "Duplicate" required on each context's line. Byte-for-byte identity is the comparison criterion. Satisfies the AC clause. | PASS |
| context-operations.test.ts:T-MANAGE-4 | Runs delete-context --dry-run; asserts exit 0; asserts context name in output; asserts file still exists. | T-MANAGE-4: `delete-context --dry-run` exits 0, prints what would be deleted (context name appears in output), and does NOT delete the file | All three requirements verified: exit 0, name in output, file intact. Satisfies the AC clause. | PASS |
| context-operations.test.ts:T-MANAGE-5 | Runs rename-context; asserts exit 0; old path absent; new path valid JSONL and non-empty. | T-MANAGE-5: `rename-context <task-id> <old-name> <new-name>` exits 0; old path does not exist; new path is a valid non-empty JSONL file | Old path explicitly checked absent. New path valid JSONL. Non-empty check prevents vacuous pass. Satisfies the AC clause. | PASS |
| context-operations.test.ts:T-MANAGE-6 | Runs archive-context; asserts exit 0; original path absent; archives/ path valid JSONL. | T-MANAGE-6: `archive-context <task-id> <context-name>` exits 0; file exists at `contexts/archives/<context-name>.jsonl`; original path does not exist | Archive path is the specific required path. Original path explicitly absent. JSONL validity verified. Satisfies the AC clause. | PASS |
| context-operations.test.ts:Test 6.6/"should prevent golden context deletion without confirmation" | Pre-asserts golden file exists; runs delete-context without --force; asserts non-zero exit; asserts golden file still exists. | T-CTX-7: `delete-context` on a golden context exits non-zero without `--force` flag; the file still exists after the failed attempt | Pre-condition prevents vacuity. Non-zero exit AND file survival both required. Satisfies the AC clause. | PASS |
| context-operations.test.ts:T-PROM-1 | Runs promote-context; asserts exit 0; asserts both personal and golden paths exist; asserts `readFile(goldenPath) === readFile(personalPath)`. | T-PROM-1: After `promote-context`, both personal original and golden copy exist; contents are byte-for-byte identical | Both paths verified to exist. Content byte-equality verified (not just file existence). Satisfies the AC clause. | PASS |
| context-operations.test.ts:Test 7.2/T-PROM-2 | Plants GitHub token context; runs promote-context; asserts non-zero exit; output must match `/ghp_|github token|github pat/i`. | T-PROM-2: `promote-context` on a context with `ghp_` + 36 alphanumeric chars: output names the specific secret type | Explicitly rejects "github" alone as insufficient. Requires token prefix `ghp_` or type label. Satisfies the AC clause. | PASS |
| context-operations.test.ts:T-PROM-3 | Setup creates personal context only; first promotion succeeds (creating golden); second promotion must fail with `/already.*golden|already exists/i`. | T-PROM-3: `promote-context` when golden already exists exits non-zero or warns; setup must create personal context only | Setup creates personal context only (no pre-planted golden). First promotion creates golden legitimately. Second promotion detected and rejected. Satisfies the AC clause. | PASS |
| claude-md-system.test.ts:Test 8.1/"should not modify root CLAUDE.md during task switching" | Runs init + task-create × 2 + update-import × 3; asserts root CLAUDE.md content equals original throughout. | T-CLMD-1: After any task operation, root `CLAUDE.md` content equals its pre-operation content | Multiple operations covering all mutation paths: init, create, switch. Byte-equality against captured pre-operation content. Satisfies the AC clause. | PASS |
| claude-md-system.test.ts:Test 8.2/"should contain exactly one @import after multiple switches" | Runs two task creates + two switches; counts @import lines in .claude/CLAUDE.md; asserts count is 1 and import contains `task-2` not `task-1`. | T-CLMD-2: After two task switches, `.claude/CLAUDE.md` contains exactly one `@import` line | Two distinct switches performed. Import count asserted. Stale import from first task verified absent. Satisfies the AC clause. | PASS |
| (none) | No automated test. Manual test only. | T-RESUME-MANUAL: MANUAL: After `/task <id>` + `/resume <session>`, Claude's response references task CLAUDE.md content | RA-002 active (approved 2026-03-12, expires v2.0-release). | ACCEPTED |
| context-operations.test.ts/new-features.test.ts:T-MEM-1 | Runs save-context; `waitFor(fileExists(memoryPath))` to prevent race; asserts both task-id and context-name in MEMORY.md content. | T-MEM-1: After `save-context`, the file `<personalDir>/memory/MEMORY.md` contains the task-id and context-name saved | `waitFor` prevents race condition on async memory update. Both required strings asserted in content. Satisfies the AC clause. | PASS |
| secret-detection.test.ts:Test 9.1/"should detect AWS access key pattern" | Runs scan-secrets on AWS_KEY_CONTEXT; asserts non-zero exit; output matches `/akia/i`. | T-SEC-2: `scan-secrets` on a file with `AKIA` + 16 uppercase alphanumeric chars exits non-zero; output contains "AWS" or "AKIA" | Non-zero exit required. `/akia/i` is the specific prefix — not a broad "aws" keyword match. Satisfies the AC clause. | PASS |
| secret-detection.test.ts:Test 9.2/"should detect both test and live keys" | Runs scan-secrets on STRIPE_KEY_CONTEXT; asserts non-zero exit; `output.toContain('sk_test_')` AND `output.toContain('sk_live_')`. | T-SEC-3: `scan-secrets` detects both `sk_test_` and `sk_live_`; output names the specific key type | Both prefixes independently asserted (not an OR). Non-zero exit required. Satisfies the AC clause. | PASS |
| secret-detection.test.ts:Test 9.8/"should detect secrets in user, assistant, and tool_result messages" | Inline three-type fixture with one secret per message type; asserts AKIA, sk_test, and ghp_ patterns each appear in output. | T-SEC-4: A context with one secret in user, one in assistant, one in tool_result: all three reported | Three-type inline fixture isolates each message type. Each pattern checked independently. If any type is skipped, its pattern won't appear. Satisfies the AC clause. | PASS |
| secret-detection.test.ts:Test 9.6/"should treat AKIAIOSFODNN7EXAMPLE as a true positive" | Isolated fixture containing only AKIAIOSFODNN7EXAMPLE; asserts non-zero exit; output matches `/akia/i`. | T-SEC-5: `AKIAIOSFODNN7EXAMPLE` is treated as a true positive (scanner prefers false positives over false negatives) | Isolated fixture prevents cross-contamination from other secrets. Policy check is specific and unconditional. Satisfies the AC clause. | PASS |
| secret-detection.test.ts:Test 9.9/"should produce clean valid JSONL after redaction" | Runs redact-secrets; asserts valid JSONL; runs scan-secrets on redacted file; asserts exit 0 with "clean". | T-SEC-6: After `redact-secrets`, every line parses as JSON; a second `scan-secrets` run returns "clean" | Redacted file valid JSONL. Rescan exit 0 with "clean" — satisfies two-part clause. Satisfies the AC clause. | PASS |
| secret-detection.test.ts:T-SEC-7 | Runs scan-secrets on MULTIPLE_SECRETS_CONTEXT (5 secrets); asserts `/\bfound\s+5\s+secret|\b5\s+secrets?\s+found/i`. | T-SEC-7: `scan-secrets` on a context with exactly 5 secrets: output matches `found 5 secret` or `5 secret(s) found` | Proximity-adjacent count assertion prevents "Scanning 5 messages… found 3 secrets" bypass. Both "found N" and "N found" forms covered. Satisfies the AC clause. | PASS |
| secret-detection.test.ts:Test 9.3/"should detect GitHub personal access token" | Runs scan-secrets on GITHUB_TOKEN_CONTEXT; asserts non-zero exit; output matches `/ghp_/i`. | T-SEC-8: `scan-secrets` on a context containing `ghp_` + 36 alphanumeric chars exits non-zero; output contains "ghp_" or "github" | `/ghp_/i` is the specific token prefix. Non-zero exit required. Satisfies the AC clause. | PASS |
| secret-detection.test.ts:Test 9.4/"should detect RSA private key header" | Runs scan-secrets on PRIVATE_KEY_CONTEXT; asserts non-zero exit; output matches `/rsa.*private|private.*key|BEGIN.*PRIVATE/i`. | T-SEC-9: `scan-secrets` on a context containing `-----BEGIN RSA PRIVATE KEY-----` exits non-zero; output matches `rsa.*private`, `private.*key`, or `BEGIN.*PRIVATE` (case-insensitive) | Non-zero exit required. Pattern specific to RSA/private key headers. Satisfies the AC clause. | PASS |
| secret-detection.test.ts:Test 9.5/"should detect password assignment patterns" | Runs scan-secrets on PASSWORD_CONTEXT; asserts non-zero exit; output matches `/password/i`. | T-SEC-10: `scan-secrets` on a context containing `password=<value>` or `PASSWORD=<value>` exits non-zero; output contains "password" (case-insensitive) | Non-zero exit required. Case-insensitive "password" match specific to the pattern type. Satisfies the AC clause. | PASS |
| context-operations.test.ts:T-SUM-1 | Runs save-context; asserts meta.json exists; summary length 20–500 chars; summary contains keyword from SMALL_CONTEXT (authentication/oauth/token/auth). | T-SUM-1: After `save-context`, a `.meta.json` file exists alongside the `.jsonl` with a `summary` string between 20 and 500 characters | Length bounds asserted. Content keyword requirement proves summary is content-derived, not a static placeholder or UUID. Satisfies the AC clause. | PASS |
| context-operations.test.ts:T-SUM-2 | Saves contexts from two clearly different conversations; asserts summaries differ; asserts each summary contains keyword from its source. | T-SUM-2: Two contexts saved from clearly different conversations produce different `summary` strings; each summary must contain at least one keyword from its source conversation content | Summaries verified to differ. Source-domain keywords required (auth terms for SMALL_CONTEXT; database/migration terms for createMediumContext). Satisfies the AC clause. | PASS |
| context-operations.test.ts:T-SUM-3 | Captures session content before save; runs save-context; asserts `contentAfter === contentBefore` byte-exact. | T-SUM-3: After `save-context`, the session source file is byte-for-byte identical to its pre-save snapshot | Pre-save snapshot captured. Byte-exact equality asserted after. Satisfies the AC clause. | PASS |
| git-integration.test.ts:T-GIT-1 | Commits .gitignore; runs `isGitIgnored` which calls `git check-ignore .claude/CLAUDE.md`; asserts exit 0. | T-GIT-1: `git check-ignore .claude/CLAUDE.md` exits 0 in a real git repo after init | .gitignore committed before check (portable behavior). `git check-ignore` must exit 0. Satisfies the AC clause. | PASS |
| git-integration.test.ts:T-GIT-2 | Runs full workflow; stages all project files; iterates git status lines; asserts no line contains `personalPrefix` (absolute path). | T-GIT-2: After a full workflow in a real git repo, `git status --porcelain` does not show any relative path that resolves into the personal storage directory; the personal storage path must be expressed as a relative prefix for this assertion to be non-vacuous | `personalPrefix = ctx.personalDir` is an absolute path (e.g., `/private/tmp/cc-personal-tgit-XXXXX/...`). `git status --porcelain` emits only relative paths. The `not.toContain(personalPrefix)` assertion can never fail — git output can never contain an absolute path. The PRD AC was updated to require the relative-path form explicitly; the test has not been updated to match. | FAIL |
| error-handling.test.ts:T-ERR-1 | Runs task-create without init; asserts non-zero exit; asserts output contains "init" or "not initialized"; asserts no Node.js stack trace patterns. | T-ERR-1: Any script run without init exits non-zero with output containing "initialized" or "init" — not a stack trace | Non-zero exit. Error message vocabulary required. Stack trace pattern explicitly excluded via two regex checks. Satisfies the AC clause. | PASS |
| error-handling.test.ts:T-ERR-2 | Creates malformed JSONL; runs scan-secrets; asserts non-zero exit; asserts no stack trace; asserts error message names the corruption. | T-ERR-2: `scan-secrets` on malformed JSONL exits non-zero (not 0) | Non-zero exit required. No stack trace required. Error message must reference invalid/corrupt/malformed/JSON. Satisfies the AC clause. | PASS |
| error-handling.test.ts:T-ERR-3 | Creates `my project` subdirectory with space in path; runs init-project, task-create, and update-import; asserts each exits 0 AND output files exist. | T-ERR-3: All operations work when project path contains a space; verified by exitCode === 0 AND output file existence | Three operations checked. Both exit code and output file existence verified for each (not exit code alone). Satisfies the AC clause. | PASS |
| doc-authoring.test.ts:T-DOC-1 | `.todo` — no test code. | T-DOC-1: `/prd new-feature` produces a markdown section with all four required elements | No test code exists. Requires Claude Code session harness. | ESCALATE |
| doc-authoring.test.ts:T-DOC-2 | `.todo` — no test code. | T-DOC-2: Auto-invocation triggers on `*prd*.md` filename pattern | No test code exists. Requires Claude Code session harness. | ESCALATE |
| doc-authoring.test.ts:T-DOC-3 | `.todo` — no test code. | T-DOC-3: `/test-plan new` produces document with all mandatory sections | No test code exists. Requires Claude Code session harness. | ESCALATE |
| doc-authoring.test.ts:T-DOC-4 | `.todo` — no test code. | T-DOC-4: `/dev-plan new` produces document with required header format and sections | No test code exists. Requires Claude Code session harness. | ESCALATE |
| doc-authoring.test.ts:T-DOC-5 | `.todo` — no test code. | T-DOC-5: `/prd check-ac` flags vague criteria with rationale; clean PRD produces no flags | No test code exists. Requires Claude Code session harness. | ESCALATE |
| doc-authoring.test.ts:T-DOC-6 | `.todo` — no test code. | T-DOC-6: `test-inventory` skill only loadable when adversary task is active | No test code exists. Requires Claude Code session harness. | ESCALATE |
| marketplace.test.ts:T-MKT-1 | `.todo` — no test code. | T-MKT-1: `install.sh` creates `~/.claude/context-curator-manifest.json`; valid JSON with required bundle keys | No test code exists. | ESCALATE |
| marketplace.test.ts:T-MKT-2 | `.todo` — no test code. | T-MKT-2: Authoring-bundle-only install: `/prd`, `/test-plan`, `/dev-plan`, `/test-inventory` available; `/context-save` not available | No test code exists. Selective bundle install not implemented. | ESCALATE |
| marketplace.test.ts:T-MKT-3 | `.todo` — no test code. | T-MKT-3: Manifest `version` field matches installed `dist/version.json`; mismatch exits non-zero | No test code exists. | ESCALATE |
| marketplace.test.ts:T-MKT-4 | `.todo` — no test code. | T-MKT-4: Custom team manifest with a `custom` bundle is discoverable via `/plugin marketplace list` | No test code exists. | ESCALATE |
| context-operations.test.ts:T-HOOK-1 | Plants UUID session file; passes payload via stdin JSON; runs auto-save-context; asserts timestamped .jsonl in auto-saves/; valid JSONL; non-empty; contains source content string. | T-HOOK-1: `auto-save-context` with a mock stdin payload creates a timestamped `.jsonl` file in the flat `<personalBase>/auto-saves/` directory | Session content pre-planted. Payload passed via stdin (correct hook interface). Saved file validated: exists, valid JSONL, non-empty, contains specific content from source. Satisfies the AC clause. | PASS |
| hooks-monitor.test.ts:T-HOOK-POST-1 | Switches to non-default task; runs postcompact-reinject; asserts exit 0; stdout non-empty; stdout contains task ID. | T-HOOK-POST-1: With a non-default task active, `postcompact-reinject` script outputs a string containing the task ID; output must not be empty | Exit 0, non-empty output, and task ID presence all asserted. Satisfies the AC clause. | PASS |
| hooks-monitor.test.ts:T-HOOK-POST-2 | Leaves default task active; runs postcompact-reinject; asserts exit 0; stdout empty. | T-HOOK-POST-2: With default task active, `postcompact-reinject` script exits 0 and outputs nothing (no injection for default task) | Exit 0 and empty stdout asserted. Satisfies the AC clause. | PASS |
| hooks-monitor.test.ts:T-HOOK-POST-3 | Writes .claude/CLAUDE.md pointing to non-existent task; runs postcompact-reinject; asserts exit 0; stderr matches `/warning|not found/i`. | T-HOOK-POST-3: `postcompact-reinject` with a missing task CLAUDE.md exits 0 (does not fail the session), and stderr contains "warning" or "not found" | Exit 0 (session survival). Warning in stderr. Satisfies the AC clause. | PASS |
| hooks-monitor.test.ts:T-MON-1/"should exit 0 with valid state file — no external modules imported" | Writes monitor state file; runs status-line; asserts exit 0 and non-empty output; infers no network calls from sandboxed exit behavior. | T-MON-1: The status line script reads values from the monitor state file only — no invocations of `claude`, no API calls, no model calls; verified by confirming no network calls are made during script execution | The test comment acknowledges the limitation: "If the script were making network calls, it would hang or fail in a sandboxed env." A script making a quick-failing network call (connection refused) would still exit 0. The AC requires confirming absence of network calls; the test only infers it from exit behavior. No direct network call monitoring (e.g., strace, LD_PRELOAD, or mock network layer) is present. | FAIL |
| hooks-monitor.test.ts:T-MON-2 | Writes state file with known values; runs status-line; asserts output matches `/47/`, `/31k/`, `/0\.18/`, `/2\.1k/`. | T-MON-2: Given a monitor state file with `fillPct: 47.5`, `tokensSinceBaseline: 31000`, `estimatedCost: 0.18`, `burnRatePerMessage: 2100`, and `currentZone: productive`, the status line output matches the pattern `47` and `31k` and `0.18` and `2.1k` | All four field values independently asserted. Specific numeric patterns (not generic `\d+`). Satisfies the AC clause. | PASS |
| hooks-monitor.test.ts:T-MON-3 | Writes state file; runs status-line with `CLAUDE_SESSION_TYPE=headless`; asserts exit 0; stdout empty; stderr empty. | T-MON-3: With `CLAUDE_SESSION_TYPE=headless` set, the status line script exits 0 and produces no stdout or stderr | Both stdout and stderr asserted empty. Exit 0 asserted. Satisfies the AC clause. | PASS |
| hooks-monitor.test.ts:T-MON-4/"should set tokensSinceBaseline = currentTokens when baselineTokens is null" | Writes session JSONL and state with `baselineTokens: null`; runs update-monitor-state; reads state file; asserts `state.tokensSinceBaseline === state.currentTokens`. | T-MON-4: With no checkpoint metadata present, `tokensSinceBaseline` equals `currentTokens` and the status line renders without error | Test verifies only the state-file value. The second half of the AC — "the status line renders without error" — is not tested: `status-line.ts` is never called after update-monitor-state. An implementation could correctly compute `tokensSinceBaseline` but crash status-line.ts on null-baseline input and this test would not catch it. | FAIL |
| hooks-monitor.test.ts:T-MON-5 | Writes state at 65% and 64.9%; runs warn; asserts at 65% stderr contains "degrading" and save suggestion; at 64.9% stderr is empty. | T-MON-5: At 65% fill (mocked via state file), the warning script exits 0 and stderr contains "degrading" or equivalent and a save suggestion; at 64% fill stderr is empty | Boundary test covers exactly the threshold. Specific content checked (degrading + save command). Sub-threshold case produces empty stderr. Satisfies the AC clause. | PASS |
| hooks-monitor.test.ts:T-MON-6 | Writes state at 80% (sentinel=degrading true) and 79.9%; asserts at 80% stderr critical + restart suggestion; at 79.9% degrading but NOT critical. | T-MON-6: At 80% fill (mocked), warning stderr contains "critical" or equivalent and a restart suggestion; at 79% it emits the degrading warning only | Both zone boundaries tested. Critical zone requires restart suggestion specifically. Degrading-only case explicitly excludes "critical". Satisfies the AC clause. | PASS |
| hooks-monitor.test.ts:T-MON-7 | First invocation at 65% sets sentinel; second invocation at 66% with sentinel=true; asserts second stderr empty. | T-MON-7: After firing at 65%, a second invocation at 66% exits 0 and stderr is empty (sentinel suppresses repeat) | Sentinel state verified after first invocation. Second invocation with sentinel explicitly set. Empty stderr required. Satisfies the AC clause. | PASS |
| hooks-monitor.test.ts:T-MON-8 | Sets sentinel=degrading true; runs on-compaction; asserts sentinel cleared; re-crosses 65%; asserts warning fires again. | T-MON-8: After compaction drops fill to 30%, the degrading sentinel is cleared; re-crossing 65% fires the warning again | Three-step sequence: sentinel set → compaction clears → re-entry fires. Sentinel state explicitly verified after compaction. Satisfies the AC clause. | PASS |
| hooks-monitor.test.ts:T-MON-9 | Writes both sentinels=true; runs session-start-hook; reads state; asserts both sentinels false. | T-MON-9: The SessionStart hook clears all zone sentinels; verified by writing sentinels to the state file, running the hook, and asserting both sentinels are false | Both sentinels pre-set. Both asserted false after hook. Satisfies the AC clause. | PASS |
| hooks-monitor.test.ts:T-MON-10 | 15-message JSONL fixture with known token counts; runs update-monitor-state; reads state; asserts `|actual - 255| / 255 <= 0.05`. | T-MON-10: The burn-rate script with a JSONL fixture of 15 messages with known token counts returns a value within 5% of the hand-calculated mean of the last 10 | Token counts derived from content length. Last-10 mean hand-calculated as 255. Tolerance expressed as fraction. Satisfies the AC clause. | PASS |
| hooks-monitor.test.ts:T-MON-11/"estimate-cost --verbose output matches hand-calculated total within 1%" | Writes state with currentTokens=100000; runs estimate-cost --verbose; asserts output matches `/0\.5[0-9]/`; inside `if (match)` guard, asserts 1% tolerance. | T-MON-11: Cost estimation: given a known token count, model name, and rate config file with explicit rates, the cost script output matches hand-calculated expected cost within 1% | The 1% tolerance check is inside `if (match)` guard: `const match = output.match(/Total[:\s~$]+([0-9]+\.[0-9]+)/); if (match) { ... expect(Math.abs(actual - expected) / expected).toBeLessThanOrEqual(0.01); }`. If output format changes and there is no "Total:" line, the guard does not fire and the test passes on the outer `/0\.5[0-9]/` regex alone, which is less precise (matches 0.51 to 0.59). This is a T2 violation — the precise assertion is conditional on format matching. | FAIL |
| hooks-monitor.test.ts:T-MON-12 | Writes session with 380000-char content; pre-writes state with baselineTokens=42000; runs update-monitor-state; asserts `tokensSinceBaseline === 53000` and `currentTokens === 95000`. | T-MON-12: With `baselineTokens: 42000` in checkpoint metadata and current tokens 95000, the state file contains `tokensSinceBaseline: 53000` (not 95000) | Exact delta value asserted (53000). currentTokens also verified (95000). Content length deterministic. Satisfies the AC clause. | PASS |
| hooks-monitor.test.ts:T-MON-13/"concurrent readers never observe a partially-written state file" | Runs 20 subprocess writes and 20 `setImmediate` reads concurrently; asserts parseErrors is empty. | T-MON-13: State file write is atomic: a concurrent reader never observes a partially-written file; verified by running writer and reader in parallel and asserting every read produces valid JSON | 20 subprocess writes are genuine OS-level concurrent processes. However, the 20 reads use `setImmediate(() => { readFileSync(statePath) })` — these are Node.js event-loop callbacks that execute synchronously when the event loop turns. There is no guarantee that `setImmediate` callbacks interleave with subprocess writes at the moment when a write is partially complete. Small content (4000 chars) makes partial writes less likely. The test structure cannot reliably exercise the atomicity guarantee it claims to verify. | ESCALATE |
| adversary.test.ts:T-ADV-3/T-SPEC-1/"should be byte-for-byte identical before and after task-create, update-import, save-context" | Reads isolated DNA path; runs three user task operations; re-reads DNA; asserts `dnaAfter === dnaBefore`. | T-SPEC-1: Read the adversary CLAUDE.md before and after running `task-create`, `update-import`, and `save-context` on user tasks; assert content is byte-for-byte identical across all three operations | Isolated DNA path used (not real system). All three required operations performed. Byte-exact equality asserted. Satisfies the AC clause. | PASS |
| adversary.test.ts:T-ADV-4/T-SPEC-2/"should not create a context file at the adversary personal context path" | Runs save-context with adversary task active; checks `tasks/adversary/contexts/should-not-exist.jsonl` is absent. | T-SPEC-2: `save-context` called with the adversary task active exits non-zero with a clear message; no `.jsonl` file is created at **any path within the adversary task directories** | The test checks only one specific file path: `tasks/adversary/contexts/should-not-exist.jsonl`. The AC requires "any path within the adversary task directories." An implementation that saves to `contexts/temp-output.jsonl` or any other filename would pass the test while violating the AC. Neither `readdirSync` nor a glob check is present. | FAIL |
| adversary.test.ts:T-SPEC-3/"should exit 0 and output a strict-isolation message" | Runs context-list for adversary task; asserts exit 0; isolation message matched; no UUID pattern in output. | T-SPEC-3: `context-list` for the adversary task exits 0; output matches `/strict.isolation\|no contexts.*isolation\|isolation.*no contexts/i`; output does NOT match any UUID pattern | All three requirements verified. UUID pattern explicitly excluded. Satisfies the AC clause. | PASS |
| adversary.test.ts:T-SPEC-4/T-ADV-2/"T-ADV-2: imported path must end with specialized/adversary/CLAUDE.md" | Runs update-import adversary; counts import lines; extracts path; asserts path ends with `specialized/adversary/CLAUDE.md`; resolves path; asserts file exists and contains "ADVERSARY". | T-SPEC-4: `update-import adversary` updates `.claude/CLAUDE.md` to contain exactly one `@import` line; the imported path resolves to a file on disk whose content contains "ADVERSARY" | Exactly one import line asserted. Path end verified. File resolved and verified to exist. Content verified. Satisfies the AC clause. | PASS |
| adversary.test.ts:T-ADV-1/"should exist at specialized path and contain ADVERSARY and STRICT" | Mirrors install.sh step 5 in isolated temp HOME; copies specialized/ directory; asserts `installedPath` exists; content contains "ADVERSARY" and "STRICT". | T-ADV-1: After `./install.sh`, `~/.claude/context-curator/specialized/adversary/CLAUDE.md` exists (asserted unconditionally) and its content contains both "ADVERSARY" and "STRICT" | Unconditional — no skipIf. Runs on every machine. Mirrors the exact install.sh copy step. Both required strings asserted. Satisfies the AC clause. | PASS |
| adversary.test.ts:T-ADV-2/"T-ADV-2: imported path must end with specialized/adversary/CLAUDE.md" | Runs update-import adversary; asserts import path ends with `specialized/adversary/CLAUDE.md`. | T-ADV-2: After `update-import adversary`, `.claude/CLAUDE.md` contains exactly one `@import` line; the imported path ends with `specialized/adversary/CLAUDE.md`; the file at that path exists on disk and contains "ADVERSARY" | Import path suffix verified. File resolved and content verified. Satisfies the AC clause. | PASS |
| adversary.test.ts:T-ADV-3/"should be byte-for-byte identical before and after task-create, update-import, save-context" | (Same test as T-SPEC-1.) Isolated DNA path; three user operations; byte-exact equality. | T-ADV-3: Read adversary DNA content before running `task-create oauth-refactor`, `update-import oauth-refactor`, `save-context test-ctx --personal`; assert adversary DNA content is byte-for-byte identical after all three operations | Same coverage as T-SPEC-1. Satisfies the AC clause. | PASS |
| adversary.test.ts:T-ADV-4/T-SPEC-2/"should not create a context file at the adversary personal context path" | Runs save-context with adversary task active; checks `tasks/adversary/contexts/should-not-exist.jsonl` absent. | T-ADV-4: `save-context` with adversary task active exits non-zero; no `.jsonl` file exists at **any path within the adversary task personal or golden context directories** — not just one specific filename | Same gap as T-SPEC-2. Only `should-not-exist.jsonl` checked. AC requires all paths. An implementation saving to any other filename in the adversary context directories would pass the test while violating the AC. | FAIL |
| prd-development.test.ts:T-PRD-1/"every ### F-XXX section must contain an Acceptance Criteria table with at least one T-XXX row" | Reads live PRD; collects all `### F-XXX` sections; asserts each contains "Acceptance Criteria" and at least one `T-XXX` row; reports all failing section codes. | T-PRD-1: Every feature section in the PRD contains an "Acceptance Criteria" table with at least one row; a feature section with no AC table is a FAIL | Reads the actual live PRD on every CI pass. Missing AC sections reported by code. Runs unconditionally. Satisfies the AC clause. | PASS |
| prd-development.test.ts:T-PRD-2/"no T-XXX code may appear in more than one AC row" | Extracts only AC table rows (not prose); uses Map to count; reports duplicates. | T-PRD-2: Every T-XXX code in the PRD is unique; duplicate T-XXX codes within the document constitute a FAIL | Counts only AC table rows (prevents prose reference matches). Duplicate detection complete. Satisfies the AC clause. | PASS |
| prd-development.test.ts:T-PRD-3/"should create prod-mgmt/risk-acceptances.md containing DISPOSITION, EXPIRY, and RA_ID" | Creates temp project; runs init-project; asserts three required strings present. | T-PRD-3: `prod-mgmt/risk-acceptances.md` contains the strings "DISPOSITION", "EXPIRY", and "RA_ID" after `task-init` | All three strings asserted. Runs through the implementation (not direct file creation). Satisfies the AC clause. | PASS |
| prd-development.test.ts:T-PRD-4/"should have no orphaned T-XXX codes (skipped if test-inventory.md does not exist)" | Reads PRD T-XXX codes into Set; reads inventory T-XXX codes; asserts no orphans; silently skips if inventory absent. | T-PRD-4: `prod-mgmt/test-inventory.md` (when it exists) references only T-XXX codes that appear in the current PRD; orphaned T-XXX codes in the test inventory are a FAIL | The `if (!existsSync(TEST_INVENTORY_PATH)) return` matches the AC clause "when it exists." When present, orphan detection is complete. Satisfies the AC clause. | PASS |
| doc-authoring.test.ts:T-UDOC-1 | `.todo` — no test code. | T-UDOC-1: After `/docs-markdown` runs on a PRD with a new F-XXX feature, skill prompts for section assignment; `feature-section-map.md` updated | No test code exists. Requires Claude Code session harness. | ESCALATE |
| doc-authoring.test.ts:T-UDOC-2 | `.todo` — no test code. | T-UDOC-2: `docs/markdown/toc.md` contains a link to every product section page in `feature-section-map.md` | No test code exists. Requires Claude Code session harness. | ESCALATE |
| doc-authoring.test.ts:T-UDOC-3 | `.todo` — no test code. | T-UDOC-3: `docs/markdown/glossary.md` is non-empty after `/docs-markdown` runs; every Core Concepts term appears | No test code exists. Requires Claude Code session harness. | ESCALATE |
| doc-authoring.test.ts:T-UDOC-4 | `.todo` — no test code. | T-UDOC-4: After `/docs-html` runs, `docs/index.html` exists and contains text of `introduction.md` and `toc.md` | No test code exists. Requires Claude Code session harness. | ESCALATE |
| doc-authoring.test.ts:T-UDOC-5 | `.todo` — no test code. | T-UDOC-5: All generated HTML pages contain at least one `<nav>` element with links to home and glossary | No test code exists. Requires Claude Code session harness. | ESCALATE |
| doc-authoring.test.ts:T-UDOC-6 | `.todo` — no test code. | T-UDOC-6: Generated HTML heading hierarchy does not skip levels | No test code exists. Requires Claude Code session harness. | ESCALATE |
| doc-authoring.test.ts:T-UDOC-7 | `.todo` — no test code. | T-UDOC-7: When `docs/html/style.md` is absent, `/docs-html` writes it with non-empty content containing "color" and "typeface" or "font" | No test code exists. Requires Claude Code session harness. | ESCALATE |
| doc-authoring.test.ts:T-UDOC-8 | `.todo` — no test code. | T-UDOC-8: All `<img>` elements in generated HTML have a non-empty `alt` attribute | No test code exists. Requires Claude Code session harness. | ESCALATE |
| process-sequencing.test.ts:T-PROC-1 | Writes prd.md only; runs prd-process-status; asserts exit 0; valid JSON; `currentPhase === 1`, `nextPhase === 2`, `completedPhases` contains 1. | T-PROC-1: With only `prod-mgmt/prd.md` present, `prd-process-status` exits 0 and outputs valid JSON with `currentPhase` equal to 1 and `nextPhase` equal to 2 | All required assertions present. mtime manipulation not needed here (single-file state). **ISOLATION CAVEAT: test and implementation authored in same session.** | PASS ⚠️ |
| process-sequencing.test.ts:T-PROC-2 | Uses `utimesSync` to set inventory 10s in past and prd at now; asserts `adversaryStale === true`; warnings non-empty with `/stale|adversary/i`. | T-PROC-2: With `test-inventory.md` modified before `prd.md`, output JSON has `adversaryStale === true` and `warnings` is a non-empty array containing a string matching `/stale\|adversary/i` | mtime manipulation explicit and verifiable. Warning content checked. Boolean verified. **ISOLATION CAVEAT.** | PASS ⚠️ |
| process-sequencing.test.ts:T-PROC-3 | Sets prd 10s in past, inventory at now; asserts `adversaryStale === false`; no adversary-stale warning. | T-PROC-3: With `test-inventory.md` modified after `prd.md`, output JSON has `adversaryStale === false` and `warnings` does not contain any adversary-stale warning | Boolean verified. Warning array exhaustively checked via `every()`. **ISOLATION CAVEAT.** | PASS ⚠️ |
| process-sequencing.test.ts:T-PROC-4 | Empty project (no prd.md); runs prd-process-status; asserts non-zero exit; "PRD" in output. | T-PROC-4: With no `prod-mgmt/prd.md` present, `prd-process-status` exits non-zero and stderr or stdout contains the string "PRD" | Non-zero exit required. "PRD" in combined output. **ISOLATION CAVEAT.** | PASS ⚠️ |
| process-sequencing.test.ts:T-PROC-5 | Writes test-plan + dev-plan + tests (no inventory); asserts `currentPhase === 4`, `nextPhase === 5`. | T-PROC-5: With test-plan and dev-plan present but no `test-inventory.md`, output JSON has `currentPhase` equal to 4 and `nextPhase` equal to 5 | Four artifacts present; missing inventory triggers phase 4 detection. Both values verified. **ISOLATION CAVEAT.** | PASS ⚠️ |
| process-sequencing.test.ts:T-PROC-6 | Two cases: PRD-only and full-artifact; asserts all five required fields with type checks; artifacts sub-object verified. | T-PROC-6: Output is always valid JSON with fields `completedPhases` (array), `currentPhase` (number or string), `nextPhase` (number or string), `adversaryStale` (boolean), and `warnings` (array) | Both cases tested. All five fields verified with type assertions. Full-artifact case also checks `artifacts` sub-object. **ISOLATION CAVEAT.** | PASS ⚠️ |

---

## Section 2: AC Coverage Gaps

### F-INIT

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-INIT-1 | initialization.test.ts:T-INIT-1 | ADEQUATE |
| T-INIT-2 | initialization.test.ts:T-INIT-2 | ADEQUATE |
| T-INIT-3 | initialization.test.ts:T-INIT-3 | ADEQUATE |
| T-INIT-4 | initialization.test.ts:T-INIT-4 | ADEQUATE |
| T-INIT-5 | initialization.test.ts:T-INIT-5 | ADEQUATE |
| T-INIT-6 | initialization.test.ts:T-INIT-6 | ADEQUATE |
| T-INIT-7 | initialization.test.ts:T-INIT-7 (.todo) | MISSING |
| T-INIT-8 | initialization.test.ts:T-INIT-8 (.todo) | MISSING |
| T-INIT-9 | initialization.test.ts:T-INIT-9 (.todo) | MISSING |

### F-TASK-CREATE

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-TASK-1 | task-operations.test.ts:Test 2.1 | ADEQUATE |
| T-TASK-2 | task-operations.test.ts:Test 2.2 | ADEQUATE |
| T-TASK-3 | task-operations.test.ts:Test 2.3 | ADEQUATE |
| T-TASK-4 | task-operations.test.ts:Test 2.4 | ADEQUATE |

### F-TASK-SWITCH

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-SWITCH-1 | task-operations.test.ts:T-SWITCH-1 | ADEQUATE |
| T-SWITCH-2 | task-operations.test.ts:Test 3.4 | INADEQUATE — AC clause specifies `context-list`; test runs `task-list`. Different scripts with different behavior. The AC clause is not exercised. |
| T-SWITCH-3 | task-operations.test.ts:Test 3.3 | ADEQUATE |
| T-SWITCH-4 | task-operations.test.ts:T-SWITCH-4 | ADEQUATE |
| T-SWITCH-5 | task-operations.test.ts:T-SWITCH-5 | ADEQUATE |
| T-SWITCH-6 | task-operations.test.ts:Test 3.5 | ADEQUATE |

### F-CTX-SAVE

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-CTX-1 | context-operations.test.ts:Test 4.1 | ADEQUATE |
| T-CTX-2 | context-operations.test.ts:Test 4.1 | ADEQUATE |
| T-CTX-3 | context-operations.test.ts:Test 4.2 | ADEQUATE |
| T-CTX-4 | context-operations.test.ts:Test 4.5 | ADEQUATE |
| T-CTX-6 | context-operations.test.ts:T-CTX-6, new-features.test.ts:T-CTX-6 | ADEQUATE |
| T-MEM-1 | context-operations.test.ts:T-MEM-1, new-features.test.ts:T-MEM-1 | ADEQUATE |

### F-CTX-LIST

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-LIST-1 | context-operations.test.ts:Test 5.4 | ADEQUATE |
| T-LIST-2 | context-operations.test.ts:T-LIST-2 | ADEQUATE |
| T-LIST-3 | context-operations.test.ts:T-LIST-3 | ADEQUATE |
| T-LIST-4 | context-operations.test.ts:T-LIST-4 | ADEQUATE |

### F-CTX-MANAGE

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-CTX-7 | context-operations.test.ts:Test 6.6 | ADEQUATE |
| T-MANAGE-1 | context-operations.test.ts:T-MANAGE-1 | ADEQUATE |
| T-MANAGE-2 | context-operations.test.ts:T-MANAGE-2 | ADEQUATE |
| T-MANAGE-3 | context-operations.test.ts:T-MANAGE-3 | ADEQUATE |
| T-MANAGE-4 | context-operations.test.ts:T-MANAGE-4 | ADEQUATE |
| T-MANAGE-5 | context-operations.test.ts:T-MANAGE-5 | ADEQUATE |
| T-MANAGE-6 | context-operations.test.ts:T-MANAGE-6 | ADEQUATE |

### F-CTX-PROMOTE

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-CTX-5 | context-operations.test.ts:T-CTX-5, new-features.test.ts:T-CTX-5 | ADEQUATE |
| T-PROM-1 | context-operations.test.ts:T-PROM-1 | ADEQUATE |
| T-PROM-2 | context-operations.test.ts:T-PROM-2 | ADEQUATE |
| T-PROM-3 | context-operations.test.ts:T-PROM-3 | ADEQUATE |

### F-CLMD

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-CLMD-1 | claude-md-system.test.ts:Test 8.1 | ADEQUATE |
| T-CLMD-2 | claude-md-system.test.ts:Test 8.2 | ADEQUATE |
| T-RESUME-MANUAL | (none) | RISK_ACCEPTED — RA-002 (approved 2026-03-12, expires v2.0-release) |

### F-SEC

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-SEC-2 | secret-detection.test.ts:Test 9.1 | ADEQUATE |
| T-SEC-3 | secret-detection.test.ts:Test 9.2 | ADEQUATE |
| T-SEC-4 | secret-detection.test.ts:Test 9.8 | ADEQUATE |
| T-SEC-5 | secret-detection.test.ts:Test 9.6 | ADEQUATE |
| T-SEC-6 | secret-detection.test.ts:Test 9.9 | ADEQUATE |
| T-SEC-7 | secret-detection.test.ts:T-SEC-7 | ADEQUATE |
| T-SEC-8 | secret-detection.test.ts:Test 9.3 | ADEQUATE |
| T-SEC-9 | secret-detection.test.ts:Test 9.4 | ADEQUATE |
| T-SEC-10 | secret-detection.test.ts:Test 9.5 | ADEQUATE |

### F-SUMMARY

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-SUM-1 | context-operations.test.ts:T-SUM-1 | ADEQUATE |
| T-SUM-2 | context-operations.test.ts:T-SUM-2 | ADEQUATE |
| T-SUM-3 | context-operations.test.ts:T-SUM-3 | ADEQUATE |

### F-GIT

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-GIT-1 | git-integration.test.ts:T-GIT-1 | ADEQUATE |
| T-GIT-2 | git-integration.test.ts:T-GIT-2 | INADEQUATE — Test uses absolute path `ctx.personalDir` as the prefix to check against git status output. `git status --porcelain` emits only relative paths. The assertion can never fail. The PRD AC was updated to require the relative-path form; the test was not updated to match. |

### F-XPLAT

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-ERR-3 | error-handling.test.ts:T-ERR-3 | ADEQUATE |

### F-ERR

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-ERR-1 | error-handling.test.ts:T-ERR-1 | ADEQUATE |
| T-ERR-2 | error-handling.test.ts:T-ERR-2 | ADEQUATE |

### F-DOC-SKILLS

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-DOC-1 | doc-authoring.test.ts:T-DOC-1 (.todo) | MISSING |
| T-DOC-2 | doc-authoring.test.ts:T-DOC-2 (.todo) | MISSING |
| T-DOC-3 | doc-authoring.test.ts:T-DOC-3 (.todo) | MISSING |
| T-DOC-4 | doc-authoring.test.ts:T-DOC-4 (.todo) | MISSING |
| T-DOC-5 | doc-authoring.test.ts:T-DOC-5 (.todo) | MISSING |
| T-DOC-6 | doc-authoring.test.ts:T-DOC-6 (.todo) | MISSING |

### F-MARKETPLACE

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-MKT-1 | marketplace.test.ts:T-MKT-1 (.todo) | MISSING |
| T-MKT-2 | marketplace.test.ts:T-MKT-2 (.todo) | MISSING |
| T-MKT-3 | marketplace.test.ts:T-MKT-3 (.todo) | MISSING |
| T-MKT-4 | marketplace.test.ts:T-MKT-4 (.todo) | MISSING |

### F-HOOK

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-HOOK-1 | context-operations.test.ts:T-HOOK-1 | ADEQUATE |

### F-HOOK-POST

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-HOOK-POST-1 | hooks-monitor.test.ts:T-HOOK-POST-1 | ADEQUATE |
| T-HOOK-POST-2 | hooks-monitor.test.ts:T-HOOK-POST-2 | ADEQUATE |
| T-HOOK-POST-3 | hooks-monitor.test.ts:T-HOOK-POST-3 | ADEQUATE |

### F-CTX-MONITOR-STATUS

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-MON-1 | hooks-monitor.test.ts:T-MON-1 | INADEQUATE — AC requires confirming no network calls are made. Test only checks exit 0 and non-empty output; infers network absence from sandboxed exit behavior. A quick-failing network call would not be detected. |
| T-MON-2 | hooks-monitor.test.ts:T-MON-2 | ADEQUATE |
| T-MON-3 | hooks-monitor.test.ts:T-MON-3 | ADEQUATE |
| T-MON-4 | hooks-monitor.test.ts:T-MON-4 | INADEQUATE — AC requires "tokensSinceBaseline equals currentTokens AND the status line renders without error." Test only verifies the state-file value; `status-line.ts` is never invoked to verify rendering. |

### F-CTX-MONITOR-WARN

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-MON-5 | hooks-monitor.test.ts:T-MON-5 | ADEQUATE |
| T-MON-6 | hooks-monitor.test.ts:T-MON-6 | ADEQUATE |
| T-MON-7 | hooks-monitor.test.ts:T-MON-7 | ADEQUATE |
| T-MON-8 | hooks-monitor.test.ts:T-MON-8 | ADEQUATE |
| T-MON-9 | hooks-monitor.test.ts:T-MON-9 | ADEQUATE |

### F-CTX-MONITOR-COST

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-MON-10 | hooks-monitor.test.ts:T-MON-10 | ADEQUATE |
| T-MON-11 | hooks-monitor.test.ts:T-MON-11 | INADEQUATE — The 1% tolerance check is inside a conditional guard. If the output format changes and the "Total:" line is absent, the precise tolerance assertion is skipped and the test passes on the less-precise outer regex. T2 violation. |
| T-MON-12 | hooks-monitor.test.ts:T-MON-12 | ADEQUATE |
| T-MON-13 | hooks-monitor.test.ts:T-MON-13 | INADEQUATE — `setImmediate` reads are event-loop callbacks that may not interleave with subprocess writes at the critical partial-write window. Small content reduces partial-write probability further. Atomicity guarantee cannot be confirmed as exercised by this test structure. |

### F-SPEC

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-SPEC-1 | adversary.test.ts:T-ADV-3 | ADEQUATE |
| T-SPEC-2 | adversary.test.ts:T-ADV-4 | INADEQUATE — Checks only `should-not-exist.jsonl`. AC requires all paths within adversary task directories. Any other filename in those directories would not be detected. |
| T-SPEC-3 | adversary.test.ts:T-SPEC-3 | ADEQUATE |
| T-SPEC-4 | adversary.test.ts:T-ADV-2 | ADEQUATE |

### F-ADVERSARY

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-ADV-1 | adversary.test.ts:T-ADV-1 | ADEQUATE |
| T-ADV-2 | adversary.test.ts:T-ADV-2 | ADEQUATE |
| T-ADV-3 | adversary.test.ts:T-ADV-3 | ADEQUATE |
| T-ADV-4 | adversary.test.ts:T-ADV-4 | INADEQUATE — Same gap as T-SPEC-2. Single path check; AC requires all paths within adversary task context directories. |

### F-PRD

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-PRD-1 | prd-development.test.ts:T-PRD-1 | ADEQUATE |
| T-PRD-2 | prd-development.test.ts:T-PRD-2 | ADEQUATE |
| T-PRD-3 | prd-development.test.ts:T-PRD-3 | ADEQUATE |
| T-PRD-4 | prd-development.test.ts:T-PRD-4 | ADEQUATE |

### F-DOC

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-UDOC-1 | doc-authoring.test.ts:T-UDOC-1 (.todo) | MISSING |
| T-UDOC-2 | doc-authoring.test.ts:T-UDOC-2 (.todo) | MISSING |
| T-UDOC-3 | doc-authoring.test.ts:T-UDOC-3 (.todo) | MISSING |
| T-UDOC-4 | doc-authoring.test.ts:T-UDOC-4 (.todo) | MISSING |
| T-UDOC-5 | doc-authoring.test.ts:T-UDOC-5 (.todo) | MISSING |
| T-UDOC-6 | doc-authoring.test.ts:T-UDOC-6 (.todo) | MISSING |
| T-UDOC-7 | doc-authoring.test.ts:T-UDOC-7 (.todo) | MISSING |
| T-UDOC-8 | doc-authoring.test.ts:T-UDOC-8 (.todo) | MISSING |

### F-PROCESS

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-PROC-1 | process-sequencing.test.ts:T-PROC-1 | ADEQUATE ⚠️ — ISOLATION CAVEAT: test and implementation co-authored in same session |
| T-PROC-2 | process-sequencing.test.ts:T-PROC-2 | ADEQUATE ⚠️ — ISOLATION CAVEAT |
| T-PROC-3 | process-sequencing.test.ts:T-PROC-3 | ADEQUATE ⚠️ — ISOLATION CAVEAT |
| T-PROC-4 | process-sequencing.test.ts:T-PROC-4 | ADEQUATE ⚠️ — ISOLATION CAVEAT |
| T-PROC-5 | process-sequencing.test.ts:T-PROC-5 | ADEQUATE ⚠️ — ISOLATION CAVEAT |
| T-PROC-6 | process-sequencing.test.ts:T-PROC-6 | ADEQUATE ⚠️ — ISOLATION CAVEAT |

---

### Summary

| Verdict | Count |
|---------|-------|
| PASS | 77 |
| PASS ⚠️ (isolation caveat) | 6 |
| FAIL | 7 |
| ACCEPTED | 1 |
| ESCALATE | 22 |
| **Total** | **113** |

**7 confirmed FAILs:**
- T-SWITCH-2: test runs `task-list`; AC specifies `context-list`
- T-GIT-2: absolute path prefix used against git status output that only contains relative paths (vacuous assertion)
- T-MON-1: exit-0 inference is insufficient to confirm no network calls
- T-MON-4: state-file value verified but status-line rendering not tested
- T-MON-11: 1% tolerance check inside conditional guard; outer regex is less precise
- T-SPEC-2: single filename checked; AC requires all paths within adversary task directories
- T-ADV-4: same gap as T-SPEC-2

**22 ESCALATEs:** 3 project-scope install (.todo), 6 doc-authoring skill (.todo), 4 marketplace (.todo), 8 user-docs (.todo), 1 concurrency model (T-MON-13).

**ESCALATE rate: 19%.** All 22 are either no-code (.todo) tests or one structurally ambiguous concurrency test. No surprise ESCALATE entries — all gaps are known and bounded.
