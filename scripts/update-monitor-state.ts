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

interface ApiUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

interface SessionMessage {
  tokens?: number;
  usage?: ApiUsage;
  message?: {
    usage?: ApiUsage;
    role?: string;
    content?: unknown;
  };
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

function totalInputTokens(u: ApiUsage | undefined): number {
  if (!u) return 0;
  return (u.input_tokens ?? 0)
    + (u.cache_creation_input_tokens ?? 0)
    + (u.cache_read_input_tokens ?? 0);
}

function estimateTokensFromContent(content: unknown): number {
  const str = typeof content === 'string' ? content : JSON.stringify(content ?? '');
  return Math.ceil(str.length / 4);
}

function computeBurnRate(messages: SessionMessage[], n: number): number {
  const recent = messages.slice(-n);
  if (recent.length === 0) return 0;
  const total = recent.reduce((sum, m) => {
    const u = m.message?.usage ?? m.usage;
    const t = m.tokens ?? (u ? totalInputTokens(u) : 0);
    return sum + t;
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
  let totalChars = 0;
  try {
    const raw = await fs.readFile(sessionPath, 'utf-8');
    const lines = raw.split('\n').filter(l => l.trim());
    messages = lines.map(l => {
      try {
        const parsed = JSON.parse(l) as SessionMessage;
        // Track chars for burn rate fallback
        const content = parsed.message?.content ?? (parsed as any).content ?? '';
        const chars = typeof content === 'string' ? content.length : JSON.stringify(content).length;
        totalChars += chars;
        // Attach char-based token estimate as fallback for burn rate
        return { tokens: estimateTokensFromContent(content), ...parsed };
      } catch {
        return {} as SessionMessage;
      }
    });
  } catch {
    process.exit(0);
  }

  const config = await readConfig();
  const existing = await readStateOrDefault();

  // Use API-reported input tokens from last assistant message with usage data.
  // Fall back to char-count estimate only when no usage field is present (e.g., older sessions).
  const lastWithUsage = [...messages].reverse().find(m => m.message?.usage ?? m.usage);
  const lastUsage = lastWithUsage?.message?.usage ?? lastWithUsage?.usage;
  const currentTokens = lastUsage ? totalInputTokens(lastUsage) : Math.ceil(totalChars / 4);

  const contextWindowSize = existing.contextWindowSize || 200000;
  const fillPct = (currentTokens / contextWindowSize) * 100;

  const baselineTokens = existing.baselineTokens;
  const tokensSinceBaseline = baselineTokens !== null
    ? Math.max(0, currentTokens - baselineTokens)
    : currentTokens;

  const burnRatePerMessage = computeBurnRate(messages, config.burnRateWindow);

  // Estimate cost from model rates
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
