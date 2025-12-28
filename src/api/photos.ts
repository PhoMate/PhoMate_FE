import { FeedResponse, EditPayload } from '../types';
import * as apiClient from './apiClient';

export async function fetchFeedPhotos(cursor?: string, pageSize: number = 12): Promise<FeedResponse> {
  const queryString = cursor 
    ? `?pageSize=${pageSize}&cursor=${cursor}` 
    : `?pageSize=${pageSize}`;
  return await apiClient.publicGet(`/api/photos${queryString}`);
}

export async function getPostDetail(postId: string) {
  return apiClient.publicGet(`/api/posts/${postId}`);
}

export async function getMemberPhotos(memberId: string, q?: string) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return apiClient.publicGet(`/api/members/${memberId}/photos${queryString}`);
}

export async function togglePhotoLike(memberId: string, photoId: string) {
  return apiClient.post(
    `/api/members/${memberId}/photos/${photoId}/likes`
  );
}

export async function editPhoto(memberId: string, photoId: string, payload: EditPayload) {
  return apiClient.patch(
    `/api/members/${memberId}/photos/${photoId}/edit`,
    payload
  );
}

export async function createPost(memberId: string, data: any) {
  return apiClient.post(
    `/api/posts?memberId=${encodeURIComponent(memberId)}`,
    data
  );
}

export async function updatePost(memberId: string, postId: string, data: any) {
  return apiClient.patch(
    `/api/posts/${postId}?memberId=${encodeURIComponent(memberId)}`,
    data
  );
}

export async function deletePost(memberId: string, postId: string) {
  return apiClient.delete_(
    `/api/posts/${postId}?memberId=${encodeURIComponent(memberId)}`
  );
}

export async function savePhoto(
  memberId: string,
  payload: { originalUrl: string; thumbnailUrl?: string; title?: string }
) {
  return apiClient.post(
    `/api/members/${memberId}/photos`,
    payload
  );
}