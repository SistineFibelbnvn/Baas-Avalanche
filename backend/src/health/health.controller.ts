import { Controller, Get } from '@nestjs/common';

import { HealthService } from './health.service';
import { HealthStatus } from './interfaces/health-status.interface';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): Promise<HealthStatus> {
    return this.healthService.getStatus();
  }
}

