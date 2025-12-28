import { StartSessionResponse, ChatSearchStreamRequest, ChatStreamRequest, ChatSendResponse } from '../types/chat';
import * as apiClient from './apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * 첫 채팅: 세션 생성
 * POST /api/chat/sessions/start
 */
export async function startChatSession(): Promise<StartSessionResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat/sessions/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
  const data = await res.json();
  console.log('Session response:', data);
  return data;
}

/**
 * 이후 채팅: 스트리밍
 * POST /api/chat/search/stream
 * delta/result 분리 처리
 */
export function streamChatSearch(
  payload: ChatSearchStreamRequest,
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

  const maxRetries = 2;

  const openStream = async (attempt: number) => {
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/search/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      if (!res.body) throw new Error('No response body');

      reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let hasData = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        hasData = true;
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const raw of lines) {
          const line = raw.trim();
          if (!line) continue;

          if (line.startsWith('data: ')) {
            const content = line.slice(6).trim();

            if (content === '[DONE]') {
              handlers.onComplete?.();
              return;
            }

            if (content.startsWith('{') || content.startsWith('[')) {
              try {
                const parsed = JSON.parse(content);
                if (parsed.postId || parsed.results) {
                  handlers.onResult?.(parsed);
                } else if (parsed.delta !== undefined) {
                  handlers.onDelta?.(parsed.delta);
                } else {
                  handlers.onResult?.(parsed);
                }
              } catch {
                handlers.onDelta?.(content);
              }
            } else {
              handlers.onDelta?.(content);
            }
          }
        }
      }

      if (hasData) handlers.onComplete?.();
      else handlers.onError?.('서버로부터 응답을 받지 못했습니다.');

    } catch (err: any) {
      if (reader) {
        try { await reader.cancel(); } catch (e) { console.error('Reader cancel error:', e); }
      }

      if (err?.name === 'AbortError') {
        console.log('Stream aborted by user');
        return;
      }

      const msg = String(err?.message || err);
      const isProtocolErr = msg.includes('ERR_HTTP2_PROTOCOL_ERROR') || msg.toLowerCase().includes('network error');
      if (isProtocolErr && attempt < maxRetries) {
        handlers.onDelta?.('\n[연결 문제로 재시도 중...]');
        setTimeout(() => openStream(attempt + 1), 500);
        return;
      }

      console.error('Stream error details:', { name: err?.name, message: msg });
      handlers.onError?.(msg);
    }
  };

  openStream(0);

  return () => {
    console.log('Aborting stream');
    controller.abort();
  };
}

// 채팅 메시지 편집 저장
export async function sendChatEdit(payload: {
  chatSessionId: number;
  editSessionId: number;
  userText: string;
}): Promise<ChatSendResponse> {
  return apiClient.post('/api/chat/send-edit', payload);
}

/**
 * 테스트 스트리밍
 * POST /api/chat/stream
 * SSE로 delta 방식
 */
export function streamChatTest(
  payload: ChatStreamRequest,
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