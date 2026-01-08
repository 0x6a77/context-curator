#!/usr/bin/env tsx
/**
 * Unified CLI entry point for context curator commands
 * Usage: tsx context.ts <command> [args]
 *
 * This script should be called with npx tsx from the project directory,
 * NOT with npm run (which changes the working directory).
 */

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  if (!command) {
    console.error('Usage: context <command> [args]');
    console.error('');
  console.error('Commands:');
    console.error('  list              - List all sessions');
    console.error('  analyze <id>      - Analyze a session');
    console.error('  manage <id> <model> - Edit session interactively');
    console.error('  checkpoint <id> <name> - Backup/fork a session');
    console.error('  delete <id>       - Remove a session');
    console.error('  dump <id> [type]  - View raw JSONL');
    console.error('  help              - Show detailed help');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'list':
        await import('./show-sessions.js');
        break;
      case 'analyze':
      case 'summarize':
        process.argv = ['tsx', 'summarize.ts', ...args];
        await import('./summarize.js');
        break;
      case 'manage':
      case 'edit':
        process.argv = ['tsx', 'manage.ts', ...args];
        await import('./manage.js');
        break;
      case 'checkpoint':
      case 'backup':
        process.argv = ['tsx', 'checkpoint.ts', ...args];
        await import('./checkpoint.js');
        break;
      case 'delete':
      case 'remove':
        process.argv = ['tsx', 'delete.ts', ...args];
        await import('./delete.js');
        break;
      case 'dump':
        process.argv = ['tsx', 'dump.ts', ...args];
        await import('./dump.js');
        break;
      case 'help':
        await import('./help.js');
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Run "context help" for usage information');
  process.exit(1);
}
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : 'Unknown error');
    process.exit(1);
  }
}

main().catch(console.error);
