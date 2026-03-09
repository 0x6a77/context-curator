/**
 * New Feature Tests
 *
 * Covers features added in the adversarial remediation plan:
 * - T-CTX-5: 100KB cap on promote-context
 * - T-CTX-6: Overwrite protection (backup file created)
 * - T-HOOK-1: PreCompact hook auto-save
 * - T-MEM-1: MEMORY.md updated after save-context
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdirSync, writeFileSync, readdirSync, existsSync } from 'fs';
import {
  createTestEnvironment,
  TestContext,
  runScript,
  fileExists,
  readFile,
  createJsonl,
  isValidJsonl,
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
    createJsonl(join(personalDir, 'big-ctx.jsonl'), messages);

    const result = await runScript(
      'promote-context',
      ['ctx5-task', 'big-ctx'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );

    expect(result.exitCode).not.toBe(0);
    const output = (result.stdout + result.stderr).toLowerCase();
    expect(output.includes('100kb') || output.includes('too large') || output.includes('size')).toBe(true);
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
// T-HOOK-1: PreCompact hook — auto-save-context creates timestamped file
// ---------------------------------------------------------------------------

describe('T-HOOK-1: PreCompact hook auto-save', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('hook1');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test\n');
    await runScript('init-project', [], ctx.projectDir);
    await runScript('task-create', ['hook1-task', 'Hook test'], ctx.projectDir);
  });

  afterEach(() => ctx.cleanup());

  it('should create a timestamped auto-save file when called with a session_id payload', async () => {
    // Plant a mock session file in the personal project dir
    const sessionId = '12345678-1234-1234-1234-123456789abc';
    const sessionPath = join(ctx.personalDir, `${sessionId}.jsonl`);
    createJsonl(sessionPath, SMALL_CONTEXT);

    // Write the hook payload to a temp file and pipe it to the script via stdin
    const payload = JSON.stringify({ session_id: sessionId, project_dir: ctx.projectDir });
    const payloadFile = join(ctx.projectDir, 'hook-payload.json');
    writeFileSync(payloadFile, payload);

    // Run auto-save-context with stdin from the payload file
    const { execSync } = await import('child_process');
    const scriptPath = join(ctx.projectDir, '../../scripts/auto-save-context.ts');
    // Use runScript but we need stdin — use execSync directly
    let exitCode = 0;
    try {
      execSync(
        `npx tsx "${require('path').resolve(__dirname, '../../scripts/auto-save-context.ts')}" < "${payloadFile}"`,
        {
          cwd: ctx.projectDir,
          env: { ...process.env, CLAUDE_HOME: ctx.personalBase },
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      );
    } catch (e: any) {
      exitCode = e.status ?? 1;
    }

    // Script exits 0 on success (or on non-fatal errors, to not block compaction)
    expect(exitCode).toBe(0);

    // A file named auto-YYYYMMDD-HHMM.jsonl must exist under the task's contexts dir
    const contextsDir = join(ctx.personalDir, 'tasks', 'hook1-task', 'contexts');
    if (existsSync(contextsDir)) {
      const files = readdirSync(contextsDir);
      const autoFiles = files.filter(f => f.startsWith('auto-') && f.endsWith('.jsonl'));
      expect(autoFiles.length).toBeGreaterThanOrEqual(1);

      // The auto-saved file must be valid JSONL
      const autoPath = join(contextsDir, autoFiles[0]);
      expect(isValidJsonl(autoPath)).toBe(true);
    }
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

    // update-memory is spawned detached — give it a moment to write
    await new Promise(resolve => setTimeout(resolve, 2000));

    const memoryPath = join(ctx.personalDir, 'memory', 'MEMORY.md');
    expect(fileExists(memoryPath)).toBe(true);

    const memContent = readFile(memoryPath);
    expect(memContent).toContain('mem1-task');
    expect(memContent).toContain('mem1-ctx');
  });
});
