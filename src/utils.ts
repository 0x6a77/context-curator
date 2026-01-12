import fs from 'fs/promises';
import path from 'path';

/**
 * Format a date in a human-readable relative format
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
}

/**
 * Get session statistics from a JSONL file
 */
export async function getSessionStats(sessionPath: string) {
  const content = await fs.readFile(sessionPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  const totalChars = lines.reduce((sum, line) => {
    try {
      const msg = JSON.parse(line);
      const contentStr = typeof msg.content === 'string'
        ? msg.content
        : JSON.stringify(msg.content);
      return sum + contentStr.length;
    } catch {
      return sum;
    }
  }, 0);

  return {
    messages: lines.length,
    tokens: Math.ceil(totalChars / 4)
  };
}

/**
 * Compute the project directory encoding used by Claude Code
 */
export function getProjectDir(cwd: string): string {
  return cwd.replace(/\//g, '-');
}

/**
 * Find a session file in various possible locations
 */
export async function findSessionFile(sessionId: string): Promise<string | null> {
  const cwd = process.cwd();
  const homeDir = process.env.HOME!;
  const projectDir = getProjectDir(cwd);

  const possiblePaths = [
    // Claude Code project-specific location
    path.join(homeDir, '.claude/projects', projectDir, `${sessionId}.jsonl`),
    // Local .claude/sessions (created by prepare-context)
    path.join(cwd, '.claude/sessions', `${sessionId}.jsonl`),
    // Global sessions directory
    path.join(homeDir, '.claude/sessions', `${sessionId}.jsonl`),
  ];

  for (const p of possiblePaths) {
    try {
      await fs.access(p);
      return p;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
