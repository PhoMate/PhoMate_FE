import React, { useEffect, useState, useRef } from 'react';
import { loadPkceVerifier, clearPkceVerifier } from '../utils/pkce';
import { googleLogin, saveTokens } from '../api/auth';

export default function OAuthGoogleCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const invokedRef = useRef(false);

  useEffect(() => {
    if (invokedRef.current) return; 
    invokedRef.current = true;
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const verifier = loadPkceVerifier();
        if (!code || !verifier) throw new Error('PKCE verifier를 찾을 수 없습니다.');

        const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
        if (!redirectUri) {
          throw new Error('VITE_GOOGLE_REDIRECT_URI가 설정되지 않았습니다. 환경변수를 확인하세요.');
        }

        const data = await googleLogin({ code, codeVerifier: verifier, redirectUri });
        if (!data || !data.accessToken) {
          throw new Error('토큰 응답을 받지 못했습니다.');
        }
        clearPkceVerifier();
        window.location.replace('/');
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('OAuth callback error:', message);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    handleCallback();
  }, []);

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
        <button onClick={() => window.location.replace('/login')}>
          로그인 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return null;
}
