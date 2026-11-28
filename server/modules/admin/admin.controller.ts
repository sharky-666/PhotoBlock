import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { Admin } from './admin.guard';
import { AdminLoginDto, AdminChangePasswordDto } from './dto/admin.dto';
import type {
  ApiResp,
  AdminStatus,
  AdminLoginResponse,
} from '@shared/api.interface';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('status')
  async getAdminStatus(@Req() req: Request): Promise<ApiResp<AdminStatus>> {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return { success: true, data: { isLoggedIn: false }, message: 'ok' };
    }

    const session = await this.adminService.validateSession(token);
    if (!session) {
      return { success: true, data: { isLoggedIn: false }, message: 'ok' };
    }

    return {
      success: true,
      data: { isLoggedIn: true, username: session.username },
      message: 'ok',
    };
  }

  @Post('login')
  async login(@Body() dto: AdminLoginDto): Promise<ApiResp<AdminLoginResponse>> {
    const data = await this.adminService.login(dto.username, dto.password);
    return { success: true, data, message: 'ok' };
  }

  @Admin()
  @Post('logout')
  async logout(@Req() req: Request): Promise<ApiResp<{ success: boolean }>> {
    const token = (req as any).token || '';
    await this.adminService.logout(token);
    return { success: true, data: { success: true }, message: 'ok' };
  }

  @Admin()
  @Post('change-password')
  async changePassword(
    @Req() req: Request,
    @Body() dto: AdminChangePasswordDto,
  ): Promise<ApiResp<{ success: boolean }>> {
    const adminId = (req as any).admin?.id || '';
    const result = await this.adminService.changePassword(
      adminId,
      dto.oldPassword,
      dto.newPassword,
    );
    return { success: true, data: result, message: 'ok' };
  }
}
