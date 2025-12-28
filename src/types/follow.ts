export interface FollowToggleResponseDTO {
  followed: boolean;
}

export interface MemberResponseDTO {
  memberId: number;
  nickname: string;
  profileImageUrl: string;
}

export interface FolloweeResponseDTO {
  memberId: number;
  nickname: string;
  profileImageUrl: string;
}
