#!/usr/bin/env tsx
import * as path from 'path';
import { listSessionIds } from '../src/session-reader.js';

function getProjectDir(cwd: string): string {
  return cwd.replace(/\//g, '-');
}

async function main() {
  const cwd = process.cwd();
  const projectDir = getProjectDir(cwd);

  console.log('\n' + '═'.repeat(70));
  console.log('  Context Curator - Session Manager');
  console.log('═'.repeat(70));
  console.log(`📁 Operating on: ${cwd}`);
  console.log(`🔧 Project dir:  ${projectDir}`);
  console.log('');

  // List sessions
  const { named, unnamed } = await listSessionIds();

  console.log(`Found ${named.length} named session(s)`);
  console.log(`Found ${unnamed.length} unnamed session(s) for this project`);
  console.log('');

  if (named.length > 0) {
    console.log('Recent named sessions:');
    for (const id of named.slice(0, 3)) {
      console.log(`  • ${id}`);
    }
    if (named.length > 3) {
      console.log(`  ... and ${named.length - 3} more`);
    }
    console.log('');
  }

  if (unnamed.length > 0) {
    console.log('Recent unnamed sessions:');
    for (const id of unnamed.slice(0, 3)) {
      console.log(`  • ${id.slice(0, 24)}...`);
    }
    if (unnamed.length > 3) {
      console.log(`  ... and ${unnamed.length - 3} more`);
    }
    console.log('');
  }

  if (named.length === 0 && unnamed.length === 0) {
    console.log('⚠️  No sessions found');
    console.log('   Start a session with: claude');
    console.log('');
  }

  console.log('Available commands:');
  console.log('  show sessions              - List all sessions');
  console.log('  summarize <id>             - Analyze a session');
  console.log('  manage <id> <model>        - Edit session interactively');
  console.log('  checkpoint <id> <name>     - Backup/fork a session');
  console.log('  delete <id>                - Remove a session');
  console.log('  dump <id>                  - View raw JSONL');
  console.log('  help                       - Show detailed help');
  console.log('═'.repeat(70));
  console.log('');
}

main().catch(console.error);
