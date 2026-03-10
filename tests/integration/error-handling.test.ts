/**
 * Error Handling Tests (Test Group 13)
 * 
 * Tests for error handling and edge cases as specified in PRD v13.0:
 * - Graceful degradation when directories don't exist
 * - Clear error messages for user mistakes
 * - No data loss on errors
 * - Input validation before destructive operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdirSync, writeFileSync, rmSync, chmodSync, existsSync } from 'fs';
import {
  createTestEnvironment,
  TestContext,
  runScript,
  fileExists,
  readFile,
  createJsonl,
} from '../utils/test-helpers';
import { SMALL_CONTEXT } from '../fixtures/sample-contexts';

describe('Error Handling Tests (Group 13)', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestEnvironment('error');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('Test 13.1: Run /task Without Initialization', () => {
    it('should handle missing .claude directory gracefully', async () => {
      // Don't run init-project
      const result = await runScript('task-create', ['some-task', 'desc'], ctx.projectDir);

      expect(result.exitCode).not.toBe(0);
      const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
      // Must suggest initialization — 'init' is specific enough
      expect(output).toMatch(/init|not initialized/i);
      // Must NOT be a raw Node.js stack trace
      expect(result.stderr).not.toContain('at Object.<anonymous>');
      expect(result.stderr).not.toMatch(/at\s+\w+\s+\(/);
    });

    it('should suggest running init', async () => {
      const result = await runScript('update-import', ['some-task'], ctx.projectDir);

      const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
      expect(result.exitCode).not.toBe(0);
      expect(output).toMatch(/init/i);
    });
  });

  describe('Test 13.2: Delete .claude/ Mid-Operation', () => {
    beforeEach(async () => {
      await runScript('init-project', [], ctx.projectDir);
    });

    it('should handle missing .claude directory on task operations', async () => {
      // Create task first
      await runScript('task-create', ['task-1', 'Task'], ctx.projectDir);
      
      // Delete .claude directory
      rmSync(join(ctx.projectDir, '.claude'), { recursive: true, force: true });

      // Try to use commands
      const result = await runScript('task-list', ['task-1'], ctx.projectDir);

      // Should handle gracefully
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout.toLowerCase() + result.stderr.toLowerCase()).toMatch(/not.*initialized|run init/i);
    });
  });

  describe('Test 13.3: Corrupt JSONL Context File', () => {
    beforeEach(async () => {
      await runScript('init-project', [], ctx.projectDir);
      await runScript('task-create', ['task-1', 'Task'], ctx.projectDir);
    });

    // Fix 37: Strengthen stack trace check and add error message assertion
    it('should detect corrupt JSONL', async () => {
      const contextDir = join(ctx.personalDir, 'tasks', 'task-1', 'contexts');
      mkdirSync(contextDir, { recursive: true });
      const badPath = join(contextDir, 'corrupt.jsonl');
      writeFileSync(badPath, 'not valid json\n{"also": broken');

      const result = await runScript('scan-secrets', [badPath], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).not.toContain('at Object.<anonymous>');
      // Must not contain any Node.js stack trace patterns
      expect(result.stderr).not.toMatch(/at\s+\w+[\s.]+\(/);
      // Must produce some error output indicating the file is corrupt
      const output = (result.stdout + result.stderr).toLowerCase();
      expect(output).toMatch(/invalid|corrupt|malformed|parse.*error|json/i);
    });

    // Fix 38: Strengthen stack trace check
    it('should not crash on invalid JSON in context', async () => {
      const contextDir = join(ctx.personalDir, 'tasks', 'task-1', 'contexts');
      mkdirSync(contextDir, { recursive: true });
      const badPath = join(contextDir, 'bad.jsonl');
      writeFileSync(badPath, '{"incomplete":');

      const result = await runScript('scan-secrets', [badPath], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // Must exit non-zero for corrupt input
      expect(result.exitCode).not.toBe(0);
      // Must not produce an unhandled exception stack trace
      expect(result.stderr).not.toContain('at Object.<anonymous>');
      // Stronger stack trace check
      expect(result.stderr).not.toMatch(/at\s+\w+[\s.]+\(/);
    });
  });

  describe('Test 13.5: Invalid JSON in Metadata', () => {
    beforeEach(async () => {
      await runScript('init-project', [], ctx.projectDir);
      await runScript('task-create', ['task-1', 'Task'], ctx.projectDir);
    });

    it('should handle invalid metadata gracefully', async () => {
      // Create valid context with invalid metadata
      const contextDir = join(ctx.personalDir, 'tasks', 'task-1', 'contexts');
      mkdirSync(contextDir, { recursive: true });
      createJsonl(join(contextDir, 'ctx-1.jsonl'), SMALL_CONTEXT);
      writeFileSync(join(contextDir, 'ctx-1.meta.json'), 'not json');

      const result = await runScript('context-list', ['task-1'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // context-list skips non-jsonl files; invalid .meta.json is silently ignored
      expect(result.exitCode).toBe(0);
      // Should NOT crash with unhandled stack trace regardless of exit code
      expect(result.stderr).not.toMatch(/at\s+\w+\s+\(/);
    });
  });

  describe('Test 13.6: Permission Denied Errors', () => {
    beforeEach(async () => {
      await runScript('init-project', [], ctx.projectDir);
    });

    it('should handle permission errors gracefully', async () => {
      const tasksDir = join(ctx.projectDir, '.claude', 'tasks');
      
      // Make directory read-only (skip on Windows or if not possible)
      try {
        chmodSync(tasksDir, 0o444);
      } catch {
        // Skip test if chmod fails
        return;
      }

      try {
        const result = await runScript('task-create', ['new-task', 'desc'], ctx.projectDir);

        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(result.exitCode).not.toBe(0);
        expect(output).toMatch(/permission|access|denied/i);
      } finally {
        // Restore permissions
        try {
          chmodSync(tasksDir, 0o755);
        } catch {
          // Ignore
        }
      }
    });
  });

  describe('Test: Input Validation', () => {
    beforeEach(async () => {
      await runScript('init-project', [], ctx.projectDir);
    });

    it('should validate task ID format', async () => {
      const invalidIds = [
        'Task With Spaces',
        'UPPERCASE',
        'special@chars!',
        'emoji😀task',
        '',
        '   ',
      ];

      for (const id of invalidIds) {
        const result = await runScript('task-create', [id, 'desc'], ctx.projectDir);
        
        // Should reject invalid IDs
        expect(result.exitCode).not.toBe(0);
        expect(result.stdout.toLowerCase() + result.stderr.toLowerCase()).toMatch(/invalid.*(name|task|id)|uppercase|lowercase/i);
      }
    });

    it('should validate context name format', async () => {
      await runScript('task-create', ['valid-task', 'desc'], ctx.projectDir);

      const invalidNames = [
        'Context With Spaces',
        'special@chars!',
        '',
      ];

      for (const name of invalidNames) {
        const result = await runScript(
          'save-context',
          ['valid-task', name, 'personal'],
          ctx.projectDir
        );
        
        expect(result.exitCode).not.toBe(0);
        expect(result.stdout.toLowerCase() + result.stderr.toLowerCase()).toMatch(/invalid.*(name|task|id)|uppercase|lowercase/i);
      }
    });
  });

  describe('Test: Graceful Degradation', () => {
    it('should provide helpful error for non-existent task', async () => {
      await runScript('init-project', [], ctx.projectDir);

      const result = await runScript('context-list', ['nonexistent-task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
      expect(result.exitCode).not.toBe(0);
      expect(output).toMatch(/not found|does not exist/i);
    });

    it('should provide helpful error for non-existent context', async () => {
      await runScript('init-project', [], ctx.projectDir);
      await runScript('task-create', ['task-1', 'Task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const result = await runScript('promote-context', ['task-1', 'nonexistent'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
      expect(result.exitCode).not.toBe(0);
      expect(output).toMatch(/not found|does not exist/i);
    });
  });
});

describe('Cross-Platform Compatibility Tests (Group 12)', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestEnvironment('platform');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('Test 12.4: Project Path with Spaces', () => {
    // Fix 39: Expand to cover all operations (task-create and update-import too)
    it('should handle paths with spaces', async () => {
      const spacePath = join(ctx.projectDir, 'my project');
      mkdirSync(spacePath, { recursive: true });
      writeFileSync(join(spacePath, 'CLAUDE.md'), '# Project with spaces\n');

      // init-project must work with spaces in path
      const initResult = await runScript('init-project', [], spacePath, { CLAUDE_HOME: ctx.personalBase });
      expect(initResult.exitCode).toBe(0);
      expect(fileExists(join(spacePath, '.claude', 'CLAUDE.md'))).toBe(true);

      // task-create must also work with spaces in path
      const taskResult = await runScript('task-create', ['space-task', 'Task in spaced dir'], spacePath, { CLAUDE_HOME: ctx.personalBase });
      expect(taskResult.exitCode).toBe(0);
      expect(fileExists(join(spacePath, '.claude', 'tasks', 'space-task', 'CLAUDE.md'))).toBe(true);

      // update-import must work with spaces in path
      const switchResult = await runScript('update-import', ['space-task'], spacePath, { CLAUDE_HOME: ctx.personalBase });
      expect(switchResult.exitCode).toBe(0);
      expect(fileExists(join(spacePath, '.claude', 'CLAUDE.md'))).toBe(true);
    });
  });

  describe('Test 12.6: Context File Format Consistency', () => {
    beforeEach(async () => {
      await runScript('init-project', [], ctx.projectDir);
      await runScript('task-create', ['task-1', 'Task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    });

    it('should create JSONL with consistent line endings', async () => {
      // Create session in personal storage (where save-context looks for it)
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);

      await runScript('save-context', ['task-1', 'test-ctx', 'personal'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // Check personal context directory for files
      const personalDir = join(ctx.personalDir, 'tasks', 'task-1', 'contexts');
      expect(existsSync(personalDir)).toBe(true);
      const files = require('fs').readdirSync(personalDir);
      for (const file of files) {
        if (file.endsWith('.jsonl')) {
          const fileContent = readFile(join(personalDir, file));
          // Should not have CRLF (Windows line endings)
          expect(fileContent).not.toContain('\r\n');
        }
      }
    });
  });

  describe('Test 12.7: Consistent Line Endings in Generated Files', () => {
    it('should use LF line endings in generated files', async () => {
      await runScript('init-project', [], ctx.projectDir);
      await runScript('task-create', ['task-1', '--golden', 'Task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const filesToCheck = [
        '.claude/.gitignore',
        '.claude/tasks/task-1/CLAUDE.md',
      ];

      for (const file of filesToCheck) {
        const filePath = join(ctx.projectDir, file);
        expect(fileExists(filePath)).toBe(true);
        const fileContent = readFile(filePath);
        // Should not contain CRLF
        expect(fileContent).not.toMatch(/\r\n/);
      }
    });
  });
});
