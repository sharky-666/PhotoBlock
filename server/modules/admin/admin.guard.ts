import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly adminService: AdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers?.['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('未授权');
    }

    const token = authHeader.slice(7);
    const session = await this.adminService.validateSession(token);

    if (!session) {
      throw new UnauthorizedException('未授权');
    }

    request.admin = { id: session.adminId, username: session.username };
    request.token = token;

    return true;
  }
}

export const Admin = () => UseGuards(AdminGuard);
