/**
 * Test Helpers for Context Curator Integration Tests
 * 
 * These utilities provide a consistent way to:
 * - Create isolated test environments
 * - Run context-curator scripts
 * - Verify file system state
 * - Validate JSONL format
 * - Check git state
 */

import { execSync, exec } from 'child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir, homedir } from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface TestContext {
  projectDir: string;
  personalDir: string;
  cleanup: () => void;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Sanitize a path for personal storage directory naming
 * Matches context-curator's path sanitization logic
 */
export function sanitizePath(path: string): string {
  return path.replace(/\//g, '-').replace(/^-/, '');
}

/**
 * Create an isolated test environment with its own project and personal directories
 */
export function createTestEnvironment(name: string = 'test'): TestContext {
  // Create temp project directory
  const projectDir = mkdtempSync(join(tmpdir(), `cc-test-${name}-`));
  
  // Create temp personal directory (simulating ~/.claude)
  const personalBase = mkdtempSync(join(tmpdir(), `cc-personal-${name}-`));
  const sanitizedProject = sanitizePath(projectDir);
  const personalDir = join(personalBase, 'projects', sanitizedProject);
  mkdirSync(personalDir, { recursive: true });
  
  return {
    projectDir,
    personalDir,
    cleanup: () => {
      try {
        rmSync(projectDir, { recursive: true, force: true });
        rmSync(personalBase, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    },
  };
}

/**
 * Run a context-curator script with the given arguments
 */
export async function runScript(
  scriptName: string,
  args: string[] = [],
  cwd: string = process.cwd(),
  env: Record<string, string> = {}
): Promise<CommandResult> {
  const scriptPath = resolve(__dirname, '../../scripts', `${scriptName}.ts`);
  const command = `npx tsx "${scriptPath}" ${args.map(a => `"${a}"`).join(' ')}`;
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      env: { ...process.env, ...env },
      timeout: 30000,
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      exitCode: error.code || 1,
    };
  }
}

/**
 * Run a script synchronously (for setup/teardown)
 */
export function runScriptSync(
  scriptName: string,
  args: string[] = [],
  cwd: string = process.cwd()
): CommandResult {
  const scriptPath = resolve(__dirname, '../../scripts', `${scriptName}.ts`);
  const command = `npx tsx "${scriptPath}" ${args.map(a => `"${a}"`).join(' ')}`;
  
  try {
    const stdout = execSync(command, {
      cwd,
      encoding: 'utf-8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
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

/**
 * Verify a file exists at the given path
 */
export function fileExists(path: string): boolean {
  return existsSync(path);
}

/**
 * Verify a file contains the expected content
 */
export function fileContains(path: string, expected: string): boolean {
  if (!existsSync(path)) return false;
  const content = readFileSync(path, 'utf-8');
  return content.includes(expected);
}

/**
 * Read file content
 */
export function readFile(path: string): string {
  return readFileSync(path, 'utf-8');
}

/**
 * Write file content
 */
export function writeFile(path: string, content: string): void {
  const dir = path.substring(0, path.lastIndexOf('/'));
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, content);
}

/**
 * Validate that a file is valid JSONL format
 */
export function isValidJsonl(path: string): boolean {
  if (!existsSync(path)) return false;
  
  const content = readFileSync(path, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  for (const line of lines) {
    try {
      JSON.parse(line);
    } catch {
      return false;
    }
  }
  
  return true;
}

/**
 * Parse a JSONL file into an array of objects
 */
export function parseJsonl<T = any>(path: string): T[] {
  if (!existsSync(path)) return [];
  
  const content = readFileSync(path, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  return lines.map(line => JSON.parse(line) as T);
}

/**
 * Create a JSONL file from an array of objects
 */
export function createJsonl(path: string, objects: any[]): void {
  const content = objects.map(obj => JSON.stringify(obj)).join('\n');
  writeFile(path, content);
}

/**
 * Initialize git in a directory
 */
export function initGit(dir: string): void {
  execSync('git init', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email "test@example.com"', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: dir, stdio: 'pipe' });
}

/**
 * Check if a file is git-ignored
 */
export function isGitIgnored(dir: string, path: string): boolean {
  try {
    execSync(`git check-ignore "${path}"`, { cwd: dir, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get git status output
 */
export function getGitStatus(dir: string): string {
  return execSync('git status --porcelain', { cwd: dir, encoding: 'utf-8' });
}

/**
 * Stage files in git
 */
export function gitAdd(dir: string, path: string = '.'): void {
  execSync(`git add "${path}"`, { cwd: dir, stdio: 'pipe' });
}

/**
 * Commit changes in git
 */
export function gitCommit(dir: string, message: string): void {
  execSync(`git commit -m "${message}"`, { cwd: dir, stdio: 'pipe' });
}

/**
 * Create a sample context with messages
 */
export interface Message {
  type: string;
  message?: {
    role: string;
    content: string;
  };
  timestamp?: string;
}

export function createSampleMessages(count: number, topic: string = 'general'): Message[] {
  const messages: Message[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const isUser = i % 2 === 0;
    messages.push({
      type: isUser ? 'user' : 'assistant',
      message: {
        role: isUser ? 'user' : 'assistant',
        content: isUser 
          ? `Let's work on ${topic} - message ${i + 1}`
          : `I understand, working on ${topic} - response ${i + 1}`,
      },
      timestamp: new Date(now + i * 1000).toISOString(),
    });
  }
  
  return messages;
}

/**
 * Create a context file with the given messages
 */
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

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (condition()) return true;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return false;
}
