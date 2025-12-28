// src/api/edit.ts

// 헬퍼 함수: 로컬스토리지에서 ID 가져오기
const getLocalMemberId = () => {
  return localStorage.getItem('memberId') || '';
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 공통 fetch 함수
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');
  const headers = {
    // 파일 업로드(FormData)가 아닐 때만 JSON 헤더 추가
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

// 1. 편집 세션 시작
// 🔥 [수정] 400 에러 해결: Body에도 memberId, postId를 같이 보냄
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

// 9. 채팅 세션 생성
// 🔥 [수정] Body에도 memberId 포함
export const startChatSession = () => {
  const memberId = getLocalMemberId();
  return fetchAPI(`/api/chat/sessions/start?memberId=${memberId}`, { 
    method: 'POST',
    body: JSON.stringify({ 
        memberId: Number(memberId) 
    }) 
  });
};

// 10. 수정 챗봇 메시지 전송
export const sendChatEdit = (chatSessionId: number, editSessionId: number, userText: string) => {
  const memberId = getLocalMemberId();
  return fetchAPI('/api/chat/send-edit', {
    method: 'POST',
    body: JSON.stringify({
      memberId: Number(memberId),
      chatSessionId: Number(chatSessionId),
      editSessionId: Number(editSessionId),
      userText: userText
    }),
  });
};

// 5. Undo
// 🔥 [수정] Body에도 memberId 포함
export const undoEdit = (editSessionId: number) => {
  const memberId = getLocalMemberId();
  return fetchAPI(`/api/edits/${editSessionId}/undo?memberId=${memberId}`, { 
    method: 'POST',
    body: JSON.stringify({ memberId: Number(memberId) }) 
  });
};

// 6. Redo
// 🔥 [수정] Body에도 memberId 포함
export const redoEdit = (editSessionId: number) => {
  const memberId = getLocalMemberId();
  return fetchAPI(`/api/edits/${editSessionId}/redo?memberId=${memberId}`, { 
    method: 'POST',
    body: JSON.stringify({ memberId: Number(memberId) }) 
  });
};

// 7. 최종 저장
// 🔥 [수정] Body에도 memberId 포함
export const finalizeEdit = (editSessionId: number) => {
  const memberId = getLocalMemberId();
  return fetchAPI(`/api/edits/${editSessionId}/finalize?memberId=${memberId}`, { 
    method: 'POST',
    body: JSON.stringify({ memberId: Number(memberId) }) 
  });
};

// 4. 직접 편집 업로드
export const uploadDirectEdit = async (editSessionId: number, file: File) => {
  const memberId = getLocalMemberId();
  const formData = new FormData();
  formData.append('file', file);
  
  return fetchAPI(`/api/edits/${editSessionId}/direct?memberId=${memberId}`, {
    method: 'POST',
    body: formData,
  });
};

// 8. 편집 취소
export const deleteEditSession = (editSessionId: number) => {
  const memberId = getLocalMemberId();
  return fetchAPI(`/api/edits/${editSessionId}?memberId=${memberId}`, { method: 'DELETE' });
};