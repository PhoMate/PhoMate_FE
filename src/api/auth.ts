import { GOOGLE_CONFIG } from '../config/oauth';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface GoogleLoginRequest {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface GoogleLoginResponse {
  accessToken: string;
  refreshToken?: string;
  memberId: string;
}

export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

export async function googleLogin(payload: GoogleLoginRequest): Promise<GoogleLoginResponse> {
  const res = await fetch(`${API_BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Google 로그인 실패');
  }
  return res.json();
}

export async function reissueToken(refreshToken: string): Promise<GoogleLoginResponse> {
  const res = await fetch(`${API_BASE}/api/auth/reissue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('토큰 재발급 실패');
  return res.json();
}

export async function logout(): Promise<void> {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('memberId');
}