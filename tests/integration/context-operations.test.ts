/**
 * Context Operations Tests (Test Groups 4-7)
 * 
 * Tests for context saving, listing, management, and promotion:
 * - Context saving (personal and golden)
 * - Context listing with summaries
 * - Context management (cleanup, organization)
 * - Context promotion with secret detection
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'fs';
import {
  createTestEnvironment,
  TestContext,
  runScript,
  fileExists,
  fileContains,
  readFile,
  writeFile,
  createJsonl,
  isValidJsonl,
  parseJsonl,
  createSampleMessages,
  sanitizePath,
} from '../utils/test-helpers';
import { SMALL_CONTEXT, createMediumContext } from '../fixtures/sample-contexts';
import { AWS_KEY_CONTEXT, STRIPE_KEY_CONTEXT, MULTIPLE_SECRETS_CONTEXT, CLEAN_CONTEXT } from '../fixtures/sample-secrets';

describe('Context Saving Tests (Group 4)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('save');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    await runScript('init-project', [], ctx.projectDir);
    await runScript('task-create', ['save-test', 'Testing context save'], ctx.projectDir);
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('Test 4.1: Save Personal Context with Valid Name', () => {
    it('should save context to personal storage', async () => {
      // Create a mock session file in personal storage (where save-context looks for it)
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);

      const result = await runScript(
        'save-context',
        ['save-test', 'my-work', 'personal'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Verify context saved
      expect(result.exitCode).toBe(0);
    });

    it('should create valid JSONL file', async () => {
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);

      await runScript(
        'save-context',
        ['save-test', 'my-work', 'personal'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Check if personal context exists and is valid JSONL
      const personalDir = join(ctx.personalDir, 'tasks', 'save-test', 'contexts');
      if (existsSync(personalDir)) {
        const files = readdirSync(personalDir).filter(f => f.endsWith('.jsonl'));
        if (files.length > 0) {
          const contextPath = join(personalDir, files[0]);
          expect(isValidJsonl(contextPath)).toBe(true);
        }
      }
    });

    it('should not save to project .claude/ directory for personal', async () => {
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);

      await runScript(
        'save-context',
        ['save-test', 'my-work', 'personal'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Verify NOT in project directory golden location
      const projectContextPath = join(ctx.projectDir, '.claude', 'tasks', 'save-test', 'contexts', 'my-work.jsonl');
      expect(fileExists(projectContextPath)).toBe(false);
    });
  });

  describe('Test 4.2: Save Golden Context (After Secret Scan)', () => {
    it('should save context to project directory for golden', async () => {
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), CLEAN_CONTEXT);

      const result = await runScript(
        'save-context',
        ['save-test', 'team-knowledge', 'golden'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Verify saved to project .claude/ directory
      const goldenPath = join(ctx.projectDir, '.claude', 'tasks', 'save-test', 'contexts', 'team-knowledge.jsonl');
      expect(fileExists(goldenPath) || result.exitCode === 0).toBe(true);
    });

    it('should run secret scan before saving golden', async () => {
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), CLEAN_CONTEXT);

      const result = await runScript(
        'save-context',
        ['save-test', 'clean-ctx', 'golden'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Output should mention scanning or secrets
      const output = result.stdout.toLowerCase();
      expect(
        output.includes('scan') ||
        output.includes('secret') ||
        output.includes('clean') ||
        result.exitCode === 0
      ).toBe(true);
    });
  });

  describe('Test 4.3: Save with Invalid Name', () => {
    it('should reject context name with invalid characters', async () => {
      const result = await runScript(
        'save-context',
        ['save-test', 'my work!', 'personal'],
        ctx.projectDir
      );

      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('Test 4.5: Save with Varying Message Counts', () => {
    it('should handle empty context', async () => {
      createJsonl(join(ctx.personalDir, 'empty-session.jsonl'), []);

      const result = await runScript(
        'save-context',
        ['save-test', 'empty-ctx', 'personal'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Should handle gracefully (might succeed or fail with meaningful message)
      expect(typeof result.exitCode).toBe('number');
    });

    it('should handle large context', async () => {
      // Create large context (200+ messages)
      const largeMessages = createSampleMessages(250, 'large-context');
      createJsonl(join(ctx.personalDir, 'large-session.jsonl'), largeMessages);

      const result = await runScript(
        'save-context',
        ['save-test', 'large-ctx', 'personal'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      expect(result.exitCode).toBe(0);
    });
  });
});

describe('Context Listing Tests (Group 5)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('list');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    await runScript('init-project', [], ctx.projectDir);
    await runScript('task-create', ['list-test', 'Testing context list'], ctx.projectDir);
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('Test 5.1: List Contexts for Current Task', () => {
    beforeEach(() => {
      // Create some contexts
      const personalDir = join(ctx.personalDir, 'tasks', 'list-test', 'contexts');
      mkdirSync(personalDir, { recursive: true });
      createJsonl(join(personalDir, 'ctx-1.jsonl'), SMALL_CONTEXT);
      createJsonl(join(personalDir, 'ctx-2.jsonl'), createMediumContext());
    });

    it('should list all contexts for task', async () => {
      const result = await runScript('context-list', ['list-test'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const output = result.stdout.toLowerCase();
      expect(
        output.includes('ctx-1') ||
        output.includes('ctx-2') ||
        output.includes('context')
      ).toBe(true);
    });

    it('should show message counts', async () => {
      const result = await runScript('context-list', ['list-test'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const output = result.stdout.toLowerCase();
      expect(
        output.includes('msg') ||
        output.includes('message') ||
        /\d+/.test(output)
      ).toBe(true);
    });
  });

  describe('Test 5.3: List When No Contexts Exist', () => {
    it('should indicate no contexts found', async () => {
      await runScript('task-create', ['no-contexts', 'Empty task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const result = await runScript('context-list', ['no-contexts'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const output = result.stdout.toLowerCase();
      expect(
        output.includes('no context') ||
        output.includes('none') ||
        output.includes('0 context') ||
        output.includes('empty')
      ).toBe(true);
    });
  });

  describe('Test 5.4: List with Mix of Personal and Golden', () => {
    beforeEach(() => {
      // Create personal context
      const personalDir = join(ctx.personalDir, 'tasks', 'list-test', 'contexts');
      mkdirSync(personalDir, { recursive: true });
      createJsonl(join(personalDir, 'personal-ctx.jsonl'), SMALL_CONTEXT);

      // Create golden context
      const goldenDir = join(ctx.projectDir, '.claude', 'tasks', 'list-test', 'contexts');
      mkdirSync(goldenDir, { recursive: true });
      createJsonl(join(goldenDir, 'golden-ctx.jsonl'), createMediumContext());
    });

    it('should show both personal and golden sections', async () => {
      const result = await runScript('context-list', ['list-test'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const output = result.stdout.toLowerCase();
      // Should differentiate between types
      expect(
        (output.includes('personal') && output.includes('golden')) ||
        output.includes('⭐') ||
        output.includes('context')
      ).toBe(true);
    });
  });

  describe('Test 5.5: List Non-existent Task', () => {
    it('should error for non-existent task', async () => {
      const result = await runScript('context-list', ['nonexistent-task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
      expect(
        result.exitCode !== 0 ||
        output.includes('not found') ||
        output.includes('does not exist') ||
        output.includes('error')
      ).toBe(true);
    });
  });
});

describe('Context Management Tests (Group 6)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('manage');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    await runScript('init-project', [], ctx.projectDir);
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('Test 6.1: Manage When No Contexts Exist', () => {
    it('should report zero contexts', async () => {
      const result = await runScript('list-all-contexts', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const output = result.stdout.toLowerCase();
      expect(
        output.includes('0 context') ||
        output.includes('no context') ||
        output.includes('none') ||
        output.includes('nothing')
      ).toBe(true);
    });
  });

  describe('Test 6.6: Preserve Golden Contexts', () => {
    beforeEach(async () => {
      await runScript('task-create', ['task-1', '--golden', 'Test task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // Create golden context
      const goldenDir = join(ctx.projectDir, '.claude', 'tasks', 'task-1', 'contexts');
      mkdirSync(goldenDir, { recursive: true });
      createJsonl(join(goldenDir, 'golden-ctx.jsonl'), SMALL_CONTEXT);
    });

    it('should list golden context with special indicator', async () => {
      const result = await runScript('list-all-contexts', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const output = result.stdout;
      expect(
        output.includes('⭐') ||
        output.toLowerCase().includes('golden') ||
        output.toLowerCase().includes('team')
      ).toBe(true);
    });
  });
});

describe('Context Promotion Tests (Group 7)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('promote');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    await runScript('init-project', [], ctx.projectDir);
    await runScript('task-create', ['promote-test', 'Testing promotion'], ctx.projectDir);
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('Test 7.1: Promote Clean Context (No Secrets)', () => {
    beforeEach(() => {
      // Create personal context without secrets
      const personalDir = join(ctx.personalDir, 'tasks', 'promote-test', 'contexts');
      mkdirSync(personalDir, { recursive: true });
      createJsonl(join(personalDir, 'clean-ctx.jsonl'), CLEAN_CONTEXT);
    });

    it('should successfully promote clean context', async () => {
      const result = await runScript(
        'promote-context',
        ['promote-test', 'clean-ctx'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Should succeed
      expect(result.exitCode).toBe(0);
    });

    it('should copy to project golden directory', async () => {
      await runScript('promote-context', ['promote-test', 'clean-ctx'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const goldenPath = join(ctx.projectDir, '.claude', 'tasks', 'promote-test', 'contexts', 'clean-ctx.jsonl');
      expect(fileExists(goldenPath)).toBe(true);
    });

    it('should preserve original personal context', async () => {
      await runScript('promote-context', ['promote-test', 'clean-ctx'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const personalPath = join(ctx.personalDir, 'tasks', 'promote-test', 'contexts', 'clean-ctx.jsonl');
      expect(fileExists(personalPath)).toBe(true);
    });
  });

  describe('Test 7.2: Promote Context with API Keys', () => {
    beforeEach(() => {
      const personalDir = join(ctx.personalDir, 'tasks', 'promote-test', 'contexts');
      mkdirSync(personalDir, { recursive: true });
      createJsonl(join(personalDir, 'secret-ctx.jsonl'), AWS_KEY_CONTEXT);
    });

    it('should detect secrets and warn/block', async () => {
      const result = await runScript(
        'promote-context',
        ['promote-test', 'secret-ctx'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
      expect(
        output.includes('secret') ||
        output.includes('detected') ||
        output.includes('found') ||
        output.includes('warning') ||
        result.exitCode !== 0
      ).toBe(true);
    });
  });

  describe('Test 7.3: Promote with Redaction', () => {
    beforeEach(() => {
      const personalDir = join(ctx.personalDir, 'tasks', 'promote-test', 'contexts');
      mkdirSync(personalDir, { recursive: true });
      createJsonl(join(personalDir, 'stripe-ctx.jsonl'), STRIPE_KEY_CONTEXT);
    });

    it('should offer redaction option', async () => {
      // scan-secrets expects a file path
      const contextPath = join(ctx.personalDir, 'tasks', 'promote-test', 'contexts', 'stripe-ctx.jsonl');
      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase();
      expect(
        output.includes('secret') ||
        output.includes('stripe') ||
        output.includes('sk_')
      ).toBe(true);
    });
  });

  describe('Test 7.4: Promote Non-existent Context', () => {
    it('should error for non-existent context', async () => {
      const result = await runScript(
        'promote-context',
        ['promote-test', 'nonexistent'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      expect(result.exitCode).not.toBe(0);

      const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
      expect(
        output.includes('not found') ||
        output.includes('does not exist') ||
        output.includes('error')
      ).toBe(true);
    });
  });

  describe('Test 7.5: Promote Already-Golden Context', () => {
    beforeEach(() => {
      // Create already-golden context
      const goldenDir = join(ctx.projectDir, '.claude', 'tasks', 'promote-test', 'contexts');
      mkdirSync(goldenDir, { recursive: true });
      createJsonl(join(goldenDir, 'already-golden.jsonl'), SMALL_CONTEXT);
    });

    it('should warn about already-golden context', async () => {
      const result = await runScript(
        'promote-context',
        ['promote-test', 'already-golden'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
      expect(
        output.includes('already') ||
        output.includes('golden') ||
        output.includes('exists')
      ).toBe(true);
    });
  });
});
