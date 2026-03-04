import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { SubnetsController } from './subnets.controller';
import { SubnetsService } from './subnets.service';

@Module({
  imports: [PrismaModule],
  controllers: [SubnetsController],
  providers: [SubnetsService],
})
export class SubnetsModule {}

