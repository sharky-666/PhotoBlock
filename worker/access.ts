import type { Env } from './types';

interface AccessJwtPayload {
  aud?: string | string[];
  email?: string;
  exp?: number;
  iss?: string;
  sub?: string;
}

interface JwkKey extends JsonWebKey {
  kid?: string;
}

interface JwksCacheEntry {
  expiresAt: number;
  keys: JwkKey[];
}

const jwksCache = new Map<string, JwksCacheEntry>();
const JWKS_TTL_MS = 5 * 60 * 1000;

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function decodeJson<T>(value: string): T {
  return JSON.parse(
    new TextDecoder().decode(base64UrlToBytes(value)),
  ) as T;
}

async function getJwks(teamDomain: string): Promise<JwkKey[]> {
  const now = Date.now();
  const cached = jwksCache.get(teamDomain);
  if (cached && cached.expiresAt > now) return cached.keys;

  const base = teamDomain.replace(/\/+$/, '');
  const response = await fetch(`${base}/cdn-cgi/access/certs`);
  if (!response.ok) {
    throw new Error(`Unable to load Access JWKS: ${response.status}`);
  }
  const body = (await response.json()) as { keys?: JwkKey[] };
  const keys = Array.isArray(body.keys) ? body.keys : [];
  jwksCache.set(teamDomain, {
    keys,
    expiresAt: now + JWKS_TTL_MS,
  });
  return keys;
}

export async function getAccessIdentity(
  request: Request,
  env: Env,
): Promise<{ username: string } | null> {
  const token = request.headers.get('cf-access-jwt-assertion');
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN?.trim();
  const audience = env.CF_ACCESS_AUD?.trim();
  if (!token || !teamDomain || !audience) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  let header: { alg?: string; kid?: string };
  let payload: AccessJwtPayload;
  try {
    header = decodeJson(parts[0]);
    payload = decodeJson(parts[1]);
  } catch {
    return null;
  }
  if (header.alg !== 'RS256' || !header.kid) return null;

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= now - 30) return null;
  const issuer = teamDomain.replace(/\/+$/, '');
  if (payload.iss?.replace(/\/+$/, '') !== issuer) return null;
  const audiences = Array.isArray(payload.aud)
    ? payload.aud
    : [payload.aud];
  if (!audiences.includes(audience)) return null;

  const keys = await getJwks(teamDomain);
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) return null;

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['verify'],
  );
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    toArrayBuffer(base64UrlToBytes(parts[2])),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!valid) return null;

  return {
    username:
      payload.email?.trim() ||
      payload.sub?.trim() ||
      'Cloudflare Access',
  };
}
