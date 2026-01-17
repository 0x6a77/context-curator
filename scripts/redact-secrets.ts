#!/usr/bin/env tsx

/**
 * redact-secrets.ts - Redact secrets from a file
 * 
 * Usage:
 *   redact-secrets <file-path>
 * 
 * Outputs the redacted content to stdout.
 * Reports what was redacted to stderr.
 */

import fs from 'fs/promises';
import { scanForSecrets, redactSecrets } from '../src/utils.js';

async function main() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Usage: redact-secrets <file-path>');
    process.exit(1);
  }
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // First, scan to report what will be redacted
    const matches = scanForSecrets(content);
    
    if (matches.length === 0) {
      console.error('No secrets found to redact.');
      console.log(content);
      return;
    }
    
    // Report what's being redacted
    console.error(`Redacting ${matches.length} secret(s):`);
    for (const match of matches) {
      console.error(`  Line ${match.line}: ${match.type}`);
      console.error(`    ${match.preview}`);
    }
    console.error('');
    
    // Perform redaction
    const redacted = redactSecrets(content);
    
    // Output redacted content
    console.log(redacted);
    
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
