#!/usr/bin/env tsx
import * as readline from 'readline';
import { readSession } from '../src/session-reader.js';
import { deleteSession } from '../src/session-writer.js';

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

async function confirmDeletion(sessionId: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`Are you sure you want to delete ${sessionId}? (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  const sessionId = process.argv[2];

  if (!sessionId) {
    console.error('Usage: npm run context delete <session-id>');
    process.exit(1);
  }

  // Validate UUID format
  if (!isValidUUID(sessionId)) {
    console.error('\n❌ Invalid session ID format.');
    console.error('   Session IDs must be UUIDs (e.g., 8e14f625-bd1a-4e79-a382-2d6c0649df97)');
    console.error('   Use "context list" to see available sessions.\n');
    process.exit(1);
  }

  try {
    // Read session first to verify it exists
    const session = await readSession(sessionId);

    console.log(`\nSession: ${sessionId}`);
    console.log(`Messages: ${session.messageCount}`);
    console.log(`Tokens: ${session.tokenCount.toLocaleString()}`);
    console.log('');

    // Confirm deletion
    const confirmed = await confirmDeletion(sessionId);

    if (!confirmed) {
      console.log('\nDeletion cancelled.\n');
      return;
    }

    // Delete with automatic backup
    console.log('\nCreating backup...');
    const backupName = await deleteSession(sessionId, true);

    console.log(`✓ Session deleted: ${sessionId}`);
    if (backupName) {
      console.log(`✓ Backup created: ${backupName}`);
    }
    console.log('');

  } catch (err) {
    console.error(`\n❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}\n`);
    process.exit(1);
  }
}

main().catch(console.error);
