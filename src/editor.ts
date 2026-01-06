import Anthropic from '@anthropic-ai/sdk';
import { Session, Message, SessionChange } from './types.js';
import { readSession } from './session-reader.js';
import { writeSession, backupSession } from './session-writer.js';
import { analyzeSession, SessionAnalysis } from './session-analyzer.js';
import * as readline from 'readline';

interface EditorState {
  session: Session;
  original: Session;
  stagedChanges: SessionChange[];
  changeHistory: SessionChange[][];
  analysis: SessionAnalysis;
}

export class SessionEditor {
  private state: EditorState | null = null;
  private client: Anthropic;
  private model: string;
  private rl: readline.Interface | null = null;

  constructor(model: 'sonnet' | 'opus' | 'haiku') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.client = new Anthropic({ apiKey });
    
    // Map friendly names to model IDs
    const modelMap = {
      'sonnet': 'claude-sonnet-4-20250514',
      'opus': 'claude-opus-4-20250514',
      'haiku': 'claude-3-5-haiku-20241022'
    };
    this.model = modelMap[model];
  }

  /**
   * Load a session into the editor
   */
  async loadSession(sessionId: string): Promise<void> {
    console.log(`\nLoading session: ${sessionId}...`);
    
    // Read the session
    const session = await readSession(sessionId);
    
    // Create backup
    console.log('Creating backup...');
    const backupName = await backupSession(sessionId);
    console.log(`✓ Backup created: ${backupName}\n`);
    
    // Analyze the session
    const analysis = analyzeSession(session);
    
    // Initialize state
    this.state = {
      session: { ...session, messages: [...session.messages] },
      original: session,
      stagedChanges: [],
      changeHistory: [],
      analysis
    };

    // Show session overview
    this.showOverview();
  }

  /**
   * Show session overview
   */
  private showOverview(): void {
    if (!this.state) return;

    const { session, analysis } = this.state;
    
    console.log('═'.repeat(70));
    console.log('Session Editor');
    console.log('═'.repeat(70));
    console.log(`Session: ${session.id}`);
    console.log(`Messages: ${session.messageCount}`);
    console.log(`Tokens: ${session.tokenCount.toLocaleString()} (${analysis.capacityPercent.toFixed(1)}%)`);
    console.log('');

    // Show recommendations
    if (analysis.recommendations.length > 0) {
      console.log('Optimization Recommendations:');
      console.log('─'.repeat(70));
      for (const rec of analysis.recommendations) {
        console.log(`\n${rec.description}`);
        console.log(`  Potential savings: ${(rec.tokenSavings / 1000).toFixed(1)}k tokens`);
      }
      console.log('');
    }

    console.log('Commands:');
    console.log('  - Describe changes in natural language');
    console.log('  - @apply    - Apply staged changes');
    console.log('  - @undo     - Undo last staged change');
    console.log('  - @undo all - Undo all staged changes');
    console.log('  - @preview  - Show before/after comparison');
    console.log('  - @exit     - Exit without saving');
    console.log('  - @quit     - Same as @exit');
    console.log('═'.repeat(70));
    console.log('');
  }

  /**
   * Start the interactive editing loop
   */
  async startInteractive(): Promise<void> {
    if (!this.state) {
      throw new Error('No session loaded');
    }

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'editor> '
    });

    this.rl.prompt();

    for await (const line of this.rl) {
      const trimmed = line.trim();
      
      if (!trimmed) {
        this.rl.prompt();
        continue;
      }

      // Handle special commands
      if (trimmed === '@apply') {
        await this.applyChanges();
      } else if (trimmed === '@undo') {
        this.undoLastChange();
      } else if (trimmed === '@undo all') {
        this.undoAllChanges();
      } else if (trimmed === '@preview') {
        this.showPreview();
      } else if (trimmed === '@exit' || trimmed === '@quit') {
        console.log('\nExiting without saving changes.\n');
        this.rl.close();
        break;
      } else {
        // Natural language request - use Claude to interpret
        await this.processNaturalLanguageRequest(trimmed);
      }

      this.rl.prompt();
    }
  }

  /**
   * Process a natural language editing request using Claude
   */
  private async processNaturalLanguageRequest(request: string): Promise<void> {
    if (!this.state) return;

    console.log('\nAnalyzing request...');

    try {
      // Build context for Claude
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(request);

      // Call Claude API
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });

      // Parse Claude's response
      const content = response.content[0];
      if (content.type !== 'text') {
        console.log('Error: Unexpected response format');
        return;
      }

      const suggestion = this.parseSuggestion(content.text);
      
      if (!suggestion) {
        console.log('Could not understand request. Please try rephrasing.');
        return;
      }

      // Stage the change
      this.stageChange(suggestion);

    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Build system prompt for Claude
   */
  private buildSystemPrompt(): string {
    return `You are a session editor assistant. Your job is to help users optimize their Claude Code conversation sessions by removing unnecessary messages, summarizing completed tasks, or consolidating redundant exchanges.

When the user describes what they want to change, respond with a JSON object describing the change:

{
  "type": "remove" | "summarize" | "edit",
  "description": "Brief description of the change",
  "messageRange": { "start": number, "end": number },
  "newContent": "Optional: new content for summarize/edit operations"
}

Types of changes:
- "remove": Delete messages in the range
- "summarize": Replace messages with a summary
- "edit": Modify specific messages

Be conservative - only suggest changes that clearly match the user's intent.`;
  }

  /**
   * Build user prompt with session context
   */
  private buildUserPrompt(request: string): string {
    if (!this.state) return request;

    const { session, analysis } = this.state;
    
    // Build a concise representation of the session
    const taskSummary = analysis.tasks.map((task, idx) => {
      return `Task ${idx + 1} (messages ${task.startIndex}-${task.endIndex}): ${task.firstPrompt}... [${task.messageCount} msgs, ${(task.tokenCount / 1000).toFixed(1)}k tokens, ${task.status}]`;
    }).join('\n');

    return `Session Overview:
- Total messages: ${session.messageCount}
- Total tokens: ${session.tokenCount.toLocaleString()}

Tasks in session:
${taskSummary}

User request: ${request}

Respond with a JSON object describing the change to make.`;
  }

  /**
   * Parse Claude's suggestion into a SessionChange
   */
  private parseSuggestion(text: string): SessionChange | null {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.type || !parsed.description || !parsed.messageRange) {
        return null;
      }

      const { start, end } = parsed.messageRange;
      const original = this.state!.session.messages.slice(start, end + 1);
      
      let modified: Message[];
      
      if (parsed.type === 'remove') {
        modified = [];
      } else if (parsed.type === 'summarize' && parsed.newContent) {
        modified = [{
          role: 'assistant',
          content: parsed.newContent
        }];
      } else if (parsed.type === 'edit' && parsed.newContent) {
        modified = original.map(msg => ({ ...msg, content: parsed.newContent }));
      } else {
        return null;
      }

      const tokenDelta = this.estimateTokens(modified) - this.estimateTokens(original);

      return {
        type: parsed.type,
        description: parsed.description,
        original,
        modified,
        tokenDelta
      };
    } catch (err) {
      return null;
    }
  }

  /**
   * Stage a change
   */
  private stageChange(change: SessionChange): void {
    if (!this.state) return;

    this.state.stagedChanges.push(change);
    
    console.log(`\n✓ Staged change: ${change.description}`);
    console.log(`  Token delta: ${change.tokenDelta > 0 ? '+' : ''}${change.tokenDelta}`);
    console.log(`\nType @apply to commit this change, or continue editing.`);
  }

  /**
   * Apply all staged changes
   */
  private async applyChanges(): Promise<void> {
    if (!this.state || this.state.stagedChanges.length === 0) {
      console.log('\nNo staged changes to apply.\n');
      return;
    }

    console.log(`\nApplying ${this.state.stagedChanges.length} change(s)...`);

    // Apply changes to create new message array
    let messages = [...this.state.original.messages];
    
    for (const change of this.state.stagedChanges) {
      // Find where the original messages are in the current array
      const startIdx = this.findMessageSequence(messages, change.original);
      
      if (startIdx === -1) {
        console.log(`Warning: Could not apply change "${change.description}" - messages not found`);
        continue;
      }

      // Replace the original messages with modified ones
      messages.splice(startIdx, change.original.length, ...change.modified);
    }

    // Calculate new stats
    const oldTokens = this.state.original.tokenCount;
    const newTokens = this.estimateTokens(messages);
    const saved = oldTokens - newTokens;

    // Write the session
    await writeSession(this.state.session.id, messages);

    console.log('\n✓ Changes applied successfully!');
    console.log(`  Before: ${this.state.original.messageCount} messages, ${oldTokens.toLocaleString()} tokens`);
    console.log(`  After:  ${messages.length} messages, ${newTokens.toLocaleString()} tokens`);
    console.log(`  Saved:  ${saved.toLocaleString()} tokens (${((saved / oldTokens) * 100).toFixed(1)}%)`);
    console.log('');

    // Save to history and clear staged
    this.state.changeHistory.push([...this.state.stagedChanges]);
    this.state.stagedChanges = [];
    
    // Update session state
    this.state.session.messages = messages;
    this.state.session.messageCount = messages.length;
    this.state.session.tokenCount = newTokens;

    // Close the editor
    if (this.rl) {
      this.rl.close();
    }
  }

  /**
   * Find a sequence of messages in an array
   */
  private findMessageSequence(messages: Message[], sequence: Message[]): number {
    if (sequence.length === 0) return -1;

    for (let i = 0; i <= messages.length - sequence.length; i++) {
      let match = true;
      for (let j = 0; j < sequence.length; j++) {
        if (messages[i + j] !== sequence[j]) {
          match = false;
          break;
        }
      }
      if (match) return i;
    }

    return -1;
  }

  /**
   * Undo the last staged change
   */
  private undoLastChange(): void {
    if (!this.state || this.state.stagedChanges.length === 0) {
      console.log('\nNo staged changes to undo.\n');
      return;
    }

    const removed = this.state.stagedChanges.pop()!;
    console.log(`\n✓ Undid: ${removed.description}\n`);
  }

  /**
   * Undo all staged changes
   */
  private undoAllChanges(): void {
    if (!this.state || this.state.stagedChanges.length === 0) {
      console.log('\nNo staged changes to undo.\n');
      return;
    }

    const count = this.state.stagedChanges.length;
    this.state.stagedChanges = [];
    console.log(`\n✓ Undid all ${count} staged change(s).\n`);
  }

  /**
   * Show before/after preview
   */
  private showPreview(): void {
    if (!this.state) return;

    console.log('\n' + '═'.repeat(70));
    console.log('Preview');
    console.log('═'.repeat(70));
    
    if (this.state.stagedChanges.length === 0) {
      console.log('No staged changes.\n');
      return;
    }

    for (const change of this.state.stagedChanges) {
      console.log(`\n${change.description}`);
      console.log('─'.repeat(70));
      console.log(`Before: ${change.original.length} messages`);
      console.log(`After:  ${change.modified.length} messages`);
      console.log(`Delta:  ${change.tokenDelta > 0 ? '+' : ''}${change.tokenDelta} tokens`);
    }

    console.log('\n' + '═'.repeat(70));
    console.log('');
  }

  /**
   * Estimate tokens for messages
   */
  private estimateTokens(messages: Message[]): number {
    const totalChars = messages.reduce((sum, msg) => {
      const content = typeof msg.content === 'string'
        ? msg.content
        : JSON.stringify(msg.content);
      return sum + content.length;
    }, 0);
    return Math.ceil(totalChars / 4);
  }
}

/**
 * Main entry point for the editor
 */
export async function runEditor(
  sessionId: string,
  model: 'sonnet' | 'opus' | 'haiku'
): Promise<void> {
  const editor = new SessionEditor(model);
  
  try {
    await editor.loadSession(sessionId);
    await editor.startInteractive();
  } catch (err) {
    console.error(`\n❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}\n`);
    process.exit(1);
  }
}
