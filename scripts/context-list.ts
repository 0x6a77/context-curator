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
  
  // Separate saved contexts by location and sort newest first
  const golden = contexts.filter(c => c.location === 'golden')
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  const personal = contexts.filter(c => c.location === 'personal')
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

  // Display active sessions (compact single-line format)
  if (sessions.length > 0) {
    console.error('Sessions:');
    for (const sess of sessions) {
      const currentMarker = sess.isCurrent ? '(current)' : '        ';
      const shortId = sess.id.slice(0, 8) + '...';
      const tokens = `~${Math.round(sess.tokens / 1000)}k`;
      const time = formatDate(sess.lastModified);
      console.error(`  ${shortId} ${currentMarker} ${String(sess.messages).padStart(3)} msgs ${tokens.padStart(5)} - ${time}`);
    }
    console.error('');
  }

  // Display personal contexts (compact single-line format, newest first)
  if (personal.length > 0) {
    console.error('Personal contexts:');
    for (const ctx of personal) {
      const name = ctx.name.padEnd(20).slice(0, 20);
      const time = formatDate(ctx.lastModified);
      console.error(`  ${name} ${String(ctx.messages).padStart(3)} msgs - ${time} [${taskId}]`);
    }
    console.error('');
  }

  // Display golden contexts (compact single-line format, newest first)
  if (golden.length > 0) {
    console.error('Golden contexts:');
    for (const ctx of golden) {
      const name = ctx.name.padEnd(20).slice(0, 20);
      const time = formatDate(ctx.lastModified);
      console.error(`  ${name} ${String(ctx.messages).padStart(3)} msgs - ${time} [${taskId}] ⭐`);
    }
    console.error('');
  }

  if (sessions.length === 0 && contexts.length === 0) {
    console.error('No sessions or contexts found.');
    console.error('Save your current session with: /context-save <name>');
    console.error('');
  }
  
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
