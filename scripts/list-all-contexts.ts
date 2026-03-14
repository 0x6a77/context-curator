#!/usr/bin/env tsx

/**
 * list-all-contexts.ts - List all contexts across all tasks
 * 
 * Used by /context-manage to get a complete view.
 * Outputs JSON with all tasks and their contexts.
 *
 * Stale detection: contexts older than 30 days are flagged [STALE].
 * Duplicate detection: contexts with byte-for-byte identical content are flagged [DUPLICATE].
 */

import fs from 'fs/promises';
import crypto from 'crypto';
import { listTasks, listContexts, getCurrentTask, formatDate } from '../src/utils.js';

const STALE_DAYS = 30;

async function hashFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch {
    return '';
  }
}

interface TaskWithContexts {
  id: string;
  location: 'golden' | 'personal';
  isCurrent: boolean;
  contexts: {
    name: string;
    location: 'golden' | 'personal';
    messages: number;
    tokens: number;
    lastModified: Date;
    age: number; // days
  }[];
}

interface ContextEntry {
  taskId: string;
  name: string;
  location: 'golden' | 'personal';
  filePath: string;
  messages: number;
  tokens: number;
  lastModified: Date;
  age: number;
  stale: boolean;
  duplicate: boolean;
}

async function main() {
  const currentTask = await getCurrentTask();
  const tasks = await listTasks();

  // Collect all contexts with file paths for hashing
  const allContexts: ContextEntry[] = [];

  for (const task of tasks) {
    const contexts = await listContexts(task.id);
    for (const ctx of contexts) {
      const age = Math.floor((Date.now() - ctx.lastModified.getTime()) / (1000 * 60 * 60 * 24));
      allContexts.push({
        taskId: task.id,
        name: ctx.name,
        location: ctx.location,
        filePath: ctx.filePath,
        messages: ctx.messages,
        tokens: ctx.tokens,
        lastModified: ctx.lastModified,
        age,
        stale: age > STALE_DAYS,
        duplicate: false,
      });
    }
  }

  // Duplicate detection: hash all context files and flag matching pairs
  const hashMap = new Map<string, string[]>(); // hash → [filePath, ...]
  await Promise.all(
    allContexts.map(async (ctx) => {
      const h = await hashFile(ctx.filePath);
      if (!h) return;
      if (!hashMap.has(h)) hashMap.set(h, []);
      hashMap.get(h)!.push(ctx.filePath);
    })
  );
  const duplicatePaths = new Set<string>();
  for (const paths of hashMap.values()) {
    if (paths.length > 1) paths.forEach(p => duplicatePaths.add(p));
  }
  allContexts.forEach(ctx => {
    if (duplicatePaths.has(ctx.filePath)) ctx.duplicate = true;
  });

  // Group by task for display
  const taskMap = new Map<string, ContextEntry[]>();
  for (const task of tasks) {
    taskMap.set(task.id, allContexts.filter(c => c.taskId === task.id));
  }

  const totalContexts = allContexts.length;

  // Build result for stdout JSON
  const result: TaskWithContexts[] = tasks.map(task => ({
    id: task.id,
    location: task.location,
    isCurrent: task.id === currentTask,
    contexts: (taskMap.get(task.id) ?? []).map(ctx => ({
      name: ctx.name,
      location: ctx.location,
      messages: ctx.messages,
      tokens: ctx.tokens,
      lastModified: ctx.lastModified,
      age: ctx.age,
    })),
  }));

  result.sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return 0;
  });

  // Print human-readable summary to stderr
  let contextNum = 1;
  console.error(`Found ${tasks.length} task(s):\n`);

  for (const task of tasks) {
    const currentMarker = task.id === currentTask ? ' (current)' : '';
    console.error(`### ${task.id}${currentMarker}`);

    const taskCtxs = taskMap.get(task.id) ?? [];
    const personal = taskCtxs.filter(c => c.location === 'personal');
    const golden = taskCtxs.filter(c => c.location === 'golden');

    function renderCtx(ctx: ContextEntry): void {
      const flags: string[] = [];
      if (ctx.stale) flags.push('[STALE]');
      if (ctx.duplicate) flags.push('[DUPLICATE]');
      const flagStr = flags.length > 0 ? ` ${flags.join(' ')}` : '';
      const star = ctx.location === 'golden' ? ' ⭐' : '';
      console.error(`${contextNum}. \`${ctx.name}\`${star} - ${ctx.messages} msgs - ${formatDate(ctx.lastModified)}${flagStr}`);
      contextNum++;
    }

    if (personal.length > 0) {
      console.error('**Personal:**');
      personal.forEach(renderCtx);
    }
    if (golden.length > 0) {
      console.error('**Golden:**');
      golden.forEach(renderCtx);
    }
    if (taskCtxs.length === 0) {
      console.error('(no contexts)');
    }
    console.error('');
  }

  const staleCount = allContexts.filter(c => c.stale).length;
  const dupCount = allContexts.filter(c => c.duplicate).length;
  console.error(`Total: ${totalContexts} context(s) across ${tasks.length} task(s)`);
  if (staleCount > 0) console.error(`Stale (>${STALE_DAYS} days): ${staleCount}`);
  if (dupCount > 0) console.error(`Duplicates: ${dupCount}`);
  console.error('');

  // Output JSON to stdout
  if (totalContexts === 0) {
    console.log('No contexts found across all tasks.');
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
