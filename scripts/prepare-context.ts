#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

async function prepareContext(taskId: string, contextName?: string) {
  const cwd = process.cwd();
  const taskDir = path.join(cwd, '.context-curator/tasks', taskId);

  // Verify task exists
  try {
    await fs.access(path.join(taskDir, 'CLAUDE.md'));
  } catch {
    console.error(`❌ Task '${taskId}' not found`);
    process.exit(1);
  }

  // Generate session ID
  const sessionId = `sess-${randomUUID().slice(0, 8)}`;

  // Create session file in project's sessions directory
  // Note: Claude Code stores sessions in different locations depending on version
  // We'll create in .claude/sessions as a fallback
  const sessionDir = path.join(cwd, '.claude/sessions');
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

  // Record session→task mapping
  await recordSessionTask(sessionId, taskId, contextName);

  // Output session ID as the last line (for capture)
  console.log(sessionId);
  return sessionId;
}

async function recordSessionTask(
  sessionId: string,
  taskId: string,
  contextName?: string
) {
  const mapPath = path.join(
    process.cwd(),
    '.context-curator/tasks/session-task-map.json'
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
