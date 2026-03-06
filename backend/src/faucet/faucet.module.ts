import { Module } from '@nestjs/common';
import { FaucetController } from './faucet.controller';
import { FaucetService } from './faucet.service';

@Module({
    controllers: [FaucetController],
    providers: [FaucetService],
    exports: [FaucetService],
})
export class FaucetModule { }
