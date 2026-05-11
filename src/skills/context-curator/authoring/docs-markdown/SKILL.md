---
name: docs-markdown
description: >
  Update the markdown documentation base after a PRD change. Reads
  docs/docs-brief.md for gate assignments, navigation architecture, and
  editorial rules. Prompts for gate and page assignment on new F-XXX features.
  Updates affected pages, regenerates glossary and permuted index.
invocation: explicit
---

# /docs-markdown

## Bootstrapping Constraint

This skill requires the authoring bundle to exist at
`~/.claude/skills/context-curator/authoring/` before it can be invoked.
The dev process (Phase 9) must complete before running /docs-markdown.

## Invariant

**Markdown is always updated first. HTML is always derived from markdown. Never edit files in `docs/html/` directly.**

## Workflow

1. Read `docs/docs-brief.md` — load the core message, reader journey gates,
   navigation architecture, and editorial rules before touching any page
2. Read PRD to identify features added or changed since last docs run
3. For each new F-XXX feature not yet in the Feature Routing table in
   `docs/docs-brief.md`:
   - Prompt: "Assign F-XXX to a gate (1–4) and page:"
   - Update the Feature Routing table in `docs/docs-brief.md` with the
     assignment (gate, page, nav tier)
4. For each affected page, update `docs/markdown/[page].md` applying the
   editorial rules and gate-appropriate depth from `docs/docs-brief.md`
5. Regenerate `docs/markdown/toc.md` reflecting the navigation architecture
   defined in `docs/docs-brief.md` (primary / secondary / separate / footer)
6. Update `docs/markdown/glossary.md` (all Core Concepts terms from PRD)
7. Regenerate `docs/markdown/permuted-index.md`

## docs-brief.md Feature Routing Table Format

```markdown
| Feature       | Gate | Page              | Nav Tier  |
|---------------|------|-------------------|-----------|
| F-INIT        | 1    | Getting Started   | Primary   |
```

- **Gate:** 1–4 per reader journey definition in docs-brief.md; `ref` for
  reference-only content with no gate progression
- **Nav Tier:** Primary / Secondary / Separate / Footer
- When a new feature is added, assign gate first; page and nav tier follow
  from the gate definition in docs-brief.md

## Editorial Rules Summary

The full editorial rules are in `docs/docs-brief.md`. Key constraints:

- Never mention Boss-Fight Workflow or the adversary task in primary-tier
  pages (Gates 1–2)
- Lead with the problem before the solution on every page
- End Gate 1–2 pages with "you now have everything you need" + next-gate links
- Progressive disclosure: if removing something helps first-time readers
  without harming experienced readers, move it to a "Going deeper" section

## After Completing

Tell the user:
```
✓ Markdown docs updated.
Run /docs-html to regenerate HTML from the updated markdown.
```
