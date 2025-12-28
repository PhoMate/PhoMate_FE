import React, { createContext, useContext, useState, useEffect } from 'react';
import { cookieGet } from '../api/apiClient';

interface AuthContextType {
  isLoggedIn: boolean;
  memberId: string | null;
  loading: boolean;
  login: (memberId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 초기화: localStorage에서 토큰 확인
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const id = localStorage.getItem('memberId');
    if (token && id) {
      setIsLoggedIn(true);
      setMemberId(id);
      setLoading(false);
      return;
    }

    // 토큰이 없더라도 쿠키 기반 세션이 있으면 로그인 처리
    cookieGet<{ memberId: number; nickname?: string }>(`/api/members/me`)
      .then((me) => {
        if (me && me.memberId) {
          setIsLoggedIn(true);
          setMemberId(String(me.memberId));
          localStorage.setItem('memberId', String(me.memberId));
        }
      })
      .catch(() => {
        // 무시: 비로그인 상태
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (id: string) => {
    setIsLoggedIn(true);
    setMemberId(id);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setMemberId(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('memberId');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, memberId, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}