import React, { useState } from 'react';
import { generateCodeVerifier, generateCodeChallenge, savePkceVerifier } from '../utils/pkce';
import { getGoogleAuthUrl } from '../config/oauth';
import '../styles/LoginPage.css';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      const verifier = generateCodeVerifier();
      savePkceVerifier(verifier);
      
      const challenge = await generateCodeChallenge(verifier);
      
      const authUrl = getGoogleAuthUrl(challenge);
      
      window.location.href = authUrl;
    } catch (error) {
      console.error('Google login failed:', error);
      alert('로그인 시작에 실패했습니다.');
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    localStorage.setItem('isGuest', 'true');
    window.location.href = '/';
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="logo">Phomate</h1>
          <p className="tagline">AI와 함께하는 사진 관리</p>
        </div>

        <div className="login-content">
          <h2>환영합니다!</h2>
          <p className="description">
            Phomate에서 사진을 공유하고<br />
            AI와 함께 편집해보세요
          </p>

          <button
            className="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading">로그인 중...</span>
            ) : (
              'Google로 계속하기'
            )}
          </button>

          <div className="divider">
            <span>또는</span>
          </div>

          <div className="guest-login">
            <p>로그인 없이 둘러보기</p>
            <button onClick={handleGuestMode} className="guest-btn">
              게스트로 시작하기
            </button>
          </div>
        </div>

        <div className="login-footer">
          <p>로그인하면 Phomate의 <a href="#">서비스 약관</a> 및 <a href="#">개인정보 보호정책</a>에 동의하게 됩니다.</p>
        </div>
      </div>
    </div>
  );
}