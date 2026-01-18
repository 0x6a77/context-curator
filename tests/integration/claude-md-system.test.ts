/**
 * Two-File CLAUDE.md System Tests (Test Group 8)
 * 
 * Tests for the two-file CLAUDE.md system as specified in PRD v13.0:
 * - Root CLAUDE.md never modified by context-curator
 * - .claude/CLAUDE.md auto-generated with @import directives
 * - .claude/CLAUDE.md git-ignored
 * - Import path updates on task switch
 * - Multiple developers with independent .claude/CLAUDE.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdirSync, writeFileSync, readFileSync } from 'fs';
import {
  createTestEnvironment,
  TestContext,
  runScript,
  fileExists,
  fileContains,
  readFile,
  initGit,
  isGitIgnored,
  getGitStatus,
  gitAdd,
  gitCommit,
} from '../utils/test-helpers';

describe('Two-File CLAUDE.md System Tests (Group 8)', () => {
  let ctx: TestContext;
  const originalContent = '# Original Project Instructions\n\nImportant guidelines here.\n';

  beforeEach(async () => {
    ctx = createTestEnvironment('claudemd');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), originalContent);
    initGit(ctx.projectDir);
    gitAdd(ctx.projectDir, 'CLAUDE.md');
    gitCommit(ctx.projectDir, 'Initial commit');
    await runScript('init-project', [], ctx.projectDir);
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('Test 8.1: Root CLAUDE.md Never Modified', () => {
    it('should not modify root CLAUDE.md during init', async () => {
      const rootContent = readFile(join(ctx.projectDir, 'CLAUDE.md'));
      expect(rootContent).toBe(originalContent);
    });

    it('should not modify root CLAUDE.md during task creation', async () => {
      await runScript('task-create', ['task-1', 'First task'], ctx.projectDir);
      await runScript('task-create', ['task-2', 'Second task'], ctx.projectDir);

      const rootContent = readFile(join(ctx.projectDir, 'CLAUDE.md'));
      expect(rootContent).toBe(originalContent);
    });

    it('should not modify root CLAUDE.md during task switching', async () => {
      await runScript('task-create', ['task-1', 'First task'], ctx.projectDir);
      await runScript('task-create', ['task-2', 'Second task'], ctx.projectDir);
      
      await runScript('update-import', ['task-1'], ctx.projectDir);
      await runScript('update-import', ['task-2'], ctx.projectDir);
      await runScript('update-import', ['default'], ctx.projectDir);

      const rootContent = readFile(join(ctx.projectDir, 'CLAUDE.md'));
      expect(rootContent).toBe(originalContent);
    });

    it('should show no git changes to root CLAUDE.md', async () => {
      await runScript('task-create', ['task-1', 'First task'], ctx.projectDir);
      await runScript('update-import', ['task-1'], ctx.projectDir);

      const gitStatus = getGitStatus(ctx.projectDir);
      // Root CLAUDE.md should not appear in git status
      expect(gitStatus.includes('CLAUDE.md') && !gitStatus.includes('.claude/CLAUDE.md'))
        .toBe(false);
    });
  });

  describe('Test 8.2: .claude/CLAUDE.md Auto-generated', () => {
    it('should create .claude/CLAUDE.md on init', async () => {
      expect(fileExists(join(ctx.projectDir, '.claude', 'CLAUDE.md'))).toBe(true);
    });

    it('should contain @import directive', async () => {
      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      const content = readFile(workingMdPath);
      expect(content).toContain('@import');
    });

    it('should update on task switch', async () => {
      await runScript('task-create', ['task-1', 'Task 1'], ctx.projectDir);
      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');

      await runScript('update-import', ['task-1'], ctx.projectDir);
      expect(fileContains(workingMdPath, 'task-1')).toBe(true);
    });
  });

  describe('Test 8.3: .claude/CLAUDE.md Git Ignored', () => {
    it('should have .gitignore with CLAUDE.md entry', async () => {
      const gitignorePath = join(ctx.projectDir, '.claude', '.gitignore');
      expect(fileExists(gitignorePath)).toBe(true);
      expect(fileContains(gitignorePath, 'CLAUDE.md')).toBe(true);
    });

    it('should be ignored by git', async () => {
      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      if (fileExists(workingMdPath)) {
        expect(isGitIgnored(ctx.projectDir, '.claude/CLAUDE.md')).toBe(true);
      }
    });

    it('should not appear in git status', async () => {
      await runScript('task-create', ['task-1', 'Task 1'], ctx.projectDir);
      await runScript('update-import', ['task-1'], ctx.projectDir);

      // Stage other changes
      gitAdd(ctx.projectDir, '.claude/');

      const gitStatus = getGitStatus(ctx.projectDir);
      // .claude/CLAUDE.md should not be staged
      expect(gitStatus.includes('.claude/CLAUDE.md')).toBe(false);
    });
  });

  describe('Test 8.4: Import Path Updates on Task Switch', () => {
    beforeEach(async () => {
      await runScript('task-create', ['auth', 'Auth task'], ctx.projectDir);
      await runScript('task-create', ['payment', 'Payment task'], ctx.projectDir);
    });

    it('should update import to auth task', async () => {
      await runScript('update-import', ['auth'], ctx.projectDir);

      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      const content = readFile(workingMdPath);
      expect(content).toContain('auth');
      expect(content).not.toContain('payment');
    });

    it('should update import to payment task', async () => {
      await runScript('update-import', ['payment'], ctx.projectDir);

      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      const content = readFile(workingMdPath);
      expect(content).toContain('payment');
      expect(content).not.toContain('auth');
    });

    it('should update import to default task', async () => {
      await runScript('update-import', ['auth'], ctx.projectDir);
      await runScript('update-import', ['default'], ctx.projectDir);

      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      const content = readFile(workingMdPath);
      expect(content).toContain('default');
    });
  });

  describe('Test 8.5: /resume Loads Task Instructions', () => {
    it('should create task CLAUDE.md with custom instructions', async () => {
      await runScript('task-create', ['oauth-work', 'Focus on src/auth/ directory'], ctx.projectDir);

      const taskMdPath = join(ctx.projectDir, '.claude', 'tasks', 'oauth-work', 'CLAUDE.md');
      expect(fileExists(taskMdPath)).toBe(true);

      const content = readFile(taskMdPath);
      expect(content.length).toBeGreaterThan(0);
    });

    it('should reference task in .claude/CLAUDE.md', async () => {
      await runScript('task-create', ['oauth-work', 'OAuth focus'], ctx.projectDir);
      await runScript('update-import', ['oauth-work'], ctx.projectDir);

      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      const content = readFile(workingMdPath);
      expect(content).toContain('oauth-work');
    });
  });

  describe('Test 8.6: Multiple Developers Different .claude/CLAUDE.md', () => {
    it('should allow different task states', async () => {
      // Create a second project context simulating another developer
      const ctx2 = createTestEnvironment('claudemd2');

      try {
        // Setup second "developer's" workspace
        writeFileSync(join(ctx2.projectDir, 'CLAUDE.md'), originalContent);
        await runScript('init-project', [], ctx2.projectDir);
        
        // Dev 1 creates and switches to auth task
        await runScript('task-create', ['auth-work', 'Auth'], ctx.projectDir);
        await runScript('update-import', ['auth-work'], ctx.projectDir);

        // Dev 2 creates and switches to payment task
        await runScript('task-create', ['payment-work', 'Payment'], ctx2.projectDir);
        await runScript('update-import', ['payment-work'], ctx2.projectDir);

        // Verify different .claude/CLAUDE.md content
        const dev1Working = readFile(join(ctx.projectDir, '.claude', 'CLAUDE.md'));
        const dev2Working = readFile(join(ctx2.projectDir, '.claude', 'CLAUDE.md'));

        expect(dev1Working).toContain('auth-work');
        expect(dev2Working).toContain('payment-work');
        expect(dev1Working).not.toBe(dev2Working);

        // Verify root CLAUDE.md identical in both
        const dev1Root = readFile(join(ctx.projectDir, 'CLAUDE.md'));
        const dev2Root = readFile(join(ctx2.projectDir, 'CLAUDE.md'));
        expect(dev1Root).toBe(dev2Root);
      } finally {
        ctx2.cleanup();
      }
    });
  });
});
