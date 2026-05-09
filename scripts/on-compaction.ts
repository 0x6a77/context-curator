#!/usr/bin/env tsx

/**
 * on-compaction.ts - Reset zone sentinels after compaction
 *
 * Called by the PostCompact hook (alongside postcompact-reinject.ts).
 * Clears zone sentinels so zone warnings re-fire after the context is reset.
 * Also records a new baseline token count post-compaction.
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
  try {
    const raw = await fs.readFile(STATE_PATH, 'utf-8');
    const state = JSON.parse(raw);

    // Clear zone sentinels — warnings will re-fire in the new context
    state.zoneSentinels = { degrading: false, critical: false };

    // Record post-compaction token count as the new baseline
    // (tokensSinceBaseline will now measure growth from this point)
    state.baselineTokens = state.currentTokens ?? null;
    state.tokensSinceBaseline = 0;

    await atomicWrite(STATE_PATH, JSON.stringify(state, null, 2));
    process.stderr.write('[on-compaction] sentinels cleared, baseline reset\n');
  } catch {
    // State file may not exist yet
  }
}

main().catch((err) => {
  process.stderr.write(`[on-compaction] error: ${err.message}\n`);
  process.exit(0);
});
