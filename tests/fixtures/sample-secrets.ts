/**
 * Sample Secrets Fixtures for Testing Secret Detection
 * 
 * These fixtures provide test data for secret detection:
 * - Various API key formats (AWS, Stripe, GitHub, etc.)
 * - Password patterns
 * - Private keys
 * - False positives (placeholder text that looks like secrets)
 */

import { Message } from '../utils/test-helpers';

/**
 * AWS Access Key pattern
 */
export const AWS_KEY_CONTEXT: Message[] = [
  {
    type: 'user',
    message: {
      role: 'user',
      content: 'Here are the AWS credentials: AKIAIOSFODNN7EXAMPLE',
    },
    timestamp: '2026-01-18T10:00:00.000Z',
  },
  {
    type: 'assistant',
    message: {
      role: 'assistant',
      content: 'I\'ll use that AWS access key. Also need the secret: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    },
    timestamp: '2026-01-18T10:00:05.000Z',
  },
];

/**
 * Stripe API Key patterns
 */
export const STRIPE_KEY_CONTEXT: Message[] = [
  {
    type: 'user',
    message: {
      role: 'user',
      content: 'Use this Stripe test key: sk_test_4eC39HqLyjWDarjtT1zdp7dc',
    },
    timestamp: '2026-01-18T10:00:00.000Z',
  },
  {
    type: 'assistant',
    message: {
      role: 'assistant',
      content: 'Got the test key. For production we have: sk_live_abc123def456ghi789jkl012',
    },
    timestamp: '2026-01-18T10:00:05.000Z',
  },
  {
    type: 'user',
    message: {
      role: 'user',
      content: 'And the publishable key: pk_live_xyz789abc123def456ghi012',
    },
    timestamp: '2026-01-18T10:00:10.000Z',
  },
];

/**
 * GitHub Token patterns
 */
export const GITHUB_TOKEN_CONTEXT: Message[] = [
  {
    type: 'user',
    message: {
      role: 'user',
      content: 'My GitHub token: ghp_abcdefghijklmnopqrstuvwxyz123456',
    },
    timestamp: '2026-01-18T10:00:00.000Z',
  },
  {
    type: 'assistant',
    message: {
      role: 'assistant',
      content: 'Got it. I also see a classic token: github_pat_11ABC123_xyzABCdef456GHI789jkl012mno345',
    },
    timestamp: '2026-01-18T10:00:05.000Z',
  },
];

/**
 * Private Key pattern (SSH)
 */
export const PRIVATE_KEY_CONTEXT: Message[] = [
  {
    type: 'user',
    message: {
      role: 'user',
      content: `Here's the SSH key:
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA2mKqH0z1lCTz4j8wXn1abcd
efghijklmnopqrstuvwxyz1234567890ABCDEFG
HIJKLMNOPQRSTUVWXYZ/+abcdefghijklmnopqr
-----END RSA PRIVATE KEY-----`,
    },
    timestamp: '2026-01-18T10:00:00.000Z',
  },
];

/**
 * Generic Password patterns
 */
export const PASSWORD_CONTEXT: Message[] = [
  {
    type: 'user',
    message: {
      role: 'user',
      content: 'Database connection: password=MySecretPassword123!',
    },
    timestamp: '2026-01-18T10:00:00.000Z',
  },
  {
    type: 'assistant',
    message: {
      role: 'assistant',
      content: 'Got it. The config shows: DB_PASSWORD="superSecretPwd456"',
    },
    timestamp: '2026-01-18T10:00:05.000Z',
  },
];

/**
 * Multiple secrets in one message
 */
export const MULTIPLE_SECRETS_CONTEXT: Message[] = [
  {
    type: 'user',
    message: {
      role: 'user',
      content: `Here are all the credentials:
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STRIPE_SECRET_KEY=sk_live_abc123def456
GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz123456
DATABASE_PASSWORD=superSecret!123`,
    },
    timestamp: '2026-01-18T10:00:00.000Z',
  },
];

/**
 * False positives - text that looks like secrets but isn't
 */
export const FALSE_POSITIVES_CONTEXT: Message[] = [
  {
    type: 'user',
    message: {
      role: 'user',
      content: 'The AWS docs use AKIAIOSFODNN7EXAMPLE as a placeholder.',
    },
    timestamp: '2026-01-18T10:00:00.000Z',
  },
  {
    type: 'assistant',
    message: {
      role: 'assistant',
      content: 'Yes, and sk_test_123 is commonly used in Stripe examples.',
    },
    timestamp: '2026-01-18T10:00:05.000Z',
  },
  {
    type: 'user',
    message: {
      role: 'user',
      content: 'In the config template: api_key: YOUR_API_KEY_HERE',
    },
    timestamp: '2026-01-18T10:00:10.000Z',
  },
  {
    type: 'assistant',
    message: {
      role: 'assistant',
      content: 'And password=<your-password> is a placeholder.',
    },
    timestamp: '2026-01-18T10:00:15.000Z',
  },
];

/**
 * Clean context with no secrets
 */
export const CLEAN_CONTEXT: Message[] = [
  {
    type: 'user',
    message: {
      role: 'user',
      content: 'Let\'s discuss the architecture without any credentials.',
    },
    timestamp: '2026-01-18T10:00:00.000Z',
  },
  {
    type: 'assistant',
    message: {
      role: 'assistant',
      content: 'Good idea! The service layer handles authentication internally.',
    },
    timestamp: '2026-01-18T10:00:05.000Z',
  },
  {
    type: 'user',
    message: {
      role: 'user',
      content: 'Environment variables are loaded from .env files.',
    },
    timestamp: '2026-01-18T10:00:10.000Z',
  },
];

/**
 * Known secret patterns for testing detection
 */
export const SECRET_PATTERNS = {
  // AWS patterns
  AWS_ACCESS_KEY: /AKIA[0-9A-Z]{16}/,
  AWS_SECRET_KEY: /[A-Za-z0-9/+]{40}/,
  
  // Stripe patterns
  STRIPE_LIVE_KEY: /sk_live_[a-zA-Z0-9]{24,}/,
  STRIPE_TEST_KEY: /sk_test_[a-zA-Z0-9]{24,}/,
  STRIPE_PUBLISHABLE: /pk_(live|test)_[a-zA-Z0-9]{24,}/,
  
  // GitHub patterns
  GITHUB_PAT: /ghp_[a-zA-Z0-9]{36}/,
  GITHUB_PAT_FINE: /github_pat_[a-zA-Z0-9_]{22,}/,
  GITHUB_OAUTH: /gho_[a-zA-Z0-9]{36}/,
  
  // Private key patterns
  PRIVATE_KEY_RSA: /-----BEGIN RSA PRIVATE KEY-----/,
  PRIVATE_KEY_EC: /-----BEGIN EC PRIVATE KEY-----/,
  PRIVATE_KEY_GENERIC: /-----BEGIN PRIVATE KEY-----/,
  
  // Generic patterns
  PASSWORD_ASSIGNMENT: /password\s*[=:]\s*["']?[^\s"']{8,}/i,
  API_KEY_ASSIGNMENT: /api[_-]?key\s*[=:]\s*["']?[a-zA-Z0-9_-]{20,}/i,
};

/**
 * Test data for secret detection validation
 */
export const SECRET_TEST_CASES = [
  {
    name: 'AWS Access Key',
    input: 'AKIAIOSFODNN7EXAMPLE',
    shouldDetect: true,
    type: 'aws_access_key',
  },
  {
    name: 'Stripe Live Key',
    input: 'sk_live_4eC39HqLyjWDarjtT1zdp7dc',
    shouldDetect: true,
    type: 'stripe_secret_key',
  },
  {
    name: 'Stripe Test Key',
    input: 'sk_test_4eC39HqLyjWDarjtT1zdp7dc',
    shouldDetect: true,
    type: 'stripe_test_key',
  },
  {
    name: 'GitHub Personal Access Token',
    input: 'ghp_abcdefghijklmnopqrstuvwxyz123456',
    shouldDetect: true,
    type: 'github_token',
  },
  {
    name: 'Placeholder API key',
    input: 'YOUR_API_KEY_HERE',
    shouldDetect: false,
    type: 'placeholder',
  },
  {
    name: 'Example AWS key from docs',
    input: 'AKIAIOSFODNN7EXAMPLE',
    shouldDetect: true, // Detection should flag it, but with low confidence
    type: 'aws_access_key',
  },
];
