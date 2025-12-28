export interface GoogleLoginRequestDTO {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}

export interface GoogleLoginResponseDTO {
  memberId: number;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshRequestDTO {
  refreshToken: string;
}
