#!/usr/bin/env tsx

/**
 * find-context.ts - Find a context file by name
 * 
 * Usage:
 *   find-context <task-id> <context-name> [--personal|--golden|--any]
 * 
 * Outputs the full path to the context file, or error if not found.
 */

import path from 'path';
import {
  getGoldenTasksDir,
  getPersonalTasksDir,
  fileExists,
  listContexts
} from '../src/utils.js';

async function main() {
  const args = process.argv.slice(2);
  const isPersonalOnly = args.includes('--personal');
  const isGoldenOnly = args.includes('--golden');
  const positionalArgs = args.filter(arg => !arg.startsWith('--'));
  
  const [taskId, contextName] = positionalArgs;
  
  if (!taskId || !contextName) {
    console.error('Usage: find-context <task-id> <context-name> [--personal|--golden|--any]');
    process.exit(1);
  }
  
  const cwd = process.cwd();
  
  // Build paths
  const goldenPath = path.join(getGoldenTasksDir(cwd), taskId, 'contexts', `${contextName}.jsonl`);
  const personalPath = path.join(getPersonalTasksDir(cwd), taskId, 'contexts', `${contextName}.jsonl`);
  
  let foundPath: string | null = null;
  let location: 'golden' | 'personal' | null = null;
  
  // Check based on flags
  if (isGoldenOnly) {
    if (await fileExists(goldenPath)) {
      foundPath = goldenPath;
      location = 'golden';
    }
  } else if (isPersonalOnly) {
    if (await fileExists(personalPath)) {
      foundPath = personalPath;
      location = 'personal';
    }
  } else {
    // Default: check golden first, then personal
    if (await fileExists(goldenPath)) {
      foundPath = goldenPath;
      location = 'golden';
    } else if (await fileExists(personalPath)) {
      foundPath = personalPath;
      location = 'personal';
    }
  }
  
  if (foundPath && location) {
    console.error(`Found context: ${contextName}`);
    console.error(`Location: ${location}`);
    console.error(`Path: ${foundPath}`);
    console.log(foundPath);
  } else {
    console.error(`❌ Context '${contextName}' not found in task '${taskId}'`);
    
    const searchLocation = isPersonalOnly ? 'personal' : isGoldenOnly ? 'golden' : 'any';
    console.error(`   Searched: ${searchLocation} storage`);
    console.error('');
    
    // List available contexts
    const contexts = await listContexts(taskId, cwd);
    const filtered = isPersonalOnly 
      ? contexts.filter(c => c.location === 'personal')
      : isGoldenOnly 
        ? contexts.filter(c => c.location === 'golden')
        : contexts;
    
    if (filtered.length > 0) {
      console.error('Available contexts:');
      for (const ctx of filtered) {
        const marker = ctx.location === 'golden' ? ' ⭐' : '';
        console.error(`  - ${ctx.name}${marker}`);
      }
    } else {
      console.error('No contexts found.');
    }
    
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
