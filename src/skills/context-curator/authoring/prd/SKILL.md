---
name: prd
description: >
  PRD authoring assistant. Load when working on a file matching *prd*.md.
  Enforces F-XXX/T-XXX code structure, falsifiable AC rules, and feature section format.
  Use /prd new-feature to scaffold, /prd check-ac to audit criteria.
invocation: auto
trigger-pattern: "*prd*.md"
---

# /prd — PRD Format Skill

## Feature Section Template

Every feature section must contain all four elements:
1. Heading: `### F-XXX · Feature Name`
2. `**Expected Behaviors:**` bullet list
3. `**Test Scenarios:**` numbered list
4. `**Acceptance Criteria:**` table with `| T-XXX-N | Criterion |` rows

## On /prd new-feature

Scaffold a complete feature section with:
- Placeholder `### F-NEW · [Feature Name]` heading
- `**Expected Behaviors:**` with 3–5 placeholder bullets
- `**Test Scenarios:**` with 3 numbered scenarios
- `**Acceptance Criteria:**` table with 2 placeholder T-XXX rows

## On /prd check-ac

Review each AC row in the PRD. Flag any criterion that is:
- Vague ("handles gracefully", "works correctly")
- Circular (references the implementation rather than observable behavior)
- Not independently testable (requires inspecting internal state)

Output flagged criteria with rationale. Output nothing for clean criteria.

## Code Rules

- F-XXX codes: assigned once, never reused, even after feature removal
- T-XXX codes: globally unique across the entire PRD
- AC criteria: statements not questions; falsifiable; no "should" hedging
