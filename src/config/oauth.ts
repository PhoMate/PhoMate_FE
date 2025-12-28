/**
 * Google OAuth 설정
 */

export const GOOGLE_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI, // 예: http://localhost:5173/oauth/google/callback
};

export function getGoogleAuthUrl(codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CONFIG.clientId,
    redirect_uri: GOOGLE_CONFIG.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'consent',
  });

  return `${GOOGLE_CONFIG.authorizationEndpoint}?${params.toString()}`;
}