#!/usr/bin/env tsx

/**
 * init-project.ts - Initialize context-curator in a project
 * 
 * v13.0: Two-file CLAUDE.md system
 * - Root ./CLAUDE.md: Never modified, committed to git
 * - ./.claude/CLAUDE.md: Auto-generated, git-ignored, contains @import
 * - ./.claude/tasks/: Golden contexts (committed)
 * - ~/.claude/projects/: Personal contexts (never committed)
 */

import fs from 'fs/promises';
import path from 'path';
import { getClaudeHome } from '../src/utils.js';

async function initProject() {
  console.log('Initializing context-curator v13...\n');
  
  const cwd = process.cwd();
  const projectPath = cwd;
  
  // 1. Encode project path to create project ID
  // /Users/dev/my-project → -Users-dev-my-project
  const projectId = projectPath.replace(/\//g, '-');
  console.log(`Project: ${projectPath}`);
  console.log(`Project ID: ${projectId}\n`);
  
  // 2. Check if already initialized
  const claudeDir = path.join(cwd, '.claude');
  const tasksDir = path.join(claudeDir, 'tasks');
  const defaultTaskDir = path.join(tasksDir, 'default');
  
  try {
    await fs.access(path.join(defaultTaskDir, 'CLAUDE.md'));
    console.log('⚠️  Project already initialized.');
    console.log(`   Task directory: ${tasksDir}`);
    console.log('\nTo reinitialize, delete .claude/tasks/default/ first.');
    return;
  } catch {
    // Not initialized, continue
  }
  
  // 3. Create .claude directory structure (for golden contexts)
  await fs.mkdir(defaultTaskDir, { recursive: true });
  await fs.mkdir(path.join(defaultTaskDir, 'contexts'), { recursive: true });
  console.log(`✓ Created .claude/tasks/default/`);
  
  // 4. Create .gitignore in .claude/ directory
  // Git-ignore the auto-generated CLAUDE.md but NOT the tasks directory
  const gitignoreContent = `# Auto-generated file (each developer has their own)
CLAUDE.md

# Re-allow task CLAUDE.md files (they should be tracked by git)
!tasks/**/CLAUDE.md

# Personal data files
*.local.json
`;
  await fs.writeFile(path.join(claudeDir, '.gitignore'), gitignoreContent);
  console.log('✓ Created .claude/.gitignore');
  
  // 5. Read existing root CLAUDE.md (if any) for backup
  const rootClaudeMd = path.join(cwd, 'CLAUDE.md');
  let existingContent = '';
  
  try {
    existingContent = await fs.readFile(rootClaudeMd, 'utf-8');
    console.log('✓ Found existing root CLAUDE.md (will not modify)');
  } catch {
    console.log('ℹ  No root CLAUDE.md found (that\'s okay)');
  }
  
  // 6. Create default task CLAUDE.md (copy of root or minimal default)
  const defaultClaudeMd = existingContent || `# Default Task

General development work for this project.

## Guidelines
- Follow existing code patterns
- Write tests for new functionality
- Keep commits focused and well-documented
`;
  
  await fs.writeFile(
    path.join(defaultTaskDir, 'CLAUDE.md'),
    defaultClaudeMd
  );
  console.log('✓ Created default task CLAUDE.md');
  
  // 7. Create personal storage directory
  const personalProjectDir = path.join(getClaudeHome(), 'projects', projectId);
  const personalTasksDir = path.join(personalProjectDir, 'tasks', 'default', 'contexts');
  const stashDir = path.join(personalProjectDir, '.stash');
  
  await fs.mkdir(personalTasksDir, { recursive: true });
  await fs.mkdir(stashDir, { recursive: true });
  console.log(`✓ Created personal storage: ${personalProjectDir}/`);
  
  // 8. Backup root CLAUDE.md to stash (if exists)
  if (existingContent) {
    await fs.writeFile(
      path.join(stashDir, 'original-CLAUDE.md'),
      existingContent
    );
    console.log('✓ Backed up root CLAUDE.md to personal stash');
  }
  
  // 9. Create the auto-generated .claude/CLAUDE.md with @import
  const projectName = path.basename(cwd);
  const generatedClaudeMd = `# Project: ${projectName}

## Universal Instructions

Add your project-wide guidelines here:
- Coding standards
- Common commands
- Shared practices

## Task-Specific Context

@import .claude/tasks/default/CLAUDE.md

<!-- This line is managed by context-curator. Do not edit manually. -->
`;
  
  await fs.writeFile(path.join(claudeDir, 'CLAUDE.md'), generatedClaudeMd);
  console.log('✓ Created .claude/CLAUDE.md with @import');
  
  // 10. Create config file in personal storage
  await fs.writeFile(
    path.join(personalProjectDir, 'config.json'),
    JSON.stringify({
      projectPath,
      projectId,
      version: '13.0',
      createdAt: new Date().toISOString()
    }, null, 2)
  );
  console.log('✓ Created config file');
  
  // Done!
  console.log('\n✓ Initialization complete!\n');
  console.log('Two-file system set up:');
  console.log('  • ./CLAUDE.md         → Root instructions (committed, never modified)');
  console.log('  • ./.claude/CLAUDE.md → Active context (git-ignored, auto-generated)');
  console.log('');
  console.log('Storage locations:');
  console.log('  • ./.claude/tasks/    → Golden contexts (committed, shared with team)');
  console.log(`  • ~/.claude/projects/${projectId}/ → Personal contexts`);
  console.log('');
  console.log('Next steps:');
  console.log('  /task oauth-refactor      Create a new task');
  console.log('  /context-save my-progress Save your work');
  console.log('  /context-list             View available contexts');
}

initProject().catch((err) => {
  console.error('Error initializing project:', err.message);
  process.exit(1);
});
