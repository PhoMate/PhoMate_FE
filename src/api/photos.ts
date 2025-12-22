import { FeedResponse, EditPayload } from '../types';
import { getMockFeedData } from './mockData';
import * as apiClient from './apiClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function fetchFeedPhotos(cursor?: string, pageSize: number = 12): Promise<FeedResponse> {
  try {
    // 공개 API이므로 publicGet 사용 (토큰 불필요)
    return await apiClient.publicGet(
      `/api/photos?pageSize=${pageSize}${cursor ? `&cursor=${cursor}` : ''}`
    );
  } catch {
    // 백엔드 준비 전 mock 데이터 반환
    return getMockFeedData(cursor, pageSize);
  }
}

// 사진 상세 (공개)
export async function getPostDetail(postId: string) {
  return apiClient.publicGet(`/api/posts/${postId}`);
}

// 유저 사진 검색 (공개)
export async function getMemberPhotos(memberId: string, q?: string) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  return apiClient.publicGet(`/api/members/${memberId}/photos${params.toString() ? `?${params}` : ''}`);
}

// 좋아요 토글 (토큰 필요)
export async function togglePhotoLike(memberId: string, photoId: string) {
  return apiClient.post(
    `/api/members/${memberId}/photos/${photoId}/likes`
  );
}

// 사진 편집 저장 (토큰 필요)
export async function editPhoto(memberId: string, photoId: string, payload: EditPayload) {
  return apiClient.patch(
    `/api/members/${memberId}/photos/${photoId}/edit`,
    payload
  );
}

// 게시글 생성 (토큰 필요)
export async function createPost(memberId: string, data: any) {
  return apiClient.post(
    `/api/posts?memberId=${encodeURIComponent(memberId)}`,
    data
  );
}

// 게시글 수정 (토큰 필요)
export async function updatePost(memberId: string, postId: string, data: any) {
  return apiClient.patch(
    `/api/posts/${postId}?memberId=${encodeURIComponent(memberId)}`,
    data
  );
}

// 게시글 삭제 (토큰 필요)
export async function deletePost(memberId: string, postId: string) {
  return apiClient.delete_(`/api/posts/${postId}?memberId=${encodeURIComponent(memberId)}`);
}

// 사진 저장 (토큰 필요)
export async function savePhoto(
  memberId: string,
  payload: { originalUrl: string; thumbnailUrl?: string; title?: string }
) {
  return apiClient.post(
    `/api/members/${memberId}/photos`,
    payload
  );
}