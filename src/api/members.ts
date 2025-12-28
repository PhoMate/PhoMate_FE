import * as apiClient from './apiClient';

// 회원 정보 타입
interface MemberInfo {
  memberId: number;
  nickname: string;
  profileImageUrl: string;
}

/**
 * 내 정보 조회
 * GET /api/members/me
 */
export async function getMyInfo(): Promise<MemberInfo> {
  return apiClient.get<MemberInfo>('/api/members/me');
}

/**
 * 특정 회원 정보 조회
 * GET /api/members/{memberId}
 */
export async function getMemberInfo(memberId: number): Promise<MemberInfo> {
  // 인증된 요청으로 변경 (토큰 필요)
  return apiClient.get<MemberInfo>(`/api/members/${memberId}`);
}