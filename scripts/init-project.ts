#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function initProject() {
  console.log('Initializing context-curator...\n');
  
  const cwd = process.cwd();
  const projectPath = cwd;
  
  // 1. Encode project path to create project ID
  // /Users/dev/my-project → -Users-dev-my-project
  const projectId = projectPath.replace(/\//g, '-');
  console.log(`Project: ${projectPath}`);
  console.log(`Project ID: ${projectId}\n`);
  
  // 2. Create project directory structure in ~/.claude/projects/
  const projectDir = path.join(process.env.HOME!, '.claude/projects', projectId);
  const tasksDir = path.join(projectDir, 'tasks');
  const defaultTaskDir = path.join(tasksDir, 'default');
  
  await fs.mkdir(defaultTaskDir, { recursive: true });
  await fs.mkdir(path.join(defaultTaskDir, 'contexts'), { recursive: true });
  console.log(`✓ Created project directory: ${projectDir}`);
  
  // 3. Backup existing CLAUDE.md to default task
  const currentClaudeMd = path.join(cwd, '.claude/CLAUDE.md');
  
  try {
    const content = await fs.readFile(currentClaudeMd, 'utf-8');
    await fs.writeFile(
      path.join(defaultTaskDir, 'CLAUDE.md'),
      content
    );
    console.log('✓ Backed up current CLAUDE.md to default task');
  } catch {
    await fs.writeFile(
      path.join(defaultTaskDir, 'CLAUDE.md'),
      '# Default Task\n\nGeneral development work.\n'
    );
    console.log('✓ Created default task CLAUDE.md');
  }
  
  // 4. Create new CLAUDE.md with @-import
  const projectName = path.basename(cwd);
  const newClaudeMd = `# Project: ${projectName}

## Universal Instructions

Add your project-wide guidelines here:
- Coding standards
- Common commands
- Shared practices

## Task-Specific Context

@import ~/.claude/projects/${projectId}/tasks/default/CLAUDE.md

<!-- This line is managed by context-curator. Do not edit manually. -->
`;
  
  await fs.writeFile(currentClaudeMd, newClaudeMd);
  console.log('✓ Added @-import line to .claude/CLAUDE.md');
  
  // 5. Create default-default context (empty)
  const defaultContext = path.join(defaultTaskDir, 'contexts/default-default.jsonl');
  await fs.writeFile(defaultContext, '');
  console.log('✓ Created default-default context');
  
  // 6. Create session-task-map.json
  await fs.writeFile(
    path.join(projectDir, 'session-task-map.json'),
    '{}\n'
  );
  
  // 7. Create config.json
  await fs.writeFile(
    path.join(projectDir, 'config.json'),
    JSON.stringify({ projectPath, projectId, createdAt: new Date().toISOString() }, null, 2)
  );
  console.log('✓ Created session tracking and config files');
  
  console.log('\n✓ Initialization complete!\n');
  console.log('Context-curator is ready!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Edit .claude/CLAUDE.md to add universal guidelines');
  console.log('2. Create your first task: /task-create <task-id>');
  console.log('3. Start working: /task <task-id>');
}

initProject().catch((err) => {
  console.error('Error initializing project:', err.message);
  process.exit(1);
});
