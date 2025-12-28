const getLocalMemberId = () => {
  return localStorage.getItem('memberId') || '';
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`API Error ${response.status}:`, errorData); // 에러 내용 콘솔 출력
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
}

export const startEditSession = (postId: number) => {
  const memberId = getLocalMemberId();
  return fetchAPI(`/api/edits/start?memberId=${memberId}&postId=${postId}`, { 
    method: 'POST',
    body: JSON.stringify({ 
        memberId: Number(memberId), 
        postId: Number(postId) 
    }) 
  });
};

export const startChatSession = () => {
  const memberId = getLocalMemberId();
  return fetchAPI(`/api/chat/sessions/start?memberId=${memberId}`, { 
    method: 'POST',
    body: JSON.stringify({ 
        memberId: Number(memberId) 
    }) 
  });
};

export const sendChatEdit = (chatSessionId: number, editSessionId: number, userText: string) => {
  // 만약 쿼리스트링(URL?)이 400이라면 JSON Body로 시도
  return fetchAPI(`/api/chat/send-edit`, {
    method: 'POST',
    body: JSON.stringify({
      chatSessionId,
      editSessionId,
      userText
    })
  });
};

export const undoEdit = (editSessionId: number) => {
  const memberId = getLocalMemberId();
  return fetchAPI(`/api/edits/${editSessionId}/undo?memberId=${memberId}`, { 
    method: 'POST',
    body: JSON.stringify({ memberId: Number(memberId) }) 
  });
};

export const redoEdit = (editSessionId: number) => {
  const memberId = getLocalMemberId();
  return fetchAPI(`/api/edits/${editSessionId}/redo?memberId=${memberId}`, { 
    method: 'POST',
    body: JSON.stringify({ memberId: Number(memberId) }) 
  });
};

export const finalizeEdit = (editSessionId: number) => {
  const memberId = getLocalMemberId();
  return fetchAPI(`/api/edits/${editSessionId}/finalize?memberId=${memberId}`, { 
    method: 'POST',
    body: JSON.stringify({ memberId: Number(memberId) }) 
  });
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