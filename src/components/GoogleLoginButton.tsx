import React from 'react';
import { generateCodeVerifier, generateCodeChallenge, savePkceVerifier } from '../utils/pkce';
import { getGoogleAuthUrl } from '../config/oauth';

export default function GoogleLoginButton() {
  const handleGoogleLogin = async () => {
    try {
      // 1. code_verifier 생성 및 저장
      const verifier = generateCodeVerifier();
      savePkceVerifier(verifier);

      // 2. code_challenge 생성
      const challenge = await generateCodeChallenge(verifier);

      // 3. Google 인증 URL 생성
      const authUrl = getGoogleAuthUrl(challenge);

      // 4. Google로 이동
      window.location.href = authUrl;
    } catch (error) {
      console.error('Google 로그인 시작 실패:', error);
      alert('로그인 시작에 실패했습니다.');
    }
  };

  return (
    <button onClick={handleGoogleLogin} className="google-login-btn">
      Google로 로그인
    </button>
  );
}