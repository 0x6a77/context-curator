#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { getCurrentTask, taskExists } from '../src/task-manager.js';
import { formatDate, getSessionStats } from '../src/utils.js';

async function contextList(taskId?: string) {
  const cwd = process.cwd();
  const projectId = cwd.replace(/\//g, '-');

  // Determine which task to list contexts for
  const targetTask = taskId || await getCurrentTask();

  const taskDir = path.join(process.env.HOME!, '.claude/projects', projectId, 'tasks', targetTask);
  const contextsDir = path.join(taskDir, 'contexts');

  // Check if task exists
  try {
    await fs.access(path.join(taskDir, 'CLAUDE.md'));
  } catch {
    console.error(`❌ Task '${targetTask}' not found`);
    console.log('\nRun /task-list to see available tasks');
    process.exit(1);
  }

  // List contexts
  let contexts: any[] = [];

  try {
    const files = await fs.readdir(contextsDir);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));

    for (const file of jsonlFiles) {
      const filePath = path.join(contextsDir, file);
      const stats = await fs.stat(filePath);
      const sessionStats = await getSessionStats(filePath);

      contexts.push({
        name: file.replace('.jsonl', ''),
        messages: sessionStats.messages,
        tokens: sessionStats.tokens,
        created: stats.birthtime,
        modified: stats.mtime
      });
    }
  } catch (err) {
    // No contexts directory or empty
  }

  console.log(`# Contexts: ${targetTask}\n`);

  if (contexts.length === 0) {
    console.log('No contexts saved yet.\n');
    console.log(`Save your current session: /task-save <context-name>`);
    return;
  }

  // Sort by modified date (most recent first)
  contexts.sort((a, b) => b.modified.getTime() - a.modified.getTime());

  contexts.forEach((ctx, i) => {
    console.log(`${i + 1}. ${ctx.name}`);
    console.log(`   • ${ctx.messages} messages, ${(ctx.tokens / 1000).toFixed(1)}k tokens`);
    console.log(`   • Created: ${formatDate(ctx.created)}`);
    console.log(`   • Last modified: ${formatDate(ctx.modified)}\n`);
  });

  console.log(`Total: ${contexts.length} context${contexts.length !== 1 ? 's' : ''}\n`);
  console.log(`Load: /task ${targetTask} <context-name>`);
}

const taskId = process.argv[2];
contextList(taskId).catch((err) => {
  console.error('Error listing contexts:', err.message);
  process.exit(1);
});
