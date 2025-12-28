import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadPkceVerifier, clearPkceVerifier } from '../utils/pkce';
import { googleLogin, saveTokens } from '../api/auth';

export default function OAuthGoogleCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const invokedRef = useRef(false);

  useEffect(() => {
    if (invokedRef.current) return; // StrictMode 등 중복 호출 방지
    invokedRef.current = true;
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const verifier = loadPkceVerifier();
        if (!code || !verifier) throw new Error('PKCE verifier를 찾을 수 없습니다.');

        const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI
          ?? `${window.location.origin}/oauth/google/callback`;

        const data = await googleLogin({ code, codeVerifier: verifier, redirectUri });
        if (!data || !data.accessToken) {
          throw new Error('토큰 응답을 받지 못했습니다.');
        }
        saveTokens(data);
        clearPkceVerifier();
        navigate('/');
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
