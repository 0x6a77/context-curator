#!/usr/bin/env tsx

/**
 * auto-save-context.ts - Auto-save context before compaction (PreCompact hook)
 *
 * Called by Claude Code's PreCompact hook. Reads hook payload from stdin,
 * extracts session_id, and saves current session as a timestamped personal context
 * so no context is ever lost to auto-compact.
 *
 * Hook payload format (from Claude Code):
 *   { "session_id": "<uuid>", "project_dir": "<path>", ... }
 *
 * Saved context name format: auto-YYYYMMDD-HHMM
 */

import fs from 'fs/promises';
import path from 'path';
import {
  getProjectId,
  getPersonalProjectDir,
  getPersonalTasksDir,
  getCurrentTask,
  getSessionStats,
  ensureDir,
  fileExists,
} from '../src/utils.js';

async function readStdinJson(): Promise<Record<string, any>> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    // If stdin is not piped, resolve immediately after short timeout
    setTimeout(() => resolve({}), 500);
  });
}

async function findMostRecentSession(sessionDir: string): Promise<string | null> {
  try {
    const entries = await fs.readdir(sessionDir);
    const jsonlFiles = entries.filter(f => f.match(/^[0-9a-f-]{36}\.jsonl$/));

    let mostRecentPath: string | null = null;
    let mostRecentMtime: Date | null = null;

    for (const file of jsonlFiles) {
      const filePath = path.join(sessionDir, file);
      const stats = await fs.stat(filePath);
      if (!mostRecentMtime || stats.mtime > mostRecentMtime) {
        mostRecentMtime = stats.mtime;
        mostRecentPath = filePath;
      }
    }

    return mostRecentPath;
  } catch {
    return null;
  }
}

async function main() {
  const cwd = process.cwd();

  // Read hook payload from stdin
  const payload = await readStdinJson();
  const hookSessionId: string | undefined = payload.session_id;

  // Determine session file path
  const sessionDir = getPersonalProjectDir(cwd);
  let sessionPath: string | null = null;

  if (hookSessionId) {
    const candidate = path.join(sessionDir, `${hookSessionId}.jsonl`);
    if (await fileExists(candidate)) {
      sessionPath = candidate;
    }
  }

  // Fall back to most recent session file
  if (!sessionPath) {
    sessionPath = await findMostRecentSession(sessionDir);
  }

  if (!sessionPath) {
    process.stderr.write('auto-save-context: no session file found, skipping\n');
    process.exit(0);
  }

  // Get current task
  const taskId = await getCurrentTask(cwd);

  // Generate timestamped name: auto-YYYYMMDD-HHMM
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const contextName = `auto-${timestamp}`;

  // Save path
  const contextsDir = path.join(getPersonalTasksDir(cwd), taskId, 'contexts');
  const targetPath = path.join(contextsDir, `${contextName}.jsonl`);

  // Don't overwrite if one exists from this same minute (idempotent)
  if (await fileExists(targetPath)) {
    process.stderr.write(`auto-save-context: ${contextName} already exists, skipping\n`);
    process.exit(0);
  }

  await ensureDir(contextsDir);
  await fs.copyFile(sessionPath, targetPath);

  const stats = await getSessionStats(targetPath);
  process.stderr.write(`auto-save-context: saved ${contextName} (${stats.messages} msgs, task: ${taskId})\n`);
}

main().catch((err) => {
  process.stderr.write(`auto-save-context: error: ${err.message}\n`);
  process.exit(0); // Exit 0 so hook failure doesn't block compaction
});
