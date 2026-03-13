#!/usr/bin/env tsx

/**
 * update-import.ts - Update the @import line in .claude/CLAUDE.md
 * 
 * v13.0: Supports both golden (project) and personal (global) task locations
 * - Specialized: <claudeHome>/context-curator/specialized/<task-id>/CLAUDE.md (immutable DNA)
 * - Golden: ./.claude/tasks/<task-id>/CLAUDE.md (in project, committed)
 * - Personal: ~/.claude/projects/<project-id>/tasks/<task-id>/CLAUDE.md (global)
 */

import fs from 'fs/promises';
import path from 'path';
import { getClaudeHome } from '../src/utils.js';

async function updateImport(taskId: string) {
  const cwd = process.cwd();
  const projectId = cwd.replace(/\//g, '-');
  const claudeMdPath = path.join(cwd, '.claude/CLAUDE.md');
  const claudeHome = getClaudeHome();
  
  // Check if .claude/CLAUDE.md exists
  try {
    await fs.access(claudeMdPath);
  } catch {
    console.error('❌ Project not initialized');
    console.error('   Run /task first to initialize context-curator');
    process.exit(1);
  }
  
  // Check for task in specialized location FIRST (immutable DNA — never modified by user ops)
  const specializedTaskPath = path.join(
    claudeHome,
    'context-curator',
    'specialized',
    taskId,
    'CLAUDE.md'
  );

  // Check for task in golden location (project directory)
  const goldenTaskPath = path.join(cwd, '.claude/tasks', taskId, 'CLAUDE.md');
  
  // Check for task in personal location (global storage)
  const personalTaskPath = path.join(
    claudeHome,
    'projects',
    projectId,
    'tasks',
    taskId,
    'CLAUDE.md'
  );
  
  let importPath: string;
  let taskLocation: 'specialized' | 'golden' | 'personal';
  
  // Prefer specialized (immutable DNA), then golden (project), then personal
  try {
    await fs.access(specializedTaskPath);
    // Use absolute path so it resolves correctly regardless of CLAUDE_HOME vs real home
    importPath = specializedTaskPath;
    taskLocation = 'specialized';
  } catch {
    try {
      await fs.access(goldenTaskPath);
      importPath = `.claude/tasks/${taskId}/CLAUDE.md`;
      taskLocation = 'golden';
    } catch {
      try {
        await fs.access(personalTaskPath);
        importPath = `~/.claude/projects/${projectId}/tasks/${taskId}/CLAUDE.md`;
        taskLocation = 'personal';
      } catch {
        console.error(`❌ Task '${taskId}' not found`);
        console.error('');
        console.error('Checked:');
        console.error(`  Specialized: ${specializedTaskPath}`);
        console.error(`  Golden:      ${goldenTaskPath}`);
        console.error(`  Personal:    ${personalTaskPath}`);
        console.error('');
        
        // List available tasks
        await listAvailableTasks(cwd, projectId, claudeHome);
        
        process.exit(1);
      }
    }
  }
  
  // Read current CLAUDE.md
  let content = await fs.readFile(claudeMdPath, 'utf-8');
  
  // Update @import line
  const newImportLine = `@import ${importPath}`;
  
  // Match various @import patterns
  const importRegex = /@import [^\n]+CLAUDE\.md/;
  
  if (importRegex.test(content)) {
    content = content.replace(importRegex, newImportLine);
  } else {
    // Add import if not present (shouldn't happen after init)
    console.warn('⚠️  No @import line found, adding one...');
    const marker = '<!-- This line is managed by context-curator';
    if (content.includes(marker)) {
      content = content.replace(marker, `${newImportLine}\n\n${marker}`);
    } else {
      content = content.trim() + '\n\n## Task-Specific Context\n\n' + newImportLine + 
        '\n\n<!-- This line is managed by context-curator. Do not edit manually. -->\n';
    }
  }
  
  await fs.writeFile(claudeMdPath, content);
  
  console.log(`✓ Task context: ${taskId}`);
  if (taskLocation === 'specialized') {
    console.log(`  Location: specialized (immutable DNA)`);
  } else {
    console.log(`  Location: ${taskLocation === 'golden' ? 'project (golden)' : 'personal'}`);
  }
  if (taskId === 'default') {
    console.log('  vanilla mode restored');
  }
}

async function listAvailableTasks(cwd: string, projectId: string, claudeHome: string): Promise<void> {
  const goldenTasks: string[] = [];
  const personalTasks: string[] = [];
  const specializedTasks: string[] = [];
  
  // Check specialized tasks
  const specializedTasksDir = path.join(claudeHome, 'context-curator', 'specialized');
  try {
    const entries = await fs.readdir(specializedTasksDir);
    for (const entry of entries) {
      const taskPath = path.join(specializedTasksDir, entry, 'CLAUDE.md');
      try {
        await fs.access(taskPath);
        specializedTasks.push(entry);
      } catch {
        // Not a valid task
      }
    }
  } catch {
    // No specialized tasks directory
  }

  // Check golden tasks
  const goldenTasksDir = path.join(cwd, '.claude/tasks');
  try {
    const entries = await fs.readdir(goldenTasksDir);
    for (const entry of entries) {
      const taskPath = path.join(goldenTasksDir, entry, 'CLAUDE.md');
      try {
        await fs.access(taskPath);
        goldenTasks.push(entry);
      } catch {
        // Not a valid task
      }
    }
  } catch {
    // No golden tasks directory
  }
  
  // Check personal tasks
  const personalTasksDir = path.join(claudeHome, 'projects', projectId, 'tasks');
  try {
    const entries = await fs.readdir(personalTasksDir);
    for (const entry of entries) {
      const taskPath = path.join(personalTasksDir, entry, 'CLAUDE.md');
      try {
        await fs.access(taskPath);
        // Only add if not already in golden or specialized
        if (!goldenTasks.includes(entry) && !specializedTasks.includes(entry)) {
          personalTasks.push(entry);
        }
      } catch {
        // Not a valid task
      }
    }
  } catch {
    // No personal tasks directory
  }
  
  if (goldenTasks.length === 0 && personalTasks.length === 0 && specializedTasks.length === 0) {
    console.error('No tasks found. Create one with /task <task-id>');
    return;
  }
  
  console.error('Available tasks:');

  if (specializedTasks.length > 0) {
    console.error('  Specialized (immutable):');
    specializedTasks.forEach(t => console.error(`    - ${t} 🔒`));
  }
  
  if (goldenTasks.length > 0) {
    console.error('  Golden (shared):');
    goldenTasks.forEach(t => console.error(`    - ${t} ⭐`));
  }
  
  if (personalTasks.length > 0) {
    console.error('  Personal:');
    personalTasks.forEach(t => console.error(`    - ${t}`));
  }
}

// Main
const taskId = process.argv[2];

if (!taskId) {
  console.error('Usage: update-import <task-id>');
  process.exit(1);
}

// Validate task ID format
if (!/^[a-z0-9-]+$/.test(taskId)) {
  console.error('❌ Invalid task ID');
  console.error('   Use lowercase letters, numbers, and hyphens only');
  process.exit(1);
}

updateImport(taskId).catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
