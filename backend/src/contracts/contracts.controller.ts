import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ContractsService, DeployedContract } from './contracts.service';

@Controller('contracts')
export class ContractsController {
    constructor(private readonly contractsService: ContractsService) { }

    @Get()
    findAll(@Query('subnetId') subnetId?: string, @Query('ownerAddress') ownerAddress?: string) {
        return this.contractsService.findAll(subnetId, ownerAddress);
    }

    @Post()
    create(@Body() contract: Omit<DeployedContract, 'id' | 'deployedAt'>) {
        return this.contractsService.create(contract);
    }

    @Post('compile')
    async compile(@Body() body: { sourceCode: string, contractName?: string }) {
        return this.contractsService.compileSolidity(body.sourceCode, body.contractName);
    }

    @Post('deploy')
    async deploy(@Body() deployDto: {
        name: string;
        sourceCode: string;
        bytecode: string;
        abi: any;
        network: string;
        args: any[];
    }) {
        return this.contractsService.deployContract(deployDto);
    }

    @Post(':id/read')
    async read(@Param('id') id: string, @Body() body: { method: string, args: any[] }) {
        return this.contractsService.readContract(id, body.method, body.args);
    }

    @Post(':id/write')
    async write(@Param('id') id: string, @Body() body: { method: string, args: any[] }) {
        return this.contractsService.writeContract(id, body.method, body.args);
    }
}
