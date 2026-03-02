import { Injectable, Logger } from '@nestjs/common';

import { AvalancheService, NetworkSnapshot } from '../avalanche/avalanche.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreateMetricDto } from './dto/create-metric.dto';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly avalancheService: AvalancheService,
  ) { }

  async recordMetric(dto: CreateMetricDto) {
    // Metric model removed from Prisma, just log it for now
    this.logger.log(`Metric recorded: ${JSON.stringify(dto)}`);
    return dto;
  }

  async listRecent(limit = 20) {
    // Output empty array since DB model doesn't exist anymore
    return [];
  }

  async getLiveSnapshot(): Promise<NetworkSnapshot | null> {
    return this.avalancheService.getNetworkSnapshot();
  }
}

