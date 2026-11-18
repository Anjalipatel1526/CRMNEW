/**
 * Cryptographic Session Signing and Verification Utility
 * Operates cleanly across Next.js Edge Middleware and Node.js Server runtimes
 * using standard Web Crypto API (SubtleCrypto).
 */

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.SUPABASE_JWT_SECRET ||
  'unai-crm-enterprise-session-hmac-sha256-key-v1';

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface SessionPayload {
  userId: string;
  tenantId: string;
  role: string;
  exp: number; // Unix timestamp in seconds
}

/**
 * Signs a session payload using HMAC-SHA256 producing a tamper-proof session token.
 */
export async function signSessionPayload(payload: SessionPayload): Promise<string> {
  const enc = new TextEncoder();
  const jsonStr = JSON.stringify(payload);
  const dataBytes = enc.encode(jsonStr);
  const dataB64 = base64UrlEncode(dataBytes);

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBytes = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, enc.encode(dataB64))
  );
  const sigB64 = base64UrlEncode(sigBytes);

  return `${dataB64}.${sigB64}`;
}

/**
 * Verifies the HMAC-SHA256 signature and expiration of a signed session token.
 * Returns the verified payload or null if the signature is invalid or token expired.
 */
export async function verifySignedSession(token: string): Promise<SessionPayload | null> {
  try {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [dataB64, sigB64] = parts;
    const enc = new TextEncoder();

    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = base64UrlDecode(sigB64);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      enc.encode(dataB64)
    );

    if (!isValid) return null;

    const jsonBytes = base64UrlDecode(dataB64);
    const jsonStr = new TextDecoder().decode(jsonBytes);
    const payload: SessionPayload = JSON.parse(jsonStr);

    // Verify expiration timestamp
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
