/**
 * Document Authoring Skills Tests (F-DOC-SKILLS) and User Documentation System Tests (F-DOC)
 *
 * F-DOC-SKILLS: Four authoring skills that enforce idiomatic format for process artifacts
 *   T-DOC-1: /prd new-feature scaffolds section with F-prefix heading, Expected Behaviors, Test Scenarios, AC table
 *   T-DOC-2: PRD skill auto-invokes on *prd*.md filename pattern
 *   T-DOC-3: /test-plan new scaffolds mandatory sections including 6+ banned patterns
 *   T-DOC-4: /dev-plan new scaffolds with PRD reference, phases, file structure, design decisions, troubleshooting
 *   T-DOC-5: /prd check-ac flags vague criteria; clean PRD produces no flags
 *   T-DOC-6: /test-inventory skill only available when adversary task is active
 *
 * F-DOC: User Documentation System (markdown-first, HTML-derived)
 *   Codes T-UDOC-1 through T-UDOC-8 (T-DOC-* namespace belongs to F-DOC-SKILLS; fixed in PRD v20.1)
 *
 *   T-UDOC-1: /docs-markdown prompts for section assignment on new F-XXX; updates feature-section-map.md
 *   T-UDOC-2: docs/markdown/toc.md links to every product section in feature-section-map.md
 *   T-UDOC-3: docs/markdown/glossary.md contains every Core Concepts term after /docs-markdown
 *   T-UDOC-4: After /docs-html, docs/index.html exists with intro + TOC content
 *   T-UDOC-5: All generated HTML pages have <nav> with home and glossary links
 *   T-UDOC-6: HTML heading hierarchy never skips levels (no h3 without h2, no h2 without h1)
 *   T-UDOC-7: When style.md absent, /docs-html writes defaults containing "color" and "typeface"/"font"
 *   T-UDOC-8: All <img> elements in generated HTML have non-empty alt attribute
 *
 * All tests in this file are .todo pending implementation of:
 *   ~/.claude/skills/context-curator/authoring/prd/SKILL.md  (and scripts/)
 *   ~/.claude/skills/context-curator/authoring/test-plan/SKILL.md
 *   ~/.claude/skills/context-curator/authoring/dev-plan/SKILL.md
 *   ~/.claude/skills/context-curator/authoring/test-inventory/SKILL.md
 *   ~/.claude/skills/context-curator/authoring/docs-markdown/SKILL.md
 *   ~/.claude/skills/context-curator/authoring/docs-html/SKILL.md
 *
 * Skills are invoked via Claude Code's /skill-name interface, not as standalone scripts.
 * Integration tests for skills require a Claude Code session harness (not yet available).
 */

import { describe, it } from 'vitest';

// ---------------------------------------------------------------------------
// F-DOC-SKILLS: Document Authoring Skills
// ---------------------------------------------------------------------------

describe('T-DOC-1: /prd new-feature scaffolds required four-element structure', () => {
  it.todo(
    'Invoke /prd new-feature. Output must contain: ' +
    '(1) heading matching /^### F-[A-Z]/, ' +
    '(2) "**Expected Behaviors:**", ' +
    '(3) "**Test Scenarios:**", ' +
    '(4) "**Acceptance Criteria:**" table with at least one row matching /| T-[A-Z]+-\\d+/'
  );
});

describe('T-DOC-2: PRD skill auto-invokes on *prd*.md filename', () => {
  it.todo(
    'Open a file named "my-feature-prd.md" in a Claude Code session. ' +
    'Without typing /prd, the PRD skill description must appear in session context. ' +
    'Verified by checking session context for the skill\'s description string containing "F-XXX" or "PRD format".'
  );
});

describe('T-DOC-3: /test-plan new scaffolds all mandatory sections', () => {
  it.todo(
    'Invoke /test-plan new. Output must contain: ' +
    '(1) testing philosophy section, ' +
    '(2) banned patterns list with >= 6 numbered items matching /^\\d+\\. \\*\\*/, ' +
    '(3) fix priority tiers table or section, ' +
    '(4) environment setup / prerequisites section, ' +
    '(5) summary section'
  );
});

describe('T-DOC-4: /dev-plan new scaffolds with required sections and PRD reference', () => {
  it.todo(
    'Invoke /dev-plan new. Output must contain: ' +
    '(1) "Based on: PRD v" (placeholder populated), ' +
    '(2) executive summary section, ' +
    '(3) at least one phase section matching /## Phase \\d|### Phase \\d/, ' +
    '(4) file structure section, ' +
    '(5) key design decisions section, ' +
    '(6) troubleshooting section'
  );
});

describe('T-DOC-5: /prd check-ac flags vague criteria; clean PRD produces no flags', () => {
  it.todo(
    'Case A — vague criterion: PRD with criterion "the system handles errors gracefully". ' +
    'Invoke /prd check-ac. Output must flag that criterion with non-empty rationale; ' +
    'flagging line length > 20 chars. ' +
    'Case B — clean PRD: criterion "save-context exits non-zero when context exceeds 100KB". ' +
    'Invoke /prd check-ac. Output must NOT contain "flag" or "vague".'
  );
});

describe('T-DOC-6: /test-inventory skill only available in adversary task', () => {
  it.todo(
    'Case A — outside adversary task: run /test-inventory. ' +
    'Must exit non-zero with message matching /adversary/i. ' +
    'Case B — inside adversary task (update-import adversary): run /test-inventory. ' +
    'Must NOT produce an adversary-only error; skill loads successfully.'
  );
});

// ---------------------------------------------------------------------------
// F-DOC: User Documentation System
// ---------------------------------------------------------------------------

describe('T-UDOC-1: /docs-markdown prompts for section assignment on new F-XXX feature', () => {
  it.todo(
    'PRD has F-NEWFEATURE not yet in docs/feature-section-map.md. ' +
    'Invoke /docs-markdown. Skill must prompt for product section assignment. ' +
    'After assigning "Installation", docs/feature-section-map.md must contain a row for F-NEWFEATURE.'
  );
});

describe('T-UDOC-2: toc.md links to every section in feature-section-map.md', () => {
  it.todo(
    'After /docs-markdown, parse docs/feature-section-map.md for all unique section names. ' +
    'Each section name must appear as a link in docs/markdown/toc.md. ' +
    'Any section missing from the TOC is a FAIL.'
  );
});

describe('T-UDOC-3: glossary.md contains every Core Concepts term from the PRD', () => {
  it.todo(
    'After /docs-markdown on a PRD with defined Core Concepts section, ' +
    'docs/markdown/glossary.md must be non-empty AND ' +
    'every ### heading from the PRD Core Concepts section must appear in the glossary (case-insensitive).'
  );
});

describe('T-UDOC-4: docs/index.html exists and contains intro + TOC content', () => {
  it.todo(
    'Run /docs-markdown then /docs-html. ' +
    'docs/index.html must exist, be non-empty, and ' +
    'contain text from the first line of docs/markdown/introduction.md AND ' +
    'text from the first line of docs/markdown/toc.md.'
  );
});

describe('T-UDOC-5: all generated HTML pages have <nav> with home and glossary links', () => {
  it.todo(
    'After /docs-html, for every .html file in docs/html/ and docs/index.html: ' +
    '(1) file contains "<nav", ' +
    '(2) the <nav>...</nav> block contains "index.html" or "home" (case-insensitive), ' +
    '(3) the <nav>...</nav> block contains "glossary" (case-insensitive).'
  );
});

describe('T-UDOC-6: generated HTML heading hierarchy never skips levels', () => {
  it.todo(
    'After /docs-html, for every .html file in docs/: ' +
    'extract all <hN> tags in document order. ' +
    'No <h2> may appear without a preceding <h1> on the same page. ' +
    'No <h3> may appear without a preceding <h2> on the same page. ' +
    'Violation = FAIL with the filename and offending tag.'
  );
});

describe('T-UDOC-7: /docs-html bootstraps style.md when absent', () => {
  it.todo(
    'Delete docs/html/style.md if it exists. ' +
    'Run /docs-html. ' +
    'docs/html/style.md must exist with non-empty content. ' +
    'Content must contain "color" AND ("typeface" OR "font").'
  );
});

describe('T-UDOC-8: all <img> elements in generated HTML have non-empty alt attribute', () => {
  it.todo(
    'After /docs-html, for every .html file in docs/ (including index.html): ' +
    'find all <img ...> tags. ' +
    'Each must have alt="..." with at least one non-whitespace character. ' +
    'Missing or empty alt is a FAIL with filename and tag.'
  );
});
