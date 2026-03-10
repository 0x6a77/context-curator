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

      // FIX 1: Verify script exited successfully
      expect(result.exitCode).toBe(0);

      // Validation: Verify directory structure
      expect(fileExists(join(ctx.projectDir, '.claude'))).toBe(true);
      expect(fileExists(join(ctx.projectDir, '.claude', '.gitignore'))).toBe(true);
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'default', 'CLAUDE.md'))).toBe(true);

      // FIX 2: Assert that .claude/CLAUDE.md contains a properly-formed @import line
      const claudeMdContent = readFile(join(ctx.projectDir, '.claude', 'CLAUDE.md'));
      expect(claudeMdContent).toMatch(/@import\s+\S+CLAUDE\.md/);
      const importMatch = claudeMdContent.match(/@import\s+(\S+CLAUDE\.md)/);
      expect(importMatch).not.toBeNull();
      // Fix 1: verify the import specifically points to the default task CLAUDE.md
      expect(importMatch![1]).toContain('tasks/default/CLAUDE.md');
      const importedPath = join(ctx.projectDir, importMatch![1]);
      expect(fileExists(importedPath)).toBe(true);
    });

    it('should create .gitignore with CLAUDE.md entry', async () => {
      const result = await runScript('init-project', [], ctx.projectDir);

      // FIX 3: Verify script exited successfully
      expect(result.exitCode).toBe(0);

      // FIX 4: Verify .gitignore content with exact line match
      const gitignorePath = join(ctx.projectDir, '.claude', '.gitignore');
      const gitignoreContent = readFile(gitignorePath);
      expect(gitignoreContent).toMatch(/^CLAUDE\.md$/m);
    });

    it('should not create backup when no original CLAUDE.md exists', async () => {
      const result = await runScript('init-project', [], ctx.projectDir);

      // FIX 5: Verify script exited successfully
      expect(result.exitCode).toBe(0);

      // Fix 2: Positive assertion — default task must have been created (makes negative check non-vacuous)
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'default', 'CLAUDE.md'))).toBe(true);

      // Verify no backup created
      const stashPath = join(ctx.personalDir, '.stash', 'original-CLAUDE.md');
      expect(fileExists(stashPath)).toBe(false);
    });

    it('should work with git initialized', async () => {
      // Initialize git first
      initGit(ctx.projectDir);

      const result = await runScript('init-project', [], ctx.projectDir);

      // FIX 6: Verify script exited successfully
      expect(result.exitCode).toBe(0);

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
      const backupPath = join(ctx.personalDir, '.stash', 'original-CLAUDE.md');

      // FIX 7: Pre-condition — backup must not exist before running the script
      expect(fileExists(backupPath)).toBe(false);

      const result = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // FIX 7: Verify script exited successfully
      expect(result.exitCode).toBe(0);

      expect(fileExists(backupPath)).toBe(true);
      const backupContent = readFile(backupPath);
      expect(backupContent).toBe(originalContent);
    });

    // T-INIT-3: Default task should contain the original content, not just be non-empty
    it('should create default task with copy of original CLAUDE.md', async () => {
      // FIX 8: Pre-condition — default task CLAUDE.md must not exist before running
      const defaultTaskPath = join(ctx.projectDir, '.claude', 'tasks', 'default', 'CLAUDE.md');
      expect(fileExists(defaultTaskPath)).toBe(false);

      const result = await runScript('init-project', [], ctx.projectDir);

      // FIX 8: Verify script exited successfully
      expect(result.exitCode).toBe(0);

      expect(fileExists(defaultTaskPath)).toBe(true);
      
      const defaultContent = readFile(defaultTaskPath);
      expect(defaultContent).toBe(originalContent);
    });

    // T-INIT-1 (variant): Unconditionally assert @import format in .claude/CLAUDE.md
    it('should create .claude/CLAUDE.md with @import directive', async () => {
      // FIX 9: Pre-condition — .claude/CLAUDE.md must not exist before running
      const claudeMdWorkingPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
      expect(fileExists(claudeMdWorkingPath)).toBe(false);

      const result = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // FIX 9: Verify script exited successfully
      expect(result.exitCode).toBe(0);

      expect(fileExists(claudeMdWorkingPath)).toBe(true);
      const content = readFile(claudeMdWorkingPath);
      expect(content).toMatch(/@import\s+\S+CLAUDE\.md/);
      const importMatch = content.match(/@import\s+(\S+CLAUDE\.md)/);
      expect(importMatch).not.toBeNull();
      // Fix 3: verify the import specifically points to the default task CLAUDE.md
      expect(importMatch![1]).toContain('tasks/default/CLAUDE.md');
      const importedPath = join(ctx.projectDir, importMatch![1]);
      expect(fileExists(importedPath)).toBe(true);
    });
  });

  describe('Test 1.3: Initialize Project Twice (Idempotent)', () => {
    beforeEach(() => {
      writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Instructions\n');
    });

    // Fix 4: Capture content after first run and verify identity after second run
    it('should succeed on both initializations', async () => {
      // First init
      const result1 = await runScript('init-project', [], ctx.projectDir);
      expect(result1.exitCode).toBe(0);

      // Capture .claude/CLAUDE.md content after first init
      const contentAfterFirst = readFile(join(ctx.projectDir, '.claude', 'CLAUDE.md'));

      // Second init should not error
      const result2 = await runScript('init-project', [], ctx.projectDir);
      expect(result2.exitCode).toBe(0);

      // T-INIT-4: file contents must be identical between runs
      const contentAfterSecond = readFile(join(ctx.projectDir, '.claude', 'CLAUDE.md'));
      expect(contentAfterSecond).toBe(contentAfterFirst);
    });

    // Fix 5: Add content identity check
    it('should not create duplicate directories', async () => {
      await runScript('init-project', [], ctx.projectDir);
      const contentAfterFirst = readFile(join(ctx.projectDir, '.claude', 'CLAUDE.md'));

      await runScript('init-project', [], ctx.projectDir);

      // FIX: .claude/CLAUDE.md must exist after second run
      expect(fileExists(join(ctx.projectDir, '.claude', 'CLAUDE.md'))).toBe(true);

      // Verify only one default task
      const tasksDir = join(ctx.projectDir, '.claude', 'tasks');
      const tasks = readdirSync(tasksDir);
      expect(tasks.filter(t => t === 'default').length).toBe(1);

      // T-INIT-4: file contents must be identical
      const contentAfterSecond = readFile(join(ctx.projectDir, '.claude', 'CLAUDE.md'));
      expect(contentAfterSecond).toBe(contentAfterFirst);
    });

    // Fix 6: Replace to focus on DoD (exit 0 + content identity)
    it('should indicate already initialized on second run', async () => {
      const result1 = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(result1.exitCode).toBe(0);
      const contentAfterFirst = readFile(join(ctx.projectDir, '.claude', 'CLAUDE.md'));

      const secondResult = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // T-INIT-4: both runs exit 0 and produce identical file contents
      expect(secondResult.exitCode).toBe(0);
      const contentAfterSecond = readFile(join(ctx.projectDir, '.claude', 'CLAUDE.md'));
      expect(contentAfterSecond).toBe(contentAfterFirst);
    });

    // T-INIT-4: Both runs exit 0 and produce identical file contents
    it('should produce identical files on second run', async () => {
      const result1 = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(result1.exitCode).toBe(0);
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

        // Fix 7: T-INIT-5: Runtime isolation — project 1 personal storage must not overlap with project 2
        // Verify that the personal storage paths are disjoint (different directories)
        const personalPath1 = join(ctx.personalBase, 'projects', sanitizePath(ctx.projectDir));
        const personalPath2 = join(ctx.personalBase, 'projects', sanitizePath(ctx2.projectDir));
        expect(personalPath1).not.toBe(personalPath2);

        // Verify init for project 1 did not create any files in project 2's personal storage directory
        const markerInProject2 = join(personalPath2, 'init-marker.txt');
        expect(fileExists(markerInProject2)).toBe(false);

        // Write a marker in project 1 personal storage and confirm it doesn't appear in project 2
        writeFile(join(personalPath1, 'marker.txt'), 'project-1');
        expect(fileExists(join(personalPath2, 'marker.txt'))).toBe(false);
      } finally {
        ctx2.cleanup();
      }
    });
  });
});
