import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  publicKeyFromSecretKey,
  generateSecretKey_secp256k1,
  Deploy,
  SDK,
  DeployStrParams,
  PaymentStrParams,
  DeployHash,
  PublicKey,
} from 'casper-ts-sdk';
import { AppService } from '../app.service';

export type KeyPair = {
  type: string;
  public_key: string;
  private_key: string;
};

// ##### Fake kms for CI/CD ##########

@Injectable()
export class MockService {
  private keys: KeyPair[] = [];

  protected readonly logger = new Logger(MockService.name);

  private readonly sdk: SDK = new SDK();

  constructor(private readonly appService: AppService) {
    this.logger.warn(
      'MOCK_TESTING_MODE IS ON, SERVICE WILL BE MOCKED',
      'ALL DATA ARE TEMPORARY AND WILL BE LOST ON RESTART',
    );
  }

  public async generateKeypair(): Promise<string> {
    this.logger.debug('generate key pair');
    const private_key: string = generateSecretKey_secp256k1();
    if (!private_key) {
      const err = 'No private key generated';
      this.logger.error(err);
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const public_key: string = publicKeyFromSecretKey(private_key);
    if (!public_key) {
      const err = 'No public_key key generated';
      this.logger.error(err);
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const keyPair: KeyPair = {
      type: 'secp256k1',
      public_key: public_key,
      private_key,
    };
    if (!this.keys[public_key]) {
      this.keys[public_key] = keyPair;
    }
    return public_key;
  }

  public async signDeployHash(
    deploy_hash: string,
    public_key: string,
  ): Promise<string> {
    this.logger.debug('deploy hash to sign', deploy_hash);

    // Validate parameters
    try {
      new DeployHash(deploy_hash);
      new PublicKey(public_key);
    } catch (error) {
      this.logger.debug(
        `Error reading parameters \npublic_key : ${public_key}\ndeploy_hash : ${deploy_hash}`,
      );
      if (error) {
        this.logger.error(error);
      }
      throw new HttpException(
        'reading deploy parameters',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return this.sign(deploy_hash, public_key);
  }

  public async signDeploy(
    deploy_to_sign: Deploy,
    public_key: string,
  ): Promise<string> {
    const signature = await this.sign(
      deploy_to_sign.hash.toString(),
      public_key,
    );
    return (
      signature &&
      this.appService.addSignature(deploy_to_sign, public_key, signature)
    );
  }

  private async sign(deploy_hash: string, public_key: string): Promise<string> {
    const signed_deploy = this.makeFakeTransferDeploy(deploy_hash, public_key);
    const signature_hex = signed_deploy.toJson()?.approvals[0]?.signature;
    try {
      const signature = Buffer.from(signature_hex, 'hex').toString('hex');
      this.logger.debug('signature', signature);
      return signature;
    } catch (error) {
      this.logger.debug(`Error signature could not be read as hexadecimal`);
      if (error) {
        this.logger.error(error);
      }
      throw new HttpException('signing', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private makeFakeTransferDeploy(
    deploy_hash: string,
    public_key: string,
  ): Deploy {
    const payment_amount = '100000000';
    const transfer_amount = '2500000000';
    const target_account =
      '0187adb3e0f60a983ecc2ddb48d32b3deaa09388ad3bc41e14aeb19959ecc60b54';
    const deploy_params = new DeployStrParams('test', public_key, undefined);
    const payment_params = new PaymentStrParams(payment_amount);
    const transfer_deploy = Deploy.withTransfer(
      transfer_amount,
      target_account,
      undefined, // transfer_id
      deploy_params,
      payment_params,
    );
    let deploy_to_sign_string = JSON.stringify(transfer_deploy.toJson());
    deploy_to_sign_string = deploy_to_sign_string.replace(
      /"hash":\s*"[^"]+"/,
      `"hash": "${deploy_hash}"`,
    );
    const deploy_to_sign = new Deploy(JSON.parse(deploy_to_sign_string));
    const err = `Could not validate deploy ${deploy_hash}`;
    if (!deploy_to_sign.validateDeploySize()) {
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const private_key_pair = this.getPrivateKey(public_key);
    const signed_deploy = this.sdk.sign_deploy(
      deploy_to_sign,
      private_key_pair.private_key,
    );
    return signed_deploy;
  }

  private getPrivateKey(key_id: string): KeyPair {
    if (this.keys[key_id]) {
      return this.keys[key_id];
    } else {
      const err = `No private key for this public key ${key_id}`;
      this.logger.error(err);
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
