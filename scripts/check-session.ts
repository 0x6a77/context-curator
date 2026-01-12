#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

async function checkSession() {
  // Parse ~/.claude/history.jsonl to find current session
  const historyPath = path.join(process.env.HOME!, '.claude/history.jsonl');

  try {
    const content = await fs.readFile(historyPath, 'utf-8');
    const lines = content.trim().split('\n');

    // Count messages in current session
    let messageCount = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      try {
        const entry = JSON.parse(line);
        if (entry.type === 'session_start') {
          break;
        }
        if (entry.role === 'user' || entry.role === 'assistant') {
          messageCount++;
        }
      } catch {
        continue;
      }
    }

    console.log(messageCount);
  } catch {
    console.log(0);
  }
}

checkSession().catch(() => console.log(0));
