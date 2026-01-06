import { Session, Task, Message } from './types.js';

export interface Recommendation {
  type: 'remove' | 'summarize' | 'consolidate';
  description: string;
  tokenSavings: number;
  messageRange: { start: number; end: number };
}

export interface SessionAnalysis {
  tasks: Task[];
  recommendations: Recommendation[];
  totalTokens: number;
  capacityPercent: number;
}

/**
 * Estimate tokens for a set of messages
 */
function estimateTokens(messages: Message[]): number {
  const totalChars = messages.reduce((sum, msg) => {
    const content = typeof msg.content === 'string'
      ? msg.content
      : JSON.stringify(msg.content);
    return sum + content.length;
  }, 0);
  return Math.ceil(totalChars / 4);
}

/**
 * Detect task boundaries in the session
 * Tasks are separated by user messages with significant gaps or topic changes
 */
function detectTasks(messages: Message[]): Task[] {
  const tasks: Task[] = [];
  let currentTaskStart = 0;
  let lastUserIndex = -1;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (msg.role === 'user') {
      // If we have a previous task and there's a gap, close it
      if (lastUserIndex >= 0 && i - lastUserIndex > 10) {
        const taskMessages = messages.slice(currentTaskStart, lastUserIndex + 5);
        tasks.push({
          startIndex: currentTaskStart,
          endIndex: lastUserIndex + 5,
          firstPrompt: getFirstUserContent(messages, currentTaskStart),
          messageCount: taskMessages.length,
          tokenCount: estimateTokens(taskMessages),
          status: 'completed'
        });
        currentTaskStart = i;
      }
      lastUserIndex = i;
    }
  }

  // Add final task
  if (currentTaskStart < messages.length) {
    const taskMessages = messages.slice(currentTaskStart);
    tasks.push({
      startIndex: currentTaskStart,
      endIndex: messages.length - 1,
      firstPrompt: getFirstUserContent(messages, currentTaskStart),
      messageCount: taskMessages.length,
      tokenCount: estimateTokens(taskMessages),
      status: currentTaskStart === lastUserIndex ? 'in-progress' : 'completed'
    });
  }

  return tasks;
}

/**
 * Get the content of the first user message in a range
 */
function getFirstUserContent(messages: Message[], startIndex: number): string {
  for (let i = startIndex; i < messages.length; i++) {
    if (messages[i].role === 'user') {
      const content = messages[i].content;
      const str = typeof content === 'string' ? content : JSON.stringify(content);
      return str.slice(0, 100);
    }
  }
  return '(no user message)';
}

/**
 * Generate recommendations for optimizing the session
 */
function generateRecommendations(
  messages: Message[],
  tasks: Task[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Look for completed tasks with high token counts
  for (const task of tasks) {
    if (task.status === 'completed' && task.tokenCount > 5000) {
      recommendations.push({
        type: 'summarize',
        description: `Task starting at message ${task.startIndex} is completed and uses ${task.tokenCount} tokens. Consider summarizing.`,
        tokenSavings: Math.floor(task.tokenCount * 0.7), // Estimate 70% savings
        messageRange: { start: task.startIndex, end: task.endIndex }
      });
    }
  }

  // Look for repetitive error-and-retry patterns
  let errorCount = 0;
  let errorStart = -1;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const content = typeof msg.content === 'string' ? msg.content.toLowerCase() : '';

    if (content.includes('error') || content.includes('failed') || content.includes('wrong')) {
      if (errorStart === -1) errorStart = i;
      errorCount++;
    } else if (errorCount > 0) {
      if (errorCount >= 3) {
        const errorMessages = messages.slice(errorStart, i);
        recommendations.push({
          type: 'remove',
          description: `Found ${errorCount} consecutive error/retry messages (${errorStart}-${i}). Consider keeping only the solution.`,
          tokenSavings: estimateTokens(errorMessages.slice(0, -1)), // Keep last message
          messageRange: { start: errorStart, end: i - 1 }
        });
      }
      errorCount = 0;
      errorStart = -1;
    }
  }

  return recommendations;
}

/**
 * Analyze a session and provide insights
 */
export function analyzeSession(session: Session): SessionAnalysis {
  const tasks = detectTasks(session.messages);
  const recommendations = generateRecommendations(session.messages, tasks);
  const capacityPercent = (session.tokenCount / 200000) * 100;

  return {
    tasks,
    recommendations,
    totalTokens: session.tokenCount,
    capacityPercent
  };
}
