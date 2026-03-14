#!/usr/bin/env tsx

/**
 * archive-context.ts - Archive a context by moving it to contexts/archives/
 *
 * Moves the context file (and its .meta.json if present) to an archives/
 * subdirectory within the task's contexts directory.
 *
 * Usage:
 *   archive-context <task-id> <context-name>
 */

import fs from 'fs/promises';
import path from 'path';
import {
  getGoldenTasksDir,
  getPersonalTasksDir,
  fileExists,
  ensureDir,
} from '../src/utils.js';

async function tryArchive(ctxDir: string, name: string, label: string): Promise<boolean> {
  const srcPath = path.join(ctxDir, `${name}.jsonl`);
  if (!await fileExists(srcPath)) return false;

  const archiveDir = path.join(ctxDir, 'archives');
  await ensureDir(archiveDir);

  const dstPath = path.join(archiveDir, `${name}.jsonl`);
  if (await fileExists(dstPath)) {
    console.error(`❌ Archive already contains a context named '${name}' at: ${dstPath}`);
    process.exit(1);
  }

  await fs.rename(srcPath, dstPath);
  console.log(`✓ Archived ${label} context: ${name}`);
  console.log(`  → ${dstPath}`);

  // Move meta if present
  const metaSrc = srcPath.replace('.jsonl', '.meta.json');
  if (await fileExists(metaSrc)) {
    await fs.rename(metaSrc, dstPath.replace('.jsonl', '.meta.json'));
  }

  return true;
}

async function main() {
  const [taskId, contextName] = process.argv.slice(2);

  if (!taskId || !contextName) {
    console.error('Usage: archive-context <task-id> <context-name>');
    process.exit(1);
  }

  const cwd = process.cwd();
  let archived = false;

  const goldenCtxDir = path.join(getGoldenTasksDir(cwd), taskId, 'contexts');
  if (await tryArchive(goldenCtxDir, contextName, 'golden')) archived = true;

  const personalCtxDir = path.join(getPersonalTasksDir(cwd), taskId, 'contexts');
  if (await tryArchive(personalCtxDir, contextName, 'personal')) archived = true;

  if (!archived) {
    console.error(`❌ Context '${contextName}' not found in task '${taskId}'`);
    process.exit(1);
  }

  console.log(`\n✓ Archive complete for context '${contextName}' in task '${taskId}'`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
