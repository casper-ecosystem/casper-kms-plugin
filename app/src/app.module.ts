import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import config from './config';
import { KeysService } from './keys/keys.service';
import { MockService } from './mock/mock.service';
import { CryptoService } from './crypto/crypto.service';
import { JsonBodyParserMiddleware } from './app.middleware';

export const keysServiceFactory = (
  configService: ConfigService,
  appService: AppService,
  cryptoService: CryptoService,
) => {
  const mock_testing_mode = configService.get<boolean>('mock_testing_mode');
  return mock_testing_mode
    ? new MockService(appService)
    : new KeysService(configService, appService, cryptoService);
};

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, load: [config] })],
  controllers: [AppController],
  providers: [
    AppService,
    CryptoService,
    {
      provide: 'KEYS_SERVICE',
      useFactory: keysServiceFactory,
      inject: [ConfigService, AppService, CryptoService],
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JsonBodyParserMiddleware)
      .forRoutes(
        { path: 'signDeploy', method: RequestMethod.POST },
        { path: 'addSignature', method: RequestMethod.POST },
      );
  }
}
