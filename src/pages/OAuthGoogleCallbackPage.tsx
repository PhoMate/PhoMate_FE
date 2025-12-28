import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadPkceVerifier, clearPkceVerifier } from '../utils/pkce';
import { googleLogin, saveTokens } from '../api/auth';

export default function OAuthGoogleCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasRequested = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // 🔥 이미 요청했으면 중단 (React StrictMode 더블 실행 방지)
      if (hasRequested.current) return;
      hasRequested.current = true;

      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const verifier = loadPkceVerifier();
        if (!code || !verifier) throw new Error('PKCE verifier를 찾을 수 없습니다.');

        const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI
          ?? `${window.location.origin}/oauth/google/callback`;

        const data = await googleLogin({ code, codeVerifier: verifier, redirectUri });
        if (data) {
          console.log('✅ 로그인 성공:', data);
          saveTokens(data);
          
          // 🔥 게스트 플래그 제거 (실제 로그인으로 전환)
          localStorage.removeItem('isGuest');
          
          // 토큰 저장 확인
          const savedToken = localStorage.getItem('accessToken');
          console.log('💾 저장된 accessToken:', savedToken ? '있음 ✓' : '없음 ✗');
          
          clearPkceVerifier();
          
          // 토큰 저장 후 상태 동기화를 위해 강제 새로고침
          console.log('🔄 페이지 새로고침 중...');
          window.location.href = '/';
        } else {
          throw new Error('로그인 응답이 없습니다.');
        }
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : '로그인 실패');
      } finally {
        setIsLoading(false);
      }
    };
    handleCallback();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="callback-loading">
        <p>로그인 처리 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="callback-error">
        <h2>로그인 실패</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/login')}>
          로그인 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return null;
}