#!/usr/bin/env tsx

/**
 * save-context.ts - Save the current session as a context
 * 
 * Usage:
 *   save-context <task-id> <context-name> [--golden|--personal] [--session-id <uuid>]
 * 
 * Defaults to --personal if not specified.
 * When --session-id is provided, uses that session file directly instead of
 * searching for the most recent file.
 */

import fs from 'fs/promises';
import path from 'path';
import {
  getProjectId,
  getGoldenTasksDir,
  getPersonalTasksDir,
  getPersonalProjectDir,
  getSessionStats,
  ensureDir,
  fileExists,
  validateName,
  formatDate,
  checkGoldenContextSize,
  MAX_GOLDEN_SIZE_BYTES
} from '../src/utils.js';

async function saveContext(taskId: string, contextName: string, isGolden: boolean, sessionId?: string) {
  const cwd = process.cwd();

  // Find the session file
  const sessionDir = getPersonalProjectDir(cwd);
  
  let sessionPath: string | null = null;

  if (sessionId) {
    // Use the provided session ID directly
    const candidate = path.join(sessionDir, `${sessionId}.jsonl`);
    if (await fileExists(candidate)) {
      sessionPath = candidate;
    } else {
      console.error(`❌ Session file not found for ID: ${sessionId}`);
      console.error(`   Expected: ${candidate}`);
      process.exit(1);
    }
  } else {
    // Fall back to most recent session file heuristic
    let mostRecentMtime: Date | null = null;
    
    try {
      const entries = await fs.readdir(sessionDir);
      const jsonlFiles = entries.filter(f => f.endsWith('.jsonl'));
      
      for (const file of jsonlFiles) {
        const filePath = path.join(sessionDir, file);
        const stats = await fs.stat(filePath);
        
        if (!mostRecentMtime || stats.mtime > mostRecentMtime) {
          mostRecentMtime = stats.mtime;
          sessionPath = filePath;
        }
      }
    } catch (error: any) {
      console.error('❌ Error reading session directory:', error.message);
      process.exit(1);
    }
    
    if (!sessionPath) {
      console.error('❌ No session file found');
      console.error(`   Directory: ${sessionDir}`);
      process.exit(1);
    }
  }

  // Enforce size limit for golden contexts
  if (isGolden) {
    const sizeCheck = await checkGoldenContextSize(sessionPath);
    if (!sizeCheck.ok) {
      const sizeKB = Math.round(sizeCheck.sizeBytes! / 1024);
      console.error(`❌ Context too large for golden save (${sizeKB}KB, max 100KB)`);
      console.error('');
      console.error('Golden contexts are committed to git and must stay under 100KB.');
      console.error('Options:');
      console.error('  1. Save as personal instead (no size limit)');
      console.error('  2. Use /context-manage to trim the session first');
      process.exit(1);
    }
  }

  // Enforce size limit for golden contexts
  if (isGolden) {
    const sizeCheck = await checkGoldenContextSize(sessionPath);
    if (!sizeCheck.ok) {
      const sizeKB = Math.round(sizeCheck.sizeBytes! / 1024);
      console.error(`❌ Context too large for golden save (${sizeKB}KB, max 100KB)`);
      console.error('');
      console.error('Golden contexts are committed to git and must stay under 100KB.');
      console.error('Options:');
      console.error('  1. Save as personal instead (no size limit)');
      console.error('  2. Use /context-manage to trim the session first');
      process.exit(1);
    }
  }
  
  // Determine target directory
  const tasksDir = isGolden ? getGoldenTasksDir(cwd) : getPersonalTasksDir(cwd);
  const contextsDir = path.join(tasksDir, taskId, 'contexts');
  const targetPath = path.join(contextsDir, `${contextName}.jsonl`);
  
  // Check if context already exists
  if (await fileExists(targetPath)) {
    // Create backup
    const backupPath = targetPath.replace('.jsonl', `.backup-${Date.now()}.jsonl`);
    await fs.copyFile(targetPath, backupPath);
    console.log(`⚠️  Context '${contextName}' exists, backed up to:`);
    console.log(`   ${path.basename(backupPath)}`);
  }
  
  // Ensure directory exists
  await ensureDir(contextsDir);
  
  // Copy session to context
  await fs.copyFile(sessionPath, targetPath);
  
  // Get stats
  const stats = await getSessionStats(targetPath);
  const location = isGolden ? 'golden (shared)' : 'personal';

  // Update auto memory with context info (best-effort, non-blocking)
  try {
    const { spawn } = await import('child_process');
    const memoryScript = path.join(
      process.env.HOME!,
      '.claude/context-curator/dist/scripts/update-memory.js'
    );
    spawn('node', [memoryScript, taskId, contextName, isGolden ? 'golden' : 'personal', String(stats.messages)], {
      detached: true,
      stdio: 'ignore'
    }).unref();
  } catch {
    // Non-fatal: memory update is best-effort
  }
  
  // Output results
  console.log('');
  console.log(`✓ Saved as ${location} context${isGolden ? ' ⭐' : ''}`);
  console.log(`✓ Name: ${contextName}`);
  console.log(`✓ Task: ${taskId}`);
  console.log(`✓ Messages: ${stats.messages}, ~${Math.round(stats.tokens / 1000)}k tokens`);
  console.log(`✓ Location: ${targetPath}`);
  
  if (isGolden) {
    console.log('');
    console.log('Next steps:');
    console.log(`  git add ${path.relative(cwd, targetPath)}`);
    console.log(`  git commit -m "Add ${contextName} context for ${taskId}"`);
    console.log('  git push');
  }
}

// Parse arguments
const args = process.argv.slice(2);
const isGolden = args.includes('--golden');
const isPersonal = args.includes('--personal');

// Extract --session-id value
let sessionId: string | undefined;
const sessionIdIndex = args.indexOf('--session-id');
if (sessionIdIndex !== -1 && args[sessionIdIndex + 1]) {
  sessionId = args[sessionIdIndex + 1];
}

const positionalArgs = args.filter(arg => !arg.startsWith('--') && arg !== sessionId);

const [taskId, contextName] = positionalArgs;

if (!taskId || !contextName) {
  console.error('Usage: save-context <task-id> <context-name> [--golden|--personal] [--session-id <uuid>]');
  process.exit(1);
}

// Validate context name
const validation = validateName(contextName);
if (!validation.valid) {
  console.error(`❌ Invalid context name: ${validation.error}`);
  process.exit(1);
}

// Default to personal if neither specified
const saveAsGolden = isGolden && !isPersonal;

saveContext(taskId, contextName, saveAsGolden, sessionId).catch((err) => {
  console.error('Error saving context:', err.message);
  process.exit(1);
});
