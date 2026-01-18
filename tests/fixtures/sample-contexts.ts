/**
 * Sample Context Fixtures for Testing
 * 
 * These fixtures provide pre-built test data for various scenarios:
 * - Small, medium, and large contexts
 * - Contexts with secrets
 * - Code-heavy contexts
 * - Empty and minimal contexts
 */

import { Message } from '../utils/test-helpers';

/**
 * Small context (5 messages) - authentication topic
 */
export const SMALL_CONTEXT: Message[] = [
  {
    type: 'user',
    message: { role: 'user', content: "Let's work on authentication" },
    timestamp: '2026-01-18T10:00:00.000Z',
  },
  {
    type: 'assistant',
    message: { role: 'assistant', content: "Great, I'll help with auth. What specifically do you need?" },
    timestamp: '2026-01-18T10:00:05.000Z',
  },
  {
    type: 'user',
    message: { role: 'user', content: 'Focus on OAuth 2.0 flow in src/auth/' },
    timestamp: '2026-01-18T10:00:10.000Z',
  },
  {
    type: 'assistant',
    message: { role: 'assistant', content: "I'll examine the OAuth implementation in src/auth/oauth.ts" },
    timestamp: '2026-01-18T10:00:15.000Z',
  },
  {
    type: 'user',
    message: { role: 'user', content: 'Start with the token refresh logic' },
    timestamp: '2026-01-18T10:00:20.000Z',
  },
];

/**
 * Medium context (30 messages) - database migration topic
 */
export function createMediumContext(): Message[] {
  const messages: Message[] = [];
  const baseTime = new Date('2026-01-18T10:00:00.000Z').getTime();
  
  const conversations = [
    { user: 'Help me with database migration', assistant: 'Sure, what database are you migrating?' },
    { user: 'PostgreSQL to PostgreSQL, schema changes', assistant: 'Got it. Let me check the current schema.' },
    { user: 'The users table needs a new column', assistant: 'I see. We\'ll need to create a migration file.' },
    { user: 'It should be a nullable string', assistant: 'Perfect, I\'ll create an ALTER TABLE statement.' },
    { user: 'Also need to add an index', assistant: 'I\'ll include CREATE INDEX in the migration.' },
    { user: 'Make sure it\'s backward compatible', assistant: 'Yes, nullable columns are backward compatible.' },
    { user: 'What about rollback?', assistant: 'I\'ll create a down migration to remove the column.' },
    { user: 'Test it on staging first', assistant: 'Good idea. Here\'s the test plan.' },
    { user: 'Looks good, proceed', assistant: 'Creating the migration files now.' },
    { user: 'Don\'t forget the foreign key', assistant: 'I\'ll add the FK constraint with proper indexing.' },
    { user: 'What about existing data?', assistant: 'We should backfill the data before adding constraints.' },
    { user: 'Use a batch process', assistant: 'I\'ll create a data migration script with batching.' },
    { user: 'Set batch size to 1000', assistant: 'Good choice for balancing speed and lock time.' },
    { user: 'Monitor for deadlocks', assistant: 'I\'ll add retry logic with exponential backoff.' },
    { user: 'Perfect', assistant: 'Migration plan is complete.' },
  ];
  
  conversations.forEach((conv, i) => {
    messages.push({
      type: 'user',
      message: { role: 'user', content: conv.user },
      timestamp: new Date(baseTime + i * 2000).toISOString(),
    });
    messages.push({
      type: 'assistant',
      message: { role: 'assistant', content: conv.assistant },
      timestamp: new Date(baseTime + i * 2000 + 1000).toISOString(),
    });
  });
  
  return messages;
}

/**
 * Large context (200+ messages) - payment integration topic
 */
export function createLargeContext(): Message[] {
  const messages: Message[] = [];
  const baseTime = new Date('2026-01-18T10:00:00.000Z').getTime();
  
  for (let i = 0; i < 250; i++) {
    const isUser = i % 2 === 0;
    messages.push({
      type: isUser ? 'user' : 'assistant',
      message: {
        role: isUser ? 'user' : 'assistant',
        content: isUser 
          ? `Payment integration question ${Math.floor(i / 2) + 1}: How do we handle ${['webhooks', 'refunds', 'subscriptions', 'invoices', 'disputes'][i % 5]}?`
          : `Here's how to handle it: First, check the API response. Then verify the signature. Finally, process the ${['webhook', 'refund', 'subscription', 'invoice', 'dispute'][i % 5]}.`,
      },
      timestamp: new Date(baseTime + i * 500).toISOString(),
    });
  }
  
  return messages;
}

/**
 * Context with code snippets
 */
export const CODE_HEAVY_CONTEXT: Message[] = [
  {
    type: 'user',
    message: { role: 'user', content: 'Fix the authentication bug' },
    timestamp: '2026-01-18T10:00:00.000Z',
  },
  {
    type: 'assistant',
    message: {
      role: 'assistant',
      content: `Here's the fix for the authentication bug:

\`\`\`typescript
export async function authenticate(user: User): Promise<AuthResult> {
  const token = await validateToken(user.token);
  if (!token.valid) {
    throw new AuthenticationError('Invalid token');
  }
  return {
    authenticated: true,
    user: user.id,
    expires: token.expiresAt,
  };
}
\`\`\`

This handles the edge case where tokens were being accepted even after expiration.`,
    },
    timestamp: '2026-01-18T10:00:05.000Z',
  },
  {
    type: 'user',
    message: { role: 'user', content: 'Also add refresh token support' },
    timestamp: '2026-01-18T10:00:10.000Z',
  },
  {
    type: 'assistant',
    message: {
      role: 'assistant',
      content: `Added refresh token support:

\`\`\`typescript
export async function refreshToken(refreshToken: string): Promise<TokenPair> {
  const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
  
  const newAccessToken = jwt.sign(
    { userId: decoded.userId },
    process.env.ACCESS_SECRET,
    { expiresIn: '15m' }
  );
  
  const newRefreshToken = jwt.sign(
    { userId: decoded.userId },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
\`\`\``,
    },
    timestamp: '2026-01-18T10:00:15.000Z',
  },
];

/**
 * Empty context
 */
export const EMPTY_CONTEXT: Message[] = [];

/**
 * Minimal context (2 messages)
 */
export const MINIMAL_CONTEXT: Message[] = [
  {
    type: 'user',
    message: { role: 'user', content: 'Hi' },
    timestamp: '2026-01-18T10:00:00.000Z',
  },
  {
    type: 'assistant',
    message: { role: 'assistant', content: 'Hello! How can I help you today?' },
    timestamp: '2026-01-18T10:00:01.000Z',
  },
];
