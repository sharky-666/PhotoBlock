import { apiClient as axiosForBackend } from './http';
import type {
  Artwork,
  BulkAssignArtworksRequest,
  BulkAssignArtworksResponse,
  Category,
  CreateArtworkRequest,
  CreateCategoryRequest,
  CreateHeroSlideRequest,
  CreateSeriesRequest,
  HeroSlide,
  ListResp,
  OssConfig,
  OssTestResult,
  OssUploadSignature,
  ReorderHeroSlidesRequest,
  Series,
  SiteSettings,
  SiteStats,
  UpdateArtworkRequest,
  UpdateCategoryRequest,
  UpdateHeroSlideRequest,
  UpdateOssConfigRequest,
  UpdateSeriesRequest,
  UpdateSiteSettingsRequest,
  HomepageCopy,
  UpdateHomepageCopyRequest,
  LocationMarker,
} from '@shared/api.interface';

const API_PREFIX = '/api';

/* ---------- Series ---------- */

export const getFeaturedSeries = (mediaType?: 'image' | 'video'): Promise<Series[]> =>
  axiosForBackend.get(`${API_PREFIX}/series/featured`, { params: mediaType ? { mediaType } : {} }).then((r) => r.data.data);

export const getSeriesList = (mediaType?: 'image' | 'video'): Promise<ListResp<Series>> =>
  axiosForBackend.get(`${API_PREFIX}/series`, { params: mediaType ? { mediaType } : {} }).then((r) => r.data.data);

export const getSeriesDetail = (id: string): Promise<Series> =>
  axiosForBackend.get(`${API_PREFIX}/series/${id}`).then((r) => r.data.data);

export const createSeries = (body: CreateSeriesRequest): Promise<Series> =>
  axiosForBackend.post(`${API_PREFIX}/admin/series`, body).then((r) => r.data.data);

export const updateSeries = (
  id: string,
  body: UpdateSeriesRequest,
): Promise<Series> =>
  axiosForBackend.patch(`${API_PREFIX}/admin/series/${id}`, body).then((r) => r.data.data);

export const deleteSeries = (id: string): Promise<{ id: string }> =>
  axiosForBackend
    .delete(`${API_PREFIX}/admin/series/${id}`)
    .then((r) => r.data.data);

/* ---------- Category ---------- */

export const getCategoryList = (mediaType?: 'image' | 'video'): Promise<ListResp<Category>> =>
  axiosForBackend.get(`${API_PREFIX}/categories`, { params: mediaType ? { mediaType } : {} }).then((r) => r.data.data);

export const getCategoryDetail = (id: string): Promise<Category> =>
  axiosForBackend.get(`${API_PREFIX}/categories/${id}`).then((r) => r.data.data);

export const createCategory = (
  body: CreateCategoryRequest,
): Promise<Category> =>
  axiosForBackend.post(`${API_PREFIX}/admin/categories`, body).then((r) => r.data.data);

export const updateCategory = (
  id: string,
  body: UpdateCategoryRequest,
): Promise<Category> =>
  axiosForBackend
    .patch(`${API_PREFIX}/admin/categories/${id}`, body)
    .then((r) => r.data.data);

export const deleteCategory = (id: string): Promise<{ id: string }> =>
  axiosForBackend
    .delete(`${API_PREFIX}/admin/categories/${id}`)
    .then((r) => r.data.data);

/* ---------- Artwork ---------- */

export interface ArtworksCursorResp {
  items: Artwork[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ArtworksParams {
  seriesId?: string;
  categoryId?: string;
  mediaType?: 'image' | 'video';
  location?: string;
  cursor?: string;
  limit?: number;
}

export const getArtworks = (params?: ArtworksParams): Promise<ArtworksCursorResp> =>
  axiosForBackend
    .get(`${API_PREFIX}/artworks`, { params })
    .then((r) => r.data.data);

export const getFeaturedVideos = (limit = 8): Promise<Artwork[]> =>
  axiosForBackend
    .get(`${API_PREFIX}/artworks/featured-videos?limit=${limit}`)
    .then((r) => r.data.data);

export const getFeaturedImages = (limit = 6): Promise<Artwork[]> =>
  axiosForBackend
    .get(`${API_PREFIX}/artworks/featured-images?limit=${limit}`)
    .then((r) => r.data.data);

export const getArtworkDetail = (id: string): Promise<Artwork> =>
  axiosForBackend.get(`${API_PREFIX}/artworks/${id}`).then((r) => r.data.data);

export const createArtwork = (body: CreateArtworkRequest): Promise<Artwork> =>
  axiosForBackend.post(`${API_PREFIX}/admin/artworks`, body).then((r) => r.data.data);

export const updateArtwork = (
  id: string,
  body: UpdateArtworkRequest,
): Promise<Artwork> =>
  axiosForBackend
    .patch(`${API_PREFIX}/admin/artworks/${id}`, body)
    .then((r) => r.data.data);

export const assignArtworks = (
  body: BulkAssignArtworksRequest,
): Promise<BulkAssignArtworksResponse> =>
  axiosForBackend
    .post(`${API_PREFIX}/admin/artworks/assign`, body)
    .then((r) => r.data.data);

export const deleteArtwork = (id: string): Promise<{ id: string }> =>
  axiosForBackend
    .delete(`${API_PREFIX}/admin/artworks/${id}`)
    .then((r) => r.data.data);

export const incrementArtworkView = (id: string): Promise<{ viewCount: number }> =>
  axiosForBackend
    .post(`${API_PREFIX}/artworks/${id}/view`)
    .then((r) => r.data.data);

/* ---------- Stats ---------- */

export const getStats = (): Promise<SiteStats> =>
  axiosForBackend.get(`${API_PREFIX}/stats`).then((r) => r.data.data);

export const getLocationMarkers = (): Promise<LocationMarker[]> =>
  axiosForBackend
    .get(`${API_PREFIX}/location-markers`)
    .then((r) => r.data.data);

/* ---------- Site Settings ---------- */

export const getSiteSettings = (): Promise<SiteSettings> =>
  axiosForBackend
    .get(`${API_PREFIX}/site-settings`)
    .then((r) => r.data.data);

export const updateSiteSettings = (
  body: UpdateSiteSettingsRequest,
): Promise<SiteSettings> =>
  axiosForBackend
    .patch(`${API_PREFIX}/admin/site-settings`, body)
    .then((r) => r.data.data);

/* ---------- Homepage Copy ---------- */

export const getHomepageCopy = (): Promise<HomepageCopy> =>
  axiosForBackend
    .get(`${API_PREFIX}/homepage-copy`)
    .then((r) => r.data.data);

export const updateHomepageCopy = (
  body: UpdateHomepageCopyRequest,
): Promise<HomepageCopy> =>
  axiosForBackend
    .patch(`${API_PREFIX}/admin/homepage-copy`, body)
    .then((r) => r.data.data);

/* ---------- OSS Config ---------- */

export const getOssConfig = (): Promise<OssConfig> =>
  axiosForBackend
    .get(`${API_PREFIX}/oss/config`)
    .then((r) => r.data.data);

export const updateOssConfig = (
  body: UpdateOssConfigRequest,
): Promise<OssConfig> =>
  axiosForBackend
    .patch(`${API_PREFIX}/oss/config`, body)
    .then((r) => r.data.data);

export const getOssUploadSignature = (filename: string, contentType?: string): Promise<OssUploadSignature> =>
  axiosForBackend
    .post(`${API_PREFIX}/oss/upload-signature`, { filename, contentType })
    .then((r) => r.data.data);

export const testOssConnection = (): Promise<OssTestResult> =>
  axiosForBackend
    .post(`${API_PREFIX}/oss/test-connection`)
    .then((r) => r.data.data);

/* ---------- Aliyun OSS Media ---------- */

export interface MediaUploadResult {
  key: string;
  url: string;
  contentType: string;
  size: number;
}

interface MediaUploadTicket {
  key: string;
  uploadUrl: string;
  url: string;
  headers: Record<string, string>;
  contentType: string;
  size: number;
  expiresAt: string;
}

async function uploadMediaViaWorker(
  file: File,
): Promise<MediaUploadResult> {
  const body = new FormData();
  body.append('file', file);
  const response = await axiosForBackend.post<MediaUploadResult>(
    `${API_PREFIX}/admin/media/proxy`,
    body,
  );
  return response.data.data;
}

export const uploadMedia = async (
  file: File,
): Promise<MediaUploadResult> => {
  const signed = await axiosForBackend.post<MediaUploadTicket>(
    `${API_PREFIX}/admin/media/sign`,
    {
      filename: file.name,
      contentType: file.type,
      size: file.size,
    },
  );
  const ticket = signed.data.data;
  let upload: Response;
  try {
    upload = await fetch(ticket.uploadUrl, {
      method: 'PUT',
      headers: ticket.headers,
      body: file,
    });
  } catch {
    // OSS CORS may not include every local or preview origin.
    return uploadMediaViaWorker(file);
  }
  if (!upload.ok) {
    throw new Error(
      `上传到阿里云 OSS 失败（HTTP ${upload.status}）`,
    );
  }

  const confirmed = await axiosForBackend.post<MediaUploadResult>(
    `${API_PREFIX}/admin/media/confirm`,
    {
      key: ticket.key,
      contentType: ticket.contentType,
      size: ticket.size,
    },
  );
  return confirmed.data.data;
};

/* ---------- Hero Slides ---------- */

export const getHeroSlides = (activeOnly = false): Promise<HeroSlide[]> =>
  axiosForBackend
    .get(`${API_PREFIX}/hero-slides`, { params: activeOnly ? { activeOnly: 'true' } : {} })
    .then((r) => r.data.data);

export const createHeroSlide = (body: CreateHeroSlideRequest): Promise<HeroSlide> =>
  axiosForBackend
    .post(`${API_PREFIX}/admin/hero-slides`, body)
    .then((r) => r.data.data);

export const updateHeroSlide = (id: string, body: UpdateHeroSlideRequest): Promise<HeroSlide> =>
  axiosForBackend
    .patch(`${API_PREFIX}/admin/hero-slides/${id}`, body)
    .then((r) => r.data.data);

export const reorderHeroSlides = (body: ReorderHeroSlidesRequest): Promise<HeroSlide[]> =>
  axiosForBackend
    .post(`${API_PREFIX}/admin/hero-slides/reorder`, body)
    .then((r) => r.data.data);

export const deleteHeroSlide = (id: string): Promise<{ id: string }> =>
  axiosForBackend
    .delete(`${API_PREFIX}/admin/hero-slides/${id}`)
    .then((r) => r.data.data);
