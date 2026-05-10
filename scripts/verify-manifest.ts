#!/usr/bin/env tsx

/**
 * verify-manifest.ts - Verify the installed context-curator manifest version
 *
 * Compares the version in ~/.claude/context-curator-manifest.json against
 * the version in dist/version.json. Exits non-zero if they differ.
 *
 * Respects CLAUDE_HOME env var for testing (equivalent to ~/.claude when unset).
 *
 * Usage:
 *   npx tsx scripts/verify-manifest.ts
 */

import { readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const claudeHome = process.env.CLAUDE_HOME ?? join(process.env.HOME!, '.claude');
const manifestPath = join(claudeHome, 'context-curator-manifest.json');
const versionFilePath = resolve(__dirname, '..', 'dist', 'version.json');

let manifest: Record<string, unknown>;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
} catch (e: any) {
  process.stderr.write(`verify-manifest: cannot read manifest at ${manifestPath}: ${e.message}\n`);
  process.exit(1);
}

let expectedVersion: string;
try {
  const vf = JSON.parse(readFileSync(versionFilePath, 'utf-8'));
  expectedVersion = vf.version as string;
} catch (e: any) {
  process.stderr.write(`verify-manifest: cannot read dist/version.json: ${e.message}\n`);
  process.exit(1);
}

const actualVersion = manifest.version as string | undefined;
if (actualVersion !== expectedVersion) {
  process.stderr.write(
    `verify-manifest: version mismatch — manifest version "${actualVersion}" does not match dist/version.json version "${expectedVersion}"\n`
  );
  process.exit(1);
}

process.stdout.write(`verify-manifest: OK — version "${actualVersion}" matches dist/version.json\n`);
