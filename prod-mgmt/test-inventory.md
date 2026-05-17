# Test Inventory — Context Curator
**Adversary Run:** 2026-05-17 (LoD2) — PRD v21.3 audit. New findings: T-INIT-7 corrected to MISSING (code is it.todo, not implemented); T-INIT-8/T-INIT-9 reclassified MISSING; T-SUM-1/T-SUM-2 implementation gap confirmed (save-context does not generate .meta.json); T-LIST-4 implementation gap (same root cause); T-DOC-1–6 and T-UDOC-1–8 reclassified FAIL (Incompleteness heuristic — static spec checks cannot verify runtime behavior); T-MKT-4 reclassified FAIL (runtime portion it.todo). T-TASK-5/6/7, T-TASK-DEL-1/2/3, T-MON-14/15/16/17/18 added (PRD v21.3 additions). Prior run attested PASS for T-SUM-1/2 and T-DOC-1–8 without reading the implementation comment or applying the Incompleteness heuristic — both are adversary assurance failures that are now corrected.
**Prior run:** 2026-05-10 (LoD2) — T-SPEC-5 PASS added; T-UDOC-1 stale description corrected; PRD v21.2.
**Prior run:** 2026-05-09 (LoD2) — T-HOOK-POST-3, T-MKT-2/3/4, T-DOC-1–6, T-UDOC-1–8 all attested PASS.
**PRD Version:** 21.3
**Risk Acceptances loaded:** RA-001 (ACCEPTED, expires 2026-09-12), RA-002 (ACCEPTED, expires v2.0-release)

---

## Section 1: Test Inventory

| F-CODE | T-CODE | DESCRIPTION | AC_CLAUSE | COVERAGE_RATIONALE | VERDICT |
|--------|--------|-------------|-----------|-------------------|---------|
| F-INIT | T-INIT-1 | Calls init-project on a project with an existing root CLAUDE.md; pre-asserts `.claude/CLAUDE.md` does not exist; then checks the file exists, contains an `@import` specifically pointing to `tasks/default/CLAUDE.md`, and the imported file exists on disk. | `init-project` creates `.claude/CLAUDE.md` containing an `@import` line pointing to the default task; the file must not exist before the script runs | Pre-condition check prevents the positive assertion from being vacuous. Import path required to specifically name `tasks/default/CLAUDE.md`, not any `@import`. Imported path verified to exist on disk. Satisfies the AC. | PASS |
| F-INIT | T-INIT-2 | Calls init-project after recording original CLAUDE.md content; pre-asserts backup absent; checks backup exists and content is byte-for-byte equal to original. | `init-project` copies root `CLAUDE.md` byte-for-byte to the stash path; backup must not exist before the script runs | Pre-condition prevents the backup check from being trivially satisfied by a pre-existing file. `expect(backupContent).toBe(originalContent)` is byte-exact. Satisfies the AC. | PASS |
| F-INIT | T-INIT-3 | Calls init-project after recording original CLAUDE.md content; pre-asserts default task path absent; checks default task CLAUDE.md exists and content equals original. | `.claude/tasks/default/CLAUDE.md` content equals root `CLAUDE.md` character-for-character | Pre-condition guards against a pre-planted file. Character-exact equality asserted. Satisfies the AC. | PASS |
| F-INIT | T-INIT-4 | Calls init-project twice; asserts both calls exit 0; asserts working CLAUDE.md content is identical between runs; asserts stash directory contains exactly one CLAUDE file. | Running `init-project` twice exits 0 both times and produces identical file contents; no duplication in stash | Both exit codes verified. Content identity asserted after each call. Stash file count bounded at exactly 1. Satisfies the AC. | PASS |
| F-INIT | T-INIT-5 | Creates two isolated environments; saves a context in project 1 via `save-context` (not direct file creation); confirms the context file exists in project 1's personal storage and is absent from project 2. | Writing a file to project A's personal directory does not make it visible in project B's personal directory | Uses the implementation to place the file (not path arithmetic), preventing false positives. Explicitly checks absence in project 2. Satisfies the AC. | PASS |
| F-INIT | T-INIT-6 | Calls init-project in an isolated environment; asserts `prod-mgmt/risk-acceptances.md` exists and contains "DISPOSITION", "EXPIRY", and "RA_ID". | `init-project` creates `prod-mgmt/risk-acceptances.md` containing the strings "DISPOSITION", "EXPIRY", and "RA_ID" | All three required strings independently asserted. Satisfies the AC. | PASS |
| F-INIT | T-INIT-7 | No test code — `.todo` placeholder only. | `--project-install` creates `.claude/skills/context-curator/` with task/, context-save/, context-list/, context-manage/, context-promote/ — each with SKILL.md and scripts/ | No executable test code exists (`it.todo`). Prior run incorrectly attested PASS, citing a cpSync-based test that does not exist at this T-code. Confirmed by direct code read: `describe('T-INIT-7…') { it.todo(…) }`. | MISSING |
| F-INIT | T-INIT-8 | No test code — `.todo` placeholder only. | After project-scope install, `/context-save` resolves to the project-scope skill rather than the user-scope skill | No executable test code exists. Requires a Claude Code session harness. | MISSING |
| F-INIT | T-INIT-9 | No test code — `.todo` placeholder only. | A cloned repo with `.claude/skills/context-curator/` committed has all five slash commands available without running `install.sh` | No executable test code exists. Requires a Claude Code session harness. | MISSING |
| F-TASK-CREATE | T-TASK-1 | Calls task-create with a description; asserts exit 0; checks all four required section headers exist via regex; extracts the Focus section by slicing between `## Focus` and the next `##` heading; asserts the description keyword appears within that slice. | `task-create` produces a CLAUDE.md with all required section headers and the description keyword appears under `## Focus` | All four headers verified by independent regex assertions. Focus section is extracted structurally, not by full-file search, preventing a keyword appearing elsewhere in the file from satisfying the assertion. Satisfies the AC. | PASS |
| F-TASK-CREATE | T-TASK-2 | Calls task-create with `OAuthRefactor` (uppercase); asserts non-zero exit; asserts neither the original-case nor a lowercased directory was created. | `task-create` exits non-zero and creates no directory for a task name containing uppercase letters | Non-zero exit required. Both case variants explicitly checked absent, preventing a silent case-fold bypass. Satisfies the AC. | PASS |
| F-TASK-CREATE | T-TASK-3 | Calls task-create with a four-line description; extracts the Focus section; asserts all four verbatim description lines appear within that section. | A four-line description has all four lines preserved verbatim in the Focus section | All four literal lines asserted within the Focus section specifically. A keyword-extracting or rewriting implementation would fail. Satisfies the AC. | PASS |
| F-TASK-CREATE | T-TASK-4 | Calls task-create with an empty string description; asserts non-zero exit; asserts no task directory was created. | `task-create` exits non-zero and creates no directory when given an empty description | Non-zero exit and directory absence both required. Satisfies the AC. | PASS |
| F-TASK-CREATE | T-TASK-5 | Creates task; calls task-switch; reads `.claude/CLAUDE.md`; asserts `@import` points to the new task's CLAUDE.md | After `task-create` + `task-switch`, `.claude/CLAUDE.md` `@import` updated to new task | Import path updated and specific to the new task. Satisfies the AC. | PASS |
| F-TASK-CREATE | T-TASK-6 | Calls task-create with empty name; asserts non-zero exit | `task-create` rejects empty task name with non-zero exit | Non-zero exit required. Satisfies the AC. | PASS |
| F-TASK-CREATE | T-TASK-7 | Calls task-create with description argument; reads task CLAUDE.md; asserts description text present | `task-create` with description writes description content to task CLAUDE.md | Description content presence verified. Satisfies the AC. | PASS |
| F-TASK-DELETE | T-TASK-DEL-1 | Creates task; calls task-delete; asserts task directory absent | `task-delete` removes task directory | Directory absence verified post-delete. Satisfies the AC. | PASS |
| F-TASK-DELETE | T-TASK-DEL-2 | Creates task; activates it via task-switch; deletes it; asserts `@import` reverts to default task | Deleting active task switches `@import` back to default task | Import reversion to default verified. Satisfies the AC. | PASS |
| F-TASK-DELETE | T-TASK-DEL-3 | Calls task-delete on non-existent task name; asserts non-zero exit | `task-delete` on unknown task name exits non-zero | Non-zero exit required. Satisfies the AC. | PASS |
| F-TASK-SWITCH | T-SWITCH-1 | Runs update-import A→B→C→A; after each switch reads `.claude/CLAUDE.md`, counts `@import` lines, and asserts exactly one pointing to the selected task. | After switching tasks A→B→C→A, `.claude/CLAUDE.md` contains exactly one `@import` line on each switch pointing to the selected task's CLAUDE.md | Count asserted after each of the four switches. Both cardinality (exactly one) and target correctness verified per switch. Satisfies the AC. | PASS |
| F-TASK-SWITCH | T-SWITCH-2 | Calls `context-list` on a task with no saved contexts; asserts exit 0; asserts output matches `/no contexts|\bfresh\b/i`. | When a task has no saved contexts, `context-list` exits 0 and output contains "no contexts" or the word "fresh" as a complete word | Runs `context-list` as the AC specifies (not `task-list`). Word-boundary guard `/\bfresh\b/i` prevents substring matches such as "Refreshed". Satisfies the AC. | PASS |
| F-TASK-SWITCH | T-SWITCH-3 | Calls `task-list` on a task with one personal and one golden context; asserts all three specific context names appear in output; asserts personal context name index is less than golden context name index; asserts both section labels are present. | When a task has both personal and golden contexts, all context names appear in output with personal contexts listed before golden contexts | Ordering verified by index comparison on specific context names, not generic section header positions. All three names required. Satisfies the AC. | PASS |
| F-TASK-SWITCH | T-SWITCH-4 | Plants two UUID session files; calls `context-list sessions-task --json`; parses JSON; asserts `data.contexts` equals `[]` and `data.sessions.length > 0`. | `context-list --json` for a task with active sessions but no saved contexts returns `contexts: []` | Sessions field confirmed non-empty (proves sessions exist in the environment). Contexts field asserted to be an empty array. Separation enforced. Satisfies the AC. | PASS |
| F-TASK-SWITCH | T-SWITCH-5 | Calls `context-list sessions-task` (human-readable); asserts "sessions" present; asserts neither "personal contexts" nor "golden contexts" labels appear; asserts output does not match a numbered-UUID pattern. | When `contexts` is empty, the switch UI does NOT present UUID session files as numbered selectable options | Section labels explicitly excluded. Numbered UUID regex pattern `^\s*\d+\.\s+[0-9a-f]{8}-...` excluded. Satisfies the AC. | PASS |
| F-TASK-SWITCH | T-SWITCH-6 | Calls `update-import default` after a prior task switch; asserts exit 0; asserts output matches `/vanilla|restored/`; asserts `@import` in `.claude/CLAUDE.md` points to `default/CLAUDE.md`; asserts prior task name absent from the file. | Switching to `default` task sets `@import` to point to `default/CLAUDE.md` and script output confirms the switch | Both behavioral requirements covered: text confirmation AND structural @import verification. Prior task name verified absent. Satisfies the AC. | PASS |
| F-CTX-SAVE | T-CTX-1 | Calls `save-context --personal` with a planted session file; asserts exit 0; checks the explicit path `<personalDir>/tasks/<task-id>/contexts/my-work.jsonl` exists and is valid JSONL. | `save-context --personal` creates a file at exactly `<personalDir>/tasks/<task-id>/contexts/<name>.jsonl` | Exact path verified unconditionally. JSONL validity checked. Satisfies the AC. | PASS |
| F-CTX-SAVE | T-CTX-2 | Calls `save-context --personal`; asserts existence unconditionally (no `if` guard); asserts file is valid JSONL; asserts file is non-empty. | The saved context file parses as valid JSONL and is non-empty | Existence check is unconditional. JSONL validity and non-empty content both required. An empty file or a valid-but-empty JSONL would fail. Satisfies the AC. | PASS |
| F-CTX-SAVE | T-CTX-3 | Calls `save-context --golden` three times with Stripe, GitHub, and AWS key fixtures; each: asserts non-zero exit; output names the specific secret type; golden file explicitly absent. | `save-context --golden` on a session with a secret exits non-zero; the secret type must be named in output; exit 0 with no prompt is a failure | Three distinct secret types covered independently. Type-specific output required (not generic "secret" keyword). Golden file absence verified for each. Satisfies the AC. | PASS |
| F-CTX-SAVE | T-CTX-4 | Pre-asserts `statSync.size > 100*1024` before running the script; calls `save-context --golden` on the oversized file; asserts non-zero exit and output contains "100KB" or "too large"; asserts golden file absent. | `save-context --golden` on a session exceeding 100KB exits non-zero with output containing "100KB" or "too large" | Size pre-condition verified before script execution, preventing the script from failing for a different reason. Error message vocabulary specific. File absence verified. Satisfies the AC. | PASS |
| F-CTX-SAVE | T-CTX-6 | Calls `save-context` twice with the same context name; captures original content before second save; asserts a `.backup-` file exists in the contexts directory; asserts backup content equals original content byte-for-byte. | `save-context` called twice with the same name creates a `.backup-` file containing the original content | Backup existence and content byte-equality both required. An implementation that truncates or corrupts the backup would fail. Satisfies the AC. | PASS |
| F-CTX-SAVE | T-MEM-1 | Calls `save-context`; polls via `waitFor` (up to 5 s, 200 ms interval) until `<personalDir>/memory/MEMORY.md` appears; asserts the file contains both the task-id and context-name. | After `save-context`, `<personalDir>/memory/MEMORY.md` contains the task-id and context-name | `waitFor` prevents a false failure on async write latency. Both required strings independently asserted. Satisfies the AC. | PASS |
| F-CTX-LIST | T-LIST-1 | Calls `task-list mixed-work`; asserts personal context name appears before golden context name in output by index comparison; asserts both section labels present. | Personal contexts are listed before golden contexts when both exist | Ordering verified by named-context index comparison, not section header positions. Satisfies the AC. | PASS |
| F-CTX-LIST | T-LIST-2 | Creates two contexts (ctx-1: 5 messages, ctx-2: 30 messages); calls `context-list`; splits output into lines; finds the line containing each context name; asserts each line matches the exact count as a word boundary (`\b5\b`, `\b30\b`). | `context-list` shows exact message count matching `\b<N>\b` (word boundary, not `\d+`) | Two distinct known counts verified with word-boundary regex on the specific context-name line. A count of 50 when 5 is expected, or 300 when 30 is expected, fails. Circularity and broad-digit-regex patterns both prevented. Satisfies the AC. | PASS |
| F-CTX-LIST | T-LIST-3 | Calls `task-create` then `context-list` on the new task (no saved contexts); asserts exit 0; asserts output matches `/\bfresh\b|\bempty\b|\bno contexts\b/i`. | When no contexts exist, `context-list` output contains "fresh", "empty", or "no contexts" | All three AC-specified phrases covered. Word boundaries on single-word phrases prevent substring matches like "Refreshed" or "nonempty". Satisfies the AC. | PASS |
| F-CTX-LIST | T-LIST-4 | Calls `save-context` (expected to generate `.meta.json` with AI summary); calls `context-list`; finds the context-name line; asserts it contains `—` separator; asserts text after the separator contains an auth-domain keyword from the session content. | `context-list` shows a non-empty description string after each context name, not just metadata | Test design is sound: uses save-context through the implementation, requires content keyword. **IMPLEMENTATION GAP: `save-context` does not generate `.meta.json`. The test's precondition (that save-context writes `.meta.json`) is not satisfied by the implementation. Test currently fails in the suite. Same root cause as T-SUM-1/T-SUM-2.** | PASS¹ |
| F-CTX-MANAGE | T-CTX-7 | Pre-asserts golden file exists; calls `delete-context` without `--force`; asserts non-zero exit; asserts golden file still exists after the failed call. | `delete-context` on a golden context exits non-zero without `--force`; the file survives the failed call | Pre-condition guards against the file being absent before the test. Non-zero exit and file survival both required. Satisfies the AC. | PASS |
| F-CTX-MANAGE | T-MANAGE-1 | Calls `list-all-contexts` with two tasks each having contexts; asserts both specific context names and both task names appear in output. | `list-all-contexts` exits 0 and output includes context names from at least 2 different tasks | Both specific names and task names required. Would fail if only one task's contexts were listed. Satisfies the AC. | PASS |
| F-CTX-MANAGE | T-MANAGE-2 | Sets a context file's mtime to 31 days in the past via `utimesSync`; calls `list-all-contexts`; finds the line for that context; asserts "stale" appears on the same line. | `list-all-contexts` marks a context as stale when its mtime is > 30 days old | mtime manipulation is explicit and verifiable. "Stale" required on the same line as the context name, preventing a coincidental match elsewhere. Satisfies the AC. | PASS |
| F-CTX-MANAGE | T-MANAGE-3 | Creates two files with byte-identical content; calls `list-all-contexts`; asserts "duplicate" appears on each context's line. | `list-all-contexts` identifies two byte-for-byte identical context files as duplicates | Both files must be individually labeled. "Duplicate" required on each file's own output line. Satisfies the AC. | PASS |
| F-CTX-MANAGE | T-MANAGE-4 | Calls `delete-context --dry-run`; asserts exit 0; asserts context name in output; asserts the file still exists. | `delete-context --dry-run` exits 0, prints what would be deleted, and does NOT delete the file | All three requirements verified independently. Satisfies the AC. | PASS |
| F-CTX-MANAGE | T-MANAGE-5 | Calls `rename-context`; asserts exit 0; asserts old path absent; asserts new path is non-empty valid JSONL. | `rename-context` exits 0; old path does not exist; new path is a valid non-empty JSONL file | Old path explicitly verified absent. New path's JSONL validity and non-emptiness both required. Satisfies the AC. | PASS |
| F-CTX-MANAGE | T-MANAGE-6 | Calls `archive-context`; asserts exit 0; asserts original path absent; asserts file exists at `contexts/archives/<context-name>.jsonl` and is valid JSONL. | `archive-context` exits 0; file exists at the archive path; original path does not exist | Archive path is the specific required subdirectory. Original path explicitly absent. JSONL verified. Satisfies the AC. | PASS |
| F-CTX-PROMOTE | T-CTX-5 | Pre-asserts `statSync.size > 100_000`; calls `promote-context` on the oversized file; asserts non-zero exit; asserts output contains "100kb" or "too large"; asserts golden file absent. | `promote-context` on a context exceeding 100KB exits non-zero with output containing "100KB" or "too large" | Size pre-condition eliminates unrelated error bypass. Error vocabulary specific. File absence verified. Satisfies the AC. | PASS |
| F-CTX-PROMOTE | T-PROM-1 | Calls `promote-context`; asserts exit 0; asserts both personal original and new golden path exist; asserts their byte content is identical. | After `promote-context`, both personal original and golden copy exist with byte-identical content | Both paths verified present. Byte equality required (not just existence). An implementation that creates an empty golden file would fail. Satisfies the AC. | PASS |
| F-CTX-PROMOTE | T-PROM-2 | Calls `promote-context` on a context containing a `ghp_` token; asserts non-zero exit; asserts output matches `/ghp_|github token|github pat/i`. | `promote-context` on a context with a `ghp_` + 36 alphanumeric char token exits non-zero and output names the specific secret type | Requires the specific token prefix or type name — "github" alone would fail. Satisfies the AC. | PASS |
| F-CTX-PROMOTE | T-PROM-3 | Creates personal context only (no golden); runs first promotion to create golden legitimately; runs second promotion to the same golden; asserts second call fails with `/already.*golden|already exists/i`. | `promote-context` when a golden already exists exits non-zero or warns | Setup creates personal context only, then uses the implementation to create golden via the first promotion. Second promotion detected and rejected. Satisfies the AC. | PASS |
| F-CLMD | T-CLMD-1 | Runs init, two task-creates, and three update-imports; after all operations asserts root CLAUDE.md content is byte-equal to the pre-operation snapshot. | After any task operation, root `CLAUDE.md` content equals its pre-operation content | Multiple operations covering all mutation paths. Pre-operation snapshot captured before any script runs. Byte equality asserted after the full sequence. Satisfies the AC. | PASS |
| F-CLMD | T-CLMD-2 | Runs two task-creates and two update-imports; counts `@import` lines in `.claude/CLAUDE.md`; asserts count is 1 and import contains the second task name; asserts first task name absent. | After two task switches, `.claude/CLAUDE.md` contains exactly one `@import` line | Exactly one import required. Stale first-task import verified absent. Satisfies the AC. | PASS |
| F-CLMD | T-RESUME-MANUAL | No automated test. Manual end-to-end only. | After `/task <id>` + `/resume <session>`, Claude's response references task CLAUDE.md content | RA-002 active (approved 2026-03-12, expires v2.0-release). | ACCEPTED |
| F-SEC | T-SEC-2 | Calls `scan-secrets` on a fixture containing an AKIA-prefixed key; asserts non-zero exit; asserts output matches `/akia/i`. | `scan-secrets` on a file with `AKIA` + 16 uppercase alphanumeric chars exits non-zero; output contains "AWS" or "AKIA" | Non-zero exit required. `/akia/i` targets the specific prefix, not a generic keyword. Satisfies the AC. | PASS |
| F-SEC | T-SEC-3 | Calls `scan-secrets` on a Stripe key fixture; asserts non-zero exit; asserts output contains both `sk_test_` and `sk_live_` (independently, not as an OR). | `scan-secrets` detects both `sk_test_` and `sk_live_`; output names the specific key type | Both prefixes independently asserted. Satisfies the AC. | PASS |
| F-SEC | T-SEC-4 | Calls `scan-secrets` on a three-message fixture with one secret per role (user, assistant, tool_result); asserts AKIA, sk_test_, and ghp_ patterns each appear in output. | A context with one secret in each of user, assistant, and tool_result message types has all three reported | Three-type fixture isolates each message role. Each pattern asserted independently. Satisfies the AC. | PASS |
| F-SEC | T-SEC-5 | Calls `scan-secrets` on an isolated fixture containing only `AKIAIOSFODNN7EXAMPLE`; asserts non-zero exit; asserts output matches `/akia/i`. | `AKIAIOSFODNN7EXAMPLE` is treated as a true positive | Isolated fixture prevents cross-contamination. Policy assertion is unconditional. Satisfies the AC. | PASS |
| F-SEC | T-SEC-6 | Calls `redact-secrets` on a fixture; asserts every line parses as JSON; then calls `scan-secrets` on the redacted file; asserts exit 0 and output contains "clean". | After `redact-secrets`, every line parses as JSON; a second `scan-secrets` run returns "clean" | Redacted file's JSONL validity verified. Re-scan required to confirm no secrets remain. Two-clause AC both covered. Satisfies the AC. | PASS |
| F-SEC | T-SEC-7 | Calls `scan-secrets` on a five-secret fixture; asserts output matches `/\bfound\s+5\s+secret|\b5\s+secrets?\s+found/i`. | `scan-secrets` on a context with exactly 5 secrets: output matches `found 5 secret` or `5 secret(s) found` | Proximity-adjacent count assertion prevents "Scanning 5 messages…found 3 secrets" bypass. Both word-order variants covered. Satisfies the AC. | PASS |
| F-SEC | T-SEC-8 | Calls `scan-secrets` on a GitHub PAT fixture; asserts non-zero exit; asserts output matches `/ghp_/i`. | `scan-secrets` on a context containing `ghp_` + 36 alphanumeric chars exits non-zero; output contains "ghp_" or "github" | Specific prefix required. Non-zero exit required. Satisfies the AC. | PASS |
| F-SEC | T-SEC-9 | Calls `scan-secrets` on a private key fixture; asserts non-zero exit; asserts output matches `/rsa.*private|private.*key|BEGIN.*PRIVATE/i`. | `scan-secrets` on a context containing `-----BEGIN RSA PRIVATE KEY-----` exits non-zero; output matches RSA/private key patterns | Non-zero exit required. Pattern targets the specific header text. Satisfies the AC. | PASS |
| F-SEC | T-SEC-10 | Calls `scan-secrets` on a password-assignment fixture; asserts non-zero exit; asserts output matches `/password/i`. | `scan-secrets` on a context containing `password=<value>` exits non-zero; output contains "password" (case-insensitive) | Non-zero exit required. Case-insensitive match specific to the assignment pattern type. Satisfies the AC. | PASS |
| F-SUMMARY | T-SUM-1 | Calls `save-context`; asserts a `.meta.json` exists alongside the saved `.jsonl`; asserts summary length is between 20 and 500 characters; asserts summary contains a keyword from SMALL_CONTEXT. | After `save-context`, a `.meta.json` file exists with a `summary` string between 20 and 500 characters | Test design is sound: length bounds, content keyword, and file existence all required. **IMPLEMENTATION GAP: `save-context` does not generate `.meta.json`. Test file explicitly documents this: "The current implementation does NOT generate summaries — no .meta.json is written by save-context." Test currently fails in the suite. Prior run attest of PASS was in error.** | PASS¹ |
| F-SUMMARY | T-SUM-2 | Saves two contexts from clearly different source conversations; asserts the two summaries differ; asserts each summary contains a keyword from its own source. | Two contexts from clearly different conversations produce different `summary` strings; each must contain a keyword from its source | Test design is sound: summaries required to differ with source-domain keywords. **IMPLEMENTATION GAP: same root cause as T-SUM-1. `.meta.json` not generated. Test currently fails in the suite.** | PASS¹ |
| F-SUMMARY | T-SUM-3 | Captures session file content before `save-context`; asserts content after is byte-for-byte identical to the pre-save snapshot. | After `save-context`, the session source file is byte-for-byte identical to its pre-save snapshot | Pre-save snapshot taken before script runs. Byte equality asserted unconditionally after. Satisfies the AC. | PASS |
| F-GIT | T-GIT-1 | Commits `.claude/.gitignore`; calls `git check-ignore .claude/CLAUDE.md`; asserts exit 0. | `git check-ignore .claude/CLAUDE.md` exits 0 in a real git repo after init | `.gitignore` committed before check (makes behavior portable across git versions). `git check-ignore` exit 0 is the precise git-native assertion. Satisfies the AC. | PASS |
| F-GIT | T-GIT-2 | Runs `save-context` to create a personal context file; asserts the file exists at the explicit personal path; asserts that path starts outside `projectDir`; stages all project files; iterates git-status lines and asserts none contains the context filename. | After a full workflow, `git status --porcelain` does not show any path that resolves into the personal storage directory | File existence at the exact personal path asserted first. Structural isolation (path outside projectDir) verified independently. Git-status check uses the context filename (a relative identifier git would report) rather than an absolute path prefix it can never contain. Satisfies the AC. | PASS |
| F-XPLAT | T-ERR-3 | Creates a project directory with a space in its path; runs init-project, task-create, and update-import; asserts each exits 0 and each expected output file exists. | All operations work when the project path contains a space | Three operations checked. Both exit code and output file existence verified per operation. An implementation that silently succeeds but writes no files would fail. Satisfies the AC. | PASS |
| F-ERR | T-ERR-1 | Calls task-create on an uninitialized project; asserts non-zero exit; asserts output contains "init" or "not initialized"; asserts no Node.js stack-trace patterns in output. | Any script run without init exits non-zero with output containing "initialized" or "init" — not a stack trace | Non-zero exit required. Vocabulary check rules out both a generic error and a Node.js crash. Satisfies the AC. | PASS |
| F-ERR | T-ERR-2 | Creates a malformed JSONL file; calls `scan-secrets`; asserts non-zero exit; asserts no stack-trace patterns; asserts error message names the corruption. | `scan-secrets` on malformed JSONL exits non-zero (not 0) | Non-zero exit required. Error message required to name the corruption. Stack-trace explicitly excluded. Satisfies the AC. | PASS |
| F-DOC-SKILLS | T-DOC-1 | Reads `src/skills/context-curator/authoring/prd/SKILL.md`; asserts `### F-[A-Z]` heading template, `**Expected Behaviors:**`, `**Test Scenarios:**`, `**Acceptance Criteria:**`, and `T-XXX` row reference all present. | `/prd new-feature` produces a markdown section with all four required structural elements | **Incompleteness heuristic: FAIL.** AC clause specifies runtime scaffolding behavior of the `/prd new-feature` command. Test verifies that SKILL.md _specifies_ the required format. A test that passes when the implementation is wrong: if Claude misinterprets SKILL.md or produces incorrect scaffold output, the test still passes. Static spec check cannot substitute for runtime execution. Prior run PASS was in error. | FAIL |
| F-DOC-SKILLS | T-DOC-2 | Reads `prd/SKILL.md`; extracts YAML frontmatter between `---` fences; asserts `invocation: auto` and `trigger-pattern: *prd*.md` both present. | PRD skill auto-invokes on `*prd*.md` filename pattern | **Incompleteness heuristic: FAIL.** AC clause requires auto-invocation at runtime on the trigger pattern. Test verifies frontmatter fields only. The test cannot detect a bug in Claude Code's trigger-pattern resolution or auto-invocation dispatch. Static spec check. | FAIL |
| F-DOC-SKILLS | T-DOC-3 | Reads `test-plan/SKILL.md`; asserts presence of testing philosophy, banned patterns, fix priority tiers, environment setup, feature test groups, and summary; counts numbered `\d+. **` items and asserts >= 6. | `/test-plan new` produces a document with all mandatory sections | **Incompleteness heuristic: FAIL.** AC clause requires `/test-plan new` to scaffold at runtime. Test verifies that SKILL.md lists the required sections. If the skill scaffolds a document missing required sections, the test still passes. Static spec check. | FAIL |
| F-DOC-SKILLS | T-DOC-4 | Reads `dev-plan/SKILL.md`; asserts `Based on: PRD v`, executive summary, `### Phase N` heading format, file structure section, design decisions section, and troubleshooting section all present. | `/dev-plan new` produces a document with required header format and sections | **Incompleteness heuristic: FAIL.** AC clause requires `/dev-plan new` to scaffold at runtime. Test verifies specification document content only. Static spec check. | FAIL |
| F-DOC-SKILLS | T-DOC-5 | Reads `prd/SKILL.md`; asserts `check-ac` present; asserts vague-criteria examples (`handles gracefully` or `works correctly`) present; asserts `flag` or `rationale` present. | `/prd check-ac` flags vague criteria with rationale; clean PRD produces no flags | **Incompleteness heuristic: FAIL.** AC clause requires `/prd check-ac` to detect and flag vague criteria at runtime. Test only verifies that SKILL.md mentions the examples and the word "flag". If check-ac produces no flags on a vague PRD, the test still passes. Static spec check. | FAIL |
| F-DOC-SKILLS | T-DOC-6 | Reads `test-inventory/SKILL.md`; extracts frontmatter; asserts `guard: adversary-task-active`; asserts body matches `/adversary task is (NOT\|not) active/`. | The `test-inventory` skill is only loadable when the adversary task is active | **Incompleteness heuristic: FAIL.** AC clause requires the runtime guard to prevent access when adversary task is inactive. Test verifies frontmatter specification only. If Claude Code's guard mechanism does not enforce the field, the test still passes. Static spec check. | FAIL |
| F-MARKETPLACE | T-MKT-1 | Extracts the manifest heredoc from install.sh source; substitutes `$VERSION` (from `dist/version.json`) and `$(date...)` subshells; parses the result as JSON; asserts `bundles.authoring`, `bundles.session`, and `bundles.monitor` keys exist. | `install.sh` creates `~/.claude/context-curator-manifest.json`; valid JSON with `bundles.authoring`, `bundles.session`, `bundles.monitor` | Heredoc extracted via regex from install.sh source; shell variables substituted; `JSON.parse` invoked — a JSON syntax error or missing bundle key in install.sh's template causes the test to fail. Tests the source artifact without requiring a full install run. Satisfies the structural AC. | PASS |
| F-MARKETPLACE | T-MKT-2 | Two tests: (1) cpSync `src/skills/context-curator/authoring/` to temp dir; assert `prd`, `test-plan`, `dev-plan`, `test-inventory` SKILL.md all present; assert `context-save` and `task` directories absent. (2) Parse manifest template from install.sh (same approach as T-MKT-1); assert `bundles.authoring.skills` contains no `session/` or `context-save` entries. | Authoring-bundle-only install: `/prd`, `/test-plan`, `/dev-plan`, `/test-inventory` available; `/context-save` not available | cpSync mirrors the exact install.sh bundle copy operation. Positive presence of all four authoring skills verified unconditionally. Absence of session skills verified unconditionally. Manifest template parsed and authoring skills array inspected. Satisfies the structural AC. | PASS |
| F-MARKETPLACE | T-MKT-3 | Three tests: (1) `dist/version.json` exists with a non-empty `version` string; (2) install.sh template contains `"version": "$VERSION"` sourced from `dist/version.json`; (3) writes a manifest with version `"0.0.0-mismatch"` to a temp `CLAUDE_HOME`, runs `scripts/verify-manifest.ts`, asserts non-zero exit and output matches `/version/i`. | Manifest `version` field matches installed `dist/version.json`; a version mismatch exits non-zero | Version-match path: `dist/version.json` existence and install.sh's `$VERSION` both verified. Mismatch path: `verify-manifest.ts` now implemented; writes mismatched manifest to isolated temp dir; non-zero exit and "version" in output both required. Satisfies the full AC. | PASS |
| F-MARKETPLACE | T-MKT-4 | Static test: writes a manifest JSON with a `custom` bundle to a temp `.claude/` dir; reads back and parses; asserts `bundles.custom` defined and description equals expected string. Runtime test for `/plugin marketplace list` output: `it.todo`. | A custom team manifest at `.claude/context-curator-manifest.json` with a `custom` bundle is discoverable via `/plugin marketplace list` | **Incompleteness heuristic: FAIL.** AC clause requires end-to-end discoverability via `/plugin marketplace list`. Static JSON round-trip verifies manifest format only. Runtime discovery behavior — that `/plugin marketplace list` surfaces the custom bundle — is `it.todo` with no executable test code. Test passes when the runtime discovery is broken. | FAIL |
| F-HOOK | T-HOOK-1 | Plants a UUID session JSONL file; passes a JSON payload via stdin; calls `auto-save-context`; asserts a timestamped `.jsonl` appears in `<personalBase>/auto-saves/`; asserts valid JSONL; asserts non-empty; asserts contains specific source content string. | `auto-save-context` with a mock stdin payload creates a timestamped `.jsonl` file in the flat `<personalBase>/auto-saves/` directory | Payload delivered via stdin (correct hook interface). Saved file verified: path, JSONL validity, non-empty, source-content string. An empty auto-save or a wrongly pathed file would fail. Satisfies the AC. | PASS |
| F-HOOK-POST | T-HOOK-POST-1 | Switches to a non-default task via `update-import`; calls `postcompact-reinject`; asserts exit 0; asserts stdout is non-empty; asserts stdout contains the task ID. | With a non-default task active, `postcompact-reinject` outputs a string containing the task ID; output must not be empty | Exit 0, non-empty output, and task ID presence all required independently. Satisfies the AC. | PASS |
| F-HOOK-POST | T-HOOK-POST-2 | Leaves default task active; calls `postcompact-reinject`; asserts exit 0; asserts stdout is empty. | With the default task active, `postcompact-reinject` exits 0 and outputs nothing | Exit 0 and empty stdout both required. Satisfies the AC. | PASS |
| F-HOOK-POST | T-HOOK-POST-3 | Writes `.claude/CLAUDE.md` pointing to a non-existent task; calls `postcompact-reinject`; asserts exit 0; filters tsx Node.js 26 DEP0205 `DeprecationWarning` and `node --trace-deprecation` lines from stderr; asserts remaining stderr matches `/warning|not found/i`. | `postcompact-reinject` with a missing task CLAUDE.md exits 0 and stderr contains "warning" or "not found" | tsx DEP0205 noise filtered before assertion: only lines not matching `\[DEP\d+\]\|DeprecationWarning\|node --trace-deprecation` are checked. The implementation emits `[postcompact] warning: task CLAUDE.md not found for <id>` which passes the filter and satisfies the regex. An implementation that emits no message would leave implStderr empty and fail. Satisfies the AC. | PASS |
| F-CTX-MONITOR-STATUS | T-MON-1 | Writes a monitor state file; calls `status-line`; asserts exit 0 and non-empty output; reads `scripts/status-line.ts` source and asserts absence of `@anthropic-ai/sdk`, `node-fetch`, `cross-fetch`, `axios`, `node:(http|https)` import forms, and `require('http...')` patterns. | The status-line script reads values from the monitor state file only — no API calls, no model calls, no network I/O | Source-level import analysis is immune to the "quick-failing network call" bypass that exit-0 inference cannot distinguish. Checks all common network-capable import patterns. A future network import in status-line.ts would cause this test to fail immediately. Satisfies the AC. | PASS |
| F-CTX-MONITOR-STATUS | T-MON-2 | Writes a state file with known values (fillPct 47.5, tokensSinceBaseline 31000, estimatedCost 0.18, burnRatePerMessage 2100); calls `status-line`; asserts output matches `/47/`, `/31k/`, `/0\.18/`, and `/2\.1k/`. | Given a monitor state file with those specific values, the status-line output matches the patterns 47, 31k, 0.18, and 2.1k | All four field values checked by independent assertions. Uses `toMatch` (presence check), not empty-stderr checks, so tsx DEP0205 stderr noise cannot produce a false pass or false failure here. Satisfies the AC. | PASS |
| F-CTX-MONITOR-STATUS | T-MON-3 | Writes a state file; calls `status-line` with `CLAUDE_SESSION_TYPE=headless`; asserts exit 0; asserts stdout trim equals `''`; asserts stderr trim equals `''`. | With `CLAUDE_SESSION_TYPE=headless`, the status-line script exits 0 and produces no stdout or stderr | Both stdout and stderr asserted empty. Exit 0 asserted. Satisfies the AC. | PASS |
| F-CTX-MONITOR-STATUS | T-MON-4 | Writes a session JSONL and pre-writes state with `baselineTokens: null`; calls `update-monitor-state`; reads state file and asserts `tokensSinceBaseline === currentTokens`; then calls `status-line` and asserts exit 0. | With no checkpoint metadata present, `tokensSinceBaseline` equals `currentTokens` and the status line renders without error | State-file value verified. `status-line` invoked after state update; exit 0 required. Both halves of the AC clause are covered. Satisfies the AC. | PASS |
| F-CTX-MONITOR-WARN | T-MON-5 | Writes state at 65% fill (sentinel false); calls `warn`; asserts stderr contains "degrading" and a save suggestion. Then writes state at 64.9% fill; calls `warn`; filters tsx Node.js 26 DEP0205 `DeprecationWarning` and `node --trace-deprecation` lines from stderr; asserts remaining stderr is empty. | At 65% fill the warning script emits "degrading" and a save suggestion; at 64.9% fill stderr is empty | tsx DEP0205 noise filtered from the 64.9% silent case before asserting empty. 65% positive assertion is unchanged and unaffected by noise. An implementation that emits any non-noise stderr below 65% would fail the filtered empty check. Satisfies the AC. | PASS |
| F-CTX-MONITOR-WARN | T-MON-6 | Writes state at 80% fill (degrading sentinel true); calls `warn`; asserts stderr contains "critical" and a restart suggestion. Writes state at 79.9%; calls `warn`; asserts stderr contains "degrading" but not "critical". | At 80% fill stderr contains "critical" and a restart suggestion; at 79.9% it emits the degrading warning only | Both zone boundaries tested. Critical zone requires restart suggestion specifically. Degrading-only case explicitly excludes "critical". Positive-presence assertions are not vulnerable to tsx stderr noise. Satisfies the AC. | PASS |
| F-CTX-MONITOR-WARN | T-MON-7 | Sets degrading sentinel to true via first warn invocation; confirms sentinel is written to state; writes state at 66% with sentinel true; calls `warn` again; filters tsx Node.js 26 DEP0205 `DeprecationWarning` and `node --trace-deprecation` lines from stderr; asserts remaining stderr is empty. | After the sentinel is set, a second invocation at 66% exits 0 and stderr is empty (sentinel suppresses repeat) | tsx DEP0205 noise filtered before empty-stderr assertion. Sentinel pre-condition (degrading=true in state) explicitly verified. An implementation that ignores the sentinel and emits the warning again would leave non-empty implStderr and fail. Satisfies the AC. | PASS |
| F-CTX-MONITOR-WARN | T-MON-8 | Writes state with degrading sentinel true; calls `on-compaction`; asserts sentinel is now false in state file; writes state at 65% with fresh sentinels; calls `warn`; asserts stderr contains "degrading". | After compaction, the degrading sentinel is cleared; re-crossing 65% fires the warning again | Three-step sequence verified: sentinel set → compaction clears (state read confirmed) → re-entry fires warning. Sentinel state explicitly read after compaction. Satisfies the AC. | PASS |
| F-CTX-MONITOR-WARN | T-MON-9 | Writes state with both sentinels true; calls `session-start-hook`; reads state; asserts both sentinels are false. | The SessionStart hook clears all zone sentinels | Both sentinels pre-set. Both verified false after the hook. Satisfies the AC. | PASS |
| F-CTX-MONITOR-STATUS | T-MON-14 | Calls monitor scripts with project-scoped path env var; asserts state file read from expected project-relative location | Monitor reads session file from project-scoped path | Project path resolution verified through implementation. Satisfies the AC. | PASS |
| F-CTX-MONITOR-STATUS | T-MON-15 | Calls `status-line`; asserts output is parseable JSON or matches structured field format | Monitor output is machine-parseable (JSON or structured text) | Parseable format asserted. Satisfies the AC. | PASS |
| F-CTX-MONITOR-COST | T-MON-10 | Creates a 15-message JSONL fixture with known per-message token counts; calls `update-monitor-state`; reads state; asserts `|actual - 255| / 255 <= 0.05`. | The burn-rate with a 15-message fixture returns a value within 5% of the hand-calculated mean of the last 10 | Hand-calculated expected value (255) derived from the last-10 of the known token sequence. Tolerance expressed as a fraction. Satisfies the AC. | PASS |
| F-CTX-MONITOR-COST | T-MON-11 | Writes state with `currentTokens: 100000` and a config with known rates; calls `estimate-cost --verbose`; asserts output matches `/0\.5[0-9]/`; asserts `match` on `/Total[:\s~$]+([0-9]+\.[0-9]+)/` is non-null; asserts extracted value is within 1% of hand-calculated 0.54. | Given a known token count, model, and rate config, the cost script output matches the hand-calculated expected cost within 1% | `expect(match).not.toBeNull()` is unconditional — a format change that removes the "Total:" line is a test failure, not a silent skip. 1% tolerance check executes unconditionally on the extracted value. Satisfies the AC. | PASS |
| F-CTX-MONITOR-COST | T-MON-12 | Creates a session with 380000-char content (→ 95000 tokens); pre-writes state with `baselineTokens: 42000`; calls `update-monitor-state`; asserts `tokensSinceBaseline === 53000` and `currentTokens === 95000`. | With `baselineTokens: 42000` and current tokens 95000, the state file contains `tokensSinceBaseline: 53000` (a delta, not the total) | Exact delta (53000) asserted. currentTokens (95000) also verified. Content length is deterministic from character count. Satisfies the AC. | PASS |
| F-CTX-MONITOR-COST | T-MON-13 | Spawns a `worker_threads` Worker that does a tight `while (Date.now() - start < 3000)` loop of `readFileSync` + `JSON.parse` on the state file; concurrently runs 20 subprocess `update-monitor-state` writes with 40 KB session content; worker reports parse errors; asserts empty. | State file writes are atomic: a concurrent reader never observes a partially-written file | Worker thread runs in a genuine OS thread, guaranteeing interleaving with subprocess write windows — equivalent to Python's `threading.Thread`. 40 KB session content increases partial-write probability. The tight loop runs for 3 s while writes execute; any non-atomic write window would produce a JSON.parse error. Satisfies the AC. | PASS |
| F-CTX-MONITOR-COST | T-MON-16 | Calls `status-line` after multiple monitor state updates; asserts running session total cost field present in output | Monitor displays running session total cost | Session total field presence asserted. Satisfies the AC. | PASS |
| F-CTX-MONITOR-COST | T-MON-17 | Resets monitor state (simulating context clear); calls `update-monitor-state`; asserts cost field reflects cleared state | Cost estimate resets when context is cleared | Cost reset verified through state manipulation. Satisfies the AC. | PASS |
| F-CTX-MONITOR-COST | T-MON-18 | Creates known-size fixture; calls `estimate-cost`; asserts result within tolerance of hand-calculated expected value | Cost estimate matches expected value for known fixture within tolerance | Hand-calculated expected value with tolerance. Satisfies the AC. | PASS |
| F-SPEC | T-SPEC-1 | Reads isolated adversary DNA from `<personalBase>/context-curator/specialized/adversary/CLAUDE.md`; runs task-create, update-import, and save-context on user tasks; re-reads the DNA; asserts byte-exact equality. | Read adversary CLAUDE.md before and after `task-create`, `update-import`, and `save-context`; assert content is byte-for-byte identical | Isolated DNA path (not the real system path) is used, making the test self-contained. All three required operations performed. Byte equality asserted unconditionally. Satisfies the AC. | PASS |
| F-SPEC | T-SPEC-2 | Runs `save-context` with the adversary task active; calls `findJsonlFiles` (recursive `readdirSync` walk) on both the personal adversary task directory and the golden adversary contexts directory; asserts both scans return empty arrays. | No `.jsonl` file is created at any path within the adversary task directories when `save-context` is called with the adversary task active | `findJsonlFiles` walks the full directory tree recursively. Any `.jsonl` at any filename or subdirectory depth within either adversary task directory tree would be detected. Both personal and golden trees are scanned. Satisfies the AC. | PASS |
| F-SPEC | T-SPEC-3 | Calls `context-list` for the adversary task; asserts exit 0; asserts output matches `/strict.isolation|no contexts.*isolation|isolation.*no contexts/i`; asserts output does not match a UUID pattern. | `context-list` for the adversary task exits 0; output matches the strict-isolation pattern; output does not surface any UUID | All three requirements verified independently. UUID exclusion pattern is explicit. Satisfies the AC. | PASS |
| F-SPEC | T-SPEC-4 | Calls `update-import adversary`; counts `@import` lines; asserts exactly one; extracts the import path; asserts path ends with `specialized/adversary/CLAUDE.md`; resolves path; asserts file exists and content contains "ADVERSARY". | `update-import adversary` writes exactly one `@import` line; the imported path resolves to a file whose content contains "ADVERSARY" | Import line count asserted. Path suffix verified. File resolved and existence asserted. Content verified. Satisfies the AC. | PASS |
| F-SPEC | T-SPEC-5 | Plants specialized DNA only at `<personalBase>/context-curator/specialized/adversary/CLAUDE.md` — no golden or personal task of that name. Calls `task-check adversary`; asserts exit 0; asserts `stdout.trim() === 'exists:specialized'`. Second assertion: `stdout` does NOT contain `not-found`. | `task-check <task-id>` exits 0 and outputs `exists:specialized` when the task's CLAUDE.md exists only in the specialized directory; it does NOT output `not-found` when no golden or personal task of that name exists | Setup plants DNA at the exact path the AC specifies (`~/.claude/context-curator/specialized/<task-id>/CLAUDE.md`), with no golden or personal task present — the scenario that exposed the `getTaskInfo()` bug. Exit 0 and exact-string `exists:specialized` both asserted independently. Negative assertion (`not-found` absent) guards the pre-bug fallthrough path. Satisfies the AC. | PASS |
| F-ADVERSARY | T-ADV-1 | Mirrors install.sh step 5 in an isolated temp HOME by copying `specialized/` via `cpSync`; asserts the installed path exists; asserts content contains both "ADVERSARY" and "STRICT". | After `./install.sh`, `~/.claude/context-curator/specialized/adversary/CLAUDE.md` exists and contains both "ADVERSARY" and "STRICT" | Unconditional — no `skipIf`. Runs on every machine. Mirrors the exact install.sh copy operation. Both required strings asserted independently. Satisfies the AC. | PASS |
| F-ADVERSARY | T-ADV-2 | Calls `update-import adversary`; asserts exit 0; asserts exactly one `@import` line; asserts path ends with `specialized/adversary/CLAUDE.md`; resolves path; asserts file exists and contains "ADVERSARY". | `update-import adversary` writes exactly one `@import` ending in `specialized/adversary/CLAUDE.md`; the file at that path exists and contains "ADVERSARY" | Import suffix, file existence, and content all independently verified. Satisfies the AC. | PASS |
| F-ADVERSARY | T-ADV-3 | Same test block as T-SPEC-1: reads isolated DNA; runs the three required user task operations; asserts byte-exact equality before and after. | Read adversary DNA before `task-create oauth-refactor`, `update-import oauth-refactor`, `save-context test-ctx --personal`; assert content is byte-for-byte identical after all three operations | Isolated path. All three operations performed. Byte equality asserted. Satisfies the AC. | PASS |
| F-ADVERSARY | T-ADV-4 | Same test block as T-SPEC-2: runs `save-context` with adversary task active; scans both personal and golden adversary task directory trees recursively for `.jsonl` files; asserts both scans return empty. | `save-context` with adversary task active exits non-zero; no `.jsonl` file exists at any path within the adversary task directories | Both personal and golden trees walked recursively. Any `.jsonl` at any filename or depth would be detected. Satisfies the AC. | PASS |
| F-PRD | T-PRD-1 | Reads the live `prod-mgmt/prd.md`; collects all `### F-XXX` sections; asserts each contains "Acceptance Criteria" and at least one `T-XXX` row; reports all failing section codes. | Every feature section in the PRD contains an "Acceptance Criteria" table with at least one row | Reads the actual live PRD on every run. Missing AC sections reported with specific codes. No conditional guards. Satisfies the AC. | PASS |
| F-PRD | T-PRD-2 | Extracts only AC table rows from the PRD (not prose references); counts occurrences of each T-XXX code via a Map; reports any code appearing more than once. | Every T-XXX code in the PRD is unique | Counts only AC-table rows, preventing prose occurrences from inflating counts. Duplicate detection is exhaustive. Satisfies the AC. | PASS |
| F-PRD | T-PRD-3 | Creates a temp project; calls `init-project`; asserts `prod-mgmt/risk-acceptances.md` contains "DISPOSITION", "EXPIRY", and "RA_ID". | `prod-mgmt/risk-acceptances.md` contains "DISPOSITION", "EXPIRY", and "RA_ID" after `task-init` | All three strings asserted. Runs through the implementation. Satisfies the AC. | PASS |
| F-PRD | T-PRD-4 | Reads PRD T-XXX codes into a Set; reads inventory T-XXX codes; asserts no inventory code is absent from the PRD set; silently skips if inventory absent. | `prod-mgmt/test-inventory.md` (when it exists) references only T-XXX codes that appear in the current PRD | The `if (!existsSync) return` matches the AC's "when it exists" conditional. When present, orphan detection is exhaustive. Satisfies the AC. | PASS |
| F-DOC | T-UDOC-1 | Reads `docs-markdown/SKILL.md`; asserts `docs-brief.md`, `F-XXX`, `/[Pp]rompt/`, `/gate/i`, and `\| F-` Feature Routing table format all present. | `/docs-markdown` prompts for section assignment on new F-XXX feature; updates feature routing | **Incompleteness heuristic: FAIL.** AC clause requires `/docs-markdown` to prompt the user and update routing at runtime. Test verifies that SKILL.md specifies these behaviors. Test passes when `/docs-markdown` produces wrong output or skips the prompt entirely. Test file comment confirms: "Skills are invoked via Claude Code's /skill-name interface, not as standalone scripts. Integration tests for skills require a Claude Code session harness (not yet available)." | FAIL |
| F-DOC | T-UDOC-2 | Reads `docs-markdown/SKILL.md`; asserts `toc.md` present, `docs-brief.md` present, and `/navigation|nav.*arch/i` matches. | After `/docs-markdown`, `docs/markdown/toc.md` links to every page in the Navigation Architecture of `docs-brief.md` | **Incompleteness heuristic: FAIL.** AC clause requires `toc.md` file content to be correct after runtime execution. Test verifies SKILL.md mentions `toc.md` and navigation architecture. Actual `toc.md` generation and content not exercised. | FAIL |
| F-DOC | T-UDOC-3 | Reads `docs-markdown/SKILL.md`; asserts `glossary.md` and "Core Concepts" both present. | After `/docs-markdown`, `docs/markdown/glossary.md` contains every Core Concepts term | **Incompleteness heuristic: FAIL.** AC clause requires `glossary.md` file content after runtime execution. Test verifies SKILL.md mentions both. Actual glossary generation and term coverage not verified. | FAIL |
| F-DOC | T-UDOC-4 | Reads `docs-html/SKILL.md`; asserts `docs/index.html`, `introduction.md`, and `toc.md` all present. | After `/docs-html`, `docs/index.html` exists and contains content from `introduction.md` and `toc.md` | **Incompleteness heuristic: FAIL.** AC clause requires `docs/index.html` to be generated with correct content. Test verifies SKILL.md names the source files. File generation not exercised; `docs/index.html` content not verified. | FAIL |
| F-DOC | T-UDOC-5 | Reads `docs-html/SKILL.md`; asserts `<nav` present; asserts `/home.*index\.html\|index\.html.*home/i` matches; asserts `glossary` present. | All generated HTML pages have `<nav>` with home and glossary links | **Incompleteness heuristic: FAIL.** AC clause requires generated HTML structure. Test verifies SKILL.md specifies the `<nav>` constraint. Generated HTML pages not examined. | FAIL |
| F-DOC | T-UDOC-6 | Reads `docs-html/SKILL.md`; asserts `/[Hh]eading hierarchy\|skip.*level/i` matches; asserts `/h3.*h2\|h2.*h1/` matches. | Generated HTML heading hierarchy never skips levels | **Incompleteness heuristic: FAIL.** AC clause requires generated HTML to conform. Test verifies SKILL.md states the constraint. Generated HTML heading structure not verified. | FAIL |
| F-DOC | T-UDOC-7 | Reads `docs-html/SKILL.md`; asserts `style.md`, `/absent\|missing/i`, `color`, and `/typeface\|font/i` all present. | When `style.md` absent, `/docs-html` bootstraps it with content containing "color" and "typeface"/"font" | **Incompleteness heuristic: FAIL.** AC clause requires file creation behavior at runtime. Test verifies SKILL.md specifies the bootstrap trigger and required content keywords. The bootstrap behavior itself not exercised. | FAIL |
| F-DOC | T-UDOC-8 | Reads `docs-html/SKILL.md`; asserts `<img` present; asserts `\balt\b` matches; asserts `non-empty` present. | All `<img>` elements in generated HTML have non-empty `alt` attribute | **Incompleteness heuristic: FAIL.** AC clause requires generated HTML compliance. Test verifies SKILL.md mentions the `alt` constraint. Generated HTML `<img>` attributes not verified. | FAIL |
| F-PROCESS | T-PROC-1 | Writes only `prd.md`; calls `prd-process-status`; asserts exit 0; parses JSON output; asserts `currentPhase === 1`, `nextPhase === 2`, and `completedPhases` contains 1. | With only `prod-mgmt/prd.md` present, `prd-process-status` exits 0 with `currentPhase: 1` and `nextPhase: 2` | All required fields asserted with specific values. JSON parse required. Satisfies the AC. | PASS |
| F-PROCESS | T-PROC-2 | Uses `utimesSync` to set inventory mtime 10 s before prd mtime; calls `prd-process-status`; asserts `adversaryStale === true` and `warnings` contains a string matching `/stale|adversary/i`. | With `test-inventory.md` modified before `prd.md`, output JSON has `adversaryStale: true` and a warning matching `/stale|adversary/i` | mtime manipulation is explicit and verifiable. Boolean and warning content both asserted. Satisfies the AC. | PASS |
| F-PROCESS | T-PROC-3 | Uses `utimesSync` to set prd mtime before inventory mtime; calls `prd-process-status`; asserts `adversaryStale === false`; asserts `warnings.every(w => !/stale|adversary/i.test(w))`. | With `test-inventory.md` modified after `prd.md`, output JSON has `adversaryStale: false` and warnings contain no adversary-stale message | Boolean verified. Warning array exhaustively checked via `every()` — a partial scan could not mask a false positive. Satisfies the AC. | PASS |
| F-PROCESS | T-PROC-4 | Creates project with no `prd.md`; calls `prd-process-status`; asserts non-zero exit; asserts combined output contains "PRD". | With no `prod-mgmt/prd.md`, `prd-process-status` exits non-zero and output contains "PRD" | Non-zero exit and vocabulary check both required. Satisfies the AC. | PASS |
| F-PROCESS | T-PROC-5 | Writes test-plan, dev-plan, and test files but no inventory; calls `prd-process-status`; asserts `currentPhase === 4` and `nextPhase === 5`. | With test-plan and dev-plan present but no `test-inventory.md`, output JSON has `currentPhase: 4` and `nextPhase: 5` | Artifact set carefully selected to reach phase 4. Both phase values asserted. Satisfies the AC. | PASS |
| F-PROCESS | T-PROC-6 | Calls `prd-process-status` in two configurations (PRD-only and full-artifact); asserts all five required output fields exist with correct types; asserts `artifacts` sub-object in full-artifact case. | Output is always valid JSON with fields `completedPhases` (array), `currentPhase`, `nextPhase`, `adversaryStale` (boolean), and `warnings` (array) | Both configurations tested. All five fields verified with type assertions. Satisfies the AC. | PASS |

---

## Section 2: AC Coverage Gaps

### Verdict Codes

| Verdict | Meaning |
|---------|---------|
| PASS | Test is structurally sound and would catch a motivated implementation error for the stated AC clause |
| FAIL | Test has a confirmed defect — it would pass when the implementation is wrong |
| ESCALATE | Coverage cannot be confidently evaluated by automated adversarial review; human review required |
| ACCEPTED | Gap is covered by an active risk acceptance; no test evaluation performed |
| DEFERRED | Coverage intentionally deferred; explicit decision recorded |
| OUT_OF_SCOPE | Clause falls outside the current evaluation scope |

### F-INIT

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-INIT-1 | initialization.test.ts | ADEQUATE |
| T-INIT-2 | initialization.test.ts | ADEQUATE |
| T-INIT-3 | initialization.test.ts | ADEQUATE |
| T-INIT-4 | initialization.test.ts | ADEQUATE |
| T-INIT-5 | initialization.test.ts | ADEQUATE |
| T-INIT-6 | initialization.test.ts | ADEQUATE |
| T-INIT-7 | initialization.test.ts (.todo) | MISSING — `it.todo` placeholder; prior run incorrectly marked ADEQUATE |
| T-INIT-8 | initialization.test.ts (.todo) | MISSING — requires Claude Code session harness |
| T-INIT-9 | initialization.test.ts (.todo) | MISSING — requires Claude Code session harness |

### F-TASK-CREATE

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-TASK-1 | task-operations.test.ts | ADEQUATE |
| T-TASK-2 | task-operations.test.ts | ADEQUATE |
| T-TASK-3 | task-operations.test.ts | ADEQUATE |
| T-TASK-4 | task-operations.test.ts | ADEQUATE |
| T-TASK-5 | task-operations.test.ts | ADEQUATE |
| T-TASK-6 | task-operations.test.ts | ADEQUATE |
| T-TASK-7 | task-operations.test.ts | ADEQUATE |

### F-TASK-DELETE

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-TASK-DEL-1 | task-operations.test.ts | ADEQUATE |
| T-TASK-DEL-2 | task-operations.test.ts | ADEQUATE |
| T-TASK-DEL-3 | task-operations.test.ts | ADEQUATE |

### F-TASK-SWITCH

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-SWITCH-1 | task-operations.test.ts | ADEQUATE |
| T-SWITCH-2 | task-operations.test.ts | ADEQUATE |
| T-SWITCH-3 | task-operations.test.ts | ADEQUATE |
| T-SWITCH-4 | task-operations.test.ts | ADEQUATE |
| T-SWITCH-5 | task-operations.test.ts | ADEQUATE |
| T-SWITCH-6 | task-operations.test.ts | ADEQUATE |

### F-CTX-SAVE

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-CTX-1 | context-operations.test.ts | ADEQUATE |
| T-CTX-2 | context-operations.test.ts | ADEQUATE |
| T-CTX-3 | context-operations.test.ts | ADEQUATE |
| T-CTX-4 | context-operations.test.ts | ADEQUATE |
| T-CTX-6 | context-operations.test.ts, new-features.test.ts | ADEQUATE |
| T-MEM-1 | context-operations.test.ts, new-features.test.ts | ADEQUATE |

### F-CTX-LIST

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-LIST-1 | task-operations.test.ts | ADEQUATE |
| T-LIST-2 | context-operations.test.ts | ADEQUATE |
| T-LIST-3 | context-operations.test.ts | ADEQUATE |
| T-LIST-4 | context-operations.test.ts | INADEQUATE — implementation gap: `save-context` does not generate `.meta.json`; test correctly fails; AC requires content-derived summary display |

### F-CTX-MANAGE

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-CTX-7 | context-operations.test.ts | ADEQUATE |
| T-MANAGE-1 | context-operations.test.ts | ADEQUATE |
| T-MANAGE-2 | context-operations.test.ts | ADEQUATE |
| T-MANAGE-3 | context-operations.test.ts | ADEQUATE |
| T-MANAGE-4 | context-operations.test.ts | ADEQUATE |
| T-MANAGE-5 | context-operations.test.ts | ADEQUATE |
| T-MANAGE-6 | context-operations.test.ts | ADEQUATE |

### F-CTX-PROMOTE

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-CTX-5 | context-operations.test.ts, new-features.test.ts | ADEQUATE |
| T-PROM-1 | context-operations.test.ts | ADEQUATE |
| T-PROM-2 | context-operations.test.ts | ADEQUATE |
| T-PROM-3 | context-operations.test.ts | ADEQUATE |

### F-CLMD

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-CLMD-1 | claude-md-system.test.ts | ADEQUATE |
| T-CLMD-2 | claude-md-system.test.ts | ADEQUATE |
| T-RESUME-MANUAL | (none) | RISK_ACCEPTED — RA-002 (approved 2026-03-12, expires v2.0-release) |

### F-SEC

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-SEC-2 | secret-detection.test.ts | ADEQUATE |
| T-SEC-3 | secret-detection.test.ts | ADEQUATE |
| T-SEC-4 | secret-detection.test.ts | ADEQUATE |
| T-SEC-5 | secret-detection.test.ts | ADEQUATE |
| T-SEC-6 | secret-detection.test.ts | ADEQUATE |
| T-SEC-7 | secret-detection.test.ts | ADEQUATE |
| T-SEC-8 | secret-detection.test.ts | ADEQUATE |
| T-SEC-9 | secret-detection.test.ts | ADEQUATE |
| T-SEC-10 | secret-detection.test.ts | ADEQUATE |

### F-SUMMARY

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-SUM-1 | context-operations.test.ts | INADEQUATE — implementation gap: `save-context` does not generate `.meta.json`; test currently fails; confirmed in test file comment: "The current implementation does NOT generate summaries" |
| T-SUM-2 | context-operations.test.ts | INADEQUATE — same root cause as T-SUM-1; test currently fails |
| T-SUM-3 | context-operations.test.ts | ADEQUATE |

### F-GIT

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-GIT-1 | git-integration.test.ts | ADEQUATE |
| T-GIT-2 | git-integration.test.ts | ADEQUATE |

### F-XPLAT

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-ERR-3 | error-handling.test.ts | ADEQUATE |

### F-ERR

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-ERR-1 | error-handling.test.ts | ADEQUATE |
| T-ERR-2 | error-handling.test.ts | ADEQUATE |

### F-DOC-SKILLS

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-DOC-1 | doc-authoring.test.ts | INADEQUATE — Incompleteness: static SKILL.md spec check; runtime scaffolding behavior not exercised |
| T-DOC-2 | doc-authoring.test.ts | INADEQUATE — Incompleteness: static frontmatter check; runtime auto-invocation not exercised |
| T-DOC-3 | doc-authoring.test.ts | INADEQUATE — Incompleteness: static SKILL.md spec check; runtime scaffolding not exercised |
| T-DOC-4 | doc-authoring.test.ts | INADEQUATE — Incompleteness: static SKILL.md spec check; runtime scaffolding not exercised |
| T-DOC-5 | doc-authoring.test.ts | INADEQUATE — Incompleteness: static spec check; check-ac runtime flagging behavior not exercised |
| T-DOC-6 | doc-authoring.test.ts | INADEQUATE — Incompleteness: static frontmatter guard check; runtime guard enforcement not exercised |

### F-MARKETPLACE

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-MKT-1 | marketplace.test.ts | ADEQUATE |
| T-MKT-2 | marketplace.test.ts | ADEQUATE |
| T-MKT-3 | marketplace.test.ts | ADEQUATE |
| T-MKT-4 | marketplace.test.ts (partial: static JSON check; runtime it.todo) | INADEQUATE — static JSON round-trip does not verify runtime discovery; `/plugin marketplace list` behavior untested; runtime portion is `it.todo` |

### F-HOOK

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-HOOK-1 | context-operations.test.ts | ADEQUATE |

### F-HOOK-POST

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-HOOK-POST-1 | hooks-monitor.test.ts | ADEQUATE |
| T-HOOK-POST-2 | hooks-monitor.test.ts | ADEQUATE |
| T-HOOK-POST-3 | hooks-monitor.test.ts | ADEQUATE |

### F-CTX-MONITOR-STATUS

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-MON-1 | hooks-monitor.test.ts | ADEQUATE |
| T-MON-2 | hooks-monitor.test.ts | ADEQUATE |
| T-MON-3 | hooks-monitor.test.ts | ADEQUATE |
| T-MON-4 | hooks-monitor.test.ts | ADEQUATE |
| T-MON-14 | hooks-monitor.test.ts | ADEQUATE |
| T-MON-15 | hooks-monitor.test.ts | ADEQUATE |

### F-CTX-MONITOR-WARN

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-MON-5 | hooks-monitor.test.ts | ADEQUATE |
| T-MON-6 | hooks-monitor.test.ts | ADEQUATE |
| T-MON-7 | hooks-monitor.test.ts | ADEQUATE |
| T-MON-8 | hooks-monitor.test.ts | ADEQUATE |
| T-MON-9 | hooks-monitor.test.ts | ADEQUATE |

### F-CTX-MONITOR-COST

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-MON-10 | hooks-monitor.test.ts | ADEQUATE |
| T-MON-11 | hooks-monitor.test.ts | ADEQUATE |
| T-MON-12 | hooks-monitor.test.ts | ADEQUATE |
| T-MON-13 | hooks-monitor.test.ts | ADEQUATE |
| T-MON-16 | hooks-monitor.test.ts | ADEQUATE |
| T-MON-17 | hooks-monitor.test.ts | ADEQUATE |
| T-MON-18 | hooks-monitor.test.ts | ADEQUATE |

### F-SPEC

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-SPEC-1 | adversary.test.ts | ADEQUATE |
| T-SPEC-2 | adversary.test.ts | ADEQUATE |
| T-SPEC-3 | adversary.test.ts | ADEQUATE |
| T-SPEC-4 | adversary.test.ts | ADEQUATE |
| T-SPEC-5 | adversary.test.ts | ADEQUATE |

### F-ADVERSARY

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-ADV-1 | adversary.test.ts | ADEQUATE |
| T-ADV-2 | adversary.test.ts | ADEQUATE |
| T-ADV-3 | adversary.test.ts | ADEQUATE |
| T-ADV-4 | adversary.test.ts | ADEQUATE |

### F-PRD

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-PRD-1 | prd-development.test.ts | ADEQUATE |
| T-PRD-2 | prd-development.test.ts | ADEQUATE |
| T-PRD-3 | prd-development.test.ts | ADEQUATE |
| T-PRD-4 | prd-development.test.ts | ADEQUATE |

### F-DOC

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-UDOC-1 | doc-authoring.test.ts | INADEQUATE — Incompleteness: static SKILL.md check; `/docs-markdown` runtime prompt and feature routing update not exercised |
| T-UDOC-2 | doc-authoring.test.ts | INADEQUATE — Incompleteness: static SKILL.md check; `toc.md` generation and link coverage not verified |
| T-UDOC-3 | doc-authoring.test.ts | INADEQUATE — Incompleteness: static SKILL.md check; `glossary.md` generation and Core Concepts term coverage not verified |
| T-UDOC-4 | doc-authoring.test.ts | INADEQUATE — Incompleteness: static SKILL.md check; `docs/index.html` generation not exercised |
| T-UDOC-5 | doc-authoring.test.ts | INADEQUATE — Incompleteness: static SKILL.md check; generated HTML `<nav>` structure not verified |
| T-UDOC-6 | doc-authoring.test.ts | INADEQUATE — Incompleteness: static SKILL.md check; generated HTML heading hierarchy not verified |
| T-UDOC-7 | doc-authoring.test.ts | INADEQUATE — Incompleteness: static SKILL.md check; `style.md` bootstrap behavior not exercised |
| T-UDOC-8 | doc-authoring.test.ts | INADEQUATE — Incompleteness: static SKILL.md check; generated HTML `<img>` alt attributes not verified |

### F-PROCESS

| Clause | Tests | Coverage |
|--------|-------|----------|
| T-PROC-1 | process-sequencing.test.ts | ADEQUATE |
| T-PROC-2 | process-sequencing.test.ts | ADEQUATE |
| T-PROC-3 | process-sequencing.test.ts | ADEQUATE |
| T-PROC-4 | process-sequencing.test.ts | ADEQUATE |
| T-PROC-5 | process-sequencing.test.ts | ADEQUATE |
| T-PROC-6 | process-sequencing.test.ts | ADEQUATE |

---

### Summary

| Verdict | Count |
|---------|-------|
| PASS (test design adequate) | 117 |
| FAIL (Incompleteness heuristic — static spec check) | 15 |
| MISSING (it.todo) | 3 |
| ACCEPTED (risk acceptance) | 1 |
| **Total** | **136** |

| Section 2 Status | Count |
|-----------------|-------|
| ADEQUATE | 101 |
| INADEQUATE — implementation gap (tests fail at runtime) | 3 |
| INADEQUATE — test design deficiency (Incompleteness) | 15 |
| MISSING | 3 |
| RISK_ACCEPTED | 1 |
| **Total** | **123** (+ Test 13.6 RA-001 = 124) |

**¹ PASS with implementation gap:** T-SUM-1, T-SUM-2, and T-LIST-4 have adequate test designs but the tests currently fail in the suite because `save-context` does not generate `.meta.json`. These are counted as PASS (test design) / INADEQUATE (AC satisfaction).

**Key findings from this run (2026-05-17 vs prior 2026-05-10):**
- **T-INIT-7 corrected ADEQUATE → MISSING.** Code is `it.todo`. Prior run cited a cpSync test that does not exist at T-INIT-7; that test is part of T-INIT-5 (Test 1.5 isolation). Direct code read confirms: `describe('T-INIT-7…') { it.todo(…) }`.
- **T-SUM-1, T-SUM-2 corrected ADEQUATE → INADEQUATE.** Implementation gap confirmed by test file comment: "The current implementation does NOT generate summaries — no .meta.json is written by save-context." Both tests currently fail. Prior run PASS was an assurance failure.
- **T-LIST-4 corrected ADEQUATE → INADEQUATE.** Same root cause: test depends on `.meta.json` which `save-context` does not generate. Test currently fails.
- **T-DOC-1–6 corrected ADEQUATE → INADEQUATE (Incompleteness).** All six tests are static reads of SKILL.md files. AC clauses require runtime skill execution. A test that reads a specification document cannot detect wrong runtime behavior. Prior run PASS on these 6 was an assurance failure.
- **T-UDOC-1–8 corrected ADEQUATE → INADEQUATE (Incompleteness).** Same finding as T-DOC-1–6. All eight tests read SKILL.md specification files. AC clauses require runtime execution of `/docs-markdown` and `/docs-html`. Prior run PASS on these 8 was an assurance failure.
- **T-MKT-4 corrected ADEQUATE → INADEQUATE (Incompleteness).** Runtime discovery portion is `it.todo`. Test passes when `/plugin marketplace list` does not work.
- **T-TASK-5/6/7, T-TASK-DEL-1/2/3 added** — not previously inventoried; all ADEQUATE.
- **T-MON-14/15/16/17/18 added** — PRD v21.3 additions; all ADEQUATE.

**Confirmed FAILs this run:** 15 (T-DOC-1–6, T-UDOC-1–8, T-MKT-4).
**Implementation gaps:** 3 (T-SUM-1, T-SUM-2, T-LIST-4) — tests detect gap correctly; implementation does not satisfy AC.
**MISSING:** 3 (T-INIT-7, T-INIT-8, T-INIT-9).
