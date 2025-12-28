import {
  StartSessionResponse,
  ChatSearchStreamRequest,
  ChatStreamRequest,
  ChatSendResponse,
} from "../types/chat";
import * as apiClient from "./apiClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * 첫 채팅: 세션 생성
 */
export async function startChatSession(): Promise<StartSessionResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat/sessions/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  return data;
}

/**
 * SSE field parser (공백 보존 버전)
 */
function parseField(line: string, key: "event" | "data"): string | null {
  const prefix = key + ":";
  if (!line.startsWith(prefix)) return null;

  let value = line.slice(prefix.length);
  if (key === "event") {
    if (value.startsWith(" ")) value = value.slice(1);
  }
  return value;
}

/**
 * buffer에서 SSE message들을 추출
 */
function drainSSEBuffer(
  buffer: string
): { messages: Array<{ event: string; data: string }>; rest: string } {
  // \r\n과 \n 모두 대응하기 위해 split 정규식 사용 고려 가능하나 유지보수 위해 단순화
  const normalized = buffer.replace(/\r/g, "");
  const parts = normalized.split("\n\n");
  const rest = parts.pop() ?? "";

  const messages: Array<{ event: string; data: string }> = [];

  for (const part of parts) {
    if (!part) continue;

    const lines = part.split("\n");
    let event = "";
    const dataLines: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.endsWith("\n") ? rawLine.slice(0, -1) : rawLine;
      const ev = parseField(line, "event");
      if (ev !== null) {
        event = ev;
        continue;
      }
      const da = parseField(line, "data");
      if (da !== null) {
        dataLines.push(da);
      }
    }

    const data = dataLines.join("\n");
    if (event || dataLines.length > 0) messages.push({ event, data });
  }

  return { messages, rest };
}

function handleSSEEvent(
  event: string,
  data: string,
  handlers: {
    onDelta?: (delta: string) => void;
    onResult?: (result: any) => void;
    onError?: (error: string) => void;
    onComplete?: () => void;
  }
) {
  try {
    if (event === "results") {
      const parsed = JSON.parse(data);
      handlers.onResult?.(parsed);
      return;
    }
    if (event === "delta") {
      handlers.onDelta?.(data);
      return;
    }
    if (event === "done") {
      handlers.onComplete?.();
      return;
    }
    if (event === "error") {
      handlers.onError?.(data);
      return;
    }
    if (!event && data) {
      handlers.onDelta?.(data);
    }
  } catch (e) {
    console.error(`[SSE Parse Error] event=${event}:`, e);
  }
}

export function streamChatSearch(
  payload: ChatSearchStreamRequest,
  handlers: {
    onDelta?: (delta: string) => void;
    onResult?: (result: any) => void;
    onError?: (error: string) => void;
    onComplete?: () => void;
  }
): () => void {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    handlers.onError?.("인증 토큰이 없습니다.");
    return () => {};
  }

  const controller = new AbortController();
  const maxRetries = 1; 
  let retryTimer: number | null = null;
  let finished = false;
  let requestSeq = 0;

  const openStream = async (attempt: number) => {
    const mySeq = ++requestSeq;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let receivedDone = false;
    let receivedAny = false; 

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/search/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        credentials: "include",
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      if (!res.body) throw new Error("No response body");

      reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        if (controller.signal.aborted || finished || mySeq !== requestSeq) {
          try { await reader.cancel(); } catch {}
          return;
        }

        const { done, value } = await reader.read();
        
        if (done) {
          // ✅ [추가] 마지막 남은 바이트 배출 처리
          const finalChunk = decoder.decode(); 
          if (finalChunk) {
            buffer += finalChunk;
            const { messages } = drainSSEBuffer(buffer);
            for (const msg of messages) {
              if (msg.event === "done") receivedDone = true;
              if (msg.event === "results" || msg.event === "delta") receivedAny = true;
              handleSSEEvent(msg.event, msg.data, handlers);
            }
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const { messages, rest } = drainSSEBuffer(buffer);
        buffer = rest;

        for (const msg of messages) {
          if (msg.event === "done") receivedDone = true;
          if (msg.event === "results" || msg.event === "delta") receivedAny = true;
          handleSSEEvent(msg.event, msg.data, handlers);
        }
      }

      if (!finished) {
        finished = true;
        handlers.onComplete?.();
      }
    } catch (err: any) {
      if (finished || mySeq !== requestSeq) return;

      if (reader) {
        try { await reader.cancel(); } catch {}
      }

      if (err?.name === "AbortError" || controller.signal.aborted) return;

      const msg = String(err?.message || err);
      const isProtocolErr =
        msg.includes("ERR_HTTP2_PROTOCOL_ERROR") ||
        msg.toLowerCase().includes("network error") ||
        msg.toLowerCase().includes("failed to fetch");

      // ✅ [방어] 데이터가 일부라도 왔다면 에러가 나도 완료로 간주 (끝자락 프로토콜 에러 대응)
      if (receivedDone || receivedAny) {
        finished = true;
        handlers.onComplete?.();
        return;
      }

      if (isProtocolErr && attempt < maxRetries) {
        retryTimer = window.setTimeout(() => {
          retryTimer = null;
          openStream(attempt + 1);
        }, 400);
        return;
      }

      finished = true;
      handlers.onError?.(msg);
    }
  };

  openStream(0);

  return () => {
    if (retryTimer != null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    finished = true;
    controller.abort();
  };
}

export async function sendChatEdit(payload: {
  chatSessionId: number;
  editSessionId: number;
  userText: string;
}): Promise<ChatSendResponse> {
  return apiClient.post("/api/chat/send-edit", payload);
}

export function streamChatTest(
  payload: ChatStreamRequest & { memberId: number },
  handlers: {
    onDelta?: (delta: string) => void;
    onError?: (error: string) => void;
    onComplete?: () => void;
  }
): () => void {
  const token = localStorage.getItem("accessToken") || "";
  const controller = new AbortController();

  fetch(`${API_BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) throw new Error("No readable stream");

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          const final = decoder.decode();
          if (final) buffer += final;
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const { messages, rest } = drainSSEBuffer(buffer);
        buffer = rest;

        for (const msg of messages) {
          if (msg.event === "done") handlers.onComplete?.();
          else if (msg.event === "error") handlers.onError?.(msg.data);
          else handlers.onDelta?.(msg.data);
        }
      }
      handlers.onComplete?.();
    })
    .catch((e) => {
      if (e.name !== "AbortError") handlers.onError?.(String(e.message || e));
    });

  return () => controller.abort();
}