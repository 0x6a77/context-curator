/**
 * Project Initialization Tests (Test Group 1)
 * 
 * Tests for /task-init command behavior as specified in PRD v13.0:
 * - Creates .claude/ directory if it doesn't exist
 * - Creates .claude/.gitignore with CLAUDE.md entry
 * - Creates .claude/tasks/default/CLAUDE.md
 * - Backs up original CLAUDE.md to personal storage
 * - Idempotent: running twice doesn't break anything
 * - Works with and without existing CLAUDE.md
 * - Preserves existing .claude/ content
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import {
  createTestEnvironment,
  TestContext,
  runScript,
  fileExists,
  fileContains,
  readFile,
  writeFile,
  initGit,
  isGitIgnored,
  sanitizePath,
} from '../utils/test-helpers';

describe('Project Initialization Tests', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestEnvironment('init');
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('Test 1.1: Initialize Fresh Project (No CLAUDE.md)', () => {
    it('should create .claude/ directory structure', async () => {
      // Setup: Empty project directory
      // No CLAUDE.md exists

      // Execute: Run init-project script
      const result = await runScript('init-project', [], ctx.projectDir);

      // Validation: Verify directory structure
      expect(fileExists(join(ctx.projectDir, '.claude'))).toBe(true);
      expect(fileExists(join(ctx.projectDir, '.claude', '.gitignore'))).toBe(true);
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'default', 'CLAUDE.md'))).toBe(true);

      // T-INIT-1: Also assert that .claude/CLAUDE.md contains an @import line
      const claudeMdContent = readFile(join(ctx.projectDir, '.claude', 'CLAUDE.md'));
      expect(claudeMdContent).toMatch(/@import/);
    });

    it('should create .gitignore with CLAUDE.md entry', async () => {
      await runScript('init-project', [], ctx.projectDir);

      // Verify .gitignore content
      const gitignorePath = join(ctx.projectDir, '.claude', '.gitignore');
      expect(fileContains(gitignorePath, 'CLAUDE.md')).toBe(true);
    });

    it('should not create backup when no original CLAUDE.md exists', async () => {
      await runScript('init-project', [], ctx.projectDir);

      // Verify no backup created
      const stashPath = join(ctx.personalDir, '.stash', 'original-CLAUDE.md');
      expect(fileExists(stashPath)).toBe(false);
    });

    it('should work with git initialized', async () => {
      // Initialize git first
      initGit(ctx.projectDir);

      await runScript('init-project', [], ctx.projectDir);

      // Verify .claude/CLAUDE.md is git-ignored
      expect(isGitIgnored(ctx.projectDir, '.claude/CLAUDE.md')).toBe(true);
    });
  });

  describe('Test 1.2: Initialize Project with Existing CLAUDE.md', () => {
    const originalContent = '# My Project Instructions\n\nUse Python 3.11 for all scripts\n';

    beforeEach(() => {
      // Setup: Create project with existing CLAUDE.md
      writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), originalContent);
    });

    it('should not modify root CLAUDE.md', async () => {
      await runScript('init-project', [], ctx.projectDir);

      // Verify root CLAUDE.md unchanged
      const rootContent = readFile(join(ctx.projectDir, 'CLAUDE.md'));
      expect(rootContent).toBe(originalContent);
    });

    // T-INIT-2: Remove self-fulfilling backup setup; assert the script creates the backup
    it('should create backup of original CLAUDE.md', async () => {
      await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const stashPath = join(ctx.personalDir, '.stash', 'original-CLAUDE.md');
      expect(fileExists(stashPath)).toBe(true);
      const backupContent = readFile(stashPath);
      expect(backupContent).toBe(originalContent);
    });

    // T-INIT-3: Default task should contain the original content, not just be non-empty
    it('should create default task with copy of original CLAUDE.md', async () => {
      await runScript('init-project', [], ctx.projectDir);

      const defaultTaskPath = join(ctx.projectDir, '.claude', 'tasks', 'default', 'CLAUDE.md');
      expect(fileExists(defaultTaskPath)).toBe(true);
      
      const defaultContent = readFile(defaultTaskPath);
      expect(defaultContent).toBe(originalContent);
    });

    // T-INIT-1 (variant): Unconditionally assert @import format in .claude/CLAUDE.md
    it('should create .claude/CLAUDE.md with @import directive', async () => {
      await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const workingPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      expect(fileExists(workingPath)).toBe(true);
      const workingContent = readFile(workingPath);
      expect(workingContent).toMatch(/@import\s+\S+CLAUDE\.md/);
    });
  });

  describe('Test 1.3: Initialize Project Twice (Idempotent)', () => {
    beforeEach(() => {
      writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Instructions\n');
    });

    it('should succeed on both initializations', async () => {
      // First init
      const result1 = await runScript('init-project', [], ctx.projectDir);
      expect(result1.exitCode).toBe(0);

      // Second init should not error
      const result2 = await runScript('init-project', [], ctx.projectDir);
      expect(result2.exitCode).toBe(0);
    });

    it('should not create duplicate directories', async () => {
      await runScript('init-project', [], ctx.projectDir);
      await runScript('init-project', [], ctx.projectDir);

      // Verify only one default task
      const tasksDir = join(ctx.projectDir, '.claude', 'tasks');
      const tasks = readdirSync(tasksDir);
      expect(tasks.filter(t => t === 'default').length).toBe(1);
    });

    it('should indicate already initialized on second run', async () => {
      await runScript('init-project', [], ctx.projectDir);
      const result2 = await runScript('init-project', [], ctx.projectDir);

      // Check for indication of existing initialization
      const output = result2.stdout.toLowerCase();
      expect(
        output.includes('already') ||
        output.includes('exists') ||
        output.includes('initialized')
      ).toBe(true);
    });

    // T-INIT-4: Second run exits 0 and produces identical file contents
    it('should produce identical files on second run', async () => {
      await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      const contentAfterFirst = readFile(join(ctx.projectDir, '.claude', 'CLAUDE.md'));

      const result2 = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(result2.exitCode).toBe(0);
      const contentAfterSecond = readFile(join(ctx.projectDir, '.claude', 'CLAUDE.md'));
      expect(contentAfterSecond).toBe(contentAfterFirst);
    });
  });

  describe('Test 1.4: Initialize with Existing .claude/ Directory', () => {
    beforeEach(() => {
      // Setup: Create .claude/ with existing content
      mkdirSync(join(ctx.projectDir, '.claude'), { recursive: true });
      writeFileSync(join(ctx.projectDir, '.claude', 'existing-file.txt'), 'existing content');
    });

    it('should preserve existing .claude/ content', async () => {
      await runScript('init-project', [], ctx.projectDir);

      // Verify existing content preserved
      const existingPath = join(ctx.projectDir, '.claude', 'existing-file.txt');
      expect(fileExists(existingPath)).toBe(true);
      expect(fileContains(existingPath, 'existing content')).toBe(true);
    });

    it('should still create missing initialization files', async () => {
      await runScript('init-project', [], ctx.projectDir);

      // Verify initialization files created
      expect(fileExists(join(ctx.projectDir, '.claude', '.gitignore'))).toBe(true);
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'default', 'CLAUDE.md'))).toBe(true);
    });
  });

  describe('Test 1.5: Multiple Projects Initialization', () => {
    it('should handle multiple projects independently', async () => {
      // Create second project context
      const ctx2 = createTestEnvironment('init2');
      
      try {
        // Initialize both projects
        writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Project 1\n');
        writeFileSync(join(ctx2.projectDir, 'CLAUDE.md'), '# Project 2\n');

        await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
        await runScript('init-project', [], ctx2.projectDir, { CLAUDE_HOME: ctx.personalBase });

        // Verify both have independent .claude/ directories
        expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'default'))).toBe(true);
        expect(fileExists(join(ctx2.projectDir, '.claude', 'tasks', 'default'))).toBe(true);

        // Verify personal storage paths are different
        const sanitized1 = sanitizePath(ctx.projectDir);
        const sanitized2 = sanitizePath(ctx2.projectDir);
        expect(sanitized1).not.toBe(sanitized2);

        // T-INIT-5: Runtime isolation — a file in project 1 personal storage must not appear in project 2
        const file1 = join(ctx.personalBase, 'projects', sanitizePath(ctx.projectDir), 'isolation-marker.txt');
        writeFile(file1, 'project-1-only');
        const file2 = join(ctx.personalBase, 'projects', sanitizePath(ctx2.projectDir), 'isolation-marker.txt');
        expect(fileExists(file2)).toBe(false);
      } finally {
        ctx2.cleanup();
      }
    });
  });
});
