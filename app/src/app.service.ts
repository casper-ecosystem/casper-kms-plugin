import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Deploy, Verbosity, jsonPrettyPrint } from 'casper-ts-sdk';
@Injectable()
export class AppService {
  protected readonly logger = new Logger(AppService.name);

  constructor() { }

  getHello(message: string = 'KMS'): string {
    return `Hello ${message}!`;
  }

  // Helper method to add a signature to a deploy
  public addSignature(
    deploy_to_sign: Deploy,
    public_key: string,
    signature: string,
  ): string {
    this.logger.debug('adding signature to deploy', signature);
    if (!deploy_to_sign) {
      this.logger.error(`empty deploy`);
      throw new HttpException('empty deploy', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    try {
      const deploy = new Deploy(deploy_to_sign);
      if (!deploy.validateDeploySize()) {
        throw new HttpException(
          `invalid deploy size`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const signed_deploy = deploy.addSignature(public_key, signature);
      return jsonPrettyPrint(signed_deploy.toJson(), Verbosity.Low);
    } catch (error) {
      this.logger.debug(
        `Error signing with parameters \npublic_key : ${public_key}\nsignature : ${signature}`,
      );
      if (error) {
        this.logger.error(error);
      }
      throw new HttpException(
        'adding signature to deploy',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
