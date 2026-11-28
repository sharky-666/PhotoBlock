import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { CreateSeriesRequest, UpdateSeriesRequest } from '@shared/api.interface';

const MEDIA_TYPES = ['image', 'video'] as const;

export class CreateSeriesDto implements CreateSeriesRequest {
  @IsString()
  @MaxLength(255)
  titleZh!: string;

  @IsString()
  @MaxLength(255)
  titleEn!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  yearStart?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  yearEnd?: number;

  @IsString()
  coverUrl!: string;

  @IsOptional()
  @IsIn(MEDIA_TYPES)
  mediaType?: 'image' | 'video';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class UpdateSeriesDto implements UpdateSeriesRequest {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titleZh?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  titleEn?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  yearStart?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  yearEnd?: number | null;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsIn(MEDIA_TYPES)
  mediaType?: 'image' | 'video';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
