import { Module } from '@nestjs/common';

import { AvalancheModule } from '../avalanche/avalanche.module';
import { PrismaModule } from '../prisma/prisma.module';

import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
  imports: [PrismaModule, AvalancheModule],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}

