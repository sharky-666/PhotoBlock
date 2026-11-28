import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { OssService } from './oss.service';
import { Admin } from '../admin/admin.guard';
import { ArtworkListQueryDto, CreateArtworkDto, UpdateArtworkDto } from './dto/artwork.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateSeriesDto, UpdateSeriesDto } from './dto/series.dto';
import { UpdateSiteSettingsDto } from './dto/site-settings.dto';
import { UpdateHomepageCopyDto } from './dto/homepage-copy.dto';
import { CreateHeroSlideDto, ReorderHeroSlidesDto, UpdateHeroSlideDto } from './dto/hero-slide.dto';
import { UpdateOssConfigDto } from './dto/oss-config.dto';
import type { HomepageCopy } from '@shared/api.interface';
import type {
  ApiResp,
  Artwork,
  Category,
  HeroSlide,
  ListResp,
  LocationMarker,
  OssConfig,
  OssTestResult,
  OssUploadSignature,
  Series,
  SiteSettings,
  SiteStats,
} from '@shared/api.interface';

function ok<T>(data: T): ApiResp<T> {
  return { success: true, data, message: 'ok' };
}

@Controller('api')
export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly ossService: OssService,
  ) {}

  // ── Series ──────────────────────────────────────────────

  @Get('series/featured')
  async getFeaturedSeries(@Query('mediaType') mediaType?: string): Promise<ApiResp<Series[]>> {
    const typed = mediaType === 'image' || mediaType === 'video' ? mediaType : undefined;
    const data = await this.portfolioService.listFeaturedSeries(typed);
    return ok(data);
  }

  @Get('series')
  async getSeriesList(@Query('mediaType') mediaType?: string): Promise<ApiResp<ListResp<Series>>> {
    const typed = mediaType === 'image' || mediaType === 'video' ? mediaType : undefined;
    const data = await this.portfolioService.listSeries(typed);
    return ok(data);
  }

  @Get('series/:id')
  async getSeries(@Param('id') id: string): Promise<ApiResp<Series>> {
    const data = await this.portfolioService.getSeries(id);
    return ok(data);
  }

  @Admin()
  @Post('series')
  async createSeries(@Body() dto: CreateSeriesDto): Promise<ApiResp<Series>> {
    const data = await this.portfolioService.createSeries(dto);
    return ok(data);
  }

  @Admin()
  @Patch('series/:id')
  async updateSeries(
    @Param('id') id: string,
    @Body() dto: UpdateSeriesDto,
  ): Promise<ApiResp<Series>> {
    const data = await this.portfolioService.updateSeries(id, dto);
    return ok(data);
  }

  @Admin()
  @Delete('series/:id')
  async deleteSeries(
    @Param('id') id: string,
  ): Promise<ApiResp<{ id: string }>> {
    const data = await this.portfolioService.deleteSeries(id);
    return ok(data);
  }

  // ── Category ────────────────────────────────────────────

  @Get('categories')
  async getCategories(@Query('mediaType') mediaType?: string): Promise<ApiResp<ListResp<Category>>> {
    const typed = mediaType === 'image' || mediaType === 'video' ? mediaType : undefined;
    const data = await this.portfolioService.listCategories(typed);
    return ok(data);
  }

  @Get('categories/:id')
  async getCategory(@Param('id') id: string): Promise<ApiResp<Category>> {
    const data = await this.portfolioService.getCategory(id);
    return ok(data);
  }

  @Admin()
  @Post('categories')
  async createCategory(
    @Body() dto: CreateCategoryDto,
  ): Promise<ApiResp<Category>> {
    const data = await this.portfolioService.createCategory(dto);
    return ok(data);
  }

  @Admin()
  @Patch('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<ApiResp<Category>> {
    const data = await this.portfolioService.updateCategory(id, dto);
    return ok(data);
  }

  @Admin()
  @Delete('categories/:id')
  async deleteCategory(
    @Param('id') id: string,
  ): Promise<ApiResp<{ id: string }>> {
    const data = await this.portfolioService.deleteCategory(id);
    return ok(data);
  }

  // ── Artwork ─────────────────────────────────────────────

  @Get('artworks/featured-videos')
  async getFeaturedVideos(@Query('limit') limit?: string): Promise<ApiResp<Artwork[]>> {
    const num = limit ? Math.min(parseInt(limit, 10), 20) : 8;
    const data = await this.portfolioService.listFeaturedVideos(Number.isNaN(num) ? 8 : num);
    return ok(data);
  }

  @Get('artworks/featured-images')
  async getFeaturedImages(@Query('limit') limit?: string): Promise<ApiResp<Artwork[]>> {
    const num = limit ? Math.min(parseInt(limit, 10), 20) : 6;
    const data = await this.portfolioService.listFeaturedImages(Number.isNaN(num) ? 6 : num);
    return ok(data);
  }

  @Get('artworks')
  async getArtworks(
    @Query() query: ArtworkListQueryDto,
  ): Promise<ApiResp<{ items: Artwork[]; nextCursor: string | null; hasMore: boolean }>> {
    const data = await this.portfolioService.listArtworks(
      query.seriesId,
      query.categoryId,
      query.cursor,
      query.limit ?? 20,
      query.mediaType,
      query.location,
    );
    return ok(data);
  }

  @Get('artworks/:id')
  async getArtwork(@Param('id') id: string): Promise<ApiResp<Artwork>> {
    const data = await this.portfolioService.getArtwork(id);
    return ok(data);
  }

  @Admin()
  @Post('artworks')
  async createArtwork(
    @Body() dto: CreateArtworkDto,
  ): Promise<ApiResp<Artwork>> {
    const data = await this.portfolioService.createArtwork(dto);
    return ok(data);
  }

  @Admin()
  @Patch('artworks/:id')
  async updateArtwork(
    @Param('id') id: string,
    @Body() dto: UpdateArtworkDto,
  ): Promise<ApiResp<Artwork>> {
    const data = await this.portfolioService.updateArtwork(id, dto);
    return ok(data);
  }

  @Admin()
  @Delete('artworks/:id')
  async deleteArtwork(
    @Param('id') id: string,
  ): Promise<ApiResp<{ id: string }>> {
    const data = await this.portfolioService.deleteArtwork(id);
    return ok(data);
  }

  // ── Stats ───────────────────────────────────────────────

  @Get('stats')
  async getStats(): Promise<ApiResp<SiteStats>> {
    const data = await this.portfolioService.getStats();
    return ok(data);
  }

  @Get('location-markers')
  async getLocationMarkers(): Promise<ApiResp<LocationMarker[]>> {
    const data = await this.portfolioService.getLocationMarkers();
    return ok(data);
  }

  // ── Site Settings ───────────────────────────────────────

  @Get('site-settings')
  async getSiteSettings(): Promise<ApiResp<SiteSettings>> {
    const data = await this.portfolioService.getSiteSettings();
    return ok(data);
  }

  @Admin()
  @Patch('site-settings')
  async updateSiteSettings(
    @Body() dto: UpdateSiteSettingsDto,
  ): Promise<ApiResp<SiteSettings>> {
    const patch: Record<string, string> = {};
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.xiaohongshuUrl !== undefined) patch.xiaohongshu_url = dto.xiaohongshuUrl;
    if (dto.douyinUrl !== undefined) patch.douyin_url = dto.douyinUrl;
    if (dto.weiboUrl !== undefined) patch.weibo_url = dto.weiboUrl;
    if (dto.instagramUrl !== undefined) patch.instagram_url = dto.instagramUrl;
    if (dto.ctripUrl !== undefined) patch.ctrip_url = dto.ctripUrl;
    if (dto.citiesVisited !== undefined) patch.cities_visited = String(dto.citiesVisited);
    if (dto.countriesVisited !== undefined) patch.countries_visited = String(dto.countriesVisited);
    const data = await this.portfolioService.updateSiteSettings(patch);
    return ok(data);
  }

  // ── Homepage Copy ──────────────────────────────────────

  @Get('homepage-copy')
  async getHomepageCopy(): Promise<ApiResp<HomepageCopy>> {
    const data = await this.portfolioService.getHomepageCopy();
    return ok(data);
  }

  @Admin()
  @Patch('homepage-copy')
  async updateHomepageCopy(
    @Body() dto: UpdateHomepageCopyDto,
  ): Promise<ApiResp<HomepageCopy>> {
    const patch: Record<string, string> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        patch[key] = String(value);
      }
    }
    const data = await this.portfolioService.updateHomepageCopy(patch);
    return ok(data);
  }

  // ── Artwork view ────────────────────────────────────────

  @Post('artworks/:id/view')
  async incrementView(@Param('id') id: string): Promise<ApiResp<{ viewCount: number }>> {
    const data = await this.portfolioService.incrementArtworkView(id);
    return ok(data);
  }

  // ── OSS Config ──────────────────────────────────────────

  @Get('oss/config')
  async getOssConfig(): Promise<ApiResp<OssConfig>> {
    const data = await this.ossService.getConfig();
    return ok(data);
  }

  @Admin()
  @Patch('oss/config')
  async updateOssConfig(
    @Body() dto: UpdateOssConfigDto,
  ): Promise<ApiResp<OssConfig>> {
    const patch: Record<string, string> = {};
    if (dto.accessKeyId !== undefined) patch.accessKeyId = dto.accessKeyId;
    if (dto.accessKeySecret !== undefined) patch.accessKeySecret = dto.accessKeySecret;
    if (dto.bucket !== undefined) patch.bucket = dto.bucket;
    if (dto.endpoint !== undefined) patch.endpoint = dto.endpoint;
    if (dto.customDomain !== undefined) patch.customDomain = dto.customDomain;
    const data = await this.ossService.updateConfig(patch);
    return ok(data);
  }

  @Admin()
  @Post('oss/upload-signature')
  async getOssUploadSignature(
    @Body('filename') filename: string,
    @Body('contentType') contentType?: string,
  ): Promise<ApiResp<OssUploadSignature>> {
    if (!filename) throw new BadRequestException('filename is required');
    const data = await this.ossService.generateUploadSignature(filename, contentType);
    return ok(data);
  }

  @Admin()
  @Post('oss/test-connection')
  async testOssConnection(): Promise<ApiResp<OssTestResult>> {
    const data = await this.ossService.testConnection();
    return ok(data);
  }

  // ── Hero Slides ─────────────────────────────────────────

  @Get('hero-slides')
  async getHeroSlides(@Query('activeOnly') activeOnly?: string): Promise<ApiResp<HeroSlide[]>> {
    const data = await this.portfolioService.getHeroSlides(activeOnly === 'true');
    return ok(data);
  }

  @Admin()
  @Post('hero-slides')
  async createHeroSlide(@Body() dto: CreateHeroSlideDto): Promise<ApiResp<HeroSlide>> {
    const data = await this.portfolioService.createHeroSlide(dto);
    return ok(data);
  }

  @Admin()
  @Patch('hero-slides/:id')
  async updateHeroSlide(
    @Param('id') id: string,
    @Body() dto: UpdateHeroSlideDto,
  ): Promise<ApiResp<HeroSlide>> {
    const data = await this.portfolioService.updateHeroSlide(id, dto);
    return ok(data);
  }

  @Admin()
  @Post('hero-slides/reorder')
  async reorderHeroSlides(@Body() dto: ReorderHeroSlidesDto): Promise<ApiResp<HeroSlide[]>> {
    const data = await this.portfolioService.reorderHeroSlides(dto.items);
    return ok(data);
  }

  @Admin()
  @Delete('hero-slides/:id')
  async deleteHeroSlide(@Param('id') id: string): Promise<ApiResp<{ id: string }>> {
    const data = await this.portfolioService.deleteHeroSlide(id);
    return ok(data);
  }
}
