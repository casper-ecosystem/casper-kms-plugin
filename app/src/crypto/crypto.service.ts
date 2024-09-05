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
      //  this.logger.debug('asn1Sequence', asn1Sequence);

      // this.logger.debug('>> r as string:', asn1Sequence[0].value);
      // this.logger.debug('>> s as string:', asn1Sequence[1].value);

      // Extract r and s values from ASN.1 sequence
      const r = Buffer.from(asn1Sequence[0].value as string, 'binary');
      const s = Buffer.from(asn1Sequence[1].value as string, 'binary');

      this.logger.debug(`>> r length: ${r.length}`);
      this.logger.debug(`>> s length: ${s.length}`);

      // Convert r and s to byte arrays
      const rBufferNotPadded = util.createBuffer(r, 'raw').toHex();
      const sBufferNotPadded = util.createBuffer(s, 'raw').toHex();

      // Warn if r or s is below 32 bytes
      this.logger.debug(
        `>> rBufferNotPadded raw to Hex length is : ${rBufferNotPadded.length}`,
      );
      if (rBufferNotPadded.length < result.length) {
        this.logger.warn(
          `>> rBuffer raw to Hex length ${rBufferNotPadded.length} is shorter than expected ${result.length}`,
        );
      }

      this.logger.debug(
        `>> sBufferNotePadded raw to Hex length is : ${sBufferNotPadded.length}`,
      );
      if (sBufferNotPadded.length < result.length) {
        this.logger.warn(
          `>> sBuffer raw to Hex length ${sBufferNotPadded.length} is shorter than expected ${result.length}`,
        );
      }

      // Padding with leading zeros if r or s is below 32 bytes in hex to 0x00
      let rBuffer = rBufferNotPadded.padStart(result.length, '0');
      let sBuffer = sBufferNotPadded.padStart(result.length, '0');

      this.logger.debug('>> rBuffer raw to Hex:', rBuffer);
      this.logger.debug(`>> rBuffer length: ${rBuffer.length}`);
      this.logger.debug(`>> rBuffer expected length: ${result.length}`);
      this.logger.debug(
        `>> rBuffer starts with leading 00: ${rBuffer.startsWith('00')}`,
      );

      // Remove leading zeros if r is above 32 bytes in hex starting with 0x00
      if (rBuffer.length > result.length && rBuffer.startsWith('00')) {
        this.logger.warn('rBuffer before slice', rBuffer);
        rBuffer = rBuffer.slice(2);
        this.logger.warn('rBuffer after slice', rBuffer);
      }

      this.logger.debug('>> final rBuffer:', rBuffer);
      this.logger.debug(`>> rBuffer length: ${rBuffer.length}`);

      this.logger.debug('>> sBuffer raw to Hex:', sBuffer);
      this.logger.debug(`>> sBuffer length: ${sBuffer.length}`);
      this.logger.debug(`>> sBuffer expected length: ${result.length}`);
      this.logger.debug(
        `>> sBuffer starts with leading 00: ${sBuffer.startsWith('00')}`,
      );

      // Remove leading zeros if s is above 32 bytes in hex starting with 0x00 and normalize s
      if (sBuffer.length > result.length && sBuffer.startsWith('00')) {
        this.logger.warn('sBuffer before slice', sBuffer);
        sBuffer = sBuffer.slice(2);
        this.logger.warn('sBuffer after slice', sBuffer);

        // "High" s buffer needs to be normalized as per https://github.com/bitcoin/bips/blob/master/bip-0062.mediawiki#user-content-Low_S_values_in_signatures
        sBuffer = this.normalizeS(sBuffer);
      }

      this.logger.debug('>> final sBuffer:', sBuffer);
      this.logger.debug(`>> sBuffer length: ${sBuffer.length}`);

      const concatenatedHex = rBuffer + sBuffer;

      this.logger.debug(
        `>> concatenated signature Hex length: ${concatenatedHex.length}`,
      );

      const expected_length = result.length * 2;
      if (expected_length !== concatenatedHex.length) {
        throw new Error(
          `Error while trying to decode ASN.1 from signature: concatenated Hex length ${concatenatedHex.length} not ${expected_length} `,
        );
      }
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

  private normalizeS(sBuffer: string): string {
    const CURVE_ORDER_HEX =
      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141';
    const CURVE_ORDER = BigInt('0x' + CURVE_ORDER_HEX);
    const HALF_CURVE_ORDER = CURVE_ORDER >> 1n;

    const THRESHOLD_HEX =
      '7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0';
    const THRESHOLD = BigInt('0x' + THRESHOLD_HEX);

    // Convert the input buffer to a BigInt for next conditions
    let s = BigInt('0x' + sBuffer);

    // If s is below or equal to the THRESHOLD, return it as is lowercased
    if (s <= THRESHOLD) {
      this.logger.debug(
        's above or equal to threshold, returned as is lowercased: ',
        sBuffer,
      );
      return sBuffer.toLocaleLowerCase();
    }

    if (s > HALF_CURVE_ORDER) {
      s = CURVE_ORDER - s;
    }

    let sHex = s.toString(16);
    // Ensure 64 characters lowercased
    sHex = sHex.padStart(64, '0').toLocaleLowerCase();
    this.logger.warn('Normalized s: ', sHex);
    return sHex;
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
