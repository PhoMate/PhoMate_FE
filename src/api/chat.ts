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
  console.log('Session response:', data); // 실제 응답 확인
  return data; // { sessionId: number }
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

  (async () => {
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
        keepalive: false,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      if (!res.body) {
        throw new Error('No response body');
      }

      reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let hasData = false;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream completed normally');
          break;
        }

        hasData = true;
        const chunk = decoder.decode(value, { stream: true });
        console.log('Raw chunk:', JSON.stringify(chunk)); // 디버깅: 실제 받은 데이터 확인
        
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          console.log('Processing line:', JSON.stringify(trimmed)); // 디버깅

          if (trimmed.startsWith('data: ')) {
            const content = trimmed.slice(6).trim();
            
            if (content === '[DONE]') {
              console.log('Received [DONE] signal');
              handlers.onComplete?.();
              return;
            }

            // JSON 형태인지 확인
            if (content.startsWith('{') || content.startsWith('[')) {
              try {
                const parsed = JSON.parse(content);
                
                // 검색 결과 객체 처리
                if (parsed.postId || parsed.results) {
                  handlers.onResult?.(parsed);
                }
                // delta 필드가 있으면 텍스트로 처리
                else if (parsed.delta !== undefined) {
                  handlers.onDelta?.(parsed.delta);
                }
                // 기타 JSON은 그냥 onResult로
                else {
                  handlers.onResult?.(parsed);
                }
              } catch (parseError) {
                console.warn('JSON parse failed:', content);
                handlers.onDelta?.(content);
              }
            } else {
              // 일반 텍스트는 delta로 전달
              handlers.onDelta?.(content);
            }
          }
        }
      }
      
      if (hasData) {
        handlers.onComplete?.();
      } else {
        handlers.onError?.('서버로부터 응답을 받지 못했습니다.');
      }
      
    } catch (err: any) {
      if (reader) {
        try {
          await reader.cancel();
        } catch (e) {
          console.error('Reader cancel error:', e);
        }
      }

      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
        return;
      }

      console.error('Stream error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      handlers.onError?.(err.message || 'network error');
    }
  })();

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
  payload: ChatStreamRequest & { memberId: number },
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