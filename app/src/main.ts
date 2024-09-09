import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import config from './config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json');

export { version };

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const swagger = new DocumentBuilder()
    .setTitle('KMS Plugin API')
    .setDescription('KMS Plugin API')
    .setVersion(version)
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api', app, document);
  await app.listen(config().port);
}
bootstrap();
