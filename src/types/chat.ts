export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface StartSessionResponse {
  chatSessionId: number;
}

export interface ChatSearchStreamRequest {
  chatSessionId: number;
  userText: string;
}

export interface ChatStreamRequest {
  memberId: number;
  chatSessionId: number;
  userText: string;
}

export interface ChatSendResponse {
  chatSessionId: number;
  userMessageId: number;
  assistantMessageId: number;
  assistantContent: string;
  editedUrl: string;
}

export type ChatEventType = 'delta' | 'result' | 'error';

export interface ChatEvent {
  type: ChatEventType;
  data: any;
}