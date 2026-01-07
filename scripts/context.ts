#!/usr/bin/env tsx
import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command = process.argv[2];
const args = process.argv.slice(3);

const commands: Record<string, string> = {
  'list': 'list.ts',
  'analyze': 'analyze.ts',
  'manage': 'manage.ts',
  'checkpoint': 'checkpoint.ts',
  'delete': 'delete.ts',
  'dump': 'dump.ts',
  'help': 'help.ts'
};

if (!command || !commands[command]) {
  console.error('\nUsage: context <command> [args]\n');
  console.error('Commands:');
  console.error('  list                           List all sessions');
  console.error('  analyze <session-id>           Analyze a session');
  console.error('  manage <session-id> <model>    Edit session interactively');
  console.error('  checkpoint <session-id> <name> Backup a session');
  console.error('  delete <session-id>            Remove a session');
  console.error('  dump <session-id> [type]       View raw session data');
  console.error('  help                           Show detailed help\n');
  process.exit(1);
}

// Execute the command script
const scriptPath = path.join(__dirname, commands[command]);
const proc = spawn('tsx', [scriptPath, ...args], {
  stdio: 'inherit',
  shell: false
});

proc.on('exit', (code) => {
  process.exit(code || 0);
});
