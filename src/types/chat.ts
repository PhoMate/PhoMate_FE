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

export interface StartSessionRequest {
  message: string;
}

export interface StartSessionResponse {
  sessionId: string;
  message: string; // 첫 응답
}

export interface StreamSearchRequest {
  sessionId: string;
  query: string;
}

export type ChatEventType = 'delta' | 'result' | 'error';

export interface ChatEvent {
  type: ChatEventType;
  data: any;
}