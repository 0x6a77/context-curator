#!/usr/bin/env tsx

/**
 * postcompact-reinject.ts - Re-inject task context summary after compaction (PostCompact hook)
 *
 * Reads the active task from .claude/CLAUDE.md @import line.
 * Outputs task context summary to stdout for Claude Code to inject into the session.
 * Exits 0 silently when the default task is active (no injection needed).
 *
 * Hook registration in ~/.claude/settings.json:
 * {
 *   "hooks": {
 *     "PostCompact": [{ "type": "command", "command": "npx tsx ~/.claude/skills/context-curator/session/context-save/scripts/postcompact-reinject.ts" }]
 *   }
 * }
 */

import fs from 'fs/promises';
import path from 'path';

async function reInject() {
  const cwd = process.cwd();
  const claudeMd = path.join(cwd, '.claude', 'CLAUDE.md');

  let content: string;
  try {
    content = await fs.readFile(claudeMd, 'utf-8');
  } catch {
    process.stderr.write('[postcompact] warning: .claude/CLAUDE.md not found\n');
    process.exit(0);
  }

  const match = content.match(/@import\s+(\S+)/);
  if (!match) {
    process.exit(0);
  }

  const importPath = match[1];

  // Default task → no injection needed
  if (importPath.includes('default')) {
    process.exit(0);
  }

  // Extract task ID from the import path
  const taskId = importPath.match(/tasks\/([^/]+)\//)?.[1];
  if (!taskId) {
    process.exit(0);
  }

  // Try to read the task's CLAUDE.md
  // First try project-relative path, then absolute
  const candidates = [
    path.join(cwd, '.claude', 'tasks', taskId, 'CLAUDE.md'),
    importPath.startsWith('/') ? importPath : path.join(cwd, importPath),
  ];

  let taskContent: string | null = null;
  for (const candidate of candidates) {
    try {
      taskContent = await fs.readFile(candidate, 'utf-8');
      break;
    } catch {
      // try next
    }
  }

  if (!taskContent) {
    process.stderr.write(`[postcompact] warning: task CLAUDE.md not found for ${taskId}\n`);
    process.exit(0);
  }

  // Output the injection text to stdout (Claude Code reads this as the prompt injection)
  // Trim to 2000 chars to avoid overwhelming the re-injected context
  process.stdout.write(
    `[Context restored after compaction]\nActive task: ${taskId}\n\n${taskContent.slice(0, 2000)}`
  );
}

reInject().catch((err) => {
  process.stderr.write(`[postcompact] error: ${err.message}\n`);
  process.exit(0); // Always exit 0 so hook failure doesn't block Claude
});
