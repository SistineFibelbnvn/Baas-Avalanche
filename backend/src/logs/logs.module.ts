import { Global, Module } from '@nestjs/common';
import { LogsGateway } from './logs.gateway';
import { LogsService } from './logs.service';

@Global() // Make it global so we can inject LogsService everywhere without importing LogsModule everywhere
@Module({
    providers: [LogsGateway, LogsService],
    exports: [LogsService],
})
export class LogsModule { }
