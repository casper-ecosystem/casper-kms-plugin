import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as express from 'express';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  //app.setGlobalPrefix('rpc');
  app.use('/sign', express.json({ limit: '2mb' }));
  await app.listen(8080);
}
bootstrap();
