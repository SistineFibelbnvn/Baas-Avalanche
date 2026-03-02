import { Controller, Post, Body, Param, HttpCode } from '@nestjs/common';
import { RpcProxyService } from './rpc-proxy.service';

@Controller('rpc/proxy')
export class RpcProxyController {
    constructor(private readonly proxyService: RpcProxyService) { }

    @Post(':subnetId')
    @HttpCode(200)
    async proxy(@Param('subnetId') subnetId: string, @Body() body: any) {
        return this.proxyService.forwardRequest(subnetId, body);
    }
}
