/**
 * Git Integration Tests (Test Group 11)
 * 
 * Tests for git integration as specified in PRD v13.0:
 * - .gitignore setup for .claude/CLAUDE.md
 * - Task files tracked by git
 * - Golden contexts tracked by git
 * - Personal storage never committed
 * - No git conflicts from context operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import {
  createTestEnvironment,
  TestContext,
  runScript,
  fileExists,
  fileContains,
  readFile,
  createJsonl,
  createSampleMessages,
  initGit,
  isGitIgnored,
  getGitStatus,
  gitAdd,
  gitCommit,
} from '../utils/test-helpers';
import { SMALL_CONTEXT } from '../fixtures/sample-contexts';

describe('Git Integration Tests (Group 11)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('git');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    initGit(ctx.projectDir);
    gitAdd(ctx.projectDir, 'CLAUDE.md');
    gitCommit(ctx.projectDir, 'Initial commit');
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('Test 11.1: .gitignore Setup', () => {
    it('should create .gitignore during initialization', async () => {
      await runScript('init-project', [], ctx.projectDir);

      const gitignorePath = join(ctx.projectDir, '.claude', '.gitignore');
      expect(fileExists(gitignorePath)).toBe(true);
    });

    it('should include CLAUDE.md in .gitignore', async () => {
      await runScript('init-project', [], ctx.projectDir);

      const gitignorePath = join(ctx.projectDir, '.claude', '.gitignore');
      const content = readFile(gitignorePath);
      expect(content).toMatch(/^CLAUDE\.md$/m);
    });
  });

  describe('Test 11.2: Task Files Tracked by Git', () => {
    beforeEach(async () => {
      await runScript('init-project', [], ctx.projectDir);
    });

    it('should allow task CLAUDE.md to be tracked', async () => {
      await runScript('task-create', ['auth-work', 'Auth task'], ctx.projectDir);

      const taskMdPath = '.claude/tasks/auth-work/CLAUDE.md';
      gitAdd(ctx.projectDir, taskMdPath);

      const status = getGitStatus(ctx.projectDir);
      expect(status).toContain(taskMdPath);
    });

    it('should allow task directory to be committed', async () => {
      await runScript('task-create', ['auth-work', 'Auth task'], ctx.projectDir);

      gitAdd(ctx.projectDir, '.claude/tasks/');
      
      // Should not throw
      expect(() => {
        gitCommit(ctx.projectDir, 'Add auth-work task');
      }).not.toThrow();
    });
  });

  describe('Test 11.3: Golden Contexts Tracked', () => {
    beforeEach(async () => {
      await runScript('init-project', [], ctx.projectDir);
      await runScript('task-create', ['task-1', 'Test task'], ctx.projectDir);
    });

    it('should allow golden context to be tracked', async () => {
      // Create golden context
      const goldenDir = join(ctx.projectDir, '.claude', 'tasks', 'task-1', 'contexts');
      createJsonl(join(goldenDir, 'golden-ctx.jsonl'), SMALL_CONTEXT);

      gitAdd(ctx.projectDir, '.claude/tasks/task-1/contexts/golden-ctx.jsonl');

      const status = getGitStatus(ctx.projectDir);
      expect(status).toContain('golden-ctx.jsonl');
    });

    it('should commit golden context successfully', async () => {
      const goldenDir = join(ctx.projectDir, '.claude', 'tasks', 'task-1', 'contexts');
      createJsonl(join(goldenDir, 'golden-ctx.jsonl'), SMALL_CONTEXT);

      gitAdd(ctx.projectDir, '.claude/');
      
      expect(() => {
        gitCommit(ctx.projectDir, 'Add golden context');
      }).not.toThrow();
    });
  });

  describe('Test 11.4: Personal Storage Never Committed', () => {
    beforeEach(async () => {
      await runScript('init-project', [], ctx.projectDir);
      await runScript('task-create', ['task-1', 'Test task'], ctx.projectDir);
    });

    it('should not include personal storage in git', async () => {
      // Run save-context to actually create personal files
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);
      await runScript(
        'save-context',
        ['task-1', 'my-work', '--personal'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Stage everything in project dir
      gitAdd(ctx.projectDir, '.');
      const status = getGitStatus(ctx.projectDir);

      // Personal storage is under ctx.personalBase which is outside projectDir
      // No staged file should reference the personal storage path prefix
      const statusLines = status.split('\n').filter(l => l.trim());
      statusLines.forEach(line => {
        expect(line).not.toContain(ctx.personalBase);
        expect(line).not.toContain('personal-ctx');
        expect(line).not.toContain('my-work');
      });
    });
  });

  describe('Test 11.5: No Git Conflicts from Context Operations', () => {
    it('should produce no UU conflict markers when two devs work independently', async () => {
      await runScript('init-project', [], ctx.projectDir);

      const ctx2 = createTestEnvironment('git2');
      try {
        writeFileSync(join(ctx2.projectDir, 'CLAUDE.md'), '# Test Project\n');
        initGit(ctx2.projectDir);
        gitAdd(ctx2.projectDir, 'CLAUDE.md');
        gitCommit(ctx2.projectDir, 'Initial commit');
        await runScript('init-project', [], ctx2.projectDir);

        // Dev 1: create task and golden context
        await runScript('task-create', ['shared-task', 'Shared work'], ctx.projectDir);
        const goldenDir1 = join(ctx.projectDir, '.claude', 'tasks', 'shared-task', 'contexts');
        createJsonl(join(goldenDir1, 'shared-ctx.jsonl'), SMALL_CONTEXT);
        gitAdd(ctx.projectDir, '.claude/');
        gitCommit(ctx.projectDir, 'Add shared task');

        // Dev 2: create different task
        await runScript('task-create', ['different-task', 'Different work'], ctx2.projectDir);
        const goldenDir2 = join(ctx2.projectDir, '.claude', 'tasks', 'different-task', 'contexts');
        createJsonl(join(goldenDir2, 'other-ctx.jsonl'), SMALL_CONTEXT);
        gitAdd(ctx2.projectDir, '.claude/');
        gitCommit(ctx2.projectDir, 'Add different task');

        // Verify: no conflict markers in either repo
        const status1 = getGitStatus(ctx.projectDir);
        const status2 = getGitStatus(ctx2.projectDir);
        expect(status1).not.toMatch(/^UU /m);
        expect(status2).not.toMatch(/^UU /m);

        // Verify each project has its own task
        expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'shared-task', 'CLAUDE.md'))).toBe(true);
        expect(fileExists(join(ctx2.projectDir, '.claude', 'tasks', 'different-task', 'CLAUDE.md'))).toBe(true);

        // Verify .claude/CLAUDE.md is not tracked in either repo
        const status1Lines = status1.split('\n');
        status1Lines.forEach(line => expect(line).not.toContain('.claude/CLAUDE.md'));
      } finally {
        ctx2.cleanup();
      }
    });
  });

  describe('Test 11.6: Pull Golden Context and Load', () => {
    beforeEach(async () => {
      await runScript('init-project', [], ctx.projectDir);
    });

    it('should recognize golden contexts after they exist', async () => {
      await runScript('task-create', ['shared-task', 'Shared work'], ctx.projectDir);
      const goldenDir = join(ctx.projectDir, '.claude', 'tasks', 'shared-task', 'contexts');
      createJsonl(join(goldenDir, 'shared-ctx.jsonl'), SMALL_CONTEXT);

      const result = await runScript('context-list', ['shared-task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('shared-ctx');
    });
  });

  describe('Test 11.7: .claude/CLAUDE.md Not in Git Status', () => {
    beforeEach(async () => {
      await runScript('init-project', [], ctx.projectDir);
    });

    it('should not show .claude/CLAUDE.md in status', async () => {
      await runScript('task-create', ['task-1', 'Task 1'], ctx.projectDir);
      await runScript('update-import', ['task-1'], ctx.projectDir);

      // Commit the .gitignore so git-ignore behavior is active
      gitAdd(ctx.projectDir, '.claude/.gitignore');
      gitCommit(ctx.projectDir, 'Add .claude/.gitignore');

      // Modify .claude/CLAUDE.md
      const workingMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      expect(fileExists(workingMdPath)).toBe(true);
      writeFileSync(workingMdPath, '# Modified\n@import ./tasks/task-1/CLAUDE.md\n');

      const status = getGitStatus(ctx.projectDir);
      expect(status).not.toContain('.claude/CLAUDE.md');
    });

    it('should be ignored by git check-ignore', async () => {
      await runScript('task-create', ['task-1', 'Task 1'], ctx.projectDir);

      // Must commit the .gitignore for git check-ignore to activate
      gitAdd(ctx.projectDir, '.claude/.gitignore');
      gitCommit(ctx.projectDir, 'Add .claude/.gitignore');

      expect(isGitIgnored(ctx.projectDir, '.claude/CLAUDE.md')).toBe(true);
    });
  });
});
