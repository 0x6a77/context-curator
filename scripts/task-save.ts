#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function taskSave(contextName: string) {
  const cwd = process.cwd();

  // Validate context name
  if (!/^[a-z0-9-]+$/.test(contextName)) {
    console.error('❌ Invalid context name');
    console.error('   Must contain only: lowercase letters, numbers, hyphens');
    console.error('   Example: edge-cases, initial-setup, bug-fix-v2');
    process.exit(1);
  }

  // Get current task from @-import
  const currentTask = await getCurrentTask();
  console.log(`Task: ${currentTask}`);

  // Get current session ID from history
  const sessionId = await getCurrentSessionId();
  if (!sessionId) {
    console.error('❌ No active session found');
    console.error('   Start a session first with /task <task-id>');
    process.exit(1);
  }

  // Find the session file
  const sessionPath = await findSessionFile(sessionId);
  if (!sessionPath) {
    console.error(`❌ Session file not found for ${sessionId}`);
    process.exit(1);
  }

  // Prepare task contexts directory in global storage
  const projectId = cwd.replace(/\//g, '-');
  const taskDir = path.join(process.env.HOME!, '.claude/projects', projectId, 'tasks', currentTask);
  const contextsDir = path.join(taskDir, 'contexts');
  await fs.mkdir(contextsDir, { recursive: true });

  const destPath = path.join(contextsDir, `${contextName}.jsonl`);

  // Handle overwrite
  try {
    await fs.access(destPath);

    // Context exists, create backup
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const backup = `${contextName}-backup-${timestamp}.jsonl`;
    await fs.copyFile(destPath, path.join(contextsDir, backup));
    console.log(`✓ Backup created: ${backup}`);
  } catch {
    // Context doesn't exist, no backup needed
  }

  // Copy session to context
  await fs.copyFile(sessionPath, destPath);

  // Get stats
  const stats = await getSessionStats(destPath);
  const tokensFormatted = (stats.tokens / 1000).toFixed(1);

  console.log(`✓ Saved as '${contextName}' (${stats.messages} msgs, ${tokensFormatted}k tokens)`);
  console.log(`  Task: ${currentTask}`);
  console.log(`  Location: ${destPath}`);
}

async function getCurrentTask(): Promise<string> {
  const claudeMdPath = path.join(process.cwd(), '.claude/CLAUDE.md');

  try {
    const content = await fs.readFile(claudeMdPath, 'utf-8');
    // Match: @import ~/.claude/projects/<project-id>/tasks/<task-id>/CLAUDE.md
    const match = content.match(/@import ~\/\.claude\/projects\/[^\/]+\/tasks\/([^\/\s]+)\/CLAUDE\.md/);

    if (match) {
      return match[1];
    }
  } catch {
    // Fall through
  }

  // Default to 'default' task if no @-import found
  return 'default';
}

async function getCurrentSessionId(): Promise<string | null> {
  const historyPath = path.join(process.env.HOME!, '.claude/history.jsonl');

  try {
    const content = await fs.readFile(historyPath, 'utf-8');
    const lines = content.trim().split('\n');

    // Look for most recent session_id
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      try {
        const entry = JSON.parse(line);
        if (entry.session_id) {
          return entry.session_id;
        }
      } catch {
        continue;
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function findSessionFile(sessionId: string): Promise<string | null> {
  const cwd = process.cwd();
  const homeDir = process.env.HOME!;

  // Compute project directory for Claude Code's storage format
  const projectDir = cwd.replace(/\//g, '-');

  // Try possible session file locations
  const possiblePaths = [
    // Claude Code project-specific location
    path.join(homeDir, '.claude/projects', projectDir, `${sessionId}.jsonl`),
    // Local .claude/sessions (created by prepare-context)
    path.join(cwd, '.claude/sessions', `${sessionId}.jsonl`),
    // Global sessions directory
    path.join(homeDir, '.claude/sessions', `${sessionId}.jsonl`),
  ];

  for (const p of possiblePaths) {
    try {
      await fs.access(p);
      return p;
    } catch {
      continue;
    }
  }

  return null;
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

const contextName = process.argv[2];
if (!contextName) {
  console.error('Usage: task-save <context-name>');
  process.exit(1);
}

taskSave(contextName).catch((err) => {
  console.error('Error saving context:', err.message);
  process.exit(1);
});
