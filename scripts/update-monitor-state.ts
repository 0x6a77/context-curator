#!/usr/bin/env tsx

/**
 * update-monitor-state.ts - Async PostToolUse hook: parse session, write monitor-state.json
 *
 * Single-writer pattern: this script is the ONLY writer of monitor-state.json.
 * status-line.ts and warn.ts are read-only consumers.
 *
 * Reads the hook payload from stdin (session_id, project_dir) and updates:
 * - currentTokens, fillPct, burnRatePerMessage, estimatedCost, currentZone
 *
 * Hook registration in ~/.claude/settings.json:
 * {
 *   "hooks": {
 *     "PostToolUse": [{ "type": "command", "command": "npx tsx ~/.claude/skills/context-curator/monitor/status/scripts/update-monitor-state.ts" }]
 *   }
 * }
 */

import fs from 'fs/promises';
import path from 'path';
import { getClaudeHome, getProjectId, fileExists } from '../src/utils.js';

const STATE_PATH = path.join(getClaudeHome(), 'context-curator', 'monitor-state.json');
const CONFIG_PATH = path.join(getClaudeHome(), 'context-curator', 'monitor-config.json');

interface MonitorConfig {
  zones: { degrading: number; critical: number };
  burnRateWindow: number;
  models: Record<string, { input: number; output: number }>;
}

interface MonitorState {
  sessionId?: string;
  currentTokens: number;
  contextWindowSize: number;
  fillPct: number;
  baselineTokens: number | null;
  tokensSinceBaseline: number;
  burnRatePerMessage: number;
  estimatedCost: number;
  currentZone: 'productive' | 'degrading' | 'critical';
  zoneSentinels: { degrading: boolean; critical: boolean };
  model: string;
  lastUpdated: string;
}

async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmp = `${filePath}.tmp.${process.pid}`;
  await fs.writeFile(tmp, content, 'utf-8');
  await fs.rename(tmp, filePath);
}

async function readConfig(): Promise<MonitorConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      zones: { degrading: 65, critical: 80 },
      burnRateWindow: 10,
      models: {
        'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
        'claude-opus-4-7':   { input: 15.00, output: 75.00 },
        'claude-haiku-4-5':  { input: 0.80, output: 4.00 },
        'default':           { input: 3.00, output: 15.00 },
      },
    };
  }
}

async function readStateOrDefault(): Promise<MonitorState> {
  try {
    const raw = await fs.readFile(STATE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      currentTokens: 0,
      contextWindowSize: 200000,
      fillPct: 0,
      baselineTokens: null,
      tokensSinceBaseline: 0,
      burnRatePerMessage: 0,
      estimatedCost: 0,
      currentZone: 'productive',
      zoneSentinels: { degrading: false, critical: false },
      model: 'claude-sonnet-4-6',
      lastUpdated: new Date().toISOString(),
    };
  }
}

async function readStdinJson(): Promise<Record<string, any>> {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve({});
      return;
    }
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
    setTimeout(() => resolve({}), 500);
  });
}

interface ApiUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

interface SessionMessage {
  message?: { usage?: ApiUsage };
  usage?: ApiUsage;
}

// Real input token count = non-cached + cache-write + cache-read
function totalInputTokens(u: ApiUsage | undefined): number {
  if (!u) return 0;
  return (u.input_tokens ?? 0)
    + (u.cache_creation_input_tokens ?? 0)
    + (u.cache_read_input_tokens ?? 0);
}

function computeBurnRate(messages: SessionMessage[], n: number): number {
  const withUsage = messages.filter(m => m.message?.usage ?? m.usage);
  const recent = withUsage.slice(-n);
  if (recent.length === 0) return 0;
  const total = recent.reduce((sum, m) => {
    const u = m.message?.usage ?? m.usage;
    return sum + totalInputTokens(u) + (u?.output_tokens ?? 0);
  }, 0);
  return Math.round(total / recent.length);
}

async function main() {
  const payload = await readStdinJson();
  const cwd = payload.project_dir ?? process.cwd();
  const sessionId: string | undefined = payload.session_id;
  const model: string = payload.model ?? 'claude-sonnet-4-6';

  // Find session file
  const projectId = getProjectId(cwd);
  const sessionDir = path.join(getClaudeHome(), 'projects', projectId);

  let sessionPath: string | null = null;
  if (sessionId) {
    const candidate = path.join(sessionDir, `${sessionId}.jsonl`);
    if (await fileExists(candidate)) {
      sessionPath = candidate;
    }
  }

  if (!sessionPath) {
    // Can't do anything without session data
    process.exit(0);
  }

  // Parse session JSONL
  let messages: SessionMessage[] = [];
  try {
    const raw = await fs.readFile(sessionPath, 'utf-8');
    const lines = raw.split('\n').filter(l => l.trim());
    messages = lines.map(l => {
      try { return JSON.parse(l); } catch { return {}; }
    });
  } catch {
    process.exit(0);
  }

  const config = await readConfig();
  const existing = await readStateOrDefault();

  // Use actual input_tokens from the most recent assistant message with usage data.
  // This is the real context window occupancy reported by the API, which correctly
  // accounts for prompt caching (input + cache_creation + cache_read).
  const lastWithUsage = [...messages].reverse().find(m => m.message?.usage ?? m.usage);
  const lastUsage = lastWithUsage?.message?.usage ?? lastWithUsage?.usage;
  const currentTokens = lastUsage ? totalInputTokens(lastUsage) : existing.currentTokens;

  const contextWindowSize = existing.contextWindowSize || 200000;
  const fillPct = (currentTokens / contextWindowSize) * 100;

  const baselineTokens = existing.baselineTokens;
  const tokensSinceBaseline = baselineTokens !== null
    ? Math.max(0, currentTokens - baselineTokens)
    : currentTokens;

  const burnRatePerMessage = computeBurnRate(messages, config.burnRateWindow);

  // Cost = input tokens at model rate (cache reads are cheaper but close enough for display)
  const rates = config.models[model] ?? config.models['default'] ?? { input: 3.00, output: 15.00 };
  const estimatedCost = (currentTokens / 1e6) * rates.input;

  const currentZone: 'productive' | 'degrading' | 'critical' =
    fillPct >= config.zones.critical ? 'critical'
    : fillPct >= config.zones.degrading ? 'degrading'
    : 'productive';

  const state: MonitorState = {
    ...existing,
    sessionId,
    currentTokens,
    contextWindowSize,
    fillPct,
    baselineTokens,
    tokensSinceBaseline,
    burnRatePerMessage,
    estimatedCost,
    currentZone,
    model,
    lastUpdated: new Date().toISOString(),
  };

  // Ensure state dir exists
  await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
  await atomicWrite(STATE_PATH, JSON.stringify(state, null, 2));
}

main().catch((err) => {
  process.stderr.write(`[update-monitor-state] error: ${err.message}\n`);
  process.exit(0); // Never fail noisily in a hook
});
