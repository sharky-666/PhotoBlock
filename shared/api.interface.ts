export interface Series {
  id: string;
  slug?: string;
  titleZh: string;
  titleEn: string;
  description: string;
  yearStart: number | null;
  yearEnd: number | null;
  coverUrl: string;
  sortOrder: number;
  isFeatured: boolean;
  mediaType: 'image' | 'video';
  artworkCount: number;
}

export interface Category {
  id: string;
  slug?: string;
  nameZh: string;
  nameEn: string;
  description: string;
  coverUrl: string;
  sortOrder: number;
  mediaType: 'image' | 'video';
  artworkCount: number;
}

export interface Artwork {
  id: string;
  slug?: string;
  title: string;
  description: string;
  imageUrl: string;
  rawFileUrl: string | null;
  mediaType: 'image' | 'video';
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  fps: number | null;
  quality: string | null;
  fileSize: number | null;
  cameraModel: string | null;
  lensModel: string | null;
  aperture: string | null;
  shutterSpeed: string | null;
  iso: number | null;
  focalLength: string | null;
  exposureCompensation: string | null;
  whiteBalance: string | null;
  seriesId: string | null;
  categoryId: string | null;
  sortOrder: number;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  takenAt: string | null;
  shotDirection: number | null;
  shotAltitude: number | null;
  shotAngle: number | null;
  cameraPositionDesc: string | null;
}

export interface SiteStats {
  totalViews: number;
  totalArtworks: number;
  citiesVisited: number;
  countriesVisited: number;
}

export interface ApiResp<T = unknown> {
  success: boolean;
  data: T;
  message: string;
}

export interface ListResp<T> {
  items: T[];
  total: number;
}

export interface CreateArtworkRequest {
  title: string;
  description?: string;
  imageUrl: string;
  rawFileUrl?: string;
  mediaType?: 'image' | 'video';
  width?: number;
  height?: number;
  durationSeconds?: number;
  fps?: number;
  quality?: string;
  fileSize?: number;
  cameraModel?: string;
  lensModel?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  focalLength?: string;
  exposureCompensation?: string;
  whiteBalance?: string;
  seriesId?: string;
  categoryId?: string;
  sortOrder?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  takenAt?: string;
  shotDirection?: number;
  shotAltitude?: number;
  shotAngle?: number;
  cameraPositionDesc?: string;
}

export interface UpdateArtworkRequest {
  title?: string;
  description?: string;
  seriesId?: string | null;
  categoryId?: string | null;
  sortOrder?: number;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  takenAt?: string;
  shotDirection?: number | null;
  shotAltitude?: number | null;
  shotAngle?: number | null;
  cameraPositionDesc?: string | null;
}

export interface BulkAssignArtworksRequest {
  ids: string[];
  targetType: 'series' | 'category';
  targetId: string | null;
}

export interface BulkAssignArtworksResponse {
  updated: number;
  targetType: 'series' | 'category';
  targetId: string | null;
}

export interface CreateSeriesRequest {
  titleZh: string;
  titleEn: string;
  description: string;
  yearStart?: number;
  yearEnd?: number;
  coverUrl: string;
  mediaType?: 'image' | 'video';
  sortOrder?: number;
  isFeatured?: boolean;
}

export interface UpdateSeriesRequest {
  titleZh?: string;
  titleEn?: string;
  description?: string;
  yearStart?: number | null;
  yearEnd?: number | null;
  coverUrl?: string;
  mediaType?: 'image' | 'video';
  sortOrder?: number;
  isFeatured?: boolean;
}

export interface CreateCategoryRequest {
  nameZh: string;
  nameEn: string;
  description: string;
  coverUrl: string;
  mediaType?: 'image' | 'video';
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  nameZh?: string;
  nameEn?: string;
  description?: string;
  coverUrl?: string;
  mediaType?: 'image' | 'video';
  sortOrder?: number;
}

export interface AdminStatus {
  isLoggedIn: boolean;
  username?: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  username: string;
}

export interface AdminChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface SiteSettings {
  email: string;
  xiaohongshuUrl: string;
  douyinUrl: string;
  weiboUrl: string;
  instagramUrl: string;
  ctripUrl: string;
  citiesVisited: number;
  countriesVisited: number;
}

export interface UpdateSiteSettingsRequest {
  email?: string;
  xiaohongshuUrl?: string;
  douyinUrl?: string;
  weiboUrl?: string;
  instagramUrl?: string;
  ctripUrl?: string;
  citiesVisited?: number;
  countriesVisited?: number;
}

export interface HomepageCopy {
  heroMainTitle: string;
  heroSubtitle: string;
  heroSlogan: string;
  heroHonors: string;
  signatureUrl: string;
  imageWorksTitle: string;
  imageWorksSubtitle: string;
  imageSeriesTitle: string;
  imageSeriesSubtitle: string;
  imageCategoriesTitle: string;
  videoWorksTitle: string;
  videoWorksSubtitle: string;
  videoSeriesTitle: string;
  videoSeriesSubtitle: string;
  videoCategoriesTitle: string;
  aboutTitle: string;
  aboutBody: string;
  aboutQuote: string;
  aboutQuoteAuthor: string;
  aboutPortraitUrl: string;
  bioTitle: string;
  bioBody: string;
  bioPhilosophy: string;
  bioManifesto: string;
  profileName: string;
  profileStageName: string;
  profileBirthday: string;
  profileLocation: string;
  profileStyle: string;
  profileExpertise: string;
  resumeExperience: string;
  resumeAwards: string;
  resumeExhibitions: string;
  statsTitle: string;
  statsArtworksLabel: string;
  statsSeriesLabel: string;
  statsCitiesLabel: string;
  statsCountriesLabel: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonText: string;
  cooperationTitle: string;
  cooperationScope: string;
  cooperationEmail: string;
  cooperationWechat: string;
  cooperationPhone: string;
  cooperationProcess: string;
  footerCopyright: string;
}

export type UpdateHomepageCopyRequest = Partial<HomepageCopy>;

export interface LocationMarker {
  name: string;
  latitude: number;
  longitude: number;
  artworkCount: number;
}

export interface OssConfig {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  endpoint: string;
  customDomain: string;
  isConfigured: boolean;
}

export interface UpdateOssConfigRequest {
  accessKeyId?: string;
  accessKeySecret?: string;
  bucket?: string;
  endpoint?: string;
  customDomain?: string;
}

export interface OssUploadSignature {
  host: string;
  dir: string;
  policy: string;
  signature: string;
  ossAccessKeyId: string;
  callback?: string;
  filePath: string;
  fileUrl: string;
}

export interface OssTestResult {
  success: boolean;
  message: string;
}

export interface HeroSlide {
  id: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  title: string;
  subtitle: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateHeroSlideRequest {
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  title?: string;
  subtitle?: string;
}

export interface UpdateHeroSlideRequest {
  mediaUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  subtitle?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ReorderHeroSlidesRequest {
  items: { id: string; sortOrder: number }[];
}
