import { Body, Controller, Get, Post } from '@nestjs/common';
import { BridgeService } from './bridge.service';

@Controller('bridge')
export class BridgeController {
    constructor(private readonly bridgeService: BridgeService) { }

    @Post('transfer')
    transfer(@Body() body: any) {
        return this.bridgeService.transfer(body);
    }

    @Get('history')
    getHistory() {
        return this.bridgeService.getHistory();
    }
}
