#!/usr/bin/env tsx

/**
 * rename-task.ts - Rename a task
 * 
 * Renames both personal and golden versions if they exist.
 * 
 * Usage:
 *   rename-task <old-name> <new-name>
 */

import fs from 'fs/promises';
import path from 'path';
import {
  getGoldenTasksDir,
  getPersonalTasksDir,
  getCurrentTask,
  validateName,
  dirExists
} from '../src/utils.js';

async function main() {
  const [oldName, newName] = process.argv.slice(2);
  
  if (!oldName || !newName) {
    console.error('Usage: rename-task <old-name> <new-name>');
    process.exit(1);
  }
  
  // Validate new name
  const validation = validateName(newName);
  if (!validation.valid) {
    console.error(`❌ Invalid new name: ${validation.error}`);
    process.exit(1);
  }
  
  if (oldName === 'default') {
    console.error('❌ Cannot rename the default task');
    process.exit(1);
  }
  
  const cwd = process.cwd();
  const currentTask = await getCurrentTask();
  
  // Track what we renamed
  let renamedGolden = false;
  let renamedPersonal = false;
  
  // Rename golden task
  const goldenOld = path.join(getGoldenTasksDir(cwd), oldName);
  const goldenNew = path.join(getGoldenTasksDir(cwd), newName);
  
  if (await dirExists(goldenOld)) {
    if (await dirExists(goldenNew)) {
      console.error(`❌ Golden task '${newName}' already exists`);
      process.exit(1);
    }
    await fs.rename(goldenOld, goldenNew);
    renamedGolden = true;
    console.log(`✓ Renamed golden task: ${oldName} → ${newName}`);
  }
  
  // Rename personal task
  const personalOld = path.join(getPersonalTasksDir(cwd), oldName);
  const personalNew = path.join(getPersonalTasksDir(cwd), newName);
  
  if (await dirExists(personalOld)) {
    if (await dirExists(personalNew)) {
      console.error(`❌ Personal task '${newName}' already exists`);
      process.exit(1);
    }
    await fs.rename(personalOld, personalNew);
    renamedPersonal = true;
    console.log(`✓ Renamed personal task: ${oldName} → ${newName}`);
  }
  
  if (!renamedGolden && !renamedPersonal) {
    console.error(`❌ Task '${oldName}' not found`);
    process.exit(1);
  }
  
  console.log('');
  console.log(`✓ Task renamed: ${oldName} → ${newName}`);
  
  // Update @import if this was the current task
  if (currentTask === oldName) {
    console.log('');
    console.log(`Note: This was your current task.`);
    console.log(`Update @import with: /task ${newName}`);
  }
  
  if (renamedGolden) {
    console.log('');
    console.log('Golden task was renamed. To update git:');
    console.log(`  git mv .claude/tasks/${oldName} .claude/tasks/${newName}`);
    console.log(`  git commit -m "Rename ${oldName} → ${newName}"`);
    console.log('  git push');
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
