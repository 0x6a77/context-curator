#!/usr/bin/env tsx
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Project directory naming formula
 */
function getProjectDir(cwd: string): string {
  return cwd.replace(/\//g, '-');
}

/**
 * Get path to session file (auto-detect named vs unnamed)
 */
async function getSessionPath(sessionId: string): Promise<string> {
  const cwd = process.cwd();
  const projectDir = getProjectDir(cwd);
  const homeDir = process.env.HOME!;

  // Try named first (directory structure)
  const namedPath = path.join(homeDir, '.claude', 'sessions', sessionId, 'conversation.jsonl');
  try {
    await fs.access(namedPath);
    return namedPath;
  } catch {
    // Try unnamed (flat file)
    const unnamedPath = path.join(homeDir, '.claude', 'projects', projectDir, `${sessionId}.jsonl`);
    try {
      await fs.access(unnamedPath);
      return unnamedPath;
    } catch {
      throw new Error(`Session not found: ${sessionId}`);
    }
  }
}

/**
 * Format message content for display
 */
function formatMessageContent(message: any): string {
  // If message has a "message" property with content
  if (message.message?.content) {
    const content = message.message.content;

    if (typeof content === 'string') {
      return content;
    }

    // Handle array of content blocks
    if (Array.isArray(content)) {
      return content
        .map(block => {
          if (typeof block === 'string') {
            return block;
          }
          if (block.type === 'text') {
            return block.text;
          }
          if (block.type === 'thinking') {
            return `[THINKING]\n${block.thinking}`;
          }
          if (block.type === 'tool_use') {
            return `[Tool Use: ${block.name}]\n${JSON.stringify(block.input, null, 2)}`;
          }
          if (block.type === 'tool_result') {
            return `[Tool Result]\n${typeof block.content === 'string' ? block.content : JSON.stringify(block.content, null, 2)}`;
          }
          return JSON.stringify(block, null, 2);
        })
        .join('\n\n');
    }

    return JSON.stringify(content, null, 2);
  }

  // For file-history-snapshot and summary types
  if (message.type === 'file-history-snapshot') {
    return JSON.stringify(message.snapshot, null, 2);
  }

  if (message.type === 'summary') {
    return message.summary || JSON.stringify(message, null, 2);
  }

  // Fallback - show full message as JSON
  return JSON.stringify(message, null, 2);
}

async function main() {
  const sessionId = process.argv[2];
  const filterType = process.argv[3]; // Optional type filter

  if (!sessionId) {
    console.error('Usage: npm run dump <session-id> [type]');
    console.error('');
    console.error('Arguments:');
    console.error('  session-id    Session to dump (named or UUID)');
    console.error('  type          Optional: Filter by message type (user, assistant, file-history-snapshot, summary)');
    console.error('');
    console.error('Examples:');
    console.error('  npm run dump 8e14f625-bd1a-4e79-a382-2d6c0649df97');
    console.error('  npm run dump 8e14f625-bd1a-4e79-a382-2d6c0649df97 user');
    console.error('  npm run dump context-curator assistant');
    process.exit(1);
  }

  try {
    const sessionPath = await getSessionPath(sessionId);
    const content = await fs.readFile(sessionPath, 'utf-8');

    // Parse JSONL
    const allMessages = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    // Filter by type if specified
    const messages = filterType
      ? allMessages.filter(msg => msg.type === filterType)
      : allMessages;

    // Sort by timestamp
    messages.sort((a, b) => {
      const timestampA = a.timestamp || a.snapshot?.timestamp;
      const timestampB = b.timestamp || b.snapshot?.timestamp;
      const timeA = timestampA ? new Date(timestampA).getTime() : 0;
      const timeB = timestampB ? new Date(timestampB).getTime() : 0;
      return timeA - timeB;
    });

    // Display header
    console.log(`\nSession Dump: ${sessionId}`);
    if (filterType) {
      console.log(`Filter: type == "${filterType}"`);
    }
    console.log(`Total messages: ${messages.length} ${filterType ? `(of ${allMessages.length} total)` : ''}`);
    console.log('═'.repeat(70));
    console.log('');

    // Display messages
    for (const message of messages) {
      const type = message.type || 'unknown';
      // Get timestamp from message, or from snapshot for file-history-snapshot types
      const timestamp = message.timestamp || message.snapshot?.timestamp || '(no timestamp)';
      const content = formatMessageContent(message);

      console.log(`--- MESSAGE ${type} ${timestamp}`);
      console.log(content);
      console.log('');
    }

    console.log('═'.repeat(70));
    console.log(`\nEnd of dump\n`);

  } catch (err) {
    console.error(`\n❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}\n`);
    process.exit(1);
  }
}

main().catch(console.error);
