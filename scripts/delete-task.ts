#!/usr/bin/env tsx

/**
 * delete-task.ts - Delete a task and all its contexts
 * 
 * Usage:
 *   delete-task <task-id>
 */

import fs from 'fs/promises';
import path from 'path';
import {
  getGoldenTasksDir,
  getPersonalTasksDir,
  dirExists,
  listContexts
} from '../src/utils.js';

async function main() {
  const taskId = process.argv[2];
  
  if (!taskId) {
    console.error('Usage: delete-task <task-id>');
    process.exit(1);
  }
  
  if (taskId === 'default') {
    console.error('❌ Cannot delete the default task');
    process.exit(1);
  }
  
  const cwd = process.cwd();
  
  // Get context count before deletion
  const contexts = await listContexts(taskId, cwd);
  const goldenContexts = contexts.filter(c => c.location === 'golden');
  
  // Track what we delete
  let deletedGolden = false;
  let deletedPersonal = false;
  
  // Delete golden task directory
  const goldenDir = path.join(getGoldenTasksDir(cwd), taskId);
  if (await dirExists(goldenDir)) {
    await fs.rm(goldenDir, { recursive: true });
    deletedGolden = true;
    console.log(`✓ Deleted golden task: ${goldenDir}`);
  }
  
  // Delete personal task directory
  const personalDir = path.join(getPersonalTasksDir(cwd), taskId);
  if (await dirExists(personalDir)) {
    await fs.rm(personalDir, { recursive: true });
    deletedPersonal = true;
    console.log(`✓ Deleted personal task: ${personalDir}`);
  }
  
  if (!deletedGolden && !deletedPersonal) {
    console.error(`❌ Task '${taskId}' not found`);
    process.exit(1);
  }
  
  console.log('');
  console.log(`✓ Deleted task: ${taskId}`);
  console.log(`✓ Removed ${contexts.length} context(s)`);
  
  if (deletedGolden || goldenContexts.length > 0) {
    console.log('');
    console.log('Note: Golden files were deleted. To remove from git:');
    console.log(`  git rm -r .claude/tasks/${taskId}/`);
    console.log(`  git commit -m "Remove ${taskId} task"`);
    console.log('  git push');
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
