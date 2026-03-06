import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { FaucetService } from './faucet.service';

@Controller('faucet')
export class FaucetController {
    constructor(private readonly faucetService: FaucetService) { }

    @Get('info')
    getInfo() {
        return this.faucetService.getFaucetInfo();
    }

    @Post('fund')
    async fund(@Body() body: {
        address: string;
        amount?: string;
        rpcUrl?: string;
        networkName?: string;
    }) {
        return this.faucetService.fundAddress(body);
    }

    @Get('balance')
    async getBalance(
        @Query('address') address: string,
        @Query('rpcUrl') rpcUrl: string,
    ) {
        return this.faucetService.getBalance(
            address,
            rpcUrl || 'http://127.0.0.1:9650/ext/bc/C/rpc'
        );
    }
}
