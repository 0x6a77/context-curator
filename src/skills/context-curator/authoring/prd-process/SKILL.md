---
name: prd-process
description: >
  PRD-driven development process sequencing guard. Detects the current phase
  (PRD authoring, docs, test plan, dev plan, implementation, adversarial review,
  remediation, verification) and resists out-of-order steps. Use /prd-process
  to check status, or invoke any time the user proposes a phase-skipping action.
invocation: explicit
allowed-tools: Bash
---

# /prd-process — Process Sequencing Skill

## Purpose

This skill guards the Boss-Fight Coding process sequence. It detects where the project is in the development cycle and warns when steps are being attempted out of order — most commonly, implementation work happening before the adversary has reviewed the current PRD state.

## Phase Detection

Run the status script to determine current state:

```bash
npx tsx ~/.claude/context-curator/dist/scripts/prd-process-status.js
```

Parse the JSON output. Key fields:
- `currentPhase` — the most recently completed phase
- `nextPhase` — the next required phase
- `adversaryStale` — true when `prd.md` was modified after `test-inventory.md`
- `warnings` — list of sequencing problems detected
- `completedPhases` — array of all completed phases

## Phase Reference

| Phase | Name | Complete When |
|-------|------|---------------|
| 1 | PRD Authoring | `prod-mgmt/prd.md` exists with ≥1 `### F-` section |
| 1a | User Documentation | `docs/html/` exists with files newer than `prd.md` |
| 2 | Test Plan | `prod-mgmt/test-plan.md` exists |
| 3 | Dev Plan | `prod-mgmt/dev-plan.md` exists |
| 4 | Implementation | `.test.ts` files exist in `tests/` |
| 5 | Adversarial Review | `prod-mgmt/test-inventory.md` exists AND is newer than `prd.md` |
| 6/7 | Remediation / Risk Acceptance | Phase 5 findings resolved |
| 8 | Verification | Tests pass + adversary clean |

## On /prd-process (status check)

1. Run the status script
2. Report current state clearly:
   ```
   Process Status
   ──────────────────────────────
   Completed: Phase 1 (PRD) ✓, Phase 2 (Test Plan) ✓, Phase 3 (Dev Plan) ✓
   Current:   Phase 4 (Implementation)
   Next:      Phase 5 (Adversarial Review)

   ⚠️  Warnings:
   - prod-mgmt/prd.md was modified after test-inventory.md — adversary run is stale.
     Run /task adversary before continuing with implementation.
   ```
3. If there are no warnings, confirm the process is on track.

## On any implementation request (Phase 4 work)

Before helping with any of the following, run the status script:
- Writing new scripts, TypeScript files, or feature code
- Updating existing implementation files to add new features
- Running `npm build` or `tsc`

If `adversaryStale` is true OR `nextPhase` is 5:

```
⚠️  Process sequencing: The adversary has not reviewed the current PRD.

prod-mgmt/prd.md was updated more recently than prod-mgmt/test-inventory.md.
This means the adversary run is stale — it has not audited tests against the
current feature set.

Correct sequence before continuing implementation:
  1. /task adversary  →  run adversarial review
  2. Address any FAIL or INADEQUATE findings  →  fix tests upstream
  3. Return here for implementation

To bypass this warning and proceed anyway, say: "proceed with implementation --force"
```

Do NOT proceed with implementation until the user explicitly says `--force` or
acknowledges the warning and confirms they want to skip the adversary step.

## On any test plan request (Phase 1 → Phase 2 transition)

When the user asks to write, start, or update the test plan — before doing anything else:

1. Check recent git history for commits that look like fixes:
   ```bash
   git log --oneline --since="60 days ago" 2>/dev/null | grep -iE "fix|bug|patch|hotfix|revert|broken|wrong|incorrect"
   ```

2. Prompt the user:
   ```
   Before we start the test plan — were any bugs fixed or behaviors changed since
   the PRD was last updated?

   Hotfixes, ad-hoc edge case handling, and behavior corrections found during
   implementation all need AC rows in prd.md before the test plan is written —
   otherwise the test plan will not cover them and they stay untested.

   Recent commits that may be fixes:
   [output from git log above, or "none found"]

   → If yes: add AC rows to the relevant feature sections in prd.md first,
     then return here to write the test plan.
   → If no or already captured: confirm and we will proceed.

   To skip: "proceed to test plan --force"
   ```

3. Do NOT start writing the test plan until the user confirms all fixes are captured
   or explicitly uses \`--force\`.

## On any PRD update

After the user makes changes to \`prd.md\`, remind them:
```
PRD updated. Recommended next steps:
  1. If this update included bug fixes or behavior changes: add AC rows to the
     relevant feature sections before moving to the test plan.
  2. Run /docs-markdown then /docs-html (Phase 1a — update user docs)
  3. When ready for implementation: run /task adversary first (Phase 5)
     to audit tests against the new features before writing code.
```

The skill **warns and requires explicit bypass** — it does not hard-block.
The bypass phrase is "proceed with implementation --force" (or any clear statement
that the user acknowledges the warning and wants to continue).

Rationale: hard-blocking prevents legitimate exceptions (e.g., fixing a trivial
typo, updating a comment). Named bypass phrases make the out-of-order step conscious
and intentional rather than accidental.
