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
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('Test 2.1: Create New Task with Valid Name', () => {
    it('should create task directory structure', async () => {
      const result = await runScript('task-create', ['oauth-refactor', 'Refactoring OAuth in src/auth/'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      // FIX 1: Assert exit code is 0
      expect(result.exitCode).toBe(0);

      // Verify task directories created
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'oauth-refactor'))).toBe(true);
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'oauth-refactor', 'CLAUDE.md'))).toBe(true);
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'oauth-refactor', 'contexts'))).toBe(true);
    });

    // T-TASK-1: Verify all required sections AND that the description word appears
    it('should create task CLAUDE.md with description', async () => {
      const result = await runScript('task-create', ['oauth-refactor', 'Refactoring OAuth implementation in src/auth/'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
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
      const result = await runScript('task-create', ['oauth-refactor', 'OAuth work'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      // FIX 4: Assert exit code is 0
      expect(result.exitCode).toBe(0);

      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      expect(fileExists(workingMdPath)).toBe(true);
      const content = readFile(workingMdPath);
      // Fix 8: Must specifically point to oauth-refactor task's CLAUDE.md
      expect(content).toMatch(/@import\s+\S+oauth-refactor\S+CLAUDE\.md/);
      const importMatch = content.match(/@import\s+(\S+CLAUDE\.md)/);
      expect(importMatch).not.toBeNull();
      expect(importMatch![1]).toContain('oauth-refactor');
    });

    // Fix 9: Verify task structure is complete after create (DoD focus)
    it('should confirm task structure is complete after create', async () => {
      const result = await runScript('task-create', ['oauth-refactor', 'OAuth work'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // T-TASK-1: task directory and CLAUDE.md must exist with required sections
      expect(result.exitCode).toBe(0);
      const taskMdPath = join(ctx.projectDir, '.claude', 'tasks', 'oauth-refactor', 'CLAUDE.md');
      expect(fileExists(taskMdPath)).toBe(true);
      const content = readFile(taskMdPath);
      expect(content).toMatch(/^# Task:/m);
      expect(content).toMatch(/^## Focus/m);
    });
  });

  describe('Test 2.2: Create Task with Invalid Name', () => {
    it('should reject task name with spaces', async () => {
      const taskId = 'OAuth Refactor';
      const taskDir = join(ctx.projectDir, '.claude', 'tasks', taskId);
      const result = await runScript('task-create', [taskId, 'desc'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // FIX 7: Non-zero exit, specific error message, no files created
      expect(result.exitCode).not.toBe(0);
      const output = (result.stdout + result.stderr).toLowerCase();
      expect(output).toMatch(/invalid.*(name|task)|uppercase|lowercase/i);
      expect(fileExists(taskDir)).toBe(false);
    });

    // T-TASK-2: Strict check — non-zero exit AND no files created
    it('should reject task name with uppercase', async () => {
      const result = await runScript('task-create', ['OAuthRefactor', 'desc'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).not.toBe(0);
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'OAuthRefactor'))).toBe(false);
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'oauthrefactor'))).toBe(false);
    });

    it('should reject task name with special characters', async () => {
      const specialCharDir = join(ctx.projectDir, '.claude', 'tasks', 'oauth@refactor!');
      const result = await runScript('task-create', ['oauth@refactor!', 'desc'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).not.toBe(0);
      // FIX 8: Unconditionally assert no directory created
      expect(fileExists(specialCharDir)).toBe(false);
    });

    // Fix 10: Capture result and add exit code assertion
    it('should not create directory for invalid task', async () => {
      const result = await runScript('task-create', ['OAuth Refactor', 'desc'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // T-TASK-2: must exit non-zero for invalid name
      expect(result.exitCode).not.toBe(0);
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'OAuth Refactor'))).toBe(false);
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'oauth refactor'))).toBe(false);
    });
  });

  describe('Test 2.3: Create Task with Multi-line Description', () => {
    // T-TASK-3: Remove conditional guard; check multiple keywords unconditionally
    it('should capture full multi-line description', async () => {
      const description = `This is a complex refactor involving:\n- OAuth 2.0 migration\n- Session state cleanup\n- Token refresh logic`;

      const result = await runScript('task-create', ['complex-refactor', description], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
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
    // T-TASK-4: task-create with empty description exits non-zero AND creates no task directory
    it('T-TASK-4: should reject empty description', async () => {
      const taskId = 'minimal-task';
      const result = await runScript('task-create', [taskId, ''], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

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
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('Test 3.1: Switch to Task with Personal Contexts Only', () => {
    beforeEach(async () => {
      // Create task with personal context
      await runScript('task-create', ['auth-work', 'Authentication work'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      
      // Create personal context directory and file
      const personalContextDir = join(ctx.personalDir, 'tasks', 'auth-work', 'contexts');
      mkdirSync(personalContextDir, { recursive: true });
      createJsonl(
        join(personalContextDir, 'my-progress.jsonl'),
        createSampleMessages(12, 'auth')
      );
    });

    // Fix 11: Clear non-conditional assertion
    it('should list personal contexts when switching', async () => {
      const result = await runScript('task-list', ['auth-work'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).toBe(0);
      const output = result.stdout;
      expect(output).toContain('my-progress');
      // Personal section must appear; since there are no golden contexts, 'golden' must NOT appear
      const outputLower = output.toLowerCase();
      expect(outputLower.indexOf('personal')).toBeGreaterThanOrEqual(0);
      expect(outputLower.indexOf('golden')).toBeLessThan(0);
    });
  });

  describe('Test 3.2: Switch to Task with Golden Contexts Only', () => {
    beforeEach(async () => {
      // Create task with golden context
      await runScript('task-create', ['oauth-work', 'OAuth work'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      
      // Create golden context
      const goldenDir = join(ctx.projectDir, '.claude', 'tasks', 'oauth-work', 'contexts');
      mkdirSync(goldenDir, { recursive: true });
      createJsonl(
        join(goldenDir, 'oauth-deep-dive.jsonl'),
        createSampleMessages(47, 'oauth')
      );
    });

    // Fix 12: Check presence of golden section and that 'personal' does NOT appear
    it('should list golden contexts when switching', async () => {
      const result = await runScript('task-list', ['oauth-work'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('oauth-deep-dive');
      // Golden section must appear; no personal contexts in this test so 'personal' must NOT appear
      const outputLower = result.stdout.toLowerCase();
      expect(outputLower).toContain('golden');
      expect(outputLower).not.toContain('personal');
    });
  });

  describe('Test 3.3: Switch to Task with Mixed Contexts', () => {
    beforeEach(async () => {
      await runScript('task-create', ['mixed-work', 'Mixed contexts'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      
      // Create personal contexts
      const personalDir = join(ctx.personalDir, 'tasks', 'mixed-work', 'contexts');
      mkdirSync(personalDir, { recursive: true });
      createJsonl(join(personalDir, 'personal-1.jsonl'), createSampleMessages(10));
      createJsonl(join(personalDir, 'personal-2.jsonl'), createSampleMessages(15));
      
      // Create golden context
      const goldenDir = join(ctx.projectDir, '.claude', 'tasks', 'mixed-work', 'contexts');
      createJsonl(join(goldenDir, 'golden-1.jsonl'), createSampleMessages(20));
    });

    // T-SWITCH-3: When both personal and golden contexts exist, personal contexts are listed before golden
    it('T-SWITCH-3: should list both personal and golden contexts', async () => {
      const result = await runScript('task-list', ['mixed-work'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const output = result.stdout;
      const outputLower = output.toLowerCase();
      // All three specific context names must appear (proves both sections have real content)
      expect(output).toContain('personal-1');
      expect(output).toContain('personal-2');
      expect(output).toContain('golden-1');
      // Section labels must also appear
      expect(outputLower).toContain('personal');
      expect(outputLower).toContain('golden');
      // personal-1 must appear before golden-1 in the output (ordering requirement)
      // This uses specific context names rather than section headers to avoid path/metadata false matches
      expect(output.indexOf('personal-1')).toBeLessThan(output.indexOf('golden-1'));
    });

    // T-LIST-1 ordering: verify personal context names precede golden context names
    it('should show personal contexts before golden', async () => {
      const result = await runScript('task-list', ['mixed-work'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).toBe(0);
      const output = result.stdout;
      // Specific names must appear — proves each section contains its contexts
      expect(output).toContain('personal-1');
      expect(output).toContain('golden-1');
      // personal context must appear before golden context in listing
      expect(output.indexOf('personal-1')).toBeGreaterThanOrEqual(0);
      expect(output.indexOf('golden-1')).toBeGreaterThanOrEqual(0);
      expect(output.indexOf('personal-1')).toBeLessThan(output.indexOf('golden-1'));
    });
  });

  describe('Test 3.4: Switch to Task with No Contexts', () => {
    beforeEach(async () => {
      await runScript('task-create', ['empty-task', 'No contexts'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    });

    // T-SWITCH-2: When a task has no contexts, output contains "fresh", "empty", or "no contexts" and exits 0
    it('T-SWITCH-2: should indicate no contexts available and offer fresh start', async () => {
      const result = await runScript('task-list', ['empty-task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/no contexts|fresh/i);
    });

    it('should still allow task switch', async () => {
      // Update import should work even with no contexts
      const result = await runScript('update-import', ['empty-task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Test 3.5: Switch to Default Task', () => {
    beforeEach(async () => {
      // Create a non-default task first
      await runScript('task-create', ['some-task', 'Some work'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    });

    // Fix 14: Check @import specifically resolves to default CLAUDE.md
    it('should switch to default task', async () => {
      const result = await runScript('update-import', ['default'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).toBe(0);
      
      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      expect(fileExists(workingMdPath)).toBe(true);
      const content = readFile(workingMdPath);
      expect(content).toMatch(/@import\s+\S+default\S+CLAUDE\.md/);
    });

    // Fix 15: Narrow to specific pattern to avoid trivial matches
    it('should indicate vanilla mode restored', async () => {
      const result = await runScript('update-import', ['default'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const output = result.stdout.toLowerCase();
      // T-CLMD-1: output must indicate the default/vanilla state was restored
      // Use a specific enough pattern to avoid trivial matches
      expect(output).toMatch(/vanilla|restored/);
    });
  });

  describe('Test 3.6: Multiple Task Switches', () => {
    beforeEach(async () => {
      await runScript('task-create', ['task-a', 'Task A'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      await runScript('task-create', ['task-b', 'Task B'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      await runScript('task-create', ['task-c', 'Task C'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    });

    it('should update .claude/CLAUDE.md on each switch', async () => {
      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');

      // FIX T2: Remove all if-guards; unconditionally assert file exists then assert contents
      const r1 = await runScript('update-import', ['task-a'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(r1.exitCode).toBe(0);
      expect(fileExists(workingMdPath)).toBe(true);
      expect(fileContains(workingMdPath, 'task-a')).toBe(true);

      const r2 = await runScript('update-import', ['task-b'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(r2.exitCode).toBe(0);
      expect(fileExists(workingMdPath)).toBe(true);
      expect(fileContains(workingMdPath, 'task-b')).toBe(true);
      expect(fileContains(workingMdPath, 'task-a')).toBe(false);

      const r3 = await runScript('update-import', ['task-c'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(r3.exitCode).toBe(0);
      expect(fileExists(workingMdPath)).toBe(true);
      expect(fileContains(workingMdPath, 'task-c')).toBe(true);

      // Switch back to task-a
      const r4 = await runScript('update-import', ['task-a'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(r4.exitCode).toBe(0);
      expect(fileExists(workingMdPath)).toBe(true);
      expect(fileContains(workingMdPath, 'task-a')).toBe(true);
    });
  });
});

// ==========================================================================
// T-SWITCH-1: Additional strict test — exactly one @import after each switch
// ==========================================================================

describe('T-SWITCH-1: Exactly one @import after each task switch', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('switch1');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    await runScript('task-create', ['sw1-task-a', 'Task A'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    await runScript('task-create', ['sw1-task-b', 'Task B'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    await runScript('task-create', ['sw1-task-c', 'Task C'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
  });

  afterEach(() => {
    ctx.cleanup();
  });

  it('T-SWITCH-1: .claude/CLAUDE.md must contain exactly one @import pointing to the selected task after each switch', async () => {
    const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');

    function assertSingleImport(taskId: string): void {
      const content = readFile(workingMdPath);
      const importLines = content.split('\n').filter((l: string) => l.trim().startsWith('@import'));
      expect(importLines.length).toBe(1);
      expect(importLines[0]).toContain(taskId);
    }

    const r1 = await runScript('update-import', ['sw1-task-a'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    expect(r1.exitCode).toBe(0);
    assertSingleImport('sw1-task-a');

    const r2 = await runScript('update-import', ['sw1-task-b'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    expect(r2.exitCode).toBe(0);
    assertSingleImport('sw1-task-b');

    const r3 = await runScript('update-import', ['sw1-task-c'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    expect(r3.exitCode).toBe(0);
    assertSingleImport('sw1-task-c');

    // Switch back — still exactly one @import
    const r4 = await runScript('update-import', ['sw1-task-a'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    expect(r4.exitCode).toBe(0);
    assertSingleImport('sw1-task-a');
  });
});
