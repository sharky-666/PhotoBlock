import { IsOptional, IsString, MaxLength } from 'class-validator';
import type { UpdateHomepageCopyRequest } from '@shared/api.interface';

export class UpdateHomepageCopyDto implements UpdateHomepageCopyRequest {
  @IsOptional() @IsString() @MaxLength(100) heroMainTitle?: string;
  @IsOptional() @IsString() @MaxLength(100) heroSubtitle?: string;
  @IsOptional() @IsString() @MaxLength(200) heroSlogan?: string;
  @IsOptional() @IsString() @MaxLength(500) heroHonors?: string;

  @IsOptional() @IsString() @MaxLength(50) imageWorksEyebrow?: string;
  @IsOptional() @IsString() @MaxLength(100) imageWorksTitle?: string;
  @IsOptional() @IsString() @MaxLength(200) imageWorksSubtitle?: string;

  @IsOptional() @IsString() @MaxLength(50) imageSeriesEyebrow?: string;
  @IsOptional() @IsString() @MaxLength(100) imageSeriesTitle?: string;
  @IsOptional() @IsString() @MaxLength(200) imageSeriesSubtitle?: string;

  @IsOptional() @IsString() @MaxLength(50) imageCategoriesEyebrow?: string;
  @IsOptional() @IsString() @MaxLength(100) imageCategoriesTitle?: string;

  @IsOptional() @IsString() @MaxLength(50) videoWorksEyebrow?: string;
  @IsOptional() @IsString() @MaxLength(100) videoWorksTitle?: string;
  @IsOptional() @IsString() @MaxLength(200) videoWorksSubtitle?: string;

  @IsOptional() @IsString() @MaxLength(50) videoSeriesEyebrow?: string;
  @IsOptional() @IsString() @MaxLength(100) videoSeriesTitle?: string;
  @IsOptional() @IsString() @MaxLength(200) videoSeriesSubtitle?: string;

  @IsOptional() @IsString() @MaxLength(50) videoCategoriesEyebrow?: string;
  @IsOptional() @IsString() @MaxLength(100) videoCategoriesTitle?: string;

  @IsOptional() @IsString() @MaxLength(50) aboutEyebrow?: string;
  @IsOptional() @IsString() @MaxLength(100) aboutTitle?: string;
  @IsOptional() @IsString() @MaxLength(2000) aboutBody?: string;
  @IsOptional() @IsString() @MaxLength(500) aboutQuote?: string;
  @IsOptional() @IsString() @MaxLength(100) aboutQuoteAuthor?: string;
  @IsOptional() @IsString() @MaxLength(500) aboutPortraitUrl?: string;

  @IsOptional() @IsString() @MaxLength(50) bioEyebrow?: string;
  @IsOptional() @IsString() @MaxLength(100) bioTitle?: string;
  @IsOptional() @IsString() @MaxLength(3000) bioBody?: string;
  @IsOptional() @IsString() @MaxLength(1000) bioPhilosophy?: string;
  @IsOptional() @IsString() @MaxLength(500) bioManifesto?: string;

  @IsOptional() @IsString() @MaxLength(50) profileName?: string;
  @IsOptional() @IsString() @MaxLength(100) profileStageName?: string;
  @IsOptional() @IsString() @MaxLength(100) profileLocation?: string;
  @IsOptional() @IsString() @MaxLength(200) profileStyle?: string;

  @IsOptional() @IsString() @MaxLength(2000) resumeExperience?: string;
  @IsOptional() @IsString() @MaxLength(2000) resumeAwards?: string;
  @IsOptional() @IsString() @MaxLength(2000) resumeExhibitions?: string;

  @IsOptional() @IsString() @MaxLength(50) statsEyebrow?: string;
  @IsOptional() @IsString() @MaxLength(100) statsTitle?: string;
  @IsOptional() @IsString() @MaxLength(50) statsArtworksLabel?: string;
  @IsOptional() @IsString() @MaxLength(50) statsSeriesLabel?: string;
  @IsOptional() @IsString() @MaxLength(50) statsCitiesLabel?: string;
  @IsOptional() @IsString() @MaxLength(50) statsCountriesLabel?: string;

  @IsOptional() @IsString() @MaxLength(200) ctaTitle?: string;
  @IsOptional() @IsString() @MaxLength(500) ctaSubtitle?: string;
  @IsOptional() @IsString() @MaxLength(50) ctaButtonText?: string;

  @IsOptional() @IsString() @MaxLength(200) footerCopyright?: string;
}
