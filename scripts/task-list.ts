#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { listTasks, getCurrentTask } from '../src/task-manager.js';
import { formatDate, getSessionStats } from '../src/utils.js';

async function taskList(taskId?: string) {
  const tasks = await listTasks();

  if (tasks.length === 0) {
    console.log('No tasks found. Run /task-create to create your first task.');
    process.exit(0);
  }

  if (taskId) {
    // Show specific task details
    await showTaskDetails(taskId, tasks);
  } else {
    // List all tasks
    await listAllTasks(tasks);
  }
}

async function listAllTasks(tasks: any[]) {
  // Get current task from @-import
  const currentTask = await getCurrentTask();

  console.log('# Available Tasks\n');

  for (const task of tasks) {
    const isCurrent = task.id === currentTask;
    const marker = isCurrent ? ' (current)' : '';

    console.log(`${task.id}${marker}`);
    console.log(`• ${task.contexts.length} context${task.contexts.length !== 1 ? 's' : ''}`);
    if (task.lastUsed) {
      console.log(`• Last used: ${formatDate(task.lastUsed)}`);
    }
    console.log('');
  }

  const totalContexts = tasks.reduce((sum, t) => sum + t.contexts.length, 0);
  console.log(`Total: ${tasks.length} task${tasks.length !== 1 ? 's' : ''}, ${totalContexts} saved context${totalContexts !== 1 ? 's' : ''}`);
  
  const cwd = process.cwd();
  const projectId = cwd.replace(/\//g, '-');
  console.log(`\nCurrent: @import ~/.claude/projects/${projectId}/tasks/${currentTask}/CLAUDE.md`);
}

async function showTaskDetails(taskId: string, tasks: any[]) {
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    console.error(`❌ Task '${taskId}' not found`);
    console.log('\nAvailable tasks:');
    await listAllTasks(tasks);
    process.exit(1);
  }

  const claudeContent = await fs.readFile(task.claudeMdPath, 'utf-8');
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
  let contexts: any[] = [];

  for (const contextName of task.contexts) {
    const filePath = path.join(task.contextsDir, `${contextName}.jsonl`);
    const stats = await fs.stat(filePath);
    const sessionStats = await getSessionStats(filePath);

    contexts.push({
      name: contextName,
      messages: sessionStats.messages,
      tokens: sessionStats.tokens,
      created: stats.birthtime,
      modified: stats.mtime
    });
  }

  if (contexts.length > 0) {
    console.log('\n## Saved Contexts');
    contexts.sort((a, b) => b.modified.getTime() - a.modified.getTime());

    contexts.forEach((ctx, i) => {
      console.log(`${i + 1}. ${ctx.name} (${ctx.messages} msgs, ${(ctx.tokens / 1000).toFixed(1)}k tokens) - ${formatDate(ctx.modified)}`);
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

const taskId = process.argv[2];
taskList(taskId).catch((err) => {
  console.error('Error listing tasks:', err.message);
  process.exit(1);
});
