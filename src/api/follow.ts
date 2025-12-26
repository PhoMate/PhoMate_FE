import { get, post } from './apiClient';

export interface FollowToggleResponse {
  followed: boolean;
}

export interface FollowMember {
  memberId: number;
  nickname: string;
  profileImageUrl: string;
}

export const toggleFollow = async (followeeId: number): Promise<FollowToggleResponse> => {
  return post<FollowToggleResponse>(`/api/follows/toggle?followeeId=${followeeId}`);
};

export const getMyFollowList = async (): Promise<FollowMember[]> => {
  return get<FollowMember[]>('/api/follows/me');
};