import type {
  Artwork,
  Category,
  HeroSlide,
  HomepageCopy,
  ListResp,
  LocationMarker,
  Series,
  SiteSettings,
  SiteStats,
} from '../shared/api.interface';
import { DEFAULT_HOMEPAGE_COPY } from '../shared/homepage-defaults';
import type { Env } from './types';

type MediaType = 'image' | 'video';

interface SeriesRow {
  id: string;
  slug: string;
  title_zh: string;
  title_en: string;
  description: string;
  year_start: number | null;
  year_end: number | null;
  cover_key: string;
  sort_order: number;
  is_featured: number;
  media_type: MediaType;
  artwork_count: number;
}

interface CategoryRow {
  id: string;
  slug: string;
  name_zh: string;
  name_en: string;
  description: string;
  cover_key: string;
  sort_order: number;
  media_type: MediaType;
  artwork_count: number;
}

interface ArtworkRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  image_key: string;
  raw_file_key: string | null;
  media_type: MediaType;
  width: number | null;
  height: number | null;
  series_id: string | null;
  category_id: string | null;
  sort_order: number;
  location: string | null;
  taken_at: string | null;
  duration_seconds: number | null;
  fps: number | null;
  quality: string | null;
  file_size: number | null;
  camera_model: string | null;
  lens_model: string | null;
  aperture: string | null;
  shutter_speed: string | null;
  iso: number | null;
  focal_length: string | null;
  exposure_compensation: string | null;
  white_balance: string | null;
  view_count: number;
  latitude: number | null;
  longitude: number | null;
  shot_direction: number | null;
  shot_altitude: number | null;
  shot_angle: number | null;
  camera_position_desc: string | null;
}

interface HeroSlideRow {
  id: string;
  media_type: MediaType;
  media_key: string;
  thumbnail_key: string | null;
  title: string;
  subtitle: string;
  sort_order: number;
  is_active: number;
}

interface SettingRow {
  setting_key: string;
  setting_value: string;
}

function camelToSnake(value: string): string {
  return value.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}

function normalizeMediaType(value: string | null): MediaType | undefined {
  return value === 'image' || value === 'video' ? value : undefined;
}

function assetUrl(env: Env, key: string | null): string {
  if (!key) return '';
  if (/^https?:\/\//i.test(key)) return key;
  const base = env.MEDIA_BASE_URL.trim().replace(/\/+$/, '');
  const path = key.replace(/^\/+/, '');
  return base ? `${base}/${path}` : `/media/${path}`;
}

function mapSeries(env: Env, row: SeriesRow): Series {
  return {
    id: row.id,
    slug: row.slug,
    titleZh: row.title_zh,
    titleEn: row.title_en,
    description: row.description,
    yearStart: row.year_start,
    yearEnd: row.year_end,
    coverUrl: assetUrl(env, row.cover_key),
    sortOrder: Number(row.sort_order),
    isFeatured: Boolean(row.is_featured),
    mediaType: row.media_type,
    artworkCount: Number(row.artwork_count),
  };
}

function mapCategory(env: Env, row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    nameZh: row.name_zh,
    nameEn: row.name_en,
    description: row.description,
    coverUrl: assetUrl(env, row.cover_key),
    sortOrder: Number(row.sort_order),
    mediaType: row.media_type,
    artworkCount: Number(row.artwork_count),
  };
}

function mapArtwork(env: Env, row: ArtworkRow): Artwork {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    imageUrl: assetUrl(env, row.image_key),
    rawFileUrl: row.raw_file_key
      ? assetUrl(env, row.raw_file_key)
      : null,
    mediaType: row.media_type,
    width: row.width,
    height: row.height,
    durationSeconds: row.duration_seconds,
    fps: row.fps,
    quality: row.quality,
    fileSize: row.file_size,
    seriesId: row.series_id,
    categoryId: row.category_id,
    sortOrder: Number(row.sort_order),
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    takenAt: row.taken_at,
    shotDirection: row.shot_direction,
    shotAltitude: row.shot_altitude,
    shotAngle: row.shot_angle,
    cameraPositionDesc: row.camera_position_desc,
    cameraModel: row.camera_model,
    lensModel: row.lens_model,
    aperture: row.aperture,
    shutterSpeed: row.shutter_speed,
    iso: row.iso,
    focalLength: row.focal_length,
    exposureCompensation: row.exposure_compensation,
    whiteBalance: row.white_balance,
  };
}

export async function listSeries(
  env: Env,
  mediaType?: MediaType,
): Promise<ListResp<Series>> {
  const where = ["s.status = 'published'"];
  const bindings: unknown[] = [];
  if (mediaType) {
    where.push('s.media_type = ?');
    bindings.push(mediaType);
  }

  const statement = env.DB.prepare(`
    SELECT
      s.id,
      s.slug,
      s.title_zh,
      s.title_en,
      s.description,
      s.year_start,
      s.year_end,
      s.cover_key,
      s.sort_order,
      s.is_featured,
      s.media_type,
      COUNT(a.id) AS artwork_count
    FROM series s
    LEFT JOIN artworks a
      ON a.series_id = s.id AND a.status = 'published'
    WHERE ${where.join(' AND ')}
    GROUP BY s.id
    ORDER BY s.sort_order ASC, s.id ASC
  `);
  const result = await statement.bind(...bindings).all<SeriesRow>();
  const items = (result.results ?? []).map((row) => mapSeries(env, row));
  return { items, total: items.length };
}

export async function listFeaturedSeries(
  env: Env,
  mediaType?: MediaType,
): Promise<Series[]> {
  const where = ["s.status = 'published'", 's.is_featured = 1'];
  const bindings: unknown[] = [];
  if (mediaType) {
    where.push('s.media_type = ?');
    bindings.push(mediaType);
  }

  const result = await env.DB.prepare(`
    SELECT
      s.id,
      s.slug,
      s.title_zh,
      s.title_en,
      s.description,
      s.year_start,
      s.year_end,
      s.cover_key,
      s.sort_order,
      s.is_featured,
      s.media_type,
      COUNT(a.id) AS artwork_count
    FROM series s
    LEFT JOIN artworks a
      ON a.series_id = s.id AND a.status = 'published'
    WHERE ${where.join(' AND ')}
    GROUP BY s.id
    ORDER BY s.sort_order ASC, s.id ASC
  `)
    .bind(...bindings)
    .all<SeriesRow>();

  return (result.results ?? []).map((row) => mapSeries(env, row));
}

export async function getSeries(
  env: Env,
  idOrSlug: string,
): Promise<Series> {
  const row = await env.DB.prepare(`
    SELECT
      s.id,
      s.slug,
      s.title_zh,
      s.title_en,
      s.description,
      s.year_start,
      s.year_end,
      s.cover_key,
      s.sort_order,
      s.is_featured,
      s.media_type,
      COUNT(a.id) AS artwork_count
    FROM series s
    LEFT JOIN artworks a
      ON a.series_id = s.id AND a.status = 'published'
    WHERE s.status = 'published' AND (s.id = ? OR s.slug = ?)
    GROUP BY s.id
    LIMIT 1
  `)
    .bind(idOrSlug, idOrSlug)
    .first<SeriesRow>();
  if (!row) return Promise.reject(new Error('SERIES_NOT_FOUND'));
  return mapSeries(env, row);
}

export async function listCategories(
  env: Env,
  mediaType?: MediaType,
): Promise<ListResp<Category>> {
  const where = ["c.status = 'published'"];
  const bindings: unknown[] = [];
  if (mediaType) {
    where.push('c.media_type = ?');
    bindings.push(mediaType);
  }

  const result = await env.DB.prepare(`
    SELECT
      c.id,
      c.slug,
      c.name_zh,
      c.name_en,
      c.description,
      c.cover_key,
      c.sort_order,
      c.media_type,
      COUNT(a.id) AS artwork_count
    FROM categories c
    LEFT JOIN artworks a
      ON a.category_id = c.id AND a.status = 'published'
    WHERE ${where.join(' AND ')}
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.id ASC
  `)
    .bind(...bindings)
    .all<CategoryRow>();

  const items = (result.results ?? []).map((row) =>
    mapCategory(env, row),
  );
  return { items, total: items.length };
}

export async function getCategory(
  env: Env,
  idOrSlug: string,
): Promise<Category> {
  const row = await env.DB.prepare(`
    SELECT
      c.id,
      c.slug,
      c.name_zh,
      c.name_en,
      c.description,
      c.cover_key,
      c.sort_order,
      c.media_type,
      COUNT(a.id) AS artwork_count
    FROM categories c
    LEFT JOIN artworks a
      ON a.category_id = c.id AND a.status = 'published'
    WHERE c.status = 'published' AND (c.id = ? OR c.slug = ?)
    GROUP BY c.id
    LIMIT 1
  `)
    .bind(idOrSlug, idOrSlug)
    .first<CategoryRow>();
  if (!row) return Promise.reject(new Error('CATEGORY_NOT_FOUND'));
  return mapCategory(env, row);
}

export async function listArtworks(
  env: Env,
  filters: {
    seriesId?: string;
    categoryId?: string;
    mediaType?: MediaType;
    location?: string;
    cursor?: string;
    limit: number;
  },
): Promise<{ items: Artwork[]; nextCursor: string | null; hasMore: boolean }> {
  const where = ["a.status = 'published'"];
  const bindings: unknown[] = [];

  if (filters.seriesId) {
    where.push('a.series_id = ?');
    bindings.push(filters.seriesId);
  }
  if (filters.categoryId) {
    where.push('a.category_id = ?');
    bindings.push(filters.categoryId);
  }
  if (filters.mediaType) {
    where.push('a.media_type = ?');
    bindings.push(filters.mediaType);
  }
  if (filters.location) {
    where.push('a.location = ?');
    bindings.push(filters.location);
  }
  if (filters.cursor) {
    const [sortOrderRaw, cursorId] = filters.cursor.split(':');
    const sortOrder = Number(sortOrderRaw);
    if (!Number.isFinite(sortOrder) || !cursorId) {
      throw new Error('INVALID_CURSOR');
    }
    where.push('(a.sort_order > ? OR (a.sort_order = ? AND a.id > ?))');
    bindings.push(sortOrder, sortOrder, cursorId);
  }

  const fetchLimit = filters.limit + 1;
  bindings.push(fetchLimit);
  const result = await env.DB.prepare(`
    SELECT a.*
    FROM artworks a
    WHERE ${where.join(' AND ')}
    ORDER BY a.sort_order ASC, a.id ASC
    LIMIT ?
  `)
    .bind(...bindings)
    .all<ArtworkRow>();

  const rows = result.results ?? [];
  const hasMore = rows.length > filters.limit;
  const visible = hasMore ? rows.slice(0, filters.limit) : rows;
  const items = visible.map((row) => mapArtwork(env, row));
  const last = items.at(-1);

  return {
    items,
    nextCursor:
      hasMore && last ? `${last.sortOrder}:${last.id}` : null,
    hasMore,
  };
}

export async function listFeaturedArtworks(
  env: Env,
  mediaType: MediaType,
  limit: number,
): Promise<Artwork[]> {
  const order =
    mediaType === 'image'
      ? 'a.created_at DESC, a.id DESC'
      : 'a.sort_order ASC, a.id ASC';
  const result = await env.DB.prepare(`
    SELECT a.*
    FROM artworks a
    WHERE a.status = 'published' AND a.media_type = ?
    ORDER BY ${order}
    LIMIT ?
  `)
    .bind(mediaType, limit)
    .all<ArtworkRow>();

  return (result.results ?? []).map((row) => mapArtwork(env, row));
}

export async function getArtwork(
  env: Env,
  idOrSlug: string,
): Promise<Artwork> {
  const row = await env.DB.prepare(`
    SELECT a.*
    FROM artworks a
    WHERE a.status = 'published' AND (a.id = ? OR a.slug = ?)
    LIMIT 1
  `)
    .bind(idOrSlug, idOrSlug)
    .first<ArtworkRow>();
  if (!row) return Promise.reject(new Error('ARTWORK_NOT_FOUND'));
  return mapArtwork(env, row);
}

export async function incrementArtworkView(
  env: Env,
  artworkId: string,
  visitorFingerprint: string,
): Promise<{ viewCount: number }> {
  const artworkRow = await env.DB.prepare(`
    SELECT view_count
    FROM artworks
    WHERE id = ? AND status = 'published'
    LIMIT 1
  `)
    .bind(artworkId)
    .first<{ view_count: number }>();
  if (!artworkRow) return Promise.reject(new Error('ARTWORK_NOT_FOUND'));

  const day = new Date().toISOString().slice(0, 10);
  const secret = env.VIEW_HASH_SECRET ?? 'replace-in-production';
  const encoded = new TextEncoder().encode(
    `${visitorFingerprint}|${day}|${secret}`,
  );
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  const visitorHash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  const event = await env.DB.prepare(`
    INSERT INTO view_events (id, artwork_id, visitor_hash, view_day)
    VALUES (?, ?, ?, ?)
    ON CONFLICT (artwork_id, visitor_hash, view_day) DO NOTHING
  `)
    .bind(crypto.randomUUID(), artworkId, visitorHash, day)
    .run();

  if ((event.meta.changes ?? 0) === 0) {
    return { viewCount: Number(artworkRow.view_count) };
  }

  const updated = await env.DB.prepare(`
    UPDATE artworks
    SET view_count = view_count + 1
    WHERE id = ?
    RETURNING view_count
  `)
    .bind(artworkId)
    .first<{ view_count: number }>();

  return { viewCount: Number(updated?.view_count ?? 0) };
}

export async function getSiteSettings(env: Env): Promise<SiteSettings> {
  const result = await env.DB.prepare(`
    SELECT setting_key, setting_value
    FROM site_settings
  `).all<SettingRow>();
  const map = new Map(
    (result.results ?? []).map((row) => [
      row.setting_key,
      row.setting_value,
    ]),
  );

  return {
    email: map.get('email') ?? '',
    xiaohongshuUrl: map.get('xiaohongshu_url') ?? '',
    douyinUrl: map.get('douyin_url') ?? '',
    weiboUrl: map.get('weibo_url') ?? '',
    instagramUrl: map.get('instagram_url') ?? '',
    ctripUrl: map.get('ctrip_url') ?? '',
    citiesVisited: Number(map.get('cities_visited') ?? '0') || 0,
    countriesVisited:
      Number(map.get('countries_visited') ?? '0') || 0,
  };
}

export async function getHomepageCopy(env: Env): Promise<HomepageCopy> {
  const result = await env.DB.prepare(`
    SELECT setting_key, setting_value
    FROM site_settings
  `).all<SettingRow>();
  const map = new Map(
    (result.results ?? []).map((row) => [
      row.setting_key,
      row.setting_value,
    ]),
  );
  const copy: Record<string, string> = {};

  for (const [key, fallback] of Object.entries(DEFAULT_HOMEPAGE_COPY)) {
    const value = map.get(camelToSnake(key));
    copy[key] = value !== undefined ? value : fallback;
  }
  return copy as unknown as HomepageCopy;
}

export async function getHeroSlides(
  env: Env,
  activeOnly: boolean,
): Promise<HeroSlide[]> {
  const where = activeOnly ? 'WHERE is_active = 1' : '';
  const result = await env.DB.prepare(`
    SELECT *
    FROM hero_slides
    ${where}
    ORDER BY sort_order ASC, id ASC
  `).all<HeroSlideRow>();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    mediaType: row.media_type,
    mediaUrl: assetUrl(env, row.media_key),
    thumbnailUrl: row.thumbnail_key
      ? assetUrl(env, row.thumbnail_key)
      : undefined,
    title: row.title,
    subtitle: row.subtitle,
    sortOrder: Number(row.sort_order),
    isActive: Boolean(row.is_active),
  }));
}

export async function getLocationMarkers(
  env: Env,
): Promise<LocationMarker[]> {
  const result = await env.DB.prepare(`
    SELECT
      location AS name,
      latitude,
      longitude,
      COUNT(id) AS artwork_count
    FROM artworks
    WHERE
      status = 'published'
      AND location IS NOT NULL
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
    GROUP BY location, latitude, longitude
    ORDER BY location ASC
  `).all<{
    name: string;
    latitude: number;
    longitude: number;
    artwork_count: number;
  }>();

  return (result.results ?? []).map((row) => ({
    name: row.name,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    artworkCount: Number(row.artwork_count),
  }));
}

export async function getStats(env: Env): Promise<SiteStats> {
  const [artworks, views, settings] = await env.DB.batch([
    env.DB.prepare(`
      SELECT COUNT(*) AS total
      FROM artworks
      WHERE status = 'published'
    `),
    env.DB.prepare(`
      SELECT COALESCE(SUM(view_count), 0) AS total
      FROM artworks
      WHERE status = 'published'
    `),
    env.DB.prepare(`
      SELECT setting_key, setting_value
      FROM site_settings
      WHERE setting_key IN ('cities_visited', 'countries_visited')
    `),
  ]);

  const artworkTotal = Number(
    artworks.results?.[0]?.total ?? 0,
  );
  const viewTotal = Number(views.results?.[0]?.total ?? 0);
  const settingMap = new Map(
    (settings.results ?? []).map((row) => [
      String(row.setting_key),
      Number(row.setting_value),
    ]),
  );

  return {
    totalArtworks: artworkTotal,
    totalViews: viewTotal,
    citiesVisited: settingMap.get('cities_visited') ?? 0,
    countriesVisited:
      settingMap.get('countries_visited') ?? 0,
  };
}

export async function getSitemapEntries(
  env: Env,
): Promise<Array<{ path: string; updatedAt: string }>> {
  const [seriesRows, categoryRows] = await env.DB.batch([
    env.DB.prepare(`
      SELECT slug, updated_at
      FROM series
      WHERE status = 'published'
      ORDER BY updated_at DESC
    `),
    env.DB.prepare(`
      SELECT slug, updated_at
      FROM categories
      WHERE status = 'published'
      ORDER BY updated_at DESC
    `),
  ]);

  return [
    ...(seriesRows.results ?? []).map((row) => ({
      path: `/series/${encodeURIComponent(String(row.slug))}`,
      updatedAt: String(row.updated_at),
    })),
    ...(categoryRows.results ?? []).map((row) => ({
      path: `/category/${encodeURIComponent(String(row.slug))}`,
      updatedAt: String(row.updated_at),
    })),
  ];
}

export { normalizeMediaType };
