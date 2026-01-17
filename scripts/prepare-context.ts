#!/usr/bin/env tsx

/**
 * prepare-context.ts - Prepare a session with an optional context
 * 
 * v13.0: Supports both golden and personal contexts
 * - Golden contexts: ./.claude/tasks/<task-id>/contexts/
 * - Personal contexts: ~/.claude/projects/<project-id>/tasks/<task-id>/contexts/
 */

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  getProjectId,
  getPersonalProjectDir,
  getGoldenTasksDir,
  getPersonalTasksDir,
  getTaskInfo,
  listContexts,
  getSessionStats,
  ensureDir,
  fileExists
} from '../src/utils.js';

async function prepareContext(taskId: string, contextName?: string) {
  // Verify HOME is set first
  if (!process.env.HOME) {
    console.error('❌ HOME environment variable not set');
    process.exit(1);
  }

  const cwd = process.cwd();
  const projectId = getProjectId(cwd);
  
  // Verify task exists
  const taskInfo = await getTaskInfo(taskId, cwd);
  if (!taskInfo) {
    console.error(`❌ Task '${taskId}' not found`);
    console.error('');
    console.error('Create it with: /task ' + taskId);
    process.exit(1);
  }

  // Generate proper UUID session ID (Claude Code format)
  const sessionId = randomUUID();

  // Create session file in Claude Code's session directory
  const sessionDir = path.join(process.env.HOME, '.claude/projects', projectId);
  await ensureDir(sessionDir);

  const sessionFile = path.join(sessionDir, `${sessionId}.jsonl`);

  if (contextName) {
    // Find context (check golden first, then personal)
    const goldenContextPath = path.join(
      getGoldenTasksDir(cwd), taskId, 'contexts', `${contextName}.jsonl`
    );
    const personalContextPath = path.join(
      getPersonalTasksDir(cwd), taskId, 'contexts', `${contextName}.jsonl`
    );
    
    let contextPath: string | null = null;
    let contextLocation: 'golden' | 'personal' = 'personal';
    
    if (await fileExists(goldenContextPath)) {
      contextPath = goldenContextPath;
      contextLocation = 'golden';
    } else if (await fileExists(personalContextPath)) {
      contextPath = personalContextPath;
      contextLocation = 'personal';
    }

    if (contextPath) {
      await fs.copyFile(contextPath, sessionFile);
      const stats = await getSessionStats(sessionFile);
      console.log(`✓ Loaded context: ${contextName}`);
      console.log(`  ${stats.messages} messages, ~${Math.round(stats.tokens / 1000)}k tokens`);
      console.log(`  Location: ${contextLocation}${contextLocation === 'golden' ? ' ⭐' : ''}`);
    } else {
      console.error(`❌ Context '${contextName}' not found in task '${taskId}'`);
      console.error('');

      // List available contexts
      const contexts = await listContexts(taskId, cwd);
      
      if (contexts.length > 0) {
        console.error('Available contexts:');
        
        const golden = contexts.filter(c => c.location === 'golden');
        const personal = contexts.filter(c => c.location === 'personal');
        
        if (golden.length > 0) {
          console.error('  Golden (shared):');
          golden.forEach(c => console.error(`    - ${c.name} ⭐`));
        }
        
        if (personal.length > 0) {
          console.error('  Personal:');
          personal.forEach(c => console.error(`    - ${c.name}`));
        }
      } else {
        console.error('No contexts saved yet for this task.');
      }

      process.exit(1);
    }
  } else {
    // Create empty session for fresh start
    await fs.writeFile(sessionFile, '');
    console.log(`✓ Created fresh session`);
  }

  // Record session→task mapping
  await recordSessionTask(sessionId, taskId, contextName);

  // Output session ID and resume command
  console.log('');
  console.log(`Session: ${sessionId}`);
  console.log(`Resume:  /resume ${sessionId}`);
  
  // Output just the session ID on the last line for capture
  console.log('');
  console.log(sessionId);
  
  return sessionId;
}

async function recordSessionTask(
  sessionId: string,
  taskId: string,
  contextName?: string
) {
  const cwd = process.cwd();
  const projectId = getProjectId(cwd);
  const personalDir = getPersonalProjectDir(cwd);
  
  const mapPath = path.join(personalDir, 'session-task-map.json');

  let map: Record<string, any> = {};

  try {
    const content = await fs.readFile(mapPath, 'utf-8');
    map = JSON.parse(content);
  } catch {
    // File doesn't exist yet, start with empty map
  }

  map[sessionId] = {
    task_id: taskId,
    context_name: contextName || null,
    created_at: new Date().toISOString()
  };

  await ensureDir(path.dirname(mapPath));
  await fs.writeFile(mapPath, JSON.stringify(map, null, 2));
}

// Main
const [taskId, contextName] = process.argv.slice(2);

if (!taskId) {
  console.error('Usage: prepare-context <task-id> [context-name]');
  process.exit(1);
}

prepareContext(taskId, contextName).catch((err) => {
  console.error('Error preparing context:', err.message);
  process.exit(1);
});
