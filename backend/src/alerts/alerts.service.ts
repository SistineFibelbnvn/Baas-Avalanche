import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateAlertDto) {
    return this.prisma.alert.create({
      data: {
        rule: dto.rule,
        severity: dto.severity,
        message: dto.message,
        status: dto.status,
        metadata: (dto.metadata ?? {}) as any,
      },
    });
  }

  async list(limit = 50) {
    return this.prisma.alert.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

