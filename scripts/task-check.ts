#!/usr/bin/env tsx

/**
 * task-check.ts - Check if a task exists
 * 
 * Outputs:
 * - exists:golden - Task exists in project directory (shared)
 * - exists:personal - Task exists in personal storage
 * - not-found - Task doesn't exist
 */

import { getTaskInfo } from '../src/utils.js';

async function main() {
  const taskId = process.argv[2];
  
  if (!taskId) {
    console.error('Usage: task-check <task-id>');
    process.exit(1);
  }
  
  const taskInfo = await getTaskInfo(taskId);
  
  if (taskInfo) {
    console.log(`exists:${taskInfo.location}`);
  } else {
    console.log('not-found');
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
