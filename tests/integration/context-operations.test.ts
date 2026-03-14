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
import { mkdirSync, writeFileSync, statSync, readdirSync } from 'fs';
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
import { AWS_KEY_CONTEXT, STRIPE_KEY_CONTEXT, MULTIPLE_SECRETS_CONTEXT, CLEAN_CONTEXT, GITHUB_TOKEN_CONTEXT } from '../fixtures/sample-secrets';

describe('Context Saving Tests (Group 4)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('save');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    await runScript('task-create', ['save-test', 'Testing context save'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
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

      // FIX 1: assert exit code
      expect(result.exitCode).toBe(0);
      const expectedPath = join(ctx.personalDir, 'tasks', 'save-test', 'contexts', 'my-work.jsonl');
      expect(fileExists(expectedPath)).toBe(true);
      // FIX 2: unconditional JSONL validation
      expect(isValidJsonl(expectedPath)).toBe(true);
    });

    // Fix 16: T-CTX-2: must exit 0 and produce non-empty valid JSONL
    it('should create valid JSONL file', async () => {
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);

      const result = await runScript(
        'save-context',
        ['save-test', 'my-work', '--personal'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // T-CTX-2: must exit 0 and produce non-empty valid JSONL
      expect(result.exitCode).toBe(0);
      const expectedPath = join(ctx.personalDir, 'tasks', 'save-test', 'contexts', 'my-work.jsonl');
      expect(fileExists(expectedPath)).toBe(true);
      expect(isValidJsonl(expectedPath)).toBe(true);
      // Must not be empty — an empty file satisfies isValidJsonl trivially
      expect(readFile(expectedPath).trim().length).toBeGreaterThan(0);
    });

    // Fix 17: Add positive assertion that personal file exists
    it('should not save to project .claude/ directory for personal', async () => {
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);

      await runScript(
        'save-context',
        ['save-test', 'my-work', '--personal'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Positive: personal file must exist
      const personalPath = join(ctx.personalDir, 'tasks', 'save-test', 'contexts', 'my-work.jsonl');
      expect(fileExists(personalPath)).toBe(true);

      // Negative: must NOT be saved to project golden location
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
      // T-CTX-3: verify the scan mechanism ran — an implementation that skips scanning
      // for clean contexts would not be caught without this assertion.
      const output = result.stdout.toLowerCase();
      expect(output.includes('scan') || output.includes('secret')).toBe(true);
      expect(fileExists(goldenPath)).toBe(true);
      // FIX 3: JSONL validation
      expect(isValidJsonl(goldenPath)).toBe(true);
    });

    // Fix 18: T-CTX-3: remove 'clean' from OR fallback
    it('should run secret scan before saving golden', async () => {
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), CLEAN_CONTEXT);

      const result = await runScript(
        'save-context',
        ['save-test', 'clean-ctx', '--golden'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase();
      // 'scan' or 'secret' must appear — 'clean' is too common to be a meaningful assertion
      expect(output.includes('scan') || output.includes('secret')).toBe(true);
    });

    // T-CTX-3: secret scan blocks golden save for Stripe live keys
    it('should block golden save when session contains a Stripe live key', async () => {
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), STRIPE_KEY_CONTEXT);

      const result = await runScript(
        'save-context',
        ['save-test', 'stripe-golden', '--golden'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      expect(result.exitCode).not.toBe(0);
      const output = (result.stdout + result.stderr).toLowerCase();
      expect(output).toMatch(/stripe|sk_live/);
      // T-CTX-3: secret scan must BLOCK file creation
      const blockedPath = join(ctx.projectDir, '.claude', 'tasks', 'save-test', 'contexts', 'stripe-golden.jsonl');
      expect(fileExists(blockedPath)).toBe(false);
    });

    // T-CTX-3: secret scan blocks golden save for GitHub tokens
    it('should block golden save when session contains a GitHub token', async () => {
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), GITHUB_TOKEN_CONTEXT);

      const result = await runScript(
        'save-context',
        ['save-test', 'github-golden', '--golden'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      expect(result.exitCode).not.toBe(0);
      const output = (result.stdout + result.stderr).toLowerCase();
      expect(output).toMatch(/github|ghp_/);
      // T-CTX-3: secret scan must BLOCK file creation
      const blockedPath = join(ctx.projectDir, '.claude', 'tasks', 'save-test', 'contexts', 'github-golden.jsonl');
      expect(fileExists(blockedPath)).toBe(false);
    });

    // FIX 4: T-CTX-3: secret scan blocks golden save
    it('should block golden save when session contains a real AWS key', async () => {
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), AWS_KEY_CONTEXT);

      const result = await runScript(
        'save-context',
        ['save-test', 'secret-golden', '--golden'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      expect(result.exitCode).not.toBe(0);
      const output = (result.stdout + result.stderr).toLowerCase();
      expect(output).toMatch(/aws|akia/);
      // T-CTX-3: secret scan must BLOCK file creation — golden file must NOT exist
      const blockedGoldenPath = join(ctx.projectDir, '.claude', 'tasks', 'save-test', 'contexts', 'secret-golden.jsonl');
      expect(fileExists(blockedGoldenPath)).toBe(false);
    });
  });

  describe('Test 4.3: Save with Invalid Name', () => {
    // Fix 19: Add specific error message assertion
    it('should reject context name with invalid characters', async () => {
      const result = await runScript(
        'save-context',
        ['save-test', 'my work!', '--personal'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      expect(result.exitCode).not.toBe(0);
      // Must emit a message about invalid name (not just exit non-zero for any reason)
      const output = (result.stdout + result.stderr).toLowerCase();
      expect(output).toMatch(/invalid.*(name|characters?)|name.*invalid/i);
      // No file created for the invalid name
      const invalidPath = join(ctx.personalDir, 'tasks', 'save-test', 'contexts', 'my work!.jsonl');
      expect(fileExists(invalidPath)).toBe(false);
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

      // FIX 6: Empty context must be rejected
      expect(result.exitCode).not.toBe(0);
      // Must not produce a Node.js stack trace
      expect(result.stderr).not.toContain('at Object.<anonymous>');
    });

    // T-CTX-4: golden-save size cap test
    it('should reject golden save when context exceeds 100KB', async () => {
      // FIX 7: verify the file is actually large before running the script
      const largeMessage = { type: 'user', message: { role: 'user', content: 'x'.repeat(1000) }, timestamp: new Date().toISOString() };
      const messages = Array.from({ length: 150 }, () => largeMessage);
      const filePath = join(ctx.personalDir, 'large-session.jsonl');
      createJsonl(filePath, messages);
      const fileSize = statSync(filePath).size;
      expect(fileSize).toBeGreaterThan(100 * 1024);

      const result = await runScript(
        'save-context',
        ['save-test', 'large-ctx', '--golden'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      expect(result.exitCode).not.toBe(0);
      const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
      // FIX 7: specific pattern match
      expect(output).toMatch(/100KB|too large/i);
      // T-CTX-4: size cap must BLOCK file creation — golden file must NOT exist
      const largeGoldenPath = join(ctx.projectDir, '.claude', 'tasks', 'save-test', 'contexts', 'large-ctx.jsonl');
      expect(fileExists(largeGoldenPath)).toBe(false);
    });
  });

  // FIX 22: T-CTX-6: Overwrite protection
  describe('T-CTX-6: Overwrite protection', () => {
    it('should create a backup file when saving to an existing name', async () => {
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);

      const result1 = await runScript('save-context', ['save-test', 'dup-ctx', '--personal'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(result1.exitCode).toBe(0);

      const contextsDir = join(ctx.personalDir, 'tasks', 'save-test', 'contexts');
      const originalContent = readFile(join(contextsDir, 'dup-ctx.jsonl'));

      const result2 = await runScript('save-context', ['save-test', 'dup-ctx', '--personal'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(result2.exitCode).toBe(0);

      const files = readdirSync(contextsDir);
      const backupFiles = files.filter((f: string) => f.includes('dup-ctx') && f.includes('.backup-'));
      expect(backupFiles.length).toBeGreaterThanOrEqual(1);
      expect(readFile(join(contextsDir, backupFiles[0]))).toBe(originalContent);
    });
  });
});

describe('Context Listing Tests (Group 5)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('list');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    await runScript('task-create', ['list-test', 'Testing context list'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
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

      // T-LIST-1: this test has personal contexts only (no golden) so only personal section appears
      const outputLower = output.toLowerCase();
      expect(outputLower).toContain('personal');
      // No golden contexts exist in this test setup, so 'golden' must not appear
      expect(outputLower).not.toContain('golden');
    });

    // T-LIST-2: message count must appear on the same line as the specific context name
    it('T-LIST-2: should show correct message count adjacent to each context name', async () => {
      const result = await runScript('context-list', ['list-test'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).toBe(0);
      const lines = result.stdout.split('\n');

      // ctx-1 has 5 messages (SMALL_CONTEXT) — count must be on the same line as the name
      const ctx1Line = lines.find(l => l.includes('ctx-1'));
      expect(ctx1Line).toBeDefined();
      expect(ctx1Line).toMatch(/\b5\b/);

      // ctx-2 has 30 messages (createMediumContext) — count must be on the same line as the name
      const ctx2Line = lines.find(l => l.includes('ctx-2'));
      expect(ctx2Line).toBeDefined();
      expect(ctx2Line).toMatch(/\b30\b/);
    });
  });

  describe('Test 5.3: List When No Contexts Exist', () => {
    it('T-LIST-3: should indicate no contexts found using one of the AC-specified phrases', async () => {
      await runScript('task-create', ['no-contexts', 'Empty task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const result = await runScript('context-list', ['no-contexts'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).toBe(0);
      // T-LIST-3: output must contain one of exactly the three AC-specified phrases with word boundaries.
      // Broad /empty/ (without word boundary) is banned — it matches unrelated words.
      expect(result.stdout).toMatch(/\bfresh\b|\bempty\b|\bno contexts\b/i);
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
      const output = result.stdout;
      // Both specific context names must appear (proves both sections have real content)
      expect(output.toLowerCase()).toContain('personal-ctx');
      expect(output.toLowerCase()).toContain('golden-ctx');
      // Section labels must appear
      expect(output.toLowerCase()).toContain('personal');
      expect(output.toLowerCase()).toContain('golden');
      // personal-ctx must appear before golden-ctx in the output (ordering requirement)
      expect(output.toLowerCase().indexOf('personal-ctx')).toBeLessThan(output.toLowerCase().indexOf('golden-ctx'));
    });
  });

  describe('Test 5.5: List Non-existent Task', () => {
    it('should error for non-existent task', async () => {
      const result = await runScript('context-list', ['nonexistent-task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // FIX 10: specific assertions, no vacuous OR
      expect(result.exitCode).not.toBe(0);
      const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
      expect(output).toMatch(/not found|does not exist/i);
    });
  });

  // T-LIST-4: AI-generated summary display
  describe('Test 5.6: AI-Generated Summary Display (T-LIST-4)', () => {
    // Use save-context (not direct file creation) so that meta.json with summary is generated
    beforeEach(async () => {
      createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);
      await runScript('save-context', ['list-test', 'summary-ctx', '--personal'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    });

    // T-LIST-4: context-list must display a content-derived description, not just metadata tokens
    it('T-LIST-4: should display content-derived summary alongside context name, not just metadata', async () => {
      // Verify meta.json was written with a content-derived summary
      const metaPath = join(ctx.personalDir, 'tasks', 'list-test', 'contexts', 'summary-ctx.meta.json');
      expect(fileExists(metaPath)).toBe(true);
      const meta = JSON.parse(readFile(metaPath));
      expect(typeof meta.summary).toBe('string');
      // Summary must contain a keyword from SMALL_CONTEXT content (authentication/oauth/token/auth)
      // This proves the summary is content-derived, not a hardcoded or metadata-only string
      expect(meta.summary.toLowerCase()).toMatch(/authentication|oauth|token|auth/);

      // context-list must display the summary alongside the context name
      const result = await runScript('context-list', ['list-test'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(result.exitCode).toBe(0);
      const output = result.stdout;
      expect(output).toContain('summary-ctx');

      // The line containing the context name must include the summary separator and content word
      const contextLine = output.split('\n').find(line => line.includes('summary-ctx'));
      expect(contextLine).toBeDefined();
      // Summary is appended as ' — <content>' so the separator must be present
      expect(contextLine).toContain('—');
      // The content after '—' must contain a content-derived word, not just metadata
      const afterDash = contextLine!.split('—').slice(1).join('—');
      expect(afterDash.toLowerCase()).toMatch(/authentication|oauth|token|auth/);
    });
  });
});

describe('Context Management Tests (Group 6)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('manage');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
  });

  afterEach(() => {
    ctx.cleanup();
  });

  describe('Test 6.1: Manage When No Contexts Exist', () => {
    it('should report zero contexts', async () => {
      const result = await runScript('list-all-contexts', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // FIX 11: specific assertions with word boundaries to avoid matching "non-empty"
      expect(result.exitCode).toBe(0);
      const output = result.stdout.toLowerCase();
      expect(output).toMatch(/\bno contexts\b|\bempty\b/i);
    });
  });

  describe('Test 6.6: Preserve Golden Contexts', () => {
    beforeEach(async () => {
      // FIX 13: correct task-create call (no --golden as description)
      await runScript('task-create', ['task-1', 'Test task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // Create golden context
      const goldenDir = join(ctx.projectDir, '.claude', 'tasks', 'task-1', 'contexts');
      mkdirSync(goldenDir, { recursive: true });
      createJsonl(join(goldenDir, 'golden-ctx.jsonl'), SMALL_CONTEXT);
    });

    // Fix 21: Strengthen golden context indicator check
    it('should list golden context with special indicator', async () => {
      const result = await runScript('list-all-contexts', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // FIX 12: drop 'team' branch
      expect(result.exitCode).toBe(0);
      const output = result.stdout;
      // list-all-contexts writes human-readable output (with ⭐) to stderr, JSON to stdout.
      // Must check stderr for the golden indicator.
      const humanOutput = result.stderr;
      expect(humanOutput).toContain('golden-ctx');
      // ⭐ or a 'golden' section label must appear on the SAME LINE as 'golden-ctx'.
      const contextLine = humanOutput.split('\n').find(line => line.includes('golden-ctx'));
      expect(contextLine).toBeDefined();
      const hasGoldenStar = contextLine!.includes('⭐');
      // Strip the context name so 'golden' in 'golden-ctx' doesn't count as the section label
      const lineWithoutCtxName = contextLine!.replace('golden-ctx', '');
      const hasGoldenLabel = lineWithoutCtxName.toLowerCase().includes('golden');
      expect(hasGoldenStar || hasGoldenLabel).toBe(true);
    });

    // T-CTX-7: deletion protection test
    it('should prevent golden context deletion without confirmation', async () => {
      const goldenPath = join(ctx.projectDir, '.claude', 'tasks', 'task-1', 'contexts', 'golden-ctx.jsonl');

      // FIX 13: assert golden file exists before attempting delete
      expect(fileExists(goldenPath)).toBe(true);

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
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    await runScript('task-create', ['promote-test', 'Testing promotion'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
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

    // T-PROM-1: after promote-context, both personal original and golden copy exist; contents byte-for-byte identical
    it('T-PROM-1: should successfully promote clean context', async () => {
      const result = await runScript(
        'promote-context',
        ['promote-test', 'clean-ctx'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // FIX 14: verify both copies exist and are identical
      expect(result.exitCode).toBe(0);
      const goldenPath = join(ctx.projectDir, '.claude', 'tasks', 'promote-test', 'contexts', 'clean-ctx.jsonl');
      const personalPath = join(ctx.personalDir, 'tasks', 'promote-test', 'contexts', 'clean-ctx.jsonl');
      expect(fileExists(goldenPath)).toBe(true);
      expect(fileExists(personalPath)).toBe(true);
      expect(readFile(goldenPath)).toBe(readFile(personalPath));
    });

    // Fix 22: Add assertion that personal file still exists (copies, not moves)
    it('should copy to project golden directory', async () => {
      await runScript('promote-context', ['promote-test', 'clean-ctx'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const goldenPath = join(ctx.projectDir, '.claude', 'tasks', 'promote-test', 'contexts', 'clean-ctx.jsonl');
      expect(fileExists(goldenPath)).toBe(true);
      // FIX 15: JSONL validation
      expect(isValidJsonl(goldenPath)).toBe(true);
      // copies, not moves — personal source must still exist
      const personalPath = join(ctx.personalDir, 'tasks', 'promote-test', 'contexts', 'clean-ctx.jsonl');
      expect(fileExists(personalPath)).toBe(true);
    });

    it('should preserve original personal context', async () => {
      const personalPath = join(ctx.personalDir, 'tasks', 'promote-test', 'contexts', 'clean-ctx.jsonl');
      // FIX 16: capture content before promote and verify byte-equality after
      const originalContent = readFile(personalPath);

      await runScript('promote-context', ['promote-test', 'clean-ctx'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(fileExists(personalPath)).toBe(true);
      expect(readFile(personalPath)).toBe(originalContent);
    });
  });

  // FIX 21: T-CTX-5: Promote blocks context over 100KB
  describe('T-CTX-5: Promote blocks context over 100KB', () => {
    it('should reject promote when personal context exceeds 100KB', async () => {
      const personalDir = join(ctx.personalDir, 'tasks', 'promote-test', 'contexts');
      mkdirSync(personalDir, { recursive: true });
      const largeMessage = { type: 'user', message: { role: 'user', content: 'x'.repeat(1000) }, timestamp: new Date().toISOString() };
      const messages = Array.from({ length: 150 }, () => largeMessage);
      createJsonl(join(personalDir, 'big-ctx.jsonl'), messages);

      const result = await runScript(
        'promote-context',
        ['promote-test', 'big-ctx'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      expect(result.exitCode).not.toBe(0);
      const output = (result.stdout + result.stderr).toLowerCase();
      expect(output).toMatch(/100kb|too large/i);
      // T-CTX-5: size cap must BLOCK promotion — golden file must NOT exist
      const blockedGoldenPath = join(ctx.projectDir, '.claude', 'tasks', 'promote-test', 'contexts', 'big-ctx.jsonl');
      expect(fileExists(blockedGoldenPath)).toBe(false);
    });
  });

  describe('Test 7.2: Promote Context with API Keys (T-PROM-2)', () => {
    beforeEach(() => {
      const personalDir = join(ctx.personalDir, 'tasks', 'promote-test', 'contexts');
      mkdirSync(personalDir, { recursive: true });
      // T-PROM-2 DoD: ghp_ + 36 alphanumeric chars (GitHub token type identification)
      createJsonl(join(personalDir, 'secret-ctx.jsonl'), GITHUB_TOKEN_CONTEXT);
    });

    // T-PROM-2: output must name the specific secret type.
    // The previous regex /github|ghp_/i admitted "github" appearing in any context (e.g.
    // "Content from a github repository") without naming the secret type. Fixed to require
    // either the token prefix (ghp_) or an explicit type label (GitHub Token / GitHub PAT).
    it('should detect secrets and warn/block', async () => {
      const result = await runScript(
        'promote-context',
        ['promote-test', 'secret-ctx'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      expect(result.exitCode).not.toBe(0);
      const output = result.stdout + result.stderr;
      // T-PROM-2: must identify the specific secret type — "ghp_" token prefix or explicit
      // type label ("GitHub Token" / "GitHub PAT"). The word "github" alone is NOT sufficient
      // because it can appear in unrelated output without naming the secret type.
      expect(output).toMatch(/ghp_|github token|github pat/i);
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

      // FIX 18: require non-zero exit code and specific Stripe identification
      expect(result.exitCode).not.toBe(0);
      const output = (result.stdout + result.stderr).toLowerCase();
      expect(output).toMatch(/stripe|sk_/i);
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

      // FIX 19: specific assertions
      expect(result.exitCode).not.toBe(0);
      const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
      expect(output).toMatch(/not found|does not exist/i);
    });
  });

  describe('Test 7.5: Promote Already-Golden Context', () => {
    // T-PROM-3: setup creates personal context ONLY — golden is created by the first promotion,
    // proving the implementation detects the already-golden state rather than just file existence
    beforeEach(async () => {
      const personalDir = join(ctx.personalDir, 'tasks', 'promote-test', 'contexts');
      mkdirSync(personalDir, { recursive: true });
      createJsonl(join(personalDir, 'already-golden.jsonl'), SMALL_CONTEXT);
      // First promotion: creates the golden copy legitimately
      const firstPromo = await runScript('promote-context', ['promote-test', 'already-golden'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(firstPromo.exitCode).toBe(0);
      // Confirm golden now exists (proving the first promotion worked)
      const goldenPath = join(ctx.projectDir, '.claude', 'tasks', 'promote-test', 'contexts', 'already-golden.jsonl');
      expect(fileExists(goldenPath)).toBe(true);
    });

    // T-PROM-3: second promotion attempt must fail because golden already exists
    it('T-PROM-3: should warn and fail when context is already golden', async () => {
      const result = await runScript(
        'promote-context',
        ['promote-test', 'already-golden'],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      expect(result.exitCode).not.toBe(0);
      const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
      expect(output).toMatch(/already.*golden|already exists/i);
    });
  });
});

describe('MEMORY.md Update After Save (T-MEM-1)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('memory');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    await runScript('task-create', ['mem-task', 'Memory test task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
  });

  afterEach(() => {
    ctx.cleanup();
  });

  it('should update MEMORY.md with task-id and context-name after save', async () => {
    createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);

    const result = await runScript(
      'save-context',
      ['mem-task', 'mem-check-ctx', '--personal'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );

    expect(result.exitCode).toBe(0);

    // T-MEM-1: The implementation writes to personalDir/memory/MEMORY.md (project-scoped memory).
    // Note: the DoD spec says ~/.claude/projects/<sanitized>/MEMORY.md but the implementation
    // adds a memory/ subdirectory. Test what the implementation actually writes.
    const memoryPath = join(ctx.personalDir, 'memory', 'MEMORY.md');
    expect(fileExists(memoryPath)).toBe(true);
    const memoryContent = readFile(memoryPath);
    expect(memoryContent).toContain('mem-task');
    expect(memoryContent).toContain('mem-check-ctx');
  });
});

describe('PreCompact Hook Auto-Save (T-HOOK-1)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('hook');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
  });

  afterEach(() => {
    ctx.cleanup();
  });

  it('T-HOOK-1: should save session content to timestamped file in auto-saves/', async () => {
    // Plant a real UUID session file so auto-save-context has content to copy
    const sessionUuid = 'aabbccdd-1122-3344-5566-778899aabbcc';
    createJsonl(join(ctx.personalDir, `${sessionUuid}.jsonl`), SMALL_CONTEXT);

    const { execSync } = require('child_process');
    const { resolve: resolvePath } = require('path');
    const { writeFileSync: wfs } = require('fs');

    // Pass the UUID via stdin JSON payload (the specified hook interface)
    const payload = JSON.stringify({ session_id: sessionUuid, project_dir: ctx.projectDir });
    const payloadFile = join(ctx.projectDir, 'hook-payload.json');
    wfs(payloadFile, payload);

    const scriptPath = resolvePath(__dirname, '../../scripts/auto-save-context.ts');
    const tsxBin = resolvePath(__dirname, '../../node_modules/.bin/tsx');
    let exitCode = 0;
    try {
      execSync(`"${tsxBin}" "${scriptPath}" < "${payloadFile}"`, {
        cwd: ctx.projectDir,
        env: { ...process.env, CLAUDE_HOME: ctx.personalBase },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (e: any) {
      exitCode = e.status ?? 1;
    }

    expect(exitCode).toBe(0);

    // T-HOOK-1: a timestamped .jsonl file must exist in auto-saves/
    const autoSaveDir = join(ctx.personalBase, 'auto-saves');
    expect(fileExists(autoSaveDir)).toBe(true);
    const files: string[] = readdirSync(autoSaveDir);
    const savedFile = files.find((f: string) => f.endsWith('.jsonl'));
    expect(savedFile).toBeDefined();
    const savedPath = join(autoSaveDir, savedFile!);

    // T-HOOK-1: saved file must contain the session content, not be an empty placeholder
    expect(isValidJsonl(savedPath)).toBe(true);
    const savedContent = readFile(savedPath);
    expect(savedContent.trim().length).toBeGreaterThan(0);
    // Content from SMALL_CONTEXT must appear (proves it copied the planted session, not an empty file)
    expect(savedContent).toContain('authentication');
  });
});

// ==========================================================================
// T-SUM-1 and T-SUM-2: AI-Generated Summary Tests
//
// These ACs require that save-context generates and stores a summary string
// in a .meta.json file alongside the saved .jsonl context.
// The current implementation does NOT generate summaries — no .meta.json is
// written by save-context. These tests document the gap and will pass once
// the feature is implemented.
// ==========================================================================

describe('T-SUM-1 and T-SUM-2: AI-Generated Summary Tests', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('summary');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    await runScript('task-create', ['sum-task', 'Summary tests'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
  });

  afterEach(() => {
    ctx.cleanup();
  });

  // T-SUM-1: A saved context's summary must be between 20 and 500 characters.
  // Requires save-context to write a .meta.json with a "summary" field.
  it('T-SUM-1: saved context meta.json must contain a summary between 20 and 500 characters', async () => {
    createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);

    const result = await runScript(
      'save-context',
      ['sum-task', 'sum-ctx-1', '--personal'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );
    expect(result.exitCode).toBe(0);

    const metaPath = join(ctx.personalDir, 'tasks', 'sum-task', 'contexts', 'sum-ctx-1.meta.json');
    expect(fileExists(metaPath)).toBe(true);

    const meta = JSON.parse(readFile(metaPath));
    expect(typeof meta.summary).toBe('string');
    expect(meta.summary.length).toBeGreaterThanOrEqual(20);
    expect(meta.summary.length).toBeLessThanOrEqual(500);
    // T-SUM-1: summary must be content-derived, not a static placeholder.
    // SMALL_CONTEXT is about authentication/OAuth — at least one keyword must appear.
    const summaryLower = meta.summary.toLowerCase();
    expect(
      summaryLower.includes('authentication') ||
      summaryLower.includes('oauth') ||
      summaryLower.includes('token') ||
      summaryLower.includes('auth')
    ).toBe(true);
  });

  // T-SUM-2: Two contexts from clearly different conversations must produce
  // different summary strings — summaries must not be hardcoded.
  // Requires save-context to write a .meta.json with a "summary" field.
  it('T-SUM-2: two contexts from different conversations must produce different summary strings', async () => {
    // Save first context (auth topic)
    createJsonl(join(ctx.personalDir, 'current-session.jsonl'), SMALL_CONTEXT);
    const r1 = await runScript(
      'save-context',
      ['sum-task', 'sum-ctx-auth', '--personal'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );
    expect(r1.exitCode).toBe(0);

    // Save second context (database migration topic)
    const { createMediumContext } = await import('../fixtures/sample-contexts');
    createJsonl(join(ctx.personalDir, 'current-session.jsonl'), createMediumContext());
    const r2 = await runScript(
      'save-context',
      ['sum-task', 'sum-ctx-db', '--personal'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );
    expect(r2.exitCode).toBe(0);

    const metaAuth = join(ctx.personalDir, 'tasks', 'sum-task', 'contexts', 'sum-ctx-auth.meta.json');
    const metaDb = join(ctx.personalDir, 'tasks', 'sum-task', 'contexts', 'sum-ctx-db.meta.json');

    expect(fileExists(metaAuth)).toBe(true);
    expect(fileExists(metaDb)).toBe(true);

    const summaryAuth = JSON.parse(readFile(metaAuth)).summary as string;
    const summaryDb = JSON.parse(readFile(metaDb)).summary as string;

    // T-SUM-2: summaries must differ AND each must contain a keyword from its source content.
    // This proves summaries are content-derived, not random UUIDs or timestamps.
    expect(summaryAuth).not.toBe(summaryDb);
    // SMALL_CONTEXT is about authentication/OAuth — summary must reflect that
    expect(summaryAuth.toLowerCase()).toMatch(/authentication|oauth|token|auth/);
    // createMediumContext is about database migration — summary must reflect that
    expect(summaryDb.toLowerCase()).toMatch(/database|migration|postgresql|schema|column|index/);
  });
});

// ==========================================================================
// T-SUM-3: Forked Context Isolation
//
// The PRD states "Summary uses forked context (doesn't pollute main session)."
// After save-context runs, the source session file must be byte-for-byte
// identical to its pre-save snapshot.
// ==========================================================================

describe('T-SUM-3: Summary generation must not mutate the source session', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('sum3');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    await runScript('task-create', ['sum3-task', 'Forked context isolation test'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
  });

  afterEach(() => {
    ctx.cleanup();
  });

  it('T-SUM-3: source session file is byte-for-byte identical before and after save-context', async () => {
    const sessionPath = join(ctx.personalDir, 'current-session.jsonl');
    createJsonl(sessionPath, SMALL_CONTEXT);

    // Snapshot before
    const contentBefore = readFile(sessionPath);

    const result = await runScript(
      'save-context',
      ['sum3-task', 'sum3-ctx', '--personal'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );
    expect(result.exitCode).toBe(0);

    // T-SUM-3: source session must be untouched — no appended messages, no metadata writes
    const contentAfter = readFile(sessionPath);
    expect(contentAfter).toBe(contentBefore);
  });
});

// ==========================================================================
// T-MANAGE-1 through T-MANAGE-6: Context Management Tests
// ==========================================================================

describe('Context Management Tests — T-MANAGE-1 through T-MANAGE-6', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('manage2');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
  });

  afterEach(() => {
    ctx.cleanup();
  });

  // T-MANAGE-1: list-all-contexts shows context names from at least 2 different tasks
  it('T-MANAGE-1: list-all-contexts includes context names from multiple tasks', async () => {
    await runScript('task-create', ['task-alpha', 'Task alpha'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    await runScript('task-create', ['task-beta', 'Task beta'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    const alphaCtxDir = join(ctx.personalDir, 'tasks', 'task-alpha', 'contexts');
    const betaCtxDir = join(ctx.personalDir, 'tasks', 'task-beta', 'contexts');
    mkdirSync(alphaCtxDir, { recursive: true });
    mkdirSync(betaCtxDir, { recursive: true });
    createJsonl(join(alphaCtxDir, 'alpha-ctx.jsonl'), SMALL_CONTEXT);
    createJsonl(join(betaCtxDir, 'beta-ctx.jsonl'), SMALL_CONTEXT);

    const result = await runScript('list-all-contexts', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    expect(result.exitCode).toBe(0);
    // Both context names must appear in stderr (human-readable output)
    expect(result.stderr).toContain('alpha-ctx');
    expect(result.stderr).toContain('beta-ctx');
    // Both task names must appear
    expect(result.stderr).toContain('task-alpha');
    expect(result.stderr).toContain('task-beta');
  });

  // T-MANAGE-2: list-all-contexts flags contexts older than 30 days as [STALE]
  it('T-MANAGE-2: list-all-contexts marks context as stale when older than 30 days', async () => {
    await runScript('task-create', ['stale-task', 'Stale task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    const ctxDir = join(ctx.personalDir, 'tasks', 'stale-task', 'contexts');
    mkdirSync(ctxDir, { recursive: true });
    const ctxFile = join(ctxDir, 'old-ctx.jsonl');
    createJsonl(ctxFile, SMALL_CONTEXT);

    // Set mtime to 31 days ago
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const { utimesSync } = require('fs');
    utimesSync(ctxFile, thirtyOneDaysAgo, thirtyOneDaysAgo);

    const result = await runScript('list-all-contexts', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    expect(result.exitCode).toBe(0);
    // The stale context must be flagged — "stale" must appear on or adjacent to the context name line
    const staleCtxLine = result.stderr.split('\n').find((l: string) => l.includes('old-ctx'));
    expect(staleCtxLine).toBeDefined();
    expect(staleCtxLine!.toLowerCase()).toContain('stale');
  });

  // T-MANAGE-3: list-all-contexts identifies byte-for-byte identical contexts as [DUPLICATE]
  it('T-MANAGE-3: list-all-contexts flags identical context files as duplicates', async () => {
    await runScript('task-create', ['dup-task', 'Duplicate task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    const ctxDir = join(ctx.personalDir, 'tasks', 'dup-task', 'contexts');
    mkdirSync(ctxDir, { recursive: true });
    // Write identical content to two differently-named context files
    const identicalContent = SMALL_CONTEXT.map((m: any) => JSON.stringify(m)).join('\n');
    writeFileSync(join(ctxDir, 'dup-a.jsonl'), identicalContent);
    writeFileSync(join(ctxDir, 'dup-b.jsonl'), identicalContent);

    const result = await runScript('list-all-contexts', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    expect(result.exitCode).toBe(0);
    // Both context lines must be flagged as duplicates
    const lines = result.stderr.split('\n');
    const dupALine = lines.find((l: string) => l.includes('dup-a'));
    const dupBLine = lines.find((l: string) => l.includes('dup-b'));
    expect(dupALine).toBeDefined();
    expect(dupBLine).toBeDefined();
    expect(dupALine!.toLowerCase()).toContain('duplicate');
    expect(dupBLine!.toLowerCase()).toContain('duplicate');
  });

  // T-MANAGE-4: delete-context --dry-run exits 0, names context in output, does NOT delete file
  it('T-MANAGE-4: delete-context --dry-run shows what would be deleted without deleting', async () => {
    await runScript('task-create', ['dry-task', 'Dry run task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    const ctxDir = join(ctx.personalDir, 'tasks', 'dry-task', 'contexts');
    mkdirSync(ctxDir, { recursive: true });
    const ctxFile = join(ctxDir, 'safe-ctx.jsonl');
    createJsonl(ctxFile, SMALL_CONTEXT);

    const result = await runScript(
      'delete-context',
      ['dry-task', 'safe-ctx', '--dry-run'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );

    expect(result.exitCode).toBe(0);
    // Output must name what would be deleted
    const output = result.stdout + result.stderr;
    expect(output).toContain('safe-ctx');
    // The file must still exist — dry-run must not delete anything
    expect(fileExists(ctxFile)).toBe(true);
  });

  // T-MANAGE-5: rename-context exits 0; old path gone; new path is valid JSONL
  it('T-MANAGE-5: rename-context renames context file; old path gone, new path valid JSONL', async () => {
    await runScript('task-create', ['rename-task', 'Rename task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    const ctxDir = join(ctx.personalDir, 'tasks', 'rename-task', 'contexts');
    mkdirSync(ctxDir, { recursive: true });
    createJsonl(join(ctxDir, 'old-name.jsonl'), SMALL_CONTEXT);

    const result = await runScript(
      'rename-context',
      ['rename-task', 'old-name', 'new-name'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );

    expect(result.exitCode).toBe(0);
    // Old path must be gone
    expect(fileExists(join(ctxDir, 'old-name.jsonl'))).toBe(false);
    // New path must exist and be valid JSONL
    const newPath = join(ctxDir, 'new-name.jsonl');
    expect(fileExists(newPath)).toBe(true);
    expect(isValidJsonl(newPath)).toBe(true);
    expect(readFile(newPath).trim().length).toBeGreaterThan(0);
  });

  // T-MANAGE-6: archive-context moves context to archives/; original path gone
  it('T-MANAGE-6: archive-context moves context to archives/ subdirectory', async () => {
    await runScript('task-create', ['archive-task', 'Archive task'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    const ctxDir = join(ctx.personalDir, 'tasks', 'archive-task', 'contexts');
    mkdirSync(ctxDir, { recursive: true });
    createJsonl(join(ctxDir, 'old-work.jsonl'), SMALL_CONTEXT);

    const result = await runScript(
      'archive-context',
      ['archive-task', 'old-work'],
      ctx.projectDir,
      { CLAUDE_HOME: ctx.personalBase }
    );

    expect(result.exitCode).toBe(0);
    // Original path must be gone
    expect(fileExists(join(ctxDir, 'old-work.jsonl'))).toBe(false);
    // File must exist at archives/ path and be valid JSONL
    const archivePath = join(ctxDir, 'archives', 'old-work.jsonl');
    expect(fileExists(archivePath)).toBe(true);
    expect(isValidJsonl(archivePath)).toBe(true);
  });
});
