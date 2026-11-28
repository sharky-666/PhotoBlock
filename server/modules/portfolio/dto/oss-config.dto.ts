import { IsOptional, IsString, MaxLength } from 'class-validator';
import type { UpdateOssConfigRequest } from '@shared/api.interface';

export class UpdateOssConfigDto implements UpdateOssConfigRequest {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  accessKeyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  accessKeySecret?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bucket?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  endpoint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  customDomain?: string;
}
