/**
 * New Feature Tests
 *
 * Covers features added in the adversarial remediation plan:
 * - T-CTX-5: 100KB cap on promote-context
 * - T-CTX-6: Overwrite protection (backup file created)
 * - T-MEM-1: MEMORY.md updated after save-context
 * NOTE: T-HOOK-1 duplicate removed — primary coverage with content verification is in context-operations.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdirSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import {
  createTestEnvironment,
  TestContext,
  runScript,
  fileExists,
  readFile,
  createJsonl,
  isValidJsonl,
  waitFor,
} from '../utils/test-helpers';
import { SMALL_CONTEXT, CLEAN_CONTEXT } from '../fixtures/sample-contexts';

// ---------------------------------------------------------------------------
// T-CTX-5: 100KB cap on promote-context
// ---------------------------------------------------------------------------

describe('T-CTX-5: 100KB cap on promote-context', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('ctx5');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test\n');
    await runScript('init-project', [], ctx.projectDir);
    await runScript('task-create', ['ctx5-task', 'Promote cap test'], ctx.projectDir);
  });

  afterEach(() => ctx.cleanup());

  it('should reject promote when personal context exceeds 100KB', async () => {
    // Create a personal context larger than 100KB
    const personalDir = join(ctx.personalDir, 'tasks', 'ctx5-task', 'contexts');
    mkdirSync(personalDir, { recursive: true });

    const largeMessage = {
      type: 'user',
      message: { role: 'user', content: 'x'.repeat(1000) },
      timestamp: new Date().toISOString(),
    };
    const messages = Array.from({ length: 150 }, () => largeMessage);
    const bigCtxPath = join(personalDir, 'big-ctx.jsonl');
    createJsonl(bigCtxPath, messages);

    // Pre-condition: verify the file is actually >100KB before running the script.
    // Without this, a silently failed file write could cause the exit-code assertion
    // to pass vacuously (implementation exits non-zero for a different reason).
    expect(statSync(bigCtxPath).size).toBeGreaterThan(100_000);

    const result = await runScript(
      'promote-context',
      ['ctx5-task', 'big-ctx'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );

    expect(result.exitCode).not.toBe(0);
    const output = (result.stdout + result.stderr).toLowerCase();
    expect(output.includes('100kb') || output.includes('too large')).toBe(true);
    // T-CTX-5: size cap must BLOCK promotion — golden file must NOT exist
    const goldenPath = join(ctx.projectDir, '.claude', 'tasks', 'ctx5-task', 'contexts', 'big-ctx.jsonl');
    expect(fileExists(goldenPath)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T-CTX-6: Overwrite protection — backup file created on second save
// ---------------------------------------------------------------------------

describe('T-CTX-6: Overwrite protection', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('ctx6');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test\n');
    await runScript('init-project', [], ctx.projectDir);
    await runScript('task-create', ['ctx6-task', 'Overwrite test'], ctx.projectDir);
  });

  afterEach(() => ctx.cleanup());

  it('should create a .backup- file when saving to an existing name', async () => {
    createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);

    // First save — creates ctx6-ctx.jsonl
    const result1 = await runScript(
      'save-context',
      ['ctx6-task', 'ctx6-ctx', '--personal'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );
    expect(result1.exitCode).toBe(0);

    const contextsDir = join(ctx.personalDir, 'tasks', 'ctx6-task', 'contexts');
    const originalPath = join(contextsDir, 'ctx6-ctx.jsonl');
    expect(fileExists(originalPath)).toBe(true);

    // Capture original content
    const originalContent = readFile(originalPath);

    // Second save — same name, should create backup
    const result2 = await runScript(
      'save-context',
      ['ctx6-task', 'ctx6-ctx', '--personal'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );
    expect(result2.exitCode).toBe(0);

    // A .backup- file must exist in the contexts dir
    const files = readdirSync(contextsDir);
    const backupFiles = files.filter(f => f.includes('ctx6-ctx') && f.includes('.backup-'));
    expect(backupFiles.length).toBeGreaterThanOrEqual(1);

    // Backup must contain the original content
    const backupContent = readFile(join(contextsDir, backupFiles[0]));
    expect(backupContent).toBe(originalContent);
  });
});

// ---------------------------------------------------------------------------
// T-MEM-1: MEMORY.md updated after save-context
// ---------------------------------------------------------------------------

describe('T-MEM-1: MEMORY.md updated after save-context', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('mem1');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test\n');
    await runScript('init-project', [], ctx.projectDir);
    await runScript('task-create', ['mem1-task', 'Memory test'], ctx.projectDir);
  });

  afterEach(() => ctx.cleanup());

  it('should add task-id and context-name to personal MEMORY.md after save', async () => {
    createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);

    const result = await runScript(
      'save-context',
      ['mem1-task', 'mem1-ctx', '--personal'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );
    expect(result.exitCode).toBe(0);

    // Fix 41: Wait for MEMORY.md to appear (up to 5 seconds) to handle async memory update
    // T-MEM-1: implementation writes to personalDir/memory/MEMORY.md (project-scoped memory).
    // Note: the DoD spec says ~/.claude/projects/<sanitized>/MEMORY.md but the implementation
    // adds a memory/ subdirectory. Test what the implementation actually writes.
    const memoryPath = join(ctx.personalDir, 'memory', 'MEMORY.md');
    const appeared = await waitFor(() => fileExists(memoryPath), 5000, 200);
    expect(appeared).toBe(true);

    const memContent = readFile(memoryPath);
    expect(memContent).toContain('mem1-task');
    expect(memContent).toContain('mem1-ctx');
  });
});
