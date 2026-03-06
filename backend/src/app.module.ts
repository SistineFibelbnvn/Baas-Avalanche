import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';

import { AlertsModule } from './alerts/alerts.module';
import { AvalancheModule } from './avalanche/avalanche.module';
import { BenchmarksModule } from './benchmarks/benchmarks.module';
import { validationSchema } from './config/config.validation';
import configuration from './config/configuration';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { NodeStatusModule } from './node-status/node-status.module';
import { PChainModule } from './pchain/pchain.module';
import { PrismaModule } from './prisma/prisma.module';
import { SubnetsModule } from './subnets/subnets.module';
import { ValidatorsModule } from './validators/validators.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { ContractsModule } from './contracts/contracts.module';
import { BridgeModule } from './bridge/bridge.module';
import { GenesisModule } from './genesis/genesis.module';
import { LogsModule } from './logs/logs.module';
import { NetworkRunnerModule } from './network-runner/network-runner.module';
import { RpcProxyModule } from './rpc-proxy/rpc-proxy.module';
import { FaucetModule } from './faucet/faucet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    AuthModule,
    PrismaModule,
    AvalancheModule,
    HealthModule,
    MonitoringModule,
    ValidatorsModule,
    ContractsModule,
    BenchmarksModule,
    MetricsModule,
    AlertsModule,
    SubnetsModule,
    PChainModule,
    BridgeModule,
    GenesisModule,
    LogsModule,
    NodeStatusModule,
    NetworkRunnerModule,
    RpcProxyModule,
    FaucetModule,
  ],
})
export class AppModule { }
