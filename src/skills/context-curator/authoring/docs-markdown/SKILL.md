---
name: docs-markdown
description: >
  Update the markdown documentation base after a PRD change. Identifies new or changed
  features, prompts for product section assignments, updates affected pages,
  regenerates glossary and permuted index.
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

1. Read PRD to identify features added or changed since last docs run
2. For each new F-XXX feature not yet in `docs/feature-section-map.md`:
   - Prompt: "Assign F-XXX to a product section (or create new):"
   - Update `feature-section-map.md` with the assignment
3. For each affected product section, update `docs/markdown/[section].md`
4. Regenerate `docs/markdown/toc.md` (link to all sections)
5. Update `docs/markdown/glossary.md` (all Core Concepts terms from PRD)
6. Regenerate `docs/markdown/permuted-index.md`

## Linking Conventions

- Every product section name: linked on first mention in each page
- Every glossary term: linked on first mention per page only
- Internal links: relative paths (no absolute URLs)

## feature-section-map.md Format

```markdown
| F-XXX | Feature Name | Section | Page file |
|-------|--------------|---------|-----------|
| F-INIT | Project Initialization | Getting Started | getting-started.md |
```

## After Completing

Tell the user:
```
✓ Markdown docs updated.
Run /docs-html to regenerate HTML from the updated markdown.
```
