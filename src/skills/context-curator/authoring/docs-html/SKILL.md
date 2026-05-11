---
name: docs-html
description: >
  Generate HTML documentation from the markdown base.
  Reads docs/html/style.md for the design system. Bootstraps style.md if absent.
  Validates WCAG 2.1 AA compliance. Always run after /docs-markdown.
invocation: explicit
---

# /docs-html

Generates the HTML documentation set from `docs/markdown/`. Produces a shared CSS/JS asset file and one HTML page per markdown section. No build pipeline required — output is plain HTML that any browser opens directly or GitHub Pages serves as-is.

## Generation Constraints

- Read `docs/html/style.md` first; if absent, bootstrap sensible accessible defaults,
  write them to `style.md`, and tell the user to review before the next run
- `style.md` defaults must include entries for color palette and typeface/font
- All output HTML: WCAG 2.1 AA compliant
- Every page: sidebar `<nav aria-label="Site navigation">` links to home (`docs/index.html`)
  and `glossary.html`; all section links present; active page highlighted
- Heading hierarchy must not skip levels (no h3 without h2, no h2 without h1)
- All `<img>` elements: non-empty `alt` attribute
- Never inline styles or scripts in individual pages — all pages link to shared assets

## Output Files

```
docs/html/
  assets/
    style.css            ← all styles derived from style.md
    main.js              ← copy buttons, anchors, mobile nav, theme toggle,
                           search, page TOC, prev/next nav, edit link
    search-index.json    ← {url, title, headings[], content} per page
  index.html             ← introduction.md + toc.md combined
  getting-started.html
  managing-contexts.html
  context-monitoring.html
  hooks-automation.html
  for-teams.html
  security.html
  boss-fight-workflow.html
  reference.html
  glossary.html
  permuted-index.html
  sitemap.xml            ← all active page URLs for search indexing
```

The file at `docs/html/index.html` is the entry point (`docs/index.html` in the site root).

## Workflow

1. Read `docs/html/style.md` (bootstrap with accessible defaults if missing)
2. Generate `docs/html/assets/style.css` from the style spec — including light mode vars, search, page TOC, prev/next, repo link, and edit link styles
3. Generate `docs/html/assets/main.js` — theme toggle, copy buttons, heading anchors, mobile nav, page TOC, prev/next nav, edit link, search
4. Generate `docs/html/assets/search-index.json` — one entry per page with `{url, title, headings[], content}`
5. For each markdown file in `docs/markdown/`:
   - Convert to HTML applying the style.md design system
   - Set `<html lang="en" data-theme="dark">`
   - Add sidebar with: sidebar-header (site title + theme toggle), search wrapper, nav links, repo link at bottom
   - Add `<aside class="page-toc" aria-label="On this page">` after `</main>` in the layout div
   - Add `<div class="page-footer"></div>` as the last child of `<main>`
   - Render ASCII flow diagrams as inline SVG where possible
   - Validate heading hierarchy before writing
6. Write `docs/html/index.html` combining `introduction.md` and `toc.md`
7. Write all section pages
8. Write `docs/html/sitemap.xml`

## SVG Diagrams

Where markdown contains ASCII diagrams or labelled flow descriptions, render inline SVG
instead. Candidates: the boss-fight process flow in `boss-fight-workflow.md`, the context
zone diagram in `context-monitoring.md`. Use colors from `style.md`.

## Invariant

Never hand-edit files in `docs/html/`. They are always regenerated from `docs/markdown/`.
Run `/docs-markdown` first, then `/docs-html`.

## Deployment

`docs/html/` is plain HTML — no build step needed to serve it.

- **Local review:** open `docs/html/index.html` in a browser
- **GitHub Pages:** configure Pages to serve from the `docs/html/` folder on `main`,
  or copy `docs/html/` contents to the `gh-pages` branch root

## Bootstrap Message

If `style.md` was absent and had to be created:
```
style.md was not found. Created defaults at docs/html/style.md.
Review and edit before the next /docs-html run if you want a custom look.
```
