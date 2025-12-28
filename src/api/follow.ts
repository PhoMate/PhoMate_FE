import { get, post } from './apiClient';
import type { FollowToggleResponseDTO, FolloweeResponseDTO } from '../types/follow';

export const toggleFollow = async (followeeId: number): Promise<FollowToggleResponseDTO> => {
  return post<FollowToggleResponseDTO>(`/api/follows/toggle?followeeId=${followeeId}`);
};

export const getMyFollowList = async (): Promise<FolloweeResponseDTO[]> => {
  return get<FolloweeResponseDTO[]>('/api/follows/me');
};