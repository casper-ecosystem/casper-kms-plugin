import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KeysService } from './keys/keys.service';
import { ConfigService } from 'aws-sdk';
import { MockService } from './mock/mock.service';
import { keysServiceFactory } from './app.module';
import { CryptoService } from './crypto/crypto.service';
import { ConfigModule } from '@nestjs/config';
import config from './config';

const _config = config();
_config.mock_testing_mode = true;

describe('AppController', () => {
  let appController: AppController;
  let keysService: KeysService | MockService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        return key === 'mock_testing_mode' ? _config.mock_testing_mode : false;
      }),
    };

    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => _config],
        }),
      ],
      controllers: [AppController],
      providers: [
        AppService,
        CryptoService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'KEYS_SERVICE',
          useFactory: keysServiceFactory,
          inject: [ConfigService, AppService, CryptoService],
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    keysService = app.get('KEYS_SERVICE');
  });

  describe('root', () => {
    it('should keysService', () => {
      expect(keysService).toBeDefined();
    });
    it('should return "Hello KMS!"', () => {
      expect(appController.getHello()).toBe('Hello KMS MOCK_TESTING_MODE!');
    });
  });
});
