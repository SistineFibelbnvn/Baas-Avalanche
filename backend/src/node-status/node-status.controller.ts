import { Controller, Get, Query } from '@nestjs/common';

import { NodeStatusService } from './node-status.service';

@Controller('node')
export class NodeStatusController {
  constructor(private readonly nodeStatusService: NodeStatusService) { }

  @Get('status')
  getStatus(@Query('rpcUrl') rpcUrl?: string) {
    return this.nodeStatusService.fetchStatus(rpcUrl);
  }

  @Get('dashboard')
  getDashboardStats(@Query('rpcUrl') rpcUrl?: string) {
    return this.nodeStatusService.fetchDashboardStats(rpcUrl);
  }

  @Get('blocks')
  getRecentBlocks(@Query('rpcUrl') rpcUrl?: string) {
    return this.nodeStatusService.fetchRecentBlocks(rpcUrl);
  }

  @Get('transactions')
  getRecentTransactions(@Query('rpcUrl') rpcUrl?: string) {
    return this.nodeStatusService.fetchRecentTransactions(rpcUrl);
  }
}


