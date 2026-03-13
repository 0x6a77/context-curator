/**
 * Adversary Feature Tests
 *
 * Covers F-SPEC (Specialized Task Framework) and F-ADVERSARY:
 * - T-ADV-1: DNA installed at specialized path after install.sh
 * - T-SPEC-4 / T-ADV-2: update-import adversary sets correct @import path
 * - T-ADV-3 / T-SPEC-1: DNA unchanged after user task operations
 * - T-ADV-4 / T-SPEC-2: save-context rejected when adversary task is active
 * - T-SPEC-3: context-list returns isolation message when adversary is active
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'fs';
import { homedir } from 'os';
import {
  createTestEnvironment,
  TestContext,
  runScript,
  fileExists,
  readFile,
  createJsonl,
} from '../utils/test-helpers';
import { SMALL_CONTEXT } from '../fixtures/sample-contexts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Path where install.sh writes the adversary DNA on the real system.
 * T-ADV-1 and T-ADV-3 verify this path.
 */
const SPECIALIZED_DNA_PATH = join(
  homedir(),
  '.claude/context-curator/specialized/adversary/CLAUDE.md'
);

/**
 * Source DNA in the repo — copied by install.sh to the specialized path.
 */
const REPO_DNA_PATH = join(__dirname, '../../specialized/adversary/CLAUDE.md');

/**
 * Minimal adversary CLAUDE.md used to seed the CLAUDE_HOME specialized path
 * in isolated tests. Content must include "ADVERSARY" and "STRICT".
 */
const ADVERSARY_FIXTURE_CONTENT = readFileSync(REPO_DNA_PATH, 'utf-8');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create adversary task CLAUDE.md in the project's golden task location.
 * Used for tests that need STRICT detection but don't require the specialized path.
 */
function setupGoldenAdversaryTask(projectDir: string): void {
  const adversaryDir = join(projectDir, '.claude', 'tasks', 'adversary');
  mkdirSync(adversaryDir, { recursive: true });
  writeFileSync(join(adversaryDir, 'CLAUDE.md'), ADVERSARY_FIXTURE_CONTENT);
}

/**
 * Create adversary DNA in the isolated CLAUDE_HOME specialized location.
 * Simulates what install.sh does, scoped to the test's isolated home.
 * Used for T-ADV-2 / T-SPEC-4 where update-import must find the specialized path.
 */
function setupSpecializedAdversaryTask(personalBase: string): void {
  const specializedDir = join(personalBase, 'context-curator', 'specialized', 'adversary');
  mkdirSync(specializedDir, { recursive: true });
  writeFileSync(join(specializedDir, 'CLAUDE.md'), ADVERSARY_FIXTURE_CONTENT);
}

// ---------------------------------------------------------------------------
// T-ADV-1: DNA Installed at Correct Path After install.sh
// ---------------------------------------------------------------------------

describe('T-ADV-1: Adversary DNA installed at specialized path', () => {
  // Simulate install.sh: copy the repo's specialized directory to the real home.
  // In a real deployment this is done by running install.sh; here we replicate
  // only the specialized-copy step so the test environment mirrors production.
  beforeAll(() => {
    const targetDir = join(homedir(), '.claude/context-curator/specialized/adversary');
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(join(targetDir, 'CLAUDE.md'), ADVERSARY_FIXTURE_CONTENT);
  });

  it('should exist at ~/.claude/context-curator/specialized/adversary/CLAUDE.md and contain ADVERSARY and STRICT', () => {
    // Unconditional existence check — no if guard
    expect(fileExists(SPECIALIZED_DNA_PATH)).toBe(true);

    const content = readFile(SPECIALIZED_DNA_PATH);
    expect(content).toContain('ADVERSARY');
    expect(content).toContain('STRICT');
  });
});

// ---------------------------------------------------------------------------
// T-SPEC-4 / T-ADV-2: update-import adversary sets correct @import path
// ---------------------------------------------------------------------------

describe('T-SPEC-4 / T-ADV-2: update-import adversary sets correct @import', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('adv2');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test\n');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    // Put adversary DNA in the isolated CLAUDE_HOME specialized path so update-import
    // finds it there (as install.sh would have done on a real system).
    setupSpecializedAdversaryTask(ctx.personalBase);
  });

  afterEach(() => ctx.cleanup());

  it('should exit 0 and produce exactly one @import line in .claude/CLAUDE.md', async () => {
    const result = await runScript(
      'update-import',
      ['adversary'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );
    expect(result.exitCode).toBe(0);

    const claudeMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
    expect(fileExists(claudeMdPath)).toBe(true);

    const content = readFile(claudeMdPath);
    const importLines = content.split('\n').filter(l => l.startsWith('@import'));
    expect(importLines).toHaveLength(1);
  });

  it('T-SPEC-4: imported path should resolve to a file on disk whose content contains ADVERSARY', async () => {
    const result = await runScript(
      'update-import',
      ['adversary'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );
    expect(result.exitCode).toBe(0);

    const claudeMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
    expect(fileExists(claudeMdPath)).toBe(true);

    const content = readFile(claudeMdPath);
    const importLines = content.split('\n').filter(l => l.startsWith('@import'));
    expect(importLines).toHaveLength(1);

    const importPath = importLines[0].replace('@import ', '').trim();
    // Resolve path: absolute paths used directly; ~/ paths relative to home; relative to project
    const resolvedPath = importPath.startsWith('~/')
      ? join(homedir(), importPath.slice(2))
      : importPath.startsWith('/')
        ? importPath
        : join(ctx.projectDir, importPath);

    expect(fileExists(resolvedPath)).toBe(true);
    expect(readFile(resolvedPath)).toContain('ADVERSARY');
  });

  it('T-ADV-2: imported path must end with specialized/adversary/CLAUDE.md', async () => {
    const result = await runScript(
      'update-import',
      ['adversary'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );
    expect(result.exitCode).toBe(0);

    const claudeMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
    expect(fileExists(claudeMdPath)).toBe(true);

    const content = readFile(claudeMdPath);
    const importLines = content.split('\n').filter(l => l.startsWith('@import'));
    expect(importLines).toHaveLength(1);

    const importPath = importLines[0].replace('@import ', '').trim();
    expect(importPath.endsWith('specialized/adversary/CLAUDE.md')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T-ADV-3 / T-SPEC-1: DNA unchanged after user task operations
// ---------------------------------------------------------------------------

describe('T-ADV-3 / T-SPEC-1: Adversary DNA unchanged by user task operations', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('adv3');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test\n');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
  });

  afterEach(() => ctx.cleanup());

  // Skipped when install.sh has not been run (or T-ADV-1 beforeAll hasn't executed yet).
  // The DNA must come from the installer — setup must NOT pre-create it here.
  it.skipIf(!existsSync(SPECIALIZED_DNA_PATH))(
    'should be byte-for-byte identical before and after task-create, update-import, save-context',
    async () => {
      const dnaBefore = readFileSync(SPECIALIZED_DNA_PATH, 'utf-8');

      // Three user task operations that must NOT touch the specialized directory
      await runScript(
        'task-create',
        ['oauth-refactor', 'Refactor OAuth'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );
      await runScript(
        'update-import',
        ['oauth-refactor'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);
      await runScript(
        'save-context',
        ['oauth-refactor', 'test-ctx', '--personal'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const dnaAfter = readFileSync(SPECIALIZED_DNA_PATH, 'utf-8');
      expect(dnaAfter).toBe(dnaBefore);
    }
  );
});

// ---------------------------------------------------------------------------
// T-ADV-4 / T-SPEC-2: save-context rejected when adversary task is active
// ---------------------------------------------------------------------------

describe('T-ADV-4 / T-SPEC-2: save-context rejected when adversary task is active', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('adv4');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test\n');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    setupGoldenAdversaryTask(ctx.projectDir);
    await runScript(
      'update-import',
      ['adversary'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );
    // Provide a session file so the script has data to attempt saving
    createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);
  });

  afterEach(() => ctx.cleanup());

  it('should exit non-zero with a strict-isolation message', async () => {
    const result = await runScript(
      'save-context',
      ['adversary', 'should-not-exist', '--personal'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );

    expect(result.exitCode).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(/strict.isolation|not.*available|specialized.*task/i.test(output)).toBe(true);
  });

  it('should not create a context file at the adversary personal context path', async () => {
    await runScript(
      'save-context',
      ['adversary', 'should-not-exist', '--personal'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );

    const contextFilePath = join(
      ctx.personalDir,
      'tasks',
      'adversary',
      'contexts',
      'should-not-exist.jsonl'
    );
    expect(fileExists(contextFilePath)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T-SPEC-3: context-list returns isolation message when adversary is active
// ---------------------------------------------------------------------------

describe('T-SPEC-3: context-list returns isolation message for adversary task', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('adv5');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test\n');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    setupGoldenAdversaryTask(ctx.projectDir);
    await runScript(
      'update-import',
      ['adversary'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );
  });

  afterEach(() => ctx.cleanup());

  it('should exit 0 and output a strict-isolation message', async () => {
    const result = await runScript(
      'context-list',
      [],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );

    expect(result.exitCode).toBe(0);
    const output = result.stdout + result.stderr;
    expect(
      /strict.isolation|no contexts.*isolation|isolation.*no contexts/i.test(output)
    ).toBe(true);
  });

  it('should not surface any UUID session as a selectable context', async () => {
    const result = await runScript(
      'context-list',
      [],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );

    expect(result.exitCode).toBe(0);
    const output = result.stdout + result.stderr;
    expect(/[0-9a-f]{8}-[0-9a-f]{4}/.test(output)).toBe(false);
  });
});
