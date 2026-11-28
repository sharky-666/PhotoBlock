import type { Env } from './types';

const DEFAULT_EXPIRES_SECONDS = 15 * 60;

export interface OssSignedUrl {
  url: string;
  expiresAt: string;
}

function getOssConfig(env: Env) {
  const bucket = env.ALIYUN_OSS_BUCKET?.trim();
  const endpoint = env.ALIYUN_OSS_ENDPOINT?.trim();
  const accessKeyId = env.ALIYUN_OSS_ACCESS_KEY_ID?.trim();
  const accessKeySecret = env.ALIYUN_OSS_ACCESS_KEY_SECRET?.trim();

  if (!bucket || !endpoint || !accessKeyId || !accessKeySecret) {
    throw new Error('阿里云 OSS 尚未完成配置');
  }

  return {
    bucket,
    endpoint: new URL(endpoint),
    accessKeyId,
    accessKeySecret,
  };
}

function normalizeKey(key: string): string {
  const normalized = key.replace(/^\/+/, '');
  if (!normalized || normalized.includes('..')) {
    throw new Error('OSS 媒体路径无效');
  }
  return normalized;
}

function encodeObjectPath(key: string): string {
  return key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

async function signOssRequest(
  accessKeySecret: string,
  stringToSign: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(accessKeySecret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(stringToSign),
  );
  return bytesToBase64(new Uint8Array(signature));
}

export async function createOssSignedUrl(
  env: Env,
  rawKey: string,
  method: 'GET' | 'HEAD' | 'PUT' | 'DELETE',
  options: {
    contentType?: string;
    expiresSeconds?: number;
  } = {},
): Promise<OssSignedUrl> {
  const config = getOssConfig(env);
  const key = normalizeKey(rawKey);
  const expiresSeconds =
    options.expiresSeconds ?? DEFAULT_EXPIRES_SECONDS;
  const expires = Math.floor(Date.now() / 1000) + expiresSeconds;
  const contentType = options.contentType?.trim() ?? '';
  const canonicalResource = `/${config.bucket}/${key}`;
  const stringToSign = [
    method,
    '',
    contentType,
    String(expires),
    canonicalResource,
  ].join('\n');
  const signature = await signOssRequest(
    config.accessKeySecret,
    stringToSign,
  );

  const endpointHost = config.endpoint.host;
  const bucketHost = endpointHost.startsWith(`${config.bucket}.`)
    ? endpointHost
    : `${config.bucket}.${endpointHost}`;
  const url = new URL(
    `${config.endpoint.protocol}//${bucketHost}/${encodeObjectPath(key)}`,
  );
  url.searchParams.set('OSSAccessKeyId', config.accessKeyId);
  url.searchParams.set('Expires', String(expires));
  url.searchParams.set('Signature', signature);

  return {
    url: url.toString(),
    expiresAt: new Date(expires * 1000).toISOString(),
  };
}

export async function deleteOssObject(
  env: Env,
  key: string,
): Promise<void> {
  const signed = await createOssSignedUrl(env, key, 'DELETE');
  const response = await fetch(signed.url, {
    method: 'DELETE',
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`删除 OSS 文件失败（HTTP ${response.status}）`);
  }
}

export interface OssObjectMetadata {
  size: number;
  contentType: string;
}

export async function getOssObjectMetadata(
  env: Env,
  key: string,
): Promise<OssObjectMetadata | null> {
  const signed = await createOssSignedUrl(env, key, 'GET');
  const response = await fetch(signed.url, {
    method: 'GET',
    headers: {
      range: 'bytes=0-0',
    },
  });
  if (response.status === 404) {
    await response.body?.cancel();
    return null;
  }
  if (!response.ok && response.status !== 416) {
    await response.body?.cancel();
    throw new Error(`读取 OSS 文件信息失败（HTTP ${response.status}）`);
  }

  const contentRange = response.headers.get('content-range') ?? '';
  const rangeMatch = contentRange.match(/\/(\d+)$/);
  const size = rangeMatch
    ? Number(rangeMatch[1])
    : Number(response.headers.get('content-length') ?? '0');
  const contentType = (
    response.headers.get('content-type') ?? ''
  )
    .split(';')[0]
    .trim()
    .toLowerCase();
  await response.body?.cancel();
  return {
    size: Number.isFinite(size) ? size : 0,
    contentType,
  };
}
