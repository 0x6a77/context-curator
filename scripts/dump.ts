#!/usr/bin/env tsx
import { readSession } from '../src/session-reader.js';
import { Message } from '../src/types.js';

/**
 * Get message type from message
 */
function getMessageType(message: Message): string {
  // Check if metadata has a type
  if (message.metadata?.type) {
    return message.metadata.type;
  }
  
  // Fall back to role
  return message.role;
}

/**
 * Get timestamp from message
 */
function getTimestamp(message: Message): string {
  if (message.timestamp) {
    return message.timestamp;
  }
  return new Date().toISOString();
}

/**
 * Format message content for display
 */
function formatMessageContent(message: Message): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  // Handle structured content
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
  
  return JSON.stringify(message.content, null, 2);
}

async function main() {
  const sessionId = process.argv[2];
  const typeFilter = process.argv[3]; // optional type filter
  
  if (!sessionId) {
    console.error('Usage: npm run context dump <session-id> [type]');
    console.error('Types: user, assistant, file-history-snapshot, summary');
    process.exit(1);
  }
  
  try {
    const session = await readSession(sessionId);
    
    // Sort messages by timestamp
    const sortedMessages = [...session.messages].sort((a, b) => {
      const timeA = getTimestamp(a);
      const timeB = getTimestamp(b);
      return timeA.localeCompare(timeB);
    });
    
    // Filter by type if specified
    let messages = sortedMessages;
    if (typeFilter) {
      messages = sortedMessages.filter(msg => {
        const msgType = getMessageType(msg);
        return msgType === typeFilter;
      });
    }
    
    console.log(`\nSession Dump: ${sessionId}`);
    console.log(`Session type: ${session.isNamed ? 'Named' : 'Unnamed'}`);
    if (typeFilter) {
      console.log(`Filter: ${typeFilter}`);
      console.log(`Matching messages: ${messages.length} of ${session.messageCount}`);
    } else {
      console.log(`Total messages: ${session.messageCount}`);
    }
    console.log('');
    console.log('═'.repeat(70));
    console.log('');
    
    // Display messages in the specified format
    for (const message of messages) {
      const msgType = getMessageType(message);
      const timestamp = getTimestamp(message);
      const content = formatMessageContent(message);
      
      console.log(`--- MESSAGE ${msgType} ${timestamp}`);
      console.log(content);
      console.log('');
    }
    
    console.log('═'.repeat(70));
    console.log(`\nEnd of dump (${messages.length} message${messages.length !== 1 ? 's' : ''})\n`);
    
  } catch (err) {
    console.error(`\n❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}\n`);
    process.exit(1);
  }
}

main().catch(console.error);
