import { Injectable, Logger } from '@nestjs/common';
import { util, asn1 } from 'node-forge';

@Injectable()
export class CryptoService {
  protected readonly logger = new Logger(CryptoService.name);

  public readonly casperSecpSignaturePrefix = '02';

  public convertSignatureAsn1ToP1363(signatureAsn1Base64: string) {
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

  public publicKeyHexFromPem(publicPem: string): string {
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

  public convertSecp256k1PublicKeyToCompressedForm(secp256k1Bytes: Uint8Array) {
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
}
