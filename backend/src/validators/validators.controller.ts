import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ValidatorsService } from './validators.service';

@Controller('validators')
export class ValidatorsController {
  constructor(private readonly validatorsService: ValidatorsService) { }

  @Get()
  findAll(@Query('subnetId') subnetId?: string) {
    return this.validatorsService.findAll(subnetId);
  }

  @Post()
  addValidator(@Body() dto: any) {
    return this.validatorsService.addValidator(dto);
  }

  @Post('/fetch-node-id')
  fetchNodeId() {
    return this.validatorsService.fetchNodeId();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.validatorsService.remove(id);
  }
}

