import { Body, Controller, Post } from '@nestjs/common';
import { GenesisService } from './genesis.service';

@Controller('config')
export class GenesisController {
    constructor(private readonly genesisService: GenesisService) { }

    @Post('validate-genesis')
    validateGenesis(@Body() body: any) {
        return this.genesisService.validate(body);
    }
}
