import { HttpError } from './http';
import { getAccessIdentity } from './access';
import type { Env } from './types';

const COOKIE_NAME = 'pb_admin_session';
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const PBKDF2_ITERATIONS = 50_000;

interface AdminUserRow {
  id: string;
  username: string;
  password_hash: string;
}

export interface AdminSession {
  adminId: string;
  username: string;
  tokenHash: string;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return bytesToHex(new Uint8Array(digest));
}

async function derivePassword(
  password: string,
  salt: Uint8Array,
  iterations = PBKDF2_ITERATIONS,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: salt.buffer.slice(
        salt.byteOffset,
        salt.byteOffset + salt.byteLength,
      ) as ArrayBuffer,
      iterations,
    },
    key,
    256,
  );
  return new Uint8Array(bits);
}

async function createPasswordHash(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await derivePassword(password, salt);
  return [
    'pbkdf2_sha256',
    String(PBKDF2_ITERATIONS),
    bytesToBase64Url(salt),
    bytesToBase64Url(derived),
  ].join('$');
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a[index] ^ b[index];
  }
  return difference === 0;
}

async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [algorithm, iterationsRaw, saltRaw, hashRaw] =
    storedHash.split('$');
  const iterations = Number(iterationsRaw);
  if (
    algorithm !== 'pbkdf2_sha256' ||
    !Number.isInteger(iterations) ||
    iterations < PBKDF2_ITERATIONS ||
    iterations > 600_000 ||
    !saltRaw ||
    !hashRaw
  ) {
    return false;
  }
  const salt = base64UrlToBytes(saltRaw);
  const expected = base64UrlToBytes(hashRaw);
  const actual = await derivePassword(password, salt, iterations);
  return constantTimeEqual(actual, expected);
}

function sessionCookie(
  token: string,
  url: URL,
  maxAge = SESSION_SECONDS,
): string {
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function clearedSessionCookie(url: URL): string {
  return sessionCookie('', url, 0);
}

export function readSessionToken(request: Request): string | null {
  const cookies = request.headers.get('cookie');
  if (!cookies) return null;
  for (const item of cookies.split(';')) {
    const [name, ...valueParts] = item.trim().split('=');
    if (name === COOKIE_NAME) {
      return valueParts.join('=') || null;
    }
  }
  return null;
}

export async function authenticateRequest(
  request: Request,
  env: Env,
): Promise<AdminSession | null> {
  const token = readSessionToken(request);
  if (!token) {
    let accessIdentity: { username: string } | null = null;
    try {
      accessIdentity = await getAccessIdentity(request, env);
    } catch (error) {
      console.error('Cloudflare Access verification failed', error);
    }
    if (!accessIdentity) return null;
    return {
      adminId: 'cloudflare-access',
      username: accessIdentity.username,
      tokenHash: '',
    };
  }
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(`
    SELECT
      s.admin_id,
      u.username
    FROM admin_sessions s
    INNER JOIN admin_users u ON u.id = s.admin_id
    WHERE s.token_hash = ? AND s.expires_at > ?
    LIMIT 1
  `)
    .bind(tokenHash, new Date().toISOString())
    .first<{ admin_id: string; username: string }>();
  if (!row) return null;
  return {
    adminId: row.admin_id,
    username: row.username,
    tokenHash,
  };
}

export async function requireAdmin(
  request: Request,
  env: Env,
): Promise<AdminSession> {
  const session = await authenticateRequest(request, env);
  if (!session) throw new HttpError(401, '请先登录管理后台');
  return session;
}

async function findUser(
  env: Env,
  username: string,
): Promise<AdminUserRow | null> {
  return env.DB.prepare(`
    SELECT id, username, password_hash
    FROM admin_users
    WHERE username = ?
    LIMIT 1
  `)
    .bind(username)
    .first<AdminUserRow>();
}

async function bootstrapUser(
  env: Env,
  username: string,
  password: string,
): Promise<AdminUserRow | null> {
  const configuredUsername =
    env.ADMIN_BOOTSTRAP_USERNAME?.trim() || 'admin';
  const configuredPassword = env.ADMIN_BOOTSTRAP_PASSWORD;
  if (
    !configuredPassword ||
    configuredPassword.length < 12 ||
    username !== configuredUsername ||
    password !== configuredPassword
  ) {
    return null;
  }

  const existing = await findUser(env, configuredUsername);
  if (existing) return existing;

  const id = crypto.randomUUID();
  const passwordHash = await createPasswordHash(configuredPassword);
  await env.DB.prepare(`
    INSERT INTO admin_users (id, username, password_hash)
    VALUES (?, ?, ?)
  `)
    .bind(id, configuredUsername, passwordHash)
    .run();

  return {
    id,
    username: configuredUsername,
    password_hash: passwordHash,
  };
}

export async function loginAdmin(
  request: Request,
  env: Env,
  username: string,
  password: string,
): Promise<{
  username: string;
  cookie: string;
}> {
  const normalizedUsername = username.trim();
  if (!normalizedUsername || !password) {
    throw new HttpError(400, '请输入用户名和密码');
  }

  let user = await findUser(env, normalizedUsername);
  if (!user) {
    user = await bootstrapUser(
      env,
      normalizedUsername,
      password,
    );
  }
  if (
    !user ||
    !(await verifyPassword(password, user.password_hash))
  ) {
    throw new HttpError(401, '用户名或密码错误');
  }

  const token = bytesToBase64Url(
    crypto.getRandomValues(new Uint8Array(32)),
  );
  const tokenHash = await sha256(token);
  const expiresAt = new Date(
    Date.now() + SESSION_SECONDS * 1000,
  ).toISOString();

  await env.DB.prepare(`
    DELETE FROM admin_sessions
    WHERE expires_at <= ?
  `)
    .bind(new Date().toISOString())
    .run();
  await env.DB.prepare(`
    INSERT INTO admin_sessions (token_hash, admin_id, expires_at)
    VALUES (?, ?, ?)
  `)
    .bind(tokenHash, user.id, expiresAt)
    .run();

  return {
    username: user.username,
    cookie: sessionCookie(token, new URL(request.url)),
  };
}

export async function logoutAdmin(
  request: Request,
  env: Env,
): Promise<string> {
  const token = readSessionToken(request);
  if (token) {
    await env.DB.prepare(`
      DELETE FROM admin_sessions
      WHERE token_hash = ?
    `)
      .bind(await sha256(token))
      .run();
  }
  return clearedSessionCookie(new URL(request.url));
}

export async function changeAdminPassword(
  request: Request,
  env: Env,
  session: AdminSession,
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  if (newPassword.length < 12) {
    throw new HttpError(400, '新密码至少需要 12 个字符');
  }
  const user = await findUser(env, session.username);
  if (
    !user ||
    !(await verifyPassword(oldPassword, user.password_hash))
  ) {
    throw new HttpError(400, '原密码错误');
  }

  const passwordHash = await createPasswordHash(newPassword);
  await env.DB.batch([
    env.DB.prepare(`
      UPDATE admin_users
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(passwordHash, user.id),
    env.DB.prepare(`
      DELETE FROM admin_sessions
      WHERE admin_id = ? AND token_hash <> ?
    `).bind(user.id, session.tokenHash),
  ]);
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  if (!origin) return;
  const originUrl = new URL(origin);
  const expected = new URL(request.url);
  const sameLocalHost =
    (originUrl.hostname === 'localhost' ||
      originUrl.hostname === '127.0.0.1') &&
    (expected.hostname === 'localhost' ||
      expected.hostname === '127.0.0.1');
  if (originUrl.origin !== expected.origin && !sameLocalHost) {
    throw new HttpError(403, '请求来源无效');
  }
}
