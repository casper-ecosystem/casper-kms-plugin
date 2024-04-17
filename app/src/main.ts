import { NestFactory } from '@nestjs/core';
import * as express from 'express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use('/sign', express.json({ limit: '2mb' }));

  const PORT = parseInt(process.env.PORT, 10) || 8080;

  await app.listen(PORT);
}
bootstrap();
