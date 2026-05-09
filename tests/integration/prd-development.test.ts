/**
 * PRD-Driven Development Tests (F-PRD)
 *
 * T-PRD-1: Every F-XXX feature section in the PRD has an Acceptance Criteria table
 * T-PRD-2: All T-XXX codes in the PRD are unique (no duplicates)
 * T-PRD-3: prod-mgmt/risk-acceptances.md contains DISPOSITION, EXPIRY, RA_ID after init
 * T-PRD-4: prod-mgmt/test-inventory.md (when present) references only T-XXX codes that appear in the PRD
 *
 * T-PRD-1 and T-PRD-2 read the actual PRD file in this repo — they are structural
 * quality gates that run on every CI pass to keep the document well-formed.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { writeFileSync } from 'fs';
import {
  createTestEnvironment,
  TestContext,
  runScript,
  fileExists,
  readFile,
} from '../utils/test-helpers';

const REPO_ROOT = resolve(__dirname, '../..');
const PRD_PATH = join(REPO_ROOT, 'prod-mgmt', 'prd.md');
const TEST_INVENTORY_PATH = join(REPO_ROOT, 'prod-mgmt', 'test-inventory.md');

// ---------------------------------------------------------------------------
// T-PRD-1: Every feature section has an Acceptance Criteria table
// ---------------------------------------------------------------------------

describe('T-PRD-1: Every F-XXX feature section has an AC table', () => {
  it('prd.md must exist', () => {
    expect(existsSync(PRD_PATH)).toBe(true);
  });

  it('every ### F-XXX section must contain an Acceptance Criteria table with at least one T-XXX row', () => {
    const prd = readFileSync(PRD_PATH, 'utf-8');
    const lines = prd.split('\n');

    // Collect sections: from a `### F-XXX` heading until the next `### ` or `## ` (non-sub-heading)
    const featureSections: Array<{ code: string; content: string }> = [];
    let currentCode: string | null = null;
    let currentLines: string[] = [];

    for (const line of lines) {
      const featureMatch = line.match(/^### (F-[A-Z0-9-]+)/);
      const topLevelMatch = line.match(/^## [^#]/);

      if (featureMatch) {
        if (currentCode !== null) {
          featureSections.push({ code: currentCode, content: currentLines.join('\n') });
        }
        currentCode = featureMatch[1];
        currentLines = [line];
      } else if (topLevelMatch) {
        if (currentCode !== null) {
          featureSections.push({ code: currentCode, content: currentLines.join('\n') });
          currentCode = null;
          currentLines = [];
        }
      } else if (currentCode !== null) {
        currentLines.push(line);
      }
    }
    if (currentCode !== null) {
      featureSections.push({ code: currentCode, content: currentLines.join('\n') });
    }

    expect(featureSections.length).toBeGreaterThan(0);

    const missing = featureSections.filter(
      (s) =>
        !s.content.includes('Acceptance Criteria') ||
        !/\| T-[A-Z0-9-]+-\d+/.test(s.content)
    );

    expect(missing.map((s) => s.code)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// T-PRD-2: All T-XXX codes in the PRD are unique
// ---------------------------------------------------------------------------

describe('T-PRD-2: All T-XXX codes in the PRD are unique', () => {
  it('no T-XXX code may appear in more than one AC row', () => {
    const prd = readFileSync(PRD_PATH, 'utf-8');

    // Only count codes that appear in AC table rows (| T-XXX | ...), not in prose references
    const acRowCodes = prd.match(/^\|\s*(T-[A-Z0-9-]+-\d+)\s*\|/gm) ?? [];
    const codes = acRowCodes.map((row) => row.match(/T-[A-Z0-9-]+-\d+/)![0]);

    const seen = new Map<string, number>();
    for (const code of codes) {
      seen.set(code, (seen.get(code) ?? 0) + 1);
    }

    const duplicates = [...seen.entries()]
      .filter(([, count]) => count > 1)
      .map(([code]) => code);

    // NOTE: If this test fails, the PRD has duplicate T-XXX codes.
    // Known issue (PRD v20.0): F-DOC-SKILLS and F-DOC both use T-DOC-1 through T-DOC-6.
    // Fix: rename F-DOC codes to T-UDOC-1 through T-UDOC-8 in the PRD.
    expect(duplicates).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// T-PRD-3: risk-acceptances.md has DISPOSITION, EXPIRY, and RA_ID after init
// (Script-level test; init-project.ts must create the file)
// ---------------------------------------------------------------------------

describe('T-PRD-3: risk-acceptances.md template fields after init-project', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestEnvironment('prd3');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test\n');
  });

  afterEach(() => ctx.cleanup());

  it('should create prod-mgmt/risk-acceptances.md containing DISPOSITION, EXPIRY, and RA_ID', async () => {
    const result = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    expect(result.exitCode).toBe(0);

    const riskPath = join(ctx.projectDir, 'prod-mgmt', 'risk-acceptances.md');
    expect(fileExists(riskPath)).toBe(true);

    const content = readFile(riskPath);
    expect(content).toContain('DISPOSITION');
    expect(content).toContain('EXPIRY');
    expect(content).toContain('RA_ID');
  });
});

// ---------------------------------------------------------------------------
// T-PRD-4: test-inventory.md only references T-XXX codes that appear in the PRD
// ---------------------------------------------------------------------------

describe('T-PRD-4: test-inventory.md references only known T-XXX codes', () => {
  it('should have no orphaned T-XXX codes (skipped if test-inventory.md does not exist)', () => {
    if (!existsSync(TEST_INVENTORY_PATH)) {
      // Adversary has not run yet — this is expected in early development
      return;
    }

    const prd = readFileSync(PRD_PATH, 'utf-8');
    const prdCodes = new Set(prd.match(/\bT-[A-Z0-9-]+-\d+\b/g) ?? []);

    const inventory = readFileSync(TEST_INVENTORY_PATH, 'utf-8');
    const inventoryCodes = inventory.match(/\bT-[A-Z0-9-]+-\d+\b/g) ?? [];

    const orphaned = [...new Set(inventoryCodes)].filter((c) => !prdCodes.has(c));
    expect(orphaned).toEqual([]);
  });
});
