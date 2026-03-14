#!/usr/bin/env tsx

/**
 * rename-context.ts - Rename a context within a task
 *
 * Renames the context file (and its .meta.json if present) in both
 * personal and golden locations.
 *
 * Usage:
 *   rename-context <task-id> <old-name> <new-name>
 */

import fs from 'fs/promises';
import path from 'path';
import {
  getGoldenTasksDir,
  getPersonalTasksDir,
  fileExists,
  validateName,
} from '../src/utils.js';

async function tryRename(oldPath: string, newPath: string): Promise<boolean> {
  if (!await fileExists(oldPath)) return false;
  if (await fileExists(newPath)) {
    console.error(`❌ A context named '${path.basename(newPath, '.jsonl')}' already exists at: ${newPath}`);
    process.exit(1);
  }
  await fs.rename(oldPath, newPath);
  return true;
}

async function main() {
  const [taskId, oldName, newName] = process.argv.slice(2);

  if (!taskId || !oldName || !newName) {
    console.error('Usage: rename-context <task-id> <old-name> <new-name>');
    process.exit(1);
  }

  const validation = validateName(newName);
  if (!validation.valid) {
    console.error(`❌ Invalid new name: ${validation.error}`);
    process.exit(1);
  }

  const cwd = process.cwd();
  let renamed = false;

  // Golden location
  const goldenCtxDir = path.join(getGoldenTasksDir(cwd), taskId, 'contexts');
  const goldenOld = path.join(goldenCtxDir, `${oldName}.jsonl`);
  const goldenNew = path.join(goldenCtxDir, `${newName}.jsonl`);
  if (await tryRename(goldenOld, goldenNew)) {
    console.log(`✓ Renamed golden context: ${oldName} → ${newName}`);
    renamed = true;
    // Rename meta if present
    const metaOld = goldenOld.replace('.jsonl', '.meta.json');
    const metaNew = goldenNew.replace('.jsonl', '.meta.json');
    if (await fileExists(metaOld)) await fs.rename(metaOld, metaNew);
  }

  // Personal location
  const personalCtxDir = path.join(getPersonalTasksDir(cwd), taskId, 'contexts');
  const personalOld = path.join(personalCtxDir, `${oldName}.jsonl`);
  const personalNew = path.join(personalCtxDir, `${newName}.jsonl`);
  if (await tryRename(personalOld, personalNew)) {
    console.log(`✓ Renamed personal context: ${oldName} → ${newName}`);
    renamed = true;
    const metaOld = personalOld.replace('.jsonl', '.meta.json');
    const metaNew = personalNew.replace('.jsonl', '.meta.json');
    if (await fileExists(metaOld)) await fs.rename(metaOld, metaNew);
  }

  if (!renamed) {
    console.error(`❌ Context '${oldName}' not found in task '${taskId}'`);
    process.exit(1);
  }

  console.log(`\n✓ Renamed: ${oldName} → ${newName} (task: ${taskId})`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
