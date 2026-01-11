#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function contextList(taskId?: string) {
  const cwd = process.cwd();

  // Determine which task to list contexts for
  const targetTask = taskId || await getCurrentTask();

  const taskDir = path.join(cwd, '.context-curator/tasks', targetTask);
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
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());
      const messages = lines.length;
      const tokens = Math.ceil(lines.reduce((sum, line) => {
        try {
          const msg = JSON.parse(line);
          const contentStr = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
          return sum + contentStr.length;
        } catch {
          return sum;
        }
      }, 0) / 4);

      contexts.push({
        name: file.replace('.jsonl', ''),
        messages,
        tokens,
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
    console.log(`   • Created: ${formatTimeAgo(ctx.created)}`);
    console.log(`   • Last modified: ${formatTimeAgo(ctx.modified)}\n`);
  });

  console.log(`Total: ${contexts.length} context${contexts.length !== 1 ? 's' : ''}\n`);
  console.log(`Load: /task ${targetTask} <context-name>`);
}

async function getCurrentTask(): Promise<string> {
  try {
    const claudeMdPath = path.join(process.cwd(), '.claude/CLAUDE.md');
    const content = await fs.readFile(claudeMdPath, 'utf-8');
    const match = content.match(/@import \.context-curator\/tasks\/([^\/\s]+)\/CLAUDE\.md/);
    if (match) {
      return match[1];
    }
  } catch {
    // Fall through
  }
  return 'default';
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

const taskId = process.argv[2];
contextList(taskId).catch((err) => {
  console.error('Error listing contexts:', err.message);
  process.exit(1);
});
