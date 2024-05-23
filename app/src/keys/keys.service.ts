import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Deploy, DeployHash, PublicKey } from 'casper-ts-sdk';
import {
  CreateKeyCommandInput,
  KMS,
  KeySpec,
  KeyUsageType,
  OriginType,
  SigningAlgorithmSpec,
} from '@aws-sdk/client-kms';
import { ConfigType } from '../config';
import { CryptoService } from '../crypto/crypto.service';
import { AppService } from '../app.service';

@Injectable()
export class KeysService {
  protected readonly logger = new Logger(KeysService.name);

  private createKms: KMS;
  private signKms: KMS;

  constructor(
    private readonly configService: ConfigService<ConfigType, true>,
    private readonly appService: AppService,
    private readonly cryptoService: CryptoService,
  ) {
    this.createKms = new KMS({
      region: this.configService.get('aws.region', { infer: true }),
      credentials: {
        accessKeyId: this.configService.get('aws.create.accessKeyId', {
          infer: true,
        }),
        secretAccessKey: this.configService.get('aws.create.secretAccessKey', {
          infer: true,
        }),
      },
    });

    this.signKms = new KMS({
      region: this.configService.get('aws.region', { infer: true }),
      credentials: {
        accessKeyId: this.configService.get('aws.sign.accessKeyId', {
          infer: true,
        }),
        secretAccessKey: this.configService.get('aws.sign.secretAccessKey', {
          infer: true,
        }),
      },
    });
  }

  private getKMS(sign = false): KMS {
    return sign ? this.signKms : this.createKms;
  }

  public async generateKeypair(): Promise<string> {
    const public_key = await this.createKey();
    if (!public_key) {
      const err = 'No public_key key generated';
      this.logger.error(err);
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return public_key;
  }

  public async signDeployHash(
    deploy_hash: string,
    public_key: string,
  ): Promise<string> {
    this.logger.debug('deploy_hash to sign', deploy_hash);

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
    const kms = this.getKMS(true);

    try {
      // Resolve the alias to get the actual key ID
      const { KeyMetadata } = await kms.describeKey({
        KeyId: `alias/${public_key}`,
      });

      // Extract the KeyId from the KeyMetadata object
      const KeyId = KeyMetadata?.KeyId;

      const binaryData = Buffer.from(deploy_hash, 'hex');
      const base64_string = binaryData.toString('base64');
      this.logger.debug('deployHash as base64_string', base64_string);

      // Sign the deploy hash asynchronously
      const signature = await kms.sign({
        KeyId,
        Message: binaryData,
        MessageType: 'RAW',
        SigningAlgorithm: SigningAlgorithmSpec.ECDSA_SHA_256,
      });

      const signature_asn1_base64 = Buffer.from(signature.Signature).toString(
        'base64',
      );
      this.logger.debug('signature_asn1_base64', signature_asn1_base64);
      // MEQCIEC/XbpuvXoJiPNmmWOt1lZ8TQSA1Je3ETwxgJYLzTU4AiAIdkD09QCk+led1e55o5HbAefdyTb3rAV1CousZWplag==

      const hex_signature_asn1_base64 = Buffer.from(
        signature.Signature,
      ).toString('hex');

      this.logger.debug('hex_signature_asn1_base64', hex_signature_asn1_base64);
      // 3044022040bf5dba6ebd7a0988f3669963add6567c4d0480d497b7113c3180960bcd35380220087640f4f500a4fa579dd5ee79a391db01e7ddc936f7ac05750a8bac656a656a

      const signature_hex = this.cryptoService.convertSignatureAsn1ToP1363(
        signature_asn1_base64,
      );
      this.logger.debug('signatureHex', signature_hex);

      return signature_hex;
    } catch (error) {
      this.logger.error('Error signing deploy:', error);
      throw new HttpException(
        'Error signing deploy',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async createKey(): Promise<string> {
    const params: CreateKeyCommandInput = {
      Description: 'SECP256K1 Key',
      KeyUsage: KeyUsageType.SIGN_VERIFY,
      Origin: OriginType.AWS_KMS,
      KeySpec: KeySpec.ECC_SECG_P256K1,
    };

    const kms = this.getKMS();

    return new Promise<string>((resolve, reject) => {
      kms.createKey(params, async (err, data) => {
        if (err) {
          this.logger.error('Error creating key:', err);
          reject(err);
        } else {
          const keyId = data.KeyMetadata.KeyId;
          this.logger.debug('Key created successfully:', keyId);

          const public_key_params = { KeyId: keyId };
          try {
            const public_key_data = await kms.getPublicKey(public_key_params);
            this.logger.debug(public_key_data);

            const public_key_buffer = Buffer.from(public_key_data.PublicKey);
            this.logger.debug(
              'public_key_buffer',
              public_key_buffer.toString('base64'),
            );

            const secp256k1_hex = this.cryptoService.publicKeyHexFromPem(
              public_key_buffer.toString('base64'),
            );
            this.logger.debug('secp256k1_hex', secp256k1_hex);
            const publicKeyBytes = Buffer.from(secp256k1_hex, 'hex');

            const compressed_public_key =
              this.cryptoService.convertSecp256k1PublicKeyToCompressedForm(
                publicKeyBytes,
              );

            const public_key =
              this.cryptoService.casperSecpSignaturePrefix +
              Buffer.from(compressed_public_key).toString('hex');

            this.logger.debug(
              'Public key retrieved and compressed successfully:',
              public_key,
            );
            const alias_params = {
              AliasName: `alias/${public_key}`,
              TargetKeyId: keyId,
            };
            await kms.createAlias(alias_params);

            resolve(public_key);
          } catch (error) {
            this.logger.error('Error creating alias:', error);
            reject(error);
          }
        }
      });
    });
  }
}
