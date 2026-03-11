#!/usr/bin/env tsx

/**
 * scan-secrets.ts - Scan a session file for potential secrets
 * 
 * Usage:
 *   scan-secrets <file-path>
 *   scan-secrets --session-id <uuid>
 * 
 * Outputs:
 * - "clean" if no secrets found
 * - JSON array of matches if secrets found
 */

import fs from 'fs/promises';
import path from 'path';
import { scanForSecrets, getPersonalProjectDir, fileExists } from '../src/utils.js';

async function main() {
  const args = process.argv.slice(2);

  let filePath: string | undefined;

  // Check for --session-id flag
  const sessionIdIndex = args.indexOf('--session-id');
  if (sessionIdIndex !== -1 && args[sessionIdIndex + 1]) {
    const sessionId = args[sessionIdIndex + 1];
    const cwd = process.cwd();
    const sessionDir = getPersonalProjectDir(cwd);
    const candidate = path.join(sessionDir, `${sessionId}.jsonl`);
    if (await fileExists(candidate)) {
      filePath = candidate;
    } else {
      console.error(`Error: session file not found for ID: ${sessionId}`);
      console.error(`  Expected: ${candidate}`);
      process.exit(1);
    }
  } else {
    filePath = args[0];
  }

  if (!filePath) {
    console.error('Usage: scan-secrets <file-path>');
    console.error('       scan-secrets --session-id <uuid>');
    process.exit(1);
  }
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const matches = scanForSecrets(content);
    
    if (matches.length === 0) {
      console.log('clean');
    } else {
      console.log(`Found ${matches.length} secret(s):`);
      console.log(JSON.stringify(matches, null, 2));
      process.exit(1);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
