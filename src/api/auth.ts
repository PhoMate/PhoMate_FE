import { GOOGLE_CONFIG } from '../config/oauth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface GoogleLoginRequest {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}

export interface GoogleLoginResponse {
  memberId: string;
  accessToken: string;
  refreshToken: string;
}

export const googleLogin = async (
  request: GoogleLoginRequest
): Promise<GoogleLoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: request.code,
      redirectUri: request.redirectUri,
      codeVerifier: request.codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '로그인 실패');
  }

  const data = await response.json();
  return {
    memberId: data.memberId,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
};

// 토큰 재발급
export const reissueToken = async (
  refreshToken: string
): Promise<GoogleLoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/reissue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('토큰 재발급 실패');
  }

  const data = await response.json();
  return {
    memberId: data.memberId,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
};

export async function logout(): Promise<void> {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('memberId');
}

export function getAccessToken() {
  return localStorage.getItem('accessToken') || '';
}