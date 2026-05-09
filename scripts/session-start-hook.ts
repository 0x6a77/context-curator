#!/usr/bin/env tsx

/**
 * session-start-hook.ts - Clear zone sentinels on session start (SessionStart hook)
 *
 * Resets zoneSentinels in monitor-state.json so zone warnings re-fire in new sessions.
 * Called by Claude Code's SessionStart hook at the beginning of each session.
 *
 * Hook registration in ~/.claude/settings.json:
 * {
 *   "hooks": {
 *     "SessionStart": [{ "type": "command", "command": "npx tsx ~/.claude/skills/context-curator/monitor/status/scripts/session-start-hook.ts" }]
 *   }
 * }
 */

import fs from 'fs/promises';
import path from 'path';
import { getClaudeHome } from '../src/utils.js';

async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmp = `${filePath}.tmp.${process.pid}`;
  await fs.writeFile(tmp, content, 'utf-8');
  await fs.rename(tmp, filePath);
}

async function clearSentinels() {
  const statePath = path.join(getClaudeHome(), 'context-curator', 'monitor-state.json');

  try {
    const raw = await fs.readFile(statePath, 'utf-8');
    const state = JSON.parse(raw);
    state.zoneSentinels = { degrading: false, critical: false };
    await atomicWrite(statePath, JSON.stringify(state, null, 2));
    process.stderr.write('[session-start] zone sentinels cleared\n');
  } catch {
    // State file may not exist yet — that's fine
  }
}

clearSentinels().catch((err) => {
  process.stderr.write(`[session-start] error: ${err.message}\n`);
  process.exit(0);
});
