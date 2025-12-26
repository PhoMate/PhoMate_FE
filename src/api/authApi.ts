import api from './axios';
import type { LoginRequest, SignupRequest, AuthResponse } from '../types/api';

export const authApi = {
  // 로그인
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    return response.data;
  },
  
  // 회원가입
  signup: async (userData: SignupRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/signup', userData);
    return response.data;
  },
  
  // 로그아웃
  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
  },

  // 토큰 갱신
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/refresh', { refreshToken });
    return response.data;
  },
};