import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RpcProxyController } from './rpc-proxy.controller';
import { RpcProxyService } from './rpc-proxy.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [HttpModule, PrismaModule],
    controllers: [RpcProxyController],
    providers: [RpcProxyService],
    exports: [RpcProxyService],
})
export class RpcProxyModule { }
