import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { OssService } from './oss.service';

@Module({
  imports: [AdminModule],
  controllers: [PortfolioController],
  providers: [PortfolioService, OssService],
})
export class PortfolioModule {}
