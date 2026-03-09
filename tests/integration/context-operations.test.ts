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
import { mkdirSync, writeFileSync } from 'fs';
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
    // T-CTX-1: explicit path verification
    it('should save context to personal storage', async () => {
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);

      const result = await runScript(
        'save-context',
        ['save-test', 'my-work', '--personal'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      expect(result.exitCode).toBe(0);
      const expectedPath = join(ctx.personalDir, 'tasks', 'save-test', 'contexts', 'my-work.jsonl');
      expect(fileExists(expectedPath)).toBe(true);
    });

    // T-CTX-2: unconditional JSONL validation
    it('should create valid JSONL file', async () => {
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);

      await runScript(
        'save-context',
        ['save-test', 'my-work', '--personal'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const expectedPath = join(ctx.personalDir, 'tasks', 'save-test', 'contexts', 'my-work.jsonl');
      expect(fileExists(expectedPath)).toBe(true);
      expect(isValidJsonl(expectedPath)).toBe(true);
    });

    it('should not save to project .claude/ directory for personal', async () => {
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);

      await runScript(
        'save-context',
        ['save-test', 'my-work', '--personal'],
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
        ['save-test', 'team-knowledge', '--golden'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Verify saved to project .claude/ directory
      const goldenPath = join(ctx.projectDir, '.claude', 'tasks', 'save-test', 'contexts', 'team-knowledge.jsonl');
      expect(result.exitCode).toBe(0);
      expect(fileExists(goldenPath)).toBe(true);
    });

    // T-CTX-3: remove escape hatch, require scan-related output
    it('should run secret scan before saving golden', async () => {
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), CLEAN_CONTEXT);

      const result = await runScript(
        'save-context',
        ['save-test', 'clean-ctx', '--golden'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase();
      expect(output.includes('scan') || output.includes('secret') || output.includes('clean')).toBe(true);
    });
  });

  describe('Test 4.3: Save with Invalid Name', () => {
    it('should reject context name with invalid characters', async () => {
      const result = await runScript(
        'save-context',
        ['save-test', 'my work!', '--personal'],
        ctx.projectDir
      );

      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('Test 4.5: Save with Varying Message Counts', () => {
    // T-CTX-4: empty context — real assertion, no unhandled exception
    it('should handle empty context gracefully', async () => {
      createJsonl(join(ctx.personalDir, 'empty-session.jsonl'), []);

      const result = await runScript(
        'save-context',
        ['save-test', 'empty-ctx', '--personal'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Empty context: script may succeed or fail, but must not crash with unhandled exception
      expect(result.exitCode === 0 || result.exitCode === 1).toBe(true);
      // Must not produce a Node.js stack trace
      expect(result.stderr).not.toContain('at Object.<anonymous>');
    });

    // T-CTX-4: golden-save size cap test
    it('should reject golden save when context exceeds 100KB', async () => {
      // Create a session file larger than 100KB
      const largeMessage = { type: 'user', message: { role: 'user', content: 'x'.repeat(1000) }, timestamp: new Date().toISOString() };
      const messages = Array.from({ length: 150 }, () => largeMessage);
      createJsonl(join(ctx.personalDir, 'large-session.jsonl'), messages);

      const result = await runScript(
        'save-context',
        ['save-test', 'large-ctx', '--golden'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      expect(result.exitCode).not.toBe(0);
      const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
      expect(output.includes('100kb') || output.includes('too large') || output.includes('size')).toBe(true);
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

    // T-LIST-1: specific context names, no OR escape
    it('should list all contexts for task', async () => {
      const result = await runScript('context-list', ['list-test'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).toBe(0);
      const output = result.stdout;
      expect(output).toContain('ctx-1');
      expect(output).toContain('ctx-2');
    });

    // T-LIST-2: word-boundary regex for message counts
    it('should show message counts', async () => {
      const result = await runScript('context-list', ['list-test'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).toBe(0);
      const output = result.stdout;
      // Should show message counts as numbers with word boundaries
      expect(/\b\d+\s*(msg|message)/i.test(output)).toBe(true);
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

    // T-LIST-1 ordering: remove escape, check personal before golden
    it('should show both personal and golden sections', async () => {
      const result = await runScript('context-list', ['list-test'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).toBe(0);
      const output = result.stdout.toLowerCase();
      expect(output).toContain('personal');
      expect(output).toContain('golden');
      // Personal must appear before golden
      expect(output.indexOf('personal')).toBeLessThan(output.indexOf('golden'));
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

    // T-CTX-7: deletion protection test
    it('should prevent golden context deletion without confirmation', async () => {
      const goldenPath = join(ctx.projectDir, '.claude', 'tasks', 'task-1', 'contexts', 'golden-ctx.jsonl');

      const result = await runScript(
        'delete-context',
        ['task-1', 'golden-ctx'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Without explicit confirmation, deletion must fail
      expect(result.exitCode).not.toBe(0);
      // Golden file must still exist
      expect(fileExists(goldenPath)).toBe(true);
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

    // T-PROM-2: require specific type identification
    it('should detect secrets and warn/block', async () => {
      const result = await runScript(
        'promote-context',
        ['promote-test', 'secret-ctx'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
      // Must name a specific secret type, not just say 'found'
      const namesSpecificType = output.includes('aws') || output.includes('akia') || output.includes('secret key') || output.includes('access key');
      const blocksPromotion = result.exitCode !== 0;
      expect(namesSpecificType || blocksPromotion).toBe(true);
      expect(namesSpecificType).toBe(true); // Type identification is required
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
    // T-PROM-3: create BOTH personal and golden to trigger correct "already exists" path
    beforeEach(() => {
      // Create personal context (source for promotion)
      const personalDir = join(ctx.personalDir, 'tasks', 'promote-test', 'contexts');
      mkdirSync(personalDir, { recursive: true });
      createJsonl(join(personalDir, 'already-golden.jsonl'), SMALL_CONTEXT);

      // Also create golden context (to trigger the "already exists" warning)
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
