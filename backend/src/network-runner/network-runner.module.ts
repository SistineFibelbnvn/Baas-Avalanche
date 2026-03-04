import { Module } from '@nestjs/common';
import { NetworkRunnerService } from './network-runner.service';
import { NetworkRunnerController } from './network-runner.controller';

@Module({
    controllers: [NetworkRunnerController],
    providers: [NetworkRunnerService],
    exports: [NetworkRunnerService],
})
export class NetworkRunnerModule { }
