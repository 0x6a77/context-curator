#!/usr/bin/env tsx

/**
 * redact-secrets.ts - Redact secrets from a file
 * 
 * Usage:
 *   redact-secrets <file-path> [output-path]
 * 
 * If output-path is provided, writes redacted content there.
 * Otherwise, writes to <file-path-without-ext>.redacted.jsonl
 * (e.g., foo.jsonl -> foo.redacted.jsonl)
 * Also outputs redacted content to stdout.
 * Reports what was redacted to stderr.
 */

import fs from 'fs/promises';
import path from 'path';
import { scanForSecrets, redactSecrets } from '../src/utils.js';

async function main() {
  const filePath = process.argv[2];
  const outputArg = process.argv[3];
  
  if (!filePath) {
    console.error('Usage: redact-secrets <file-path> [output-path]');
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
    
    // Determine output path
    let outputPath: string;
    if (outputArg) {
      outputPath = outputArg;
    } else {
      // Default: replace .jsonl with .redacted.jsonl, or append .redacted.jsonl
      const ext = path.extname(filePath);
      const base = filePath.slice(0, filePath.length - ext.length);
      outputPath = `${base}.redacted${ext || '.jsonl'}`;
    }
    
    // Write redacted content to file
    await fs.writeFile(outputPath, redacted, 'utf-8');
    
    // Also output redacted content to stdout
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
