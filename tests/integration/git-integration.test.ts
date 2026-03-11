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

    // Fix 35: Replace with structural isolation check (personal storage is outside projectDir)
    it('should not include personal storage in git', async () => {
      // Verify personal storage is outside project dir (structural isolation)
      expect(ctx.personalBase.startsWith(ctx.projectDir)).toBe(false);

      // Run save-context to create personal files
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);
      await runScript(
        'save-context',
        ['task-1', 'my-work', '--personal'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Verify personal context file was created outside project dir
      const personalContextPath = join(ctx.personalDir, 'tasks', 'task-1', 'contexts', 'my-work.jsonl');
      expect(fileExists(personalContextPath)).toBe(true);
      expect(personalContextPath.startsWith(ctx.projectDir)).toBe(false);

      // Stage everything inside project dir — personal files must not appear
      gitAdd(ctx.projectDir, '.');
      const status = getGitStatus(ctx.projectDir);
      const statusLines = status.split('\n').filter(l => l.trim());
      statusLines.forEach(line => {
        expect(line).not.toContain('my-work');
        expect(line).not.toContain('personal-ctx');
      });
    });
  });

  describe('Test 11.5: No Git Conflicts from Context Operations', () => {
    // Fix 36: Replace vacuous conflict-marker test with meaningful cross-isolation test
    it('should isolate task files between two independent developer workspaces', async () => {
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

        // Verify each project has its own task
        expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'shared-task', 'CLAUDE.md'))).toBe(true);
        expect(fileExists(join(ctx2.projectDir, '.claude', 'tasks', 'different-task', 'CLAUDE.md'))).toBe(true);

        // Verify cross-isolation: dev 1's task not in dev 2's project and vice versa
        expect(fileExists(join(ctx2.projectDir, '.claude', 'tasks', 'shared-task'))).toBe(false);
        expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'different-task'))).toBe(false);

        // Verify .claude/CLAUDE.md is not tracked in either repo after commit
        const status1Lines = getGitStatus(ctx.projectDir).split('\n');
        const status2Lines = getGitStatus(ctx2.projectDir).split('\n');
        status1Lines.forEach(line => expect(line).not.toContain('.claude/CLAUDE.md'));
        status2Lines.forEach(line => expect(line).not.toContain('.claude/CLAUDE.md'));
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

// ==========================================================================
// T-GIT-1 and T-GIT-2: explicit AC-labeled tests
// ==========================================================================

describe('T-GIT-1 and T-GIT-2: git ignore and porcelain status checks', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('tgit');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    initGit(ctx.projectDir);
    gitAdd(ctx.projectDir, 'CLAUDE.md');
    gitCommit(ctx.projectDir, 'Initial commit');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
  });

  afterEach(() => {
    ctx.cleanup();
  });

  it('T-GIT-1: git check-ignore .claude/CLAUDE.md exits 0 in a real git repo after init', () => {
    // Commit the .gitignore so git respects it
    gitAdd(ctx.projectDir, '.claude/.gitignore');
    gitCommit(ctx.projectDir, 'Add .claude/.gitignore');
    // T-GIT-1: isGitIgnored uses git check-ignore which must exit 0
    expect(isGitIgnored(ctx.projectDir, '.claude/CLAUDE.md')).toBe(true);
  });

  it('T-GIT-2: git status --porcelain does not list any path containing personal storage prefix after full workflow', async () => {
    // Run a full workflow: create task, save context via the implementation
    await runScript('task-create', ['tgit-task', 'T-GIT-2 test task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    // Plant a session file so save-context has something to read
    createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);

    // T-GIT-2: use save-context through the implementation (not createJsonl directly)
    // This verifies the implementation itself places personal contexts outside the project dir
    const saveResult = await runScript(
      'save-context',
      ['tgit-task', 'tgit-ctx', '--personal'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );
    expect(saveResult.exitCode).toBe(0);

    // Stage everything inside project dir
    gitAdd(ctx.projectDir, '.');

    // T-GIT-2: git status --porcelain must not list any path containing the personal storage prefix (~/.claude/projects/...)
    const status = getGitStatus(ctx.projectDir);
    const statusLines = status.split('\n').filter((l: string) => l.trim().length > 0);

    // Personal base is outside the project dir; none of its paths should appear in git status
    const personalPrefix = ctx.personalDir;
    statusLines.forEach((line: string) => {
      expect(line).not.toContain(personalPrefix);
      // Also must not contain the project-scoped personal dir name (sanitized path component)
      expect(line).not.toContain('tgit-ctx');
    });
  });
});
