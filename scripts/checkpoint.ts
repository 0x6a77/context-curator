#!/usr/bin/env tsx
import { readSession } from '../src/session-reader.js';
import { writeSession } from '../src/session-writer.js';

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

async function main() {
  const sourceId = process.argv[2];
  const newName = process.argv[3];

  if (!sourceId || !newName) {
    console.error('Usage: npm run context checkpoint <session-id> <new-name>');
    process.exit(1);
  }

  // Validate UUID format
  if (!isValidUUID(sourceId)) {
    console.error('\n❌ Invalid session ID format.');
    console.error('   Session IDs must be UUIDs (e.g., 8e14f625-bd1a-4e79-a382-2d6c0649df97)');
    console.error('   Use "context list" to see available sessions.\n');
    process.exit(1);
  }

  console.log(`\nCreating checkpoint: ${sourceId} → ${newName}\n`);

  try {
    // Read source session
    const session = await readSession(sourceId);

    console.log(`Source: ${sourceId}`);
    console.log(`Target: ${newName}`);
    console.log('');

    // Write as checkpoint
    await writeSession(newName, session.messages);

    console.log(`✓ Checkpoint created: ${newName}`);
    console.log('');
  } catch (err) {
    console.error(`\n❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}\n`);
    process.exit(1);
  }
}

main().catch(console.error);
