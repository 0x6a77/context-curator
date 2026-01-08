#!/usr/bin/env tsx
import * as fs from 'fs/promises';
import * as path from 'path';

async function getProjectSessionsDir(): Promise<string> {
  const cwd = process.cwd();
  const projectDir = cwd.replace(/\//g, '-');
  const homeDir = process.env.HOME!;
  return path.join(homeDir, '.claude', 'projects', projectDir);
}

async function main() {
  const [sessionId, editedPath] = process.argv.slice(2);
  
  if (!sessionId || !editedPath) {
    console.error('Usage: apply-edits <session-id> <edited-file-path>');
    process.exit(1);
  }
  
  console.log('Applying edits...');
  
  // Read edited version
  const editedContent = await fs.readFile(editedPath, 'utf-8');
  const editedMessages = editedContent
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        throw new Error(`Invalid JSON on line: ${line.substring(0, 50)}...`);
      }
    });
  
  // Validate
  if (editedMessages.length === 0) {
    throw new Error('Edited session is empty');
  }
  
  // Backup original
  const timestamp = new Date().toISOString().split('T')[0];
  const backupFilename = `${sessionId}.backup-${timestamp}.jsonl`;
  const sessionsDir = await getProjectSessionsDir();
  const originalPath = path.join(sessionsDir, `${sessionId}.jsonl`);
  const backupPath = path.join(sessionsDir, backupFilename);
  
  console.log('Creating backup...');
  await fs.copyFile(originalPath, backupPath);
  console.log(`✓ Backup: ${backupFilename}`);
  
  // Write edited version
  console.log('Writing edited version...');
  const editedJSONL = editedMessages.map(m => JSON.stringify(m)).join('\n');
  await fs.writeFile(originalPath, editedJSONL, 'utf-8');
  console.log('✓ Session updated');
  
  // Cleanup temp file
  await fs.unlink(editedPath);
  
  // Stats
  const originalSize = (await fs.stat(backupPath)).size;
  const newSize = (await fs.stat(originalPath)).size;
  const savings = originalSize - newSize;
  const pct = Math.round((savings / originalSize) * 100);
  
  console.log('\nDone!');
  console.log(`Size: ${originalSize} → ${newSize} bytes`);
  console.log(`Saved: ${savings} bytes (${pct}%)`);
}

main().catch(err => {
  console.error('Error applying edits:', err.message);
  process.exit(1);
});
