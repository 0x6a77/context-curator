import * as path from 'path';
import * as fs from 'fs/promises';
import { Session, Message, SessionMetadata, SessionList } from './types.js';

/**
 * Project directory naming formula
 * Converts /Users/dev/my-project → -Users-dev-my-project
 */
function getProjectDir(cwd: string): string {
  return cwd.replace(/\//g, '-');
}

/**
 * Get paths for both session types
 */
function getSessionPaths() {
  const cwd = process.cwd();
  const projectDir = getProjectDir(cwd);
  const homeDir = process.env.HOME!;

  return {
    namedSessionsDir: path.join(homeDir, '.claude', 'sessions'),
    unnamedSessionsDir: path.join(homeDir, '.claude', 'projects', projectDir),
    projectDir,
    cwd
  };
}

/**
 * List all session IDs (named + unnamed for current project)
 */
export async function listSessionIds(): Promise<SessionList> {
  const { namedSessionsDir, unnamedSessionsDir } = getSessionPaths();

  // Named sessions
  let named: string[] = [];
  try {
    const entries = await fs.readdir(namedSessionsDir);
    named = entries.filter(e => {
      // Filter out agent sessions and hidden files
      return !e.startsWith('agent-') && !e.startsWith('.');
    });
  } catch (err) {
    // No named sessions directory
  }

  // Unnamed sessions for this project
  let unnamed: string[] = [];
  try {
    const entries = await fs.readdir(unnamedSessionsDir);
    unnamed = entries
      .filter(e => {
        // UUID pattern: starts with hex chars and ends with .jsonl
        return e.endsWith('.jsonl') &&
               !e.startsWith('agent-') &&
               /^[0-9a-f]{8}-/.test(e);
      })
      .map(e => e.replace('.jsonl', ''));
  } catch (err) {
    // No unnamed sessions for this project
  }

  return { named, unnamed };
}

/**
 * Read a session (auto-detect named vs unnamed)
 */
export async function readSession(sessionId: string): Promise<Session> {
  const { namedSessionsDir, unnamedSessionsDir } = getSessionPaths();

  // Try named first (directory structure)
  const namedPath = path.join(namedSessionsDir, sessionId, 'conversation.jsonl');
  const unnamedPath = path.join(unnamedSessionsDir, `${sessionId}.jsonl`);

  let jsonlPath: string;
  let isNamed: boolean;

  try {
    await fs.access(namedPath);
    jsonlPath = namedPath;
    isNamed = true;
  } catch {
    // Try unnamed (flat file)
    try {
      await fs.access(unnamedPath);
      jsonlPath = unnamedPath;
      isNamed = false;
    } catch {
      throw new Error(`Session not found: ${sessionId}`);
    }
  }

  // Read conversation
  const content = await fs.readFile(jsonlPath, 'utf-8');
  const messages: Message[] = content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));

  // Read metadata
  let metadata: SessionMetadata;
  if (isNamed) {
    // Named sessions have metadata.json
    try {
      const metadataPath = path.join(namedSessionsDir, sessionId, 'metadata.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(metadataContent);
    } catch {
      metadata = {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  } else {
    // Unnamed sessions: use file stats
    const stats = await fs.stat(jsonlPath);
    metadata = {
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString()
    };
  }

  return {
    id: sessionId,
    messages,
    metadata,
    messageCount: messages.length,
    tokenCount: estimateTokens(messages),
    isNamed,
    directory: process.cwd()
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
    } else {
      text = JSON.stringify(msg);
    }
    return sum + text.length;
  }, 0);
  return Math.ceil(totalChars / 4);
}
