import { FeedResponse, EditPayload } from '../types';
import * as apiClient from './apiClient';

export async function fetchFeedPhotos(cursor?: string, pageSize: number = 12): Promise<FeedResponse> {
  const memberId = localStorage.getItem('memberId');
  const params = new URLSearchParams();
  
  params.set('size', String(pageSize));
  params.set('sort', 'LATEST');
  if (memberId) params.set('memberId', memberId); 
  if (cursor) {
  }
  return await apiClient.get(`/api/posts?${params.toString()}`);
}

export async function getMemberPhotos(authorId: string) {
  const viewerId = localStorage.getItem('memberId'); 
  const params = new URLSearchParams();
  
  params.set('size', '20'); 
  if (viewerId) params.set('viewerId', viewerId); 

  const queryString = params.toString();
  return apiClient.get(`/api/posts/author/${authorId}?${queryString}`);
}

export async function getMemberProfile(memberId: string) {
  return apiClient.get(`/api/members/${memberId}`);
}

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