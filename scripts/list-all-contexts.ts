#!/usr/bin/env tsx

/**
 * list-all-contexts.ts - List all contexts across all tasks
 * 
 * Used by /context-manage to get a complete view.
 * Outputs JSON with all tasks and their contexts.
 */

import { listTasks, listContexts, getCurrentTask, formatDate } from '../src/utils.js';

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

async function main() {
  const currentTask = await getCurrentTask();
  const tasks = await listTasks();
  
  const result: TaskWithContexts[] = [];
  
  for (const task of tasks) {
    const contexts = await listContexts(task.id);
    
    result.push({
      id: task.id,
      location: task.location,
      isCurrent: task.id === currentTask,
      contexts: contexts.map(ctx => ({
        name: ctx.name,
        location: ctx.location,
        messages: ctx.messages,
        tokens: ctx.tokens,
        lastModified: ctx.lastModified,
        age: Math.floor((Date.now() - ctx.lastModified.getTime()) / (1000 * 60 * 60 * 24))
      }))
    });
  }
  
  // Sort: current task first, then by most recent activity
  result.sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return 0;
  });
  
  // Print summary to stderr
  let totalContexts = 0;
  let contextNum = 1;
  
  console.error(`Found ${result.length} task(s):\n`);
  
  for (const task of result) {
    const currentMarker = task.isCurrent ? ' (current)' : '';
    console.error(`### ${task.id}${currentMarker}`);
    
    const personal = task.contexts.filter(c => c.location === 'personal');
    const golden = task.contexts.filter(c => c.location === 'golden');
    
    if (personal.length > 0) {
      console.error('**Personal:**');
      for (const ctx of personal) {
        console.error(`${contextNum}. \`${ctx.name}\` - ${ctx.messages} msgs - ${formatDate(ctx.lastModified)}`);
        contextNum++;
        totalContexts++;
      }
    }
    
    if (golden.length > 0) {
      console.error('**Golden:**');
      for (const ctx of golden) {
        console.error(`${contextNum}. \`${ctx.name}\` ⭐ - ${ctx.messages} msgs - ${formatDate(ctx.lastModified)}`);
        contextNum++;
        totalContexts++;
      }
    }
    
    if (task.contexts.length === 0) {
      console.error('(no contexts)');
    }
    
    console.error('');
  }
  
  console.error(`Total: ${totalContexts} context(s) across ${result.length} task(s)\n`);
  
  // Output JSON to stdout
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
