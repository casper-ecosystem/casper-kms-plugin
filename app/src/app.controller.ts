import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiResponse,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { KeysService } from './keys/keys.service';
import { ConfigService } from '@nestjs/config';
import { ConfigType } from './config';
import { MockService } from './mock/mock.service';
import { unsigned_deploy_example } from './app.dto';
import { Deploy } from 'casper-ts-sdk';

@ApiTags('App')
@Controller()
export class AppController {
  protected readonly logger = new Logger(AppController.name);
  protected readonly dev_mode!: boolean;
  protected readonly mock_testing_mode!: boolean;

  constructor(
    private readonly configService: ConfigService<ConfigType, true>,
    private readonly appService: AppService,
    @Inject('KEYS_SERVICE')
    private readonly keysService: KeysService | MockService,
  ) {
    this.dev_mode = !!this.configService.get('dev_mode');
    this.mock_testing_mode = !!this.configService.get('mock_testing_mode');
    if (this.mock_testing_mode && this.dev_mode) {
      this.logger.warn('DO NOT USE MOCK_TESTING_MODE IN PRODUCTION');
    }
    if (this.mock_testing_mode) {
      this.logger.warn('MOCK_TESTING_MODE ACTIVE');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get Hello Message' })
  getHello(): string {
    let message = this.mock_testing_mode ? 'KMS MOCK_TESTING_MODE' : undefined;
    message = this.dev_mode ? 'KMS DEV_MODE' : message;
    return this.appService.getHello(message);
  }

  @Post('generateKeypair')
  @ApiOperation({ summary: 'Generate key pair on KMS and retrieve public key' })
  @ApiResponse({
    status: 201,
    description: 'Successful key generation',
    type: String,
  })
  generateKeypair() {
    return this.keysService.generateKeypair();
  }

  @Get('signDeployHash')
  @ApiOperation({ summary: 'Sign a deploy hash' })
  @ApiQuery({
    name: 'public_key',
    description: 'The public key associated with the deploy hash',
    example:
      '020228cbf540ab68a8ebb6b8d23937898cc1d0db311b27d10fec58c35b64aed6631a',
    required: true,
  })
  @ApiQuery({
    name: 'deploy_hash',
    description: 'The deploy hash that needs to be signed',
    example: 'f54ba7e43614e6a366cab74c243c3898fb95901cc0751b384a16fd8222d857b9',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Successful key signature',
    type: String,
  })
  async signDeployHash(
    @Query('deploy_hash') deploy_hash: string,
    @Query('public_key') public_key: string,
  ) {
    return this.keysService.signDeployHash(deploy_hash, public_key);
  }

  @Post('addSignature')
  @ApiOperation({
    summary: 'Helper: Add a given signature to a deploy object',
  })
  @ApiBody({
    type: String,
    required: true,
    description: 'Request body containing deploy',
    examples: {
      a: {
        summary: 'AddSignatureDto Body',
        value: {
          deploy: unsigned_deploy_example,
        },
      },
    },
    schema: {
      type: 'object',
      properties: {
        deploy: {
          type: 'string',
          example: unsigned_deploy_example,
        },
      },
      required: ['deploy'],
    },
  })
  @ApiQuery({
    name: 'public_key',
    description: 'The public key associated with the deploy',
    example:
      '020228cbf540ab68a8ebb6b8d23937898cc1d0db311b27d10fec58c35b64aed6631a',
    required: true,
  })
  @ApiQuery({
    name: 'signature',
    description: 'The signature to be added to the deploy object',
    example:
      '02aee398a29124b96832547801a87a007ccef122c3d2cb543fee1e30b7ec054bd6303a266a15e48a83f945af6e81fc3d8f089e47f99aea005e56d6b414b08ef404',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Successful signature addition',
    type: String,
  })
  addSignature(
    @Body('deploy') deploy: Deploy,
    @Query('public_key') public_key: string,
    @Query('signature') signature: string,
  ) {
    return this.appService.addSignature(deploy, public_key, signature);
  }

  @Post('signDeploy')
  @ApiOperation({ summary: 'Sign a deploy' })
  @ApiBody({
    type: String,
    required: true,
    description: 'Request body containing deploy',
    examples: {
      a: {
        summary: 'signDeployDto Body',
        value: {
          deploy: unsigned_deploy_example,
        },
      },
    },
    schema: {
      type: 'object',
      properties: {
        deploy: {
          type: 'string',
          example: unsigned_deploy_example,
        },
      },
      required: ['deploy'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Successful signed deploy',
    type: String,
  })
  async signDeploy(
    @Body('deploy') deploy: Deploy,
    @Query('public_key') public_key: string,
  ) {
    return this.keysService.signDeploy(deploy, public_key);
  }
}
