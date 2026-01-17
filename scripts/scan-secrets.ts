#!/usr/bin/env tsx

/**
 * scan-secrets.ts - Scan a session file for potential secrets
 * 
 * Outputs:
 * - "clean" if no secrets found
 * - JSON array of matches if secrets found
 */

import fs from 'fs/promises';
import { scanForSecrets } from '../src/utils.js';

async function main() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Usage: scan-secrets <file-path>');
    process.exit(1);
  }
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const matches = scanForSecrets(content);
    
    if (matches.length === 0) {
      console.log('clean');
    } else {
      console.log(JSON.stringify(matches, null, 2));
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
