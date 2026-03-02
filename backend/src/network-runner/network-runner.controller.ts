import { Body, Controller, Post, Get, Delete, Query } from '@nestjs/common';
import { NetworkRunnerService } from './network-runner.service';

@Controller('network-runner')
export class NetworkRunnerController {
    constructor(private readonly runnerService: NetworkRunnerService) { }

    @Post('start')
    async startCluster() {
        return this.runnerService.startCluster();
    }

    @Get('status')
    async getStatus() {
        return this.runnerService.getClusterInfo();
    }

    @Post('add-node')
    async addNode(@Body('name') name: string) {
        return this.runnerService.addNode(name);
    }

    @Delete('remove-node')
    async removeNode(@Query('name') name: string) {
        return this.runnerService.removeNode(name);
    }
}
