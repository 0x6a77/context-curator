#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function updateImport(taskId: string) {
  const cwd = process.cwd();
  const projectId = cwd.replace(/\//g, '-');
  const claudeMdPath = path.join(cwd, '.claude/CLAUDE.md');

  // Verify task exists in global storage
  const taskClaudeMd = path.join(
    process.env.HOME!,
    '.claude/projects',
    projectId,
    'tasks',
    taskId,
    'CLAUDE.md'
  );

  try {
    await fs.access(taskClaudeMd);
  } catch (error) {
    console.error(`❌ Task '${taskId}' not found`);
    console.error(`   Missing: ${taskClaudeMd}`);

    // List available tasks
    const tasksDir = path.join(process.env.HOME!, '.claude/projects', projectId, 'tasks');
    try {
      const tasks = await fs.readdir(tasksDir);
      const validTasks = [];

      for (const task of tasks) {
        const taskPath = path.join(tasksDir, task);
        const stats = await fs.stat(taskPath);
        if (stats.isDirectory() && task !== 'node_modules') {
          validTasks.push(task);
        }
      }

      if (validTasks.length > 0) {
        console.error('\nAvailable tasks:');
        validTasks.forEach(t => console.error(`   - ${t}`));
      }
    } catch {
      console.error('\nNo tasks directory found. Run /task-create first.');
    }

    process.exit(1);
  }

  // Read current CLAUDE.md
  let content = await fs.readFile(claudeMdPath, 'utf-8');

  // Update @-import line with global path
  const importLine = `@import ~/.claude/projects/${projectId}/tasks/${taskId}/CLAUDE.md`;
  const importRegex = /@import ~\/\.claude\/projects\/[^\/]+\/tasks\/[^\/\s]+\/CLAUDE\.md/;

  if (importRegex.test(content)) {
    // Replace existing import
    content = content.replace(importRegex, importLine);
  } else {
    // Add import if not present (shouldn't happen after init)
    console.warn('⚠️  No @import line found, adding one...');
    content = content.trim() + '\n\n' + importLine + '\n\n<!-- This line is managed by context-curator. Do not edit manually. -->\n';
  }

  await fs.writeFile(claudeMdPath, content);

  console.log(`✓ Task context: ${taskId}`);
}

const taskId = process.argv[2];
if (!taskId) {
  console.error('Usage: update-import <task-id>');
  process.exit(1);
}

updateImport(taskId).catch((err) => {
  console.error('Error updating import:', err.message);
  process.exit(1);
});
