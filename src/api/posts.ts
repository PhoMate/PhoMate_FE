/// <reference types="vite/client" />

import type {
  PostListParams,
  PostFeedResponseDTO,
  PostDetailResponseDTO,
  PostCreateRequestDTO,
  LikesToggleResponseDTO,
} from '../types/post';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * 토큰 가져오기 (따옴표 제거 로직 포함)
 */
const getToken = () => {
  let token = localStorage.getItem('accessToken');
  if (token) {
    // JSON.stringify로 저장된 경우 따옴표가 붙을 수 있어 이를 제거합니다.
    if (token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
    }
  }
  return token;
};

/**
 * 인증 헤더 생성 헬퍼
 */
const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * 쿼리스트링 생성 헬퍼
 */
const qs = (params: Record<string, any>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

// --- API 함수 ---

/**
 * 1. 게시글 목록 조회
 */
export async function fetchPosts(params: PostListParams = {}): Promise<PostFeedResponseDTO> {
  const query = qs(params);
  const res = await fetch(`${API_BASE_URL}/api/posts${query ? `?${query}` : ''}`, { 
    headers: {
       'Content-Type': 'application/json',
       ...getAuthHeaders()
    } as HeadersInit
  });
  if (!res.ok) throw new Error('게시글 목록 조회 실패');
  return res.json();
}

/**
 * 2. 게시글 상세 조회
 * GET /api/posts/{postId}
 */
export async function fetchPostDetail(postId: number): Promise<PostDetailResponseDTO> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, { 
    headers: {
       'Content-Type': 'application/json',
       ...getAuthHeaders()
    } as HeadersInit
  });
  if (!res.ok) throw new Error('게시글 상세 조회 실패');
  return res.json();
}

/**
 * 3. 게시글 등록 (Multipart/form-data)
 * POST /api/posts
 */
export async function createPost(payload: PostCreateRequestDTO, imageFile: File): Promise<{ postId: number }> {
  const token = getToken();
  if (!token) throw new Error("401_NO_TOKEN");

  const formData = new FormData();
  
  formData.append('title', payload.title);
  formData.append('description', payload.description || '');
  formData.append('image', imageFile);

  console.log("🚀 게시글 등록 요청 전송 중...");

  const res = await fetch(`${API_BASE_URL}/api/posts`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders() 
    } as HeadersInit,
    body: formData,
  });
  
  if (!res.ok) {
    if (res.status === 401) throw new Error("401");
    const errorText = await res.text();
    throw new Error(`게시글 등록 실패: ${res.status} - ${errorText}`);
  }

  const text = await res.text();
  if (!text) {
    console.log("✅ 서버 응답이 비어있으나 성공으로 간주합니다.");
    return { postId: 0 }; // 혹은 { postId: 0 } 등 기본값
  }

  return res.json();
}

export async function updatePost(postId: number, payload: PostCreateRequestDTO, imageFile?: File): Promise<void> {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('description', payload.description || '');
  if (imageFile) formData.append('image', imageFile);

  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: 'PATCH',
    headers: { ...getAuthHeaders() } as HeadersInit,
    body: formData,
  });
  if (!res.ok) throw new Error('게시글 수정 실패');
}

export async function deletePost(postId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() } as HeadersInit,
  });
  if (!res.ok) throw new Error('게시글 삭제 실패');
}

export async function togglePostLike(postId: number): Promise<LikesToggleResponseDTO> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() } as HeadersInit
  });
  if (!res.ok) throw new Error('게시글 좋아요 토글 실패');
  return res.json();
}

export async function getMemberPhotos(memberId: string): Promise<PostFeedResponseDTO> {
  return fetchPosts({ memberId } as any);
}
