import * as apiClient from './apiClient';

interface MemberInfo {
  memberId: number;
  nickname: string;
  profileImageUrl: string;
}

export async function getMyInfo(): Promise<MemberInfo> {
  return apiClient.get<MemberInfo>('/api/members/me');
}

export async function getMemberInfo(memberId: number): Promise<MemberInfo> {
  return apiClient.get<MemberInfo>(`/api/members/${memberId}`);
}