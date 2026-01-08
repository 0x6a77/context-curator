import * as path from 'path';
import * as fs from 'fs/promises';
import { Message } from './types.js';
import { readSession } from './session-reader.js';

/**
 * Project directory naming formula
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
 * Create a backup of a session
 * Returns the backup path
 */
export async function backupSession(sessionId: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `${sessionId}-backup-${timestamp}`;

  try {
    // Read the session
    const session = await readSession(sessionId);

    // Write backup
    await writeSession(backupName, session.messages);

    return backupName;
  } catch (err) {
    throw new Error(`Failed to create backup: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Write a session
 */
export async function writeSession(
  sessionId: string,
  messages: Message[]
): Promise<void> {
  const { sessionsDir } = getSessionPath();

  // Ensure sessions directory exists
  await fs.mkdir(sessionsDir, { recursive: true });

  // Write as flat JSONL file
  const jsonlPath = path.join(sessionsDir, `${sessionId}.jsonl`);
  const jsonlContent = messages.map(m => JSON.stringify(m)).join('\n') + '\n';
  await fs.writeFile(jsonlPath, jsonlContent, 'utf-8');
}

/**
 * Delete a session
 * @param sessionId - Session to delete
 * @param createBackup - Whether to create a backup first
 */
export async function deleteSession(
  sessionId: string,
  createBackup: boolean = true
): Promise<string | null> {
  const { sessionsDir } = getSessionPath();

  let backupName: string | null = null;

  // Create backup if requested
  if (createBackup) {
    backupName = await backupSession(sessionId);
  }

  // Delete the session file
  const sessionPath = path.join(sessionsDir, `${sessionId}.jsonl`);

  try {
    await fs.access(sessionPath);
    await fs.unlink(sessionPath);
    return backupName;
  } catch {
    throw new Error(`Session not found: ${sessionId}`);
  }
}
