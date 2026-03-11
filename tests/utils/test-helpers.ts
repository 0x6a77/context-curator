/**
 * Test Helpers for Context Curator Integration Tests
 */

import { execSync, spawn } from 'child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync, realpathSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

const TSX = resolve(__dirname, '../../node_modules/.bin/tsx');
const SCRIPTS_DIR = resolve(__dirname, '../../scripts');

export interface TestContext {
  projectDir: string;
  personalDir: string;
  personalBase: string;
  cleanup: () => void;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Sanitize a path for personal storage directory naming
 * Matches context-curator's getProjectId logic exactly (keeps leading dash)
 */
export function sanitizePath(path: string): string {
  return path.replace(/\//g, '-');
}

/**
 * Create an isolated test environment with its own project and personal directories
 */
export function createTestEnvironment(name: string = 'test'): TestContext {
  // realpathSync resolves macOS /tmp→/private/tmp symlink so that mkdtemp
  // result matches what subprocess process.cwd() returns.
  const projectDir = realpathSync(mkdtempSync(join(tmpdir(), `cc-test-${name}-`)));
  const personalBase = realpathSync(mkdtempSync(join(tmpdir(), `cc-personal-${name}-`)));
  const sanitizedProject = sanitizePath(projectDir);
  const personalDir = join(personalBase, 'projects', sanitizedProject);
  mkdirSync(personalDir, { recursive: true });

  return {
    projectDir,
    personalDir,
    personalBase,
    cleanup: () => {
      try { rmSync(projectDir, { recursive: true, force: true }); } catch {}
      try { rmSync(personalBase, { recursive: true, force: true }); } catch {}
    },
  };
}

/**
 * Run a context-curator script with no-hang guarantee:
 * - stdin is closed immediately (no blocking reads)
 * - process group is killed hard on timeout
 */
export function runScript(
  scriptName: string,
  args: string[] = [],
  cwd: string = process.cwd(),
  env: Record<string, string> = {},
  timeoutMs: number = 15000
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const scriptPath = join(SCRIPTS_DIR, `${scriptName}.ts`);
    const child = spawn(TSX, [scriptPath, ...args], {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      try { process.kill(-child.pid!, 'SIGKILL'); } catch {}
      resolve({ stdout, stderr: stderr + '\n[TIMEOUT]', exitCode: 124 });
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: err.message, exitCode: 1 });
    });
  });
}

/**
 * Run a script synchronously (for setup/teardown)
 */
export function runScriptSync(
  scriptName: string,
  args: string[] = [],
  cwd: string = process.cwd(),
  env: Record<string, string> = {}
): CommandResult {
  const scriptPath = join(SCRIPTS_DIR, `${scriptName}.ts`);
  try {
    const stdout = execSync(`"${TSX}" "${scriptPath}" ${args.map(a => `"${a}"`).join(' ')}`, {
      cwd,
      encoding: 'utf-8',
      timeout: 15000,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || error.message,
      exitCode: error.status || 1,
    };
  }
}

export function fileExists(path: string): boolean {
  return existsSync(path);
}

export function fileContains(path: string, expected: string): boolean {
  if (!existsSync(path)) return false;
  return readFileSync(path, 'utf-8').includes(expected);
}

export function readFile(path: string): string {
  return readFileSync(path, 'utf-8');
}

export function writeFile(path: string, content: string): void {
  const dir = path.substring(0, path.lastIndexOf('/'));
  if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, content);
}

export function isValidJsonl(path: string): boolean {
  if (!existsSync(path)) return false;
  const lines = readFileSync(path, 'utf-8').split('\n').filter(l => l.trim());
  for (const line of lines) {
    try { JSON.parse(line); } catch { return false; }
  }
  return true;
}

export function parseJsonl<T = any>(path: string): T[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf-8')
    .split('\n')
    .filter(l => l.trim())
    .map(l => JSON.parse(l) as T);
}

export function createJsonl(path: string, objects: any[]): void {
  writeFile(path, objects.map(o => JSON.stringify(o)).join('\n'));
}

export function initGit(dir: string): void {
  execSync('git init', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email "test@example.com"', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: dir, stdio: 'pipe' });
}

export function isGitIgnored(dir: string, path: string): boolean {
  try { execSync(`git check-ignore "${path}"`, { cwd: dir, stdio: 'pipe' }); return true; }
  catch { return false; }
}

export function getGitStatus(dir: string): string {
  return execSync('git status --porcelain', { cwd: dir, encoding: 'utf-8' });
}

export function gitAdd(dir: string, path: string = '.'): void {
  execSync(`git add "${path}"`, { cwd: dir, stdio: 'pipe' });
}

export function gitCommit(dir: string, message: string): void {
  execSync(`git commit -m "${message}"`, { cwd: dir, stdio: 'pipe' });
}

export interface Message {
  type: string;
  message?: { role: string; content: string; };
  timestamp?: string;
}

export function createSampleMessages(count: number, topic: string = 'general'): Message[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    type: i % 2 === 0 ? 'user' : 'assistant',
    message: {
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: i % 2 === 0
        ? `Let's work on ${topic} - message ${i + 1}`
        : `I understand, working on ${topic} - response ${i + 1}`,
    },
    timestamp: new Date(now + i * 1000).toISOString(),
  }));
}

export function createContextFile(
  dir: string,
  taskId: string,
  contextName: string,
  messages: Message[],
  isGolden: boolean = false
): string {
  const basePath = isGolden
    ? join(dir, '.claude', 'tasks', taskId, 'contexts')
    : join(dir, '.claude', 'projects', sanitizePath(dir), 'tasks', taskId, 'contexts');
  mkdirSync(basePath, { recursive: true });
  const filePath = join(basePath, `${contextName}.jsonl`);
  createJsonl(filePath, messages);
  return filePath;
}

export async function waitFor(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (condition()) return true;
    await new Promise(r => setTimeout(r, interval));
  }
  return false;
}
