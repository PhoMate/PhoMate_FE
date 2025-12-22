import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPkceVerifier, clearPkceVerifier } from '../utils/pkce';
import { googleLogin } from '../api/auth.ts';

export default function OAuthGoogleCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. URL에서 code 추출
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const errorParam = params.get('error');

        if (errorParam) {
          throw new Error(`Google 인증 실패: ${errorParam}`);
        }

        if (!code) {
          throw new Error('인증 코드를 받지 못했습니다.');
        }

        // 2. sessionStorage에서 verifier 추출
        const codeVerifier = getPkceVerifier();
        if (!codeVerifier) {
          throw new Error('PKCE verifier를 찾을 수 없습니다. 다시 로그인해주세요.');
        }

        // 3. 백엔드에 로그인 요청
        const response = await googleLogin({
          code,
          codeVerifier,
          redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
        });

        // 4. 토큰 저장
        localStorage.setItem('accessToken', response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        if (response.memberId) {
          localStorage.setItem('memberId', response.memberId);
        }

        // 5. URL 정리
        window.history.replaceState({}, '', '/oauth/google/callback');

        // 6. 홈페이지로 이동
        navigate('/');
      } catch (err) {
        console.error('콜백 처리 실패:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (isLoading) {
    return <div className="loading">로그인 처리 중입니다...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => window.location.href = '/'}>홈으로 돌아가기</button>
      </div>
    );
  }

  return null;
}