#!/usr/bin/env tsx
import * as readline from 'readline';
import { readSession } from '../src/session-reader.js';
import { deleteSession } from '../src/session-writer.js';

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
