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

export interface Session {
  id: string;
  messages: Message[];
  metadata: SessionMetadata;
  messageCount: number;
  tokenCount: number;
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

// Task-based context management types (PRD v10.0)

export interface TaskDefinition {
  id: string;
  claudeMdPath: string;
  contextsDir: string;
  contexts: ContextSnapshot[];
  createdAt: string;
  lastUsed: string;
}

export interface ContextSnapshot {
  name: string;
  filePath: string;
  messageCount: number;
  tokenCount: number;
  createdAt: string;
  lastModified: string;
}

export interface SessionTaskMap {
  [sessionId: string]: {
    task_id: string;
    context_name?: string;
    created_at: string;
  };
}
