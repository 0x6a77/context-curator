# PRD-Driven Development

PRD-driven development is a methodology built on a principle with decades of evidence behind it: high-quality upstream artifacts — requirements, acceptance criteria, user documentation — produce dramatically better outcomes than starting from code. The cost of a change scales with how late you make it. This methodology front-loads the human judgment that matters most, then uses automation to enforce everything after.

## The Full Process Flow

```
Phase 1: PRD Authoring
  Write features → F-XXX codes → T-XXX acceptance criteria

Phase 1a: User Documentation  ← you are here
  /docs-markdown → update markdown docs
  /docs-html → regenerate HTML
  Share with users → capture feedback → iterate

Phase 2: Test Plan
  AC clauses → concrete test cases (Setup/Execution/Validation)

Phase 3: Dev Plan
  Features → ordered implementation phases

Phase 4: Implementation
  Follow dev plan phases → write code → pass tests

Phase 5: Adversarial Review (Boss Fight)
  /task adversary → fresh session → test-inventory.md

  FAIL/ESCALATE?          All PASS/ACCEPTED?
       ↓                        ↓
Phase 6: Remediation     Phase 8: Verification
  Fix upstream              Tests pass + adversary clean

  Oscillating?
       ↓
Phase 7: Risk Acceptance
  Document and accept specific findings → re-run adversary
```

## Design First

Before anything is written down, the human does the design work — iteratively, until the product is right.

**Simulation sessions** — Using a conversational tool like Claude chat, explore features and user experience as if the product already exists. Try different flows. Stress-test edge cases. Apply the rule of dozens: if you haven't tried at least a dozen variations of a design decision — different command names, different interaction flows, different error messages — you haven't explored the space. The first version of an idea is almost never the right one. The right one usually only becomes visible after you've articulated and rejected enough wrong ones to understand the shape of the problem.

**Write the PRD** — Once the design is settled, capture it with F-XXX feature codes and T-XXX acceptance criteria. Every AC clause must be falsifiable: there's a concrete test that would fail for a wrong implementation. The `/prd` skill enforces this format.

**Read with a pen** — Before moving on, print the PRD and read it slowly, pen in hand. Tim Parks described the posture well: "There is something predatory, cruel even, about a pen suspended over a text. Like a hawk over a field, it is on the lookout for something vulnerable." That predatory quality is exactly what you need when reviewing your own PRD. Mark anything vague, circular, or that could be interpreted two ways — in the margin, immediately, in your own handwriting. Do not make a mental note. The markup is the process improvement. Commit the edits. The next cycle starts from the corrected document.

## Documentation Before Code

After the PRD is validated, generate user documentation — before any code is written.

The documentation is much easier for users to understand than a PRD. Sharing it early finds mismatches while they're cheap. A user who reads your docs and says "I'd never do it that way" costs a PRD revision. The same user encountering your released product costs a feature rewrite.

## The Evidence

The case for documentation-first is not intuitive — it has to be argued. The evidence comes from several independent research traditions:

**Requirements errors are the most expensive class of defect.** Barry Boehm's foundational studies, extended by NASA and IBM's Systems Sciences Institute, established that errors found during requirements and design cost roughly 1x to fix; the same error found after release costs 50–100x. While modern tooling has compressed this gradient somewhat, the directional truth is not seriously contested. Documentation shared with users during requirements discovery is requirements testing at the 1x cost point.

**Only users can evaluate understanding and discoverability.** Donald Norman's foundational work in *The Design of Everyday Things* (1988, rev. 2013) establishes that understanding and discoverability are the two most critical properties of a usable system — and both are properties that only users can evaluate. The designer always has the system's conceptual model loaded; users encounter it cold. Documentation is the mechanism that bridges the gap between the designer's model and the user's model. There is no other mechanism that works as cheaply.

**The value of early releases is the learning, not the artifact.** Eric Raymond (*The Cathedral and the Bazaar*) and the Lean Startup methodology (Ries, 2011) established that frequent early releases produce fast feedback loops. Fred Brooks affirmed that Harlan Mills proposed the same concept as early as 1971: deliver something to users as soon as possible and really start getting feedback from the field. Documentation, unlike code, has zero deployment cost. It is the purest possible early-release artifact.

**Fast feedback loops require something concrete to respond to.** Research on market-driven requirements engineering (Carreno & Winbladh, 2013; Iacob & Harrison, 2013) confirms that users are highly effective at identifying problems — but only when they have something concrete to respond to. A verbal description produces abstract feedback. A two-page plain-language doc with a workflow example produces actionable feedback: "I'd never do it that way," "what happens when X," "this assumes I already have Y." That is the feedback that prevents building the wrong thing.

**Writing documentation is a pressure test of the PRD.** When you sit down to write user documentation for a feature, you are forced to explain it in terms of what the user does and what the system does in response. This exercise regularly surfaces ambiguities that survived the PRD because they never had to be explained in non-technical terms. A feature that is internally consistent as an engineering spec may be confusing or incomplete as a user workflow. Writing the documentation exposes this before code exists.

## Automation for Everything After

Once the PRD is right and the docs are published, the remaining phases run through Claude skills that enforce correct sequencing and embedded strategies — test plan, dev plan, implementation, adversarial review. You don't have to remember the order or the rules; the skills carry that knowledge.

The adversarial review — the "boss fight" — is the integrity check at the end of this pipeline. An isolated reviewer with no knowledge of your intent evaluates whether your tests actually cover your requirements. You can only advance by genuinely passing it, not by adjusting tests until the adversary is satisfied.

## Document Authoring Skills

Four skills enforce idiomatic format when writing process artifacts. They're auto-invocable — Claude loads the right skill automatically when you open a PRD, test plan, or dev plan file.

### `/prd` — PRD Authoring

Loads when you work on a `*prd*.md` file. Enforces the F-XXX/T-XXX code system, falsifiable acceptance criteria, and the required feature section format.

**Commands:**
- `/prd new-feature` — scaffolds a complete feature section with placeholder F-XXX code, Expected Behaviors, Test Scenarios, and an Acceptance Criteria table
- `/prd check-ac` — reviews every AC clause in the PRD and flags anything vague, circular, or not independently testable

**What "vague" means:** An acceptance criterion like "the system handles errors gracefully" is vague — there's no test you can write that would fail for a wrong implementation. A strong criterion is specific and falsifiable: "saving a context over 100KB exits non-zero with output containing '100KB' or 'too large'."

### `/test-plan` — Test Plan Authoring

Loads when you work on a `*test-plan*.md` file. Enforces mandatory sections, banned test patterns, and fix priority tiers.

**Commands:**
- `/test-plan new` — scaffolds a complete test plan with all mandatory sections: testing philosophy, banned patterns list (minimum 6), fix priority tiers, environment setup, feature test groups, and summary

**The banned patterns are load-bearing.** Vacuous OR fallbacks, conditional file-existence guards, placeholder assertions, self-fulfilling setup — these are the patterns that make tests pass vacuously while the implementation is wrong. The adversary checks for all of them.

### `/dev-plan` — Dev Plan Authoring

Loads when you work on a `*dev-plan*.md` file. Enforces phase structure, design decision format, and PRD version reference.

**Commands:**
- `/dev-plan new` — scaffolds a complete dev plan: PRD version reference, executive summary, architecture overview, implementation phases, file structure table, key design decisions, and troubleshooting

### `/test-inventory` — Adversary Output Format

Only available when the adversary task is active. Loads the output schema so the adversary produces consistent inventory structure. Running `/test-inventory` outside the adversary task is an error by design.

## User Documentation: `/docs-markdown` and `/docs-html`

Documentation is generated immediately after every PRD update that introduces or changes user-facing behavior — before code is written. The reason: user documentation is the cheapest possible way to find out whether you've specified the right thing. A user who reads your documentation and says "I'd never do it that way" costs a PRD revision. The same user encountering your released product costs a feature rewrite.

### `/docs-markdown`

Updates the base markdown documentation set:

1. Reads `docs/docs-brief.md` — loads the core message, reader journey gates, navigation architecture, and editorial rules
2. Reads the PRD and identifies changed or new features
3. For each new feature not yet in the Feature Routing table: asks for a gate (1–4) and page assignment, then updates the table
4. Updates affected pages applying the editorial rules and gate-appropriate depth
5. Regenerates `toc.md` reflecting the navigation architecture in the brief
6. Updates `glossary.md` with new terms
7. Regenerates the permuted index

Run after every meaningful PRD update.

### `/docs-html`

Generates the navigable HTML documentation from the markdown base:

1. Reads `docs/style.md` for typeface, color, and layout conventions
2. Converts all markdown files to HTML with consistent navigation
3. Validates accessibility (WCAG 2.1 AA): heading hierarchy, alt text, contrast
4. Writes `docs/index.html` (introduction + TOC combined) as the shareable entry point

**Style guide:** `docs/style.md` governs the look of the generated HTML. Edit it to set typeface, colors, language register, and layout. If the file is absent, `/docs-html` writes sensible accessible defaults and reports them for your review.

**Invariant:** Markdown is always updated first. HTML files are never hand-edited — they're regenerated from markdown. This makes documentation diffs reviewable the same way code diffs are.

## The Adversary Task

The adversary is your LoD2 — the second line of defence in a three-lines-of-defence model:

| Line | Role | In this system |
|------|------|----------------|
| LoD1 | Engineering team — builds and owns the controls | Test authors |
| LoD2 | Independent challenge function — audits LoD1's controls | The adversary |
| LoD3 | Internal audit — out of scope | — |

The LoD2 relationship is structurally adversarial to LoD1 by governance design. The adversary does not report to the engineering team and produces no remediation guidance — findings go to the control owner (LoD1) to resolve. This independence is what gives the review value. An adversary that collaborates with the team it's reviewing isn't an adversary.

The adversary is a specialized task with strict context isolation — every session starts fresh, with no knowledge of prior sessions, your intent, or your constraints. It reads only what's in the project files.

```bash
/task adversary
# Completely fresh session with adversary DNA loaded
# Adversary scans the project, loads risk acceptances, runs review
# Output: prod-mgmt/test-inventory.md
```

**What the adversary produces:** `prod-mgmt/test-inventory.md` — a table with a row for every test, stating what the test actually does (not what it claims), which AC clause it covers, and a verdict: PASS, FAIL, ESCALATE, or ACCEPTED.

**ESCALATE** means the adversary can't confidently evaluate the test and a human must review it. This is better than a weak PASS.

**The adversary does not suggest fixes.** It states findings. The decision about what to do is yours.

### Risk Acceptances

When a finding can't be automated — because it requires a live Claude Code session, because you've oscillated between fixes, or because the cost of remediation exceeds the risk — document it in `prod-mgmt/risk-acceptances.md`:

```
RA_ID:         RA-003
SCOPE:         T-INIT-8, T-INIT-9
FINDING:       Project-scope skill resolution requires live Claude Code session
SEVERITY:      LOW
DISPOSITION:   ACCEPTED
RATIONALE:     No headless test harness available; behavior verified manually on each release
APPROVED_BY:   jeff.williams
APPROVED_DATE: 2026-05-09
EXPIRY:        v2.0-release
```

Re-run the adversary after adding an acceptance. The finding will be marked ACCEPTED rather than FAIL.

## Process Sequencing: `/prd-process`

The most common process failure is updating the PRD and starting to implement without re-running the adversary. The adversary's test inventory is now stale — covering the old feature set, not the current one.

```bash
/prd-process
```

Reports the current phase and whether anything is out of order:

```json
{
  "currentPhase": 4,
  "nextPhase": 5,
  "adversaryStale": true,
  "warnings": [
    "prd.md was modified after test-inventory.md — adversary run is stale. Run /task adversary before continuing."
  ]
}
```

When the adversary is stale and you try to do implementation work, `/prd-process` requires an explicit `--force` to proceed. This turns an accidental skip into a named, documented decision.

**Phase detection:**

| Phase | Complete When |
|-------|---------------|
| 1 — PRD Authoring | `prod-mgmt/prd.md` exists with at least one `### F-` section |
| 1a — Documentation | `docs/` HTML files exist and are newer than `prd.md` |
| 2 — Test Plan | `prod-mgmt/test-plan.md` exists |
| 3 — Dev Plan | `prod-mgmt/dev-plan.md` exists |
| 4 — Implementation | test files exist in `tests/` |
| 5 — Adversarial Review | `prod-mgmt/test-inventory.md` exists and is newer than `prd.md` |

## The Specialized Task Framework

The adversary is built on a specialized task framework that provides STRICT context isolation — no context restoration, no context saving, every invocation starts fresh. Isolation is enforced by hooks, not just instructions: a PreCompact hook blocks compaction saves and a SessionStart hook validates that no prior context was loaded.

STRICT isolation is the load-bearing element. If the adversary shares session context with your development sessions, it has been captured — it's a collaborator with a different label, not an adversary. Hook enforcement means this can't happen accidentally.

## Next Steps

- [For Teams](for-teams.md) — install just the authoring bundle, or share the full stack with your team
- [Managing Contexts](managing-contexts.md) — save deep PRD authoring sessions as golden contexts for the team
