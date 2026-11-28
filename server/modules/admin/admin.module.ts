import { Module, OnModuleInit } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard],
})
export class AdminModule implements OnModuleInit {
  constructor(private readonly adminService: AdminService) {}

  async onModuleInit() {
    await this.adminService.ensureDefaultAdmin();
  }
}
