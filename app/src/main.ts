import { NestFactory } from '@nestjs/core';
import * as express from 'express';

import { AppModule } from './app.module';
import config from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use('/sign', express.json({ limit: '2mb' }));

  await app.listen(config().port);
}
bootstrap();
