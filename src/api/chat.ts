import { StartSessionRequest, StartSessionResponse, StreamSearchRequest, ChatEvent } from '../types/chat';
import * as apiClient from './apiClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * 첫 채팅: 세션 생성
 * POST /api/chat/sessions/start
 */
export async function startChatSession(payload: StartSessionRequest): Promise<StartSessionResponse> {
  return apiClient.post('/api/chat/sessions/start', payload);
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
  const token = localStorage.getItem('accessToken') || '';
  const controller = new AbortController();

  fetch(`${API_BASE}/api/chat/search/stream`, {
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
          if (!line.trim()) continue;
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          try {
            const evt: ChatEvent = JSON.parse(json);
            if (evt.type === 'delta') handlers.onDelta?.(evt.data);
            else if (evt.type === 'result') handlers.onResult?.(evt.data);
            else if (evt.type === 'error') handlers.onError?.(evt.data);
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