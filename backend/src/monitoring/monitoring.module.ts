import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { ValidatorsModule } from '../validators/validators.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [ValidatorsModule, PrismaModule],
    controllers: [MonitoringController],
    providers: [MonitoringService],
    exports: [MonitoringService],
})
export class MonitoringModule { }
