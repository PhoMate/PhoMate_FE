import * as apiClient from './apiClient';
import type { GoogleLoginRequestDTO, GoogleLoginResponseDTO, RefreshRequestDTO } from '../types/auth';
import { clearPkceVerifier } from '../utils/pkce';
import { API_BASE_URL } from '../config/env';

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
  try {
    const payload = await apiClient.post<GoogleLoginResponseDTO | { data: GoogleLoginResponseDTO }>(
      '/api/auth/google',
      params
    );

    const data: any = (payload as any)?.data ?? payload;
    const result: GoogleLoginResponseDTO = {
      memberId: Number(data.memberId),
      accessToken: String(data.accessToken || ''),
      refreshToken: String(data.refreshToken || ''),
    };

    if (!result.accessToken) {
      throw new Error('액세스 토큰이 응답에 없습니다.');
    }

    saveTokens({
      memberId: result.memberId,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken || getRefreshToken() || '',
    });

    return result;
  } catch (e: any) {
    const msg = e?.message || String(e);
    console.error('googleLogin error:', msg);
    throw new Error(msg);
  }
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
  // 저장 및 반환 누락 수정
  saveTokens(tokens as any);
  return tokens;
}

/**
 * 로그아웃
 */
export function logout(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('memberId');
  localStorage.removeItem('isGuest');
  // PKCE verifier 키 정리
  clearPkceVerifier();
  sessionStorage.removeItem('pkce_code_verifier'); // 레거시 키도 함께 제거
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
  // 실사용자 로그인 시 게스트 모드 해제
  localStorage.removeItem('isGuest');
}

/**
 * 로그인 여부 확인
 */
export function isLoggedIn(): boolean {
  return !!localStorage.getItem('accessToken');
}