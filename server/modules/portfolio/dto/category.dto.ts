import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { CreateCategoryRequest, UpdateCategoryRequest } from '@shared/api.interface';

const MEDIA_TYPES = ['image', 'video'] as const;

export class CreateCategoryDto implements CreateCategoryRequest {
  @IsString()
  @MaxLength(100)
  nameZh!: string;

  @IsString()
  @MaxLength(100)
  nameEn!: string;

  @IsString()
  description!: string;

  @IsString()
  coverUrl!: string;

  @IsOptional()
  @IsIn(MEDIA_TYPES)
  mediaType?: 'image' | 'video';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class UpdateCategoryDto implements UpdateCategoryRequest {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameZh?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @IsOptional()
  @IsString()
  description?: string;

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
}
