import { Module } from '@nestjs/common';
import { GenesisController } from './genesis.controller';
import { GenesisService } from './genesis.service';

@Module({
    controllers: [GenesisController],
    providers: [GenesisService],
})
export class GenesisModule { }
