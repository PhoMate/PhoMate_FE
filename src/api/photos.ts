import { FeedResponse, EditPayload } from '../types';
import * as apiClient from './apiClient';

// 메인 피드 (전체 공개 글)
export async function fetchFeedPhotos(cursor?: string, pageSize: number = 12): Promise<FeedResponse> {
  // memberId(viewerId)는 apiClient 내부에서 토큰이 있으면 헤더로 보내거나, 
  // 명세대로 쿼리 파라미터가 필요하다면 아래처럼 추가해야 합니다.
  const memberId = localStorage.getItem('memberId');
  const params = new URLSearchParams();
  
  params.set('size', String(pageSize));
  params.set('sort', 'LATEST');
  if (memberId) params.set('memberId', memberId); // 명세: 로그인 유저 ID
  if (cursor) {
      // cursor가 복잡한 객체라면 분해해서 넣어야 함 (단순 string이면 그대로)
      // 여기선 cursor 문자열을 그대로 보낸다고 가정하거나, 
      // 실제로는 cursorTime, cursorId 등을 받아와야 할 수도 있음.
  }

  return await apiClient.get(`/api/posts?${params.toString()}`);
}

// 🔥 [핵심 수정] 특정 유저가 작성한 게시글 목록 (내 글 & 친구 글 공용)
// GET /api/posts/author/{authorId}?size=12&viewerId={viewerId}
export async function getMemberPhotos(authorId: string) {
  const viewerId = localStorage.getItem('memberId'); // 보는 사람 ID (나)
  const params = new URLSearchParams();
  
  params.set('size', '20'); // 가져올 개수
  if (viewerId) params.set('viewerId', viewerId); // 좋아요 여부 판별용

  const queryString = params.toString();
  return apiClient.get(`/api/posts/author/${authorId}?${queryString}`);
}

// 멤버 프로필 정보
export async function getMemberProfile(memberId: string) {
  return apiClient.get(`/api/members/${memberId}`);
}

// ... 나머지 함수들 (좋아요, 생성, 수정, 삭제 등) 그대로 유지 ...
export async function togglePhotoLike(memberId: string, photoId: string) {
  return apiClient.post(`/api/members/${memberId}/photos/${photoId}/likes`);
}
export async function editPhoto(memberId: string, photoId: string, payload: EditPayload) {
  return apiClient.patch(`/api/members/${memberId}/photos/${photoId}/edit`, payload);
}
export async function createPost(memberId: string, data: any) {
  return apiClient.post(`/api/posts?memberId=${encodeURIComponent(memberId)}`, data);
}
export async function updatePost(memberId: string, postId: string, data: any) {
  return apiClient.patch(`/api/posts/${postId}?memberId=${encodeURIComponent(memberId)}`, data);
}
export async function deletePost(memberId: string, postId: string) {
  return apiClient.delete_(`/api/posts/${postId}?memberId=${encodeURIComponent(memberId)}`);
}
export async function savePhoto(memberId: string, payload: any) {
  return apiClient.post(`/api/members/${memberId}/photos`, payload);
}