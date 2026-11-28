import { IsOptional, IsString, IsEmail, MaxLength, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { UpdateSiteSettingsRequest } from '@shared/api.interface';

export class UpdateSiteSettingsDto implements UpdateSiteSettingsRequest {
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  xiaohongshuUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  douyinUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  weiboUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ctripUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  citiesVisited?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  countriesVisited?: number;
}
