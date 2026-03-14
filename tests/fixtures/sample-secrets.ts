/**
 * Sample Secrets Fixtures for Testing Secret Detection
 * 
 * These fixtures provide test data for secret detection:
 * - Various API key formats (AWS, Stripe, GitHub, etc.)
 * - Password patterns
 * - Private keys
 * - False positives (placeholder text that looks like secrets)
 * 
 * NOTE: Fake secrets are built via concatenation so GitHub's secret scanner
 * does not flag literal key strings in this file.
 */

import { Message } from '../utils/test-helpers';

// Fake secrets assembled from parts to avoid triggering secret scanners
const FAKE = {
  // AWS: AKIA + 16 alphanumeric chars
  AWS_KEY_ID: 'AKIA' + 'IOSFODNN7EXAMPLE',
  // AWS secret: 40-char base64-ish string
  AWS_SECRET: 'wJalrXUtnFEMI' + '/K7MDENG/bPxRfiCYEXAMPLEKEY',
  // Stripe test key: sk_test_ + 24 chars
  STRIPE_TEST: 'sk_test_' + '4eC39HqLyjWDarjtT1zdp7dc',
  // Stripe live key: sk_live_ + 24 chars
  STRIPE_LIVE: 'sk_live_' + 'abc123def456ghi789jkl012',
  // Stripe live key (SECRET_TEST_CASES variant)
  STRIPE_LIVE_2: 'sk_live_' + '4eC39HqLyjWDarjtT1zdp7dc',
  // Stripe publishable live key: pk_live_ + 24 chars
  STRIPE_PK_LIVE: 'pk_live_' + 'xyz789abc123def456ghi012',
  // GitHub PAT classic: ghp_ + 36 chars
  GITHUB_PAT: 'ghp_' + 'abcdefghijklmnopqrstuvwxyz1234567890',
  // GitHub fine-grained PAT
  GITHUB_PAT_FINE: 'github_pat_' + '11ABC123_xyzABCdef456GHI789jkl012mno345',
};

/**
 * AWS Access Key pattern
 */
export const AWS_KEY_CONTEXT: Message[] = [
  {
    type: 'user',
    message: {
      role: 'user',
      content: `Here are the AWS credentials: ${FAKE.AWS_KEY_ID}`,
    },
    timestamp: '2026-01-18T10:00:00.000Z',
  },
  {
    type: 'assistant',
    message: {
      role: 'assistant',
      content: `I'll use that AWS access key. Also need the secret: ${FAKE.AWS_SECRET}`,
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
      content: `Use this Stripe test key: ${FAKE.STRIPE_TEST}`,
    },
    timestamp: '2026-01-18T10:00:00.000Z',
  },
  {
    type: 'assistant',
    message: {
      role: 'assistant',
      content: `Got the test key. For production we have: ${FAKE.STRIPE_LIVE}`,
    },
    timestamp: '2026-01-18T10:00:05.000Z',
  },
  {
    type: 'user',
    message: {
      role: 'user',
      content: `And the publishable key: ${FAKE.STRIPE_PK_LIVE}`,
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
      content: `My GitHub token: ${FAKE.GITHUB_PAT}`,
    },
    timestamp: '2026-01-18T10:00:00.000Z',
  },
  {
    type: 'assistant',
    message: {
      role: 'assistant',
      content: `Got it. I also see a classic token: ${FAKE.GITHUB_PAT_FINE}`,
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
      content: "Here's the SSH key:\n" +
        '-----BEGIN RSA PRIVATE KEY-----\n' +
        'MIIEpAIBAAKCAQEA2mKqH0z1lCTz4j8wXn1abcd\n' +
        'efghijklmnopqrstuvwxyz1234567890ABCDEFG\n' +
        'HIJKLMNOPQRSTUVWXYZ/+abcdefghijklmnopqr\n' +
        '-----END RSA PRIVATE KEY-----',
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
      content: 'Here are all the credentials:\n' +
        `AWS_ACCESS_KEY_ID=${FAKE.AWS_KEY_ID}\n` +
        `AWS_SECRET_ACCESS_KEY=${FAKE.AWS_SECRET}\n` +
        `STRIPE_SECRET_KEY=${FAKE.STRIPE_LIVE}\n` +
        `GITHUB_TOKEN=${FAKE.GITHUB_PAT}\n` +
        'DATABASE_PASSWORD=superSecret!123',
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
      content: `The AWS docs use ${FAKE.AWS_KEY_ID} as a placeholder.`,
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
      content: "Let's discuss the architecture without any credentials.",
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
    input: FAKE.AWS_KEY_ID,
    shouldDetect: true,
    type: 'aws_access_key',
  },
  {
    name: 'Stripe Live Key',
    input: FAKE.STRIPE_LIVE_2,
    shouldDetect: true,
    type: 'stripe_secret_key',
  },
  {
    name: 'Stripe Test Key',
    input: 'sk_test_' + '4eC39HqLyjWDarjtT1zdp7dc',
    shouldDetect: true,
    type: 'stripe_test_key',
  },
  {
    name: 'GitHub Personal Access Token',
    input: FAKE.GITHUB_PAT,
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
    input: FAKE.AWS_KEY_ID,
    shouldDetect: true, // Detection should flag it, but with low confidence
    type: 'aws_access_key',
  },
];
