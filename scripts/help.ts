#!/usr/bin/env tsx

console.log('\n' + '═'.repeat(70));
console.log('  Context Curator - Help');
console.log('═'.repeat(70));
console.log('');
console.log('A tool for managing Claude Code session context.');
console.log('');

console.log('SESSION STORAGE:');
console.log('');
console.log('  Sessions are stored in:');
console.log('  • ~/.claude/projects/<project-dir>/<uuid>.jsonl');
console.log('  • Project-specific (scoped by directory)');
console.log('  • Automatically created by Claude Code');
console.log('  • Example: 8e14f625-bd1a-4e79-a382-2d6c0649df97.jsonl');
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
console.log('    List all sessions for current project');
console.log('    Usage: npm run context list');
console.log('');

console.log('  context analyze <session-id>');
console.log('    Analyze a session and show token breakdown with recommendations');
console.log('    Usage: npm run context analyze <session-id>');
console.log('    Example: npm run context analyze 8e14f625-bd1a-4e79-a382-2d6c0649df97');
console.log('');

console.log('  context manage <session-id>');
console.log('    Interactive session editor handled conversationally by curator');
console.log('    Usage: Tell the curator "manage <session-id>"');
console.log('    Example: "manage 8e14f625-bd1a-4e79-a382-2d6c0649df97"');
console.log('');
console.log('    The curator will:');
console.log('    • Read and analyze the session');
console.log('    • Suggest optimizations');
console.log('    • Discuss changes with you in natural language');
console.log('    • Show previews before applying');
console.log('    • Apply changes when you approve');
console.log('    • No API key required - uses Claude Code\'s native capabilities');
console.log('');

console.log('  context checkpoint <session-id> <new-name>');
console.log('    Create a backup/fork of a session');
console.log('    Usage: npm run context checkpoint <session-id> <new-name>');
console.log('    Example: npm run context checkpoint 8e14f625-bd1a-4e79-a382-2d6c0649df97 auth-backup');
console.log('');

console.log('  context delete <session-id>');
console.log('    Remove a session (creates backup first, requires confirmation)');
console.log('    Usage: npm run context delete <session-id>');
console.log('    Example: npm run context delete 8e14f625-bd1a-4e79-a382-2d6c0649df97');
console.log('');

console.log('  context dump <session-id> [type]');
console.log('    Display session messages sorted by timestamp');
console.log('    Types: user, assistant, file-history-snapshot, summary');
console.log('    Usage: npm run context dump <session-id> [type]');
console.log('    Examples:');
console.log('      npm run context dump 8e14f625-bd1a-4e79-a382-2d6c0649df97');
console.log('      npm run context dump 8e14f625-bd1a-4e79-a382-2d6c0649df97 user');
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
console.log('');
console.log('  2. Usage from any project:');
console.log('     cd ~/my-project');
console.log('     claude -r context-curator');
console.log('');
console.log('  3. Common workflow:');
console.log('     • "show sessions" - see sessions for current project');
console.log('     • "analyze <id>" - analyze a session');
console.log('     • "manage <id>" - optimize session conversationally');
console.log('');

console.log('TIPS:');
console.log('');
console.log('  • Always checkpoint before using manage mode');
console.log('  • Sessions over 70% capacity (140k tokens) should be optimized');
console.log('  • The curator only manages sessions for the current project');
console.log('  • Change directories to work with different project sessions');
console.log('  • No API key required - uses Claude Code itself!');
console.log('');

console.log('REQUIREMENTS:');
console.log('');
console.log('  • Claude Code installed');
console.log('  • Node.js 18+');
console.log('  • No API key needed!');
console.log('');

console.log('═'.repeat(70));
console.log('');
