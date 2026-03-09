# Test Fixes Dev Plan — Adversarial Red Team Remediation

Generated from: `prod-mgmt/test-inventory.md`
Date: 2026-03-09

---

## Problem Summary

| Category | Count | Rule Violated | Example Pattern |
|----------|-------|---------------|-----------------|
| Missing exit-code assertion (success path) | 31 | ALWAYS assert `expect(result.exitCode).toBe(0)` on success paths | `runScript(...)` called, files checked, but no `expect(result.exitCode).toBe(0)` |
| Missing exit-code assertion (error path) | 8 | ALWAYS assert `expect(result.exitCode).not.toBe(0)` on error paths | `result.exitCode !== 0 \|\| output.includes(...)` — OR escape |
| OR escape hatches (banned T1 / T2) | 24 | NEVER use vacuous OR fallback | `output.includes('error') \|\| result.exitCode !== 0` |
| Conditional file assertions (T2 guard) | 9 | NEVER use `if (fileExists(path)) { expect(...) }` | `if (fileExists(workingMdPath)) { expect(content).toContain(...) }` |
| Weak @import regex | 5 | Use `expect(content).toMatch(/@import\s+\S+CLAUDE\.md/)` with path validation | `expect(content).toMatch(/@import/)` — matches any substring |
| Vacuous / tautological assertion | 4 | NEVER use `expect(true).toBe(true)` or `typeof x === 'number'` | `expect(result.exitCode === 0 \|\| result.exitCode === 1).toBe(true)` |
| Indefinite count regex instead of exact count | 3 | Use `\b${n}\b` word-boundary regex, not `/\d+/` | `/\b\d+\s*(msg\|message)/i` instead of `\b5\b` or `\b30\b` |
| Self-fulfilling / vacuous setup (T3) | 3 | Test must invoke implementation code, not just verify its own setup | Test writes isolation marker itself, then asserts it didn't appear elsewhere |
| Missing DoD clause coverage (zero tests) | 6 | Add entirely new test cases for untested DoD clauses | T-CTX-3, T-CTX-5, T-CTX-6, T-LIST-4, T-HOOK-1, T-MEM-1 |
| Wrong script under test | 1 | Test must run the correct script | Test13.3/"should detect corrupt JSONL" runs `context-list`, not `scan-secrets` |
| Wrong fixture for DoD scenario | 1 | Fixture must match the scenario specified in DoD | T-PROM-2 test uses AWS key fixture; DoD requires `ghp_` token scenario |

---

## Per-File Fix Plan

### initialization.test.ts

Total fixes: 11 (Tier1: 4, Tier2: 3, Tier3: 2, Tier4: 2, Tier5: 0)

| Test name | Tier | Problem | Fix |
|-----------|------|---------|-----|
| "should create .claude/ directory structure" | Tier1 | Missing `expect(result.exitCode).toBe(0)` before file assertions | Add `expect(result.exitCode).toBe(0)` immediately after `runScript` call |
| "should create .claude/ directory structure" | Tier2 | `/@import/` matches any substring; path not validated | `/@import/` → `expect(claudeMdContent).toMatch(/@import\s+\S+CLAUDE\.md/)` and add `expect(fileExists(importedPath)).toBe(true)` where `importedPath` is extracted from the match |
| "should create .gitignore with CLAUDE.md entry" | Tier1 | Missing `expect(result.exitCode).toBe(0)` | Add exit-code assertion before file checks |
| "should create .gitignore with CLAUDE.md entry" | Tier2 | `fileContains(path, 'CLAUDE.md')` matches comment lines | Replace with `expect(content).toMatch(/^CLAUDE\.md$/m)` to assert a bare effective gitignore rule |
| "should not create backup when no original CLAUDE.md exists" | Tier1 | Missing `expect(result.exitCode).toBe(0)` | Add exit-code assertion |
| "should work with git initialized" | Tier1 | Missing `expect(result.exitCode).toBe(0)` for `runScript` | Add exit-code assertion before `isGitIgnored` call |
| "should create backup of original CLAUDE.md" | Tier1 | Missing `expect(result.exitCode).toBe(0)`; pre-condition not asserted | Add exit-code assertion; add `expect(fileExists(backupPath)).toBe(false)` before `runScript` call |
| "should create default task with copy of original CLAUDE.md" | Tier1 | Missing `expect(result.exitCode).toBe(0)`; pre-condition not asserted | Add exit-code assertion; add `expect(fileExists(defaultTaskPath)).toBe(false)` before `runScript` call |
| "should create .claude/CLAUDE.md with @import directive" | Tier2 | `/@import\s+\S+CLAUDE\.md/` allows garbage path; pre-condition not asserted; missing exit-code | Add `expect(fileExists(claudeMdPath)).toBe(false)` before `runScript`; add exit-code; extract import path and assert the target file exists |
| "should not create duplicate directories" | Tier1 | Missing exit-code assertion on second `runScript` call | Add `expect(secondResult.exitCode).toBe(0)` |
| "should indicate already initialized on second run" | Tier2 | OR chain across 'already'/'exists'/'initialized' — T1 violation | Replace OR with single specific assertion: `expect(output).toMatch(/already\s+initialized/i)` |
| "should handle multiple projects independently" | Tier4 | T3 self-fulfilling: test writes isolation marker itself; null init-project passes | Rewrite: run `init-project` in both dirs; call `save-context` in project 1; assert `save-context`-created context file does NOT appear under project 2's personal dir |
| "should not create duplicate directories" — pre-condition | Tier3 | No `expect(fileExists(...)).toBe(true)` before content assertions on second run files | Add unconditional `expect(fileExists(claudeMdPath)).toBe(true)` before checking contents after second run |

---

### task-operations.test.ts

Total fixes: 16 (Tier1: 5, Tier2: 6, Tier3: 2, Tier4: 3, Tier5: 0)

| Test name | Tier | Problem | Fix |
|-----------|------|---------|-----|
| "should create task directory structure" | Tier1 | Missing `expect(result.exitCode).toBe(0)` | Add exit-code assertion |
| "should create task CLAUDE.md with description" | Tier1 | Missing `expect(result.exitCode).toBe(0)` | Add exit-code assertion |
| "should create task CLAUDE.md with description" | Tier2 | Section headers not validated for content following them; single keyword 'oauth' insufficient | Assert each section has non-empty content after the header; assert description appears specifically under `## Focus` section |
| "should update .claude/CLAUDE.md with import directive" | Tier1 | Missing `expect(result.exitCode).toBe(0)` | Add exit-code assertion |
| "should update .claude/CLAUDE.md with import directive" | Tier2 | Regex `/@import\s+\S+oauth-refactor\S+CLAUDE\.md/` allows any \S+ path; imported file existence not asserted | Extract match; assert extracted path resolves to an existing file with `expect(fileExists(resolvedPath)).toBe(true)` |
| "should provide resume instruction in output" | Tier2 | 'oauth-refactor' in output is circular — any arg-echoing script passes | Replace with `expect(output).toContain('--resume')` or `expect(output).toMatch(/resume.*oauth-refactor/i)` to assert it's a resume instruction, not just a name echo |
| "should reject task name with spaces" | Tier2 | `/invalid\|error/i` too broad; OR on stdout/stderr | Narrow to `expect(output).toMatch(/invalid.*(name\|task)/i)`; add `expect(fileExists(taskDir)).toBe(false)` |
| "should reject task name with special characters" | Tier3 | Missing `expect(fileExists(...)).toBe(false)` to confirm no directory created | Add unconditional `expect(fileExists(specialCharTaskDir)).toBe(false)` |
| "should capture full multi-line description" | Tier1 | Missing `expect(result.exitCode).toBe(0)` | Add exit-code assertion |
| "should capture full multi-line description" | Tier2 | Keywords checked anywhere in file; line structure not validated; Focus section not targeted | Assert keywords appear under `## Focus` section specifically; assert newlines preserved between description lines |
| "should handle empty description" | Tier2 | Accepts exitCode 0 — contradicts DoD requiring non-zero; T2 conditional | Replace if/else with: `expect(result.exitCode).not.toBe(0)` and `expect(fileExists(taskDir)).toBe(false)` |
| "should list personal contexts when switching" | Tier2 | Missing ordering assertion: indexOf("Personal") < indexOf("Golden") | Add `expect(output.indexOf('Personal')).toBeLessThan(output.indexOf('Golden'))` |
| "should list golden contexts when switching" | Tier2 | OR chain 'golden'/'oauth-deep-dive'/'team' — T1; missing exit-code | Replace with `expect(output).toContain('oauth-deep-dive')` and `expect(result.exitCode).toBe(0)` |
| "should list both personal and golden contexts" | Tier2 | OR chain including 'context' — tautology | Remove OR; use `expect(output).toContain('personal')` AND `expect(output).toContain('golden')` as separate assertions |
| "should indicate no contexts available and offer fresh start" | Tier2 | OR chain — T1; missing exit-code | Replace with `expect(output).toMatch(/no contexts|fresh/i)` covering DoD without generic fallback; add exit-code assertion |
| "should switch to default task" | Tier3 | `if (fileExists(workingMdPath)) { ... }` — T2 guard; missing exit-code | Remove guard: `expect(fileExists(workingMdPath)).toBe(true)` unconditionally; then content assertion; add exit-code |
| "should indicate vanilla mode restored" | Tier2 | OR chain 'default'/'vanilla'/'restored' — T1 | Replace with `expect(output).toMatch(/default|vanilla/i)` — drop generic 'restored' |
| "should update .claude/CLAUDE.md on each switch" | Tier3 | ALL assertions guarded by `if (fileExists(...))` — T2 escalation; null implementation passes | Remove guard entirely; add `expect(fileExists(workingMdPath)).toBe(true)` then assert content unconditionally on each switch |
| "T-LIST-4: AI-generated summary" | Tier4 | Zero coverage — no test asserts non-empty description string per context in list output | New test: create two named contexts; call `context-list`; `expect(output).toMatch(/ctx-name\s+.{10,}/m)` asserting non-empty description after each name |
| "T-CTX-4 size fix" | Tier4 | 'size' OR escape — not in DoD | Remove 'size' branch; assert `expect(output).toMatch(/100KB|too large/i)` only |

---

### context-operations.test.ts

Total fixes: 22 (Tier1: 4, Tier2: 8, Tier3: 3, Tier4: 7, Tier5: 0)

| Test name | Tier | Problem | Fix |
|-----------|------|---------|-----|
| "should save context to personal storage" | Tier1 | Missing `expect(result.exitCode).toBe(0)` | Add exit-code assertion |
| "should save context to personal storage" | Tier2 | No content validation — empty file at correct path passes | Add `expect(isValidJsonl(expectedPath)).toBe(true)` after existence check |
| "should save context to project directory for golden" | Tier2 | No content validation | Add `expect(isValidJsonl(goldenPath)).toBe(true)` |
| "should run secret scan before saving golden" | Tier4 | Uses CLEAN_CONTEXT — wrong fixture; DoD requires session WITH real AWS key; T-CTX-3 entirely untested | New test: call `save-context --golden` with `AWS_KEY_CONTEXT`; `expect(result.exitCode).not.toBe(0)`; `expect(output).toMatch(/aws|akia/i)` |
| "should reject context name with invalid characters" | Tier3 | Missing `expect(fileExists(invalidPath)).toBe(false)` | Add unconditional `expect(fileExists(invalidPath)).toBe(false)` after non-zero exit assertion |
| "should handle empty context gracefully" | Tier1 | `expect(result.exitCode === 0 \|\| result.exitCode === 1).toBe(true)` — vacuous tautology | Replace with `expect(result.exitCode).not.toBe(0)` |
| "should reject golden save when context exceeds 100KB" | Tier2 | 'size' OR branch not in DoD; fixture size not verified | Remove 'size'; `expect(output).toMatch(/100KB|too large/i)`; add `expect(fixtureBytes).toBeGreaterThan(100 * 1024)` before calling script |
| "should list all contexts for task" | Tier1 | No issues flagged — already adequate | No change needed (PASS) |
| "should show message counts" | Tier2 | `/\b\d+\s*(msg\|message)/i` — accepts any digit; DoD requires exact count | SMALL_CONTEXT=5 messages: `expect(output).toMatch(/\b5\b.*msg/i)`; createMediumContext()=30 messages: `expect(output).toMatch(/\b30\b.*msg/i)` |
| "should indicate no contexts found" | Tier2 | OR chain 'no context'/'none'/'0 context'/'empty' — T1 | Replace with `expect(output).toMatch(/no contexts|empty/i)` matching DoD exactly |
| "should error for non-existent task" | Tier2 | `result.exitCode !== 0 \|\| output.includes(...)` — exit-code OR makes string check irrelevant | Split into: `expect(result.exitCode).not.toBe(0)` AND `expect(output).toMatch(/not found|does not exist/i)` |
| "should report zero contexts" | Tier2 | OR chain including 'nothing' — T1; missing exit-code | Replace with `expect(output).toMatch(/no contexts|empty/i)`; add `expect(result.exitCode).toBe(0)` |
| "should list golden context with special indicator" | Tier2 | OR chain 'golden'/'⭐'/'team' — T1; missing exit-code | Replace with `expect(output).toContain('⭐')` OR `expect(output).toContain('golden')` with exit-code; drop 'team' |
| "should prevent golden context deletion without confirmation" | Tier3 | Setup uses `task-create '--golden'` as description — likely bug; T3 concern | Fix task-create call; add `expect(fileExists(goldenPath)).toBe(true)` before delete attempt; keep non-zero exit and file-still-exists assertions |
| "should successfully promote clean context" | Tier1 | Exit code only — no content verification; T-PROM-1 requires both copies identical | Add: `expect(fileExists(goldenPath)).toBe(true)` and `expect(readFile(goldenPath)).toBe(readFile(personalPath))` |
| "should copy to project golden directory" | Tier2 | No content verification | Add `expect(isValidJsonl(goldenPath)).toBe(true)` and byte-equality with personal copy |
| "should preserve original personal context" | Tier3 | Existence checked but not byte-equality; DoD says "byte-for-byte identical" | Add `expect(readFile(personalPath)).toBe(originalPersonalContent)` |
| "should detect secrets and warn/block" | Tier2 | Uses AWS fixture; DoD T-PROM-2 specifies `ghp_` token scenario | Add separate test with `ghp_` GitHub token context; assert `expect(output).toMatch(/github|ghp_/i)` and non-zero exit |
| "should offer redaction option" | Tier2 | OR chain 'secret'/'stripe'/'sk_'; missing exit-code; doesn't assert redaction option offered | Replace with `expect(result.exitCode).not.toBe(0)` AND `expect(output).toMatch(/redact/i)` |
| "should error for non-existent context" (promote) | Tier2 | 'error' OR chain — T1 | Replace with `expect(result.exitCode).not.toBe(0)` AND `expect(output).toMatch(/not found|does not exist/i)` |
| "should warn about already-golden context" | Tier2 | OR chain; missing exit-code assertion | Add `expect(result.exitCode).not.toBe(0)` AND replace OR with `expect(output).toMatch(/already.*golden|already exists/i)` |
| T-CTX-5: promote-context 100KB cap | Tier4 | Entirely untested DoD clause | New test: create 150KB personal context; call `promote-context`; `expect(result.exitCode).not.toBe(0)`; `expect(output).toMatch(/100KB|too large/i)` |
| T-CTX-6: overwrite protection backup | Tier4 | Entirely untested DoD clause | New test: save context twice with same name; assert `.backup-` file created on second save; assert backup contents equal first-save contents |
| T-CTX-3 coverage fix | Tier4 | Test4.2 uses clean context; DoD requires secret-containing session | New test under Test4.2 block: run `save-context --golden` with `AWS_KEY_CONTEXT`; assert non-zero exit and `expect(output).toMatch(/aws|akia/i)` |

---

### secret-detection.test.ts

Total fixes: 11 (Tier1: 2, Tier2: 7, Tier3: 1, Tier4: 1, Tier5: 0)

| Test name | Tier | Problem | Fix |
|-----------|------|---------|-----|
| "should identify AWS secret key pattern" | Tier2 | OR chain 'secret'/'key' + `/\d+/` — T1; `/\d+/` is banned pattern | Replace with `expect(output).toMatch(/secret.*key/i)` and drop `/\d+/` entirely; add `expect(result.exitCode).not.toBe(0)` |
| "should detect Stripe live key pattern" | Tier2 | OR chain 'stripe'/'sk_live'/'sk_test'/'secret'/'detected' — T1 | Replace with `expect(output).toMatch(/sk_live/i)` only; drop 'secret'/'detected' |
| "should detect both test and live keys" | Tier2 | OR between 'sk_test' and 'sk_live' — DoD requires BOTH detected | Split into two assertions: `expect(output).toContain('sk_test')` AND `expect(output).toContain('sk_live')` separately |
| "should detect GitHub personal access token" | Tier1 | OR chain 'github'/'ghp_'/'token'/'detected'; missing exit-code | Replace with `expect(output).toMatch(/github|ghp_/i)`; drop 'token'/'detected'; add `expect(result.exitCode).not.toBe(0)` |
| "should detect RSA private key header" | Tier1 | OR chain including 'key' — too generic; missing exit-code | Replace with `expect(output).toMatch(/rsa|private key/i)`; add exit-code assertion |
| "should detect password assignment patterns" | Tier2 | OR chain 'password'/'credential'/'detected'; missing exit-code | Replace with `expect(output).toMatch(/password|credential/i)`; drop 'detected'; add exit-code |
| "should report correct count of multiple secrets" | Tier2 | Checks count > 1; DoD says exactly 4; fixture has 5 distinct secrets; regex fragile | Reconcile fixture to exactly 4 distinct secrets; assert `expect(output).toMatch(/\b4\b/)` with context word |
| "should detect secrets in user, assistant, and tool_result messages" | Tier2 | Assumes JSON output format; crashes on non-JSON; length >= 3 doesn't verify 3 different message types | Rewrite: assert `expect(result.exitCode).not.toBe(0)`; assert output mentions all three message types: `expect(output).toMatch(/user.*message/i)`, `expect(output).toMatch(/assistant.*message/i)`, `expect(output).toMatch(/tool_result/i)` independently |
| "should produce clean valid JSONL after redaction" | Tier1 | Rescan exit code not asserted | Add `expect(rescanResult.exitCode).toBe(0)` |
| "should remove or mask secrets in output" | Tier3 | `if (fileExists(redactedPath))` — T2 guard | Remove guard; add `expect(fileExists(redactedPath)).toBe(true)` unconditionally; then content checks; add exit-code |
| "should report clean when no secrets found" | Tier2 | OR chain + `!output.includes('found')` tautology — T1 | Replace with `expect(result.exitCode).toBe(0)` AND `expect(output).toMatch(/clean/i)` only |

---

### claude-md-system.test.ts

Total fixes: 10 (Tier1: 4, Tier2: 4, Tier3: 2, Tier4: 0, Tier5: 0)

| Test name | Tier | Problem | Fix |
|-----------|------|---------|-----|
| "should show no git changes to root CLAUDE.md" | Tier1 | Missing exit-code assertions on `task-create` and `update-import` calls | Add `expect(result.exitCode).toBe(0)` after each `runScript` call |
| "should contain @import directive" | Tier2 | `fileContains(path, '@import')` matches any substring | Replace with `expect(content).toMatch(/@import\s+\S+CLAUDE\.md/)` |
| "should update on task switch" | Tier1 | Missing exit-code assertion; `fileContains` plain includes | Add exit-code assertion; replace with `expect(content).toMatch(/@import\s+\S+task-1\S+CLAUDE\.md/)` |
| "should have .gitignore with CLAUDE.md entry" | Tier2 | `fileContains` plain includes for 'CLAUDE.md' — comment line passes | Replace with `expect(content).toMatch(/^CLAUDE\.md$/m)` |
| "should be ignored by git" | Tier3 | T2 guard `if (fileExists(workingMdPath))` wraps isGitIgnored | Remove guard; add `expect(fileExists(workingMdPath)).toBe(true)` unconditionally; then `expect(isGitIgnored(...)).toBe(true)` |
| "should not appear in git status" | Tier2 | `.claude/.gitignore` not committed before staging; behavior git-version-dependent | Add `gitCommit(ctx.projectDir, 'add gitignore')` before `gitAdd` to ensure committed gitignore is respected |
| "should update import to auth task" | Tier1 | Missing exit-code; `content.includes('auth')` too broad | Add exit-code; replace with `expect(content).toMatch(/@import\s+\S+auth\S+CLAUDE\.md/)` |
| "should update import to payment task" | Tier1 | Missing exit-code; plain includes | Add exit-code; replace with `expect(content).toMatch(/@import\s+\S+payment\S+CLAUDE\.md/)` |
| "should update import to default task" | Tier2 | 'default' is generic; missing exit-code | Add exit-code; replace with `expect(content).toMatch(/@import\s+\S+default\S+CLAUDE\.md/)` |
| "should set up the correct @import path for /resume to read" | Tier3 | @import path string not verified to point to the same file that exists; no resolved-path cross-check | Extract import path from regex match; assert `expect(fileExists(resolvedImportPath)).toBe(true)` and `expect(resolvedImportPath).toBe(taskClaudeMdPath)` |

---

### git-integration.test.ts

Total fixes: 7 (Tier1: 1, Tier2: 1, Tier3: 0, Tier4: 2, Tier5: 2)

| Test name | Tier | Problem | Fix |
|-----------|------|---------|-----|
| "should include CLAUDE.md in .gitignore" | Tier2 | `fileContains` plain includes — comment line passes | Replace with `expect(content).toMatch(/^CLAUDE\.md$/m)` |
| "should not show .claude/CLAUDE.md in status" | Tier1 | `.claude/.gitignore` not committed before testing git-ignore behavior | Add `gitCommit(ctx.projectDir, 'commit gitignore')` before modifying `.claude/CLAUDE.md`; or use the already-correct pattern from Test11.7/"should be ignored by git check-ignore" |
| "should not include personal storage in git" | Tier4 | Vacuous: personal storage is in tmpdir outside repo; `git add .` can never reach it | Rewrite: run complete workflow (init → save-context); then `git add .`; assert no personal-dir path appears in `git status --porcelain` output. Requires moving personal storage to a subdirectory of projectDir for this test, or asserting that `git ls-files` does not contain any personal-path prefix |
| "should not cause conflicts when multiple developers work" | Tier5 | Vacuous: two separate repos with no shared remote cannot conflict; DoD concern is about team workflow with shared remote | Rewrite with bare git remote: create bare repo; clone twice; each clone creates a golden context; both push; assert no merge conflict markers (`UU`) in either worktree after pull |
| "should not include personal storage in git" (alt approach) | Tier4 | (See above) Need to cover the DoD property that personal storage paths are never tracked | Also assert: after `git add .` in projectDir, run `git ls-files`; assert none of the listed files contain the personal storage path prefix |
| T-HOOK-1: PreCompact auto-save | Tier4 | Entirely untested | New test: invoke `auto-save-context` with mock stdin (piped JSONL); assert timestamped file created at expected personal context path; `expect(fileExists(expectedTimestampedPath)).toBe(true)` |
| T-MEM-1: MEMORY.md updated after save | Tier4 | Entirely untested | New test: call `save-context` with task-id and context-name; assert `MEMORY.md` exists in personal dir; `expect(readFile(memoryPath)).toContain(taskId)` AND `expect(readFile(memoryPath)).toContain(contextName)` |

---

### error-handling.test.ts

Total fixes: 13 (Tier1: 2, Tier2: 8, Tier3: 1, Tier4: 1, Tier5: 1)

| Test name | Tier | Problem | Fix |
|-----------|------|---------|-----|
| "should handle missing .claude directory gracefully" | Tier2 | Anti-stack-trace check only catches `at Object.<anonymous>` | Add `expect(result.stderr).not.toMatch(/at\s+\w+\s+\(/)` to catch all common call-site stack frames |
| "should suggest running init" | Tier2 | `output.includes('init') \|\| exitCode !== 0` — exit-code OR makes string check irrelevant | Split: `expect(result.exitCode).not.toBe(0)` AND `expect(output).toMatch(/init/i)` separately |
| "should handle missing .claude directory on task operations" | Tier2 | OR chain: non-zero exit OR string — T1 | Split: `expect(result.exitCode).not.toBe(0)` AND `expect(output).toMatch(/not.*initialized|run init/i)` |
| "should detect corrupt JSONL" | Tier1 | Runs `context-list` not `scan-secrets`; asserts only `exitCode.toBeDefined()` — vacuous | Replace: run `scan-secrets` on the corrupt JSONL file; `expect(result.exitCode).not.toBe(0)` |
| "should handle invalid metadata gracefully" | Tier1 | `expect(result.exitCode === 0 \|\| result.exitCode === 1).toBe(true)` — vacuous tautology | Replace with `expect(result.exitCode).toBeDefined()` — actually NO. Replace with assertion specific to expected behavior: `expect(result.exitCode).not.toBe(0)` if invalid metadata is an error, or `expect(result.exitCode).toBe(0)` if gracefully handled, then assert output contains diagnostic message |
| "should handle permission errors gracefully" | Tier2 | OR chain on exit-code/string; silent skip on chmod failure | Wrap chmod in assertion: `expect(() => chmodSync(path, 0o000)).not.toThrow()`; then `expect(result.exitCode).not.toBe(0)` AND `expect(output).toMatch(/permission|access denied/i)` |
| "should validate task ID format" | Tier2 | Exit-code OR makes string check irrelevant; empty string crash passes | For each invalid ID: `expect(result.exitCode).not.toBe(0)` AND `expect(output).toMatch(/invalid.*task|invalid.*id/i)` |
| "should validate context name format" | Tier2 | Exit-code OR makes stderr check irrelevant | Split: `expect(result.exitCode).not.toBe(0)` AND `expect(output).toMatch(/invalid.*name|invalid.*context/i)` |
| "should provide helpful error for non-existent task" | Tier2 | OR chain including 'available' — vacuous | Replace with `expect(output).toMatch(/not found|does not exist/i)` only |
| "should provide helpful error for non-existent context" | Tier2 | Exit-code OR — T1 | Split: `expect(result.exitCode).not.toBe(0)` AND `expect(output).toMatch(/not found|does not exist/i)` |
| "should handle paths with spaces" | Tier3 | Only `.claude/CLAUDE.md` existence checked; DoD says "all operations work" | Add task-create and save-context calls within space-path dir; assert each exits 0 and creates expected files |
| "should create JSONL with consistent line endings" | Tier3 | Entire content assertion guarded by `if (existsSync(personalDir))` — T2; missing exit-code | Remove guard; add `expect(result.exitCode).toBe(0)` on save-context; add `expect(existsSync(personalDir)).toBe(true)` unconditionally |
| "should use LF line endings in generated files" | Tier3 | Both file checks inside `if (fileExists(path))` — T2 | Remove guards; add `expect(fileExists(path)).toBe(true)` unconditionally before each content check |
| T-ERR-3 paths-with-spaces coverage | Tier5 | DoD requires "all operations work" in space-path; only init-project tested | Requires ensuring task-create, save-context, context-list all run in space-path dir — moderate effort; add to existing Test12.4 block |

---

### new-features.test.ts

Total fixes: 0 (no test file referenced in inventory — if file exists, audit separately)

> Note: `new-features.test.ts` was listed in the scope but produced no inventory entries. Either the file has no adversarial failures or it does not exist yet. Verify with: `ls tests/integration/new-features.test.ts`

---

## Implementation Order

Apply fixes in tier order. Within each tier, start with the files that have the most fixes to unblock CI fastest.

### Tier 1 — Remove vacuous assertions and add missing exit-code checks (< 1 hr each, batch in one PR)

1. `initialization.test.ts` — 4 fixes: add `expect(result.exitCode).toBe(0)` to 4 tests; add pre-condition `expect(fileExists(path)).toBe(false)` to backup and default-task tests
2. `claude-md-system.test.ts` — 4 fixes: exit-code assertions on task-create/update-import chains; fix "should update on task switch" to use specific @import regex
3. `task-operations.test.ts` — 5 fixes: exit-code on task-create/list tests
4. `error-handling.test.ts` — 2 fixes: replace vacuous `exitCode === 0 || exitCode === 1` tautologies; fix "should detect corrupt JSONL" to run correct script
5. `secret-detection.test.ts` — 2 fixes: add exit-code assertions on GitHub and RSA detection tests; add rescan exit-code assertion

### Tier 2 — Remove OR escape hatches and strengthen weak string assertions (1-2 hr each)

6. `task-operations.test.ts` — 6 fixes: @import path validation, specific output assertions, empty-description DoD fix, OR chain removals in list tests
7. `context-operations.test.ts` — 8 fixes: message count exact assertion (`\b5\b`/`\b30\b`), 'size' OR removal, ghp_ scenario assertion, redaction assertion, OR chain removals
8. `error-handling.test.ts` — 8 fixes: split all exit-code OR patterns; strengthen anti-stack-trace regex; fix permission test
9. `secret-detection.test.ts` — 7 fixes: Stripe both-keys split, count fix (`\b4\b`), message-type rewrite, clean-output fix, OR chain removals
10. `claude-md-system.test.ts` — 4 fixes: @import regex strengthening; gitignore effective-rule check; commit gitignore before git status test
11. `git-integration.test.ts` — 1 fix: gitignore effective-rule check
12. `initialization.test.ts` — 3 fixes: @import path resolution, gitignore effective-rule, "already initialized" specific regex

### Tier 3 — Add unconditional fileExists checks before content assertions (1-2 hr each)

13. `task-operations.test.ts` — 2 fixes: remove T2 guards on default-task switch and update-import tests
14. `context-operations.test.ts` — 3 fixes: remove guard on golden deletion test; add unconditional existence to invalid-name test; byte-equality for promote personal copy
15. `secret-detection.test.ts` — 1 fix: remove guard on redacted-file content check
16. `claude-md-system.test.ts` — 2 fixes: remove isGitIgnored guard; resolve @import path and cross-check file
17. `error-handling.test.ts` — 3 fixes: remove guards on JSONL line-ending tests; add space-path additional operations

### Tier 4 — Add new test cases for DoD clauses with zero coverage (2-4 hr each, one PR per clause)

18. `context-operations.test.ts`: **T-CTX-3** — `save-context --golden` with real AWS key fixture → non-zero exit
19. `context-operations.test.ts`: **T-CTX-5** — `promote-context` with 150KB personal context → non-zero exit + "100KB"/"too large"
20. `context-operations.test.ts`: **T-CTX-6** — overwrite protection: save same name twice; assert `.backup-` file with original content
21. `task-operations.test.ts` / `context-operations.test.ts`: **T-LIST-4** — AI summary present after each context name in list output
22. `git-integration.test.ts`: **T-HOOK-1** — `auto-save-context` with mock stdin creates timestamped personal context file
23. `git-integration.test.ts`: **T-MEM-1** — `save-context` updates MEMORY.md with task-id and context-name
24. `git-integration.test.ts`: **T-GIT-2** (rewrite) — run full workflow, then `git ls-files`, assert no personal-storage path
25. `initialization.test.ts`: **T-INIT-5** (rewrite) — replace self-fulfilling isolation test with implementation-driven isolation via `save-context` in two project dirs

### Tier 5 — Architectural redesigns (1-2 days each, separate PRs)

26. `git-integration.test.ts`: **Test11.5 "should not cause conflicts"** — rewrite with bare git remote: `git init --bare remote.git`; clone twice; each clone saves a golden context; both push; pull in each; assert no `UU` conflict markers
27. `error-handling.test.ts`: **T-ERR-3 full coverage** — ensure all scripts (init, task-create, save-context, context-list) run correctly when the project path contains spaces; requires parameterised test across all CLI entry points
