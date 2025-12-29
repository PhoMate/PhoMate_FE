/// <reference types="vite/client" />

import type {
  PostListParams,
  PostFeedResponseDTO,
  PostDetailResponseDTO,
  PostCreateRequestDTO,
  LikesToggleResponseDTO,
} from '../types/post';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getToken = () => {
  let token = localStorage.getItem('accessToken');
  if (token) {
    if (token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
    }
  }
  return token;
};

const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const qs = (params: Record<string, any>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

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
    return { postId: 0 };
  }

  return JSON.parse(text);
}

export async function updatePost(postId: number, payload: PostCreateRequestDTO, imageFile?: File): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("401_NO_TOKEN");

  const formData = new FormData();
  
  formData.append('title', payload.title);
  formData.append('description', payload.description || '');
  
  if (imageFile) {
    formData.append('image', imageFile);
  }

  console.log(`🚀 게시글 ${postId} 수정 요청 전송 중...`);

  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: 'PATCH',
    headers: { 
      ...getAuthHeaders() 
    } as HeadersInit,
    body: formData,
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("401");
    const errorText = await res.text();
    throw new Error(`게시글 수정 실패: ${res.status} - ${errorText}`);
  }
}

export async function deletePost(postId: number): Promise<void> {
  let token = localStorage.getItem('accessToken');
  if (token) token = token.replace(/"/g, ''); 

  if (!token) throw new Error("401_NO_TOKEN");

  console.log(`🚀 게시글 ${postId} 삭제 요청 중...`);

  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: 'DELETE',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    } as HeadersInit,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`❌ 서버 내부 에러 (500):`, errorText);
    
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.message || `서버 에러: ${res.status}`);
    } catch (e) {
      throw new Error(`서버 응답 오류: ${res.status}`);
    }
  }
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