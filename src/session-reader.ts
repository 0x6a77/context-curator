import * as path from 'path';
import * as fs from 'fs/promises';
import { Session, Message, SessionMetadata } from './types.js';

/**
 * Project directory naming formula
 * Converts /Users/dev/my-project → -Users-dev-my-project
 */
function getProjectDir(cwd: string): string {
  return cwd.replace(/\//g, '-');
}

/**
 * Get session storage path for current project
 */
function getSessionPath() {
  const cwd = process.cwd();
  const projectDir = getProjectDir(cwd);
  const homeDir = process.env.HOME!;

  return {
    sessionsDir: path.join(homeDir, '.claude', 'projects', projectDir),
    projectDir,
    cwd
  };
}

/**
 * List all session IDs for current project
 */
export async function listSessionIds(): Promise<string[]> {
  const { sessionsDir } = getSessionPath();

  try {
    const entries = await fs.readdir(sessionsDir);
    return entries
      .filter(e => {
        // UUID pattern: starts with hex chars and ends with .jsonl
        return e.endsWith('.jsonl') &&
               !e.startsWith('agent-') &&
               /^[0-9a-f]{8}-/.test(e);
      })
      .map(e => e.replace('.jsonl', ''));
  } catch (err) {
    // No sessions for this project
    return [];
  }
}

/**
 * Read a session by ID
 */
export async function readSession(sessionId: string): Promise<Session> {
  const { sessionsDir, cwd } = getSessionPath();
  const sessionPath = path.join(sessionsDir, `${sessionId}.jsonl`);

  try {
    await fs.access(sessionPath);
  } catch {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Read conversation
  const content = await fs.readFile(sessionPath, 'utf-8');
  const messages: Message[] = content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));

  // Get metadata from file stats
  const stats = await fs.stat(sessionPath);
  const metadata: SessionMetadata = {
    createdAt: stats.birthtime.toISOString(),
    updatedAt: stats.mtime.toISOString()
  };

  return {
    id: sessionId,
    messages,
    metadata,
    messageCount: messages.length,
    tokenCount: estimateTokens(messages),
    directory: cwd
  };
}

/**
 * Check if session exists
 */
export async function sessionExists(sessionId: string): Promise<boolean> {
  try {
    await readSession(sessionId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Estimate tokens (rough approximation)
 * Handles all message types: user, assistant, summary, file-history-snapshot, system
 */
function estimateTokens(messages: Message[]): number {
  // ~4 chars per token
  const totalChars = messages.reduce((sum, msg) => {
    // Handle different message structures (content, summary, or whole message)
    let text = '';
    if (msg.content) {
      text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
    } else if ((msg as any).summary) {
      text = (msg as any).summary;
    } else if ((msg as any).text) {
      text = (msg as any).text;
    } else {
      // For file-history-snapshot and other types, stringify the whole message
      text = JSON.stringify(msg);
    }
    return sum + text.length;
  }, 0);
  return Math.ceil(totalChars / 4);
}

/**
 * Get the sessions directory path for current project
 */
export function getProjectSessionsDir(): string {
  return getSessionPath().sessionsDir;
}
