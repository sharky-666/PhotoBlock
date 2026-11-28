import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  or,
  sql,
} from 'drizzle-orm';
import {
  artwork,
  category,
  heroSlide,
  series,
  siteSettings,
} from '@server/database/schema';
import type {
  Artwork,
  Category,
  HeroSlide,
  ListResp,
  Series,
  SiteSettings,
  SiteStats,
  HomepageCopy,
  LocationMarker,
} from '@shared/api.interface';
import { DEFAULT_HOMEPAGE_COPY } from '@shared/homepage-defaults';
import type { CreateArtworkDto, UpdateArtworkDto } from './dto/artwork.dto';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import type { CreateSeriesDto, UpdateSeriesDto } from './dto/series.dto';

const camelToSnake = (str: string): string =>
  str.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ── Series ──────────────────────────────────────────────

  async listSeries(mediaType?: 'image' | 'video'): Promise<ListResp<Series>> {
    const conditions = [];
    if (mediaType) conditions.push(eq(series.mediaType, mediaType));

    const query = conditions.length > 0
      ? this.db
        .select({
          id: series.id,
          titleZh: series.titleZh,
          titleEn: series.titleEn,
          description: series.description,
          yearStart: series.yearStart,
          yearEnd: series.yearEnd,
          coverUrl: series.coverUrl,
          sortOrder: series.sortOrder,
          isFeatured: series.isFeatured,
          mediaType: series.mediaType,
          artworkCount: count(artwork.id),
        })
        .from(series)
        .leftJoin(artwork, eq(artwork.seriesId, series.id))
        .where(and(...conditions))
        .groupBy(series.id)
        .orderBy(asc(series.sortOrder), asc(series.id))
      : this.db
        .select({
          id: series.id,
          titleZh: series.titleZh,
          titleEn: series.titleEn,
          description: series.description,
          yearStart: series.yearStart,
          yearEnd: series.yearEnd,
          coverUrl: series.coverUrl,
          sortOrder: series.sortOrder,
          isFeatured: series.isFeatured,
          mediaType: series.mediaType,
          artworkCount: count(artwork.id),
        })
        .from(series)
        .leftJoin(artwork, eq(artwork.seriesId, series.id))
        .groupBy(series.id)
        .orderBy(asc(series.sortOrder), asc(series.id));

    const rows = await query;

    const items: Series[] = rows.map((row) => ({
      ...row,
      mediaType: row.mediaType as 'image' | 'video',
      artworkCount: Number(row.artworkCount),
    }));

    return { items, total: items.length };
  }

  async listFeaturedSeries(mediaType?: 'image' | 'video'): Promise<Series[]> {
    const conditions = [eq(series.isFeatured, true)];
    if (mediaType) conditions.push(eq(series.mediaType, mediaType));

    const rows = await this.db
      .select({
        id: series.id,
        titleZh: series.titleZh,
        titleEn: series.titleEn,
        description: series.description,
        yearStart: series.yearStart,
        yearEnd: series.yearEnd,
        coverUrl: series.coverUrl,
        sortOrder: series.sortOrder,
        isFeatured: series.isFeatured,
        mediaType: series.mediaType,
        artworkCount: count(artwork.id),
      })
      .from(series)
      .leftJoin(artwork, eq(artwork.seriesId, series.id))
      .where(and(...conditions))
      .groupBy(series.id)
      .orderBy(asc(series.sortOrder), asc(series.id));

    return rows.map((row) => ({
      ...row,
      mediaType: row.mediaType as 'image' | 'video',
      artworkCount: Number(row.artworkCount),
    }));
  }

  async getSeries(id: string): Promise<Series> {
    const rows = await this.db
      .select({
        id: series.id,
        titleZh: series.titleZh,
        titleEn: series.titleEn,
        description: series.description,
        yearStart: series.yearStart,
        yearEnd: series.yearEnd,
        coverUrl: series.coverUrl,
        sortOrder: series.sortOrder,
        isFeatured: series.isFeatured,
        mediaType: series.mediaType,
        artworkCount: count(artwork.id),
      })
      .from(series)
      .leftJoin(artwork, eq(artwork.seriesId, series.id))
      .where(eq(series.id, id))
      .groupBy(series.id);

    if (rows.length === 0) {
      throw new NotFoundException('系列不存在');
    }

    return {
      ...rows[0],
      mediaType: rows[0].mediaType as 'image' | 'video',
      artworkCount: Number(rows[0].artworkCount),
    };
  }

  async createSeries(dto: CreateSeriesDto): Promise<Series> {
    const inserted = await this.db
      .insert(series)
      .values({
        titleZh: dto.titleZh,
        titleEn: dto.titleEn,
        description: dto.description,
        yearStart: dto.yearStart ?? null,
        yearEnd: dto.yearEnd ?? null,
        coverUrl: dto.coverUrl,
        mediaType: dto.mediaType ?? 'image',
        sortOrder: dto.sortOrder ?? 0,
        isFeatured: dto.isFeatured ?? false,
      })
      .returning({ id: series.id });

    return this.getSeries(inserted[0].id);
  }

  async updateSeries(id: string, dto: UpdateSeriesDto): Promise<Series> {
    const patch: Partial<typeof series.$inferInsert> = {};
    if (dto.titleZh !== undefined) patch.titleZh = dto.titleZh;
    if (dto.titleEn !== undefined) patch.titleEn = dto.titleEn;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.yearStart !== undefined) patch.yearStart = dto.yearStart ?? null;
    if (dto.yearEnd !== undefined) patch.yearEnd = dto.yearEnd ?? null;
    if (dto.coverUrl !== undefined) patch.coverUrl = dto.coverUrl;
    if (dto.mediaType !== undefined) patch.mediaType = dto.mediaType;
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;
    if (dto.isFeatured !== undefined) patch.isFeatured = dto.isFeatured;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(series)
      .set(patch)
      .where(eq(series.id, id))
      .returning({ id: series.id });

    if (updated.length === 0) {
      throw new NotFoundException('系列不存在');
    }

    return this.getSeries(updated[0].id);
  }

  async deleteSeries(id: string): Promise<{ id: string }> {
    const deleted = await this.db
      .delete(series)
      .where(eq(series.id, id))
      .returning({ id: series.id });

    if (deleted.length === 0) {
      throw new NotFoundException('系列不存在');
    }

    return { id: deleted[0].id };
  }

  // ── Category ────────────────────────────────────────────

  async listCategories(mediaType?: 'image' | 'video'): Promise<ListResp<Category>> {
    const conditions = [];
    if (mediaType) conditions.push(eq(category.mediaType, mediaType));

    const query = conditions.length > 0
      ? this.db
        .select({
          id: category.id,
          nameZh: category.nameZh,
          nameEn: category.nameEn,
          description: category.description,
          coverUrl: category.coverUrl,
          sortOrder: category.sortOrder,
          mediaType: category.mediaType,
          artworkCount: count(artwork.id),
        })
        .from(category)
        .leftJoin(artwork, eq(artwork.categoryId, category.id))
        .where(and(...conditions))
        .groupBy(category.id)
        .orderBy(asc(category.sortOrder), asc(category.id))
      : this.db
        .select({
          id: category.id,
          nameZh: category.nameZh,
          nameEn: category.nameEn,
          description: category.description,
          coverUrl: category.coverUrl,
          sortOrder: category.sortOrder,
          mediaType: category.mediaType,
          artworkCount: count(artwork.id),
        })
        .from(category)
        .leftJoin(artwork, eq(artwork.categoryId, category.id))
        .groupBy(category.id)
        .orderBy(asc(category.sortOrder), asc(category.id));

    const rows = await query;

    const items: Category[] = rows.map((row) => ({
      ...row,
      mediaType: row.mediaType as 'image' | 'video',
      artworkCount: Number(row.artworkCount),
    }));

    return { items, total: items.length };
  }

  async getCategory(id: string): Promise<Category> {
    const rows = await this.db
      .select({
        id: category.id,
        nameZh: category.nameZh,
        nameEn: category.nameEn,
        description: category.description,
        coverUrl: category.coverUrl,
        sortOrder: category.sortOrder,
        mediaType: category.mediaType,
        artworkCount: count(artwork.id),
      })
      .from(category)
      .leftJoin(artwork, eq(artwork.categoryId, category.id))
      .where(eq(category.id, id))
      .groupBy(category.id);

    if (rows.length === 0) {
      throw new NotFoundException('分类不存在');
    }

    return {
      ...rows[0],
      mediaType: rows[0].mediaType as 'image' | 'video',
      artworkCount: Number(rows[0].artworkCount),
    };
  }

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    const inserted = await this.db
      .insert(category)
      .values({
        nameZh: dto.nameZh,
        nameEn: dto.nameEn,
        description: dto.description,
        coverUrl: dto.coverUrl,
        mediaType: dto.mediaType ?? 'image',
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning({ id: category.id });

    return this.getCategory(inserted[0].id);
  }

  async updateCategory(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const patch: Partial<typeof category.$inferInsert> = {};
    if (dto.nameZh !== undefined) patch.nameZh = dto.nameZh;
    if (dto.nameEn !== undefined) patch.nameEn = dto.nameEn;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.coverUrl !== undefined) patch.coverUrl = dto.coverUrl;
    if (dto.mediaType !== undefined) patch.mediaType = dto.mediaType;
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(category)
      .set(patch)
      .where(eq(category.id, id))
      .returning({ id: category.id });

    if (updated.length === 0) {
      throw new NotFoundException('分类不存在');
    }

    return this.getCategory(updated[0].id);
  }

  async deleteCategory(id: string): Promise<{ id: string }> {
    const deleted = await this.db
      .delete(category)
      .where(eq(category.id, id))
      .returning({ id: category.id });

    if (deleted.length === 0) {
      throw new NotFoundException('分类不存在');
    }

    return { id: deleted[0].id };
  }

  // ── Artwork ─────────────────────────────────────────────

  async listArtworks(
    seriesId: string | undefined,
    categoryId: string | undefined,
    cursor: string | undefined,
    limit: number,
    mediaType: string | undefined,
    location?: string,
  ): Promise<{
    items: Artwork[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const effectiveLimit = Math.min(limit || 20, 200);
    const fetchLimit = effectiveLimit + 1;

    const conditions = [];
    if (seriesId) conditions.push(eq(artwork.seriesId, seriesId));
    if (categoryId) conditions.push(eq(artwork.categoryId, categoryId));
    if (mediaType) conditions.push(eq(artwork.mediaType, mediaType));
    if (location) conditions.push(eq(artwork.location, location));

    if (cursor) {
      const [sortOrderStr, cursorId] = cursor.split(':');
      if (!sortOrderStr || !cursorId) {
        throw new BadRequestException('cursor 格式错误');
      }
      const cursorSortOrder = Number(sortOrderStr);
      if (Number.isNaN(cursorSortOrder)) {
        throw new BadRequestException('cursor 格式错误');
      }
      conditions.push(
        or(
          gt(artwork.sortOrder, cursorSortOrder),
          and(
            eq(artwork.sortOrder, cursorSortOrder),
            gt(artwork.id, cursorId),
          ),
        ),
      );
    }

    const query = conditions.length > 0
      ? this.db
          .select()
          .from(artwork)
          .where(and(...conditions))
          .orderBy(asc(artwork.sortOrder), asc(artwork.id))
          .limit(fetchLimit)
      : this.db
          .select()
          .from(artwork)
          .orderBy(asc(artwork.sortOrder), asc(artwork.id))
          .limit(fetchLimit);

    const rows = await query;

    const hasMore = rows.length > effectiveLimit;
    const visibleRows = hasMore ? rows.slice(0, effectiveLimit) : rows;

    const items: Artwork[] = visibleRows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl,
      rawFileUrl: row.rawFileUrl ?? null,
      mediaType: row.mediaType as 'image' | 'video',
      width: row.width,
      height: row.height,
      durationSeconds: row.durationSeconds ?? null,
      fps: row.fps ? Number(row.fps) : null,
      quality: row.quality ?? null,
      seriesId: row.seriesId,
      categoryId: row.categoryId,
      sortOrder: row.sortOrder,
      location: row.location,
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
      shotDirection: row.shotDirection ? Number(row.shotDirection) : null,
      shotAltitude: row.shotAltitude ? Number(row.shotAltitude) : null,
      shotAngle: row.shotAngle ? Number(row.shotAngle) : null,
      cameraPositionDesc: row.cameraPositionDesc ?? null,
      takenAt: row.takenAt ? String(row.takenAt) : null,
      fileSize: row.fileSize ?? null,
      cameraModel: row.cameraModel ?? null,
      lensModel: row.lensModel ?? null,
      aperture: row.aperture ?? null,
      shutterSpeed: row.shutterSpeed ?? null,
      iso: row.iso ?? null,
      focalLength: row.focalLength ?? null,
      exposureCompensation: row.exposureCompensation ?? null,
      whiteBalance: row.whiteBalance ?? null,
    }));

    const lastItem = items[items.length - 1];
    const nextCursor =
      hasMore && lastItem ? `${lastItem.sortOrder}:${lastItem.id}` : null;

    return { items, nextCursor, hasMore };
  }

  async listFeaturedVideos(limit: number = 8): Promise<Artwork[]> {
    const effectiveLimit = Math.min(limit, 20);
    const rows = await this.db
      .select()
      .from(artwork)
      .where(eq(artwork.mediaType, 'video'))
      .orderBy(asc(artwork.sortOrder), asc(artwork.id))
      .limit(effectiveLimit);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl,
      rawFileUrl: row.rawFileUrl ?? null,
      mediaType: row.mediaType as 'image' | 'video',
      width: row.width,
      height: row.height,
      durationSeconds: row.durationSeconds ?? null,
      fps: row.fps ? Number(row.fps) : null,
      quality: row.quality ?? null,
      seriesId: row.seriesId,
      categoryId: row.categoryId,
      sortOrder: row.sortOrder,
      location: row.location,
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
      shotDirection: row.shotDirection ? Number(row.shotDirection) : null,
      shotAltitude: row.shotAltitude ? Number(row.shotAltitude) : null,
      shotAngle: row.shotAngle ? Number(row.shotAngle) : null,
      cameraPositionDesc: row.cameraPositionDesc ?? null,
      takenAt: row.takenAt ? String(row.takenAt) : null,
      fileSize: row.fileSize ?? null,
      cameraModel: row.cameraModel ?? null,
      lensModel: row.lensModel ?? null,
      aperture: row.aperture ?? null,
      shutterSpeed: row.shutterSpeed ?? null,
      iso: row.iso ?? null,
      focalLength: row.focalLength ?? null,
      exposureCompensation: row.exposureCompensation ?? null,
      whiteBalance: row.whiteBalance ?? null,
    }));
  }

  async listFeaturedImages(limit: number = 6): Promise<Artwork[]> {
    const effectiveLimit = Math.min(limit, 20);
    const rows = await this.db
      .select()
      .from(artwork)
      .where(eq(artwork.mediaType, 'image'))
      .orderBy(desc(artwork.createdAt), desc(artwork.id))
      .limit(effectiveLimit);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl,
      rawFileUrl: row.rawFileUrl ?? null,
      mediaType: row.mediaType as 'image' | 'video',
      width: row.width,
      height: row.height,
      durationSeconds: row.durationSeconds ?? null,
      fps: row.fps ? Number(row.fps) : null,
      quality: row.quality ?? null,
      seriesId: row.seriesId,
      categoryId: row.categoryId,
      sortOrder: row.sortOrder,
      location: row.location,
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
      shotDirection: row.shotDirection ? Number(row.shotDirection) : null,
      shotAltitude: row.shotAltitude ? Number(row.shotAltitude) : null,
      shotAngle: row.shotAngle ? Number(row.shotAngle) : null,
      cameraPositionDesc: row.cameraPositionDesc ?? null,
      takenAt: row.takenAt ? String(row.takenAt) : null,
      fileSize: row.fileSize ?? null,
      cameraModel: row.cameraModel ?? null,
      lensModel: row.lensModel ?? null,
      aperture: row.aperture ?? null,
      shutterSpeed: row.shutterSpeed ?? null,
      iso: row.iso ?? null,
      focalLength: row.focalLength ?? null,
      exposureCompensation: row.exposureCompensation ?? null,
      whiteBalance: row.whiteBalance ?? null,
    }));
  }

  async getArtwork(id: string): Promise<Artwork> {
    const rows = await this.db
      .select()
      .from(artwork)
      .where(eq(artwork.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('作品不存在');
    }

    const row = rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl,
      rawFileUrl: row.rawFileUrl ?? null,
      mediaType: row.mediaType as 'image' | 'video',
      width: row.width,
      height: row.height,
      durationSeconds: row.durationSeconds ?? null,
      fps: row.fps ? Number(row.fps) : null,
      quality: row.quality ?? null,
      seriesId: row.seriesId,
      categoryId: row.categoryId,
      sortOrder: row.sortOrder,
      location: row.location,
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
      shotDirection: row.shotDirection ? Number(row.shotDirection) : null,
      shotAltitude: row.shotAltitude ? Number(row.shotAltitude) : null,
      shotAngle: row.shotAngle ? Number(row.shotAngle) : null,
      cameraPositionDesc: row.cameraPositionDesc ?? null,
      takenAt: row.takenAt ? String(row.takenAt) : null,
      fileSize: row.fileSize ?? null,
      cameraModel: row.cameraModel ?? null,
      lensModel: row.lensModel ?? null,
      aperture: row.aperture ?? null,
      shutterSpeed: row.shutterSpeed ?? null,
      iso: row.iso ?? null,
      focalLength: row.focalLength ?? null,
      exposureCompensation: row.exposureCompensation ?? null,
      whiteBalance: row.whiteBalance ?? null,
    };
  }

  async createArtwork(dto: CreateArtworkDto): Promise<Artwork> {
    const mediaType = dto.mediaType ?? 'image';
    await this.validateArtworkRelations(mediaType, dto.seriesId, dto.categoryId);

    const inserted = await this.db
      .insert(artwork)
      .values({
        title: dto.title,
        description: dto.description ?? '',
        imageUrl: dto.imageUrl,
        rawFileUrl: dto.rawFileUrl ?? null,
        mediaType,
        width: dto.width ?? null,
        height: dto.height ?? null,
        durationSeconds: dto.durationSeconds ?? null,
        fps: dto.fps !== undefined ? String(dto.fps) : null,
        quality: dto.quality ?? null,
        seriesId: dto.seriesId ?? null,
        categoryId: dto.categoryId ?? null,
        sortOrder: dto.sortOrder ?? 0,
        location: dto.location ?? null,
        latitude: dto.latitude !== undefined ? String(dto.latitude) : null,
        longitude: dto.longitude !== undefined ? String(dto.longitude) : null,
        shotDirection: dto.shotDirection !== undefined ? String(dto.shotDirection) : null,
        shotAltitude: dto.shotAltitude !== undefined ? String(dto.shotAltitude) : null,
        shotAngle: dto.shotAngle !== undefined ? String(dto.shotAngle) : null,
        cameraPositionDesc: dto.cameraPositionDesc ?? null,
        takenAt: dto.takenAt ?? null,
        fileSize: dto.fileSize ?? null,
        cameraModel: dto.cameraModel ?? null,
        lensModel: dto.lensModel ?? null,
        aperture: dto.aperture ?? null,
        shutterSpeed: dto.shutterSpeed ?? null,
        iso: dto.iso ?? null,
        focalLength: dto.focalLength ?? null,
        exposureCompensation: dto.exposureCompensation ?? null,
        whiteBalance: dto.whiteBalance ?? null,
      })
      .returning({ id: artwork.id });

    return this.getArtwork(inserted[0].id);
  }

  async updateArtwork(id: string, dto: UpdateArtworkDto): Promise<Artwork> {
    const patch: Partial<typeof artwork.$inferInsert> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.seriesId !== undefined) patch.seriesId = dto.seriesId ?? null;
    if (dto.categoryId !== undefined)
      patch.categoryId = dto.categoryId ?? null;
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;
    if (dto.location !== undefined) patch.location = dto.location;
    if (dto.latitude !== undefined) patch.latitude = dto.latitude != null ? String(dto.latitude) : null;
    if (dto.longitude !== undefined) patch.longitude = dto.longitude != null ? String(dto.longitude) : null;
    if (dto.shotDirection !== undefined) patch.shotDirection = dto.shotDirection != null ? String(dto.shotDirection) : null;
    if (dto.shotAltitude !== undefined) patch.shotAltitude = dto.shotAltitude != null ? String(dto.shotAltitude) : null;
    if (dto.shotAngle !== undefined) patch.shotAngle = dto.shotAngle != null ? String(dto.shotAngle) : null;
    if (dto.cameraPositionDesc !== undefined) patch.cameraPositionDesc = dto.cameraPositionDesc ?? null;
    if (dto.takenAt !== undefined) patch.takenAt = dto.takenAt ?? null;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    if (dto.seriesId !== undefined || dto.categoryId !== undefined) {
      const existing = await this.db
        .select({ mediaType: artwork.mediaType })
        .from(artwork)
        .where(eq(artwork.id, id))
        .limit(1);
      if (existing.length === 0) {
        throw new NotFoundException('作品不存在');
      }
      await this.validateArtworkRelations(
        existing[0].mediaType as 'image' | 'video',
        dto.seriesId !== undefined ? dto.seriesId : undefined,
        dto.categoryId !== undefined ? dto.categoryId : undefined,
      );
    }

    const updated = await this.db
      .update(artwork)
      .set(patch)
      .where(eq(artwork.id, id))
      .returning({ id: artwork.id });

    if (updated.length === 0) {
      throw new NotFoundException('作品不存在');
    }

    return this.getArtwork(updated[0].id);
  }

  async deleteArtwork(id: string): Promise<{ id: string }> {
    const deleted = await this.db
      .delete(artwork)
      .where(eq(artwork.id, id))
      .returning({ id: artwork.id });

    if (deleted.length === 0) {
      throw new NotFoundException('作品不存在');
    }

    return { id: deleted[0].id };
  }

  async getLocationMarkers(): Promise<LocationMarker[]> {
    const rows = await this.db
      .select({
        name: artwork.location,
        latitude: artwork.latitude,
        longitude: artwork.longitude,
        artworkCount: count(artwork.id),
      })
      .from(artwork)
      .where(
        and(
          isNotNull(artwork.location),
          isNotNull(artwork.latitude),
          isNotNull(artwork.longitude),
        ),
      )
      .groupBy(artwork.location, artwork.latitude, artwork.longitude)
      .orderBy(artwork.location);

    return rows.map((row) => ({
      name: row.name as string,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      artworkCount: Number(row.artworkCount),
    }));
  }

  private async validateArtworkRelations(
    mediaType: 'image' | 'video',
    seriesId: string | undefined | null,
    categoryId: string | undefined | null,
  ): Promise<void> {
    if (seriesId) {
      const seriesRows = await this.db
        .select({ mediaType: series.mediaType })
        .from(series)
        .where(eq(series.id, seriesId))
        .limit(1);
      if (seriesRows.length === 0) {
        throw new BadRequestException('系列不存在');
      }
      if (seriesRows[0].mediaType !== mediaType) {
        throw new BadRequestException(
          mediaType === 'image'
            ? '图片作品不能归入视频系列'
            : '视频作品不能归入图片系列',
        );
      }
    }
    if (categoryId) {
      const categoryRows = await this.db
        .select({ mediaType: category.mediaType })
        .from(category)
        .where(eq(category.id, categoryId))
        .limit(1);
      if (categoryRows.length === 0) {
        throw new BadRequestException('分类不存在');
      }
      if (categoryRows[0].mediaType !== mediaType) {
        throw new BadRequestException(
          mediaType === 'image'
            ? '图片作品不能归入视频分类'
            : '视频作品不能归入图片分类',
        );
      }
    }
  }

  // ── Stats ───────────────────────────────────────────────

  async getStats(): Promise<SiteStats> {
    const [artworksResult, viewsResult, settingsResult] = await Promise.all([
      this.db.select({ count: count() }).from(artwork),
      this.db
        .select({ total: sql<number>`coalesce(sum(${artwork.viewCount}), 0)` })
        .from(artwork),
      this.db
        .select({
          settingKey: siteSettings.settingKey,
          settingValue: siteSettings.settingValue,
        })
        .from(siteSettings)
        .where(
          inArray(siteSettings.settingKey, [
            'cities_visited',
            'countries_visited',
          ]),
        ),
    ]);

    const settingMap = new Map<string, number>();
    for (const row of settingsResult) {
      const n = Number(row.settingValue);
      if (Number.isFinite(n)) settingMap.set(row.settingKey, Math.floor(n));
    }

    return {
      totalViews: Number(viewsResult[0]?.total ?? 0),
      totalArtworks: Number(artworksResult[0].count),
      citiesVisited: settingMap.get('cities_visited') ?? 0,
      countriesVisited: settingMap.get('countries_visited') ?? 0,
    };
  }

  // ── Site Settings ───────────────────────────────────────

  async getSiteSettings(): Promise<SiteSettings> {
    const rows = await this.db.select().from(siteSettings);
    const map = new Map<string, string>();
    for (const row of rows) {
      map.set(row.settingKey, row.settingValue);
    }
    return {
      email: map.get('email') ?? '',
      xiaohongshuUrl: map.get('xiaohongshu_url') ?? '',
      douyinUrl: map.get('douyin_url') ?? '',
      weiboUrl: map.get('weibo_url') ?? '',
      instagramUrl: map.get('instagram_url') ?? '',
      ctripUrl: map.get('ctrip_url') ?? '',
      citiesVisited: Number(map.get('cities_visited') ?? '0') || 0,
      countriesVisited: Number(map.get('countries_visited') ?? '0') || 0,
    };
  }

  async updateSiteSettings(patch: Record<string, string>): Promise<SiteSettings> {
    const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
    if (entries.length === 0) {
      return this.getSiteSettings();
    }
    const urlKeys = new Set([
      'xiaohongshu_url',
      'douyin_url',
      'weibo_url',
      'instagram_url',
      'ctrip_url',
    ]);
    const numericKeys = new Set(['cities_visited', 'countries_visited']);
    const normalizeUrl = (key: string, value: string): string => {
      const trimmed = value.trim();
      if (!urlKeys.has(key)) return trimmed;
      if (!trimmed) return '';
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      return `https://${trimmed}`;
    };
    const normalizeNumeric = (value: string): string => {
      const n = Math.floor(Number(value));
      return Number.isFinite(n) && n >= 0 ? String(n) : '0';
    };
    await this.db.transaction(async (tx) => {
      for (const [key, value] of entries) {
        const normalized = numericKeys.has(key)
          ? normalizeNumeric(value)
          : normalizeUrl(key, value);
        await tx
          .insert(siteSettings)
          .values({ settingKey: key, settingValue: normalized })
          .onConflictDoUpdate({
            target: siteSettings.settingKey,
            set: { settingValue: normalized },
          });
      }
    });
    return this.getSiteSettings();
  }

  async incrementArtworkView(id: string): Promise<{ viewCount: number }> {
    const updated = await this.db
      .update(artwork)
      .set({ viewCount: sql`${artwork.viewCount} + 1` })
      .where(eq(artwork.id, id))
      .returning({ viewCount: artwork.viewCount });
    if (updated.length === 0) throw new NotFoundException('作品不存在');
    return { viewCount: Number(updated[0].viewCount) };
  }

  async getHomepageCopy(): Promise<HomepageCopy> {
    const rows = await this.db.select().from(siteSettings);
    const map = new Map<string, string>();
    for (const row of rows) {
      map.set(row.settingKey, row.settingValue);
    }
    const defaults = DEFAULT_HOMEPAGE_COPY;
    const result: Record<string, string> = {};
    for (const [key, defaultValue] of Object.entries(defaults)) {
      const snakeKey = camelToSnake(key);
      const val = map.get(snakeKey);
      result[key] = val !== undefined && val !== '' ? val : defaultValue;
    }
    return result as unknown as HomepageCopy;
  }

  async updateHomepageCopy(
    patch: Record<string, string>,
  ): Promise<HomepageCopy> {
    const entries = Object.entries(patch).filter(
      ([, v]) => v !== undefined,
    );
    await this.db.transaction(async (tx) => {
      for (const [camelKey, value] of entries) {
        const snakeKey = camelToSnake(camelKey);
        await tx
          .insert(siteSettings)
          .values({ settingKey: snakeKey, settingValue: value })
          .onConflictDoUpdate({
            target: siteSettings.settingKey,
            set: { settingValue: value },
          });
      }
    });
    return this.getHomepageCopy();
  }

  async getHeroSlides(activeOnly = false): Promise<HeroSlide[]> {
    const conditions = [];
    if (activeOnly) conditions.push(eq(heroSlide.isActive, true));
    const query = conditions.length > 0
      ? this.db.select().from(heroSlide).where(and(...conditions)).orderBy(asc(heroSlide.sortOrder), asc(heroSlide.id))
      : this.db.select().from(heroSlide).orderBy(asc(heroSlide.sortOrder), asc(heroSlide.id));
    const rows = await query;
    return rows.map((r) => ({
      id: r.id,
      mediaType: r.mediaType as 'image' | 'video',
      mediaUrl: r.mediaUrl,
      thumbnailUrl: r.thumbnailUrl ?? undefined,
      title: r.title,
      subtitle: r.subtitle,
      sortOrder: r.sortOrder,
      isActive: r.isActive,
    }));
  }

  async createHeroSlide(dto: { mediaType: string; mediaUrl: string; thumbnailUrl?: string; title?: string; subtitle?: string }): Promise<HeroSlide> {
    const maxRow = await this.db
      .select({ max: sql<number>`coalesce(max(${heroSlide.sortOrder}), -1)` })
      .from(heroSlide);
    const nextOrder = Number(maxRow[0].max) + 1;

    const inserted = await this.db
      .insert(heroSlide)
      .values({
        mediaType: dto.mediaType,
        mediaUrl: dto.mediaUrl,
        thumbnailUrl: dto.thumbnailUrl ?? null,
        title: dto.title ?? '',
        subtitle: dto.subtitle ?? '',
        sortOrder: nextOrder,
      })
      .returning({ id: heroSlide.id });

    const slides = await this.getHeroSlides();
    return slides.find((s) => s.id === inserted[0].id)!;
  }

  async updateHeroSlide(id: string, dto: { mediaUrl?: string; thumbnailUrl?: string; title?: string; subtitle?: string; sortOrder?: number; isActive?: boolean }): Promise<HeroSlide> {
    const patch: Partial<typeof heroSlide.$inferInsert> = {};
    if (dto.mediaUrl !== undefined) patch.mediaUrl = dto.mediaUrl;
    if (dto.thumbnailUrl !== undefined) patch.thumbnailUrl = dto.thumbnailUrl ?? null;
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.subtitle !== undefined) patch.subtitle = dto.subtitle;
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) patch.isActive = dto.isActive;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(heroSlide)
      .set(patch)
      .where(eq(heroSlide.id, id))
      .returning({ id: heroSlide.id });

    if (updated.length === 0) {
      throw new NotFoundException('轮播项不存在');
    }

    const slides = await this.getHeroSlides();
    const found = slides.find((s) => s.id === updated[0].id);
    if (!found) throw new NotFoundException('轮播项不存在');
    return found;
  }

  async reorderHeroSlides(items: { id: string; sortOrder: number }[]): Promise<HeroSlide[]> {
    if (items.length === 0) return this.getHeroSlides();
    await this.db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(heroSlide)
          .set({ sortOrder: item.sortOrder })
          .where(eq(heroSlide.id, item.id));
      }
    });
    return this.getHeroSlides();
  }

  async deleteHeroSlide(id: string): Promise<{ id: string }> {
    const deleted = await this.db
      .delete(heroSlide)
      .where(eq(heroSlide.id, id))
      .returning({ id: heroSlide.id });
    if (deleted.length === 0) {
      throw new NotFoundException('轮播项不存在');
    }
    return { id: deleted[0].id };
  }
}
