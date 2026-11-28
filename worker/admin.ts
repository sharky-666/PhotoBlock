import {
  authenticateRequest,
  assertSameOrigin,
  changeAdminPassword,
  loginAdmin,
  logoutAdmin,
  requireAdmin,
} from './auth';
import {
  getArtwork,
  getCategory,
  getHomepageCopy,
  getSeries,
  getSiteSettings,
} from './data';
import { HttpError, ok } from './http';
import {
  createOssSignedUrl,
  deleteOssObject,
  getOssObjectMetadata,
} from './oss';
import { DEFAULT_HOMEPAGE_COPY } from '../shared/homepage-defaults';
import type { Env } from './types';

type JsonObject = Record<string, unknown>;
type MediaType = 'image' | 'video';

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function asObject(value: unknown): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new HttpError(400, '请求数据格式错误');
  }
  return value as JsonObject;
}

async function readJson(request: Request): Promise<JsonObject> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new HttpError(415, '请求必须使用 JSON');
  }
  try {
    return asObject(await request.json());
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'JSON 数据格式错误');
  }
}

function requiredString(
  body: JsonObject,
  key: string,
  label: string,
  maxLength = 255,
): string {
  const value = body[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `请填写${label}`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new HttpError(400, `${label}过长`);
  }
  return trimmed;
}

function optionalString(
  body: JsonObject,
  key: string,
  maxLength = 5000,
): string | undefined {
  const value = body[key];
  if (value === undefined) return undefined;
  if (value === null) return '';
  if (typeof value !== 'string') {
    throw new HttpError(400, `${key} 格式错误`);
  }
  if (value.length > maxLength) {
    throw new HttpError(400, `${key} 过长`);
  }
  return value.trim();
}

function nullableString(
  body: JsonObject,
  key: string,
  maxLength = 1000,
): string | null | undefined {
  if (!(key in body)) return undefined;
  if (body[key] === null || body[key] === '') return null;
  const value = optionalString(body, key, maxLength);
  return value ?? null;
}

function optionalNumber(
  body: JsonObject,
  key: string,
): number | undefined {
  const value = body[key];
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new HttpError(400, `${key} 必须是数字`);
  }
  return parsed;
}

function nullableNumber(
  body: JsonObject,
  key: string,
): number | null | undefined {
  if (!(key in body)) return undefined;
  if (body[key] === null || body[key] === '') return null;
  return optionalNumber(body, key) ?? null;
}

function optionalBoolean(
  body: JsonObject,
  key: string,
): boolean | undefined {
  const value = body[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') {
    throw new HttpError(400, `${key} 必须是布尔值`);
  }
  return value;
}

function mediaType(
  body: JsonObject,
  fallback: MediaType = 'image',
): MediaType {
  const value = body.mediaType;
  if (value === undefined) return fallback;
  if (value !== 'image' && value !== 'video') {
    throw new HttpError(400, '媒体类型错误');
  }
  return value;
}

function slugBase(value: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return normalized || 'item';
}

async function uniqueSlug(
  env: Env,
  table: 'series' | 'categories' | 'artworks',
  title: string,
): Promise<string> {
  const base = slugBase(title);
  let candidate = base;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const exists = await env.DB.prepare(
      `SELECT 1 AS found FROM ${table} WHERE slug = ? LIMIT 1`,
    )
      .bind(candidate)
      .first<{ found: number }>();
    if (!exists) return candidate;
    candidate = `${base}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function toMediaKey(env: Env, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const base = env.MEDIA_BASE_URL.trim().replace(/\/+$/, '');
  if (base && value.startsWith(`${base}/`)) {
    return value.slice(base.length + 1);
  }
  if (value.startsWith('/media/')) {
    return decodeURIComponent(value.slice('/media/'.length));
  }
  return value.replace(/^\/+/, '');
}

function mediaUrl(env: Env, key: string): string {
  if (/^https?:\/\//i.test(key)) return key;
  const base = env.MEDIA_BASE_URL.trim().replace(/\/+$/, '');
  const path = key.replace(/^\/+/, '');
  return base ? `${base}/${path}` : `/media/${path}`;
}

type FieldKind =
  | 'string'
  | 'nullable-string'
  | 'number'
  | 'nullable-number'
  | 'boolean';

interface UpdateField {
  key: string;
  column: string;
  kind: FieldKind;
}

async function updateEntity(
  env: Env,
  table: 'series' | 'categories' | 'artworks' | 'hero_slides',
  id: string,
  body: JsonObject,
  fields: UpdateField[],
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];

  for (const field of fields) {
    if (!(field.key in body)) continue;
    switch (field.kind) {
      case 'string': {
        const value = optionalString(body, field.key);
        if (value === undefined) break;
        sets.push(`${field.column} = ?`);
        values.push(value);
        break;
      }
      case 'nullable-string': {
        const value = nullableString(body, field.key);
        if (value === undefined) break;
        sets.push(`${field.column} = ?`);
        values.push(value);
        break;
      }
      case 'number': {
        const value = optionalNumber(body, field.key);
        if (value === undefined) break;
        sets.push(`${field.column} = ?`);
        values.push(value);
        break;
      }
      case 'nullable-number': {
        const value = nullableNumber(body, field.key);
        if (value === undefined) break;
        sets.push(`${field.column} = ?`);
        values.push(value);
        break;
      }
      case 'boolean': {
        const value = optionalBoolean(body, field.key);
        if (value === undefined) break;
        sets.push(`${field.column} = ?`);
        values.push(value ? 1 : 0);
        break;
      }
    }
  }

  if (sets.length === 0) {
    throw new HttpError(400, '未提供可更新字段');
  }
  sets.push('updated_at = CURRENT_TIMESTAMP');
  const result = await env.DB.prepare(`
    UPDATE ${table}
    SET ${sets.join(', ')}
    WHERE id = ?
  `)
    .bind(...values, id)
    .run();
  if ((result.meta.changes ?? 0) === 0) {
    throw new HttpError(404, '数据不存在');
  }
}

async function createSeries(env: Env, body: JsonObject): Promise<unknown> {
  const titleZh = requiredString(body, 'titleZh', '系列中文名');
  const coverUrl = requiredString(body, 'coverUrl', '系列封面');
  const id = crypto.randomUUID();
  const slug = await uniqueSlug(env, 'series', titleZh);
  await env.DB.prepare(`
    INSERT INTO series (
      id, slug, title_zh, title_en, description,
      year_start, year_end, cover_key, sort_order,
      is_featured, media_type, status, published_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', CURRENT_TIMESTAMP)
  `)
    .bind(
      id,
      slug,
      titleZh,
      optionalString(body, 'titleEn') ?? '',
      optionalString(body, 'description') ?? '',
      optionalNumber(body, 'yearStart') ?? null,
      optionalNumber(body, 'yearEnd') ?? null,
      toMediaKey(env, coverUrl),
      optionalNumber(body, 'sortOrder') ?? 0,
      optionalBoolean(body, 'isFeatured') ? 1 : 0,
      mediaType(body),
    )
    .run();
  return getSeries(env, id);
}

async function createCategory(
  env: Env,
  body: JsonObject,
): Promise<unknown> {
  const nameZh = requiredString(body, 'nameZh', '分类中文名');
  const coverUrl = requiredString(body, 'coverUrl', '分类封面');
  const id = crypto.randomUUID();
  const slug = await uniqueSlug(env, 'categories', nameZh);
  await env.DB.prepare(`
    INSERT INTO categories (
      id, slug, name_zh, name_en, description,
      cover_key, sort_order, media_type, status, published_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', CURRENT_TIMESTAMP)
  `)
    .bind(
      id,
      slug,
      nameZh,
      optionalString(body, 'nameEn') ?? '',
      optionalString(body, 'description') ?? '',
      toMediaKey(env, coverUrl),
      optionalNumber(body, 'sortOrder') ?? 0,
      mediaType(body),
    )
    .run();
  return getCategory(env, id);
}

async function validateRelations(
  env: Env,
  artworkMediaType: MediaType,
  seriesId: string | null | undefined,
  categoryId: string | null | undefined,
): Promise<void> {
  if (seriesId) {
    const row = await env.DB.prepare(`
      SELECT media_type
      FROM series
      WHERE id = ?
      LIMIT 1
    `)
      .bind(seriesId)
      .first<{ media_type: MediaType }>();
    if (!row) throw new HttpError(400, '系列不存在');
    if (row.media_type !== artworkMediaType) {
      throw new HttpError(400, '作品与系列媒体类型不一致');
    }
  }
  if (categoryId) {
    const row = await env.DB.prepare(`
      SELECT media_type
      FROM categories
      WHERE id = ?
      LIMIT 1
    `)
      .bind(categoryId)
      .first<{ media_type: MediaType }>();
    if (!row) throw new HttpError(400, '分类不存在');
    if (row.media_type !== artworkMediaType) {
      throw new HttpError(400, '作品与分类媒体类型不一致');
    }
  }
}

async function createArtwork(
  env: Env,
  body: JsonObject,
): Promise<unknown> {
  const title = requiredString(body, 'title', '作品标题');
  const imageUrl = requiredString(body, 'imageUrl', '作品图片');
  const type = mediaType(body);
  const seriesId = nullableString(body, 'seriesId') ?? null;
  const categoryId = nullableString(body, 'categoryId') ?? null;
  await validateRelations(env, type, seriesId, categoryId);

  const id = crypto.randomUUID();
  const slug = await uniqueSlug(env, 'artworks', title);
  await env.DB.prepare(`
    INSERT INTO artworks (
      id, slug, title, description, image_key, raw_file_key,
      media_type, width, height, series_id, category_id,
      sort_order, is_featured, location, taken_at,
      duration_seconds, fps, quality, file_size,
      camera_model, lens_model, aperture, shutter_speed,
      iso, focal_length, exposure_compensation, white_balance,
      latitude, longitude, shot_direction, shot_altitude,
      shot_angle, camera_position_desc, status, published_at
    )
    VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      'published', CURRENT_TIMESTAMP
    )
  `)
    .bind(
      id,
      slug,
      title,
      optionalString(body, 'description') ?? '',
      toMediaKey(env, imageUrl),
      body.rawFileUrl
        ? toMediaKey(env, String(body.rawFileUrl))
        : null,
      type,
      optionalNumber(body, 'width') ?? null,
      optionalNumber(body, 'height') ?? null,
      seriesId,
      categoryId,
      optionalNumber(body, 'sortOrder') ?? 0,
      nullableString(body, 'location') ?? null,
      nullableString(body, 'takenAt') ?? null,
      optionalNumber(body, 'durationSeconds') ?? null,
      optionalNumber(body, 'fps') ?? null,
      nullableString(body, 'quality') ?? null,
      optionalNumber(body, 'fileSize') ?? null,
      nullableString(body, 'cameraModel') ?? null,
      nullableString(body, 'lensModel') ?? null,
      nullableString(body, 'aperture') ?? null,
      nullableString(body, 'shutterSpeed') ?? null,
      optionalNumber(body, 'iso') ?? null,
      nullableString(body, 'focalLength') ?? null,
      nullableString(body, 'exposureCompensation') ?? null,
      nullableString(body, 'whiteBalance') ?? null,
      optionalNumber(body, 'latitude') ?? null,
      optionalNumber(body, 'longitude') ?? null,
      optionalNumber(body, 'shotDirection') ?? null,
      optionalNumber(body, 'shotAltitude') ?? null,
      optionalNumber(body, 'shotAngle') ?? null,
      nullableString(body, 'cameraPositionDesc') ?? null,
    )
    .run();
  return getArtwork(env, id);
}

async function createHeroSlide(
  env: Env,
  body: JsonObject,
): Promise<unknown> {
  const mediaUrlValue = requiredString(body, 'mediaUrl', '轮播媒体');
  const id = crypto.randomUUID();
  const max = await env.DB.prepare(`
    SELECT COALESCE(MAX(sort_order), -1) AS max_order
    FROM hero_slides
  `).first<{ max_order: number }>();
  await env.DB.prepare(`
    INSERT INTO hero_slides (
      id, media_type, media_key, thumbnail_key,
      title, subtitle, sort_order, is_active
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `)
    .bind(
      id,
      mediaType(body),
      toMediaKey(env, mediaUrlValue),
      body.thumbnailUrl
        ? toMediaKey(env, String(body.thumbnailUrl))
        : null,
      optionalString(body, 'title', 255) ?? '',
      optionalString(body, 'subtitle', 255) ?? '',
      Number(max?.max_order ?? -1) + 1,
    )
    .run();
  const row = await env.DB.prepare(`
    SELECT *
    FROM hero_slides
    WHERE id = ?
    LIMIT 1
  `)
    .bind(id)
    .first<Record<string, unknown>>();
  return row;
}

const OSS_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

const OSS_VIDEO_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

function mediaUploadPolicy(contentType: string, size: number) {
  const imageExtension = OSS_IMAGE_TYPES[contentType];
  const videoExtension = OSS_VIDEO_TYPES[contentType];
  if (!imageExtension && !videoExtension) {
    throw new HttpError(400, '不支持该文件格式');
  }
  const isImage = Boolean(imageExtension);
  const maxSize = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (!Number.isFinite(size) || size <= 0) {
    throw new HttpError(400, '文件大小无效');
  }
  if (size > maxSize) {
    throw new HttpError(
      413,
      isImage ? '图片不能超过 20MB' : '视频不能超过 100MB',
    );
  }
  return {
    extension: imageExtension || videoExtension,
    maxSize,
  };
}

function mediaUploadPrefix(env: Env): string {
  return (
    env.ALIYUN_OSS_PREFIX?.trim().replace(/^\/+|\/+$/g, '') ||
    'uploads'
  );
}

function createMediaObjectKey(env: Env, extension: string): string {
  const now = new Date();
  return [
    mediaUploadPrefix(env),
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    `${crypto.randomUUID()}.${extension}`,
  ].join('/');
}

function assertUploadKey(env: Env, key: string): string {
  const normalized = key.replace(/^\/+/, '');
  if (
    !normalized.startsWith(`${mediaUploadPrefix(env)}/`) ||
    normalized.includes('..') ||
    normalized.length > 500
  ) {
    throw new HttpError(400, '媒体路径无效');
  }
  return normalized;
}

async function signMediaUpload(
  request: Request,
  env: Env,
): Promise<Response> {
  const body = await readJson(request);
  const contentType = requiredString(
    body,
    'contentType',
    '文件类型',
    100,
  );
  const size = optionalNumber(body, 'size');
  if (size === undefined) {
    throw new HttpError(400, '缺少文件大小');
  }
  const policy = mediaUploadPolicy(contentType, size);
  const key = createMediaObjectKey(env, policy.extension);
  const signed = await createOssSignedUrl(env, key, 'PUT', {
    contentType,
    expiresSeconds: 15 * 60,
  });

  return ok({
    key,
    uploadUrl: signed.url,
    url: mediaUrl(env, key),
    headers: {
      'content-type': contentType,
    },
    contentType,
    size,
    expiresAt: signed.expiresAt,
  });
}

async function confirmMediaUpload(
  request: Request,
  env: Env,
): Promise<Response> {
  const body = await readJson(request);
  const key = assertUploadKey(
    env,
    requiredString(body, 'key', '媒体路径', 500),
  );
  const contentType = requiredString(
    body,
    'contentType',
    '文件类型',
    100,
  );
  const size = optionalNumber(body, 'size');
  if (size === undefined) {
    throw new HttpError(400, '缺少文件大小');
  }
  const policy = mediaUploadPolicy(contentType, size);

  const metadata = await getOssObjectMetadata(env, key);
  if (!metadata) {
    throw new HttpError(400, 'OSS 中未找到刚上传的文件');
  }
  const actualSize = metadata.size;
  if (actualSize !== size || actualSize > policy.maxSize) {
    await deleteOssObject(env, key).catch(() => undefined);
    throw new HttpError(400, 'OSS 文件大小校验失败');
  }
  const actualContentType = metadata.contentType;
  if (actualContentType && actualContentType !== contentType) {
    await deleteOssObject(env, key).catch(() => undefined);
    throw new HttpError(400, 'OSS 文件类型校验失败');
  }

  return ok(
    {
      key,
      url: mediaUrl(env, key),
      contentType,
      size,
    },
    { status: 201 },
  );
}

async function proxyMediaUpload(
  request: Request,
  env: Env,
): Promise<Response> {
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    throw new HttpError(400, '请选择要上传的文件');
  }
  const policy = mediaUploadPolicy(file.type, file.size);
  const key = createMediaObjectKey(env, policy.extension);
  const signed = await createOssSignedUrl(env, key, 'PUT', {
    contentType: file.type,
    expiresSeconds: 15 * 60,
  });
  const response = await fetch(signed.url, {
    method: 'PUT',
    headers: {
      'content-type': file.type,
    },
    body: file,
  });
  if (!response.ok) {
    throw new HttpError(
      502,
      `上传到 OSS 失败（HTTP ${response.status}）`,
    );
  }

  const metadata = await getOssObjectMetadata(env, key);
  if (
    !metadata ||
    metadata.size !== file.size ||
    metadata.contentType !== file.type
  ) {
    await deleteOssObject(env, key).catch(() => undefined);
    throw new HttpError(502, 'OSS 文件校验失败');
  }

  return ok(
    {
      key,
      url: mediaUrl(env, key),
      contentType: file.type,
      size: file.size,
    },
    { status: 201 },
  );
}

async function updateHomepageCopy(
  env: Env,
  body: JsonObject,
): Promise<unknown> {
  const entries = Object.entries(body).filter(
    ([key, value]) =>
      key in DEFAULT_HOMEPAGE_COPY && typeof value === 'string',
  );
  if (entries.length === 0) {
    throw new HttpError(400, '未提供可更新文案');
  }
  const statements = entries.map(([key, value]) =>
    env.DB.prepare(`
      INSERT INTO site_settings (setting_key, setting_value)
      VALUES (?, ?)
      ON CONFLICT (setting_key) DO UPDATE SET
        setting_value = excluded.setting_value,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`),
      String(value),
    ),
  );
  await env.DB.batch(statements);
  return getHomepageCopy(env);
}

async function updateSiteSettings(
  env: Env,
  body: JsonObject,
): Promise<unknown> {
  const mapping: Record<string, string> = {
    email: 'email',
    xiaohongshuUrl: 'xiaohongshu_url',
    douyinUrl: 'douyin_url',
    weiboUrl: 'weibo_url',
    instagramUrl: 'instagram_url',
    ctripUrl: 'ctrip_url',
    citiesVisited: 'cities_visited',
    countriesVisited: 'countries_visited',
  };
  const statements = [];
  for (const [key, settingKey] of Object.entries(mapping)) {
    if (!(key in body)) continue;
    const rawValue = body[key];
    const value =
      key === 'citiesVisited' || key === 'countriesVisited'
        ? String(Math.max(0, Math.floor(Number(rawValue) || 0)))
        : String(rawValue ?? '').trim();
    statements.push(
      env.DB.prepare(`
        INSERT INTO site_settings (setting_key, setting_value)
        VALUES (?, ?)
        ON CONFLICT (setting_key) DO UPDATE SET
          setting_value = excluded.setting_value,
          updated_at = CURRENT_TIMESTAMP
      `).bind(settingKey, value),
    );
  }
  if (statements.length === 0) {
    throw new HttpError(400, '未提供可更新设置');
  }
  await env.DB.batch(statements);
  return getSiteSettings(env);
}

async function adminApi(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const { pathname } = url;
  const method = request.method;

  if (pathname === '/api/admin/status' && method === 'GET') {
    const session = await authenticateRequest(request, env);
    return ok({
      isLoggedIn: Boolean(session),
      username: session?.username,
    });
  }

  if (pathname === '/api/admin/login' && method === 'POST') {
    assertSameOrigin(request);
    const body = await readJson(request);
    const result = await loginAdmin(
      request,
      env,
      String(body.username ?? ''),
      String(body.password ?? ''),
    );
    const response = ok({
      token: '',
      username: result.username,
    });
    response.headers.set('set-cookie', result.cookie);
    return response;
  }

  if (pathname === '/api/admin/logout' && method === 'POST') {
    assertSameOrigin(request);
    const response = ok({ success: true });
    response.headers.set(
      'set-cookie',
      await logoutAdmin(request, env),
    );
    return response;
  }

  const session = await requireAdmin(request, env);
  if (
    method !== 'GET' &&
    pathname !== '/api/admin/status'
  ) {
    assertSameOrigin(request);
  }

  if (
    pathname === '/api/admin/change-password' &&
    method === 'POST'
  ) {
    const body = await readJson(request);
    await changeAdminPassword(
      request,
      env,
      session,
      String(body.oldPassword ?? ''),
      String(body.newPassword ?? ''),
    );
    return ok({ success: true });
  }

  if (
    pathname === '/api/admin/media/sign' &&
    method === 'POST'
  ) {
    return signMediaUpload(request, env);
  }

  if (
    pathname === '/api/admin/media/confirm' &&
    method === 'POST'
  ) {
    return confirmMediaUpload(request, env);
  }

  if (
    pathname === '/api/admin/media/proxy' &&
    method === 'POST'
  ) {
    return proxyMediaUpload(request, env);
  }

  if (pathname.startsWith('/api/admin/media/') && method === 'DELETE') {
    const key = assertUploadKey(
      env,
      decodeURIComponent(
        pathname.slice('/api/admin/media/'.length),
      ),
    );
    await deleteOssObject(env, key);
    return ok({ key });
  }

  if (pathname === '/api/admin/series' && method === 'POST') {
    return ok(await createSeries(env, await readJson(request)), {
      status: 201,
    });
  }

  const seriesMatch = pathname.match(
    /^\/api\/admin\/series\/([^/]+)$/,
  );
  if (seriesMatch) {
    const id = decodeURIComponent(seriesMatch[1]);
    if (method === 'PATCH') {
      const body = await readJson(request);
      await updateEntity(env, 'series', id, body, [
        { key: 'titleZh', column: 'title_zh', kind: 'string' },
        { key: 'titleEn', column: 'title_en', kind: 'string' },
        { key: 'description', column: 'description', kind: 'string' },
        { key: 'yearStart', column: 'year_start', kind: 'nullable-number' },
        { key: 'yearEnd', column: 'year_end', kind: 'nullable-number' },
        { key: 'coverUrl', column: 'cover_key', kind: 'string' },
        { key: 'sortOrder', column: 'sort_order', kind: 'number' },
        { key: 'isFeatured', column: 'is_featured', kind: 'boolean' },
        { key: 'mediaType', column: 'media_type', kind: 'string' },
      ]);
      if (body.coverUrl !== undefined) {
        await env.DB.prepare(`
          UPDATE series SET cover_key = ? WHERE id = ?
        `)
          .bind(toMediaKey(env, String(body.coverUrl)), id)
          .run();
      }
      return ok(await getSeries(env, id));
    }
    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM series WHERE id = ?')
        .bind(id)
        .run();
      return ok({ id });
    }
  }

  if (pathname === '/api/admin/categories' && method === 'POST') {
    return ok(await createCategory(env, await readJson(request)), {
      status: 201,
    });
  }

  const categoryMatch = pathname.match(
    /^\/api\/admin\/categories\/([^/]+)$/,
  );
  if (categoryMatch) {
    const id = decodeURIComponent(categoryMatch[1]);
    if (method === 'PATCH') {
      const body = await readJson(request);
      await updateEntity(env, 'categories', id, body, [
        { key: 'nameZh', column: 'name_zh', kind: 'string' },
        { key: 'nameEn', column: 'name_en', kind: 'string' },
        { key: 'description', column: 'description', kind: 'string' },
        { key: 'coverUrl', column: 'cover_key', kind: 'string' },
        { key: 'sortOrder', column: 'sort_order', kind: 'number' },
        { key: 'mediaType', column: 'media_type', kind: 'string' },
      ]);
      if (body.coverUrl !== undefined) {
        await env.DB.prepare(`
          UPDATE categories SET cover_key = ? WHERE id = ?
        `)
          .bind(toMediaKey(env, String(body.coverUrl)), id)
          .run();
      }
      return ok(await getCategory(env, id));
    }
    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM categories WHERE id = ?')
        .bind(id)
        .run();
      return ok({ id });
    }
  }

  if (pathname === '/api/admin/artworks' && method === 'POST') {
    return ok(await createArtwork(env, await readJson(request)), {
      status: 201,
    });
  }

  if (
    pathname === '/api/admin/artworks/assign' &&
    method === 'POST'
  ) {
    const body = await readJson(request);
    const rawIds = body.ids;
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      throw new HttpError(400, '请选择要调整的作品');
    }
    if (rawIds.length > 500) {
      throw new HttpError(400, '单次最多调整 500 个作品');
    }

    const ids = Array.from(
      new Set(
        rawIds.map((id) => {
          if (typeof id !== 'string' || !id.trim()) {
            throw new HttpError(400, '作品 ID 格式错误');
          }
          return id.trim();
        }),
      ),
    );
    const targetType = body.targetType;
    if (targetType !== 'series' && targetType !== 'category') {
      throw new HttpError(400, '归类目标类型错误');
    }
    const targetId = nullableString(body, 'targetId', 100) ?? null;

    let targetMediaType: MediaType | null = null;
    if (targetId) {
      const table = targetType === 'series' ? 'series' : 'categories';
      const target = await env.DB.prepare(`
        SELECT media_type
        FROM ${table}
        WHERE id = ?
        LIMIT 1
      `)
        .bind(targetId)
        .first<{ media_type: MediaType }>();
      if (!target) {
        throw new HttpError(404, '归类目标不存在');
      }
      targetMediaType = target.media_type;
    }

    const placeholders = ids.map(() => '?').join(', ');
    const rows = await env.DB.prepare(`
      SELECT id, media_type
      FROM artworks
      WHERE id IN (${placeholders})
    `)
      .bind(...ids)
      .all<{ id: string; media_type: MediaType }>();
    const found = rows.results ?? [];
    if (found.length !== ids.length) {
      throw new HttpError(404, '部分作品不存在，请刷新后重试');
    }
    const artworkMediaTypes = new Set(
      found.map((row) => row.media_type),
    );
    if (artworkMediaTypes.size !== 1) {
      throw new HttpError(400, '不能同时归类图片和视频作品');
    }
    const artworkMediaType = found[0].media_type;
    if (targetMediaType && targetMediaType !== artworkMediaType) {
      throw new HttpError(400, '作品与归类目标的媒体类型不一致');
    }

    const column =
      targetType === 'series' ? 'series_id' : 'category_id';
    const result = await env.DB.prepare(`
      UPDATE artworks
      SET ${column} = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `)
      .bind(targetId, ...ids)
      .run();

    return ok({
      updated: result.meta.changes ?? ids.length,
      targetType,
      targetId,
    });
  }

  const artworkMatch = pathname.match(
    /^\/api\/admin\/artworks\/([^/]+)$/,
  );
  if (artworkMatch) {
    const id = decodeURIComponent(artworkMatch[1]);
    if (method === 'PATCH') {
      const body = await readJson(request);
      const current = await env.DB.prepare(`
        SELECT media_type
        FROM artworks
        WHERE id = ?
        LIMIT 1
      `)
        .bind(id)
        .first<{ media_type: MediaType }>();
      if (!current) throw new HttpError(404, '作品不存在');
      await validateRelations(
        env,
        current.media_type,
        nullableString(body, 'seriesId'),
        nullableString(body, 'categoryId'),
      );
      await updateEntity(env, 'artworks', id, body, [
        { key: 'title', column: 'title', kind: 'string' },
        { key: 'description', column: 'description', kind: 'string' },
        { key: 'seriesId', column: 'series_id', kind: 'nullable-string' },
        { key: 'categoryId', column: 'category_id', kind: 'nullable-string' },
        { key: 'sortOrder', column: 'sort_order', kind: 'number' },
        { key: 'location', column: 'location', kind: 'nullable-string' },
        { key: 'latitude', column: 'latitude', kind: 'nullable-number' },
        { key: 'longitude', column: 'longitude', kind: 'nullable-number' },
        { key: 'takenAt', column: 'taken_at', kind: 'nullable-string' },
        {
          key: 'shotDirection',
          column: 'shot_direction',
          kind: 'nullable-number',
        },
        {
          key: 'shotAltitude',
          column: 'shot_altitude',
          kind: 'nullable-number',
        },
        { key: 'shotAngle', column: 'shot_angle', kind: 'nullable-number' },
        {
          key: 'cameraPositionDesc',
          column: 'camera_position_desc',
          kind: 'nullable-string',
        },
      ]);
      return ok(await getArtwork(env, id));
    }
    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM artworks WHERE id = ?')
        .bind(id)
        .run();
      return ok({ id });
    }
  }

  if (pathname === '/api/admin/hero-slides' && method === 'POST') {
    return ok(await createHeroSlide(env, await readJson(request)), {
      status: 201,
    });
  }

  if (
    pathname === '/api/admin/hero-slides/reorder' &&
    method === 'POST'
  ) {
    const body = await readJson(request);
    if (!Array.isArray(body.items)) {
      throw new HttpError(400, '轮播排序数据错误');
    }
    const statements = body.items.map((item) => {
      const row = asObject(item);
      const sortOrder = optionalNumber(row, 'sortOrder');
      const id = requiredString(row, 'id', '轮播 ID', 64);
      if (sortOrder === undefined) {
        throw new HttpError(400, '轮播排序值错误');
      }
      return env.DB.prepare(`
        UPDATE hero_slides
        SET sort_order = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(sortOrder, id);
    });
    await env.DB.batch(statements);
    const result = await env.DB.prepare(`
      SELECT * FROM hero_slides ORDER BY sort_order ASC, id ASC
    `).all();
    return ok(result.results ?? []);
  }

  const heroMatch = pathname.match(
    /^\/api\/admin\/hero-slides\/([^/]+)$/,
  );
  if (heroMatch) {
    const id = decodeURIComponent(heroMatch[1]);
    if (method === 'PATCH') {
      const body = await readJson(request);
      await updateEntity(env, 'hero_slides', id, body, [
        { key: 'mediaUrl', column: 'media_key', kind: 'string' },
        { key: 'thumbnailUrl', column: 'thumbnail_key', kind: 'nullable-string' },
        { key: 'title', column: 'title', kind: 'string' },
        { key: 'subtitle', column: 'subtitle', kind: 'string' },
        { key: 'sortOrder', column: 'sort_order', kind: 'number' },
        { key: 'isActive', column: 'is_active', kind: 'boolean' },
      ]);
      if (body.mediaUrl !== undefined) {
        await env.DB.prepare(`
          UPDATE hero_slides SET media_key = ? WHERE id = ?
        `)
          .bind(toMediaKey(env, String(body.mediaUrl)), id)
          .run();
      }
      if (body.thumbnailUrl !== undefined) {
        await env.DB.prepare(`
          UPDATE hero_slides SET thumbnail_key = ? WHERE id = ?
        `)
          .bind(
            body.thumbnailUrl
              ? toMediaKey(env, String(body.thumbnailUrl))
              : null,
            id,
          )
          .run();
      }
      const row = await env.DB.prepare(`
        SELECT * FROM hero_slides WHERE id = ? LIMIT 1
      `)
        .bind(id)
        .first();
      if (!row) throw new HttpError(404, '轮播项不存在');
      return ok(row);
    }
    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM hero_slides WHERE id = ?')
        .bind(id)
        .run();
      return ok({ id });
    }
  }

  if (
    pathname === '/api/admin/homepage-copy' &&
    method === 'PATCH'
  ) {
    return ok(
      await updateHomepageCopy(env, await readJson(request)),
    );
  }

  if (
    pathname === '/api/admin/site-settings' &&
    method === 'PATCH'
  ) {
    return ok(await updateSiteSettings(env, await readJson(request)));
  }

  throw new HttpError(404, '管理接口不存在');
}

export async function handleAdminApi(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  return adminApi(request, env, url);
}
