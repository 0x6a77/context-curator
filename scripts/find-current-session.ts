#!/usr/bin/env tsx

/**
 * find-current-session.ts - Find the current session file
 * 
 * Looks for the most recently modified session file in Claude Code's
 * project session directory.
 */

import fs from 'fs/promises';
import path from 'path';
import { getProjectId, getSessionStats, formatDate } from '../src/utils.js';

async function findCurrentSession() {
  const cwd = process.cwd();
  const projectId = getProjectId(cwd);
  const sessionDir = path.join(process.env.HOME!, '.claude/projects', projectId);
  
  try {
    const entries = await fs.readdir(sessionDir);
    const jsonlFiles = entries.filter(f => f.endsWith('.jsonl'));
    
    if (jsonlFiles.length === 0) {
      console.error('❌ No session files found');
      console.error(`   Directory: ${sessionDir}`);
      process.exit(1);
    }
    
    // Find most recently modified session
    let mostRecent: { file: string; mtime: Date } | null = null;
    
    for (const file of jsonlFiles) {
      const filePath = path.join(sessionDir, file);
      const stats = await fs.stat(filePath);
      
      if (!mostRecent || stats.mtime > mostRecent.mtime) {
        mostRecent = { file, mtime: stats.mtime };
      }
    }
    
    if (!mostRecent) {
      console.error('❌ No session files found');
      process.exit(1);
    }
    
    const sessionPath = path.join(sessionDir, mostRecent.file);
    const sessionId = mostRecent.file.replace('.jsonl', '');
    const stats = await getSessionStats(sessionPath);
    
    // Output session info
    console.log(`Session ID: ${sessionId}`);
    console.log(`Path: ${sessionPath}`);
    console.log(`Messages: ${stats.messages}`);
    console.log(`Tokens: ~${Math.round(stats.tokens / 1000)}k`);
    console.log(`Modified: ${formatDate(mostRecent.mtime)}`);
    
    // Output just the path on the last line for capture
    console.log('');
    console.log(sessionPath);
    
  } catch (error: any) {
    console.error('❌ Error finding session:', error.message);
    process.exit(1);
  }
}

findCurrentSession().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
