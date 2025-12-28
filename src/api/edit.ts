import { getAccessToken } from './auth';
import type { EditVersionResponseDTO } from '../types/edit';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }
  
  return res.json();
}

export const startEditSession = (postId: number): Promise<EditVersionResponseDTO> => 
  fetchAPI(`/api/edits/start?postId=${postId}`, { method: 'POST' });

export const getCurrentEdit = (sessionId: number): Promise<EditVersionResponseDTO> => 
  fetchAPI(`/api/edits/${sessionId}/current`);

export const uploadDirectEdit = (sessionId: number, file: File): Promise<EditVersionResponseDTO> => {
  const formData = new FormData();
  formData.append('file', file);
  return fetchAPI(`/api/edits/${sessionId}/direct`, {
    method: 'POST',
    body: formData,
  });
};

export const undoEdit = (sessionId: number): Promise<EditVersionResponseDTO> => 
  fetchAPI(`/api/edits/${sessionId}/undo`, { method: 'POST' });

export const redoEdit = (sessionId: number): Promise<EditVersionResponseDTO> => 
  fetchAPI(`/api/edits/${sessionId}/redo`, { method: 'POST' });

export const finalizeEdit = (sessionId: number): Promise<EditVersionResponseDTO> => 
  fetchAPI(`/api/edits/${sessionId}/finalize`, { method: 'POST' });

export const deleteEditSession = (sessionId: number): Promise<void> => 
  fetchAPI(`/api/edits/${sessionId}`, { method: 'DELETE' });

export const startChatSession = () => 
  fetchAPI(`/api/chat/sessions/start`, { method: 'POST' });

export const sendChatEdit = (chatSessionId: number, editSessionId: number, userText: string) => 
  fetchAPI(`/api/chat/send-edit`, {
    method: 'POST',
    body: JSON.stringify({ chatSessionId, editSessionId, userText }),
  });