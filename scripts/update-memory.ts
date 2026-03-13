#!/usr/bin/env tsx

/**
 * update-memory.ts - Update Claude Code's auto memory with context info
 *
 * Called after a successful context save to keep MEMORY.md up to date
 * with available contexts. Claude Code loads MEMORY.md at every session start
 * (first 200 lines), so this gives Claude ambient awareness of saved contexts.
 *
 * Usage:
 *   update-memory <task-id> <context-name> <location> <message-count>
 *   location: "personal" | "golden"
 */

import fs from 'fs/promises';
import path from 'path';
import { getClaudeHome, getPersonalProjectDir, ensureDir } from '../src/utils.js';

const MEMORY_SECTION_HEADER = '## Saved Contexts (context-curator)';
const MEMORY_SECTION_FOOTER = '<!-- end:saved-contexts -->';
const MAX_CONTEXTS_IN_MEMORY = 10; // Keep only the most recent entries

interface ContextEntry {
  taskId: string;
  name: string;
  location: 'personal' | 'golden';
  messages: number;
  savedAt: string;
}

async function updateMemory(
  taskId: string,
  contextName: string,
  location: 'personal' | 'golden',
  messages: number
) {
  const memoryDir = path.join(getClaudeHome(), 'memory');
  const memoryPath = path.join(memoryDir, 'MEMORY.md');

  await ensureDir(memoryDir);

  // Read existing memory file
  let content = '';
  try {
    content = await fs.readFile(memoryPath, 'utf-8');
  } catch {
    // File doesn't exist yet, start fresh
    content = '# Project Memory\n\n';
  }

  // Parse existing context entries from the managed section
  const sectionStart = content.indexOf(MEMORY_SECTION_HEADER);
  const sectionEnd = content.indexOf(MEMORY_SECTION_FOOTER);

  let existingEntries: ContextEntry[] = [];
  let contentBefore = content;
  let contentAfter = '';

  if (sectionStart !== -1 && sectionEnd !== -1) {
    contentBefore = content.slice(0, sectionStart).trimEnd();
    contentAfter = content.slice(sectionEnd + MEMORY_SECTION_FOOTER.length).trimStart();
    const sectionContent = content.slice(sectionStart + MEMORY_SECTION_HEADER.length, sectionEnd);

    // Parse existing entries (format: `- task/name (N msgs) [location] saved:date`)
    const entryRegex = /^- (\S+)\/(\S+) \((\d+) msgs\) \[(personal|golden)\] saved:(\S+)/gm;
    let match;
    while ((match = entryRegex.exec(sectionContent)) !== null) {
      existingEntries.push({
        taskId: match[1],
        name: match[2],
        location: match[4] as 'personal' | 'golden',
        messages: parseInt(match[3]),
        savedAt: match[5],
      });
    }
  } else {
    contentBefore = content.trimEnd();
  }

  // Add new entry (deduplicate by task+name)
  existingEntries = existingEntries.filter(
    e => !(e.taskId === taskId && e.name === contextName)
  );
  existingEntries.push({
    taskId,
    name: contextName,
    location,
    messages,
    savedAt: new Date().toISOString().slice(0, 10),
  });

  // Keep only the most recent MAX_CONTEXTS_IN_MEMORY entries
  if (existingEntries.length > MAX_CONTEXTS_IN_MEMORY) {
    existingEntries = existingEntries.slice(-MAX_CONTEXTS_IN_MEMORY);
  }

  // Sort: golden first, then by date descending
  existingEntries.sort((a, b) => {
    if (a.location !== b.location) return a.location === 'golden' ? -1 : 1;
    return b.savedAt.localeCompare(a.savedAt);
  });

  // Rebuild section
  const entryLines = existingEntries.map(e =>
    `- ${e.taskId}/${e.name} (${e.messages} msgs) [${e.location}] saved:${e.savedAt}`
  );
  const newSection = [
    MEMORY_SECTION_HEADER,
    '',
    'Use `/context-list` to load one of these saved contexts:',
    ...entryLines,
    '',
    MEMORY_SECTION_FOOTER,
  ].join('\n');

  // Rebuild full content
  const parts = [contentBefore, '', newSection];
  if (contentAfter) parts.push('', contentAfter);
  const newContent = parts.join('\n') + '\n';

  await fs.writeFile(memoryPath, newContent);
  process.stderr.write(`update-memory: added ${taskId}/${contextName} to MEMORY.md\n`);
}

// Main
const [taskId, contextName, location, messagesStr] = process.argv.slice(2);

if (!taskId || !contextName || !location || !messagesStr) {
  console.error('Usage: update-memory <task-id> <context-name> <location> <message-count>');
  process.exit(1);
}

if (location !== 'personal' && location !== 'golden') {
  console.error('location must be "personal" or "golden"');
  process.exit(1);
}

updateMemory(taskId, contextName, location as 'personal' | 'golden', parseInt(messagesStr)).catch((err) => {
  process.stderr.write(`update-memory: error: ${err.message}\n`);
  process.exit(0); // Non-fatal
});
