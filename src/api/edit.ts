const getLocalMemberId = () => {
  return localStorage.getItem('memberId') || '';
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');
  
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`API Error ${response.status}:`, errorData);
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export const sendChatEdit = (chatSessionId: number, editSessionId: number, userText: string) => {
  const params = new URLSearchParams({
    chatSessionId: String(chatSessionId),
    editSessionId: String(editSessionId),
    userText: userText
  });

  return fetchAPI(`/api/chat/send-edit?${params.toString()}`, {
    method: 'POST',
  });
};

export const startEditSession = (postId: number) => {
  const memberId = getLocalMemberId();
  return fetchAPI(`/api/edits/start?memberId=${memberId}&postId=${postId}`, { method: 'POST' });
};

export const startChatSession = () => {
  const memberId = getLocalMemberId();
  return fetchAPI(`/api/chat/sessions/start?memberId=${memberId}`, { method: 'POST' });
};

export const undoEdit = (editSessionId: number) => {
  const memberId = getLocalMemberId();
  return fetchAPI(`/api/edits/${editSessionId}/undo?memberId=${memberId}`, { method: 'POST' });
};

export const redoEdit = (editSessionId: number) => {
  const memberId = getLocalMemberId();
  return fetchAPI(`/api/edits/${editSessionId}/redo?memberId=${memberId}`, { method: 'POST' });
};

export const finalizeEdit = async (editSessionId: number) => {
  const token = localStorage.getItem('accessToken');
  
  const res = await fetch(`${API_BASE_URL}/api/edits/${editSessionId}/finalize`, { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    
    body: JSON.stringify({}) 
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("서버 에러 상세:", errorText);
    throw new Error(`저장 실패: ${res.status} - ${errorText}`);
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return text; 
  }
};

export const uploadDirectEdit = async (editSessionId: number, file: File) => {
  const memberId = getLocalMemberId();
  const formData = new FormData();
  formData.append('file', file);
  
  return fetchAPI(`/api/edits/${editSessionId}/direct?memberId=${memberId}`, {
    method: 'POST',
    body: formData,
  });
};

export const deleteEditSession = (editSessionId: number) => {
  const memberId = getLocalMemberId();
  return fetchAPI(`/api/edits/${editSessionId}?memberId=${memberId}`, { method: 'DELETE' });
};