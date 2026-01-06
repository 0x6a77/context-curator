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
 * Get session paths
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
 * Check if sessionId looks like a UUID (unnamed session)
 */
function isUuidLike(sessionId: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(sessionId);
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

    // Write backup as a named session
    await writeSession(backupName, session.messages, true);

    return backupName;
  } catch (err) {
    throw new Error(`Failed to create backup: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Write a session
 * @param sessionId - Session ID or name
 * @param messages - Messages to write
 * @param forceNamed - Force write as named session (for backups/checkpoints)
 */
export async function writeSession(
  sessionId: string,
  messages: Message[],
  forceNamed: boolean = false
): Promise<void> {
  const { namedSessionsDir, unnamedSessionsDir } = getSessionPaths();

  // Determine if this should be a named or unnamed session
  const isNamed = forceNamed || !isUuidLike(sessionId);

  if (isNamed) {
    // Write as named session (directory structure)
    const sessionDir = path.join(namedSessionsDir, sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    // Write conversation.jsonl
    const jsonlPath = path.join(sessionDir, 'conversation.jsonl');
    const jsonlContent = messages.map(m => JSON.stringify(m)).join('\n') + '\n';
    await fs.writeFile(jsonlPath, jsonlContent, 'utf-8');

    // Write metadata.json
    const metadataPath = path.join(sessionDir, 'metadata.json');
    const metadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectPath: process.cwd()
    };
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  } else {
    // Write as unnamed session (flat file)
    await fs.mkdir(unnamedSessionsDir, { recursive: true });
    const jsonlPath = path.join(unnamedSessionsDir, `${sessionId}.jsonl`);
    const jsonlContent = messages.map(m => JSON.stringify(m)).join('\n') + '\n';
    await fs.writeFile(jsonlPath, jsonlContent, 'utf-8');
    // Note: unnamed sessions use file stats for metadata, so no metadata.json
  }
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
  const { namedSessionsDir, unnamedSessionsDir } = getSessionPaths();

  let backupName: string | null = null;

  // Create backup if requested
  if (createBackup) {
    backupName = await backupSession(sessionId);
  }

  // Try named first
  const namedPath = path.join(namedSessionsDir, sessionId);
  const unnamedPath = path.join(unnamedSessionsDir, `${sessionId}.jsonl`);

  try {
    await fs.access(namedPath);
    // It's a named session (directory)
    await fs.rm(namedPath, { recursive: true, force: true });
    return backupName;
  } catch {
    // Try unnamed
    try {
      await fs.access(unnamedPath);
      // It's an unnamed session (flat file)
      await fs.unlink(unnamedPath);
      return backupName;
    } catch {
      throw new Error(`Session not found: ${sessionId}`);
    }
  }
}
