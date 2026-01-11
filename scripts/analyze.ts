#!/usr/bin/env tsx
import { readSession } from '../src/session-reader.js';
import { analyzeSession } from '../src/session-analyzer.js';

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

async function main() {
  const sessionId = process.argv[2];

  if (!sessionId) {
    console.error('Usage: npm run context analyze <session-id>');
    process.exit(1);
  }

  // Validate UUID format
  if (!isValidUUID(sessionId)) {
    console.error('\n❌ Invalid session ID format.');
    console.error('   Session IDs must be UUIDs (e.g., 8e14f625-bd1a-4e79-a382-2d6c0649df97)');
    console.error('   Use "context list" to see available sessions.\n');
    process.exit(1);
  }

  console.log(`\nAnalyzing session: ${sessionId}\n`);

  try {
    const session = await readSession(sessionId);
    const analysis = analyzeSession(session);

    console.log(`Session ID: ${sessionId}`);
    console.log(`Messages: ${session.messageCount}`);
    console.log(`Tokens: ${session.tokenCount.toLocaleString()}`);
    console.log(`Capacity: ${analysis.capacityPercent.toFixed(1)}%`);
    console.log('');

    // Show task breakdown
    if (analysis.tasks.length > 0) {
      console.log('Task Breakdown:');
      console.log('─'.repeat(70));
      for (const task of analysis.tasks) {
        console.log(`\nMessages ${task.startIndex}-${task.endIndex}`);
        console.log(`├─ ${task.messageCount} messages, ${(task.tokenCount / 1000).toFixed(1)}k tokens`);
        console.log(`├─ Status: ${task.status}`);
        console.log(`└─ Task: ${task.firstPrompt}${task.firstPrompt.length >= 100 ? '...' : ''}`);
      }
      console.log('');
    }

    // Show recommendations
    if (analysis.recommendations.length > 0) {
      console.log('\nRecommendations:');
      console.log('─'.repeat(70));
      for (const rec of analysis.recommendations) {
        console.log(`\n⚠️  ${rec.description}`);
        console.log(`   Potential savings: ${(rec.tokenSavings / 1000).toFixed(1)}k tokens`);
      }
      console.log('');
    } else {
      console.log('\nNo optimization recommendations at this time.\n');
    }

  } catch (err) {
    console.error(`\n❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}\n`);
    process.exit(1);
  }
}

main().catch(console.error);
