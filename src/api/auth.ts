import * as apiClient from './apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ============ 타입 정의 ============

export interface GoogleLoginRequest {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}

export interface AuthResponse {
  memberId: number;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

// ============ Google OAuth ============

/**
 * Google 로그인
 * POST /api/auth/google
 */
export async function googleLogin(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google 로그인 실패 (${res.status}) ${text || ''}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ============ 토큰 관리 ============

/**
 * 토큰 재발급
 * POST /api/auth/reissue
 */
export async function reissueToken(
  refreshToken: string
): Promise<AuthResponse> {
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
}

/**
 * 로그아웃
 */
export function logout(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('memberId');
  sessionStorage.removeItem('pkce_code_verifier');
}

/**
 * 저장된 토큰 가져오기
 */
export function getAccessToken(): string {
  return localStorage.getItem('accessToken') || '';
}

/**
 * 저장된 refresh 토큰 가져오기
 */
export function getRefreshToken(): string {
  return localStorage.getItem('refreshToken') || '';
}

/**
 * 토큰 저장
 */
export function saveTokens(data: AuthResponse): void {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('memberId', data.memberId.toString());
}

/**
 * 로그인 여부 확인
 */
export function isLoggedIn(): boolean {
  return !!localStorage.getItem('accessToken');
}