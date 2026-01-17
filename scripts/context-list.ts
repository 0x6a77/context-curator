#!/usr/bin/env tsx

/**
 * context-list.ts - List contexts for a task
 * 
 * v13.0: Lists both golden and personal contexts
 * 
 * Output format: JSON array of context info
 */

import { listContexts, formatDate, getCurrentTask } from '../src/utils.js';

async function main() {
  const taskId = process.argv[2] || await getCurrentTask();
  
  console.error(`Listing contexts for task: ${taskId}`);
  console.error('');
  
  const contexts = await listContexts(taskId);
  
  if (contexts.length === 0) {
    console.error('No contexts found for this task.');
    console.error('');
    console.error('Save one with: /context-save <name>');
    console.log('[]');
    return;
  }
  
  // Separate by location
  const golden = contexts.filter(c => c.location === 'golden');
  const personal = contexts.filter(c => c.location === 'personal');
  
  // Display summary to stderr (for human reading)
  if (personal.length > 0) {
    console.error('Personal contexts:');
    for (const ctx of personal) {
      console.error(`  - ${ctx.name} (${ctx.messages} msgs) - ${formatDate(ctx.lastModified)}`);
    }
    console.error('');
  }
  
  if (golden.length > 0) {
    console.error('Golden contexts (shared):');
    for (const ctx of golden) {
      console.error(`  - ${ctx.name} ⭐ (${ctx.messages} msgs) - ${formatDate(ctx.lastModified)}`);
    }
    console.error('');
  }
  
  console.error(`Total: ${contexts.length} context(s)`);
  console.error('');
  
  // Output JSON to stdout (for machine reading)
  console.log(JSON.stringify(contexts, null, 2));
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
