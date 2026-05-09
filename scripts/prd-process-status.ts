#!/usr/bin/env tsx

/**
 * prd-process-status.ts - Detect current phase in the PRD-driven development process
 *
 * Scans artifact presence and modification times to determine:
 *   - Which phases are complete
 *   - The current phase
 *   - The next required step
 *   - Whether the adversary run is stale (prd.md newer than test-inventory.md)
 *
 * Usage:
 *   npx tsx scripts/prd-process-status.ts
 *   npx tsx scripts/prd-process-status.ts --dir /path/to/project
 *   npx tsx scripts/prd-process-status.ts --json   (same as default — always outputs JSON)
 *
 * Exit codes:
 *   0 — status successfully determined
 *   1 — prod-mgmt/prd.md not found; cannot determine process state
 */

import fs from 'fs';
import path from 'path';

export interface ProcessStatus {
  completedPhases: (number | string)[];
  currentPhase: number | string;
  nextPhase: number | string;
  adversaryStale: boolean;
  warnings: string[];
  artifacts: {
    prd: { exists: boolean; features: number };
    docs: { exists: boolean; upToDate: boolean };
    testPlan: { exists: boolean };
    devPlan: { exists: boolean };
    tests: { exists: boolean; count: number };
    testInventory: { exists: boolean; stale: boolean };
    riskAcceptances: { exists: boolean };
  };
}

function mtimeMs(p: string): number {
  try { return fs.statSync(p).mtimeMs; } catch { return 0; }
}

function fileContains(p: string, pattern: RegExp): boolean {
  try { return pattern.test(fs.readFileSync(p, 'utf-8')); } catch { return false; }
}

function countFiles(dir: string, ext: string): number {
  try {
    return fs.readdirSync(dir, { recursive: true } as any)
      .filter((f: any) => String(f).endsWith(ext)).length;
  } catch { return 0; }
}

function newestMtime(dir: string): number {
  try {
    const entries: string[] = fs.readdirSync(dir);
    return entries.reduce((max, e) => {
      const m = mtimeMs(path.join(dir, e));
      return m > max ? m : max;
    }, 0);
  } catch { return 0; }
}

export function computeStatus(projectDir: string): ProcessStatus {
  const prodMgmt = path.join(projectDir, 'prod-mgmt');
  const prdPath = path.join(prodMgmt, 'prd.md');
  const testPlanPath = path.join(prodMgmt, 'test-plan.md');
  const devPlanPath = path.join(prodMgmt, 'dev-plan.md');
  const testInventoryPath = path.join(prodMgmt, 'test-inventory.md');
  const riskAcceptancesPath = path.join(prodMgmt, 'risk-acceptances.md');
  const docsHtmlDir = path.join(projectDir, 'docs', 'html');
  const testsDir = path.join(projectDir, 'tests');

  // ── Artifact detection ────────────────────────────────────────────
  const prdExists = fs.existsSync(prdPath);
  const prdMtime = mtimeMs(prdPath);
  let prdFeatures = 0;
  if (prdExists) {
    try {
      const content = fs.readFileSync(prdPath, 'utf-8');
      prdFeatures = (content.match(/^### F-[A-Z0-9-]+/gm) ?? []).length;
    } catch { /**/ }
  }

  const docsHtmlExists = fs.existsSync(docsHtmlDir);
  const docsNewestMtime = newestMtime(docsHtmlDir);
  const docsUpToDate = docsHtmlExists && docsNewestMtime >= prdMtime;

  const testPlanExists = fs.existsSync(testPlanPath);
  const devPlanExists = fs.existsSync(devPlanPath);

  const testCount = countFiles(testsDir, '.test.ts');
  const testsExist = testCount > 0;

  const testInventoryExists = fs.existsSync(testInventoryPath);
  const testInventoryMtime = mtimeMs(testInventoryPath);
  const adversaryStale = testInventoryExists
    ? testInventoryMtime < prdMtime
    : false;

  const riskAcceptancesExists = fs.existsSync(riskAcceptancesPath);

  // ── Phase completion ──────────────────────────────────────────────
  const completedPhases: (number | string)[] = [];
  if (prdExists && prdFeatures > 0) completedPhases.push(1);
  if (docsHtmlExists) completedPhases.push('1a');
  if (testPlanExists) completedPhases.push(2);
  if (devPlanExists) completedPhases.push(3);
  if (testsExist) completedPhases.push(4);
  if (testInventoryExists && !adversaryStale) completedPhases.push(5);

  // ── Current / next phase ─────────────────────────────────────────
  const numericCompleted = completedPhases.filter(p => typeof p === 'number') as number[];
  const maxCompleted = numericCompleted.length > 0 ? Math.max(...numericCompleted) : 0;

  let currentPhase: number | string = maxCompleted || 0;
  let nextPhase: number | string;

  if (!prdExists || prdFeatures === 0) {
    currentPhase = 0;
    nextPhase = 1;
  } else if (!testPlanExists) {
    currentPhase = 1;
    nextPhase = 2;
  } else if (!devPlanExists) {
    currentPhase = 2;
    nextPhase = 3;
  } else if (!testsExist) {
    currentPhase = 3;
    nextPhase = 4;
  } else if (!testInventoryExists || adversaryStale) {
    currentPhase = 4;
    nextPhase = 5;
  } else {
    currentPhase = 5;
    nextPhase = 8;
  }

  // ── Warnings ──────────────────────────────────────────────────────
  const warnings: string[] = [];

  if (adversaryStale) {
    warnings.push(
      'prod-mgmt/prd.md was modified after test-inventory.md — adversary run is stale. ' +
      'Run /task adversary before continuing with implementation.'
    );
  }

  if (testInventoryExists && adversaryStale && testsExist) {
    warnings.push(
      'Implementation work (Phase 4) detected but adversary has not reviewed the current PRD. ' +
      'Phase 5 (Adversarial Review) should run before Phase 4 continues.'
    );
  }

  if (!docsUpToDate && prdExists && prdFeatures > 0) {
    warnings.push(
      'docs/html/ is absent or older than prd.md — user documentation may be out of date. ' +
      'Run /docs-markdown then /docs-html after each PRD update (Phase 1a).'
    );
  }

  return {
    completedPhases,
    currentPhase,
    nextPhase,
    adversaryStale,
    warnings,
    artifacts: {
      prd: { exists: prdExists, features: prdFeatures },
      docs: { exists: docsHtmlExists, upToDate: docsUpToDate },
      testPlan: { exists: testPlanExists },
      devPlan: { exists: devPlanExists },
      tests: { exists: testsExist, count: testCount },
      testInventory: { exists: testInventoryExists, stale: adversaryStale },
      riskAcceptances: { exists: riskAcceptancesExists },
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dirIdx = args.indexOf('--dir');
  const projectDir = dirIdx !== -1 && args[dirIdx + 1]
    ? args[dirIdx + 1]
    : process.cwd();

  const prdPath = path.join(projectDir, 'prod-mgmt', 'prd.md');
  if (!fs.existsSync(prdPath)) {
    process.stderr.write(
      `prd-process-status: PRD not found at ${prdPath}\n` +
      `Run from a project initialized with context-curator, or pass --dir <project-root>.\n`
    );
    process.exit(1);
  }

  const status = computeStatus(projectDir);
  process.stdout.write(JSON.stringify(status, null, 2) + '\n');
}

main().catch((err) => {
  process.stderr.write(`prd-process-status: error: ${err.message}\n`);
  process.exit(1);
});
