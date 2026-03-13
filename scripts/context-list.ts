#!/usr/bin/env tsx

/**
 * context-list.ts - List contexts for a task
 *
 * v14.0: Outputs human-readable formatted text to stdout by default.
 *        Use --json flag for machine-readable JSON output.
 *
 * Lists:
 * - Active sessions from ~/.claude/projects/<project-id>/
 * - Saved personal contexts
 * - Saved golden contexts
 *
 * For STRICT isolation tasks (e.g. adversary), outputs an isolation message
 * instead of listing contexts.
 */

import fs from 'fs/promises';
import path from 'path';
import {
  listContexts,
  formatDate,
  getCurrentTask,
  getProjectId,
  getPersonalProjectDir,
  getSessionStats,
  isStrictIsolationTask,
} from '../src/utils.js';

interface SessionInfo {
  id: string;
  filePath: string;
  messages: number;
  tokens: number;
  lastModified: Date;
  isCurrent: boolean;
}

async function listActiveSessions(cwd: string = process.cwd()): Promise<SessionInfo[]> {
  const sessionsDir = getPersonalProjectDir(cwd);
  const sessions: SessionInfo[] = [];

  try {
    const entries = await fs.readdir(sessionsDir);
    const sessionFiles = entries.filter(f =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jsonl$/i.test(f)
    );

    let mostRecentTime = 0;
    let mostRecentId = '';
    for (const file of sessionFiles) {
      const filePath = path.join(sessionsDir, file);
      const fileStats = await fs.stat(filePath);
      if (fileStats.mtime.getTime() > mostRecentTime) {
        mostRecentTime = fileStats.mtime.getTime();
        mostRecentId = file.replace('.jsonl', '');
      }
    }

    for (const file of sessionFiles) {
      const sessionId = file.replace('.jsonl', '');
      const filePath = path.join(sessionsDir, file);
      try {
        const stats = await getSessionStats(filePath);
        const fileStats = await fs.stat(filePath);
        if (stats.messages === 0) continue;
        sessions.push({
          id: sessionId,
          filePath,
          messages: stats.messages,
          tokens: stats.tokens,
          lastModified: fileStats.mtime,
          isCurrent: sessionId === mostRecentId,
        });
      } catch {
        // skip unreadable files
      }
    }

    sessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  } catch {
    // directory doesn't exist
  }

  return sessions;
}

async function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const taskArg = args.find(a => !a.startsWith('--'));

  const cwd = process.cwd();
  const projectId = getProjectId(cwd);

  // If a task arg was provided, verify it exists
  let taskId: string;
  if (taskArg) {
    const { listTasks } = await import('../src/utils.js');
    const tasks = await listTasks(cwd);
    const found = tasks.find(t => t.id === taskArg);
    if (!found) {
      console.error(`❌ Task '${taskArg}' not found`);
      process.exit(1);
    }
    taskId = taskArg;
  } else {
    taskId = await getCurrentTask();
  }

  // STRICT isolation tasks do not support context listing
  if (await isStrictIsolationTask(taskId, cwd)) {
    if (jsonMode) {
      console.log(JSON.stringify({
        projectId, taskId,
        strictIsolation: true,
        message: 'Strict isolation is active — no contexts available for this specialized task.',
        sessions: [],
        contexts: [],
      }, null, 2));
    } else {
      console.log(`Project: ${cwd}`);
      console.log(`Task:    ${taskId}`);
      console.log('');
      console.log('Strict isolation is active — no contexts available for this specialized task.');
      console.log('Context save and restore are disabled to ensure each session starts fresh.');
    }
    return;
  }

  const sessions = await listActiveSessions(cwd);
  const contexts = await listContexts(taskId, cwd);
  const golden = contexts
    .filter(c => c.location === 'golden')
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  const personal = contexts
    .filter(c => c.location === 'personal')
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

  if (jsonMode) {
    console.log(JSON.stringify({
      projectId, taskId,
      sessions: sessions.map(s => ({
        id: s.id, messages: s.messages, tokens: s.tokens,
        lastModified: s.lastModified.toISOString(), isCurrent: s.isCurrent,
      })),
      contexts: contexts.map(c => ({
        name: c.name, location: c.location, messages: c.messages,
        tokens: c.tokens, lastModified: c.lastModified.toISOString(),
      })),
    }, null, 2));
    return;
  }

  // Human-readable output to stdout
  console.log(`Project: ${cwd}`);
  console.log(`Task:    ${taskId}`);
  console.log('');

  if (sessions.length > 0) {
    console.log('Sessions:');
    for (const sess of sessions) {
      const marker = sess.isCurrent ? '(current)' : '         ';
      const shortId = sess.id.slice(0, 8) + '...';
      const tokens = `~${Math.round(sess.tokens / 1000)}k`;
      console.log(`  ${shortId} ${marker} ${String(sess.messages).padStart(3)} msgs ${tokens.padStart(5)} - ${formatDate(sess.lastModified)}`);
    }
    console.log('');
  }

  async function readSummary(filePath: string): Promise<string> {
    try {
      const metaPath = filePath.replace(/\.jsonl$/, '.meta.json');
      const raw = await fs.readFile(metaPath, 'utf-8');
      const meta = JSON.parse(raw);
      if (meta.summary && meta.summary.trim().length > 0) {
        return ' — ' + meta.summary.trim().slice(0, 60);
      }
    } catch { /* no meta.json or unreadable */ }
    return '';
  }

  if (personal.length > 0) {
    console.log('Personal contexts:');
    for (const ctx of personal) {
      const name = ctx.name.padEnd(20).slice(0, 20);
      const summary = await readSummary(ctx.filePath);
      console.log(`  ${name} ${String(ctx.messages).padStart(3)} msgs - ${formatDate(ctx.lastModified)}${summary}`);
    }
    console.log('');
  }

  if (golden.length > 0) {
    console.log('Golden contexts:');
    for (const ctx of golden) {
      const name = ctx.name.padEnd(20).slice(0, 20);
      const summary = await readSummary(ctx.filePath);
      console.log(`  ${name} ${String(ctx.messages).padStart(3)} msgs - ${formatDate(ctx.lastModified)}${summary} ⭐`);
    }
    console.log('');
  }

  if (sessions.length === 0 && contexts.length === 0) {
    console.log('No contexts found. Start fresh or save a session with /context-save.');
    console.log('');
  }

  console.log(`Save: /context-save <name>  |  Manage: /context-manage`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
