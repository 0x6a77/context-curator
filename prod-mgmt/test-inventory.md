# Test Inventory — Context Curator
**Adversary Run:** 2026-05-09 (LoD2)
**PRD Version:** 21.0
**Risk Acceptances loaded:** RA-001 (ACCEPTED, expires 2026-09-12), RA-002 (ACCEPTED, expires v2.0-release)
**Isolation note:** This session constructed F-PROCESS (prd-process-status.ts, process-sequencing skill, process-sequencing.test.ts). For T-PROC-1 through T-PROC-6, STRICT isolation is compromised. Structural heuristics applied mechanically; confirmation bias cannot be excluded.

---

## Section 1: Test Inventory

| T-code | F-code | Test File | Verdict | Notes |
|--------|--------|-----------|---------|-------|
| T-INIT-1 | F-INIT | initialization.test.ts | PASS | Pre-condition guard present; unconditional assertion; file path explicitly checked |
| T-INIT-2 | F-INIT | initialization.test.ts | PASS | Backup pre-condition check; byte-for-byte content comparison |
| T-INIT-3 | F-INIT | initialization.test.ts | PASS | `expect(defaultContent).toBe(originalContent)` — character-for-character |
| T-INIT-4 | F-INIT | initialization.test.ts | PASS | Both runs exit 0; content identity asserted after each run; stash idempotency tested |
| T-INIT-5 | F-INIT | initialization.test.ts | PASS | Uses save-context through implementation (not path arithmetic); disjoint paths asserted |
| T-INIT-6 | F-INIT | initialization.test.ts + prd-development.test.ts | PASS | DISPOSITION, EXPIRY, and RA_ID all verified; idempotency tested |
| T-INIT-7 | F-INIT | initialization.test.ts | ESCALATE | `.todo` — no test code; project-scope skill install unverified |
| T-INIT-8 | F-INIT | initialization.test.ts | ESCALATE | `.todo` — no test code; project-scope precedence unverified |
| T-INIT-9 | F-INIT | initialization.test.ts | ESCALATE | `.todo` — no test code; cloned-repo zero-setup unverified |
| T-TASK-1 | F-TASK-CREATE | task-operations.test.ts | PASS | Test checks `# Task:`, `## Focus`, `## Key Areas`, `## Guidelines` — matches implementation and corrected PRD AC (prd.md updated 2026-05-09 to align with test-plan.md and implementation) |
| T-TASK-2 | F-TASK-CREATE | task-operations.test.ts | PASS | Non-zero exit; both original-case and lowercase directory confirmed absent |
| T-TASK-3 | F-TASK-CREATE | task-operations.test.ts | PASS | All four verbatim description lines asserted `toContain()` in Focus section |
| T-TASK-4 | F-TASK-CREATE | task-operations.test.ts | PASS | Non-zero exit and no directory created for empty description |
| T-SWITCH-1 | F-TASK-SWITCH | task-operations.test.ts | ESCALATE | Not confirmed in partial review; A→B→C→A single-@import guarantee not seen |
| T-SWITCH-2 | F-TASK-SWITCH | task-operations.test.ts | ESCALATE | Not confirmed in partial review; "no contexts" / "fresh" message not seen |
| T-SWITCH-3 | F-TASK-SWITCH | task-operations.test.ts | ESCALATE | Test groups 3.1/3.2 exist but personal-before-golden ordering assertion not confirmed |
| T-SWITCH-4 | F-TASK-SWITCH | task-operations.test.ts | ESCALATE | `--json` flag and `contexts: []` assertion not seen in partial review |
| T-SWITCH-5 | F-TASK-SWITCH | task-operations.test.ts | ESCALATE | UUID-suppression in switch UI not confirmed |
| T-SWITCH-6 | F-TASK-SWITCH | task-operations.test.ts | ESCALATE | Default-task restore with "vanilla"/"restored" output not confirmed |
| T-CTX-1 | F-CTX-SAVE | context-operations.test.ts | PASS | Exact path verified at `<personalDir>/tasks/<task-id>/contexts/<name>.jsonl` |
| T-CTX-2 | F-CTX-SAVE | context-operations.test.ts | PASS | `isValidJsonl()` + non-empty content; unconditional (no `if fileExists` guard) |
| T-CTX-3 | F-CTX-SAVE | context-operations.test.ts | PASS | Three separate secret types tested (Stripe, GitHub, AWS); golden file absent after each blocked save |
| T-CTX-4 | F-CTX-SAVE | context-operations.test.ts | PASS | 150-message context; size pre-condition asserted >100KB before running script |
| T-CTX-5 | F-CTX-PROMOTE | new-features.test.ts | PASS | 150-message context >100KB pre-condition; golden file confirmed absent after rejection |
| T-CTX-6 | F-CTX-SAVE | new-features.test.ts | PASS | Backup file existence and original content identity both verified |
| T-CTX-7 | F-CTX-MANAGE | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-LIST-1 | F-CTX-LIST | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-LIST-2 | F-CTX-LIST | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-LIST-3 | F-CTX-LIST | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-LIST-4 | F-CTX-LIST | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-MANAGE-1 | F-CTX-MANAGE | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-MANAGE-2 | F-CTX-MANAGE | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-MANAGE-3 | F-CTX-MANAGE | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-MANAGE-4 | F-CTX-MANAGE | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-MANAGE-5 | F-CTX-MANAGE | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-MANAGE-6 | F-CTX-MANAGE | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-PROM-1 | F-CTX-PROMOTE | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-PROM-2 | F-CTX-PROMOTE | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-PROM-3 | F-CTX-PROMOTE | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-CLMD-1 | F-CLMD | claude-md-system.test.ts | PASS | Multiple "should not modify root CLAUDE.md" tests; byte-for-byte comparison after task create and task switch |
| T-CLMD-2 | F-CLMD | claude-md-system.test.ts | ESCALATE | Exactly-one-@import after two switches not confirmed in partial review |
| T-RESUME-MANUAL | F-CLMD | (none) | ACCEPTED | RA-002 (approved 2026-03-12, expires v2.0-release); structural proxy in claude-md-system.test.ts covers @import wiring |
| T-MEM-1 | F-CTX-SAVE | new-features.test.ts | PASS | `waitFor(fileExists(memoryPath))` prevents race; task-id and context-name both asserted in content |
| T-SEC-2 | F-SEC | secret-detection.test.ts | PASS | `toMatch(/akia/i)` required; non-zero exit asserted; AKIA prefix explicitly mandated |
| T-SEC-3 | F-SEC | secret-detection.test.ts | ESCALATE | STRIPE_KEY_CONTEXT fixture imported; specific sk_test_ / sk_live_ assertion not confirmed |
| T-SEC-4 | F-SEC | secret-detection.test.ts | ESCALATE | MULTIPLE_SECRETS_CONTEXT imported; three-role distribution assertion not confirmed |
| T-SEC-5 | F-SEC | secret-detection.test.ts | ESCALATE | SECRET_TEST_CASES imported (includes AKIAIOSFODNN7EXAMPLE); specific true-positive assertion not confirmed |
| T-SEC-6 | F-SEC | secret-detection.test.ts | ESCALATE | Post-redaction all-lines-valid-JSON + re-scan "clean" assertion not confirmed |
| T-SEC-7 | F-SEC | secret-detection.test.ts | ESCALATE | Exact-count "5 secret(s) found" assertion not confirmed |
| T-SEC-8 | F-SEC | secret-detection.test.ts | ESCALATE | GITHUB_TOKEN_CONTEXT imported; `ghp_` / "github" assertion not confirmed |
| T-SEC-9 | F-SEC | secret-detection.test.ts | ESCALATE | PRIVATE_KEY_CONTEXT imported; RSA private key pattern assertion not confirmed |
| T-SEC-10 | F-SEC | secret-detection.test.ts | ESCALATE | PASSWORD_CONTEXT imported; password pattern assertion not confirmed |
| T-SUM-1 | F-SUMMARY | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-SUM-2 | F-SUMMARY | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-SUM-3 | F-SUMMARY | context-operations.test.ts | ESCALATE | Not confirmed in partial review |
| T-GIT-1 | F-GIT | git-integration.test.ts | PASS | gitignore creation and CLAUDE.md entry verified; git check-ignore confirmed in initialization.test.ts |
| T-GIT-2 | F-GIT | git-integration.test.ts | ESCALATE | Relative-path form of personal storage assertion not confirmed in partial review |
| T-ERR-1 | F-ERR | error-handling.test.ts | PASS | Non-zero exit; "init" or "not initialized" required; stack-trace explicitly excluded from stderr |
| T-ERR-2 | F-ERR | error-handling.test.ts | ESCALATE | Malformed-JSONL non-zero-exit assertion not confirmed in partial review |
| T-ERR-3 | F-XPLAT | error-handling.test.ts | ESCALATE | Space-in-path test not seen in partial review (only Test 13.1–13.2 reviewed) |
| T-DOC-1 | F-DOC-SKILLS | doc-authoring.test.ts | ESCALATE | `.todo` — pending Claude Code session harness |
| T-DOC-2 | F-DOC-SKILLS | doc-authoring.test.ts | ESCALATE | `.todo` — pending Claude Code session harness |
| T-DOC-3 | F-DOC-SKILLS | doc-authoring.test.ts | ESCALATE | `.todo` — pending Claude Code session harness |
| T-DOC-4 | F-DOC-SKILLS | doc-authoring.test.ts | ESCALATE | `.todo` — pending Claude Code session harness |
| T-DOC-5 | F-DOC-SKILLS | doc-authoring.test.ts | ESCALATE | `.todo` — pending Claude Code session harness |
| T-DOC-6 | F-DOC-SKILLS | doc-authoring.test.ts | ESCALATE | `.todo` — pending Claude Code session harness |
| T-MKT-1 | F-MARKETPLACE | marketplace.test.ts | ESCALATE | `.todo` — install.sh manifest write verified in install.sh but no automated test |
| T-MKT-2 | F-MARKETPLACE | marketplace.test.ts | ESCALATE | `.todo` — authoring-only bundle install not tested |
| T-MKT-3 | F-MARKETPLACE | marketplace.test.ts | ESCALATE | `.todo` — version mismatch check not tested |
| T-MKT-4 | F-MARKETPLACE | marketplace.test.ts | ESCALATE | `.todo` — custom team manifest discovery not tested |
| T-HOOK-1 | F-HOOK | context-operations.test.ts | ESCALATE | Noted as moved to context-operations.test.ts in new-features.test.ts comment; assertion not reviewed directly |
| T-HOOK-POST-1 | F-HOOK-POST | hooks-monitor.test.ts | ESCALATE | `.todo` — pending script implementation verification |
| T-HOOK-POST-2 | F-HOOK-POST | hooks-monitor.test.ts | ESCALATE | `.todo` — pending script implementation verification |
| T-HOOK-POST-3 | F-HOOK-POST | hooks-monitor.test.ts | ESCALATE | `.todo` — pending script implementation verification |
| T-MON-1 | F-CTX-MONITOR | hooks-monitor.test.ts | ESCALATE | `.todo` — pending script implementation |
| T-MON-2 | F-CTX-MONITOR | hooks-monitor.test.ts | ESCALATE | `.todo` — pending script implementation |
| T-MON-3 | F-CTX-MONITOR | hooks-monitor.test.ts | ESCALATE | `.todo` — pending script implementation |
| T-MON-4 | F-CTX-MONITOR | hooks-monitor.test.ts | ESCALATE | `.todo` — pending script implementation |
| T-MON-5 | F-CTX-MONITOR | hooks-monitor.test.ts | ESCALATE | `.todo` — pending script implementation |
| T-MON-6 | F-CTX-MONITOR | hooks-monitor.test.ts | ESCALATE | `.todo` — pending script implementation |
| T-MON-7 | F-CTX-MONITOR | hooks-monitor.test.ts | ESCALATE | `.todo` — pending script implementation |
| T-MON-8 | F-CTX-MONITOR | hooks-monitor.test.ts | ESCALATE | `.todo` — pending script implementation |
| T-MON-9 | F-CTX-MONITOR | hooks-monitor.test.ts | ESCALATE | `.todo` — pending script implementation |
| T-MON-10 | F-CTX-MONITOR | hooks-monitor.test.ts | ESCALATE | `.todo` — pending script implementation |
| T-MON-11 | F-CTX-MONITOR | hooks-monitor.test.ts | ESCALATE | `.todo` — pending script implementation |
| T-MON-12 | F-CTX-MONITOR | hooks-monitor.test.ts | ESCALATE | `.todo` — pending script implementation |
| T-MON-13 | F-CTX-MONITOR | hooks-monitor.test.ts | ESCALATE | `.todo` — pending script implementation |
| T-SPEC-1 | F-SPEC | adversary.test.ts | PASS | DNA read before and after three user operations; `expect(dnaAfter).toBe(dnaBefore)` |
| T-SPEC-2 | F-SPEC | adversary.test.ts | PASS | Non-zero exit; `/strict.isolation\|not.*available\|specialized.*task/i` regex; no `.jsonl` at adversary path |
| T-SPEC-3 | F-SPEC | adversary.test.ts | PASS | Exit 0; isolation message matched; UUID pattern confirmed absent from output |
| T-SPEC-4 | F-SPEC | adversary.test.ts | PASS | Exactly one @import; imported path ends with `specialized/adversary/CLAUDE.md`; file exists on disk |
| T-ADV-1 | F-ADVERSARY | adversary.test.ts | PASS | Mirrors install.sh step in isolated temp HOME; unconditional; "ADVERSARY" and "STRICT" both required |
| T-ADV-2 | F-ADVERSARY | adversary.test.ts | PASS | Exact path suffix `specialized/adversary/CLAUDE.md`; file resolves on disk; "ADVERSARY" in content |
| T-ADV-3 | F-ADVERSARY | adversary.test.ts | PASS | Isolated DNA path used (not real system); byte-for-byte identity after task-create + update-import + save-context |
| T-ADV-4 | F-ADVERSARY | adversary.test.ts | PASS | Exit non-zero; isolation message required; context file absent at adversary personal path |
| T-PRD-1 | F-PRD | prd-development.test.ts | PASS | Reads live PRD; every `### F-XXX` section must contain AC table with at least one T-XXX row; structural gate |
| T-PRD-2 | F-PRD | prd-development.test.ts | PASS | All T-XXX codes scanned from AC rows only; duplicate detection with `Map<string, number>`; empty-duplicates asserted |
| T-PRD-3 | F-PRD | prd-development.test.ts | PASS | init-project creates risk-acceptances.md; DISPOSITION + EXPIRY + RA_ID all verified |
| T-PRD-4 | F-PRD | prd-development.test.ts | PASS | Orphaned T-XXX codes in test-inventory not in PRD raise failure; gracefully skipped if test-inventory absent |
| T-UDOC-1 | F-DOC | doc-authoring.test.ts | ESCALATE | `.todo` — pending Claude Code session harness |
| T-UDOC-2 | F-DOC | doc-authoring.test.ts | ESCALATE | `.todo` — pending Claude Code session harness |
| T-UDOC-3 | F-DOC | doc-authoring.test.ts | ESCALATE | `.todo` — pending Claude Code session harness |
| T-UDOC-4 | F-DOC | doc-authoring.test.ts | ESCALATE | `.todo` — pending Claude Code session harness |
| T-UDOC-5 | F-DOC | doc-authoring.test.ts | ESCALATE | `.todo` — pending Claude Code session harness |
| T-UDOC-6 | F-DOC | doc-authoring.test.ts | ESCALATE | `.todo` — pending Claude Code session harness |
| T-UDOC-7 | F-DOC | doc-authoring.test.ts | ESCALATE | `.todo` — pending Claude Code session harness |
| T-UDOC-8 | F-DOC | doc-authoring.test.ts | ESCALATE | `.todo` — pending Claude Code session harness |
| T-PROC-1 | F-PROCESS | process-sequencing.test.ts | PASS ⚠️ | prd.md only → currentPhase=1, nextPhase=2, completedPhases contains 1. **ISOLATION CAVEAT.** |
| T-PROC-2 | F-PROCESS | process-sequencing.test.ts | PASS ⚠️ | setMtime makes inventory older than prd; adversaryStale=true; warnings match /stale\|adversary/i. **ISOLATION CAVEAT.** |
| T-PROC-3 | F-PROCESS | process-sequencing.test.ts | PASS ⚠️ | setMtime makes inventory newer; adversaryStale=false; no stale warning in warnings array. **ISOLATION CAVEAT.** |
| T-PROC-4 | F-PROCESS | process-sequencing.test.ts | PASS ⚠️ | Empty project → non-zero exit; "PRD" in stdout+stderr. **ISOLATION CAVEAT.** |
| T-PROC-5 | F-PROCESS | process-sequencing.test.ts | PASS ⚠️ | test-plan + dev-plan + test file, no inventory → currentPhase=4, nextPhase=5. **ISOLATION CAVEAT.** |
| T-PROC-6 | F-PROCESS | process-sequencing.test.ts | PASS ⚠️ | Two test cases: PRD-only and full-artifact; all five required fields type-checked; artifacts sub-object verified. **ISOLATION CAVEAT.** |

---

## Section 2: AC Coverage Gaps

### Resolved (2026-05-09)

**T-TASK-1 — PRD AC updated to match implementation and test-plan**

- Root cause: PRD AC was stale — it specified `## Task, ## Focus, ## Context, ## Notes` while the implementation, test-plan, and test all consistently used `# Task:, ## Focus, ## Key Areas, ## Guidelines`
- Resolution: prd.md T-TASK-1 AC updated to reflect the actual section headers; no code or test changes required
- Verdict changed from FAIL → PASS

---

### Zero-coverage feature clusters (all .todo)

| Feature | T-codes | Count | Blocking condition |
|---------|---------|-------|--------------------|
| F-CTX-MONITOR | T-MON-1 through T-MON-13 | 13 | All monitor scripts need test scaffolding; scripts implemented but untested |
| F-DOC | T-UDOC-1 through T-UDOC-8 | 8 | Claude Code session harness required |
| F-DOC-SKILLS | T-DOC-1 through T-DOC-6 | 6 | Claude Code session harness required |
| F-INIT (partial) | T-INIT-7, T-INIT-8, T-INIT-9 | 3 | Project-scope install feature not yet implemented |
| F-HOOK-POST | T-HOOK-POST-1 through T-HOOK-POST-3 | 3 | Test scaffolding needed; scripts implemented but untested |
| F-MARKETPLACE | T-MKT-1 through T-MKT-4 | 4 | Selective-bundle install not yet implemented |

**Total: 37 T-codes with zero test code.** F-CTX-MONITOR is the highest-risk gap — 13 T-codes, all monitor scripts implemented in the current sprint, zero automated coverage.

---

### Partial-review ESCALATEs — test files exist, specific assertions unconfirmed

The following test files were only partially reviewed. A follow-up pass reading these files in full may promote some entries from ESCALATE to PASS.

| Feature | T-codes | Test file |
|---------|---------|-----------|
| F-TASK-SWITCH | T-SWITCH-1 through T-SWITCH-6 | task-operations.test.ts (Group 3, line 195+) |
| F-CTX-LIST | T-LIST-1 through T-LIST-4 | context-operations.test.ts |
| F-CTX-MANAGE | T-CTX-7, T-MANAGE-1 through T-MANAGE-6 | context-operations.test.ts |
| F-CTX-PROMOTE | T-PROM-1, T-PROM-2, T-PROM-3 | context-operations.test.ts |
| F-CLMD | T-CLMD-2 | claude-md-system.test.ts |
| F-SEC | T-SEC-3 through T-SEC-10 | secret-detection.test.ts (fixtures imported, assertions not read) |
| F-SUMMARY | T-SUM-1 through T-SUM-3 | context-operations.test.ts |
| F-GIT | T-GIT-2 | git-integration.test.ts |
| F-ERR | T-ERR-2, T-ERR-3 | error-handling.test.ts |
| F-HOOK | T-HOOK-1 | context-operations.test.ts |

Prior adversary runs (2026-03-14) found vacuous guards and self-fulfilling assertions in related tests. Conservative treatment as ESCALATE is appropriate until confirmed.

---

### F-PROCESS isolation caveat (T-PROC-1 through T-PROC-6)

All six T-PROC tests and the prd-process-status.ts implementation were written in this session. STRICT isolation is compromised. Tests are structurally sound on mechanical review:

- mtime manipulation via `utimesSync` is explicit and testable
- exit-code checks are present for T-PROC-4
- JSON field types are verified in T-PROC-6
- adversaryStale boolean logic is straightforward (`testInventoryMtime < prdMtime`)

Remaining concern: tests and implementation may share a common misunderstanding of the phase-detection heuristics that neither catches. Independent verification recommended before shipping.

---

### Summary

| Verdict | Count |
|---------|-------|
| PASS | 32 |
| PASS ⚠️ (isolation caveat) | 6 |
| FAIL | 0 |
| ACCEPTED | 1 |
| ESCALATE | 74 |
| **Total** | **113** |

ESCALATE rate: 65%. Breakdown: 37 are `.todo` tests (no code exists), 37 are unreviewed in this pass (test files exist), and zero ESCALATE entries are unexpected structural gaps. No confirmed FAILs — the T-TASK-1 discrepancy was resolved by updating the stale PRD AC to match the implementation and test-plan.
