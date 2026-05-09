#!/usr/bin/env tsx

/**
 * estimate-cost.ts - Show detailed cost breakdown for the current session
 *
 * Usage:
 *   npx tsx scripts/estimate-cost.ts
 *   npx tsx scripts/estimate-cost.ts --verbose
 *
 * Reads monitor-state.json and monitor-config.json. No network calls.
 */

import fs from 'fs/promises';
import path from 'path';
import { getClaudeHome } from '../src/utils.js';

const STATE_PATH = path.join(getClaudeHome(), 'context-curator', 'monitor-state.json');
const CONFIG_PATH = path.join(getClaudeHome(), 'context-curator', 'monitor-config.json');

async function main() {
  const verbose = process.argv.includes('--verbose');

  let state: Record<string, any>;
  try {
    const raw = await fs.readFile(STATE_PATH, 'utf-8');
    state = JSON.parse(raw);
  } catch {
    console.log('No monitor data available. The PostToolUse hook may not be installed.');
    console.log('Run install.sh to set up hooks.');
    process.exit(1);
  }

  if (!verbose) {
    // Simple one-line output
    const { fillPct, estimatedCost, burnRatePerMessage } = state;
    console.log(`Context: ${Math.round(fillPct ?? 0)}% | Cost: ~$${(estimatedCost ?? 0).toFixed(2)} | Burn: ${((burnRatePerMessage ?? 0) / 1000).toFixed(1)}k tok/msg`);
    return;
  }

  // Verbose output
  let config: Record<string, any> = { models: {} };
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    config = JSON.parse(raw);
  } catch {
    // Use defaults
  }

  const model = state.model ?? 'claude-sonnet-4-6';
  const rates = config.models?.[model] ?? { input: 3.00, output: 15.00 };
  const currentTokens = state.currentTokens ?? 0;
  const contextWindowSize = state.contextWindowSize ?? 200000;

  // Split estimate: 80% input, 20% output (rough heuristic without exact data)
  const inputTokens = Math.round(currentTokens * 0.8);
  const outputTokens = Math.round(currentTokens * 0.2);
  const inputCost = (inputTokens / 1e6) * rates.input;
  const outputCost = (outputTokens / 1e6) * rates.output;
  const totalCost = inputCost + outputCost;

  const lines = [
    'Session Cost Estimate',
    '─────────────────────',
    `Model:         ${model}`,
    `Input tokens:  ${inputTokens.toLocaleString()}  @ $${rates.input.toFixed(2)}/M  = $${inputCost.toFixed(2)}`,
    `Output tokens: ${outputTokens.toLocaleString()}  @ $${rates.output.toFixed(2)}/M = $${outputCost.toFixed(2)}`,
    '─────────────────────',
    `Total:         ~$${totalCost.toFixed(2)}`,
    '',
    `Context window: ${Math.round(state.fillPct ?? 0)}% used (${(currentTokens / 1000).toFixed(0)}k / ${(contextWindowSize / 1000).toFixed(0)}k tokens)`,
    `Burn rate:      ${((state.burnRatePerMessage ?? 0) / 1000).toFixed(1)}k tok/msg (mean of last 10 messages)`,
  ];

  console.log(lines.join('\n'));
}

main().catch((err) => {
  console.error(`estimate-cost: error: ${err.message}`);
  process.exit(1);
});
