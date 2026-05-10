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

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

const REPO_ROOT = resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// F-DOC-SKILLS: Document Authoring Skills
// Static artifact validation: tests read SKILL.md source files and assert
// they specify the required behaviors, without requiring a Claude Code session.
// ---------------------------------------------------------------------------

describe('T-DOC-1: prd/SKILL.md specifies all four new-feature section elements', () => {
  it('SKILL.md contains F-prefix heading template, Expected Behaviors, Test Scenarios, and AC table with T-XXX row', () => {
    const skillPath = join(REPO_ROOT, 'src/skills/context-curator/authoring/prd/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const skill = readFileSync(skillPath, 'utf-8');
    expect(skill).toMatch(/###\s+F-[A-Z]/);
    expect(skill).toContain('**Expected Behaviors:**');
    expect(skill).toContain('**Test Scenarios:**');
    expect(skill).toContain('**Acceptance Criteria:**');
    expect(skill).toMatch(/T-XXX/);
  });
});

describe('T-DOC-2: prd/SKILL.md has auto-invocation for *prd*.md files', () => {
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
});

describe('T-DOC-3: test-plan/SKILL.md specifies all mandatory sections with >= 6 banned patterns', () => {
  it('SKILL.md lists testing philosophy, banned patterns, fix tiers, env setup, feature groups, summary; >= 6 numbered banned items', () => {
    const skillPath = join(REPO_ROOT, 'src/skills/context-curator/authoring/test-plan/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const skill = readFileSync(skillPath, 'utf-8');
    expect(skill).toMatch(/testing philosophy/i);
    expect(skill).toMatch(/banned patterns/i);
    expect(skill).toMatch(/fix priority|tier/i);
    expect(skill).toMatch(/environment setup|prerequisites/i);
    expect(skill).toMatch(/feature test groups|feature.*groups/i);
    expect(skill).toMatch(/summary/i);
    const bannedItems = [...skill.matchAll(/^\d+\.\s+\*\*/gm)];
    expect(bannedItems.length).toBeGreaterThanOrEqual(6);
  });
});

describe('T-DOC-4: dev-plan/SKILL.md specifies all required sections', () => {
  it('SKILL.md has Based on: PRD v, executive summary, phase sections, file structure, design decisions, troubleshooting', () => {
    const skillPath = join(REPO_ROOT, 'src/skills/context-curator/authoring/dev-plan/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const skill = readFileSync(skillPath, 'utf-8');
    expect(skill).toMatch(/Based on: PRD v/);
    expect(skill).toMatch(/executive summary/i);
    expect(skill).toMatch(/### Phase [N\d]|## Phase [N\d]/);
    expect(skill).toMatch(/file structure/i);
    expect(skill).toMatch(/key design decisions|design decisions/i);
    expect(skill).toMatch(/troubleshooting/i);
  });
});

describe('T-DOC-5: prd/SKILL.md specifies check-ac behavior with vague criteria examples', () => {
  it('SKILL.md has check-ac section that flags vague criteria with rationale output', () => {
    const skillPath = join(REPO_ROOT, 'src/skills/context-curator/authoring/prd/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const skill = readFileSync(skillPath, 'utf-8');
    expect(skill).toContain('check-ac');
    expect(skill).toMatch(/handles gracefully|works correctly/i);
    expect(skill).toMatch(/flag|rationale/i);
  });
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
});

// ---------------------------------------------------------------------------
// F-DOC: User Documentation System
// Static artifact validation: tests read docs-markdown/SKILL.md and
// docs-html/SKILL.md and assert they specify the required behaviors.
// ---------------------------------------------------------------------------

describe('T-UDOC-1: docs-markdown/SKILL.md specifies F-XXX section assignment and feature-section-map.md update', () => {
  it('SKILL.md workflow prompts for section assignment on new F-XXX and specifies updating feature-section-map.md', () => {
    const skillPath = join(REPO_ROOT, 'src/skills/context-curator/authoring/docs-markdown/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const skill = readFileSync(skillPath, 'utf-8');
    expect(skill).toContain('feature-section-map.md');
    expect(skill).toMatch(/F-XXX/);
    expect(skill).toMatch(/[Pp]rompt/);
    expect(skill).toMatch(/section/i);
    expect(skill).toMatch(/\| F-XXX \|/);
  });
});

describe('T-UDOC-2: docs-markdown/SKILL.md specifies toc.md links to all mapped sections', () => {
  it('SKILL.md workflow step regenerates toc.md with links to all sections', () => {
    const skillPath = join(REPO_ROOT, 'src/skills/context-curator/authoring/docs-markdown/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const skill = readFileSync(skillPath, 'utf-8');
    expect(skill).toContain('toc.md');
    expect(skill).toMatch(/link.*section|section.*link/i);
  });
});

describe('T-UDOC-3: docs-markdown/SKILL.md specifies glossary.md contains all Core Concepts terms', () => {
  it('SKILL.md workflow step updates glossary.md with all Core Concepts terms from PRD', () => {
    const skillPath = join(REPO_ROOT, 'src/skills/context-curator/authoring/docs-markdown/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const skill = readFileSync(skillPath, 'utf-8');
    expect(skill).toContain('glossary.md');
    expect(skill).toMatch(/[Cc]ore [Cc]oncepts/);
  });
});

describe('T-UDOC-4: docs-html/SKILL.md specifies docs/index.html rendered from introduction.md and toc.md', () => {
  it('SKILL.md output files section specifies docs/index.html built from introduction.md and toc.md', () => {
    const skillPath = join(REPO_ROOT, 'src/skills/context-curator/authoring/docs-html/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const skill = readFileSync(skillPath, 'utf-8');
    expect(skill).toContain('docs/index.html');
    expect(skill).toContain('introduction.md');
    expect(skill).toContain('toc.md');
  });
});

describe('T-UDOC-5: docs-html/SKILL.md specifies every page has <nav> with home and glossary links', () => {
  it('SKILL.md generation constraints require <nav> linking to home (index.html) and glossary on every page', () => {
    const skillPath = join(REPO_ROOT, 'src/skills/context-curator/authoring/docs-html/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const skill = readFileSync(skillPath, 'utf-8');
    expect(skill).toMatch(/<nav/);
    expect(skill).toMatch(/home.*index\.html|index\.html.*home/i);
    expect(skill).toMatch(/glossary/i);
  });
});

describe('T-UDOC-6: docs-html/SKILL.md specifies heading hierarchy must not skip levels', () => {
  it('SKILL.md generation constraints forbid skipping heading levels (h3 without h2, h2 without h1)', () => {
    const skillPath = join(REPO_ROOT, 'src/skills/context-curator/authoring/docs-html/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const skill = readFileSync(skillPath, 'utf-8');
    expect(skill).toMatch(/[Hh]eading hierarchy|skip.*level/i);
    expect(skill).toMatch(/h3.*h2|h2.*h1/);
  });
});

describe('T-UDOC-7: docs-html/SKILL.md specifies style.md bootstrapped when absent with color and typeface/font', () => {
  it('SKILL.md requires creating style.md defaults when absent; defaults must include color and typeface or font', () => {
    const skillPath = join(REPO_ROOT, 'src/skills/context-curator/authoring/docs-html/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const skill = readFileSync(skillPath, 'utf-8');
    expect(skill).toContain('style.md');
    expect(skill).toMatch(/absent|missing/i);
    expect(skill).toMatch(/color/i);
    expect(skill).toMatch(/typeface|font/i);
  });
});

describe('T-UDOC-8: docs-html/SKILL.md specifies non-empty alt attribute on all img elements', () => {
  it('SKILL.md generation constraints require non-empty alt attribute on all <img> elements', () => {
    const skillPath = join(REPO_ROOT, 'src/skills/context-curator/authoring/docs-html/SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const skill = readFileSync(skillPath, 'utf-8');
    expect(skill).toMatch(/<img/);
    expect(skill).toMatch(/\balt\b/);
    expect(skill).toMatch(/non-empty/i);
  });
});
