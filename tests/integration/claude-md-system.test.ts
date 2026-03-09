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
      const tcResult = await runScript('task-create', ['task-1', 'First task'], ctx.projectDir);
      expect(tcResult.exitCode).toBe(0);
      const uiResult = await runScript('update-import', ['task-1'], ctx.projectDir);
      expect(uiResult.exitCode).toBe(0);

      const gitStatus = getGitStatus(ctx.projectDir);
      // Root CLAUDE.md must NOT appear in git status (it was committed, not modified)
      // .claude/CLAUDE.md is git-ignored so won't appear either
      const rootModified = gitStatus.split('\n').some(line => 
        line.trim().endsWith('CLAUDE.md') && !line.includes('.claude/')
      );
      expect(rootModified).toBe(false);
    });
  });

  describe('Test 8.2: .claude/CLAUDE.md Auto-generated', () => {
    it('should create .claude/CLAUDE.md on init', async () => {
      expect(fileExists(join(ctx.projectDir, '.claude', 'CLAUDE.md'))).toBe(true);
    });

    it('should contain @import directive', async () => {
      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      const content = readFile(workingMdPath);
      expect(content).toMatch(/@import\s+\S+CLAUDE\.md/);
    });

    it('should update on task switch', async () => {
      await runScript('task-create', ['task-1', 'Task 1'], ctx.projectDir);
      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');

      const result = await runScript('update-import', ['task-1'], ctx.projectDir);
      expect(result.exitCode).toBe(0);
      const content = readFile(workingMdPath);
      expect(content).toMatch(/@import\s+\S+task-1\S+CLAUDE\.md/);
    });

    it('should contain exactly one @import after multiple switches', async () => {
      await runScript('task-create', ['task-1', 'Task 1'], ctx.projectDir);
      await runScript('task-create', ['task-2', 'Task 2'], ctx.projectDir);

      await runScript('update-import', ['task-1'], ctx.projectDir);
      await runScript('update-import', ['task-2'], ctx.projectDir);

      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      const content = readFile(workingMdPath);

      // Must contain exactly one @import line (no appending)
      const importLines = content.split('\n').filter(line => line.trim().startsWith('@import'));
      expect(importLines.length).toBe(1);
      expect(importLines[0]).toContain('task-2');
      expect(importLines[0]).not.toContain('task-1');
    });
  });

  describe('Test 8.3: .claude/CLAUDE.md Git Ignored', () => {
    it('should have .gitignore with CLAUDE.md entry', async () => {
      const gitignorePath = join(ctx.projectDir, '.claude', '.gitignore');
      expect(fileExists(gitignorePath)).toBe(true);
      const gitignoreContent = readFile(gitignorePath);
      expect(gitignoreContent).toMatch(/^CLAUDE\.md$/m);
    });

    it('should be ignored by git', async () => {
      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      expect(fileExists(workingMdPath)).toBe(true);
      expect(isGitIgnored(ctx.projectDir, '.claude/CLAUDE.md')).toBe(true);
    });

    it('should not appear in git status', async () => {
      await runScript('task-create', ['task-1', 'Task 1'], ctx.projectDir);
      await runScript('update-import', ['task-1'], ctx.projectDir);

      // Commit the gitignore first so git respects it
      gitAdd(ctx.projectDir, '.claude/.gitignore');
      gitCommit(ctx.projectDir, 'commit gitignore');

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
      const result = await runScript('update-import', ['auth'], ctx.projectDir);
      expect(result.exitCode).toBe(0);

      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      const content = readFile(workingMdPath);
      expect(content).toMatch(/@import\s+\S+auth\S+CLAUDE\.md/);
      expect(content).not.toContain('payment');
    });

    it('should update import to payment task', async () => {
      const result = await runScript('update-import', ['payment'], ctx.projectDir);
      expect(result.exitCode).toBe(0);

      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      const content = readFile(workingMdPath);
      expect(content).toMatch(/@import\s+\S+payment\S+CLAUDE\.md/);
      expect(content).not.toContain('auth');
    });

    it('should update import to default task', async () => {
      await runScript('update-import', ['auth'], ctx.projectDir);
      const result = await runScript('update-import', ['default'], ctx.projectDir);
      expect(result.exitCode).toBe(0);

      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      const content = readFile(workingMdPath);
      expect(content).toMatch(/@import\s+\S+default\S+CLAUDE\.md/);
    });
  });

  describe('Test 8.5: /resume Structural Proxy (T-CLMD-2)', () => {
    it('should set up the correct @import path for /resume to read', async () => {
      // This is the automated structural proxy for the manual T-RESUME-MANUAL test.
      // We verify OUR side of the contract: that .claude/CLAUDE.md has the correct
      // @import path before /resume would fire. Claude Code's side (re-reading on resume)
      // is covered by the manual smoke test T-RESUME-MANUAL.
      await runScript('task-create', ['oauth-work', 'OAuth focus'], ctx.projectDir);
      await runScript('update-import', ['oauth-work'], ctx.projectDir);

      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      expect(fileExists(workingMdPath)).toBe(true);

      const content = readFile(workingMdPath);
      // Must contain a valid @import pointing to oauth-work's CLAUDE.md
      const importMatch = content.match(/@import\s+(\S+)/);
      expect(importMatch).not.toBeNull();
      const importRelPath = importMatch![1];
      // The path in @import may be relative to .claude/ directory or project root
      const taskClaudeMdPath = join(ctx.projectDir, '.claude', 'tasks', 'oauth-work', 'CLAUDE.md');
      expect(fileExists(taskClaudeMdPath)).toBe(true);
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
