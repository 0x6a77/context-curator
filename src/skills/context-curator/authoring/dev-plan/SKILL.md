---
name: dev-plan
description: >
  Dev plan authoring assistant. Load when working on a file matching *dev-plan*.md.
  Enforces phase structure, design decision conventions, and PRD version reference.
---

# /dev-plan — Dev Plan Format Skill

## Mandatory Sections (for /dev-plan new)

- Header with `Based on: PRD vX.Y` (populate from current PRD version)
- Executive Summary
- Architecture Overview
- Implementation Phases (ordered; each with sub-tasks and `- [ ]` testing checklists)
- File Structure table (artifact, location, committed/not-committed)
- Key Design Decisions (record *why*, not just *what*)
- Troubleshooting (known failure modes and resolutions)
- Version History

## Phase Section Format

Each phase must include:
1. Phase heading: `### Phase N: Name`
2. Sub-tasks as numbered list
3. Code sketches for non-obvious implementations
4. Testing checklist: `- [ ] T-XXX: description` for each relevant acceptance criterion

## Design Decisions Format

Each decision must record the rationale, not just the choice:

```
**Decision:** [what was chosen]
**Why:** [constraint or tradeoff that forced this choice]
**Alternatives rejected:** [what else was considered and why it lost]
```

## On /dev-plan new

Scaffold a complete dev plan document with all mandatory sections populated.
Pull phase structure from the PRD's F-XXX feature list.
Cross-reference every phase's testing checklist with T-XXX codes from the test plan.
