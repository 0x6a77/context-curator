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
  console.log('  Context Curator');
  console.log('═'.repeat(70));
  console.log(`📁 ${cwd}`);
  console.log('');

  // Quick count only - no detailed listing for speed
  const sessionIds = await listSessionIds();

  console.log(`${sessionIds.length} session(s) for this project`);
  console.log('');
  console.log('Commands: context list | analyze | manage | checkpoint | delete | dump | help');
  console.log('═'.repeat(70));
  console.log('');
}

main().catch(console.error);
