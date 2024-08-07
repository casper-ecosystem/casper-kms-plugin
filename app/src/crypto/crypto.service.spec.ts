import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(() => {
    service = new CryptoService();
  });

  it('should normalize S value correctly', () => {
    const sBufferHi =
      'fcf9e5b2a8fa951e506e69b54f4bd868f1c93b85ee0011eec9ec5c708498585e';
    const expectedSBufferLo =
      '03061a4d57056ae1af91964ab0b42795c8e5a160c1488e4cf5e6021c4b9de8e3';

    const normalizedS = service['normalizeS'](sBufferHi); // Accessing private method for test purpose

    expect(normalizedS).toBe(expectedSBufferLo);
  });

  it('should normalize S value correctly for value 0x0', () => {
    const sBufferHi = '00'.repeat(32);

    const normalizedS = service['normalizeS'](sBufferHi); // Accessing private method for test purpose

    expect(normalizedS).toBe(sBufferHi);
  });

  it('should NOT normalize S value for value 0x1', () => {
    const sBufferHi = '01'.padStart(64, '0');

    const normalizedS = service['normalizeS'](sBufferHi); // Accessing private method for test purpose

    expect(normalizedS).toBe(sBufferHi);
  });

  it('should NOT normalize S value correctly for value 0x2', () => {
    const sBufferHi = '02'.padStart(64, '0');
    const expectedSBufferLo = '02'.padStart(64, '0');

    const normalizedS = service['normalizeS'](sBufferHi); // Accessing private method for test purpose

    expect(normalizedS).toBe(expectedSBufferLo);
  });

  it('should NOT normalize S value correctly for value 7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B209F', () => {
    const sBufferHi =
      '7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B209F';

    const normalizedS = service['normalizeS'](sBufferHi); // Accessing private method for test purpose

    expect(normalizedS).toBe(sBufferHi.toLocaleLowerCase());
  });

  it('should NOT normalize S value correctly for value 7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0', () => {
    const sBufferHi =
      '7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0';

    const normalizedS = service['normalizeS'](sBufferHi); // Accessing private method for test purpose

    expect(normalizedS).toBe(sBufferHi.toLocaleLowerCase());
  });

  it('should normalize S value correctly for value 7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A1', () => {
    const sBufferHi =
      '7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A1';
    const expectedSBufferLo =
      '7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0';

    const normalizedS = service['normalizeS'](sBufferHi); // Accessing private method for test purpose

    expect(normalizedS).toBe(expectedSBufferLo.toLocaleLowerCase());
  });

  it('should normalize S value correctly for value FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', () => {
    const sBufferHi =
      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
    const expectedSBufferLo =
      '000000000000000000000000000000-14551231950b75fc4402da1732fc9bebe';

    const normalizedS = service['normalizeS'](sBufferHi); // Accessing private method for test purpose

    expect(normalizedS).toBe(expectedSBufferLo.toLocaleLowerCase());
  });

  it('should convert "Low" s ASN.1 signature to P1363 correctly', () => {
    const signatureAsn1Base64 =
      'MEQCICTfgzylgrlhiNEK/bXgz48fv828is9OdQxN2pkDPolsAiBP92yyQCQwSSCUTx09JAw00M3wWXMfnGLO+y4Gds2cXA=';

    // "Low" r
    const rBuffer =
      '24df833ca582b96188d10afdb5e0cf8f1fbfcdbc8acf4e750c4dda99033e896c';
    // "Low" s
    const sBuffer =
      '4ff76cb24024304920944f1d3d240c34d0cdf059731f9c62cefb2e0676cd9c5c';
    const expectedP1363Signature = `02${rBuffer}${sBuffer}`;

    const result = service.convertSignatureAsn1ToP1363(signatureAsn1Base64);

    expect(result).toBe(expectedP1363Signature);
  });

  it('should convert "High" s ASN.1 signature to P1363 correctly', () => {
    const signatureAsn1Base64 =
      'MEUCIASKOyv1PF6jyESy1sl5/OYzwVBegblC/bTX0+1kUdJ9AiEA/Pnlsqj6lR5Qbmm1T0vYaPHJO4XuABHuyexccISYWF4=';

    // "Low" r
    const rBuffer =
      '048a3b2bf53c5ea3c844b2d6c979fce633c1505e81b942fdb4d7d3ed6451d27d';

    // "High" s are normalized, see https://github.com/RustCrypto/elliptic-curves/issues/991
    const normalizedSBuffer =
      '03061a4d57056ae1af91964ab0b42795c8e5a160c1488e4cf5e6021c4b9de8e3';

    const expectedP1363Signature = `02${rBuffer}${normalizedSBuffer}`;

    const result = service.convertSignatureAsn1ToP1363(signatureAsn1Base64);

    expect(result).toBe(expectedP1363Signature);
  });

  it('should convert "High" r ASN.1 signature to P1363 correctly', () => {
    const signatureAsn1Base64 =
      'MEUCIQDysG64gheI8JxYfS+RmO6ppPVYZacx0aVGRF++Amnj1gIgdfIzEdpfakpaMvDwMEfrAYqYLiUWXt372Lvrqc8mohk=';

    // "High" r
    const rBuffer =
      'f2b06eb8821788f09c587d2f9198eea9a4f55865a731d1a546445fbe0269e3d6';
    // "Low" s
    const sBuffer =
      '75f23311da5f6a4a5a32f0f03047eb018a982e25165eddfbd8bbeba9cf26a219';
    const expectedP1363Signature = `02${rBuffer}${sBuffer}`;

    const result = service.convertSignatureAsn1ToP1363(signatureAsn1Base64);

    expect(result).toBe(expectedP1363Signature);
  });

  it('should convert "High" r & "High" s ASN.1 signature to P1363 correctly', () => {
    const signatureAsn1Base64 =
      'MEYCIQCAf2B+txlyCj7uxuSr5DefJ7cZsmC1ZaJJfYUpb/sk9wIhAM/f2mVwgHf+6FkGghXmxzFfmaWPWPVu2Wq0QMs4+mgo';

    // "High" r
    const rBuffer =
      '807f607eb719720a3eeec6e4abe4379f27b719b260b565a2497d85296ffb24f7';
    // "High" s
    const normalizedSBuffer =
      '3020259a8f7f880117a6f97dea1938cd5b15375756533162551e1dc1973bd919';
    const expectedP1363Signature = `02${rBuffer}${normalizedSBuffer}`;

    const result = service.convertSignatureAsn1ToP1363(signatureAsn1Base64);

    expect(result).toBe(expectedP1363Signature);
  });
});
