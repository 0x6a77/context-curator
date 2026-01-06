#!/usr/bin/env tsx
import { readSession } from '../src/session-reader.js';

async function main() {
  const sessionId = process.argv[2];
  
  if (!sessionId) {
    console.error('Usage: npm run dump <session-id>');
    process.exit(1);
  }
  
  try {
    const session = await readSession(sessionId);
    console.log(`\nRaw JSONL for ${sessionId}`);
    console.log(`Session type: ${session.isNamed ? 'Named' : 'Unnamed'}\n`);
    console.log('─'.repeat(70));
    
    for (const message of session.messages) {
      console.log(JSON.stringify(message, null, 2));
      console.log('─'.repeat(70));
    }
    
    console.log(`\nTotal messages: ${session.messageCount}`);
    console.log(`Total tokens: ${session.tokenCount.toLocaleString()}\n`);
  } catch (err) {
    console.error(`\n❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}\n`);
    process.exit(1);
  }
}

main().catch(console.error);
