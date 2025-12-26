import { reissueToken, logout } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

function setAccessToken(token: string): void {
  localStorage.setItem('accessToken', token);
}

async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken) {
      try {
        const newTokenData = await reissueToken(refreshToken);
        setAccessToken(newTokenData.accessToken);

        headers.set('Authorization', `Bearer ${newTokenData.accessToken}`);
        response = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
      } catch (error) {
        console.error('토큰 재발급 실패:', error);
        await logout();
        window.location.href = '/'; 
        throw new Error('로그인 만료. 다시 로그인해주세요.');
      }
    } else {
      window.location.href = '/';
      throw new Error('로그인이 필요합니다.');
    }
  }

  if (response.status === 204) {
      return response;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API 요청 실패: ${response.status}`);
  }

  return response;
}

export async function get<T>(endpoint: string): Promise<T> {
  const response = await apiRequest(endpoint, { method: 'GET' });
  return response.json();
}

export async function post<T>(endpoint: string, data?: any): Promise<T> {
  const isFormData = data instanceof FormData;
  
  const response = await apiRequest(endpoint, {
    method: 'POST',
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
  });
  
  if (response.status === 204) return {} as T;
  return response.json();
}

export async function patch<T>(endpoint: string, data?: any): Promise<T> {
  const isFormData = data instanceof FormData;

  const response = await apiRequest(endpoint, {
    method: 'PATCH',
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
  });

  if (response.status === 204) return {} as T;
  return response.json();
}

export async function delete_<T>(endpoint: string): Promise<T> {
  const response = await apiRequest(endpoint, { method: 'DELETE' });
  if (response.status === 204) return {} as T;
  return response.json();
}

export async function publicGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `요청 실패: ${response.status}`);
  }

  return response.json();
}