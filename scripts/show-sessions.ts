#!/usr/bin/env tsx
import { listSessionIds, readSession } from '../src/session-reader.js';
import { Session } from '../src/types.js';

async function main() {
  const cwd = process.cwd();
  const sessionIds = await listSessionIds();
  
  if (sessionIds.length === 0) {
    console.log('\nNo sessions found in this directory.');
    console.log('Start a session with: claude\n');
    return;
  }
  
  console.log(`\nSessions in ${cwd}/.claude/sessions/:\n`);
  
  // Load and sort sessions by recency
  const sessions = await Promise.all(
    sessionIds.map(async id => {
      try {
        return await readSession(id);
      } catch (err) {
        return null;
      }
    })
  );
  
  const validSessions = sessions.filter(s => s !== null) as Session[];
  validSessions.sort((a, b) => 
    new Date(b.metadata.updatedAt).getTime() - 
    new Date(a.metadata.updatedAt).getTime()
  );
  
  // Display each session
  for (let i = 0; i < validSessions.length; i++) {
    const session = validSessions[i];
    const percentCapacity = (session.tokenCount / 200000) * 100;
    const capacityWarning = percentCapacity > 70 ? ' ⚠️  HIGH' : '';
    const recentMarker = i === 0 ? ' [most recent]' : '';
    
    console.log(`${session.id}${recentMarker}`);
    console.log(`├─ ${session.messageCount} messages, ${session.tokenCount.toLocaleString()} tokens (${percentCapacity.toFixed(1)}%)${capacityWarning}`);
    console.log(`├─ Updated: ${formatRelativeTime(session.metadata.updatedAt)}`);
    
    // Show first user message as preview
    const firstUserMsg = session.messages.find(m => m.role === 'user');
    const preview = firstUserMsg ? firstUserMsg.content.slice(0, 60) : '(no messages)';
    console.log(`└─ Task: ${preview}${preview.length >= 60 ? '...' : ''}`);
    console.log();
  }
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
