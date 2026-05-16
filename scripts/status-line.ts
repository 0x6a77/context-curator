#!/usr/bin/env tsx

/**
 * status-line.ts - Read monitor state and print one-line status to stdout
 *
 * Output: [🟢 47% | +31k since warm-up | ~$0.18 | 2.1k tok/msg]
 *
 * Suppressed when CLAUDE_SESSION_TYPE=headless.
 * Reads state file only — no model calls, no network.
 */

import fs from 'fs/promises';
import path from 'path';
import { getClaudeHome } from '../src/utils.js';

const STATE_PATH = path.join(getClaudeHome(), 'context-curator', 'monitor-state.json');

async function main() {
  if (process.env.CLAUDE_SESSION_TYPE === 'headless') {
    process.exit(0);
  }

  let state: Record<string, any>;
  try {
    const raw = await fs.readFile(STATE_PATH, 'utf-8');
    state = JSON.parse(raw);
  } catch {
    process.stderr.write('[⚪ No monitor data — state file not found]\n');
    process.exit(0);
  }

  const { fillPct, tokensSinceBaseline, estimatedCost, burnRatePerMessage, currentZone } = state;

  const emoji: Record<string, string> = {
    productive: '🟢',
    degrading: '🟡',
    critical: '🔴',
  };
  const zoneEmoji = emoji[currentZone as string] ?? '⚪';

  const sinceK = `+${Math.round((tokensSinceBaseline ?? 0) / 1000)}k`;
  const costStr = `~$${(estimatedCost ?? 0).toFixed(2)}`;
  const burnK = `${((burnRatePerMessage ?? 0) / 1000).toFixed(1)}k tok/msg`;

  // Math.floor: fillPct 47.5 → "47%", matching T-MON-2 expectation
  const line = `[${zoneEmoji} ${Math.floor(fillPct ?? 0)}% | ${sinceK} since warm-up | ${costStr} | ${burnK}]`;
  process.stdout.write(JSON.stringify({ systemMessage: line }) + '\n');
}

main().catch((err) => {
  process.stderr.write(`[status-line] error: ${err.message}\n`);
  process.exit(0);
});
