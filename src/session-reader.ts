import * as path from 'path';
import * as fs from 'fs/promises';
import { Session, Message, SessionMetadata } from './types.js';

/**
 * CRITICAL: Always use process.cwd() for directory scoping
 * This ensures the curator operates only on the current directory's sessions
 */
const getSessionsDir = () => path.join(process.cwd(), '.claude', 'sessions');

export async function listSessionIds(): Promise<string[]> {
  const sessionsDir = getSessionsDir();
  
  try {
    const entries = await fs.readdir(sessionsDir);
    return entries.filter(e => e.startsWith('sess-') || e.startsWith('session-'));
  } catch (err) {
    // No sessions directory in this project
    return [];
  }
}

export async function readSession(sessionId: string): Promise<Session> {
  const sessionsDir = getSessionsDir();
  const sessionPath = path.join(sessionsDir, sessionId);
  
  // Read conversation.jsonl
  const jsonlPath = path.join(sessionPath, 'conversation.jsonl');
  const content = await fs.readFile(jsonlPath, 'utf-8');
  
  const messages: Message[] = content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
  
  // Read metadata.json
  let metadata: SessionMetadata;
  try {
    const metadataPath = path.join(sessionPath, 'metadata.json');
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    metadata = JSON.parse(metadataContent);
  } catch {
    // Fallback if metadata doesn't exist
    metadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  return {
    id: sessionId,
    messages,
    metadata,
    messageCount: messages.length,
    tokenCount: estimateTokens(messages),
    directory: process.cwd()
  };
}

export async function sessionExists(sessionId: string): Promise<boolean> {
  const sessionsDir = getSessionsDir();
  const sessionPath = path.join(sessionsDir, sessionId);
  
  try {
    await fs.access(sessionPath);
    return true;
  } catch {
    return false;
  }
}

function estimateTokens(messages: Message[]): number {
  // Rough estimate: ~4 chars per token
  const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  return Math.ceil(totalChars / 4);
}
