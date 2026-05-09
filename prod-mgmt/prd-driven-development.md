# PRD-Driven Development with Boss-Fight Coding

**Version:** 1.0
**Last Updated:** May 9, 2026

---

*Boss-Fight Coding is a governance-grade development process adapted from financial services LoD2 control assurance — the adversarial review phase earns the name because, like a boss fight, you can only advance by genuinely defeating it, not by talking your way past it.*

---

## Overview

PRD-Driven Development is a software development process that shifts cognitive labor upstream — into requirements, acceptance criteria, and adversarial test review — rather than concentrating it in code generation. The insight behind this approach: code is increasingly the cheapest part of the system. The expensive parts are always and have always been understanding what to build, specifying it precisely enough to verify, and having an honest accounting of what you actually have.

The name **Boss-Fight Coding** captures the spirit of it. The boss fight at the end of a level is the hardest part — the thing you must defeat to advance. In this process, the boss is the LoD2 adversary: an isolated, structurally adversarial reviewer that has no interest in helping you pass. If your acceptance criteria are vague, it will say so. If your tests are vacuous, it will say so. If you can't beat the adversary, your code doesn't ship. That forces quality investment into the only place it actually leads to better outcomes: the upstream artifacts.

This document describes the full process from PRD authoring through adversarial review, remediation, and risk acceptance — including the formats for all core artifacts.

---

## Why This Process Works

The traditional development workflow concentrates effort on code. PRD-Driven Development concentrates effort on specifications and tests — the artifacts that determine whether code is correct. This distinction matters most with AI-generated code:

- AI can generate code from good specs reliably
- AI cannot generate good specs from nothing
- AI cannot honestly evaluate whether its own output is correct
- A structurally adversarial AI with STRICT context isolation can honestly evaluate whether tests cover specs

The process exploits AI where it is strong (generation, pattern-matching, code execution) and uses structural controls (isolation, governance roles, explicit acceptance criteria) to compensate for where it is weak (honest self-evaluation, adversarial perspective).

The key insight from financial services LoD governance: the value of a second line of defense is entirely dependent on its independence from the first line. An adversary that shares context with the constructor is not an adversary — it's a collaborator with a different label. STRICT isolation is not just a technical detail; it is the load-bearing element of the entire control.

---

## The Human Work Cannot Be Delegated

There are two artifacts in this process where the human must do the hard cognitive work personally, extensively, and without shortcutting: the **PRD** and the **test inventory**. AI can help draft, suggest, and challenge — but the judgment calls are irreducibly human, and the quality of everything downstream depends entirely on the quality of these two documents.

**The PRD is where you decide what the system actually does.** Getting this right requires sustained, difficult thinking: what problem are you actually solving, what does correct behavior look like in edge cases, what should the system refuse to do, what are the acceptance criteria precise enough to be falsifiable? These questions cannot be answered by prompting an AI and accepting the first response. They require you to sit with the document, disagree with yourself, discover contradictions, and resolve them. Vague criteria that feel fine on first pass will be exposed as hollow the moment the adversary evaluates them — but by then you've already built the wrong thing. The cost of imprecision compounds forward through every phase.

**The test inventory is where you decide whether your evidence is honest.** The adversary produces a verdict for every test, but you must read and understand each COVERAGE_RATIONALE yourself. An adversary PASS that you don't understand is not a pass — it's a gap you haven't found yet. An adversary FAIL that feels unfair might be unfair, or it might be exposing a real weakness your instincts are defending against. You cannot resolve this distinction without reading carefully and thinking hard.

### Read with a Pen

Print both documents. Carry them. Mark them up with a red pen as you read.

This is not a metaphor. The physical act of reading a printed document with a pen in hand puts you in a different cognitive posture than reading on a screen. Tim Parks described it well: "There is something predatory, cruel even, about a pen suspended over a text. Like a hawk over a field, it is on the lookout for something vulnerable." That predatory quality is exactly what you need when reviewing your own PRD. You are looking for vagueness, for circular reasoning, for criteria that feel specific but aren't, for edge cases you've quietly assumed away.

The markup is the process improvement. When you find something wrong, mark it immediately — in the margin, in red, in your own handwriting. Do not make a mental note. Do not open a tab. The moment you move on without marking, you've lost the detail that only existed in the context of reading that paragraph in that moment. Later, commit the marked-up edits back to the document. No retrospective meeting required. The pen markup *is* the retrospective.

Applied to this process:

- Print the PRD at the start of each development cycle. Read it in full before writing a line of test code.
- Print the test inventory after every adversary run. Read every COVERAGE_RATIONALE, not just the FAILs.
- Mark anything you disagree with, don't understand, or want to revisit.
- Commit the edits. The next cycle starts from the corrected document.

The goal is to arrive at a state where you have personally read every acceptance criterion and can defend it — not because you wrote it, but because you've interrogated it.

---

## Pressure-Test Ideas Before You Build Them

The most expensive mistake in software development is building the wrong thing. The second most expensive is building the right thing with the wrong interface. Both of these are PRD problems, and both are discoverable before any code exists — if you invest the time.

**Use Claude chat as a simulation environment.** Before finalizing a PRD update, spend hours — not minutes — in a Claude chat session pressure-testing how the design will actually play out. The goal is to discover how ideas behave when deployed, which is genuinely hard to do through solo reasoning. A conversational AI that can roleplay as a user, challenge assumptions, generate edge cases, and play out interaction flows gives you a simulation environment that didn't exist before.

This is not the same as asking Claude to "review my PRD" and accepting feedback. That produces polite suggestions. What you want is adversarial simulation: try to break the design, find the cases where the user experience falls apart, discover the workflows you haven't specified. For each PRD update session, work through dozens of scenarios — not a handful. The right design usually only becomes clear after you've tried ten wrong ones and understand why they fail.

**What to simulate:**

- Walk through every command as a first-time user who hasn't read the documentation. Where do they get confused? What do they type that doesn't work?
- Simulate the error cases: what happens when a user provides an invalid name, runs a command in an uninitialized project, or tries to save a context that's too large? Does the error message tell them what to do?
- Simulate the team workflow: one developer saves a golden context, another loads it. What does each step feel like? What could go wrong silently?
- Simulate the edge cases in the acceptance criteria: pick each T-XXX criterion and ask "what's the weirdest input that technically satisfies this criterion while violating its spirit?"
- Simulate the adversary's perspective: for each acceptance criterion you've written, try to write a test that passes it vacuously. If you can, the criterion needs to be tighter.

**When to do this:** Every PRD update session, before the session ends. Not as a final polish step but as a core part of the authoring loop. The PRD is not done when it reads well — it is done when you have tried to break it and couldn't.

**The rule of dozens:** If you haven't tried at least a dozen variations of a design decision — different command names, different interaction flows, different error messages, different acceptance criteria phrasings — you haven't explored the space. The first version of an idea is almost never the right one. The right one usually only becomes visible after you've articulated and rejected enough wrong ones to understand the shape of the problem. AI makes this exploration cheap. The discipline is using it extensively enough to actually find the boundary.

The upstream investment pays forward through every phase. A PRD that has been genuinely pressure-tested produces a test plan that is easier to write, an adversary run that is cleaner, and code that does what users actually need. A PRD that was written quickly and reviewed lightly produces a process that oscillates — where every adversary run finds new problems, and every fix creates new ones, because the requirements were never precise to begin with.

---

## The Artifact Triad

Three documents carry a feature from idea to verified implementation:

| Artifact | Audience | Purpose |
|----------|----------|---------|
| `prd.md` | Everyone | What the system does; acceptance criteria; the authoritative reference |
| `test-plan.md` | Verifier / Adversary | How to verify it; one test group per F-XXX feature; AC table + concrete test cases |
| `dev-plan.md` | Builder (LoD1) | How to build it; phased implementation informed by the test plan; design decisions; troubleshooting |

A fourth document is adversary output, not a human-authored artifact:

| Artifact | Author | Purpose |
|----------|--------|---------|
| `prod-mgmt/test-inventory.md` | LoD2 Adversary | Test-by-test verdict on coverage; AC gap analysis |

And a fifth document records human governance decisions:

| Artifact | Author | Purpose |
|----------|--------|---------|
| `prod-mgmt/risk-acceptances.md` | Human reviewer (outside LoD1) | Documented decisions to accept known adversarial findings |

Every feature gets a short code when it's defined in the PRD — `F-INIT`, `F-CTX-SAVE`, and so on. Every acceptance criterion within that feature gets its own sub-code — `T-INIT-1`, `T-INIT-2`. Those same codes appear in the dev plan (so you know which phase implements which feature), in the test plan (so you know which test case covers which criterion), in the test inventory (so the adversary can say exactly which criterion a test passes or fails), and in risk acceptances (so a human decision to accept a gap is tied to the exact criterion it covers). The result is a straight line from "here is what the system must do" all the way to "here is the evidence that it does it" — with no ambiguity about whether something was missed, because every criterion either has a passing test, an inadequate test the adversary flagged, or a documented human decision to accept the gap.

---

## Core Artifacts: Formats

### 1. PRD — Product Requirements Document

The PRD is the authoritative source of truth. It describes what the system does and what correct behavior looks like. It does not describe how to build it or how to test it — those concerns belong to the dev plan and test plan respectively.

#### Structure

```
# Product Requirements Document: <Project Name>

**Version:** X.Y
**Last Updated:** YYYY-MM-DD
**Status:** Ready for Implementation | Draft | Superseded

---

## Overview
Problem statement. Solution summary. Key innovations.

## Core Concepts
Glossary of domain terms. Diagrams if helpful.

## Architecture
High-level structure. Storage layout. Key mechanisms.

## Features
One section per feature. See format below.

## Skills Implementation (if applicable)
How commands are packaged and invoked.

## Testing
Philosophy. Test contract rules (T1–TN). Reference to test-plan.md.

## Git Best Practices
What to commit. What not to commit.

## Future Enhancements
Deferred ideas — not committed, not scoped.

## Appendix
Command summary table. Version history.
```

#### Feature Section Format

This is the load-bearing structure. Every feature section must follow this format exactly:

```markdown
### F-XXX · Feature Name (`/command-if-applicable`)

One paragraph describing what this feature does and why it exists.

**Expected Behaviors:**
- Observable behavior from the user's perspective
- Specific enough to be verified
- Include error cases

**Test Scenarios:**
1. Numbered list of cases worth testing
2. Including edge cases and failure modes
3. These inform the test plan but are not themselves test cases

**Acceptance Criteria:**

| Test ID | Criterion |
|---------|-----------|
| T-XXX-1 | Exact, falsifiable statement of what a passing implementation must do |
| T-XXX-2 | Each criterion independently testable without running the whole system |
```

**Rules:**
- `F-XXX` is a short uppercase mnemonic unique to this feature (e.g., `F-INIT`, `F-CTX-SAVE`)
- `T-XXX-N` uses the same mnemonic with a sequential number
- Codes are assigned once and never changed or reused — even if the feature is removed
- The AC table must be embedded in the feature section — not collected in an appendix
- Every criterion must be falsifiable: there must exist an implementation that fails it
- A feature section without an AC table is a structural FAIL in the adversary's PRD audit

#### Acceptance Criteria Quality

**Weak (not falsifiable):**
- "The system handles errors gracefully"
- "The output is correct"
- "The feature works as expected"

**Strong (falsifiable):**
- `save-context --golden` on a 150KB session exits non-zero with output containing "100KB" or "too large"
- After task switch A→B→C→A, `.claude/CLAUDE.md` contains **exactly one** `@import` line on each switch
- `git check-ignore .claude/CLAUDE.md` exits 0 in a real git repo after init

The test is: can you write a test that would fail on a wrong implementation and pass on a correct one? If not, rewrite the criterion.

---

### 2. Test Plan — Integration Test Specification

The test plan is a verifier-facing document. It expands each PRD feature's AC table into concrete, runnable test cases. It is the bridge between the abstract acceptance criteria in the PRD and the actual test code in the repository.

The adversary reads the test plan alongside the PRD and the test code. A discrepancy between what the test plan says a test does and what the test code actually does is a finding.

#### Structure

```
# <Project Name> Integration Test Plan

**Version:** X.Y
**Last Updated:** YYYY-MM-DD
**Purpose:** Detailed integration test specifications for <project>

---

## Testing Philosophy
One paragraph on integration-over-unit and why.

## Test Quality Rules
### Banned Patterns
Numbered list of banned patterns with examples.
### Fix Priority Tiers
Tier 1–5 ordered by effort, fixing the most impactful issues first.

## Test Environment Setup
### Prerequisites
Tools, versions, environment variables required.
### Test Directory Structure
Directory tree for fixtures, temp workspaces, results.
### Test Utilities
Base class or helper functions shared across tests.

## Feature Test Groups
One group per F-XXX feature, in the same order as the PRD.
(See feature group format below.)

## Summary
Coverage matrix: one row per F-XXX with status.
Next steps.

## Manual Test Checklist
Tests that require a live Claude Code session or external behavior.
One entry per T-XXX-MANUAL test.
```

#### Feature Test Group Format

Each group follows this structure exactly:

```markdown
## N. <Feature Name> Tests · F-XXX

**Acceptance Criteria:**

| AC ID | Criterion |
|-------|-----------|
| T-XXX-1 | [verbatim from PRD] |
| T-XXX-2 | [verbatim from PRD] |

### Test N.M: <Descriptive Name> (T-XXX-N)

**Setup:**
[bash or python — the state of the world before the test runs]

**Execution:**
[the command or function call being tested]

**Validation:**
[python/typescript — the assertions]

**Expected Output:**
[what the user or caller should see on success]

---
```

**Rules:**
- The AC table at the top of each group is copied verbatim from the PRD — same T-XXX codes, same criterion text. If they diverge, the PRD is authoritative.
- Test numbering (N.M) is local to the group — the first test in group 3 is Test 3.1.
- Every T-XXX code in the AC table must have at least one test case that claims to cover it.
- Validation code must be concrete — actual assertions, not prose descriptions of what should be checked.
- Setup must not create the artifact the test verifies (no self-fulfilling setup).

#### Test Quality Rules

These rules are mandatory. A test that violates them is a failing test regardless of whether its assertions pass. The adversary applies these heuristics to every test.

**Banned Patterns:**

1. **Vacuous OR fallbacks** — `|| output.includes('context')`, `|| result.exitCode === 0`, `|| /\d+/.test(output)`. These convert meaningful checks into tautologies. Every OR alternative must be capable of failing independently.

2. **Conditional file-existence guards** — `if (fileExists(path)) { expect(...) }`. Replace with: `expect(fileExists(path)).toBe(true)` then assert contents. The conditional allows the test to pass when the file doesn't exist at all.

3. **Tautological type assertions** — `typeof x === 'number'` when x is always a number. Assert a specific value or range.

4. **Placeholder assertions** — `expect(true).toBe(true)`. Delete or replace with a real check.

5. **Self-fulfilling setup** — Creating the file the test then checks for in `beforeEach`. The script under test must create it; setup must not pre-empt it.

6. **Broad digit regex** — `/\d+/.test(output)` when a specific count is known. Use `\b47\b` when 47 messages are expected.

7. **Missing exit code assertions** — Success tests must assert `exitCode === 0`. Error tests must assert `exitCode !== 0`. Omitting this is banned.

8. **Vacuous path assertions** — Asserting a path does not appear in tool output using a path form the tool never emits (e.g., absolute path in `git status --porcelain` output, which only emits relative paths). Use the path form the tool actually produces.

**Fix Priority Tiers** — when a test suite has violations, fix in this order:

| Tier | Effort | What to fix |
|------|--------|-------------|
| 1 | < 1 hr each | Placeholder assertions · Inverted boolean logic · `typeof exitCode` → specific value · Remove self-fulfilling setup |
| 2 | 1–2 hr each | Remove OR escape hatches · Replace `if (fileExists)` guards with unconditional assertions · Replace broad regex with specific patterns |
| 3 | 1–2 hr each | Add unconditional file-existence checks before any content assertion |
| 4 | 2–4 hr each | Add missing test cases for AC clauses with no coverage |
| 5 | 4+ hr each | Architectural fixes (e.g., replace path-presence checks with real git integration tests using a bare remote) |

#### Manual Test Checklist Format

For behaviors that require a live Claude Code session or external system:

```markdown
### T-XXX-MANUAL: <Name>

**When to run:** Before each major release / on each Claude Code version update / [specific trigger]

**Time required:** ~N minutes

**Steps:**
1. [Concrete action]
2. [Concrete action]
3. Ask: "[Specific question]"
4. **PASS** if: [specific observable outcome]
5. **FAIL** if: [specific observable outcome]

**Record:** Claude Code version, date tested, pass/fail, tester name.
```

---

### 3. Dev Plan — Developer Implementation Plan

The dev plan is a builder-facing document. It translates PRD features into ordered implementation work, provides enough architectural detail to build without repeatedly re-reading the PRD, and records the reasoning behind non-obvious design choices so future maintainers understand them.

#### Structure

```
# Developer Implementation Plan: <Project Name> vX.Y

**Version:** X.Y
**Last Updated:** YYYY-MM-DD
**Status:** Ready for Implementation | Draft
**Based on:** PRD vX.Y          ← must reference the PRD version

---

## Executive Summary
Restate the core problem and solution in one paragraph.
Bullet the key architectural pillars.
Note any known risks or undocumented behaviors being relied on.

## Architecture Overview
### Key Mechanism 1
Diagrams and explanation of the core mechanisms.
### Key Mechanism 2
...
### Storage Structure
Directory trees for all storage locations.
### Key Encoding / Conventions
Any non-obvious patterns (e.g., project ID encoding from path).

## Implementation Phases
### Phase N: <Name> (Critical Path | Standard | Advanced)
Phase overview — what this unlocks.
#### N.M Sub-task Name
**Purpose:** One sentence.
**Implementation:**
[Code, pseudocode, or command sequence. Enough detail to implement.]
**Testing:**
- [ ] Checklist item
- [ ] Checklist item

## File Structure
Tables mapping every artifact to its location and committed/not-committed status.

## Testing Strategy
Unit / Integration / End-to-End breakdown.
(Detailed test cases belong in test-plan.md, not here.)

## Success Criteria
- [ ] Technical checklist
- [ ] User experience checklist
- [ ] Documentation checklist

## Key Design Decisions
### Decision N: <Name>
**Why:** Rationale. What alternatives were considered. Why this one was chosen.

## Troubleshooting
Known failure modes and their resolutions.

## Version History
- **vX.Y** (YYYY-MM-DD): What changed and why
```

#### Key Principles

**Reference the PRD version.** The `Based on: PRD vX.Y` header makes it unambiguous which version of the PRD this plan implements. When the PRD updates, the dev plan version bumps too.

**Phases are ordered by dependency, not by feature.** Foundation phases must be complete before core command phases. Each phase builds on what the previous established. The phase ordering is the build plan.

**Implementation sketches, not production code.** The dev plan contains enough code to understand the approach — TypeScript snippets, bash sequences, pseudocode. It is not the final implementation. The implementation lives in the codebase; the dev plan records the intended approach.

**Per-sub-task testing checklists.** Each sub-task ends with a `- [ ]` checklist of what "done" looks like for that piece. These are not formal test cases — they're the developer's sanity check. Formal test cases are in the test plan.

**Design decisions are permanent record.** The key design decisions section records *why*, not *what*. Future readers (including AI assistants resuming the work) need to understand the reasoning to avoid re-litigating settled decisions. "Personal by default — prevents accidental secret leaks and reduces noise in team repos" is a decision record. "We chose Option A" is not.

**Troubleshooting is written from real failures.** The troubleshooting section is populated as problems are discovered during implementation, not by anticipating hypothetical issues. It should read as: "We saw this. Here is how to fix it."

---

### 4. Risk Acceptances

A structured register of human decisions to accept known adversarial findings. Modeled on OCC/FFIEC regulatory language.

**Location:** `./prod-mgmt/risk-acceptances.md`
**Committed:** Yes — these are governance decisions, not generated artifacts.

#### Entry Format

```
RA_ID:        RA-NNN (sequential, never reuse)
SCOPE:        T-XXX-N (one or more T-XXX codes this acceptance covers)
FINDING:      The adversarial finding being accepted — verbatim or accurate summary
SEVERITY:     CRITICAL / HIGH / MEDIUM / LOW
DISPOSITION:  ACCEPTED | DEFERRED | OUT_OF_SCOPE
RATIONALE:    Why this is accepted — specific to this finding, not generic
APPROVED_BY:  Name or role (should be outside the constructor team)
APPROVED_DATE: YYYY-MM-DD
EXPIRY:       YYYY-MM-DD | named-condition | PERMANENT (requires justification)
```

**DISPOSITION values:**
- `ACCEPTED` — residual risk understood and accepted for this period
- `DEFERRED` — valid finding, acknowledged, scheduled for a later iteration
- `OUT_OF_SCOPE` — finding is valid but outside the boundary of this feature or release

**Rules:**
- RA_IDs are sequential and never reused, even after expiry
- A lapsed entry (EXPIRY date passed or named condition met) is treated as if it does not exist — the finding resurfaces automatically in the next adversary run
- Move lapsed entries to an "Expired Risk Acceptances" section — do not delete them, they are audit artifacts
- RATIONALE must be specific — "low risk" is not a rationale
- PERMANENT expiry requires explicit documentation of why the risk will never need re-evaluation

---

### 5. Test Inventory (Adversary Output)

The adversary's output. Not authored by humans. Not committed to source control. Regenerated on every adversary run.

**Location:** `./prod-mgmt/test-inventory.md`
**Committed:** No — regenerated each run.

#### Section 1 — PRD Audit

Before evaluating any tests, the adversary audits the PRD section by section:

```
| PRD Section | Has AC? | All Behaviors Have AC? | Result |
```

A PRD section with no AC table is a structural FAIL — no test evaluation is performed for that section.

#### Section 2 — Test Inventory Table

```
| TEST_ID | DESCRIPTION | AC_CLAUSE | COVERAGE_RATIONALE | VERDICT |
```

- `TEST_ID`: filename + function/line reference — enough to locate the test
- `DESCRIPTION`: what the test *actually does*, not what it claims to do
- `AC_CLAUSE`: the exact T-XXX code being evaluated
- `COVERAGE_RATIONALE`: specific explanation of how the test satisfies (or fails to satisfy) the AC clause. Never blank. Never "tests X because it tests X."
- `VERDICT`: PASS / FAIL / ESCALATE / ACCEPTED / DEFERRED / OUT_OF_SCOPE

#### Section 3 — AC Coverage Gaps

For every T-XXX clause:

```
ADEQUATE     — tests exist and would catch a motivated implementation error
INADEQUATE   — tests exist but a motivated implementation error could slip through
MISSING      — no test exists for this clause
RISK_ACCEPTED — RA_ID applied; human has documented decision to accept this gap
```

---

## The Full Process Flow

### Phase 1: PRD Authoring

**Who:** Developer (LoD1)
**Artifact:** `prd.md`

1. Write the PRD in the standard format described above
2. For each feature: write the feature section, expected behaviors, test scenarios, and AC table
3. Assign unique `F-XXX` and `T-XXX` codes — assign them once, never change them
4. Review for falsifiability: write a mental test for each criterion — if you can't construct a failing case, rewrite the criterion

**Output:** PRD with all features coded and AC tables populated.

---

### Phase 2: Test Plan

**Who:** Developer (LoD1)
**Artifact:** `test-plan.md`

1. Write the test quality rules section — banned patterns and fix priority tiers
2. Write the environment setup section — prerequisites, directory structure, shared utilities
3. For each `F-XXX` feature: create a feature test group
   - Copy the AC table verbatim from the PRD
   - For each `T-XXX` criterion: write one or more concrete test cases with Setup/Execution/Validation/Expected Output
4. Write the coverage summary matrix
5. Write the manual test checklist for behaviors that require live sessions or external systems

**Signs of a weak test case:**
- Validation section contains prose instead of assertions
- Setup creates the file the test then verifies
- Validation uses a broad regex when a specific value is known
- A null implementation would pass all assertions

**Output:** Test plan that maps every T-XXX AC clause to a runnable test case.

---

### Phase 3: Dev Plan

**Who:** Developer (LoD1)
**Artifact:** `dev-plan.md`

1. Read the test plan first — the test cases make implementation boundaries concrete and often surface ambiguities in the PRD before any code is written
2. Write the executive summary — restate the PRD's problem and solution from the builder's perspective
3. Expand the architecture section with enough detail to implement without re-reading the PRD constantly
4. Order the features into implementation phases — resolve dependencies
5. For each sub-task: write the implementation sketch and the testing checklist
6. Fill in the file structure tables — every artifact, every location, committed or not
7. Record design decisions as they are made — the reasoning, not just the choice

**Output:** Dev plan that a developer (or AI-assisted session) can follow to implement the system.

---

### Phase 4: Implementation

**Who:** Developer (LoD1)
**Tool:** Claude Code, development task

With the artifact triad in place, implement the system following the dev plan phases. Run tests continuously. Update the dev plan's `- [ ]` checklists as sub-tasks complete.

The implementation is not the primary artifact. If implementation behavior diverges from the PRD, the PRD is authoritative — fix the implementation, not the PRD (unless the PRD's requirement is discovered to be wrong, in which case change the PRD first, then the test plan, then the implementation).

**Output:** Working implementation with passing tests.

---

### Phase 5: Adversarial Review (Boss Fight)

**Who:** Adversary (LoD2, STRICT isolation)
**Tool:** Claude Code, `/task adversary`

Switch to the adversary task and run the session. The adversary has:
- No memory of prior sessions
- No knowledge of your intent, your reasoning, or your constraints
- No interest in helping you pass
- Read-only access to the PRD, test plan, tests, risk-acceptances.md, and source files

```bash
/task adversary
# Claude Code starts a completely fresh session with adversary DNA loaded
# Adversary scans the project, loads risk acceptances, runs its review
# Output: ./prod-mgmt/test-inventory.md
# Session ends
```

**What the adversary does:**
1. Audits the PRD section by section for AC presence and falsifiability — a section with no AC table is a structural FAIL
2. For each test: describes what it *actually does* (not what it claims), maps it to the AC clause, applies the six assurance heuristics
3. Records verdicts: PASS / FAIL / ESCALATE
4. Checks risk-acceptances.md and marks accepted findings per RA entries; surfaces lapsed entries as active findings
5. Produces the coverage gap analysis

**What the adversary does NOT do:**
- Suggest how to fix anything
- Provide positive attestations or "what's working well" summaries
- Soften a FAIL verdict
- Re-litigate a valid risk acceptance

**ESCALATE** means: the adversary cannot confidently evaluate this test — a human must review it manually. An ESCALATE that surfaces a real gap is better than a weak PASS that buries one.

**Output:** `./prod-mgmt/test-inventory.md`

---

### Phase 6: Remediation Loop

**Who:** Developer (LoD1)
**Tool:** Claude Code, development task

Read `test-inventory.md`. For each FAIL or INADEQUATE finding:

**The preferred path: fix upstream.**

The most durable remediations address the PRD (the AC clause was imprecise) or the test plan (the test case failed to translate the AC into a strong assertion). Resist the temptation to write a slightly better test that satisfies the adversary's pattern-matching without actually improving coverage.

The diagnostic question: is this a test deficiency or an AC deficiency?

- **AC deficiency** (the criterion permitted a weak test): update the PRD criterion → update the test plan test case → update the test code → re-run adversary
- **Test deficiency** (the criterion was fine but the test didn't satisfy it): update the test plan → update the test code → re-run adversary

**Oscillation:** When the constructor and adversary oscillate — fix breaks something, revert breaks something else — stop. The oscillation is the signal that the boundary of automatable verification has been reached. The resolution is a risk acceptance.

**Output:** Updated PRD and/or test plan, updated tests, ready for re-review.

---

### Phase 7: Risk Acceptance

**Who:** Human reviewer (outside the constructor team, ideally)
**Artifact:** `prod-mgmt/risk-acceptances.md`

For findings that cannot be remediated — because they require live external behavior, because the constructor and adversary have oscillated, or because the cost of remediation exceeds the risk — add a risk acceptance entry using the format above.

After adding the risk acceptance, re-run the adversary. It should record the finding as ACCEPTED (RA-NNN) rather than FAIL.

**Output:** Updated `risk-acceptances.md`, clean adversary run.

---

### Phase 8: Verification

Before marking a feature complete:

1. All tests pass
2. Adversary run is clean — all PASS, or ACCEPTED/DEFERRED/OUT_OF_SCOPE per active risk acceptances
3. No unexpired risk acceptances with CRITICAL severity
4. All T-XXX-MANUAL entries in the test plan have been executed and results recorded

**The Definition of Done is the adversary's test inventory, not the test runner output alone.** A feature that passes tests but has INADEQUATE or MISSING coverage in the test inventory is not done — the tests may be lying. The adversary's job is to find the lies.

---

## The Adversary Task in Context Curator

### Why STRICT Isolation

The adversary must not share context with the constructor session for the same reason that LoD2 in banking must not report to the CTO: if it knows the builder's intent, it will unconsciously weight its evaluation toward confirmation rather than challenge.

STRICT isolation in Context Curator means:
- Every adversary session starts completely fresh
- No prior adversary runs influence the current one — prevents convergence on weak PASS
- No knowledge of the engineering team's choices or reasoning
- The adversary reads only what is in the project files, nothing more

This isolation is enforced by hooks (not just by instruction), because instructions can be overridden by a cooperative model and hooks cannot.

### The Six Assurance Heuristics

The adversary applies these to every test:

1. **Vacuity** — would this test pass with a null or stub implementation?
2. **Circularity** — does the coverage rationale amount to "tests X because it tests X"?
3. **Boundary** — does the test probe only the happy path, leaving edges untested?
4. **Permission escalation** — could a caller craft input that satisfies the test while exceeding authorized scope?
5. **Incompleteness** — is the claim technically true but insufficient to constitute meaningful coverage of the clause?
6. **Coupling** — does the test pass because of an implementation detail rather than because of correct behavior?

### The Remediation-Risk Acceptance Boundary

The adversary will sometimes find things that are genuinely correct but that automated review cannot verify. The right response is ESCALATE, not a weak PASS. The right response from the developer is a risk acceptance with a good rationale — not a workaround test that satisfies the adversary's pattern-matching without actually providing coverage.

A project with five well-documented risk acceptances is in better shape than a project with five vacuously passing tests. The first knows what it has accepted. The second doesn't know what it has missed.

---

## Process Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  Phase 1: PRD Authoring                                          │
│  Features → F-XXX codes → T-XXX AC tables                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 2: Test Plan                                              │
│  T-XXX AC clauses → concrete test cases (Setup/Exec/Validate)   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 3: Dev Plan                                              │
│  T-XXX AC clauses → concrete test cases (Setup/Exec/Validate)   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 4: Implementation                                         │
│  Follow dev plan phases → pass tests                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 5: Adversarial Review (Boss Fight)                        │
│  /task adversary → fresh session → test-inventory.md            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │ FAIL / INADEQUATE?      │ All PASS / ACCEPTED?
              ▼                         ▼
┌────────────────────────┐   ┌──────────────────────────────────┐
│  Phase 6: Remediation  │   │  Phase 8: Verification           │
│  Fix PRD/test plan/    │   │  Tests pass + adversary clean    │
│  tests upstream-first  │   │  Manual tests documented         │
└────────────┬───────────┘   └──────────────────────────────────┘
             │
             │ Oscillating?
             ▼
┌────────────────────────┐
│  Phase 7: Risk         │
│  Acceptance            │
│  Add RA entry, re-run  │
│  adversary             │
└────────────┬───────────┘
             │
             └──────────────► Back to Phase 5
```

---

## Quick Reference: Format Rules

### PRD Feature Section

- Heading: `### F-XXX · Feature Name`
- AC table with `T-XXX-N` codes, embedded in the section
- Codes: assigned once, never reused

### Dev Plan Sub-task

- **Purpose:** one sentence
- **Implementation:** code/pseudocode/commands
- **Testing:** `- [ ]` checklist items
- Header: `Based on: PRD vX.Y`

### Test Plan Feature Group

- Opens with AC table copied verbatim from PRD
- Test case: `### Test N.M: Name (T-XXX-N)`
- Four sections: **Setup** · **Execution** · **Validation** · **Expected Output**
- Validation must be assertions, not prose

### Risk Acceptance Entry

```
RA_ID / SCOPE / FINDING / SEVERITY / DISPOSITION / RATIONALE / APPROVED_BY / APPROVED_DATE / EXPIRY
```

- SCOPE references T-XXX codes
- EXPIRY is a date, named condition, or PERMANENT (with justification)
- Never delete lapsed entries — move to Expired section

---

## Relationship to Context Curator

Boss-Fight Coding and Context Curator are designed to work together:

- Context Curator manages the **session context** that makes AI-assisted PRD authoring, dev planning, test planning, and code generation efficient — deep subsystem understanding doesn't have to be rebuilt from scratch each session
- The adversary task is a **specialized context** within Context Curator with STRICT isolation enforced by hooks
- Golden contexts from deep PRD authoring or architecture sessions can be saved and shared with the team
- The `prod-mgmt/` directory is part of the project structure created by `/task-init`
- Risk acceptances in `prod-mgmt/risk-acceptances.md` are committed to git and shared across the team

Context Curator preserves the human + AI knowledge that goes into authoring good upstream artifacts. Boss-Fight Coding provides the governance process that determines whether those artifacts are sufficient before code ships. Each makes the other more valuable.

---

## Glossary

**LoD1 (First Line of Defense):** The engineering team that authors the PRD, dev plan, test plan, writes tests, and generates code. Responsible for building and operating controls.

**LoD2 (Second Line of Defense):** The adversarial reviewer that independently challenges LoD1's test coverage. Reports to the control assurance function, not to LoD1. In Context Curator, this is the adversary specialized task.

**Regulatory Capture:** When the second line of defense becomes too aligned with the first line and loses its independence. In this process: if the adversary shares session context with the constructor, it has been captured. STRICT isolation prevents this.

**Boss Fight:** The adversarial review phase. You must pass it to advance. Preparation (good PRD, good dev plan, good test plan) is the only strategy.

**Acceptance Criteria (AC):** Falsifiable, independently testable statements of what a correct implementation must do. Embedded in feature sections of the PRD. Each has a unique T-XXX code.

**Risk Acceptance:** A human-reviewed, documented decision to accept a known adversarial finding. Not a workaround — an honest accounting that something has been reviewed and the residual risk accepted.

**Context Rot:** The degradation of AI recall quality as context fills. Even with 1M token windows, output quality degrades well before the window fills. Saving warmed-up contexts before rot sets in is the core value of Context Curator.

**Artifact Triad:** The three human-authored documents that define a feature: PRD (what), dev plan (how to build), test plan (how to verify).