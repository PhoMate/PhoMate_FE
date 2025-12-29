import * as apiClient from './apiClient';
import type { GoogleLoginRequestDTO, GoogleLoginResponseDTO, RefreshRequestDTO } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    redirect: 'manual', 
    body: JSON.stringify(params),
  });

  console.log('redirected?', res.redirected, 'url:', res.url, 'status:', res.status);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google 로그인 실패 (${res.status}) ${text || ''}`);
  }
 
  const contentType = res.headers.get('content-type') || '';
  try {
    let payload: any = null;
    if (contentType.includes('application/json')) {
      payload = await res.json();
    } else {
      const text = await res.text();
      payload = text ? JSON.parse(text) : null;
    }

    if (!payload) {
      throw new Error('로그인 응답이 비어 있습니다.');
    }

    const data = payload.data?.accessToken ? payload.data : payload;
    const result: GoogleLoginResponseDTO = {
      memberId: Number(data.memberId),
      accessToken: String(data.accessToken || ''),
      refreshToken: String(data.refreshToken || ''),
    };

    if (!result.accessToken || !result.refreshToken) {
      throw new Error('토큰이 응답에 없습니다.');
    }

    return result;
  } catch (e: any) {
    const msg = e?.message || String(e);
    console.error('googleLogin parse error:', msg);
    throw new Error(msg);
  }
}

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

  saveTokens(tokens);
  return tokens;
}

export function logout(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('memberId');
  sessionStorage.removeItem('pkce_verifier');
  sessionStorage.removeItem('pkce_code_verifier'); 
}

export function getAccessToken(): string {
  return localStorage.getItem('accessToken') || '';
}

export function getRefreshToken(): string {
  return localStorage.getItem('refreshToken') || '';
}

export function saveTokens(data: AuthResponse): void {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('memberId', data.memberId.toString());
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem('accessToken');
}