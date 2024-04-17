import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeployHash, PublicKey } from 'casper-sdk';
import {
  CreateKeyCommandInput,
  KMS,
  KeySpec,
  KeyUsageType,
  OriginType,
  SigningAlgorithmSpec,
} from '@aws-sdk/client-kms';
import { util, asn1 } from 'node-forge';

import { ConfigType } from 'src/config';

@Injectable()
export class KeysService {
  protected readonly logger = new Logger(KeysService.name);

  private casperSecpSignaturePrefix = '02';
  private createKms: KMS;
  private signKms: KMS;

  constructor(private readonly configService: ConfigService<ConfigType, true>) {
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

  public async generateKeypair() {
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
    public_key_hex: string,
  ): Promise<string> {
    this.logger.debug('deploy_hash to sign', deploy_hash);

    // Validate parameters
    try {
      new DeployHash(deploy_hash);
      new PublicKey(public_key_hex);
    } catch (error) {
      this.logger.debug(
        `Error reading parameters \npublic_key_hex : ${public_key_hex}\ndeploy_hash : ${deploy_hash}`,
      );
      if (error) {
        this.logger.error(error);
      }
      throw new HttpException(
        'reading deploy parameters',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const kms = this.getKMS(true);

    try {
      // Resolve the alias to get the actual key ID
      const { KeyMetadata } = await kms.describeKey({
        KeyId: `alias/${public_key_hex}`,
      });

      // Extract the KeyId from the KeyMetadata object
      const keyId = KeyMetadata?.KeyId;

      const binaryData = Buffer.from(deploy_hash, 'hex');
      const base64String = binaryData.toString('base64');
      this.logger.debug('deployHash base64String', base64String);

      // Sign the deploy hash asynchronously
      const signature = await kms.sign({
        KeyId: keyId,
        Message: binaryData,
        MessageType: 'RAW',
        SigningAlgorithm: SigningAlgorithmSpec.ECDSA_SHA_256,
      });

      const signatureAsn1Base64 = Buffer.from(signature.Signature).toString(
        'base64',
      );
      this.logger.debug('signatureAsn1Base64', signatureAsn1Base64);
      // MEQCIEC/XbpuvXoJiPNmmWOt1lZ8TQSA1Je3ETwxgJYLzTU4AiAIdkD09QCk+led1e55o5HbAefdyTb3rAV1CousZWplag==

      const hexSignatureAsn1Base64 = Buffer.from(signature.Signature).toString(
        'hex',
      );

      this.logger.debug('hexSignatureAsn1Base64', hexSignatureAsn1Base64);
      // 3044022040bf5dba6ebd7a0988f3669963add6567c4d0480d497b7113c3180960bcd35380220087640f4f500a4fa579dd5ee79a391db01e7ddc936f7ac05750a8bac656a656a
      const signatureHex =
        this.convertSignatureAsn1ToP1363(signatureAsn1Base64);
      this.logger.debug('signatureHex', signatureHex);

      return signatureHex;
    } catch (error) {
      this.logger.error('Error signing deploy:', error);
      throw new HttpException(
        'Error signing deploy',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private convertSignatureAsn1ToP1363(signatureAsn1Base64: string) {
    const length = 32;
    // Create a buffer to store the result
    const result = Buffer.alloc(length * 2);
    // Verify input
    const signatureAsn1 = util.decode64(signatureAsn1Base64);
    if (!signatureAsn1 || signatureAsn1.length === 0) {
      throw new Error('No signature data provided to convert.');
    }
    if (signatureAsn1.length < result.length) {
      throw new Error('The signature provided is too short.');
    }
    // Simple check if the signature length suggests it's already in the P1363 format
    if (signatureAsn1.length % length === 0) {
      return signatureAsn1;
    }

    try {
      // Decode the ASN.1 sequence
      const asn1_from_der = asn1.fromDer(signatureAsn1);

      // Convert ASN.1 sequence to an array of values
      const asn1Sequence = asn1_from_der.value as asn1.Asn1[];
      if (asn1Sequence.length !== 2) {
        this.logger.error('asn1Sequence', asn1Sequence);
        throw new Error('Invalid ASN.1 sequence length');
      }
      this.logger.debug('asn1Sequence', asn1Sequence);

      // Extract r and s values from ASN.1 sequence
      const r = asn1Sequence[0].value as string;
      const s = asn1Sequence[1].value as string;

      // Convert r and s to byte arrays
      let rBuffer = util.createBuffer(r, 'raw').toHex();
      let sBuffer = util.createBuffer(s, 'raw').toHex();

      this.logger.debug(
        rBuffer.length,
        result.length,
        rBuffer.startsWith('00'),
      );
      this.logger.debug(
        sBuffer.length,
        result.length,
        sBuffer.startsWith('00'),
      );

      // Remove leading zeros if r or s is 33 bytes in hex starting with 0x00
      if (rBuffer.length > result.length && rBuffer.startsWith('00')) {
        rBuffer = rBuffer.slice(2);
      }
      if (sBuffer.length > length && sBuffer.startsWith('00')) {
        sBuffer = sBuffer.slice(2);
      }

      this.logger.debug('modified rBuffer:', rBuffer);
      this.logger.debug('modified sBuffer:', sBuffer);

      const concatenatedHex = rBuffer + sBuffer;

      const full33BytesHexSignature =
        this.casperSecpSignaturePrefix + concatenatedHex;
      this.logger.debug('P1363 Signature:', full33BytesHexSignature);
      return full33BytesHexSignature;
    } catch (error) {
      throw new Error(
        'Error while trying to decode ASN.1 from signature: ' + error.message,
      );
    }
  }

  private publicHexFromPem(publicPem: string): string {
    const cleanPem = publicPem
      .replace(/\n/g, '')
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '');
    const binPem = Buffer.from(cleanPem, 'base64');
    const rLength = binPem[3];
    const sLength = binPem[5 + rLength] - 1; // Adjusted length to account for ASN.1 encoding
    const rStart = 4;
    const sStart = 3 + rStart + rLength; // Adjusted start index
    // this.logger.log('rLength:', rLength);
    // this.logger.log('rStart:', rStart);
    // this.logger.log('sStart:', sStart);
    // this.logger.log('binPem length:', binPem.length);
    // this.logger.log('sStart + sLength:', sStart + sLength);
    const s = binPem.subarray(sStart, sStart + sLength);
    const hexString = Array.from(s, (val) =>
      val.toString(16).padStart(2, '0'),
    ).join('');
    return hexString;
  }

  private convertSecp256k1PublicKeyToCompressedForm(
    secp256k1Bytes: Uint8Array,
  ) {
    if (!secp256k1Bytes || secp256k1Bytes.length === 0) {
      throw new Error(
        'Expected secp256k1 public key, but got null/empty byte array.',
      );
    }
    if (
      secp256k1Bytes.length === 33 &&
      (secp256k1Bytes[0] === 0x02 || secp256k1Bytes[0] === 0x03)
    ) {
      // Data is already in the right format, <0x02|0x03><x_coordinate>
      return secp256k1Bytes;
    } else if (secp256k1Bytes.length === 65 && secp256k1Bytes[0] === 0x04) {
      // Data is in format <0x04><x_coordinate><y_coordinate>

      // Create space for result in format <0x02|0x03><x_coordinate>
      const secp256k1PublicKeyToCompressed = new Uint8Array(33);

      // Write the correct prefix (0x02 for even y-coordinate, 0x03 for odd y-coordinate)
      const yCoordinateIsEven = (secp256k1Bytes[64] & 1) !== 1;
      secp256k1PublicKeyToCompressed[0] = yCoordinateIsEven ? 0x02 : 0x03;

      // Copy the 32-byte x-coordinate
      secp256k1PublicKeyToCompressed.set(secp256k1Bytes.slice(1, 33), 1);

      return secp256k1PublicKeyToCompressed;
    } else {
      throw new Error(
        'Expected secp256k1 public key, but received data is of wrong format',
      );
    }
  }

  private async createKey(): Promise<string> {
    const params: CreateKeyCommandInput = {
      Description: 'Your SECP256K1 Key Description',
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

          const publicKeyParams = { KeyId: keyId };
          try {
            const publicKeyData = await kms.getPublicKey(publicKeyParams);
            this.logger.debug(publicKeyData);

            const publicKeyBuffer = Buffer.from(publicKeyData.PublicKey);
            this.logger.debug(
              'publicKeyBuffer',
              publicKeyBuffer.toString('base64'),
            );

            const secp256k1Hex = this.publicHexFromPem(
              publicKeyBuffer.toString('base64'),
            );
            this.logger.debug('secp256k1Hex', secp256k1Hex);
            const publicKeyBytes = Buffer.from(secp256k1Hex, 'hex');

            const compressedPublicKey =
              this.convertSecp256k1PublicKeyToCompressedForm(publicKeyBytes);

            const publicKeyHex =
              this.casperSecpSignaturePrefix +
              Buffer.from(compressedPublicKey).toString('hex');

            this.logger.debug(
              'Public key retrieved and compressed successfully:',
              publicKeyHex,
            );
            const aliasParams = {
              AliasName: `alias/${publicKeyHex}`,
              TargetKeyId: keyId,
            };
            await kms.createAlias(aliasParams);

            resolve(publicKeyHex);
          } catch (error) {
            this.logger.error('Error creating alias:', error);
            reject(error);
          }
        }
      });
    });
  }
}
