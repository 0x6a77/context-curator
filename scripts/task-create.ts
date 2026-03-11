#!/usr/bin/env tsx

/**
 * task-create.ts - Create a new task
 * 
 * Creates the task in golden (project) storage by default.
 * Use --personal flag to create in personal storage.
 * 
 * Usage:
 *   task-create <task-id> <description> [--personal]
 */

import fs from 'fs/promises';
import path from 'path';
import { getPersonalTasksDir, getGoldenTasksDir, ensureDir, validateName, fileExists } from '../src/utils.js';

async function main() {
  const args = process.argv.slice(2);
  const isPersonal = args.includes('--personal');
  const positional = args.filter(arg => !arg.startsWith('--'));
  const taskId = positional[0];
  const description = positional[1] ?? '';

  const cwd = process.cwd();

  if (!taskId || !taskId.trim()) {
    console.error('❌ Invalid task ID: cannot be empty');
    console.error('   Use lowercase letters, numbers, and hyphens only');
    process.exit(1);
  }

  // Require .claude/ to exist (project must be initialized first)
  const claudeDir = path.join(cwd, '.claude');
  if (!await fileExists(claudeDir)) {
    console.error('❌ Not initialized. Run init-project first.');
    process.exit(1);
  }

  // Validate task ID
  const validation = validateName(taskId);
  if (!validation.valid) {
    console.error(`❌ Invalid task name: ${validation.error}`);
    console.error('   Use lowercase letters, numbers, and hyphens only');
    process.exit(1);
  }

  // Reject empty description
  if (!description.trim()) {
    console.error('❌ Description is required');
    console.error('   Usage: task-create <task-id> <description>');
    process.exit(1);
  }

  // Determine target directory
  const tasksDir = isPersonal ? getPersonalTasksDir(cwd) : getGoldenTasksDir(cwd);
  const taskDir = path.join(tasksDir, taskId);
  const claudeMdPath = path.join(taskDir, 'CLAUDE.md');
  const contextsDir = path.join(taskDir, 'contexts');

  // Check if task already exists
  if (await fileExists(claudeMdPath)) {
    console.error(`❌ Task '${taskId}' already exists`);
    console.error(`   Location: ${claudeMdPath}`);
    process.exit(1);
  }

  // Build CLAUDE.md content with description in ## Focus section
  const claudeMdContent = `# Task: ${taskId}

## Focus
${description}

## Key Areas
[List the relevant subsystems or files]

## Guidelines
[Task-specific best practices]

## Common Pitfalls
[Document issues as you discover them]

## Reference Files
[Key files for this task]
`;

  // Create directories
  await ensureDir(taskDir);
  await ensureDir(contextsDir);

  // Write CLAUDE.md
  await fs.writeFile(claudeMdPath, claudeMdContent);

  // Update .claude/CLAUDE.md @import to point to this task
  const workingClaudeMdPath = path.join(cwd, '.claude', 'CLAUDE.md');
  try {
    let workingContent = await fs.readFile(workingClaudeMdPath, 'utf-8');
    const importPath = isPersonal
      ? claudeMdPath  // absolute path for personal
      : `.claude/tasks/${taskId}/CLAUDE.md`;
    const newImportLine = `@import ${importPath}`;
    const importRegex = /@import [^\n]+CLAUDE\.md/;
    if (importRegex.test(workingContent)) {
      workingContent = workingContent.replace(importRegex, newImportLine);
    } else {
      workingContent = workingContent.trim() + '\n\n## Task-Specific Context\n\n' + newImportLine + '\n';
    }
    await fs.writeFile(workingClaudeMdPath, workingContent);
  } catch {
    // .claude/CLAUDE.md may not exist yet; that's OK
  }

  const location = isPersonal ? 'personal' : 'golden (shared)';
  console.log(`✓ Created task: ${taskId}`);
  console.log(`✓ Location: ${location}`);
  console.log(`  ${claudeMdPath}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
