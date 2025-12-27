import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPkceVerifier, clearPkceVerifier } from '../utils/pkce';
import { googleLogin } from '../api/auth';

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

        if (!code) {
          throw new Error('인증 코드를 받지 못했습니다.');
        }

        // 2. PKCE verifier 추출
        const codeVerifier = getPkceVerifier();
        if (!codeVerifier) {
          throw new Error('PKCE verifier를 찾을 수 없습니다.');
        }

        // 3. 백엔드에 로그인 요청
        const response = await googleLogin({
          code,
          redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
          codeVerifier,
        });

        // 4. 토큰 저장
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('memberId', response.memberId);

        // 5. PKCE verifier 삭제
        clearPkceVerifier();

        // 6. 홈으로 이동
        setIsLoading(false);
        navigate('/');
      } catch (err: any) {
        console.error('로그인 실패:', err);
        setError(err.message || '로그인 처리 중 오류가 발생했습니다.');
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