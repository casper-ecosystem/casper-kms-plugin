import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiResponse, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AppService } from './app.service';
import { KeysService } from './keys/keys.service';

export class SignDto {
  deploy_hash: string;
  public_key: string;

  constructor(deploy_hash: string, public_key: string) {
    this.deploy_hash = deploy_hash;
    this.public_key = public_key;
  }
}

@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly keysService: KeysService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get Hello Message' })
  getHello(): string {
    return this.appService.getHello();
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

  @Post('sign')
  @ApiOperation({ summary: 'Sign a deploy hash' })
  @ApiBody({
    type: SignDto,
    required: true,
    description: 'Request body containing deploy hash and public key',
    examples: {
      a: {
        summary: 'SignDto Body',
        value: {
          public_key:
            '023e5ad7edb6b72e6eac100e25a1c42b8d608744f3b6b38269cd80aac00464773b',
          deploy_hash:
            'f54ba7e43614e6a366cab74c243c3898fb95901cc0751b384a16fd8222d857b9',
        } as SignDto,
      },
    },
    schema: {
      type: 'object',
      properties: {
        public_key: { type: 'string', example: '023e5ad7edb6b72e6eac100e25a1c42b8d608744f3b6b38269cd80aac00464773b' },
        deploy_hash: { type: 'string', example: 'f54ba7e43614e6a366cab74c243c3898fb95901cc0751b384a16fd8222d857b9' },
      },
      required: ['public_key', 'deploy_hash'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Successful key signature',
    type: String,
  })
  async sign(@Body() signDto: SignDto) {
    return this.keysService.signDeployHash(
      signDto.deploy_hash,
      signDto.public_key,
    );
  }
}
