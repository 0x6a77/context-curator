#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

async function prepareContext(taskId: string, contextName?: string) {
  // Verify HOME is set first
  if (!process.env.HOME) {
    console.error('❌ HOME environment variable not set');
    process.exit(1);
  }

  const cwd = process.cwd();
  const projectId = cwd.replace(/\//g, '-');
  const taskDir = path.join(process.env.HOME, '.claude/projects', projectId, 'tasks', taskId);

  // Verify task exists
  try {
    await fs.access(path.join(taskDir, 'CLAUDE.md'));
  } catch {
    console.error(`❌ Task '${taskId}' not found`);
    process.exit(1);
  }

  // Generate proper UUID session ID (Claude Code format)
  const sessionId = randomUUID();

  // Create session file in Claude Code's session directory
  const sessionDir = path.join(process.env.HOME, '.claude/projects', projectId);
  await fs.mkdir(sessionDir, { recursive: true });

  const sessionFile = path.join(sessionDir, `${sessionId}.jsonl`);

  if (contextName) {
    // Copy context messages to new session
    const contextPath = path.join(taskDir, 'contexts', `${contextName}.jsonl`);

    try {
      await fs.access(contextPath);
      await fs.copyFile(contextPath, sessionFile);
      const stats = await getSessionStats(sessionFile);
      console.log(`✓ Loaded context: ${contextName} (${stats.messages} messages)`);
    } catch (error) {
      console.error(`❌ Context '${contextName}' not found in task '${taskId}'`);

      // List available contexts
      const contextsDir = path.join(taskDir, 'contexts');
      try {
        const contexts = await fs.readdir(contextsDir);
        const jsonlContexts = contexts
          .filter(f => f.endsWith('.jsonl'))
          .map(f => f.replace('.jsonl', ''));

        if (jsonlContexts.length > 0) {
          console.error('\nAvailable contexts:');
          jsonlContexts.forEach(c => console.error(`   - ${c}`));
        } else {
          console.error('   (No contexts saved yet)');
        }
      } catch {
        console.error('   (No contexts saved yet)');
      }

      process.exit(1);
    }
  } else {
    // Create empty session
    await fs.writeFile(sessionFile, '');
    console.log(`✓ Created fresh session`);
  }

  // Verify the file was actually created
  try {
    await fs.access(sessionFile);
    console.log(`✓ Session file created: ${sessionFile}`);
  } catch (error) {
    console.error(`❌ Failed to create session file: ${sessionFile}`);
    console.error(`   Error: ${error}`);
    process.exit(1);
  }

  // Record session→task mapping
  await recordSessionTask(sessionId, taskId, contextName);

  // Show resume command
  console.log(`\nResume with: /resume ${sessionId}`);

  // Output session ID as the last line (for capture)
  console.log(sessionId);
  return sessionId;
}

async function recordSessionTask(
  sessionId: string,
  taskId: string,
  contextName?: string
) {
  const cwd = process.cwd();
  const projectId = cwd.replace(/\//g, '-');
  const mapPath = path.join(
    process.env.HOME!,
    '.claude/projects',
    projectId,
    'tasks',
    'session-task-map.json'
  );

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

  await fs.writeFile(mapPath, JSON.stringify(map, null, 2));
}

async function getSessionStats(sessionPath: string) {
  const content = await fs.readFile(sessionPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  const totalChars = lines.reduce((sum, line) => {
    try {
      const msg = JSON.parse(line);
      const contentStr = typeof msg.content === 'string'
        ? msg.content
        : JSON.stringify(msg.content);
      return sum + contentStr.length;
    } catch {
      return sum;
    }
  }, 0);

  return {
    messages: lines.length,
    tokens: Math.ceil(totalChars / 4)
  };
}

const [taskId, contextName] = process.argv.slice(2);
if (!taskId) {
  console.error('Usage: prepare-context <task-id> [context-name]');
  process.exit(1);
}

prepareContext(taskId, contextName).catch((err) => {
  console.error('Error preparing context:', err.message);
  process.exit(1);
});
