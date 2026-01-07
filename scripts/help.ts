#!/usr/bin/env tsx

function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('  Context Curator - Help');
  console.log('═'.repeat(70));
  console.log('');
  console.log('A tool for managing Claude Code session context.');
  console.log('');
  
  console.log('SESSION TYPES:');
  console.log('');
  console.log('  Named Sessions');
  console.log('  • Stored in ~/.claude/sessions/<session-id>/');
  console.log('  • Globally accessible by name');
  console.log('  • Resume with: claude -r <name>');
  console.log('  • Examples: context-curator, my-workflow');
  console.log('');
  console.log('  Unnamed Sessions');
  console.log('  • Stored in ~/.claude/projects/<project-dir>/<uuid>.jsonl');
  console.log('  • Project-specific (scoped by directory)');
  console.log('  • Automatically created by Claude Code');
  console.log('  • Example: 8e14f625-bd1a-4e79-a382-2d6c0649df97');
  console.log('');
  
  console.log('PROJECT DIRECTORY FORMULA:');
  console.log('');
  console.log('  /Users/dev/my-project  →  -Users-dev-my-project');
  console.log('  /home/user/work/app    →  -home-user-work-app');
  console.log('');
  console.log('  Formula: projectDir = fullPath.replace(/\\//g, \'-\')');
  console.log('');
  
  console.log('COMMANDS:');
  console.log('');
  console.log('All commands use the unified "context" interface.');
  console.log('');
  
  console.log('  context list');
  console.log('    List all sessions (named + unnamed for current project)');
  console.log('    Usage: npm run context list');
  console.log('');
  
  console.log('  context analyze <session-id>');
  console.log('    Analyze a session and show token breakdown with recommendations');
  console.log('    Usage: npm run context analyze <session-id>');
  console.log('    Example: npm run context analyze 8e14f625-bd1a-4e79-a382-2d6c0649df97');
  console.log('');
  
  console.log('  context manage <session-id> <model>');
  console.log('    Interactive session editor with Claude API integration');
  console.log('    Models: sonnet, opus, haiku');
  console.log('    Usage: npm run context manage <session-id> <model>');
  console.log('    Example: npm run context manage 8e14f625-bd1a-4e79-a382-2d6c0649df97 sonnet');
  console.log('');
  console.log('    In manage mode:');
  console.log('    • Describe changes in natural language');
  console.log('    • @apply    - Apply staged changes');
  console.log('    • @undo     - Undo last staged change');
  console.log('    • @undo all - Undo all staged changes');
  console.log('    • @preview  - Show before/after comparison');
  console.log('    • @exit     - Exit without saving');
  console.log('');
  
  console.log('  context checkpoint <session-id> <new-name>');
  console.log('    Create a backup/fork of a session as a named session');
  console.log('    Usage: npm run context checkpoint <session-id> <new-name>');
  console.log('    Example: npm run context checkpoint 8e14f625-bd1a-4e79-a382-2d6c0649df97 auth-backup');
  console.log('');
  
  console.log('  context delete <session-id>');
  console.log('    Remove a session (creates backup first, requires confirmation)');
  console.log('    Usage: npm run context delete <session-id>');
  console.log('    Example: npm run context delete old-session');
  console.log('');
  
  console.log('  context dump <session-id> [type]');
  console.log('    Display session messages sorted by timestamp');
  console.log('    Types: user, assistant, file-history-snapshot, summary');
  console.log('    Usage: npm run context dump <session-id> [type]');
  console.log('    Examples:');
  console.log('      npm run context dump 8e14f625-bd1a-4e79-a382-2d6c0649df97');
  console.log('      npm run context dump 8e14f625-bd1a-4e79-a382-2d6c0649df97 user');
  console.log('      npm run context dump my-session assistant');
  console.log('');
  
  console.log('  context help');
  console.log('    Show this help message');
  console.log('    Usage: npm run context help');
  console.log('');
  
  console.log('QUICK START:');
  console.log('');
  console.log('  1. Installation:');
  console.log('     git clone <repo> ~/.claude/skills/context-curator');
  console.log('     cd ~/.claude/skills/context-curator');
  console.log('     npm install');
  console.log('     ./setup.sh');
  console.log('');
  console.log('  2. Usage:');
  console.log('     cd ~/any-project');
  console.log('     claude -r context-curator');
  console.log('');
  console.log('  3. Common workflow:');
  console.log('     • "context list" - see what you have');
  console.log('     • "context analyze <id>" - analyze a session');
  console.log('     • "context checkpoint <id> <name>" - backup before editing');
  console.log('     • "context manage <id> sonnet" - optimize with Claude');
  console.log('');
  
  console.log('TIPS:');
  console.log('');
  console.log('  • Always checkpoint before using manage mode');
  console.log('  • Use sonnet model for best balance of speed and quality');
  console.log('  • Sessions over 70% capacity (140k tokens) should be optimized');
  console.log('  • The curator only manages sessions for the current project');
  console.log('  • Named sessions are visible from any directory');
  console.log('');
  
  console.log('REQUIREMENTS:');
  console.log('');
  console.log('  • Claude Code installed');
  console.log('  • Node.js 18+');
  console.log('  • ANTHROPIC_API_KEY environment variable (for manage mode)');
  console.log('');
  
  console.log('═'.repeat(70));
  console.log('');
}

main();
