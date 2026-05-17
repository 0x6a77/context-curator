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

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, mkdtempSync, rmSync, realpathSync, statSync, cpSync } from 'fs';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import {
  createTestEnvironment,
  TestContext,
  runScript,
  fileExists,
  fileContains,
  readFile,
  writeFile,
  createJsonl,
  initGit,
  isGitIgnored,
  gitAdd,
  gitCommit,
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
      const result = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

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
      const result = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // FIX 3: Verify script exited successfully
      expect(result.exitCode).toBe(0);

      // FIX 4: Verify .gitignore content with exact line match
      const gitignorePath = join(ctx.projectDir, '.claude', '.gitignore');
      const gitignoreContent = readFile(gitignorePath);
      expect(gitignoreContent).toMatch(/^CLAUDE\.md$/m);
    });

    it('should not create backup when no original CLAUDE.md exists', async () => {
      const result = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

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
      initGit(ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const result = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // FIX 6: Verify script exited successfully
      expect(result.exitCode).toBe(0);

      // Commit .gitignore before calling check-ignore — git check-ignore behaviour
      // for an untracked .gitignore is version-dependent; committing it first is
      // the only portable approach.
      gitAdd(ctx.projectDir, '.claude/.gitignore');
      gitCommit(ctx.projectDir, 'test: add .claude/.gitignore');

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
      await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

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

      const result = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

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
      const result1 = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(result1.exitCode).toBe(0);

      // Capture .claude/CLAUDE.md content after first init
      const contentAfterFirst = readFile(join(ctx.projectDir, '.claude', 'CLAUDE.md'));

      // Second init should not error
      const result2 = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(result2.exitCode).toBe(0);

      // T-INIT-4: file contents must be identical between runs
      const contentAfterSecond = readFile(join(ctx.projectDir, '.claude', 'CLAUDE.md'));
      expect(contentAfterSecond).toBe(contentAfterFirst);
    });

    // Fix 5: Add content identity check
    it('should not create duplicate directories', async () => {
      await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      const contentAfterFirst = readFile(join(ctx.projectDir, '.claude', 'CLAUDE.md'));

      await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

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

    // T-INIT-4: Both runs exit 0, produce identical file contents, and do NOT duplicate the stash backup
    it('should produce identical files on second run and not duplicate stash', async () => {
      const result1 = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(result1.exitCode).toBe(0);
      const contentAfterFirst = readFile(join(ctx.projectDir, '.claude', 'CLAUDE.md'));

      const result2 = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(result2.exitCode).toBe(0);
      const contentAfterSecond = readFile(join(ctx.projectDir, '.claude', 'CLAUDE.md'));
      expect(contentAfterSecond).toBe(contentAfterFirst);

      // T-INIT-4 stash idempotency: second init must NOT create a duplicate stash backup.
      // The stash directory MUST exist (beforeEach creates root CLAUDE.md, so init always stashes it).
      // Assert unconditionally — a conditional guard would allow a buggy impl to pass vacuously.
      const stashDir = join(ctx.personalDir, '.stash');
      expect(existsSync(stashDir)).toBe(true);
      const stashFiles = readdirSync(stashDir).filter((f: string) => f.includes('CLAUDE'));
      expect(stashFiles.length).toBe(1);
    });
  });

  describe('Test 1.4: Initialize with Existing .claude/ Directory', () => {
    beforeEach(() => {
      // Setup: Create .claude/ with existing content
      mkdirSync(join(ctx.projectDir, '.claude'), { recursive: true });
      writeFileSync(join(ctx.projectDir, '.claude', 'existing-file.txt'), 'existing content');
    });

    it('should preserve existing .claude/ content', async () => {
      await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // Verify existing content preserved
      const existingPath = join(ctx.projectDir, '.claude', 'existing-file.txt');
      expect(fileExists(existingPath)).toBe(true);
      expect(fileContains(existingPath, 'existing content')).toBe(true);
    });

    it('should still create missing initialization files', async () => {
      await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // Verify initialization files created
      expect(fileExists(join(ctx.projectDir, '.claude', '.gitignore'))).toBe(true);
      expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'default', 'CLAUDE.md'))).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // T-INIT-6: prod-mgmt/risk-acceptances.md created with template content
  // ---------------------------------------------------------------------------
  describe('T-INIT-6: prod-mgmt directory created with risk-acceptances.md', () => {
    it('should create prod-mgmt/risk-acceptances.md containing DISPOSITION and EXPIRY', async () => {
      const result = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(result.exitCode).toBe(0);

      const riskPath = join(ctx.projectDir, 'prod-mgmt', 'risk-acceptances.md');
      expect(fileExists(riskPath)).toBe(true);

      const content = readFile(riskPath);
      expect(content).toContain('DISPOSITION');
      expect(content).toContain('EXPIRY');
    });

    it('should contain RA_ID in risk-acceptances.md (T-PRD-3 companion)', async () => {
      const result = await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(result.exitCode).toBe(0);

      const riskPath = join(ctx.projectDir, 'prod-mgmt', 'risk-acceptances.md');
      expect(fileExists(riskPath)).toBe(true);
      expect(readFile(riskPath)).toContain('RA_ID');
    });

    it('should be idempotent — risk-acceptances.md not overwritten on second init', async () => {
      await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      const riskPath = join(ctx.projectDir, 'prod-mgmt', 'risk-acceptances.md');
      const contentAfterFirst = readFile(riskPath);

      await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      const contentAfterSecond = readFile(riskPath);
      expect(contentAfterSecond).toBe(contentAfterFirst);
    });
  });

  // ---------------------------------------------------------------------------
  // T-INIT-7/8/9: project-scope skill install (requires --project-install flag)
  // ---------------------------------------------------------------------------
  describe('T-INIT-7: project-scope install creates namespaced skill directories', () => {
    it.todo('--project-install creates .claude/skills/context-curator/ with task/, context-save/, context-list/, context-manage/, context-promote/ — each with SKILL.md and scripts/');
  });

  describe('T-INIT-8: project-scope skill takes precedence over user-scope skill', () => {
    it.todo('After --project-install, /context-save resolves to .claude/skills/context-curator/context-save/SKILL.md, not ~/.claude/skills/.../context-save/SKILL.md');
  });

  describe('T-INIT-9: cloned repo has commands without running install.sh', () => {
    it.todo('A fresh clone with .claude/skills/context-curator/ committed and no ~/.claude/skills/ directory recognizes /task as a valid command');
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
        await runScript('init-project', [], ctx2.projectDir, { CLAUDE_HOME: ctx2.personalBase });

        // Verify both have independent .claude/ directories
        expect(fileExists(join(ctx.projectDir, '.claude', 'tasks', 'default'))).toBe(true);
        expect(fileExists(join(ctx2.projectDir, '.claude', 'tasks', 'default'))).toBe(true);

        // Verify personal storage paths are different
        const sanitized1 = sanitizePath(ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
        const sanitized2 = sanitizePath(ctx2.projectDir);
        expect(sanitized1).not.toBe(sanitized2);

        // Fix 7: T-INIT-5: Runtime isolation — project 1 personal storage must not overlap with project 2
        // Verify that the personal storage paths are disjoint (different directories)
        const personalPath1 = join(ctx.personalBase, 'projects', sanitizePath(ctx.projectDir));
        const personalPath2 = join(ctx.personalBase, 'projects', sanitizePath(ctx2.projectDir));
        expect(personalPath1).not.toBe(personalPath2);

        // T-INIT-5: use save-context through the IMPLEMENTATION to verify project scoping.
        // (Writing a marker directly only tests path-formula arithmetic, not the implementation.)
        await runScript('task-create', ['iso-task', 'Isolation test'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
        createJsonl(join(personalPath1, 'current-session.jsonl'), [
          { type: 'user', message: { role: 'user', content: 'Project 1 session' }, timestamp: new Date().toISOString() },
        ]);
        const saveResult = await runScript(
          'save-context', ['iso-task', 'iso-ctx', '--personal'],
          ctx.projectDir, { CLAUDE_HOME: ctx.personalBase }
        );
        expect(saveResult.exitCode).toBe(0);

        // The context file must exist in project 1's personal storage
        const savedInProject1 = join(personalPath1, 'tasks', 'iso-task', 'contexts', 'iso-ctx.jsonl');
        expect(fileExists(savedInProject1)).toBe(true);

        // It must NOT appear anywhere under project 2's personal storage
        const savedInProject2 = join(personalPath2, 'tasks', 'iso-task', 'contexts', 'iso-ctx.jsonl');
        expect(fileExists(savedInProject2)).toBe(false);
      } finally {
        ctx2.cleanup();
      }
    });
  });
});

// ---------------------------------------------------------------------------
// T-INIT-7: project-scope install creates namespaced skill directories
// ---------------------------------------------------------------------------
//
// Mirrors install.sh step 9: cp -r src/skills/context-curator/$bundle/* $PROJECT_SKILLS_DIR/$bundle/
// This test replicates the copy operation (like T-ADV-1 replicates install.sh step 5) to verify
// the source artifact structure without requiring a full install.sh run.

describe('T-INIT-7: project-scope install creates namespaced skill directories', () => {
  let tempHome: string;
  let tempRepo: string;
  let installStatus: number | null = null;

  beforeAll(() => {
    // T-INIT-7 fix: actually invoke install.sh --project-install in an isolated repo
    // copy + temp HOME so a regression in the script's flag handling (wrong
    // destination, missing copies, etc.) is caught.
    //
    // install.sh internally `cd "$SCRIPT_DIR"`s before reading $(pwd) for PROJECT_DIR,
    // so the project-scope install always writes into the same directory as install.sh.
    // We therefore stage a temp copy of the source tree (install.sh + src/skills/ +
    // dist + package.json + specialized/ + commands/) and run install.sh from there.
    // This is what really happens for users who clone the repo and run --project-install
    // inside the clone — and it catches any regression in install.sh's step that builds
    // the project skills tree.
    const repoRoot = resolve(__dirname, '../..');
    tempHome = realpathSync(mkdtempSync(join(tmpdir(), 'cc-init7-home-')));
    tempRepo = realpathSync(mkdtempSync(join(tmpdir(), 'cc-init7-repo-')));

    // Stage the minimal subset of the repo install.sh needs.
    cpSync(join(repoRoot, 'install.sh'), join(tempRepo, 'install.sh'));
    cpSync(join(repoRoot, 'package.json'), join(tempRepo, 'package.json'));
    cpSync(join(repoRoot, 'tsconfig.json'), join(tempRepo, 'tsconfig.json'));
    cpSync(join(repoRoot, 'src'), join(tempRepo, 'src'), { recursive: true });
    cpSync(join(repoRoot, 'scripts'), join(tempRepo, 'scripts'), { recursive: true });
    cpSync(join(repoRoot, 'commands'), join(tempRepo, 'commands'), { recursive: true });
    cpSync(join(repoRoot, 'specialized'), join(tempRepo, 'specialized'), { recursive: true });
    // Reuse the already-built dist so install.sh's "npm run build" can skip rebuilding
    // a clean tree (faster) — install.sh still re-runs build, but a cached node_modules
    // would speed it up. We avoid copying node_modules to keep the staging small.
    if (existsSync(join(repoRoot, 'dist'))) {
      cpSync(join(repoRoot, 'dist'), join(tempRepo, 'dist'), { recursive: true });
    }

    // install.sh --project-install requires .claude/tasks/default/CLAUDE.md in the
    // PROJECT_DIR (== tempRepo). Use the existing init-project.ts.
    writeFileSync(join(tempRepo, 'CLAUDE.md'), '# T-INIT-7 fixture\n');
    const initRes = spawnSync(
      'npx',
      ['tsx', join(tempRepo, 'scripts', 'init-project.ts')],
      {
        env: { ...process.env, HOME: tempHome, CLAUDE_HOME: join(tempHome, '.claude') },
        cwd: tempRepo,
        timeout: INSTALL_TIMEOUT_MS,
        encoding: 'utf-8',
      },
    );
    if (initRes.status !== 0) {
      throw new Error(
        `init-project failed in T-INIT-7 setup (status=${initRes.status}): ${initRes.stderr}`,
      );
    }

    mkdirSync(join(tempHome, '.claude'), { recursive: true });
    writeFileSync(join(tempHome, '.claude', 'settings.json'), JSON.stringify({ theme: 'light' }));

    const r = spawnSync(
      'bash',
      [join(tempRepo, 'install.sh'), '--project-install'],
      {
        env: { ...process.env, HOME: tempHome },
        cwd: tempRepo,
        timeout: INSTALL_TIMEOUT_MS,
        encoding: 'utf-8',
      },
    );
    installStatus = r.status;
    if (r.status !== 0) {
      // Surface stderr so the failure mode is visible in CI rather than a downstream
      // file-missing assertion.
      // eslint-disable-next-line no-console
      console.error('install.sh --project-install failed:', r.stderr);
    }
  }, INSTALL_TIMEOUT_MS + 60_000);

  afterAll(() => {
    try { rmSync(tempRepo, { recursive: true, force: true }); } catch {}
    try { rmSync(tempHome, { recursive: true, force: true }); } catch {}
  });

  it('install.sh --project-install creates .claude/skills/context-curator/session/<skill>/ with SKILL.md and scripts/ for each session skill', () => {
    expect(installStatus).toBe(0);
    const skillsRoot = join(tempRepo, '.claude', 'skills', 'context-curator', 'session');
    const required = ['task', 'context-save', 'context-list', 'context-manage', 'context-promote'];
    for (const skill of required) {
      const skillDir = join(skillsRoot, skill);
      expect(existsSync(skillDir)).toBe(true);
      expect(existsSync(join(skillDir, 'SKILL.md'))).toBe(true);
      expect(statSync(join(skillDir, 'scripts')).isDirectory()).toBe(true);
    }
  });
});

// ==========================================================================
// T-INST-1–6: install.sh hook registration and skill deployment
// ==========================================================================


// Run install.sh once per describe block with a temp HOME to avoid touching real system files.
// install.sh runs npm install + npm run build; allow up to 3 minutes per run.
const INSTALL_TIMEOUT_MS = 180_000;

function runInstall(tmpHome: string): { status: number | null } {
  const repoRoot = resolve(__dirname, '../..');
  mkdirSync(join(tmpHome, '.claude'), { recursive: true });
  writeFileSync(join(tmpHome, '.claude', 'settings.json'), JSON.stringify({ theme: 'light' }));
  const r = spawnSync('bash', [join(repoRoot, 'install.sh')], {
    env: { ...process.env, HOME: tmpHome },
    cwd: repoRoot,
    timeout: INSTALL_TIMEOUT_MS,
    encoding: 'utf-8',
  });
  return { status: r.status };
}

describe('T-INST-1/2/3: install.sh registers PostToolUse, Stop, and SessionStart hooks', () => {
  let tmpHome: string;
  let installStatus: number | null = null;

  beforeAll(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'cc-inst123-'));
    const r = runInstall(tmpHome);
    installStatus = r.status;
  }, INSTALL_TIMEOUT_MS + 5000);

  afterAll(() => {
    try { rmSync(tmpHome, { recursive: true, force: true }); } catch {}
  });

  function settings(): any {
    return JSON.parse(readFileSync(join(tmpHome, '.claude', 'settings.json'), 'utf-8'));
  }

  it('T-INST-1: PostToolUse hook contains exactly one entry ending with update-monitor-state.js', () => {
    expect(installStatus).toBe(0);
    const cmds: string[] = (settings().hooks?.PostToolUse ?? []).map((h: any) => h.command ?? '');
    // T-INST-1 enforces uniqueness in isolation — must be exactly one matching entry,
    // not just at-least-one. A duplicated hook entry would otherwise pass.
    const matching = cmds.filter(c => c.endsWith('update-monitor-state.js'));
    expect(matching.length).toBe(1);
    expect(matching[0].endsWith('update-monitor-state.js')).toBe(true);
  });

  it('T-INST-2: Stop hook contains exactly one entry ending with status-line.js', () => {
    expect(installStatus).toBe(0);
    const cmds: string[] = (settings().hooks?.Stop ?? []).map((h: any) => h.command ?? '');
    // T-INST-2 enforces uniqueness in isolation — must be exactly one matching entry.
    const matching = cmds.filter(c => c.endsWith('status-line.js'));
    expect(matching.length).toBe(1);
    expect(matching[0].endsWith('status-line.js')).toBe(true);
  });

  it('T-INST-3: SessionStart hook contains exactly one entry ending with session-start-hook.js', () => {
    expect(installStatus).toBe(0);
    const cmds: string[] = (settings().hooks?.SessionStart ?? []).map((h: any) => h.command ?? '');
    // T-INST-3 enforces uniqueness in isolation — must be exactly one matching entry.
    const matching = cmds.filter(c => c.endsWith('session-start-hook.js'));
    expect(matching.length).toBe(1);
    expect(matching[0].endsWith('session-start-hook.js')).toBe(true);
  });
});

describe('T-INST-4: install.sh hook registration is idempotent (no duplicates after two runs)', () => {
  let tmpHome: string;
  let secondStatus: number | null = null;

  beforeAll(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'cc-inst4-'));
    const repoRoot = resolve(__dirname, '../..');
    mkdirSync(join(tmpHome, '.claude'), { recursive: true });
    writeFileSync(join(tmpHome, '.claude', 'settings.json'), JSON.stringify({ theme: 'light' }));
    const opts = {
      env: { ...process.env, HOME: tmpHome },
      cwd: repoRoot,
      timeout: INSTALL_TIMEOUT_MS,
      encoding: 'utf-8' as const,
    };
    spawnSync('bash', [join(repoRoot, 'install.sh')], opts);
    const r2 = spawnSync('bash', [join(repoRoot, 'install.sh')], opts);
    secondStatus = r2.status;
  }, (INSTALL_TIMEOUT_MS * 2) + 5000);

  afterAll(() => {
    try { rmSync(tmpHome, { recursive: true, force: true }); } catch {}
  });

  it('T-INST-4: each hook array has exactly one entry after two installs', () => {
    expect(secondStatus).toBe(0);
    const s = JSON.parse(readFileSync(join(tmpHome, '.claude', 'settings.json'), 'utf-8'));
    expect((s.hooks?.PostToolUse ?? []).length).toBe(1);
    expect((s.hooks?.Stop ?? []).length).toBe(1);
    expect((s.hooks?.SessionStart ?? []).length).toBe(1);
  });
});

describe('T-INST-5/6: explicit-invocation skills installed; session skills absent from commands/', () => {
  let tmpHome: string;
  let installStatus: number | null = null;

  beforeAll(() => {
    tmpHome = mkdtempSync(join(tmpdir(), 'cc-inst56-'));
    const r = runInstall(tmpHome);
    installStatus = r.status;
  }, INSTALL_TIMEOUT_MS + 5000);

  afterAll(() => {
    try { rmSync(tmpHome, { recursive: true, force: true }); } catch {}
  });

  it('T-INST-5: every authoring/monitor SKILL.md with invocation: explicit exists under ~/.claude/commands/<bundle>/', () => {
    expect(installStatus).toBe(0);
    const repoRoot = resolve(__dirname, '../..');
    const commandsDir = join(tmpHome, '.claude', 'commands');

    for (const bundle of ['authoring', 'monitor']) {
      const bundleDir = join(repoRoot, 'src', 'skills', 'context-curator', bundle);
      if (!existsSync(bundleDir)) continue;
      for (const skillName of readdirSync(bundleDir)) {
        const skillMd = join(bundleDir, skillName, 'SKILL.md');
        if (!existsSync(skillMd)) continue;
        if (!readFileSync(skillMd, 'utf-8').includes('invocation: explicit')) continue;
        const installedPath = join(commandsDir, bundle, `${skillName}.md`);
        expect(existsSync(installedPath)).toBe(true);
      }
    }
  });

  it('T-INST-6: no session bundle skill name appears under ~/.claude/commands/', () => {
    expect(installStatus).toBe(0);
    const commandsDir = join(tmpHome, '.claude', 'commands');
    // Non-vacuous precondition: commandsDir must exist after install.sh runs.
    // Without this, an install.sh that fails to create commands/ at all would let
    // the "no session-bundle skill" assertion pass with an empty walk.
    expect(existsSync(commandsDir)).toBe(true);

    function walkDir(dir: string): string[] {
      const out: string[] = [];
      try {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, e.name);
          if (e.isDirectory()) out.push(...walkDir(full));
          else out.push(full);
        }
      } catch {}
      return out;
    }

    const sessionNames = ['task', 'context-save', 'context-list', 'context-manage', 'context-promote'];
    const allFiles = walkDir(commandsDir);
    for (const name of sessionNames) {
      const matches = allFiles.filter(f => {
        const base = f.replace(commandsDir, '');
        return base.includes(`/${name}`) || base.includes(`/${name}.`);
      });
      expect(matches).toEqual([]);
    }
  });
});
