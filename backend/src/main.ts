import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: ['log', 'warn', 'error'],  // Exclude 'debug' and 'verbose' to keep startup clean
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 4000;
  await app.listen(port);
  Logger.log(`Control plane API running on http://localhost:${port}`, 'Bootstrap');
}

bootstrap();

