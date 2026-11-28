import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  CreateArtworkRequest,
  UpdateArtworkRequest,
} from '@shared/api.interface';

const MEDIA_TYPES = ['image', 'video'] as const;

export class ArtworkListQueryDto {
  @IsOptional()
  @IsUUID()
  seriesId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsIn(MEDIA_TYPES)
  mediaType?: 'image' | 'video';

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class CreateArtworkDto implements CreateArtworkRequest {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  imageUrl!: string;

  @IsOptional()
  @IsString()
  rawFileUrl?: string;

  @IsOptional()
  @IsIn(MEDIA_TYPES)
  mediaType?: 'image' | 'video';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  width?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  height?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fps?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  quality?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fileSize?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  cameraModel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lensModel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  aperture?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  shutterSpeed?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  iso?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  focalLength?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  exposureCompensation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  whiteBalance?: string;

  @IsOptional()
  @IsUUID()
  seriesId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  takenAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shotDirection?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shotAltitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shotAngle?: number;

  @IsOptional()
  @IsString()
  cameraPositionDesc?: string;
}

export class UpdateArtworkDto implements UpdateArtworkRequest {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  seriesId?: string | null;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number | null;

  @IsOptional()
  @IsString()
  takenAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shotDirection?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shotAltitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shotAngle?: number | null;

  @IsOptional()
  @IsString()
  cameraPositionDesc?: string | null;
}
