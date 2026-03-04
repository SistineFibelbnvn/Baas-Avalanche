import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { CreateSubnetDto } from './dto/create-subnet.dto';
import { SubnetsService } from './subnets.service';

@Controller('subnets')
@UseGuards(AuthGuard('jwt'))
export class SubnetsController {
  constructor(private readonly subnetsService: SubnetsService) { }

  @Post()
  create(@Body() dto: CreateSubnetDto, @CurrentUser() user: any) {
    // Override the owner with the authenticated user ID
    dto.ownerAddress = user.id;
    return this.subnetsService.create(dto);
  }

  @Get()
  findAll(@Query('ownerAddress') ownerAddress?: string, @CurrentUser() user?: any) {
    // Only fetch subnets for the logged-in user
    return this.subnetsService.findAll(user?.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subnetsService.findOne(id);
  }

  @Get(':id/operations')
  operations(@Param('id') id: string) {
    return this.subnetsService.getOperations(id);
  }

  @Get(':id/status')
  getStatus(@Param('id') id: string) {
    return this.subnetsService.getStatus(id);
  }

  @Post(':id/start')
  start(@Param('id') id: string, @CurrentUser() user: any) {
    return this.subnetsService.start(id, user?.id);
  }

  @Post(':id/stop')
  stop(@Param('id') id: string, @CurrentUser() user: any) {
    return this.subnetsService.stop(id, user?.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.subnetsService.delete(id, user?.id);
  }
}
