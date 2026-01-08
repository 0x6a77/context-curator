#!/usr/bin/env tsx
import { listSessionIds, readSession } from '../src/session-reader.js';
import { Session } from '../src/types.js';

async function main() {
  const cwd = process.cwd();
  const sessionIds = await listSessionIds();

  if (sessionIds.length === 0) {
    console.log('\nNo sessions found.');
    console.log('Start a session with: claude\n');
    return;
  }

  console.log(`\nSessions for ${cwd}:\n`);

  // Load all sessions
  const sessions = await Promise.all(
    sessionIds.map(async (id: string) => {
      try {
        return await readSession(id);
      } catch {
        return null;
      }
    })
  );

  // Filter out failed reads and sort by most recent
  const validSessions = sessions.filter((s): s is Session => s !== null);
  validSessions.sort((a, b) =>
    new Date(b.metadata.updatedAt).getTime() -
    new Date(a.metadata.updatedAt).getTime()
  );

  // Display sessions
  for (let i = 0; i < validSessions.length; i++) {
    const session = validSessions[i];
    const label = i === 0 ? ' [current]' : '';
    printSession(session, label);
  }
}

function printSession(session: Session, label: string) {
  const percentCapacity = (session.tokenCount / 200000) * 100;
  const capacityWarning = percentCapacity > 70 ? ' ⚠️  HIGH' : '';

  console.log(`${session.id}${label}`);
  console.log(`├─ ${session.messageCount} messages, ${(session.tokenCount / 1000).toFixed(0)}k tokens (${percentCapacity.toFixed(1)}%)${capacityWarning}`);
  console.log(`├─ Updated: ${formatRelativeTime(session.metadata.updatedAt)}`);

  // Show first user message as preview (handle structured content)
  const firstUserMsg = session.messages.find(m => m.role === 'user');
  const content = firstUserMsg?.content;
  const preview = typeof content === 'string'
    ? content.slice(0, 60)
    : (content ? JSON.stringify(content).slice(0, 60) : '(no messages)');

  console.log(`└─ Task: ${preview}${preview.length >= 60 ? '...' : ''}`);
  console.log();
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

main().catch(console.error);
