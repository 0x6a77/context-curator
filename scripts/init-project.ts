#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function initProject() {
  console.log('Initializing context-curator...\n');

  const cwd = process.cwd();

  // 1. Create task directory structure
  const tasksDir = path.join(cwd, '.context-curator/tasks');
  await fs.mkdir(tasksDir, { recursive: true });

  // 2. Move existing CLAUDE.md to default task
  const currentClaudeMd = path.join(cwd, '.claude/CLAUDE.md');
  const defaultTaskDir = path.join(tasksDir, 'default');

  await fs.mkdir(defaultTaskDir, { recursive: true });
  await fs.mkdir(path.join(defaultTaskDir, 'contexts'), { recursive: true });

  let currentContent = '';
  try {
    currentContent = await fs.readFile(currentClaudeMd, 'utf-8');
    await fs.writeFile(
      path.join(defaultTaskDir, 'CLAUDE.md'),
      currentContent
    );
    console.log('✓ Backed up current CLAUDE.md to "default" task');
  } catch {
    // No existing CLAUDE.md, create a basic default
    currentContent = '# Default Task\n\nGeneral development work.\n';
    await fs.writeFile(
      path.join(defaultTaskDir, 'CLAUDE.md'),
      currentContent
    );
    console.log('✓ Created default task CLAUDE.md');
  }

  // 3. Create new CLAUDE.md with @-import
  const projectName = path.basename(cwd);
  const newClaudeMd = `# Project: ${projectName}

## Universal Instructions

Add your project-wide guidelines here:
- Coding standards
- Common commands
- Shared practices

## Task-Specific Context

@import .context-curator/tasks/default/CLAUDE.md

<!-- This line is managed by context-curator. Do not edit manually. -->
`;

  await fs.writeFile(currentClaudeMd, newClaudeMd);
  console.log('✓ Created new CLAUDE.md with @-import structure');

  // 4. Create session-task-map.json
  await fs.writeFile(
    path.join(tasksDir, 'session-task-map.json'),
    '{}\n'
  );
  console.log('✓ Created session tracking file');

  console.log('\n✓ Initialization complete!\n');
  console.log('Next steps:');
  console.log('1. Edit .claude/CLAUDE.md to add universal guidelines');
  console.log('2. Create your first task: /task-create <task-id>');
  console.log('3. Start working: /task <task-id>');
}

initProject().catch((err) => {
  console.error('Error initializing project:', err.message);
  process.exit(1);
});
