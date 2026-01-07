#!/usr/bin/env tsx
import { runEditor } from '../src/editor.js';

async function main() {
  const sessionId = process.argv[2];
  const model = process.argv[3];
  
  if (!sessionId || !model) {
    console.error('\nUsage: npm run context manage <session-id> <model>');
    console.error('Models: sonnet, opus, haiku\n');
    console.error('Example:');
    console.error('  npm run context manage 8e14f625-bd1a-4e79-a382-2d6c0649df97 sonnet\n');
    process.exit(1);
  }
  
  if (!['sonnet', 'opus', 'haiku'].includes(model)) {
    console.error(`\n❌ Invalid model: ${model}`);
    console.error('Valid models: sonnet, opus, haiku\n');
    process.exit(1);
  }

  await runEditor(sessionId, model as 'sonnet' | 'opus' | 'haiku');
}

main().catch(console.error);
