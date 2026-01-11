#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function taskList(taskId?: string) {
  const cwd = process.cwd();
  const tasksDir = path.join(cwd, '.context-curator/tasks');

  // Check if tasks directory exists
  try {
    await fs.access(tasksDir);
  } catch {
    console.log('No tasks found. Run /task-create to create your first task.');
    process.exit(0);
  }

  if (taskId) {
    // Show specific task details
    await showTaskDetails(taskId, tasksDir);
  } else {
    // List all tasks
    await listAllTasks(tasksDir);
  }
}

async function listAllTasks(tasksDir: string) {
  const entries = await fs.readdir(tasksDir);
  const tasks = [];

  for (const entry of entries) {
    const taskPath = path.join(tasksDir, entry);
    const stats = await fs.stat(taskPath);

    if (stats.isDirectory() && entry !== 'node_modules') {
      const contextsDir = path.join(taskPath, 'contexts');
      let contextCount = 0;

      try {
        const contexts = await fs.readdir(contextsDir);
        contextCount = contexts.filter(f => f.endsWith('.jsonl')).length;
      } catch {
        // No contexts directory
      }

      tasks.push({
        id: entry,
        contextCount,
        lastUsed: stats.mtime
      });
    }
  }

  if (tasks.length === 0) {
    console.log('No tasks found. Run /task-create to create your first task.');
    return;
  }

  // Get current task from @-import
  const currentTask = await getCurrentTask();

  console.log('# Available Tasks\n');

  // Sort by last used
  tasks.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());

  for (const task of tasks) {
    const isCurrent = task.id === currentTask;
    const marker = isCurrent ? ' (current)' : '';

    console.log(`${task.id}${marker}`);
    console.log(`• ${task.contextCount} context${task.contextCount !== 1 ? 's' : ''}`);
    console.log(`• Last used: ${formatTimeAgo(task.lastUsed)}\n`);
  }

  console.log(`Total: ${tasks.length} task${tasks.length !== 1 ? 's' : ''}, ${tasks.reduce((sum, t) => sum + t.contextCount, 0)} saved contexts`);
  console.log(`\nCurrent: @import .context-curator/tasks/${currentTask}/CLAUDE.md`);
}

async function showTaskDetails(taskId: string, tasksDir: string) {
  const taskPath = path.join(tasksDir, taskId);

  try {
    await fs.access(taskPath);
  } catch {
    console.error(`❌ Task '${taskId}' not found`);
    console.log('\nAvailable tasks:');
    await listAllTasks(tasksDir);
    process.exit(1);
  }

  const claudeMdPath = path.join(taskPath, 'CLAUDE.md');
  const claudeContent = await fs.readFile(claudeMdPath, 'utf-8');
  const lineCount = claudeContent.split('\n').length;

  // Extract focus from CLAUDE.md (look for ## Focus section)
  const focusMatch = claudeContent.match(/##\s*Focus\s*\n([^\n#]+)/i);
  const focus = focusMatch ? focusMatch[1].trim() : 'No focus description';

  console.log(`# Task: ${taskId}\n`);
  console.log('## Overview');
  console.log(focus + '\n');

  console.log('## CLAUDE.md');
  console.log(`${lineCount} lines`);

  // List contexts
  const contextsDir = path.join(taskPath, 'contexts');
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
  } catch {
    // No contexts
  }

  if (contexts.length > 0) {
    console.log('\n## Saved Contexts');
    contexts.sort((a, b) => b.modified.getTime() - a.modified.getTime());

    contexts.forEach((ctx, i) => {
      console.log(`${i + 1}. ${ctx.name} (${ctx.messages} msgs, ${(ctx.tokens / 1000).toFixed(1)}k tokens) - ${formatTimeAgo(ctx.modified)}`);
    });
  } else {
    console.log('\n## Saved Contexts');
    console.log('No contexts saved yet');
  }

  console.log('\n## Usage');
  console.log(`/task ${taskId}              - Start fresh`);
  if (contexts.length > 0) {
    console.log(`/task ${taskId} ${contexts[0].name}   - Resume saved work`);
  }
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
taskList(taskId).catch((err) => {
  console.error('Error listing tasks:', err.message);
  process.exit(1);
});
