#!/usr/bin/env tsx
import { readSession } from '../src/session-reader.js';
import { Message } from '../src/types.js';
import { randomUUID } from 'crypto';

/**
 * Format a message's content as it would appear in the full prompt
 */
function formatMessageContent(message: Message): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  // Handle structured content (arrays of content blocks)
  if (Array.isArray(message.content)) {
    return message.content
      .map(block => {
        if (typeof block === 'string') {
          return block;
        }
        if (block.type === 'text') {
          return block.text;
        }
        if (block.type === 'tool_use') {
          return `[Tool Use: ${block.name}]`;
        }
        if (block.type === 'tool_result') {
          return `[Tool Result]`;
        }
        return JSON.stringify(block);
      })
      .join('\n');
  }
  
  // Fallback for other structured content
  return JSON.stringify(message.content, null, 2);
}

/**
 * Get timestamp from message or generate current time
 */
function getTimestamp(message: Message): string {
  if (message.timestamp) {
    return message.timestamp;
  }
  return new Date().toISOString();
}

/**
 * Get or generate a UUID for the chunk
 */
function getChunkId(message: Message, index: number): string {
  // Check if metadata has an ID
  if (message.metadata?.id) {
    return message.metadata.id;
  }
  
  // Generate a deterministic UUID based on index
  // In a real session, each message would have its own UUID
  // For display purposes, we'll generate one based on the index
  const uuid = randomUUID();
  return uuid;
}

async function main() {
  const sessionId = process.argv[2];
  
  if (!sessionId) {
    console.error('Usage: npm run dump <session-id>');
    process.exit(1);
  }
  
  try {
    const session = await readSession(sessionId);
    
    console.log(`\nFull Prompt for ${sessionId}`);
    console.log(`Session type: ${session.isNamed ? 'Named' : 'Unnamed'}`);
    console.log(`Total messages: ${session.messageCount}`);
    console.log(`Total tokens: ${session.tokenCount.toLocaleString()}\n`);
    console.log('═'.repeat(70));
    console.log('');
    
    // Concatenate all messages into the full prompt format
    for (let i = 0; i < session.messages.length; i++) {
      const message = session.messages[i];
      const timestamp = getTimestamp(message);
      const chunkId = getChunkId(message, i);
      
      // Add chunk marker
      console.log(`### CHUNK ${timestamp} ${chunkId}`);
      console.log('');
      
      // Add role indicator
      const roleLabel = message.role.toUpperCase();
      console.log(`[${roleLabel}]`);
      
      // Add content
      const content = formatMessageContent(message);
      console.log(content);
      console.log('');
    }
    
    console.log('═'.repeat(70));
    console.log(`\nEnd of session dump\n`);
    
  } catch (err) {
    console.error(`\n❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}\n`);
    process.exit(1);
  }
}

main().catch(console.error);
