import { Module } from '@nestjs/common';

import { AvalancheService } from './avalanche.service';

@Module({
  providers: [AvalancheService],
  exports: [AvalancheService],
})
export class AvalancheModule {}

