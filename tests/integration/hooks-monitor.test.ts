/**
 * Hooks and Context Monitor Tests
 *
 * F-HOOK-POST: PostCompact Task Re-Injection Hook
 *   T-HOOK-POST-1: With non-default task active, postcompact-reinject outputs the task ID
 *   T-HOOK-POST-2: With default task active, postcompact-reinject exits 0 and outputs nothing
 *   T-HOOK-POST-3: Missing task CLAUDE.md does not crash the session (exits 0, stderr warns)
 *
 * F-CTX-MONITOR-STATUS: Passive Status Line
 *   T-MON-1: Status line reads only from monitor state file — no network/model calls
 *   T-MON-2: Given known state file values, output contains 47, 31k, 0.18, 2.1k
 *   T-MON-3: CLAUDE_SESSION_TYPE=headless suppresses all output
 *   T-MON-4: No baseline → tokensSinceBaseline equals currentTokens
 *
 * F-CTX-MONITOR-WARN: Threshold Warnings
 *   T-MON-5: Warning fires at 65% fill; silent below 65%
 *   T-MON-6: Critical warning fires at 80%; degrading warning fires at 79%
 *   T-MON-7: Sentinel suppresses repeat warning at same zone
 *   T-MON-8: Sentinel cleared after compaction; warning re-fires on re-entry
 *   T-MON-9: SessionStart hook clears all zone sentinels
 *
 * F-CTX-MONITOR-COST: Burn Rate and Cost Estimation
 *   T-MON-10: Burn rate = mean of last 10 messages, within 5%
 *   T-MON-11: Cost estimation matches hand-calculated value within 1%
 *   T-MON-12: tokensSinceBaseline = currentTokens - baselineTokens (not currentTokens)
 *   T-MON-13: State file writes are atomic — concurrent reads never observe partial JSON
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { Worker } from 'worker_threads';
import {
  createTestEnvironment,
  TestContext,
  runScript,
  runScriptWithStdin,
  fileExists,
  readFile,
  sanitizePath,
} from '../utils/test-helpers';

// ---------------------------------------------------------------------------
// Helpers: monitor state and config file writers
// ---------------------------------------------------------------------------

interface MonitorState {
  sessionId?: string;
  currentTokens?: number;
  contextWindowSize?: number;
  fillPct: number;
  baselineTokens?: number | null;
  tokensSinceBaseline?: number;
  burnRatePerMessage?: number;
  estimatedCost?: number;
  currentZone?: 'productive' | 'degrading' | 'critical';
  zoneSentinels: { degrading: boolean; critical: boolean };
  model?: string;
  lastUpdated?: string;
}

function writeMonitorState(claudeHome: string, state: Partial<MonitorState> & { fillPct: number; zoneSentinels: { degrading: boolean; critical: boolean } }): void {
  const dir = join(claudeHome, 'context-curator');
  mkdirSync(dir, { recursive: true });
  const full: MonitorState = {
    currentTokens: Math.round((state.fillPct / 100) * 200000),
    contextWindowSize: 200000,
    tokensSinceBaseline: state.baselineTokens != null
      ? Math.round((state.fillPct / 100) * 200000) - state.baselineTokens
      : Math.round((state.fillPct / 100) * 200000),
    burnRatePerMessage: 1000,
    estimatedCost: 0.10,
    currentZone: state.fillPct >= 80 ? 'critical' : state.fillPct >= 65 ? 'degrading' : 'productive',
    model: 'claude-sonnet-4-6',
    lastUpdated: new Date().toISOString(),
    ...state,
  };
  writeFileSync(join(dir, 'monitor-state.json'), JSON.stringify(full, null, 2));
}

function writeMonitorConfig(claudeHome: string, config: object): void {
  const dir = join(claudeHome, 'context-curator');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'monitor-config.json'), JSON.stringify(config, null, 2));
}

function readMonitorState(claudeHome: string): Record<string, any> {
  const p = join(claudeHome, 'context-curator', 'monitor-state.json');
  return JSON.parse(readFileSync(p, 'utf-8'));
}

// ---------------------------------------------------------------------------
// F-HOOK-POST: PostCompact Task Re-Injection Hook
// ---------------------------------------------------------------------------

describe('T-HOOK-POST-1: postcompact-reinject outputs task ID for non-default task', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('hpost1');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test\n');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    await runScript('task-create', ['oauth-refactor', 'OAuth work'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    // Switch to the new task so .claude/CLAUDE.md imports it
    await runScript('update-import', ['oauth-refactor'], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
  });

  afterEach(() => ctx.cleanup());

  it('should exit 0 and stdout contains the task ID; output must not be empty', async () => {
    const result = await runScript('postcompact-reinject', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim().length).toBeGreaterThan(0);
    expect(result.stdout).toContain('oauth-refactor');
  });
});

describe('T-HOOK-POST-2: postcompact-reinject silent for default task', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('hpost2');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test\n');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    // init-project leaves .claude/CLAUDE.md pointing to default task — no extra step needed
  });

  afterEach(() => ctx.cleanup());

  it('should exit 0 and stdout is empty — no injection for default task', async () => {
    const result = await runScript('postcompact-reinject', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('');
  });
});

describe('T-HOOK-POST-3: missing task CLAUDE.md does not crash session', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = createTestEnvironment('hpost3');
    writeFileSync(join(ctx.projectDir, 'CLAUDE.md'), '# Test\n');
    await runScript('init-project', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    // Manually write .claude/CLAUDE.md to point to a non-existent task
    const claudeMdPath = join(ctx.projectDir, '.claude', 'CLAUDE.md');
    writeFileSync(claudeMdPath, '@import ./.claude/tasks/ghost-task/CLAUDE.md\n');
  });

  afterEach(() => ctx.cleanup());

  it('should exit 0 (not crash the session) and stderr warns about missing file', async () => {
    const result = await runScript('postcompact-reinject', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    expect(result.exitCode).toBe(0);
    // Filter tsx Node.js 26 DEP0205 DeprecationWarning before asserting implementation output;
    // the implementation emits "[postcompact] warning: task CLAUDE.md not found for <id>"
    const implStderr = result.stderr.split('\n')
      .filter(line => !/\[DEP\d+\]|DeprecationWarning|node --trace-deprecation/i.test(line))
      .join('\n');
    expect(implStderr).toMatch(/warning|not found/i);
  });
});

// ---------------------------------------------------------------------------
// F-CTX-MONITOR-STATUS: Passive Status Line
// ---------------------------------------------------------------------------

describe('T-MON-1: status line reads only from monitor state file (no external calls)', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('mon1'); });
  afterEach(() => ctx.cleanup());

  it('should exit 0 with valid state file — no external modules imported', async () => {
    writeMonitorState(ctx.personalBase, {
      fillPct: 47.5,
      tokensSinceBaseline: 31000,
      estimatedCost: 0.18,
      burnRatePerMessage: 2100,
      currentZone: 'productive',
      zoneSentinels: { degrading: false, critical: false },
    });

    const result = await runScript('status-line', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    expect(result.exitCode).toBe(0);
    const output = result.stdout + result.stderr;
    expect(output.trim().length).toBeGreaterThan(0);

    // T-MON-1: directly verify status-line.ts source does not import any network or AI SDK modules.
    // Exit-0 inference alone cannot distinguish a quick-failing network call from a pure file read.
    const scriptSource = readFileSync(join(__dirname, '..', '..', 'scripts', 'status-line.ts'), 'utf-8');
    expect(scriptSource).not.toMatch(/@anthropic-ai\/sdk/);
    expect(scriptSource).not.toMatch(/node-fetch|cross-fetch|axios/);
    expect(scriptSource).not.toMatch(/from\s+['"]node:(http|https)\b/);
    expect(scriptSource).not.toMatch(/require\s*\(\s*['"]https?:/);
  });
});

describe('T-MON-2: status line renders correct field values from state file', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('mon2'); });
  afterEach(() => ctx.cleanup());

  it('output must match /47/ AND /31k/ AND /0.18/ AND /2.1k/', async () => {
    writeMonitorState(ctx.personalBase, {
      fillPct: 47.5,
      currentTokens: 95000,
      contextWindowSize: 200000,
      tokensSinceBaseline: 31000,
      estimatedCost: 0.18,
      burnRatePerMessage: 2100,
      currentZone: 'productive',
      zoneSentinels: { degrading: false, critical: false },
    });

    const result = await runScript('status-line', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    expect(result.exitCode).toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toMatch(/47/);
    expect(output).toMatch(/31k/);
    expect(output).toMatch(/0\.18/);
    expect(output).toMatch(/2\.1k/);
  });
});

describe('T-MON-3: headless mode suppresses status line output', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('mon3'); });
  afterEach(() => ctx.cleanup());

  it('should exit 0 with empty stdout AND empty stderr when CLAUDE_SESSION_TYPE=headless', async () => {
    writeMonitorState(ctx.personalBase, {
      fillPct: 50.0,
      tokensSinceBaseline: 20000,
      estimatedCost: 0.10,
      burnRatePerMessage: 1500,
      currentZone: 'productive',
      zoneSentinels: { degrading: false, critical: false },
    });

    const result = await runScript('status-line', [], ctx.projectDir, {
      CLAUDE_HOME: ctx.personalBase,
      CLAUDE_SESSION_TYPE: 'headless',
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('');
    expect(result.stderr.trim()).toBe('');
  });
});

describe('T-MON-4: no baseline → tokensSinceBaseline equals currentTokens', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('mon4'); });
  afterEach(() => ctx.cleanup());

  it('should set tokensSinceBaseline = currentTokens when baselineTokens is null', async () => {
    // Create a session JSONL file with content summing to exactly 240000 chars → 60000 tokens
    const projectId = sanitizePath(ctx.projectDir);
    const sessionDir = join(ctx.personalBase, 'projects', projectId);
    mkdirSync(sessionDir, { recursive: true });
    const sessionId = '00000000-0000-0000-0000-000000000004';
    const sessionPath = join(sessionDir, `${sessionId}.jsonl`);

    // One message with content of 240000 chars → currentTokens = ceil(240000/4) = 60000
    const content = 'x'.repeat(240000);
    writeFileSync(sessionPath, JSON.stringify({ message: { role: 'user', content } }) + '\n');

    // Pre-write state with baselineTokens=null
    writeMonitorState(ctx.personalBase, {
      fillPct: 0,
      baselineTokens: null,
      zoneSentinels: { degrading: false, critical: false },
    });

    const payload = JSON.stringify({
      session_id: sessionId,
      project_dir: ctx.projectDir,
      model: 'claude-sonnet-4-6',
    });

    const result = await runScriptWithStdin('update-monitor-state', payload, [], ctx.projectDir, {
      CLAUDE_HOME: ctx.personalBase,
    });

    expect(result.exitCode).toBe(0);

    const state = readMonitorState(ctx.personalBase);
    expect(state.tokensSinceBaseline).toBe(state.currentTokens);

    // T-MON-4: AC second clause — "the status line renders without error"
    // Verify status-line.ts handles null-baseline state without crashing.
    const statusResult = await runScript('status-line', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    expect(statusResult.exitCode).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// F-CTX-MONITOR-WARN: Threshold Warnings
// ---------------------------------------------------------------------------

describe('T-MON-5: degrading zone warning fires at 65%, silent below', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('mon5'); });
  afterEach(() => ctx.cleanup());

  it('at 65% fill, warn.ts stderr contains "degrading" and a save suggestion', async () => {
    writeMonitorState(ctx.personalBase, {
      fillPct: 65.0,
      zoneSentinels: { degrading: false, critical: false },
    });

    const result = await runScript('warn', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toMatch(/degrading/i);
    expect(result.stderr).toMatch(/context-save|checkpoint/i);
  });

  it('at 64.9% fill, warn.ts stderr is empty', async () => {
    writeMonitorState(ctx.personalBase, {
      fillPct: 64.9,
      zoneSentinels: { degrading: false, critical: false },
    });

    const result = await runScript('warn', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    expect(result.exitCode).toBe(0);
    // Filter tsx Node.js 26 DEP0205 DeprecationWarning before asserting silence
    const implStderr = result.stderr.split('\n')
      .filter(line => !/\[DEP\d+\]|DeprecationWarning|node --trace-deprecation/i.test(line))
      .join('\n').trim();
    expect(implStderr).toBe('');
  });
});

describe('T-MON-6: critical warning fires at 80%; degrading-only at 79%', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('mon6'); });
  afterEach(() => ctx.cleanup());

  it('at 80% fill, stderr contains "critical" and a restart suggestion', async () => {
    writeMonitorState(ctx.personalBase, {
      fillPct: 80.0,
      zoneSentinels: { degrading: true, critical: false },
    });

    const result = await runScript('warn', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toMatch(/critical/i);
    expect(result.stderr).toMatch(/\/task|restart|fresh session/i);
  });

  it('at 79.9% fill, stderr contains "degrading" but NOT "critical"', async () => {
    writeMonitorState(ctx.personalBase, {
      fillPct: 79.9,
      zoneSentinels: { degrading: false, critical: false },
    });

    const result = await runScript('warn', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toMatch(/degrading/i);
    expect(result.stderr).not.toMatch(/critical/i);
  });
});

describe('T-MON-7: sentinel suppresses repeat warning', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('mon7'); });
  afterEach(() => ctx.cleanup());

  it('second invocation at 66% with sentinel=true must produce empty stderr', async () => {
    // First invocation sets the sentinel
    writeMonitorState(ctx.personalBase, {
      fillPct: 65.0,
      zoneSentinels: { degrading: false, critical: false },
    });
    await runScript('warn', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    // Confirm sentinel is now true
    const stateAfterFirst = readMonitorState(ctx.personalBase);
    expect(stateAfterFirst.zoneSentinels.degrading).toBe(true);

    // Second invocation — sentinel already set, should be silent
    writeMonitorState(ctx.personalBase, {
      fillPct: 66.0,
      zoneSentinels: { degrading: true, critical: false },
    });

    const result = await runScript('warn', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    expect(result.exitCode).toBe(0);
    // Filter tsx Node.js 26 DEP0205 DeprecationWarning before asserting sentinel suppresses output
    const implStderr = result.stderr.split('\n')
      .filter(line => !/\[DEP\d+\]|DeprecationWarning|node --trace-deprecation/i.test(line))
      .join('\n').trim();
    expect(implStderr).toBe('');
  });
});

describe('T-MON-8: sentinel cleared after compaction; warning re-fires on re-entry', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('mon8'); });
  afterEach(() => ctx.cleanup());

  it('after on-compaction.ts clears sentinel, warn.ts fires again at 65%', async () => {
    // Set degrading sentinel=true, simulate compaction at 30% fill
    writeMonitorState(ctx.personalBase, {
      fillPct: 30.0,
      zoneSentinels: { degrading: true, critical: false },
    });

    // on-compaction.ts should clear sentinels
    const compactResult = await runScript('on-compaction', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });
    expect(compactResult.exitCode).toBe(0);

    // Sentinel must be cleared
    const stateAfterCompaction = readMonitorState(ctx.personalBase);
    expect(stateAfterCompaction.zoneSentinels.degrading).toBe(false);

    // Re-cross 65% — warning must fire again
    writeMonitorState(ctx.personalBase, {
      fillPct: 65.0,
      zoneSentinels: { degrading: false, critical: false },
    });

    const result = await runScript('warn', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toMatch(/degrading/i);
  });
});

describe('T-MON-9: SessionStart hook clears all zone sentinels', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('mon9'); });
  afterEach(() => ctx.cleanup());

  it('after session-start-hook.ts, both zoneSentinels must be false', async () => {
    // Write state with both sentinels true
    writeMonitorState(ctx.personalBase, {
      fillPct: 85.0,
      zoneSentinels: { degrading: true, critical: true },
    });

    const result = await runScript('session-start-hook', [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    expect(result.exitCode).toBe(0);

    const state = readMonitorState(ctx.personalBase);
    expect(state.zoneSentinels.degrading).toBe(false);
    expect(state.zoneSentinels.critical).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// F-CTX-MONITOR-COST: Burn Rate and Cost Estimation
// ---------------------------------------------------------------------------

describe('T-MON-10: burn rate is mean of last 10 messages, within 5%', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('mon10'); });
  afterEach(() => ctx.cleanup());

  it('burn rate from 15-message fixture must be within 5% of mean of last 10', async () => {
    // Token counts per message: [100,200,150,300,250,400,350,200,100,500,300,150,250,200,100]
    // Each token ≈ 4 chars, so content lengths: 400,800,600,...
    // update-monitor-state computes tokens as Math.ceil(content.length / 4)
    const tokenCounts = [100, 200, 150, 300, 250, 400, 350, 200, 100, 500, 300, 150, 250, 200, 100];
    const lines = tokenCounts.map(t =>
      JSON.stringify({ message: { role: 'user', content: 'x'.repeat(t * 4) } })
    );

    const projectId = sanitizePath(ctx.projectDir);
    const sessionDir = join(ctx.personalBase, 'projects', projectId);
    mkdirSync(sessionDir, { recursive: true });
    const sessionId = '00000000-0000-0000-0000-000000000010';
    writeFileSync(join(sessionDir, `${sessionId}.jsonl`), lines.join('\n'));

    writeMonitorState(ctx.personalBase, {
      fillPct: 0,
      zoneSentinels: { degrading: false, critical: false },
    });
    writeMonitorConfig(ctx.personalBase, {
      zones: { degrading: 65, critical: 80 },
      burnRateWindow: 10,
      models: { 'claude-sonnet-4-6': { input: 3.00, output: 15.00 }, default: { input: 3.00, output: 15.00 } },
    });

    const payload = JSON.stringify({ session_id: sessionId, project_dir: ctx.projectDir, model: 'claude-sonnet-4-6' });
    await runScriptWithStdin('update-monitor-state', payload, [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase });

    const state = readMonitorState(ctx.personalBase);
    // Last 10 of [100,200,150,300,250,400,350,200,100,500,300,150,250,200,100]
    // = [400,350,200,100,500,300,150,250,200,100] → mean = 2550/10 = 255
    const expected = 255;
    const actual = state.burnRatePerMessage;
    expect(typeof actual).toBe('number');
    expect(Math.abs(actual - expected) / expected).toBeLessThanOrEqual(0.05);
  });
});

describe('T-MON-11: cost estimation matches hand-calculated value within 1%', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('mon11'); });
  afterEach(() => ctx.cleanup());

  it('estimate-cost --verbose output matches hand-calculated total within 1%', async () => {
    // With currentTokens=100000, model=claude-sonnet-4-6, rates input=3.00, output=15.00
    // estimate-cost uses 80/20 split: input=80000, output=20000
    // cost = (80000/1e6)*3.00 + (20000/1e6)*15.00 = 0.24 + 0.30 = 0.54
    const currentTokens = 100000;
    const expectedCost = (currentTokens * 0.8 / 1e6) * 3.00 + (currentTokens * 0.2 / 1e6) * 15.00;

    writeMonitorState(ctx.personalBase, {
      fillPct: 50,
      currentTokens,
      contextWindowSize: 200000,
      model: 'claude-sonnet-4-6',
      zoneSentinels: { degrading: false, critical: false },
    });
    writeMonitorConfig(ctx.personalBase, {
      models: { 'claude-sonnet-4-6': { input: 3.00, output: 15.00 }, default: { input: 3.00, output: 15.00 } },
    });

    const result = await runScript('estimate-cost', ['--verbose'], ctx.projectDir, {
      CLAUDE_HOME: ctx.personalBase,
    });

    expect(result.exitCode).toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toMatch(/0\.5[0-9]/);  // ~$0.54, coarse range check

    // T-MON-11: extract exact total and verify within 1%. The `if (match)` guard was a T2
    // violation: if the "Total:" line disappears, the precise check was silently skipped and
    // the test passed on the coarser outer regex alone. Assert match is non-null so a format
    // change is a test failure, not a silent pass.
    const match = output.match(/Total[:\s~$]+([0-9]+\.[0-9]+)/);
    expect(match).not.toBeNull();
    const actual = parseFloat(match![1]);
    expect(Math.abs(actual - expectedCost) / expectedCost).toBeLessThanOrEqual(0.01);
  });
});

describe('T-MON-12: tokensSinceBaseline is a delta, not the total token count', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('mon12'); });
  afterEach(() => ctx.cleanup());

  it('with baselineTokens=42000 and session producing 95000 tokens, tokensSinceBaseline === 53000', async () => {
    // Content length = 95000 * 4 = 380000 chars → currentTokens = ceil(380000/4) = 95000
    const projectId = sanitizePath(ctx.projectDir);
    const sessionDir = join(ctx.personalBase, 'projects', projectId);
    mkdirSync(sessionDir, { recursive: true });
    const sessionId = '00000000-0000-0000-0000-000000000012';
    const content = 'x'.repeat(380000);
    writeFileSync(join(sessionDir, `${sessionId}.jsonl`),
      JSON.stringify({ message: { role: 'user', content } }) + '\n');

    // Pre-write state with baselineTokens=42000
    writeMonitorState(ctx.personalBase, {
      fillPct: 0,
      baselineTokens: 42000,
      zoneSentinels: { degrading: false, critical: false },
    });

    const payload = JSON.stringify({ session_id: sessionId, project_dir: ctx.projectDir, model: 'claude-sonnet-4-6' });
    const result = await runScriptWithStdin('update-monitor-state', payload, [], ctx.projectDir, {
      CLAUDE_HOME: ctx.personalBase,
    });

    expect(result.exitCode).toBe(0);

    const state = readMonitorState(ctx.personalBase);
    expect(state.currentTokens).toBe(95000);
    expect(state.tokensSinceBaseline).toBe(53000);  // 95000 - 42000
  });
});

describe('T-MON-13: state file writes are atomic', () => {
  let ctx: TestContext;

  beforeEach(() => { ctx = createTestEnvironment('mon13'); });
  afterEach(() => ctx.cleanup());

  it('concurrent readers never observe a partially-written state file', async () => {
    // Seed state and session
    const projectId = sanitizePath(ctx.projectDir);
    const sessionDir = join(ctx.personalBase, 'projects', projectId);
    mkdirSync(sessionDir, { recursive: true });
    const sessionId = '00000000-0000-0000-0000-000000000013';
    const sessionContent = JSON.stringify({ type: 'user', message: { role: 'user', content: 'x'.repeat(40000) } });
    writeFileSync(join(sessionDir, `${sessionId}.jsonl`), sessionContent + '\n');

    writeMonitorState(ctx.personalBase, {
      fillPct: 0,
      zoneSentinels: { degrading: false, critical: false },
    });

    const payload = JSON.stringify({ session_id: sessionId, project_dir: ctx.projectDir, model: 'claude-sonnet-4-6' });
    const statePath = join(ctx.personalBase, 'context-curator', 'monitor-state.json');

    // Write a CJS worker that does a tight-loop read for the duration of the writes.
    // Using worker_threads (not setImmediate) ensures the reader runs in a real OS thread,
    // guaranteeing genuine interleaving with the subprocess write windows.
    const workerCode = `
const { workerData, parentPort } = require('worker_threads');
const { readFileSync } = require('fs');
const errors = [];
const { statePath, durationMs } = workerData;
const start = Date.now();
while (Date.now() - start < durationMs) {
  try {
    const c = readFileSync(statePath, 'utf-8');
    if (c.trim()) JSON.parse(c);
  } catch (e) {
    errors.push(e.message);
  }
}
parentPort.postMessage(errors);
`;
    const workerFile = join(tmpdir(), `mon13-reader-${Date.now()}.cjs`);
    writeFileSync(workerFile, workerCode);

    const worker = new Worker(workerFile, { workerData: { statePath, durationMs: 3000 } });

    // 20 concurrent subprocess writes — large session content increases the chance
    // of catching a partial-write window
    const writes = Array.from({ length: 20 }, () =>
      runScriptWithStdin('update-monitor-state', payload, [], ctx.projectDir, { CLAUDE_HOME: ctx.personalBase })
    );

    const [parseErrors] = await Promise.all([
      new Promise<string[]>((resolve) => worker.once('message', resolve)),
      Promise.all(writes),
    ]);

    await new Promise<void>((resolve) => worker.once('exit', () => resolve()));
    try { rmSync(workerFile); } catch {}

    expect(parseErrors).toEqual([]);
  }, 30000);
});
