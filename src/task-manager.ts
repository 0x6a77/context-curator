import fs from 'fs/promises';
import path from 'path';

export interface Task {
  id: string;
  claudeMdPath: string;
  contextsDir: string;
  contexts: string[];
  lastUsed?: Date;
}

export async function getTasksDir(): Promise<string> {
  const cwd = process.cwd();
  const projectId = cwd.replace(/\//g, '-');
  return path.join(process.env.HOME!, '.claude/projects', projectId, 'tasks');
}

export async function listTasks(): Promise<Task[]> {
  const tasksDir = await getTasksDir();

  try {
    const entries = await fs.readdir(tasksDir);
    const tasks: Task[] = [];

    for (const entry of entries) {
      const taskPath = path.join(tasksDir, entry);
      const stats = await fs.stat(taskPath);

      if (stats.isDirectory() && entry !== 'node_modules') {
        const claudeMdPath = path.join(taskPath, 'CLAUDE.md');
        const contextsDir = path.join(taskPath, 'contexts');

        try {
          await fs.access(claudeMdPath);

          // List contexts
          let contexts: string[] = [];
          try {
            const contextFiles = await fs.readdir(contextsDir);
            contexts = contextFiles
              .filter(f => f.endsWith('.jsonl'))
              .map(f => f.replace('.jsonl', ''));
          } catch {
            // No contexts directory yet
          }

          tasks.push({
            id: entry,
            claudeMdPath,
            contextsDir,
            contexts,
            lastUsed: stats.mtime
          });
        } catch {
          // Not a valid task (missing CLAUDE.md)
        }
      }
    }

    return tasks.sort((a, b) => {
      if (!a.lastUsed) return 1;
      if (!b.lastUsed) return -1;
      return b.lastUsed.getTime() - a.lastUsed.getTime();
    });
  } catch {
    return [];
  }
}

export async function taskExists(taskId: string): Promise<boolean> {
  const tasksDir = await getTasksDir();
  const taskPath = path.join(tasksDir, taskId, 'CLAUDE.md');

  try {
    await fs.access(taskPath);
    return true;
  } catch {
    return false;
  }
}

export async function getCurrentTask(): Promise<string> {
  const claudeMdPath = path.join(process.cwd(), '.claude/CLAUDE.md');

  try {
    const content = await fs.readFile(claudeMdPath, 'utf-8');
    // Match: @import ~/.claude/projects/<project-id>/tasks/<task-id>/CLAUDE.md
    const match = content.match(/@import ~\/\.claude\/projects\/[^\/]+\/tasks\/([^\/\s]+)\/CLAUDE\.md/);

    if (match) {
      return match[1];
    }
  } catch {
    // Fall through
  }

  return 'default';
}

export async function validateContextName(name: string): Promise<boolean> {
  return /^[a-z0-9-]+$/.test(name);
}
