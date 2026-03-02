import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(4000),
  DATABASE_URL: Joi.string().uri().required(),
  RPC_URL: Joi.string().uri().required(),
  PROMETHEUS_METRICS_URL: Joi.string().uri().required(),
  ALERT_WEBHOOK_URL: Joi.string().allow('').optional(),
  JWT_SECRET: Joi.string().min(12).optional(),
  MFA_ISSUER: Joi.string().optional(),
  REDIS_URL: Joi.string().uri().optional(),
  AVALANCHE_CLI_PATH: Joi.string().optional(),
  AVALANCHE_WORKDIR: Joi.string().optional(),
  AVALANCHE_NODE_HOST: Joi.string().hostname().optional(),
  AVALANCHE_NODE_PORT: Joi.number().optional(),
  AVALANCHE_NODE_PROTOCOL: Joi.string().valid('http', 'https').optional(),
  AVALANCHE_NODE_USERNAME: Joi.string().optional(),
  AVALANCHE_NODE_PASSWORD: Joi.string().optional(),
  AVALANCHE_PCHAIN_SUBNET_ID: Joi.string().optional(),
});

