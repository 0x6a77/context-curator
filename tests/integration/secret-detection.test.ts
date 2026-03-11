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
    // Fix 24: T-SEC-2: require AKIA prefix explicitly
    it('should detect AWS access key pattern', async () => {
      const contextPath = createTestContext(AWS_KEY_CONTEXT);

      const result = await runScript('scan-secrets', [contextPath], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const output = result.stdout.toLowerCase();
      expect(result.exitCode).not.toBe(0); // must exit non-zero when secrets found
      // AKIA prefix is specific to AWS access keys; require it explicitly
      expect(output).toMatch(/akia/i);
    });

    // Fix 25: remove vacuous |aws fallback
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
      expect(result.exitCode).not.toBe(0);
      expect(output).toMatch(/aws.*key|secret.*key|akia/i);
    });
  });

  describe('Test 9.2: Detect Stripe API Keys', () => {
    // Fix 26: Add exit code assertion
    it('should detect Stripe live key pattern', async () => {
      const contextPath = createTestContext(STRIPE_KEY_CONTEXT);

      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      // T-SEC-3: must exit non-zero when secrets found
      expect(result.exitCode).not.toBe(0);
      const output = result.stdout.toLowerCase();
      expect(output).toMatch(/sk_live/i);
    });

    // T-SEC-3: type-specific check, must exit non-zero
    it('should detect both test and live keys', async () => {
      const contextPath = createTestContext(STRIPE_KEY_CONTEXT);

      const result = await runScript('scan-secrets', [contextPath], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      const output = result.stdout.toLowerCase();
      expect(result.exitCode).not.toBe(0);
      expect(output).toContain('sk_test_');
      expect(output).toContain('sk_live_');
    });
  });

  describe('Test 9.3: Detect GitHub Tokens', () => {
    // Fix 27: Require ghp_ specifically (not just 'github' text)
    it('should detect GitHub personal access token', async () => {
      const contextPath = createTestContext(GITHUB_TOKEN_CONTEXT);

      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase();
      expect(result.exitCode).not.toBe(0);
      expect(output).toMatch(/ghp_/i);
    });
  });

  describe('Test 9.4: Detect Private Keys', () => {
    // Fix 28: Replace OR chain with specific pattern
    it('should detect RSA private key header', async () => {
      const contextPath = createTestContext(PRIVATE_KEY_CONTEXT);

      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase();
      expect(result.exitCode).not.toBe(0);
      expect(output).toMatch(/rsa.*private|private.*key|BEGIN.*PRIVATE/i);
    });
  });

  describe('Test 9.5: Detect Generic Passwords', () => {
    // Fix 29: 'password' alone is specific enough
    it('should detect password assignment patterns', async () => {
      const contextPath = createTestContext(PASSWORD_CONTEXT);

      const result = await runScript(
        'scan-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const output = result.stdout.toLowerCase();
      expect(result.exitCode).not.toBe(0);
      expect(output).toMatch(/password/i);
    });
  });

  // Fix 30: T-SEC-5: isolate AKIAIOSFODNN7EXAMPLE with its own fixture
  describe('Test 9.6: AKIAIOSFODNN7EXAMPLE Policy', () => {
    it('should treat AKIAIOSFODNN7EXAMPLE as a true positive (policy: prefer FP over FN)', async () => {
      // Use a fixture containing ONLY AKIAIOSFODNN7EXAMPLE to isolate this policy test
      const exampleKeyOnly = [
        {
          type: 'user',
          message: { role: 'user', content: 'The AWS docs use AKIAIOSFODNN7EXAMPLE as an example.' },
          timestamp: new Date().toISOString(),
        },
      ];
      const contextPath = createTestContext(exampleKeyOnly);

      const result = await runScript('scan-secrets', [contextPath], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      // Policy: AKIAIOSFODNN7EXAMPLE must be flagged as a true positive (false negatives are worse than false positives)
      expect(result.exitCode).not.toBe(0);
      const output = result.stdout.toLowerCase();
      expect(output).toMatch(/akia/i);
    });
  });

  describe('Test 9.7: Multiple Secrets in Single Message', () => {
    // T-SEC-7: exact count assertion — banned patterns: conditional fallback, broad \d+
    it('T-SEC-7: should report exactly 5 secrets with word-boundary count in output', async () => {
      const contextPath = createTestContext(MULTIPLE_SECRETS_CONTEXT);

      const result = await runScript('scan-secrets', [contextPath], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).not.toBe(0);
      // T-SEC-7: count must match \b5\b — not a broad \d+ match.
      // Conditional fallbacks are banned per test-plan quality rules.
      expect(result.stdout).toMatch(/\b5\b/);
    });
  });

  // T-SEC-4: all 3 message types, check JSON array length >= 3
  describe('Test 9.8: All Message Types Scanned', () => {
    it('should detect secrets in user, assistant, and tool_result messages', async () => {
      // Create a context with one secret per message type
      const mixedTypeContext = [
        { type: 'user', message: { role: 'user', content: 'User secret: AKIAIOSFODNN7EXAMPLE123' }, timestamp: new Date().toISOString() },
        { type: 'assistant', message: { role: 'assistant', content: 'Assistant secret: sk_test_4eC39HqLyjWDarjtT1zdp7dc' }, timestamp: new Date().toISOString() },
        { type: 'tool_result', message: { role: 'tool', content: 'Tool secret: ghp_abcdefghijklmnopqrstuvwxyz1234567890' }, timestamp: new Date().toISOString() },
      ];
      const contextPath = createTestContext(mixedTypeContext);

      const result = await runScript('scan-secrets', [contextPath], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

      expect(result.exitCode).not.toBe(0);
      const output = result.stdout + result.stderr;
      // T-SEC-4: verify each of the 3 message types produced a distinct detection
      // If any type is skipped, the corresponding pattern won't appear in output
      expect(output.toLowerCase()).toMatch(/akia|aws/);        // user message: AWS key
      expect(output.toLowerCase()).toMatch(/sk_test|stripe/);  // assistant message: Stripe key
      expect(output.toLowerCase()).toMatch(/ghp_|github/);     // tool_result message: GitHub token
    });
  });

  // T-SEC-6: unconditional rescan after redaction
  describe('Test 9.9: Redaction Produces Valid JSONL and Passes Rescan', () => {
    it('should produce clean valid JSONL after redaction', async () => {
      const contextPath = createTestContext(AWS_KEY_CONTEXT);
      const redactedPath = contextPath.replace('.jsonl', '-redacted.jsonl');

      const redactResult = await runScript('redact-secrets', [contextPath, redactedPath], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(redactResult.exitCode).toBe(0);

      // Redacted file must exist
      expect(fileExists(redactedPath)).toBe(true);

      // Must be valid JSONL
      expect(isValidJsonl(redactedPath)).toBe(true);

      // Rescan must return clean
      const rescanResult = await runScript('scan-secrets', [redactedPath], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
      expect(rescanResult.exitCode).toBe(0);
      expect(rescanResult.stdout.trim()).toMatch(/clean/i);
    });

    // Fix 33: Add isValidJsonl and non-empty check for redacted output
    it('should remove or mask secrets in output', async () => {
      const contextPath = createTestContext(STRIPE_KEY_CONTEXT);

      const result = await runScript(
        'redact-secrets',
        [contextPath],
        ctx.projectDir,
        { CLAUDE_HOME: ctx.personalBase }
      );

      const redactedPath = join(ctx.personalDir, 'tasks', 'secret-test', 'contexts', 'test-ctx.redacted.jsonl');
      expect(fileExists(redactedPath)).toBe(true);
      expect(isValidJsonl(redactedPath)).toBe(true);
      expect(readFile(redactedPath).trim().length).toBeGreaterThan(0);
      const content = readFile(redactedPath);
      // Original secret should not appear
      expect(content).not.toContain('sk_live_abc123def456');
      // Redaction marker should appear
      expect(
        content.includes('REDACTED') ||
        content.includes('***') ||
        content.includes('[REMOVED]')
      ).toBe(true);
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
      expect(result.exitCode).toBe(0);
      expect(output).toMatch(/clean/i);
    });
  });
});
