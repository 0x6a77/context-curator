#!/usr/bin/env tsx

/**
 * promote-task.ts - Promote a personal task to golden
 * 
 * Copies the task (CLAUDE.md and contexts/) from personal storage
 * to the project's .claude/tasks/ directory.
 * 
 * Usage:
 *   promote-task <task-id>
 */

import fs from 'fs/promises';
import path from 'path';
import {
  getGoldenTasksDir,
  getPersonalTasksDir,
  ensureDir,
  dirExists,
  fileExists
} from '../src/utils.js';

async function copyDir(src: string, dest: string) {
  await ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  const taskId = process.argv[2];
  
  if (!taskId) {
    console.error('Usage: promote-task <task-id>');
    process.exit(1);
  }
  
  const cwd = process.cwd();
  const personalDir = path.join(getPersonalTasksDir(cwd), taskId);
  const goldenDir = path.join(getGoldenTasksDir(cwd), taskId);
  
  // Check personal task exists
  if (!await dirExists(personalDir)) {
    console.error(`❌ Personal task '${taskId}' not found`);
    console.error(`   Expected: ${personalDir}`);
    process.exit(1);
  }
  
  // Check if golden already exists
  if (await dirExists(goldenDir)) {
    console.error(`⚠️  Golden task '${taskId}' already exists`);
    console.error(`   Location: ${goldenDir}`);
    console.error('');
    console.error('To overwrite, delete the golden task first:');
    console.error(`  rm -rf ${goldenDir}`);
    process.exit(1);
  }
  
  // Copy task to golden
  await copyDir(personalDir, goldenDir);
  
  console.log(`✓ Promoted task to golden: ${taskId}`);
  console.log(`✓ Location: ${path.relative(cwd, goldenDir)}`);
  console.log('');
  console.log('Personal copy preserved at:');
  console.log(`  ${personalDir}`);
  console.log('');
  console.log('Next steps:');
  console.log(`  git add ${path.relative(cwd, goldenDir)}/`);
  console.log(`  git commit -m "Add ${taskId} task"`);
  console.log('  git push');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
