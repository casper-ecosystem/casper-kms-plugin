import { Body, Controller, Get, Post } from '@nestjs/common';

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

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly keysService: KeysService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('generateKeypair')
  generateKeypair() {
    return this.keysService.generateKeypair();
  }

  @Post('sign')
  async sign(@Body() signDto: SignDto) {
    return this.keysService.signDeployHash(
      signDto.deploy_hash,
      signDto.public_key,
    );
  }
}
