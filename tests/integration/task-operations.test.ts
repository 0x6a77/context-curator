/**
 * Task Creation and Switching Tests (Test Groups 2-3)
 * 
 * Tests for task creation and switching behavior as specified in PRD v13.0:
 * - Task creation with valid/invalid names
 * - Task directory structure creation
 * - Task CLAUDE.md generation
 * - Task switching between tasks
 * - Context listing on task switch
 * - Default task behavior
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import {
  createTestEnvironment,
  TestContext,
  runScript,
  fileExists,
  fileContains,
  readFile,
  writeFile,
  createJsonl,
  createSampleMessages,
  sanitizePath,
} from '../utils/test-helpers';

describe('Task Creation Tests (Group 2)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('task');
    // Initialize project first
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    await runScript('init-project', [], ctx.projectDir);
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('Test 2.1: Create New Task with Valid Name', () => {
    it('should create task directory structure', async () => {
      const result = await runScript('task-create', ['oauth-refactor', 'Refactoring OAuth in src/auth/'], ctx.projectDir);
      // FIX 1: Assert exit code is 0
      expect(result.exitCode).toBe(0);

      // Verify task directories created
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'oauth-refactor'))).toBe(true);
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'oauth-refactor', 'CLAUDE.md'))).toBe(true);
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'oauth-refactor', 'contexts'))).toBe(true);
    });

    // T-TASK-1: Verify all required sections AND that the description word appears
    it('should create task CLAUDE.md with description', async () => {
      const result = await runScript('task-create', ['oauth-refactor', 'Refactoring OAuth implementation in src/auth/'], ctx.projectDir);
      // FIX 2: Assert exit code is 0
      expect(result.exitCode).toBe(0);

      const taskMdPath = join(ctx.projectDir, '.claude', 'tasks', 'oauth-refactor', 'CLAUDE.md');
      expect(fileExists(taskMdPath)).toBe(true);
      
      const taskContent = readFile(taskMdPath);
      expect(taskContent).toMatch(/^# Task:/m);
      expect(taskContent).toMatch(/^## Focus/m);
      expect(taskContent).toMatch(/^## Key Areas/m);
      expect(taskContent).toMatch(/^## Guidelines/m);

      // FIX 3: Verify description appears specifically under ## Focus section
      const focusIdx = taskContent.indexOf('## Focus');
      const nextSectionIdx = taskContent.indexOf('##', focusIdx + 1);
      const focusSection = taskContent.slice(focusIdx, nextSectionIdx === -1 ? undefined : nextSectionIdx);
      expect(focusSection.toLowerCase()).toContain('oauth');
    });

    // T-TASK-1: Remove conditional guard; unconditionally assert @import format
    it('should update .claude/CLAUDE.md with import directive', async () => {
      const result = await runScript('task-create', ['oauth-refactor', 'OAuth work'], ctx.projectDir);
      // FIX 4: Assert exit code is 0
      expect(result.exitCode).toBe(0);

      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      expect(fileExists(workingMdPath)).toBe(true);
      const content = readFile(workingMdPath);
      // FIX 5: Stricter @import regex check
      expect(content).toMatch(/@import\s+\S+CLAUDE\.md/);
      const importMatch = content.match(/@import\s+(\S+CLAUDE\.md)/);
      expect(importMatch).not.toBeNull();
    });

    it('should provide resume instruction in output', async () => {
      const result = await runScript('task-create', ['oauth-refactor', 'OAuth work'], ctx.projectDir);

      // FIX 6: Check for resume keyword rather than circular task-id check
      expect(result.stdout).toMatch(/resume/i);
    });
  });

  describe('Test 2.2: Create Task with Invalid Name', () => {
    it('should reject task name with spaces', async () => {
      const taskId = 'OAuth Refactor';
      const taskDir = join(ctx.projectDir, '.claude', 'tasks', taskId);
      const result = await runScript('task-create', [taskId, 'desc'], ctx.projectDir);

      // FIX 7: Non-zero exit, specific error message, no files created
      expect(result.exitCode).not.toBe(0);
      const output = (result.stdout + result.stderr).toLowerCase();
      expect(output).toMatch(/invalid.*(name|task)|uppercase|lowercase/i);
      expect(fileExists(taskDir)).toBe(false);
    });

    // T-TASK-2: Strict check — non-zero exit AND no files created
    it('should reject task name with uppercase', async () => {
      const result = await runScript('task-create', ['OAuthRefactor', 'desc'], ctx.projectDir);

      expect(result.exitCode).not.toBe(0);
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'OAuthRefactor'))).toBe(false);
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'oauthrefactor'))).toBe(false);
    });

    it('should reject task name with special characters', async () => {
      const specialCharDir = join(ctx.projectDir, '.claude', 'tasks', 'oauth@refactor!');
      const result = await runScript('task-create', ['oauth@refactor!', 'desc'], ctx.projectDir);

      expect(result.exitCode).not.toBe(0);
      // FIX 8: Unconditionally assert no directory created
      expect(fileExists(specialCharDir)).toBe(false);
    });

    it('should not create directory for invalid task', async () => {
      await runScript('task-create', ['OAuth Refactor', 'desc'], ctx.projectDir);

      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'OAuth Refactor'))).toBe(false);
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'oauth refactor'))).toBe(false);
    });
  });

  describe('Test 2.3: Create Task with Multi-line Description', () => {
    // T-TASK-3: Remove conditional guard; check multiple keywords unconditionally
    it('should capture full multi-line description', async () => {
      const description = `This is a complex refactor involving:\n- OAuth 2.0 migration\n- Session state cleanup\n- Token refresh logic`;

      const result = await runScript('task-create', ['complex-refactor', description], ctx.projectDir);
      // FIX 9: Assert exit code is 0
      expect(result.exitCode).toBe(0);

      const taskMdPath = join(ctx.projectDir, '.claude', 'tasks', 'complex-refactor', 'CLAUDE.md');
      expect(fileExists(taskMdPath)).toBe(true);
      const taskContent = readFile(taskMdPath);

      // FIX 10: Assert keywords appear under ## Focus section specifically
      const focusIdx = taskContent.indexOf('## Focus');
      const nextSectionIdx = taskContent.indexOf('##', focusIdx + 1);
      const focusSection = taskContent.slice(focusIdx, nextSectionIdx === -1 ? undefined : nextSectionIdx);
      expect(focusSection.toLowerCase()).toContain('oauth');
      expect(focusSection.toLowerCase()).toContain('session');
      expect(focusSection.toLowerCase()).toContain('token');
    });
  });

  describe('Test 2.4: Create Task with Empty Description', () => {
    // FIX 11: DoD requires non-zero exit for empty description; remove conditional accept
    it('should reject empty description', async () => {
      const taskId = 'minimal-task';
      const result = await runScript('task-create', [taskId, ''], ctx.projectDir);

      expect(result.exitCode).not.toBe(0);
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', taskId))).toBe(false);
    });
  });
});

describe('Task Switching Tests (Group 3)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('switch');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    await runScript('init-project', [], ctx.projectDir);
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('Test 3.1: Switch to Task with Personal Contexts Only', () => {
    beforeEach(async () => {
      // Create task with personal context
      await runScript('task-create', ['auth-work', 'Authentication work'], ctx.projectDir);
      
      // Create personal context directory and file
      const personalContextDir = join(ctx.personalDir, 'tasks', 'auth-work', 'contexts');
      mkdirSync(personalContextDir, { recursive: true });
      createJsonl(
        join(personalContextDir, 'my-progress.jsonl'),
        createSampleMessages(12, 'auth')
      );
    });

    // T-LIST-1: Replace OR with specific context name check
    it('should list personal contexts when switching', async () => {
      const result = await runScript('task-list', ['auth-work'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).toBe(0);
      const output = result.stdout;
      expect(output).toContain('my-progress');
      // FIX 12: Ordering assertion — Personal before Golden
      // (golden section won't appear here, but Personal header should appear before any Golden header)
      // Both indexOf checks are safe: if 'golden' doesn't appear, indexOf returns -1
      // which is already less than any real 'personal' index — so we only assert when both present
      const personalIdx = output.toLowerCase().indexOf('personal');
      const goldenIdx = output.toLowerCase().indexOf('golden');
      if (personalIdx >= 0 && goldenIdx >= 0) {
        expect(personalIdx).toBeLessThan(goldenIdx);
      }
    });
  });

  describe('Test 3.2: Switch to Task with Golden Contexts Only', () => {
    beforeEach(async () => {
      // Create task with golden context
      await runScript('task-create', ['oauth-work', 'OAuth work'], ctx.projectDir);
      
      // Create golden context
      const goldenDir = join(ctx.projectDir, '.claude', 'tasks', 'oauth-work', 'contexts');
      mkdirSync(goldenDir, { recursive: true });
      createJsonl(
        join(goldenDir, 'oauth-deep-dive.jsonl'),
        createSampleMessages(47, 'oauth')
      );
    });

    // FIX 13: Remove OR chain; use specific context name
    it('should list golden contexts when switching', async () => {
      const result = await runScript('task-list', ['oauth-work'], ctx.projectDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('oauth-deep-dive');
    });
  });

  describe('Test 3.3: Switch to Task with Mixed Contexts', () => {
    beforeEach(async () => {
      await runScript('task-create', ['mixed-work', 'Mixed contexts'], ctx.projectDir);
      
      // Create personal contexts
      const personalDir = join(ctx.personalDir, 'tasks', 'mixed-work', 'contexts');
      mkdirSync(personalDir, { recursive: true });
      createJsonl(join(personalDir, 'personal-1.jsonl'), createSampleMessages(10));
      createJsonl(join(personalDir, 'personal-2.jsonl'), createSampleMessages(15));
      
      // Create golden context
      const goldenDir = join(ctx.projectDir, '.claude', 'tasks', 'mixed-work', 'contexts');
      createJsonl(join(goldenDir, 'golden-1.jsonl'), createSampleMessages(20));
    });

    // FIX 14: Remove OR chain; use separate assertions
    it('should list both personal and golden contexts', async () => {
      const result = await runScript('task-list', ['mixed-work'], ctx.projectDir);

      const output = result.stdout.toLowerCase();
      // Should show both types
      expect(output).toContain('personal');
      expect(output).toContain('golden');
    });

    // T-LIST-1 ordering: Replace conditional indexOf check with a strict unconditional check
    it('should show personal contexts before golden', async () => {
      const result = await runScript('task-list', ['mixed-work'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).toBe(0);
      const output = result.stdout.toLowerCase();
      const personalIdx = output.indexOf('personal');
      const goldenIdx = output.indexOf('golden');
      expect(personalIdx).toBeGreaterThanOrEqual(0);
      expect(goldenIdx).toBeGreaterThanOrEqual(0);
      expect(personalIdx).toBeLessThan(goldenIdx);
    });
  });

  describe('Test 3.4: Switch to Task with No Contexts', () => {
    beforeEach(async () => {
      await runScript('task-create', ['empty-task', 'No contexts'], ctx.projectDir);
    });

    // FIX 15: Replace OR chain with specific regex match
    it('should indicate no contexts available and offer fresh start', async () => {
      const result = await runScript('task-list', ['empty-task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/no contexts|fresh/i);
    });

    it('should still allow task switch', async () => {
      // Update import should work even with no contexts
      const result = await runScript('update-import', ['empty-task'], ctx.projectDir);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Test 3.5: Switch to Default Task', () => {
    beforeEach(async () => {
      // Create a non-default task first
      await runScript('task-create', ['some-task', 'Some work'], ctx.projectDir);
    });

    // FIX 16: Remove if-guard; unconditionally assert file exists and contains 'default'
    it('should switch to default task', async () => {
      const result = await runScript('update-import', ['default'], ctx.projectDir);

      expect(result.exitCode).toBe(0);
      
      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      expect(fileExists(workingMdPath)).toBe(true);
      const content = readFile(workingMdPath);
      expect(content).toContain('default');
    });

    it('should indicate vanilla mode restored', async () => {
      const result = await runScript('update-import', ['default'], ctx.projectDir);

      const output = result.stdout.toLowerCase();
      expect(
        output.includes('default') ||
        output.includes('vanilla') ||
        output.includes('restored')
      ).toBe(true);
    });
  });

  describe('Test 3.6: Multiple Task Switches', () => {
    beforeEach(async () => {
      await runScript('task-create', ['task-a', 'Task A'], ctx.projectDir);
      await runScript('task-create', ['task-b', 'Task B'], ctx.projectDir);
      await runScript('task-create', ['task-c', 'Task C'], ctx.projectDir);
    });

    it('should update .claude/CLAUDE.md on each switch', async () => {
      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');

      // FIX T2: Remove all if-guards; unconditionally assert file exists then assert contents
      const r1 = await runScript('update-import', ['task-a'], ctx.projectDir);
      expect(r1.exitCode).toBe(0);
      expect(fileExists(workingMdPath)).toBe(true);
      expect(fileContains(workingMdPath, 'task-a')).toBe(true);

      const r2 = await runScript('update-import', ['task-b'], ctx.projectDir);
      expect(r2.exitCode).toBe(0);
      expect(fileExists(workingMdPath)).toBe(true);
      expect(fileContains(workingMdPath, 'task-b')).toBe(true);
      expect(fileContains(workingMdPath, 'task-a')).toBe(false);

      const r3 = await runScript('update-import', ['task-c'], ctx.projectDir);
      expect(r3.exitCode).toBe(0);
      expect(fileExists(workingMdPath)).toBe(true);
      expect(fileContains(workingMdPath, 'task-c')).toBe(true);

      // Switch back to task-a
      const r4 = await runScript('update-import', ['task-a'], ctx.projectDir);
      expect(r4.exitCode).toBe(0);
      expect(fileExists(workingMdPath)).toBe(true);
      expect(fileContains(workingMdPath, 'task-a')).toBe(true);
    });
  });
});
