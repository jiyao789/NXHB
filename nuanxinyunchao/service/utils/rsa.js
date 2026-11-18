/**
 * 微信小程序 RSA 加密工具（PKCS#1 v1.5 标准填充，2048位公钥）
 * 零第三方依赖，纯原生 JS + BigInt 实现
 */
const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToUint8Array(b64) {
  b64 = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes = [];
  for (let i = 0; i < b64.length; i += 4) {
    const enc1 = b64chars.indexOf(b64.charAt(i));
    const enc2 = b64chars.indexOf(b64.charAt(i + 1));
    const enc3 = b64chars.indexOf(b64.charAt(i + 2));
    const enc4 = b64chars.indexOf(b64.charAt(i + 3));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    bytes.push(chr1);
    if (enc3 !== 64 && enc3 !== -1) bytes.push(chr2);
    if (enc4 !== 64 && enc4 !== -1) bytes.push(chr3);
  }
  return new Uint8Array(bytes);
}

function uint8ArrayToBase64(bytes) {
  let output = '';
  let i = 0;
  while (i < bytes.length) {
    const chr1 = bytes[i++];
    const chr2 = bytes[i++];
    const chr3 = bytes[i++];

    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    let enc4 = chr3 & 63;

    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }

    output +=
      b64chars.charAt(enc1) +
      b64chars.charAt(enc2) +
      (enc3 === 64 ? '=' : b64chars.charAt(enc3)) +
      (enc4 === 64 ? '=' : b64chars.charAt(enc4));
  }
  return output;
}

function utf8ToUint8Array(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) {
      bytes.push(c);
    } else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6));
      bytes.push(0x80 | (c & 0x3f));
    } else if (c < 0xd800 || c >= 0xe000) {
      bytes.push(0xe0 | (c >> 12));
      bytes.push(0x80 | ((c >> 6) & 0x3f));
      bytes.push(0x80 | (c & 0x3f));
    } else {
      i++;
      c = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(0xf0 | (c >> 18));
      bytes.push(0x80 | ((c >> 12) & 0x3f));
      bytes.push(0x80 | ((c >> 6) & 0x3f));
      bytes.push(0x80 | (c & 0x3f));
    }
  }
  return new Uint8Array(bytes);
}

class MiniRSA {
  constructor(publicKeyPem) {
    this.parsePublicKey(publicKeyPem);
  }

  parsePublicKey(pem) {
    const cleanB64 = pem
      .replace(/-----BEGIN[^-]+-----/g, '')
      .replace(/-----END[^-]+-----/g, '')
      .replace(/\s+/g, '');
    const der = base64ToUint8Array(cleanB64);

    let offset = 0;
    function readTag() {
      return der[offset++];
    }
    function readLength() {
      let b = der[offset++];
      if ((b & 0x80) === 0) return b;
      let count = b & 0x7f;
      let len = 0;
      for (let i = 0; i < count; i++) {
        len = (len << 8) | der[offset++];
      }
      return len;
    }

    readTag(); // SEQUENCE
    readLength();
    readTag(); // algo SEQUENCE
    let algoLen = readLength();
    offset += algoLen;

    readTag(); // BIT STRING
    readLength();
    offset++; // unused bits 0x00

    readTag(); // RSAPublicKey SEQUENCE
    readLength();

    readTag(); // INTEGER n
    let nLen = readLength();
    let nBuf = der.subarray(offset, offset + nLen);
    offset += nLen;

    readTag(); // INTEGER e
    let eLen = readLength();
    let eBuf = der.subarray(offset, offset + eLen);
    offset += eLen;

    this.n = this.bufToBigInt(nBuf);
    this.e = this.bufToBigInt(eBuf);
    this.keySize = nBuf.length > 256 && nBuf[0] === 0 ? nBuf.length - 1 : nBuf.length;
  }

  bufToBigInt(buf) {
    let hex = [];
    for (let i = 0; i < buf.length; i++) {
      let h = buf[i].toString(16);
      hex.push(h.length < 2 ? '0' + h : h);
    }
    return BigInt('0x' + hex.join(''));
  }

  modPow(base, exp, mod) {
    let res = 1n;
    let b = base % mod;
    let e = exp;
    while (e > 0n) {
      if (e & 1n) res = (res * b) % mod;
      e >>= 1n;
      b = (b * b) % mod;
    }
    return res;
  }

  encrypt(text) {
    const msgBytes = utf8ToUint8Array(text);
    const k = this.keySize;
    if (msgBytes.length > k - 11) {
      throw new Error('Message too long');
    }

    const padLen = k - msgBytes.length - 3;
    const eb = new Uint8Array(k);
    eb[0] = 0x00;
    eb[1] = 0x02;

    for (let i = 0; i < padLen; i++) {
      let r = 0;
      while (r === 0) {
        r = Math.floor(Math.random() * 255) + 1;
      }
      eb[2 + i] = r;
    }
    eb[2 + padLen] = 0x00;

    for (let i = 0; i < msgBytes.length; i++) {
      eb[3 + padLen + i] = msgBytes[i];
    }

    let m = this.bufToBigInt(eb);
    let c = this.modPow(m, this.e, this.n);

    let cHex = c.toString(16);
    if (cHex.length % 2 !== 0) cHex = '0' + cHex;
    let targetHexLen = k * 2;
    while (cHex.length < targetHexLen) {
      cHex = '0' + cHex;
    }

    const outBytes = new Uint8Array(k);
    for (let i = 0; i < k; i++) {
      outBytes[i] = parseInt(cHex.substring(i * 2, i * 2 + 2), 16);
    }

    return uint8ArrayToBase64(outBytes);
  }
}

// RSA 2048 位公钥
const RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvuXyFt4vnOBGVN4gmiWh
i1AY9FJrSU9Tie1TxmHg6GAbDwKU3kB2Irdpy8zpP+rYmrNFpCikS2F/+HIzP+XE
+jsqqrvpXcUk2jRlNqkCOLckWxA9p9IGDAwcGkkU/fwkXAPJ3D5bHJO+5FbXv80K
K0VxrWXg292vz9e2Jud76t8AM9zl+yLi078Ce6cq8Sd7/wP5OdGT2LxjJSSh7EP2
QZymWahZRK9AVLDrJwMi1UMkWAcKSuTfJCOr0bJsCEZeSbk1WmTGapOw6e9PEkG9
CVIWS5Eipf2AQQHLtadOcDTiRRredT8UvKCo5y+D0xD4Bi1yWhBB4HugbUhS3lr2
hwIDAQAB
-----END PUBLIC KEY-----`;

let rsaInstance = null;

function getRsaInstance() {
  if (!rsaInstance) {
    rsaInstance = new MiniRSA(RSA_PUBLIC_KEY);
  }
  return rsaInstance;
}

/**
 * 加密密码字符串
 * @param {string} password 明文密码
 * @returns {string} RSA 加密后的 Base64 密文
 */
export function encryptPassword(password) {
  if (!password) return password;
  try {
    return getRsaInstance().encrypt(password);
  } catch (err) {
    console.error('RSA 加密密码失败，使用原值兜底:', err);
    return password;
  }
}

export default {
  encryptPassword
};

