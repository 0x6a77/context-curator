#!/usr/bin/env tsx

/**
 * task-list.ts - List all tasks or show task details
 * 
 * v13.0: Shows both golden and personal tasks
 */

import fs from 'fs/promises';
import { listTasks, listContexts, getCurrentTask, formatDate, fileExists } from '../src/utils.js';

async function main() {
  const taskId = process.argv[2];
  const currentTask = await getCurrentTask();
  
  if (!taskId) {
    // List all tasks
    const tasks = await listTasks();
    
    if (tasks.length === 0) {
      console.log('No tasks found.');
      console.log('');
      console.log('Create one with: /task <task-id>');
      return;
    }
    
    console.log('# Available Tasks\n');
    
    for (const task of tasks) {
      const isCurrent = task.id === currentTask;
      const currentMarker = isCurrent ? ' (current)' : '';
      const goldenMarker = task.location === 'golden' ? ' ⭐' : '';
      
      console.log(`${task.id}${currentMarker}${goldenMarker}`);
      console.log(`• ${task.location === 'golden' ? 'Golden task (in project)' : 'Personal task'}`);
      
      // Get context counts
      const contexts = await listContexts(task.id);
      const personalCount = contexts.filter(c => c.location === 'personal').length;
      const goldenCount = contexts.filter(c => c.location === 'golden').length;
      
      if (contexts.length > 0) {
        if (goldenCount > 0 && personalCount > 0) {
          console.log(`• Contexts: ${contexts.length} (${personalCount} personal, ${goldenCount} golden)`);
        } else {
          console.log(`• Contexts: ${contexts.length}`);
        }
      } else {
        console.log('• Contexts: 0');
      }
      
      if (task.lastModified) {
        console.log(`• Last used: ${formatDate(task.lastModified)}`);
      }
      
      console.log('');
    }
    
    console.log('---\n');
    console.log(`Total: ${tasks.length} task(s)`);
    console.log('');
    console.log(`Current task: ${currentTask}`);
    console.log('Switch: /task <task-id>');
    
  } else {
    // Show task details
    const tasks = await listTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      console.error(`❌ Task '${taskId}' not found`);
      console.error('');
      console.error('Available tasks:');
      for (const t of tasks) {
        console.error(`  - ${t.id}`);
      }
      process.exit(1);
    }
    
    const isCurrent = task.id === currentTask;
    
    console.log(`# Task: ${task.id}\n`);
    
    // Location
    console.log('## Location');
    if (task.location === 'golden') {
      console.log('Golden (in project, shared) ⭐');
    } else {
      console.log('Personal (private)');
    }
    console.log('');
    
    // CLAUDE.md preview
    console.log('## CLAUDE.md Preview');
    try {
      const content = await fs.readFile(task.claudeMdPath, 'utf-8');
      const lines = content.split('\n').slice(0, 15);
      console.log('```');
      console.log(lines.join('\n'));
      if (content.split('\n').length > 15) {
        console.log('...');
      }
      console.log('```');
    } catch {
      console.log('(Could not read CLAUDE.md)');
    }
    console.log('');
    
    // Contexts
    console.log('## Contexts');
    const contexts = await listContexts(task.id);
    
    if (contexts.length === 0) {
      console.log('(No contexts saved yet)');
    } else {
      const personal = contexts.filter(c => c.location === 'personal');
      const golden = contexts.filter(c => c.location === 'golden');
      
      let num = 1;
      
      if (personal.length > 0) {
        console.log('\n### Personal');
        for (const ctx of personal) {
          console.log(`${num}. ${ctx.name} (${ctx.messages} msgs) - ${formatDate(ctx.lastModified)}`);
          num++;
        }
      }
      
      if (golden.length > 0) {
        console.log('\n### Golden (shared)');
        for (const ctx of golden) {
          console.log(`${num}. ${ctx.name} (${ctx.messages} msgs) - ${formatDate(ctx.lastModified)} ⭐`);
          num++;
        }
      }
    }
    
    console.log('\n---\n');
    console.log(`Switch to this task: /task ${task.id}`);
    if (contexts.length > 0) {
      console.log(`Load with context: /task ${task.id} <context-name>`);
    }
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
