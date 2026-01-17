#!/usr/bin/env tsx

/**
 * task-create.ts - Create a new task
 * 
 * Creates the task in personal storage by default.
 * Use --golden flag to create in project directory (shared).
 * 
 * Usage:
 *   task-create <task-id> [--golden]
 *   
 * The CLAUDE.md content is read from stdin.
 */

import fs from 'fs/promises';
import path from 'path';
import { getPersonalTasksDir, getGoldenTasksDir, ensureDir, validateName, fileExists } from '../src/utils.js';

async function main() {
  const args = process.argv.slice(2);
  const isGolden = args.includes('--golden');
  const taskId = args.find(arg => !arg.startsWith('--'));
  
  if (!taskId) {
    console.error('Usage: task-create <task-id> [--golden]');
    console.error('');
    console.error('CLAUDE.md content is read from stdin.');
    process.exit(1);
  }
  
  // Validate task ID
  const validation = validateName(taskId);
  if (!validation.valid) {
    console.error(`❌ Invalid task ID: ${validation.error}`);
    process.exit(1);
  }
  
  // Determine target directory
  const cwd = process.cwd();
  const tasksDir = isGolden ? getGoldenTasksDir(cwd) : getPersonalTasksDir(cwd);
  const taskDir = path.join(tasksDir, taskId);
  const claudeMdPath = path.join(taskDir, 'CLAUDE.md');
  const contextsDir = path.join(taskDir, 'contexts');
  
  // Check if task already exists
  if (await fileExists(claudeMdPath)) {
    console.error(`❌ Task '${taskId}' already exists`);
    console.error(`   Location: ${claudeMdPath}`);
    process.exit(1);
  }
  
  // Read CLAUDE.md content from stdin or use default
  let claudeMdContent = '';
  
  // Check if there's stdin data
  if (!process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    claudeMdContent = Buffer.concat(chunks).toString('utf-8').trim();
  }
  
  // Use default content if none provided
  if (!claudeMdContent) {
    claudeMdContent = `# Task: ${taskId}

## Focus
[Describe what this task focuses on]

## Key Areas
[List the relevant subsystems or files]

## Guidelines
[Task-specific best practices]

## Common Pitfalls
[Document issues as you discover them]

## Reference Files
[Key files for this task]
`;
  }
  
  // Create directories
  await ensureDir(taskDir);
  await ensureDir(contextsDir);
  
  // Write CLAUDE.md
  await fs.writeFile(claudeMdPath, claudeMdContent);
  
  // Output results
  const location = isGolden ? 'golden (shared)' : 'personal';
  console.log(`✓ Created task: ${taskId}`);
  console.log(`✓ Location: ${location}`);
  console.log(`  ${claudeMdPath}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
