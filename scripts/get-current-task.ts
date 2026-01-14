#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function getCurrentTask(): Promise<string> {
  const claudeMdPath = path.join(process.cwd(), '.claude/CLAUDE.md');

  try {
    const content = await fs.readFile(claudeMdPath, 'utf-8');
    const match = content.match(/@import ~\/\.claude\/projects\/[^\/]+\/tasks\/([^\/\s]+)\/CLAUDE\.md/);

    if (match) {
      return match[1];
    }
  } catch {
    // Fall through
  }

  // Default to 'default' task if no @-import found
  return 'default';
}

getCurrentTask()
  .then(task => console.log(task))
  .catch(() => console.log('default'));
