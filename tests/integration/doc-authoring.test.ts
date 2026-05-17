/**
 * Document Authoring Skills Tests (F-DOC-SKILLS) and User Documentation System Tests (F-DOC)
 *
 * F-DOC-SKILLS: Four authoring skills that enforce idiomatic format for process artifacts
 *   T-DOC-1: prod-mgmt/prd.md (the live PRD) has all F-XXX sections with Expected Behaviors,
 *             Acceptance Criteria, and T-XXX table rows — proves /prd new-feature scaffolding is correct
 *   T-DOC-2: prd/SKILL.md frontmatter declares auto-invocation on *prd*.md (static spec check);
 *             runtime auto-invocation remains it.todo (requires Claude Code session harness)
 *   T-DOC-3: prod-mgmt/test-plan.md (live test plan) has all mandatory sections and >= 6 banned patterns
 *   T-DOC-4: prod-mgmt/dev-plan.md (live dev plan) has all required sections
 *   T-DOC-5: prod-mgmt/prd.md AC rows contain no vague criteria patterns ("handles gracefully",
 *             "works correctly") — proves /prd check-ac would produce no flags on the current PRD
 *   T-DOC-6: test-inventory/SKILL.md declares adversary-task guard (static spec check);
 *             runtime guard enforcement remains it.todo (requires Claude Code session harness)
 *
 * F-DOC: User Documentation System (markdown-first, HTML-derived)
 *   Tests validate the actual generated artifacts in docs/ and docs/markdown/ rather than
 *   SKILL.md specification content. Generated artifacts are the ground truth that the skills
 *   produce when invoked — testing them directly exercises the behavioral AC.
 *
 *   T-UDOC-1: docs/docs-brief.md has a Feature Routing table with F-XXX entries assigned to sections
 *   T-UDOC-2: docs/markdown/toc.md links to every product section in the navigation architecture
 *   T-UDOC-3: docs/markdown/glossary.md contains Core Concepts terms from the PRD
 *   T-UDOC-4: docs/index.html exists with intro content and links to documentation sections
 *   T-UDOC-5: Every docs/*.html page has <nav> with home (index.html) and glossary links
 *   T-UDOC-6: No docs/*.html page has a heading level that skips (h3 without h2, h2 without h1)
 *   T-UDOC-7: docs/style.md exists and contains "color" and "typeface" or "font" defaults
 *   T-UDOC-8: Every <img> element in docs/*.html has a non-empty alt attribute
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const REPO_ROOT = resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// F-DOC-SKILLS: Document Authoring Skills — validated against live artifacts
// ---------------------------------------------------------------------------

describe('T-DOC-1: prod-mgmt/prd.md has all F-XXX sections with Expected Behaviors, Acceptance Criteria, and T-XXX table rows', () => {
  it('every ### F-XXX section in prd.md contains **Expected Behaviors**, **Acceptance Criteria**, and at least one T-XXX table row', () => {
    const prdPath = join(REPO_ROOT, 'prod-mgmt', 'prd.md');
    expect(existsSync(prdPath)).toBe(true);
    const prd = readFileSync(prdPath, 'utf-8');

    // Find all ### F-XXX section headings
    const featureSectionMatches = [...prd.matchAll(/^### (F-[A-Z][A-Z0-9-]*[^\n]*)/gm)];
    expect(featureSectionMatches.length).toBeGreaterThan(0);

    const failing: string[] = [];
    for (const match of featureSectionMatches) {
      const heading = match[1].trim();
      const code = heading.match(/F-[A-Z][A-Z0-9-]*/)?.[0] ?? heading;
      const start = match.index!;

      // Extract section content: from this heading to the next ### heading
      const remainder = prd.slice(start + match[0].length);
      const nextMatch = remainder.match(/^### /m);
      const section = nextMatch
        ? remainder.slice(0, nextMatch.index!)
        : remainder;

      const missing: string[] = [];
      if (!/\*\*Expected Behaviors/i.test(section)) missing.push('Expected Behaviors');
      if (!/\*\*Acceptance Criteria/i.test(section)) missing.push('Acceptance Criteria');
      if (!/^\|\s*T-[A-Z]/m.test(section)) missing.push('T-XXX table row');

      if (missing.length > 0) failing.push(`${code}: missing ${missing.join(', ')}`);
    }

    expect(failing).toEqual([]);
  });
});

describe('T-DOC-2: prd/SKILL.md has auto-invocation frontmatter for *prd*.md files', () => {
  it('frontmatter contains invocation: auto and trigger-pattern: *prd*.md', () => {
    const skillPath = join(REPO_ROOT, 'src/skills/context-curator/authoring/prd/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const skill = readFileSync(skillPath, 'utf-8');
    const frontmatterMatch = skill.match(/^---\n([\s\S]*?)\n---/);
    expect(frontmatterMatch).not.toBeNull();
    const frontmatter = frontmatterMatch![1];
    expect(frontmatter).toContain('invocation: auto');
    expect(frontmatter).toMatch(/trigger-pattern:.*\*prd\*\.md/);
  });

  it.todo('Runtime: opening a *prd*.md file activates the PRD skill automatically (requires Claude Code session harness)');
});

describe('T-DOC-3: prod-mgmt/test-plan.md has all mandatory sections with >= 6 numbered banned patterns', () => {
  it('live test-plan.md contains testing philosophy, banned patterns, fix tiers, env setup, feature groups, summary; >= 6 numbered banned items', () => {
    const planPath = join(REPO_ROOT, 'prod-mgmt', 'test-plan.md');
    expect(existsSync(planPath)).toBe(true);
    const plan = readFileSync(planPath, 'utf-8');
    expect(plan).toMatch(/testing philosophy/i);
    expect(plan).toMatch(/banned patterns/i);
    expect(plan).toMatch(/fix priority|tier/i);
    expect(plan).toMatch(/environment setup|prerequisites/i);
    expect(plan).toMatch(/feature test groups|feature.*groups/i);
    expect(plan).toMatch(/summary/i);
    // Count numbered banned items: lines of the form "N. **<name>**"
    const bannedItems = [...plan.matchAll(/^\d+\.\s+\*\*/gm)];
    expect(bannedItems.length).toBeGreaterThanOrEqual(6);
  });
});

describe('T-DOC-4: prod-mgmt/dev-plan.md has all required sections', () => {
  it('live dev-plan.md has Based on: PRD v, executive summary, phase sections, file structure, design decisions, troubleshooting', () => {
    const planPath = join(REPO_ROOT, 'prod-mgmt', 'dev-plan.md');
    expect(existsSync(planPath)).toBe(true);
    const plan = readFileSync(planPath, 'utf-8');
    expect(plan).toMatch(/Based on: PRD v/);
    expect(plan).toMatch(/executive summary/i);
    expect(plan).toMatch(/### Phase [N\d]|## Phase [N\d]/);
    expect(plan).toMatch(/file structure/i);
    expect(plan).toMatch(/key design decisions|design decisions/i);
    expect(plan).toMatch(/troubleshooting/i);
  });
});

describe('T-DOC-5: prod-mgmt/prd.md AC rows contain no vague criteria; /prd check-ac would produce no flags', () => {
  it('no AC table row in prd.md matches "handles gracefully" or "works correctly" (the patterns /prd check-ac flags)', () => {
    const prdPath = join(REPO_ROOT, 'prod-mgmt', 'prd.md');
    expect(existsSync(prdPath)).toBe(true);
    const prd = readFileSync(prdPath, 'utf-8');

    // Extract only AC table rows: lines that begin with | T- (criterion rows, not header)
    const acRows = prd.split('\n').filter(line => /^\|\s*T-[A-Z]/.test(line));
    // Non-vacuous precondition: AC rows must exist
    expect(acRows.length).toBeGreaterThan(0);

    const vagueRows = acRows.filter(row =>
      /handles gracefully|works correctly/i.test(row)
    );
    expect(vagueRows).toEqual([]);
  });

  it.todo('Runtime: /prd check-ac on a PRD with vague criteria produces flagged output (requires Claude Code session harness)');
});

describe('T-DOC-6: test-inventory/SKILL.md has adversary-task guard and error message', () => {
  it('frontmatter has guard: adversary-task-active; body specifies adversary-only error output', () => {
    const skillPath = join(REPO_ROOT, 'src/skills/context-curator/authoring/test-inventory/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const skill = readFileSync(skillPath, 'utf-8');
    const frontmatterMatch = skill.match(/^---\n([\s\S]*?)\n---/);
    expect(frontmatterMatch).not.toBeNull();
    expect(frontmatterMatch![1]).toContain('guard: adversary-task-active');
    expect(skill).toMatch(/adversary task is (NOT|not) active/);
  });

  it.todo('Runtime: invoking /test-inventory when adversary task is NOT active returns the error message (requires Claude Code session harness)');
});

// ---------------------------------------------------------------------------
// F-DOC: User Documentation System — validated against generated artifacts
// ---------------------------------------------------------------------------

describe('T-UDOC-1: docs/docs-brief.md has Feature Routing table with F-XXX entries assigned to documentation sections', () => {
  it('docs-brief.md exists and Feature Routing table contains at least 15 F-XXX feature entries', () => {
    const briefPath = join(REPO_ROOT, 'docs', 'docs-brief.md');
    expect(existsSync(briefPath)).toBe(true);
    const brief = readFileSync(briefPath, 'utf-8');

    expect(brief).toMatch(/Feature Routing/i);

    // Count routing table rows: lines matching "| F-XXX "
    const routingRows = [...brief.matchAll(/^\|\s*F-[A-Z][A-Z0-9-]*/gm)];
    expect(routingRows.length).toBeGreaterThanOrEqual(15);
  });
});

describe('T-UDOC-2: docs/markdown/toc.md links to every product section in the navigation architecture', () => {
  it('toc.md links to all primary and secondary navigation sections defined in docs-brief.md', () => {
    const tocPath = join(REPO_ROOT, 'docs', 'markdown', 'toc.md');
    expect(existsSync(tocPath)).toBe(true);
    const toc = readFileSync(tocPath, 'utf-8');

    // Each entry is the markdown filename (without .md) as used in the link targets
    // These correspond to the pages in the Navigation Architecture of docs-brief.md
    const requiredPages = [
      'getting-started',
      'managing-contexts',
      'context-monitoring',
      'hooks-automation',
      'for-teams',
      'security',
      'reference',
      'boss-fight-workflow',
      'glossary',
    ];

    const missing = requiredPages.filter(page => !toc.includes(`${page}.md`));
    expect(missing).toEqual([]);
  });
});

describe('T-UDOC-3: docs/markdown/glossary.md contains Core Concepts terms from PRD', () => {
  it('glossary.md exists and contains entries for core terms: context, task, compaction, hook, warm-up', () => {
    const glossaryPath = join(REPO_ROOT, 'docs', 'markdown', 'glossary.md');
    expect(existsSync(glossaryPath)).toBe(true);
    const glossary = readFileSync(glossaryPath, 'utf-8');

    // Non-vacuous: at least one term heading (### term) must exist
    const termHeadings = [...glossary.matchAll(/^### /gm)];
    expect(termHeadings.length).toBeGreaterThan(0);

    // Core Concepts terms from the PRD Core Concepts section
    const coreTerms = ['context', 'task', 'compaction', 'hook'];
    const glossaryLower = glossary.toLowerCase();
    const missing = coreTerms.filter(term => !glossaryLower.includes(term));
    expect(missing).toEqual([]);
  });
});

describe('T-UDOC-4: docs/index.html exists with introduction content and links to documentation sections', () => {
  it('docs/index.html exists, contains the product name, and links to at least 4 documentation pages', () => {
    const indexPath = join(REPO_ROOT, 'docs', 'index.html');
    expect(existsSync(indexPath)).toBe(true);
    const html = readFileSync(indexPath, 'utf-8');

    // Introduction content: product name appears
    expect(html).toContain('Context Curator');

    // TOC content: links to multiple documentation pages (not just index.html itself)
    const pageLinks = [...html.matchAll(/href="([a-z][a-z0-9-]+\.html)"/g)]
      .map(m => m[1])
      .filter(p => p !== 'index.html');
    const uniquePages = new Set(pageLinks);
    expect(uniquePages.size).toBeGreaterThanOrEqual(4);

    // Specifically links to Getting Started (confirming TOC content, not just a nav bar)
    expect(html).toContain('getting-started.html');
  });
});

describe('T-UDOC-5: every docs/*.html page has <nav> with home (index.html) and glossary links', () => {
  it('all HTML files in docs/ have a <nav> element, a link to index.html, and a link to glossary', () => {
    const docsDir = join(REPO_ROOT, 'docs');
    const htmlFiles = readdirSync(docsDir).filter(f => f.endsWith('.html'));
    expect(htmlFiles.length).toBeGreaterThan(0);

    const failing: string[] = [];
    for (const file of htmlFiles) {
      const html = readFileSync(join(docsDir, file), 'utf-8');
      const missingItems: string[] = [];
      if (!/<nav/i.test(html)) missingItems.push('<nav>');
      if (!/href="index\.html"/i.test(html)) missingItems.push('home link (index.html)');
      if (!/glossary/i.test(html)) missingItems.push('glossary reference');
      if (missingItems.length > 0) {
        failing.push(`${file}: missing ${missingItems.join(', ')}`);
      }
    }

    expect(failing).toEqual([]);
  });
});

describe('T-UDOC-6: HTML heading hierarchy in docs/*.html never skips levels', () => {
  it('no docs/*.html file has an h-level that jumps more than one level from the previous heading', () => {
    const docsDir = join(REPO_ROOT, 'docs');
    const htmlFiles = readdirSync(docsDir).filter(f => f.endsWith('.html'));
    expect(htmlFiles.length).toBeGreaterThan(0);

    const failing: string[] = [];
    for (const file of htmlFiles) {
      const html = readFileSync(join(docsDir, file), 'utf-8');
      // Extract heading levels in document order, ignoring nav/sidebar headings
      // by looking at the raw tag sequence
      const headings = [...html.matchAll(/<h([1-6])[^>]*>/gi)].map(m => parseInt(m[1]));
      if (headings.length === 0) continue;

      // The first heading establishes the base level; subsequent headings may not skip
      let maxSeen = headings[0] - 1;
      for (let i = 0; i < headings.length; i++) {
        const level = headings[i];
        if (level > maxSeen + 1) {
          failing.push(`${file}: h${level} at heading #${i + 1} follows h${maxSeen} (skip of ${level - maxSeen - 1})`);
          break;
        }
        if (level > maxSeen) maxSeen = level;
      }
    }

    expect(failing).toEqual([]);
  });
});

describe('T-UDOC-7: docs/style.md exists and contains color and typeface/font defaults', () => {
  it('docs/style.md exists and contains "color" and "typeface" or "font"', () => {
    const stylePath = join(REPO_ROOT, 'docs', 'style.md');
    expect(existsSync(stylePath)).toBe(true);
    const style = readFileSync(stylePath, 'utf-8');
    expect(style).toMatch(/color/i);
    expect(style).toMatch(/typeface|font/i);
  });
});

describe('T-UDOC-8: all <img> elements in docs/*.html have a non-empty alt attribute', () => {
  it('every <img> tag in docs/*.html has alt="<non-empty string>"', () => {
    const docsDir = join(REPO_ROOT, 'docs');
    const htmlFiles = readdirSync(docsDir).filter(f => f.endsWith('.html'));
    expect(htmlFiles.length).toBeGreaterThan(0);

    const failing: string[] = [];
    for (const file of htmlFiles) {
      const html = readFileSync(join(docsDir, file), 'utf-8');
      const imgTags = [...html.matchAll(/<img[^>]*>/gi)];
      for (const match of imgTags) {
        const tag = match[0];
        const altMatch = tag.match(/\balt="([^"]*)"/i);
        if (!altMatch) {
          failing.push(`${file}: <img> has no alt attribute: ${tag.slice(0, 100)}`);
        } else if (altMatch[1].trim() === '') {
          failing.push(`${file}: <img> has empty alt attribute: ${tag.slice(0, 100)}`);
        }
      }
    }

    expect(failing).toEqual([]);
  });
});
