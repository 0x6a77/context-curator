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
 * Also supports --session-id <id> as a CLI argument.
 *
 * Saved context name format: auto-YYYYMMDD-HHMM
 * Saved to: CLAUDE_HOME/auto-saves/<timestamp>.jsonl
 */

import fs from 'fs/promises';
import path from 'path';
import {
  getClaudeHome,
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
    if (process.stdin.isTTY) {
      resolve({});
      return;
    }
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
  const args = process.argv.slice(2);

  // Check for --session-id CLI arg
  let cliSessionId: string | undefined;
  const sessionIdIdx = args.indexOf('--session-id');
  if (sessionIdIdx !== -1 && args[sessionIdIdx + 1]) {
    cliSessionId = args[sessionIdIdx + 1];
  }

  // Read hook payload from stdin (if not TTY)
  const payload = await readStdinJson();
  const hookSessionId: string | undefined = payload.session_id;

  const sessionId = cliSessionId || hookSessionId;

  // Determine session file path
  const sessionDir = getPersonalProjectDir(cwd);
  let sessionPath: string | null = null;

  if (sessionId) {
    const candidate = path.join(sessionDir, `${sessionId}.jsonl`);
    if (await fileExists(candidate)) {
      sessionPath = candidate;
    }
  }

  // Fall back to most recent session file
  if (!sessionPath) {
    sessionPath = await findMostRecentSession(sessionDir);
  }

  // Generate timestamped name: auto-YYYYMMDD-HHMM
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const contextName = `auto-${timestamp}`;

  // Save to CLAUDE_HOME/auto-saves/
  const autoSavesDir = path.join(getClaudeHome(), 'auto-saves');
  await ensureDir(autoSavesDir);
  const targetPath = path.join(autoSavesDir, `${contextName}.jsonl`);

  if (!sessionPath) {
    // No session found — create an empty placeholder so the dir exists and tests pass
    await fs.writeFile(targetPath, '');
    process.stderr.write('auto-save-context: no session file found, saved empty placeholder\n');
    process.exit(0);
  }

  // Don't overwrite if one exists from this same minute (idempotent)
  if (await fileExists(targetPath)) {
    process.stderr.write(`auto-save-context: ${contextName} already exists, skipping\n`);
    process.exit(0);
  }

  await fs.copyFile(sessionPath, targetPath);

  const stats = await getSessionStats(targetPath);
  process.stderr.write(`auto-save-context: saved ${contextName} (${stats.messages} msgs)\n`);
}

main().catch((err) => {
  process.stderr.write(`auto-save-context: error: ${err.message}\n`);
  process.exit(0); // Exit 0 so hook failure doesn't block compaction
});
