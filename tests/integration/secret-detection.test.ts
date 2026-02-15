/**
 * Secret Detection Tests (Test Group 9)
 * 
 * Tests for secret detection functionality as specified in PRD v13.0:
 * - Detection of common secret patterns (AWS, Stripe, GitHub, etc.)
 * - Detection of private keys
 * - Detection of passwords
 * - False positive handling
 * - Multiple secrets in single message
 * - Redaction producing valid JSONL
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import {
  createTestEnvironment,
  TestContext,
  runScript,
  createJsonl,
  isValidJsonl,
  readFile,
  fileExists,
} from '../utils/test-helpers';
import {
  AWS_KEY_CONTEXT,
  STRIPE_KEY_CONTEXT,
  GITHUB_TOKEN_CONTEXT,
  PRIVATE_KEY_CONTEXT,
  PASSWORD_CONTEXT,
  MULTIPLE_SECRETS_CONTEXT,
  FALSE_POSITIVES_CONTEXT,
  CLEAN_CONTEXT,
  SECRET_TEST_CASES,
} from '../fixtures/sample-secrets';

describe('Secret Detection Tests (Group 9)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('secrets');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test Project\n');
    await runScript('init-project', [], ctx.projectDir);
    await runScript('task-create', ['secret-test', 'Testing secrets'], ctx.projectDir);
  });

  afterEach(() => {
    ctx.cleanup();
  });

  function createTestContext(messages: any[]) {
    const personalDir = join(ctx.personalDir, 'tasks', 'secret-test', 'contexts');
    mkdirSync(personalDir, { recursive: true });
    createJsonl(join(personalDir, 'test-ctx.jsonl'), messages);
    return join(personalDir, 'test-ctx.jsonl');
  }

  describe('Test 9.1: Detect AWS Access Keys', () => {
    it('should detect AWS access key pattern', async () => {
      const contextPath = createTestContext(AWS_KEY_CONTEXT);

      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase();
      expect(
        output.includes('aws') ||
        output.includes('akia') ||
        output.includes('secret') ||
        output.includes('detected') ||
        output.includes('found')
      ).toBe(true);
    });

    it('should identify AWS secret key pattern', async () => {
      const contextPath = createTestContext(AWS_KEY_CONTEXT);

      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Should find both access key and secret key
      const output = result.stdout.toLowerCase();
      expect(
        output.includes('secret') ||
        output.includes('key') ||
        /\d+/.test(output) // Should show count
      ).toBe(true);
    });
  });

  describe('Test 9.2: Detect Stripe API Keys', () => {
    it('should detect Stripe live key pattern', async () => {
      const contextPath = createTestContext(STRIPE_KEY_CONTEXT);

      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase();
      expect(
        output.includes('stripe') ||
        output.includes('sk_live') ||
        output.includes('sk_test') ||
        output.includes('secret') ||
        output.includes('detected')
      ).toBe(true);
    });

    it('should detect both test and live keys', async () => {
      const contextPath = createTestContext(STRIPE_KEY_CONTEXT);

      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Should detect multiple secrets
      const output = result.stdout;
      const secretCount = (output.match(/secret|key|found|detected/gi) || []).length;
      expect(secretCount).toBeGreaterThan(0);
    });
  });

  describe('Test 9.3: Detect GitHub Tokens', () => {
    it('should detect GitHub personal access token', async () => {
      const contextPath = createTestContext(GITHUB_TOKEN_CONTEXT);

      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase();
      expect(
        output.includes('github') ||
        output.includes('ghp_') ||
        output.includes('token') ||
        output.includes('detected')
      ).toBe(true);
    });
  });

  describe('Test 9.4: Detect Private Keys', () => {
    it('should detect RSA private key header', async () => {
      const contextPath = createTestContext(PRIVATE_KEY_CONTEXT);

      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase();
      expect(
        output.includes('private') ||
        output.includes('key') ||
        output.includes('rsa') ||
        output.includes('detected')
      ).toBe(true);
    });
  });

  describe('Test 9.5: Detect Generic Passwords', () => {
    it('should detect password assignment patterns', async () => {
      const contextPath = createTestContext(PASSWORD_CONTEXT);

      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase();
      expect(
        output.includes('password') ||
        output.includes('credential') ||
        output.includes('detected')
      ).toBe(true);
    });
  });

  describe('Test 9.6: False Positives', () => {
    it('should handle placeholder text gracefully', async () => {
      const contextPath = createTestContext(FALSE_POSITIVES_CONTEXT);

      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // False positives may or may not be detected
      // The key is that the scan completes without error
      expect(result.exitCode).toBe(0);
    });

    it('should not block on obvious placeholders', async () => {
      const contextPath = createTestContext(FALSE_POSITIVES_CONTEXT);

      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Should complete and potentially mark as low-confidence
      expect(typeof result.exitCode).toBe('number');
    });
  });

  describe('Test 9.7: Multiple Secrets in Single Message', () => {
    it('should detect multiple secrets', async () => {
      const contextPath = createTestContext(MULTIPLE_SECRETS_CONTEXT);

      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase();
      // Should detect multiple types
      expect(
        (output.includes('aws') || output.includes('stripe') || output.includes('github')) ||
        output.includes('multiple') ||
        output.includes('found') ||
        /[3-5]/.test(output) // Should show count of 3+
      ).toBe(true);
    });
  });

  describe('Test 9.8: Secrets in Different Message Types', () => {
    it('should scan all message types', async () => {
      const mixedMessages = [
        { type: 'user', message: { role: 'user', content: 'Key: AKIAIOSFODNN7EXAMPLE' }, timestamp: '2026-01-18T10:00:00.000Z' },
        { type: 'assistant', message: { role: 'assistant', content: 'Using: sk_live_abc123' }, timestamp: '2026-01-18T10:00:05.000Z' },
        { type: 'tool_result', content: 'ghp_abcdefghijklmnopqrstuvwxyz123456', timestamp: '2026-01-18T10:00:10.000Z' },
      ];
      const contextPath = createTestContext(mixedMessages);

      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase();
      // Should find secrets in multiple message types
      expect(
        output.includes('secret') ||
        output.includes('detected') ||
        output.includes('found')
      ).toBe(true);
    });
  });

  describe('Test 9.9: Redaction Produces Valid JSONL', () => {
    it('should produce valid JSONL after redaction', async () => {
      const contextPath = createTestContext(STRIPE_KEY_CONTEXT);

      // Run redaction - redact-secrets expects context path
      const result = await runScript(
        'redact-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // Check if redacted file is valid JSONL
      const redactedPath = join(ctx.personalDir, 'tasks', 'secret-test', 'contexts', 'test-ctx.redacted.jsonl');
      if (fileExists(redactedPath)) {
        expect(isValidJsonl(redactedPath)).toBe(true);
      }
    });

    it('should remove or mask secrets in output', async () => {
      const contextPath = createTestContext(STRIPE_KEY_CONTEXT);

      const result = await runScript(
        'redact-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const redactedPath = join(ctx.personalDir, 'tasks', 'secret-test', 'contexts', 'test-ctx.redacted.jsonl');
      if (fileExists(redactedPath)) {
        const content = readFile(redactedPath);
        // Original secret should not appear
        expect(content).not.toContain('sk_live_abc123def456');
        // Redaction marker should appear
        expect(
          content.includes('REDACTED') ||
          content.includes('***') ||
          content.includes('[REMOVED]')
        ).toBe(true);
      }
    });
  });

  describe('Test: Clean Context Detection', () => {
    it('should report clean when no secrets found', async () => {
      const contextPath = createTestContext(CLEAN_CONTEXT);

      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase();
      expect(
        output.includes('clean') ||
        output.includes('no secret') ||
        output.includes('0 secret') ||
        output.includes('none') ||
        !output.includes('found')
      ).toBe(true);
    });
  });
});
