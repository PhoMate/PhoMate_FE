import * as apiClient from './apiClient';
import type { GoogleLoginRequestDTO, GoogleLoginResponseDTO, RefreshRequestDTO } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ============ 타입 정의 ============

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthResponse {
  memberId: number;
  accessToken: string;
  refreshToken: string;
}

// ============ Google OAuth ============

/**
 * Google 로그인
 * POST /api/auth/google
 */
export async function googleLogin(params: GoogleLoginRequestDTO): Promise<GoogleLoginResponseDTO | null> {
  if (!params.codeVerifier) {
    console.warn('googleLogin: codeVerifier is empty');
  } else {
    console.log('googleLogin: codeVerifier', params.codeVerifier);
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    redirect: 'manual', // 리다이렉트 여부 확인용
    body: JSON.stringify(params),
  });

  console.log('redirected?', res.redirected, 'url:', res.url, 'status:', res.status);

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
): Promise<GoogleLoginResponseDTO> {
  if (!refreshToken) {
    throw new Error('refreshToken이 없습니다.');
  }

  const payload: RefreshRequestDTO = { refreshToken };
  const response = await fetch(`${API_BASE_URL}/api/auth/reissue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('토큰 재발급 실패');
  }

  const data = await response.json();
  const tokens: GoogleLoginResponseDTO = {
    memberId: data.memberId,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };

  // 받은 토큰을 저장하여 이후 호출에서 사용 가능하게 함
  saveTokens(tokens);
  return tokens;
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