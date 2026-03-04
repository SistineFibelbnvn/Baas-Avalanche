import { Module } from '@nestjs/common';
import { PChainModule } from '../pchain/pchain.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ValidatorsController } from './validators.controller';
import { ValidatorsService } from './validators.service';

@Module({
  imports: [PChainModule, PrismaModule],
  controllers: [ValidatorsController],
  providers: [ValidatorsService],
  exports: [ValidatorsService],
})
export class ValidatorsModule { }

