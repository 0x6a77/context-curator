export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | any;  // Can be string or structured content
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface SessionMetadata {
  createdAt: string;
  updatedAt: string;
  projectPath?: string;
}

export interface SessionList {
  named: string[];
  unnamed: string[];
}

export interface Session {
  id: string;
  messages: Message[];
  metadata: SessionMetadata;
  messageCount: number;
  tokenCount: number;
  isNamed: boolean;  // Distinguish between named and unnamed sessions
  directory: string;  // Which directory this session belongs to
}

export interface Task {
  startIndex: number;
  endIndex: number;
  firstPrompt: string;
  messageCount: number;
  tokenCount: number;
  status: 'completed' | 'in-progress' | 'failed';
}

export interface SessionChange {
  type: 'remove' | 'summarize' | 'edit';
  description: string;
  original: Message[];
  modified: Message[];
  tokenDelta: number;
}
