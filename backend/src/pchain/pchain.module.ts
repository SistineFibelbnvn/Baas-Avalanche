import { Module } from '@nestjs/common';

import { PChainController } from './pchain.controller';
import { PChainService } from './pchain.service';

@Module({
  controllers: [PChainController],
  providers: [PChainService],
  exports: [PChainService],
})
export class PChainModule {}

