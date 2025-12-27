import { StartSessionRequest, StartSessionResponse, StreamSearchRequest, ChatEvent } from '../types/chat';
import * as apiClient from './apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * 첫 채팅: 세션 생성
 * POST /api/chat/sessions/start
 */
export async function startChatSession(payload: { message: string }) {
  const res = await fetch(`${API_BASE_URL}/api/chat/sessions/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
  const data = await res.json();
  console.log('Session response:', data); // 실제 응답 확인
  return data; // { sessionId: number }
}

/**
 * 이후 채팅: 스트리밍
 * POST /api/chat/search/stream
 * delta/result 분리 처리
 */
export function streamChatSearch(
  payload: StreamSearchRequest,
  handlers: {
    onDelta?: (delta: string) => void;
    onResult?: (result: any) => void;
    onError?: (error: string) => void;
    onComplete?: () => void;
  }
): () => void {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    handlers.onError?.('인증 토큰이 없습니다.');
    return () => {};
  }

  const controller = new AbortController();

  fetch(`${API_BASE_URL}/api/chat/search/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(payload),
    signal: controller.signal,
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      return readStream(reader, handlers);
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        handlers.onError?.(err.message);
      }
    });

  return () => controller.abort();
}

// 채팅 메시지 편집 저장
export async function sendChatEdit(payload: {
  chatSessionId: number;
  editSessionId: number;
  userText: string;
}) {
  return apiClient.post('/api/chat/send-edit', payload);
}

/**
 * 테스트 스트리밍
 * POST /api/chat/stream
 * SSE로 delta 방식
 */
export function streamChatTest(
  payload: {
    memberId: number;
    chatSessionId: number;
    userText: string;
  },
  handlers: {
    onDelta?: (delta: string) => void;
    onError?: (error: string) => void;
    onComplete?: () => void;
  }
): () => void {
  const token = localStorage.getItem('accessToken') || '';
  const controller = new AbortController();

  fetch(`${API_BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No readable stream');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          try {
            const delta = line.slice(6).trim();
            handlers.onDelta?.(delta);
          } catch (e) {
            console.error('SSE parse error', e);
          }
        }
      }
      handlers.onComplete?.();
    })
    .catch((e) => {
      if (e.name !== 'AbortError') handlers.onError?.(String(e.message || e));
    });

  return () => controller.abort();
}

async function readStream(reader: ReadableStreamDefaultReader<Uint8Array>, handlers: { onDelta?: (delta: string) => void; onError?: (error: string) => void; onComplete?: () => void; }) {
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim() || !line.startsWith('data: ')) continue;
      try {
        const delta = line.slice(6).trim();
        handlers.onDelta?.(delta);
      } catch (e) {
        console.error('SSE parse error', e);
      }
    }
  }
  handlers.onComplete?.();
}