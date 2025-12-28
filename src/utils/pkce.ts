/**
 * PKCE(Proof Key for Public Clients) 관련 유틸
 */

/**
 * code_verifier 랜덤 생성 (43~128 chars)
 */
export function generateCodeVerifier(length: number = 64): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

/**
 * SHA256 해시
 */
async function sha256(plain: string): Promise<ArrayBuffer> {
  const data = new TextEncoder().encode(plain);
  return await crypto.subtle.digest("SHA-256", data);
}

/**
 * base64url 인코딩
 */
function base64UrlEncode(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * code_challenge 생성
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const hashed = await sha256(codeVerifier);
  return base64UrlEncode(hashed);
}

export const PKCE_VERIFIER_KEY = 'pkce_verifier';

export function savePkceVerifier(verifier: string) {
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
}

export function loadPkceVerifier(): string | null {
  return sessionStorage.getItem(PKCE_VERIFIER_KEY);
}

export function clearPkceVerifier() {
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
}