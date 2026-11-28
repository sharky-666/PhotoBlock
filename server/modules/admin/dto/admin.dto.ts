import { IsString, MinLength, MaxLength } from 'class-validator';
import type {
  AdminLoginRequest,
  AdminChangePasswordRequest,
} from '@shared/api.interface';

export class AdminLoginDto implements AdminLoginRequest {
  @IsString()
  @MaxLength(100)
  username!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password!: string;
}

export class AdminChangePasswordDto implements AdminChangePasswordRequest {
  @IsString()
  oldPassword!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  newPassword!: string;
}
