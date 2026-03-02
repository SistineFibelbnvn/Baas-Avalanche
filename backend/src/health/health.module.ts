import { Module } from '@nestjs/common';

import { AvalancheModule } from '../avalanche/avalanche.module';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [AvalancheModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}

