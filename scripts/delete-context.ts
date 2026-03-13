#!/usr/bin/env tsx

/**
 * delete-context.ts - Delete a context
 * 
 * Usage:
 *   delete-context <task-id> <context-name>
 */

import fs from 'fs/promises';
import path from 'path';
import {
  getGoldenTasksDir,
  getPersonalTasksDir,
  fileExists,
  getSessionStats
} from '../src/utils.js';

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const positional = args.filter(a => !a.startsWith('--'));
  const [taskId, contextName] = positional;
  
  if (!taskId || !contextName) {
    console.error('Usage: delete-context <task-id> <context-name>');
    process.exit(1);
  }
  
  const cwd = process.cwd();
  
  // Find context
  const goldenPath = path.join(getGoldenTasksDir(cwd), taskId, 'contexts', `${contextName}.jsonl`);
  const personalPath = path.join(getPersonalTasksDir(cwd), taskId, 'contexts', `${contextName}.jsonl`);
  
  let contextPath: string | null = null;
  let location: 'golden' | 'personal' = 'personal';
  
  if (await fileExists(goldenPath)) {
    contextPath = goldenPath;
    location = 'golden';
  } else if (await fileExists(personalPath)) {
    contextPath = personalPath;
    location = 'personal';
  }
  
  if (!contextPath) {
    console.error(`❌ Context '${contextName}' not found in task '${taskId}'`);
    process.exit(1);
  }
  
  // Get stats before deletion
  const stats = await getSessionStats(contextPath);

  // Protect golden contexts from accidental deletion
  if (location === 'golden' && !force) {
    console.error(`❌ Cannot delete golden context '${contextName}' without --force`);
    console.error('   Golden contexts are shared with the team and committed to git.');
    console.error(`   Use: delete-context ${taskId} ${contextName} --force`);
    process.exit(1);
  }
  
  // Delete
  await fs.unlink(contextPath);
  
  console.log(`✓ Deleted context: ${contextName}`);
  console.log(`✓ Task: ${taskId}`);
  console.log(`✓ Was: ${stats.messages} messages, ~${Math.round(stats.tokens / 1000)}k tokens`);
  
  if (location === 'golden') {
    console.log('');
    console.log('Note: This was a golden context. To remove from git:');
    console.log(`  git rm ${path.relative(cwd, contextPath)}`);
    console.log(`  git commit -m "Remove ${contextName} context"`);
    console.log('  git push');
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
