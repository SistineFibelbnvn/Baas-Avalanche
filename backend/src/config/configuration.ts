export interface AppConfig {
  port: number;
  databaseUrl: string;
  rpcUrl: string;
  prometheusUrl: string;
  alertWebhookUrl: string;
  redisUrl: string;
  avalancheNode: {
    host: string;
    port: number;
    protocol: string;
    username?: string;
    password?: string;
    defaultSubnetId: string;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  databaseUrl: process.env.DATABASE_URL ?? '',
  rpcUrl: process.env.RPC_URL ?? '',
  prometheusUrl: process.env.PROMETHEUS_METRICS_URL ?? '',
  alertWebhookUrl: process.env.ALERT_WEBHOOK_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? '',
  avalancheNode: {
    host: process.env.AVALANCHE_NODE_HOST ?? '127.0.0.1',
    port: parseInt(process.env.AVALANCHE_NODE_PORT ?? '9650', 10),
    protocol: process.env.AVALANCHE_NODE_PROTOCOL ?? 'http',
    username: process.env.AVALANCHE_NODE_USERNAME || undefined,
    password: process.env.AVALANCHE_NODE_PASSWORD || undefined,
    defaultSubnetId:
      process.env.AVALANCHE_PCHAIN_SUBNET_ID ?? '11111111111111111111111111111111LpoYY',
  },
});

