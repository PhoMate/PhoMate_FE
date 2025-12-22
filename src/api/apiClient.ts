import { reissueToken, logout } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * accessToken 가져오기
 */
function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

/**
 * accessToken 저장
 */
function setAccessToken(token: string): void {
  localStorage.setItem('accessToken', token);
}

/**
 * 요청 인터셉터: accessToken 자동 첨부
 */
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  headers.set('Content-Type', 'application/json');

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // 401 처리: 토큰 재발급 시도
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken) {
      try {
        // 토큰 재발급
        const newTokenData = await reissueToken(refreshToken);
        setAccessToken(newTokenData.accessToken);

        // 원래 요청 재시도
        headers.set('Authorization', `Bearer ${newTokenData.accessToken}`);
        response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
      } catch (error) {
        // 재발급 실패 = refresh도 만료됨
        console.error('토큰 재발급 실패:', error);
        await logout();
        window.location.href = '/'; // 로그인 페이지로 이동
        throw new Error('로그인 만료. 다시 로그인해주세요.');
      }
    } else {
      // refreshToken이 없으면 로그인 필요
      window.location.href = '/';
      throw new Error('로그인이 필요합니다.');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API 요청 실패: ${response.status}`);
  }

  return response;
}

/**
 * GET 요청
 */
export async function get<T>(endpoint: string): Promise<T> {
  const response = await apiRequest(endpoint, { method: 'GET' });
  return response.json();
}

/**
 * POST 요청
 */
export async function post<T>(endpoint: string, data?: any): Promise<T> {
  const response = await apiRequest(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

/**
 * PATCH 요청
 */
export async function patch<T>(endpoint: string, data?: any): Promise<T> {
  const response = await apiRequest(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

/**
 * DELETE 요청
 */
export async function delete_<T>(endpoint: string): Promise<T> {
  const response = await apiRequest(endpoint, { method: 'DELETE' });
  return response.json();
}

/**
 * 로그인 불필요한 GET (공개 API)
 */
export async function publicGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }

  return response.json();
}