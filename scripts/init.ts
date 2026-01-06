#!/usr/bin/env tsx
import * as path from 'path';
import { listSessionIds } from '../src/session-reader.js';

async function main() {
  const cwd = process.cwd();
  const sessionsDir = path.join(cwd, '.claude', 'sessions');
  
  console.log('\n' + '═'.repeat(70));
  console.log('  Context Curator - Claude Code Session Manager');
  console.log('═'.repeat(70));
  console.log(`📁 Operating on: ${cwd}`);
  console.log(`📂 Sessions: ${sessionsDir}`);
  console.log('');
  
  // List sessions
  const sessionIds = await listSessionIds();
  
  if (sessionIds.length === 0) {
    console.log('⚠️  No sessions found in this directory');
    console.log('   Start a session with: claude');
    console.log('');
  } else {
    console.log(`Found ${sessionIds.length} session(s):`);
    const toShow = sessionIds.slice(0, 5);
    for (const id of toShow) {
      console.log(`  • ${id}`);
    }
    if (sessionIds.length > 5) {
      console.log(`  ... and ${sessionIds.length - 5} more`);
    }
    console.log('');
  }
  
  console.log('Available commands:');
  console.log('  show sessions              List all sessions with details');
  console.log('  summarize <id>             Analyze a session');
  console.log('  manage <id> <model>        Edit session interactively');
  console.log('  checkpoint <id> <name>     Backup/fork a session');
  console.log('  delete <id>                Remove a session');
  console.log('  dump <id>                  View raw JSONL');
  console.log('  help                       Show detailed help');
  console.log('═'.repeat(70));
  console.log('');
}

main().catch(console.error);
