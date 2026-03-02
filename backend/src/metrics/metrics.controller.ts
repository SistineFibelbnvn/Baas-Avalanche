import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { CreateMetricDto } from './dto/create-metric.dto';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('live')
  getLive() {
    return this.metricsService.getLiveSnapshot();
  }

  @Get()
  list(@Query('limit') limit = 20) {
    return this.metricsService.listRecent(Number(limit));
  }

  @Post()
  create(@Body() dto: CreateMetricDto) {
    return this.metricsService.recordMetric(dto);
  }
}

