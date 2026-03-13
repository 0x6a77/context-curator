import fs from 'fs/promises';
import path from 'path';

/**
 * v13.0 Utilities for Context Curator
 * 
 * Storage locations:
 * - Golden (shared): ./.claude/tasks/<task-id>/contexts/
 * - Personal: ~/.claude/projects/<project-id>/tasks/<task-id>/contexts/
 */

// ============================================================================
// Path Utilities
// ============================================================================

/**
 * Get the Claude home directory (respects CLAUDE_HOME env var for testing)
 */
export function getClaudeHome(): string {
  return process.env.CLAUDE_HOME || path.join(process.env.HOME!, '.claude');
}

/**
 * Compute the project directory encoding used by Claude Code
 * /Users/dev/my-project → -Users-dev-my-project
 */
export function getProjectId(cwd: string = process.cwd()): string {
  return cwd.replace(/\//g, '-');
}

/**
 * Get the personal storage directory for a project
 */
export function getPersonalProjectDir(cwd: string = process.cwd()): string {
  const projectId = getProjectId(cwd);
  return path.join(getClaudeHome(), 'projects', projectId);
}

/**
 * Get the golden (project) tasks directory
 */
export function getGoldenTasksDir(cwd: string = process.cwd()): string {
  return path.join(cwd, '.claude/tasks');
}

/**
 * Get the personal tasks directory
 */
export function getPersonalTasksDir(cwd: string = process.cwd()): string {
  return path.join(getPersonalProjectDir(cwd), 'tasks');
}

// ============================================================================
// File Utilities
// ============================================================================

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a directory exists
 */
export async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

// ============================================================================
// Task Utilities
// ============================================================================

export interface TaskInfo {
  id: string;
  location: 'golden' | 'personal';
  claudeMdPath: string;
  contextsDir: string;
  lastModified?: Date;
}

export interface ContextInfo {
  name: string;
  location: 'golden' | 'personal';
  filePath: string;
  messages: number;
  tokens: number;
  lastModified: Date;
}

/**
 * Get information about a task (checks golden first, then personal)
 */
export async function getTaskInfo(taskId: string, cwd: string = process.cwd()): Promise<TaskInfo | null> {
  const goldenPath = path.join(getGoldenTasksDir(cwd), taskId, 'CLAUDE.md');
  const personalPath = path.join(getPersonalTasksDir(cwd), taskId, 'CLAUDE.md');
  
  // Check golden first
  if (await fileExists(goldenPath)) {
    const stats = await fs.stat(goldenPath);
    return {
      id: taskId,
      location: 'golden',
      claudeMdPath: goldenPath,
      contextsDir: path.join(getGoldenTasksDir(cwd), taskId, 'contexts'),
      lastModified: stats.mtime
    };
  }
  
  // Check personal
  if (await fileExists(personalPath)) {
    const stats = await fs.stat(personalPath);
    return {
      id: taskId,
      location: 'personal',
      claudeMdPath: personalPath,
      contextsDir: path.join(getPersonalTasksDir(cwd), taskId, 'contexts'),
      lastModified: stats.mtime
    };
  }
  
  return null;
}

/**
 * List all tasks (both golden and personal)
 */
export async function listTasks(cwd: string = process.cwd()): Promise<TaskInfo[]> {
  const tasks: TaskInfo[] = [];
  const seenIds = new Set<string>();
  
  // List golden tasks
  const goldenDir = getGoldenTasksDir(cwd);
  if (await dirExists(goldenDir)) {
    const entries = await fs.readdir(goldenDir);
    for (const entry of entries) {
      const claudeMdPath = path.join(goldenDir, entry, 'CLAUDE.md');
      if (await fileExists(claudeMdPath)) {
        const stats = await fs.stat(claudeMdPath);
        tasks.push({
          id: entry,
          location: 'golden',
          claudeMdPath,
          contextsDir: path.join(goldenDir, entry, 'contexts'),
          lastModified: stats.mtime
        });
        seenIds.add(entry);
      }
    }
  }
  
  // List personal tasks (excluding duplicates)
  const personalDir = getPersonalTasksDir(cwd);
  if (await dirExists(personalDir)) {
    const entries = await fs.readdir(personalDir);
    for (const entry of entries) {
      if (seenIds.has(entry)) continue; // Skip if already in golden
      
      const claudeMdPath = path.join(personalDir, entry, 'CLAUDE.md');
      if (await fileExists(claudeMdPath)) {
        const stats = await fs.stat(claudeMdPath);
        tasks.push({
          id: entry,
          location: 'personal',
          claudeMdPath,
          contextsDir: path.join(personalDir, entry, 'contexts'),
          lastModified: stats.mtime
        });
      }
    }
  }
  
  // Sort by last modified (most recent first)
  return tasks.sort((a, b) => {
    if (!a.lastModified) return 1;
    if (!b.lastModified) return -1;
    return b.lastModified.getTime() - a.lastModified.getTime();
  });
}

/**
 * List contexts for a task (both golden and personal)
 */
export async function listContexts(taskId: string, cwd: string = process.cwd()): Promise<ContextInfo[]> {
  const contexts: ContextInfo[] = [];
  const seenNames = new Set<string>();
  
  // Golden contexts
  const goldenDir = path.join(getGoldenTasksDir(cwd), taskId, 'contexts');
  if (await dirExists(goldenDir)) {
    const files = await fs.readdir(goldenDir);
    for (const file of files) {
      if (!file.endsWith('.jsonl')) continue;
      const name = file.replace('.jsonl', '');
      const filePath = path.join(goldenDir, file);
      const stats = await getSessionStats(filePath);
      const fileStats = await fs.stat(filePath);
      
      contexts.push({
        name,
        location: 'golden',
        filePath,
        messages: stats.messages,
        tokens: stats.tokens,
        lastModified: fileStats.mtime
      });
      seenNames.add(name);
    }
  }
  
  // Personal contexts
  const personalDir = path.join(getPersonalTasksDir(cwd), taskId, 'contexts');
  if (await dirExists(personalDir)) {
    const files = await fs.readdir(personalDir);
    for (const file of files) {
      if (!file.endsWith('.jsonl')) continue;
      const name = file.replace('.jsonl', '');
      if (seenNames.has(name)) continue; // Skip if already in golden
      
      const filePath = path.join(personalDir, file);
      const stats = await getSessionStats(filePath);
      const fileStats = await fs.stat(filePath);
      
      contexts.push({
        name,
        location: 'personal',
        filePath,
        messages: stats.messages,
        tokens: stats.tokens,
        lastModified: fileStats.mtime
      });
    }
  }
  
  // Sort by last modified (most recent first)
  return contexts.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}

/**
 * Get the current task from .claude/CLAUDE.md @import line
 */
export async function getCurrentTask(cwd: string = process.cwd()): Promise<string> {
  const claudeMdPath = path.join(cwd, '.claude/CLAUDE.md');
  
  try {
    const content = await fs.readFile(claudeMdPath, 'utf-8');
    
    // Match: @import .claude/tasks/<task-id>/CLAUDE.md (golden)
    // or: @import ~/.claude/projects/<project-id>/tasks/<task-id>/CLAUDE.md (personal)
    const goldenMatch = content.match(/@import \.claude\/tasks\/([^\/]+)\/CLAUDE\.md/);
    if (goldenMatch) {
      return goldenMatch[1];
    }
    
    const personalMatch = content.match(/@import ~\/\.claude\/projects\/[^\/]+\/tasks\/([^\/]+)\/CLAUDE\.md/);
    if (personalMatch) {
      return personalMatch[1];
    }
  } catch {
    // Fall through
  }
  
  return 'default';
}

// ============================================================================
// Session Utilities
// ============================================================================

/**
 * Get session statistics from a JSONL file
 */
export async function getSessionStats(sessionPath: string): Promise<{ messages: number; tokens: number }> {
  try {
    const content = await fs.readFile(sessionPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    const totalChars = lines.reduce((sum, line) => {
      try {
        const msg = JSON.parse(line);
        const contentStr = typeof msg.content === 'string'
          ? msg.content
          : JSON.stringify(msg.content);
        return sum + contentStr.length;
      } catch {
        return sum;
      }
    }, 0);

    return {
      messages: lines.length,
      tokens: Math.ceil(totalChars / 4)
    };
  } catch {
    return { messages: 0, tokens: 0 };
  }
}

/**
 * Find a session file in various possible locations
 */
export async function findSessionFile(sessionId: string, cwd: string = process.cwd()): Promise<string | null> {
  const homeDir = process.env.HOME!;
  const projectId = getProjectId(cwd);

  const possiblePaths = [
    // Claude Code project-specific location (most common)
    path.join(homeDir, '.claude/projects', projectId, `${sessionId}.jsonl`),
    // Local .claude/sessions
    path.join(cwd, '.claude/sessions', `${sessionId}.jsonl`),
    // Global sessions directory
    path.join(homeDir, '.claude/sessions', `${sessionId}.jsonl`),
  ];

  for (const p of possiblePaths) {
    if (await fileExists(p)) {
      return p;
    }
  }

  return null;
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format a date in a human-readable relative format
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;

  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

/**
 * Validate a context/task name
 */
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name) {
    return { valid: false, error: 'Name is required' };
  }
  
  if (!/^[a-z0-9-]+$/.test(name)) {
    return { valid: false, error: 'Use lowercase letters, numbers, and hyphens only' };
  }
  
  if (name.length > 50) {
    return { valid: false, error: 'Name must be 50 characters or less' };
  }
  
  return { valid: true };
}

// ============================================================================
// Secret Detection
// ============================================================================

export interface SecretMatch {
  line: number;
  type: string;
  preview: string;
}

const SECRET_PATTERNS = [
  { name: 'Stripe API Key', pattern: /sk_(test|live)_[a-zA-Z0-9]{8,}/ },
  { name: 'Stripe Publishable Key', pattern: /pk_(test|live)_[a-zA-Z0-9]{8,}/ },
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'AWS Secret Key', pattern: /aws_secret_access_key['":\s=]+[a-zA-Z0-9\/+=]{40}/i },
  { name: 'GitHub Token', pattern: /ghp_[a-zA-Z0-9]{36}/ },
  { name: 'GitHub PAT', pattern: /github_pat_[a-zA-Z0-9_]{22,}/ },
  { name: 'Generic API Key', pattern: /api[_-]?key['":\s=]+['"]?[a-zA-Z0-9_-]{20,}['"]?/i },
  { name: 'Generic Secret', pattern: /secret['":\s=]+['"]?[a-zA-Z0-9_-]{20,}['"]?/i },
  { name: 'Password', pattern: /password['":\s=]+['"]?[^\s'"]{8,}['"]?/i },
  { name: 'Private Key', pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Database URL with Password', pattern: /(postgres|mysql|mongodb):\/\/[^:]+:[^@]+@/ },
];

/**
 * Scan content for potential secrets
 */
export function scanForSecrets(content: string): SecretMatch[] {
  const matches: SecretMatch[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const { name, pattern } of SECRET_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        // Create a preview that masks most of the secret
        const preview = match[0].length > 20 
          ? match[0].slice(0, 15) + '...[MASKED]'
          : match[0].slice(0, 8) + '...[MASKED]';
        
        matches.push({
          line: i + 1,
          type: name,
          preview
        });
      }
    }
  }
  
  return matches;
}

/**
 * Redact secrets from content
 */
export function redactSecrets(content: string): string {
  let result = content;
  
  for (const { pattern } of SECRET_PATTERNS) {
    result = result.replace(new RegExp(pattern, 'g'), (match) => {
      // Keep first few chars for recognition, replace rest with [REDACTED]
      const keepChars = Math.min(8, Math.floor(match.length / 4));
      return match.slice(0, keepChars) + '[REDACTED]';
    });
  }
  
  return result;
}

// ============================================================================
// Context Size Validation
// ============================================================================

export const MAX_GOLDEN_SIZE_BYTES = 100 * 1024; // 100KB

/**
 * Check if a file is within the golden context size limit.
 * Returns { ok: true } or { ok: false, sizeBytes: number }
 */
export async function checkGoldenContextSize(filePath: string): Promise<{ ok: boolean; sizeBytes?: number }> {
  try {
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_GOLDEN_SIZE_BYTES) {
      return { ok: false, sizeBytes: stats.size };
    }
    return { ok: true };
  } catch {
    return { ok: true }; // file doesn't exist yet, no size issue
  }
}
