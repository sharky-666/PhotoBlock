import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type {
  CreateHeroSlideRequest,
  UpdateHeroSlideRequest,
  ReorderHeroSlidesRequest,
} from '@shared/api.interface';

const MEDIA_TYPES = ['image', 'video'] as const;

export class CreateHeroSlideDto implements CreateHeroSlideRequest {
  @IsString()
  @IsIn(MEDIA_TYPES)
  mediaType!: 'image' | 'video';

  @IsString()
  mediaUrl!: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;
}

export class UpdateHeroSlideDto implements UpdateHeroSlideRequest {
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class ReorderItemDto {
  @IsString()
  id!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class ReorderHeroSlidesDto implements ReorderHeroSlidesRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: { id: string; sortOrder: number }[];
}
