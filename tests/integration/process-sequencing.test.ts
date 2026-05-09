/**
 * Process Sequencing Tests (F-PROCESS)
 *
 * Tests for prd-process-status.ts — the phase detection and adversary-staleness check.
 * Each test sets up a minimal project directory with specific artifacts and timestamps,
 * then asserts the JSON output matches the expected process state.
 *
 * T-PROC-1: PRD-only → Phase 1, nextPhase 2
 * T-PROC-2: test-inventory older than prd.md → adversaryStale true + warning
 * T-PROC-3: test-inventory newer than prd.md → adversaryStale false, no stale warning
 * T-PROC-4: no prd.md → non-zero exit, output contains "PRD"
 * T-PROC-5: test-plan + dev-plan + tests but no test-inventory → Phase 4, nextPhase 5
 * T-PROC-6: output is always valid JSON with required fields
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdirSync, writeFileSync, utimesSync } from 'fs';
import {
  createTestEnvironment,
  TestContext,
  runScript,
} from '../utils/test-helpers';

function writePrd(dir: string, content?: string) {
  mkdirSync(join(dir, 'prod-mgmt'), { recursive: true });
  writeFileSync(
    join(dir, 'prod-mgmt', 'prd.md'),
    content ?? '### F-ALPHA · Alpha Feature\n\nSome text.\n\n| T-ALPHA-1 | criterion |\n'
  );
}

function writeTestInventory(dir: string) {
  writeFileSync(
    join(dir, 'prod-mgmt', 'test-inventory.md'),
    '| T-ALPHA-1 | F-ALPHA | test.ts | PASS |\n'
  );
}

function writeTestPlan(dir: string) {
  writeFileSync(join(dir, 'prod-mgmt', 'test-plan.md'), '# Test Plan\n');
}

function writeDevPlan(dir: string) {
  writeFileSync(join(dir, 'prod-mgmt', 'dev-plan.md'), '# Dev Plan\n');
}

function writeTestFile(dir: string) {
  mkdirSync(join(dir, 'tests'), { recursive: true });
  writeFileSync(join(dir, 'tests', 'example.test.ts'), '// test\n');
}

// Helper: set a file's mtime to now ± offsetMs
function setMtime(filePath: string, offsetMs: number = 0) {
  const t = (Date.now() + offsetMs) / 1000;
  utimesSync(filePath, t, t);
}

// ── T-PROC-1 ──────────────────────────────────────────────────────────────

describe('T-PROC-1: PRD-only project reports Phase 1, nextPhase 2', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('proc1'); });
  afterEach(() => { ctx.cleanup(); });

  it('should exit 0 and report currentPhase=1 nextPhase=2 with only prd.md', async () => {
    writePrd(ctx.projectDir);

    const result = await runScript('prd-process-status', [], ctx.projectDir);

    expect(result.exitCode).toBe(0);

    let status: Record<string, any>;
    expect(() => { status = JSON.parse(result.stdout); }).not.toThrow();
    status = JSON.parse(result.stdout);

    expect(status.currentPhase).toBe(1);
    expect(status.nextPhase).toBe(2);
    expect(Array.isArray(status.completedPhases)).toBe(true);
    expect(status.completedPhases).toContain(1);
  });
});

// ── T-PROC-2 ──────────────────────────────────────────────────────────────

describe('T-PROC-2: Stale adversary flagged when prd.md is newer than test-inventory.md', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('proc2'); });
  afterEach(() => { ctx.cleanup(); });

  it('should set adversaryStale=true with a warning when test-inventory is older than prd', async () => {
    const prdPath = join(ctx.projectDir, 'prod-mgmt', 'prd.md');
    const invPath = join(ctx.projectDir, 'prod-mgmt', 'test-inventory.md');

    writePrd(ctx.projectDir);
    writeTestInventory(ctx.projectDir);

    // Make test-inventory older and prd newer
    setMtime(invPath, -10_000);  // 10 seconds in the past
    setMtime(prdPath, 0);        // now

    const result = await runScript('prd-process-status', [], ctx.projectDir);

    expect(result.exitCode).toBe(0);
    const status = JSON.parse(result.stdout);

    expect(status.adversaryStale).toBe(true);
    expect(Array.isArray(status.warnings)).toBe(true);
    expect(status.warnings.length).toBeGreaterThan(0);
    expect(status.warnings.some((w: string) => /stale|adversary/i.test(w))).toBe(true);
  });
});

// ── T-PROC-3 ──────────────────────────────────────────────────────────────

describe('T-PROC-3: Non-stale adversary when test-inventory is newer than prd.md', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('proc3'); });
  afterEach(() => { ctx.cleanup(); });

  it('should set adversaryStale=false with no stale warning when test-inventory is newer', async () => {
    const prdPath = join(ctx.projectDir, 'prod-mgmt', 'prd.md');
    const invPath = join(ctx.projectDir, 'prod-mgmt', 'test-inventory.md');

    writePrd(ctx.projectDir);
    writeTestPlan(ctx.projectDir);
    writeDevPlan(ctx.projectDir);
    writeTestFile(ctx.projectDir);
    writeTestInventory(ctx.projectDir);

    // Make prd older and test-inventory newer
    setMtime(prdPath, -10_000);  // 10 seconds in the past
    setMtime(invPath, 0);        // now

    const result = await runScript('prd-process-status', [], ctx.projectDir);

    expect(result.exitCode).toBe(0);
    const status = JSON.parse(result.stdout);

    expect(status.adversaryStale).toBe(false);
    // No adversary-stale warning
    expect(
      status.warnings.every((w: string) => !/stale|adversary/i.test(w))
    ).toBe(true);
  });
});

// ── T-PROC-4 ──────────────────────────────────────────────────────────────

describe('T-PROC-4: No prd.md → non-zero exit with "PRD" in output', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('proc4'); });
  afterEach(() => { ctx.cleanup(); });

  it('should exit non-zero and mention PRD when prod-mgmt/prd.md is absent', async () => {
    // Empty project — no prd.md at all
    const result = await runScript('prd-process-status', [], ctx.projectDir);

    expect(result.exitCode).not.toBe(0);
    const combined = result.stdout + result.stderr;
    expect(combined).toMatch(/PRD/i);
  });
});

// ── T-PROC-5 ──────────────────────────────────────────────────────────────

describe('T-PROC-5: Test-plan + dev-plan + tests, no test-inventory → Phase 4 / nextPhase 5', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('proc5'); });
  afterEach(() => { ctx.cleanup(); });

  it('should report currentPhase=4 and nextPhase=5 when test-inventory is absent', async () => {
    writePrd(ctx.projectDir);
    writeTestPlan(ctx.projectDir);
    writeDevPlan(ctx.projectDir);
    writeTestFile(ctx.projectDir);
    // Deliberately no test-inventory.md

    const result = await runScript('prd-process-status', [], ctx.projectDir);

    expect(result.exitCode).toBe(0);
    const status = JSON.parse(result.stdout);

    expect(status.currentPhase).toBe(4);
    expect(status.nextPhase).toBe(5);
  });
});

// ── T-PROC-6 ──────────────────────────────────────────────────────────────

describe('T-PROC-6: Output always valid JSON with required fields', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('proc6'); });
  afterEach(() => { ctx.cleanup(); });

  it('should output valid JSON with all required fields in PRD-only state', async () => {
    writePrd(ctx.projectDir);

    const result = await runScript('prd-process-status', [], ctx.projectDir);

    expect(result.exitCode).toBe(0);

    let status: Record<string, any>;
    expect(() => { status = JSON.parse(result.stdout); }).not.toThrow();
    status = JSON.parse(result.stdout);

    // Required fields and types
    expect(Array.isArray(status.completedPhases)).toBe(true);
    expect(
      typeof status.currentPhase === 'number' || typeof status.currentPhase === 'string'
    ).toBe(true);
    expect(
      typeof status.nextPhase === 'number' || typeof status.nextPhase === 'string'
    ).toBe(true);
    expect(typeof status.adversaryStale).toBe('boolean');
    expect(Array.isArray(status.warnings)).toBe(true);
  });

  it('should output valid JSON with all required fields in full-artifact state', async () => {
    const prdPath = join(ctx.projectDir, 'prod-mgmt', 'prd.md');
    const invPath = join(ctx.projectDir, 'prod-mgmt', 'test-inventory.md');

    writePrd(ctx.projectDir);
    writeTestPlan(ctx.projectDir);
    writeDevPlan(ctx.projectDir);
    writeTestFile(ctx.projectDir);
    writeTestInventory(ctx.projectDir);

    setMtime(prdPath, -10_000);
    setMtime(invPath, 0);

    const result = await runScript('prd-process-status', [], ctx.projectDir);

    expect(result.exitCode).toBe(0);
    const status = JSON.parse(result.stdout);

    expect(Array.isArray(status.completedPhases)).toBe(true);
    expect(typeof status.adversaryStale).toBe('boolean');
    expect(Array.isArray(status.warnings)).toBe(true);
    // Artifacts sub-object
    expect(typeof status.artifacts).toBe('object');
    expect(typeof status.artifacts.prd).toBe('object');
    expect(typeof status.artifacts.testInventory).toBe('object');
  });
});
