/**
 * PKCE(Proof Key for Public Clients) 관련 유틸
 */

/**
 * code_verifier 랜덤 생성 (43~128 chars)
 */
export function generateCodeVerifier(length: number = 64): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
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

/**
 * sessionStorage에 verifier 저장
 */
export function savePkceVerifier(verifier: string): void {
  sessionStorage.setItem("pkce_verifier", verifier);
}

/**
 * sessionStorage에서 verifier 불러오기
 */
export function getPkceVerifier(): string | null {
  return sessionStorage.getItem("pkce_verifier");
}

/**
 * sessionStorage에서 verifier 삭제
 */
export function clearPkceVerifier(): void {
  sessionStorage.removeItem("pkce_verifier");
}