import os from 'node:os';

import { Injectable } from '@nestjs/common';

import { AvalancheService } from '../avalanche/avalanche.service';

import { HealthStatus } from './interfaces/health-status.interface';

@Injectable()
export class HealthService {
  constructor(private readonly avalancheService: AvalancheService) {}

  async getStatus(): Promise<HealthStatus> {
    const rpcHealthy = await this.avalancheService.ping();

    return {
      status: rpcHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      host: os.hostname(),
      services: {
        api: 'running',
        avalancheRpc: rpcHealthy ? 'running' : 'unreachable',
      },
    };
  }
}

