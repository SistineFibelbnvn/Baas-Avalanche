import { Module } from '@nestjs/common';

import { NodeStatusController } from './node-status.controller';
import { NodeStatusService } from './node-status.service';
import { NodeStatusGateway } from './node-status.gateway';

@Module({
  controllers: [NodeStatusController],
  providers: [NodeStatusService, NodeStatusGateway],
  exports: [NodeStatusService],
})
export class NodeStatusModule { }

