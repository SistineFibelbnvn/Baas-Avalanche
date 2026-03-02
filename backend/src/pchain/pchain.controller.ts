import { Controller, Get, Query } from '@nestjs/common';

import { PChainService } from './pchain.service';

@Controller('pchain')
export class PChainController {
  constructor(private readonly pchainService: PChainService) {}

  @Get('validators')
  getValidators(@Query('subnetId') subnetId?: string) {
    return this.pchainService.getValidators(subnetId);
  }

  @Get('subnets')
  getSubnets() {
    return this.pchainService.getSubnets();
  }
}

