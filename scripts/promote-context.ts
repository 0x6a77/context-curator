#!/usr/bin/env tsx

/**
 * promote-context.ts - Promote a personal context to golden
 * 
 * Usage:
 *   promote-context <task-id> <context-name> [--redacted <temp-file>]
 * 
 * Copies from personal storage to project golden storage.
 * If --redacted is provided, uses that file instead of the personal one.
 */

import fs from 'fs/promises';
import path from 'path';
import {
  getGoldenTasksDir,
  getPersonalTasksDir,
  getSessionStats,
  ensureDir,
  fileExists,
  checkGoldenContextSize
} from '../src/utils.js';

async function main() {
  const args = process.argv.slice(2);
  const redactedIndex = args.indexOf('--redacted');
  let redactedFile: string | null = null;
  
  if (redactedIndex !== -1 && args[redactedIndex + 1]) {
    redactedFile = args[redactedIndex + 1];
    args.splice(redactedIndex, 2);
  }
  
  const [taskId, contextName] = args;
  
  if (!taskId || !contextName) {
    console.error('Usage: promote-context <task-id> <context-name> [--redacted <temp-file>]');
    process.exit(1);
  }
  
  const cwd = process.cwd();
  
  // Source: personal storage (or redacted temp file)
  const personalPath = path.join(getPersonalTasksDir(cwd), taskId, 'contexts', `${contextName}.jsonl`);
  const sourcePath = redactedFile || personalPath;
  
  // Verify source exists
  if (!await fileExists(sourcePath)) {
    console.error(`❌ Source not found: ${sourcePath}`);
    process.exit(1);
  }

  // Enforce size limit for golden contexts
  const sizeCheck = await checkGoldenContextSize(sourcePath);
  if (!sizeCheck.ok) {
    const sizeKB = Math.round(sizeCheck.sizeBytes! / 1024);
    console.error(`❌ Context too large to promote (${sizeKB}KB, max 100KB)`);
    console.error('');
    console.error('Golden contexts are committed to git and must stay under 100KB.');
    console.error('Use /context-manage to trim the context first, then try again.');
    process.exit(1);
  }
  
  // Target: golden storage
  const goldenDir = path.join(getGoldenTasksDir(cwd), taskId, 'contexts');
  const goldenPath = path.join(goldenDir, `${contextName}.jsonl`);
  
  // Check if golden already exists
  if (await fileExists(goldenPath)) {
    // Create backup
    const backupPath = goldenPath.replace('.jsonl', `.backup-${Date.now()}.jsonl`);
    await fs.copyFile(goldenPath, backupPath);
    console.error(`⚠️  Golden context exists, backed up to:`);
    console.error(`   ${path.basename(backupPath)}`);
  }
  
  // Ensure golden directory exists
  await ensureDir(goldenDir);
  
  // Copy to golden
  await fs.copyFile(sourcePath, goldenPath);
  
  // Get stats
  const stats = await getSessionStats(goldenPath);
  
  // Report success
  console.log('');
  console.log(`✓ Promoted to golden context ⭐${redactedFile ? ' (redacted)' : ''}`);
  console.log(`✓ Name: ${contextName}`);
  console.log(`✓ Task: ${taskId}`);
  console.log(`✓ Messages: ${stats.messages}, ~${Math.round(stats.tokens / 1000)}k tokens`);
  console.log(`✓ Location: ${path.relative(cwd, goldenPath)}`);
  console.log('');
  console.log('Personal copy remains at:');
  console.log(`  ${personalPath}`);
  console.log('');
  console.log('Next steps:');
  console.log(`  git add ${path.relative(cwd, goldenPath)}`);
  console.log(`  git commit -m "Share ${contextName} context for ${taskId}"`);
  console.log('  git push');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
