#!/usr/bin/env tsx

/**
 * context-list.ts - List contexts for a task
 * 
 * v13.0: Lists:
 * - Active sessions from ~/.claude/projects/<project-id>/
 * - Saved personal contexts
 * - Saved golden contexts
 * 
 * Output format: JSON with sessions and contexts
 */

import fs from 'fs/promises';
import path from 'path';
import { 
  listContexts, 
  formatDate, 
  getCurrentTask, 
  getProjectId,
  getSessionStats,
  fileExists
} from '../src/utils.js';

interface SessionInfo {
  id: string;
  filePath: string;
  messages: number;
  tokens: number;
  lastModified: Date;
  isCurrent: boolean;
}

/**
 * List active sessions from ~/.claude/projects/<project-id>/
 */
async function listActiveSessions(cwd: string = process.cwd()): Promise<SessionInfo[]> {
  const projectId = getProjectId(cwd);
  const sessionsDir = path.join(process.env.HOME!, '.claude/projects', projectId);
  
  const sessions: SessionInfo[] = [];
  
  try {
    const entries = await fs.readdir(sessionsDir);
    
    // Filter for UUID-named .jsonl files (session files)
    const sessionFiles = entries.filter(f => {
      // UUID pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.jsonl
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jsonl$/i.test(f);
    });
    
    // Find the most recent session (likely the current one)
    let mostRecentTime = 0;
    let mostRecentId = '';
    
    for (const file of sessionFiles) {
      const filePath = path.join(sessionsDir, file);
      const fileStats = await fs.stat(filePath);
      
      if (fileStats.mtime.getTime() > mostRecentTime) {
        mostRecentTime = fileStats.mtime.getTime();
        mostRecentId = file.replace('.jsonl', '');
      }
    }
    
    for (const file of sessionFiles) {
      const sessionId = file.replace('.jsonl', '');
      const filePath = path.join(sessionsDir, file);
      
      try {
        const stats = await getSessionStats(filePath);
        const fileStats = await fs.stat(filePath);
        
        // Skip empty sessions
        if (stats.messages === 0) continue;
        
        sessions.push({
          id: sessionId,
          filePath,
          messages: stats.messages,
          tokens: stats.tokens,
          lastModified: fileStats.mtime,
          isCurrent: sessionId === mostRecentId
        });
      } catch {
        // Skip files that can't be read
      }
    }
    
    // Sort by last modified (most recent first)
    sessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    
  } catch {
    // Directory doesn't exist or can't be read
  }
  
  return sessions;
}

async function main() {
  const taskId = process.argv[2] || await getCurrentTask();
  const cwd = process.cwd();
  const projectId = getProjectId(cwd);
  
  console.error(`Project: ${cwd}`);
  console.error(`Project ID: ${projectId}`);
  console.error(`Current task: ${taskId}`);
  console.error('');
  
  // Get active sessions
  const sessions = await listActiveSessions(cwd);
  
  // Get saved contexts
  const contexts = await listContexts(taskId, cwd);
  
  // Display active sessions
  if (sessions.length > 0) {
    console.error('Active sessions (from ~/.claude/projects/):');
    for (const sess of sessions) {
      const currentMarker = sess.isCurrent ? ' (current)' : '';
      const shortId = sess.id.slice(0, 8) + '...';
      console.error(`  - ${shortId}${currentMarker} (${sess.messages} msgs, ~${Math.round(sess.tokens / 1000)}k tokens) - ${formatDate(sess.lastModified)}`);
    }
    console.error('');
  }
  
  // Separate saved contexts by location
  const golden = contexts.filter(c => c.location === 'golden');
  const personal = contexts.filter(c => c.location === 'personal');
  
  // Display saved contexts
  if (personal.length > 0) {
    console.error('Saved personal contexts:');
    for (const ctx of personal) {
      console.error(`  - ${ctx.name} (${ctx.messages} msgs) - ${formatDate(ctx.lastModified)}`);
    }
    console.error('');
  }
  
  if (golden.length > 0) {
    console.error('Saved golden contexts (shared):');
    for (const ctx of golden) {
      console.error(`  - ${ctx.name} ⭐ (${ctx.messages} msgs) - ${formatDate(ctx.lastModified)}`);
    }
    console.error('');
  }
  
  if (sessions.length === 0 && contexts.length === 0) {
    console.error('No sessions or contexts found.');
    console.error('');
    console.error('Save your current session with: /context-save <name>');
  } else {
    console.error(`Total: ${sessions.length} session(s), ${contexts.length} saved context(s)`);
  }
  console.error('');
  
  // Output JSON to stdout (for machine reading)
  const output = {
    projectId,
    taskId,
    sessions: sessions.map(s => ({
      id: s.id,
      messages: s.messages,
      tokens: s.tokens,
      lastModified: s.lastModified.toISOString(),
      isCurrent: s.isCurrent
    })),
    contexts: contexts.map(c => ({
      name: c.name,
      location: c.location,
      messages: c.messages,
      tokens: c.tokens,
      lastModified: c.lastModified.toISOString()
    }))
  };
  
  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
