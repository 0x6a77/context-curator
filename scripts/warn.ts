#!/usr/bin/env tsx

/**
 * warn.ts - Zone boundary warnings with sentinel suppression
 *
 * Fires a one-time warning per zone entry per session.
 * After firing, sets sentinel flag so the warning doesn't repeat.
 * Sentinels are cleared by session-start-hook.ts and on-compaction.ts.
 *
 * Suppressed when CLAUDE_SESSION_TYPE=headless.
 */

import fs from 'fs/promises';
import path from 'path';
import { getClaudeHome } from '../src/utils.js';

const STATE_PATH = path.join(getClaudeHome(), 'context-curator', 'monitor-state.json');

async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmp = `${filePath}.tmp.${process.pid}`;
  await fs.writeFile(tmp, content, 'utf-8');
  await fs.rename(tmp, filePath);
}

async function main() {
  if (process.env.CLAUDE_SESSION_TYPE === 'headless') {
    process.exit(0);
  }

  let state: Record<string, any>;
  try {
    const raw = await fs.readFile(STATE_PATH, 'utf-8');
    state = JSON.parse(raw);
  } catch {
    // No state file — nothing to warn about
    process.exit(0);
  }

  const { fillPct, zoneSentinels } = state;
  if (fillPct === undefined || !zoneSentinels) {
    process.exit(0);
  }

  let wrote = false;

  if (fillPct >= 80 && !zoneSentinels.critical) {
    process.stderr.write(
      `🔴  Context at ${Math.round(fillPct)}% — critical. Compaction is imminent.\n` +
      `    Start a fresh session: /task <current-task> to reload a saved context.\n` +
      `    (This warning will not repeat in this zone.)\n`
    );
    state.zoneSentinels.critical = true;
    wrote = true;
  } else if (fillPct >= 65 && !zoneSentinels.degrading) {
    process.stderr.write(
      `⚠️  Context at ${Math.round(fillPct)}% — entering degrading zone.\n` +
      `    Recall quality is declining. Consider: /context-save checkpoint-name\n` +
      `    (This warning will not repeat in this zone.)\n`
    );
    state.zoneSentinels.degrading = true;
    wrote = true;
  }

  if (wrote) {
    await atomicWrite(STATE_PATH, JSON.stringify(state, null, 2));
  }
}

main().catch((err) => {
  process.stderr.write(`[warn] error: ${err.message}\n`);
  process.exit(0);
});
