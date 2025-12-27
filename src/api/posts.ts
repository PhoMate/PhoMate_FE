/// <reference types="vite/client" />

import { PostListParams, PostListResponse, PostDetail, AuthorPostListParams, UpsertPostPayload } from '../types/post';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 공통: 쿼리스트링 생성
const qs = (params: Record<string, any>) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

export async function fetchPosts(params: PostListParams = {}): Promise<PostListResponse> {
  const query = qs(params);
  const res = await fetch(`${API_BASE_URL}/api/posts${query ? `?${query}` : ''}`, { credentials: 'include' });
  if (!res.ok) throw new Error('게시글 목록 조회 실패');
  return res.json();
}

export async function fetchPostsByAuthor(params: AuthorPostListParams): Promise<PostListResponse> {
  const { authorId, ...rest } = params;
  const query = qs(rest);
  const res = await fetch(`${API_BASE_URL}/api/posts/author/${authorId}${query ? `?${query}` : ''}`, { credentials: 'include' });
  if (!res.ok) throw new Error('작성자 게시글 조회 실패');
  return res.json();
}

export async function fetchPostDetail(postId: number): Promise<PostDetail> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, { credentials: 'include' });
  if (!res.ok) throw new Error('게시글 상세 조회 실패');
  return res.json();
}

export async function createPost(payload: UpsertPostPayload, imageFile: File): Promise<{ postId: number }> {
  const form = new FormData();
  form.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  form.append('image', imageFile);

  const res = await fetch(`${API_BASE_URL}/api/posts`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('게시글 등록 실패');
  return res.json();
}

export async function updatePost(postId: number, payload: UpsertPostPayload, imageFile?: File): Promise<void> {
  const form = new FormData();
  form.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  if (imageFile) form.append('image', imageFile);

  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: 'PATCH',
    body: form,
    credentials: 'include',
  });
  if (!res.ok) throw new Error('게시글 수정 실패');
}

export async function deletePost(postId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('게시글 삭제 실패');
}