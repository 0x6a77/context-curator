---
name: docs-html
description: >
  Generate accessible HTML documentation from the markdown base.
  Reads docs/html/style.md for visual conventions. Bootstraps style.md if absent.
  Validates WCAG 2.1 AA compliance. Always run after /docs-markdown.
invocation: explicit
---

# /docs-html

## Generation Constraints

- Read `docs/html/style.md` first; if absent, generate sensible accessible defaults
  and write them to `style.md` before generating HTML
- `style.md` defaults must contain entries for "color" and "typeface" or "font"
- All output HTML: WCAG 2.1 AA compliant
- Every page: consistent `<nav>` with links to home (`index.html`) and glossary
- Heading hierarchy must not skip levels (no h3 without h2, no h2 without h1)
- All `<img>` elements: non-empty `alt` attribute

## Output Files

- `docs/index.html`: rendered from `introduction.md` + `toc.md` inline
- `docs/html/[section].html`: one file per product section in `feature-section-map.md`

## Workflow

1. Read `docs/html/style.md` (bootstrap with defaults if missing)
2. For each markdown file in `docs/markdown/`:
   - Convert to HTML applying style.md conventions
   - Add `<nav>` with home and glossary links
   - Validate heading hierarchy
3. Write `docs/index.html` combining `introduction.md` and `toc.md`
4. Write per-section HTML files

## Invariant

Never hand-edit files in `docs/html/`. Run `/docs-markdown` first, then `/docs-html`.
If `docs/html/style.md` is missing and must be bootstrapped, tell the user:
```
style.md was not found. Created defaults at docs/html/style.md.
Review and edit before next /docs-html run if you want a custom look.
```
