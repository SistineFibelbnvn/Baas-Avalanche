import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  list(@Query('limit') limit = 50) {
    return this.alertsService.list(Number(limit));
  }

  @Post()
  create(@Body() dto: CreateAlertDto) {
    return this.alertsService.create(dto);
  }
}

