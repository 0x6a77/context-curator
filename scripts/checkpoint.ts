#!/usr/bin/env tsx
import { readSession } from '../src/session-reader.js';
import { writeSession } from '../src/session-writer.js';

async function main() {
  const sourceId = process.argv[2];
  const newName = process.argv[3];

  if (!sourceId || !newName) {
    console.error('Usage: npm run context checkpoint <session-id> <new-name>');
    process.exit(1);
  }

  console.log(`\nCreating checkpoint: ${sourceId} → ${newName}\n`);

  try {
    // Read source session (can be named or unnamed)
    const session = await readSession(sourceId);

    console.log(`Source: ${sourceId} (${session.isNamed ? 'named' : 'unnamed'})`);
    console.log(`Target: ${newName} (will be named)`);
    console.log('');

    // Write as named session
    await writeSession(newName, session.messages, true);

    console.log(`✓ Checkpoint created: ${newName}`);
    console.log('');
    console.log(`Resume with: claude -r ${newName}`);
    console.log('');
  } catch (err) {
    console.error(`\n❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}\n`);
    process.exit(1);
  }
}

main().catch(console.error);
