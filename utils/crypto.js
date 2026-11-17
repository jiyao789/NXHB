const sm2 = require('./sm2.js');

// 与后端 CommonCryptogramUtil 保持一致的国密 SM2 公钥
const SM2_PUBLIC_KEY = '04298364ec840088475eae92a591e01284d1abefcda348b47eb324bb521bb03b0b2a5bc393f6b71dabb8f15c99a0050818b56b23f31743b93df9cf8948f15ddb54';

/**
 * 口令应用层国密 SM2 加密
 * @param {string} password 明文密码
 * @returns {string} SM2 加密密文
 */
function encryptPassword(password) {
  if (!password || typeof password !== 'string') {
    return password;
  }
  try {
    // cipherMode: 1 代表 C1C3C2 模式，与后端 antherd sm-crypto 解密标准完全一致
    const cipher = sm2.doEncrypt(password, SM2_PUBLIC_KEY, 1);
    return cipher || password;
  } catch (e) {
    console.error('SM2 加密异常，安全降级使用原值:', e);
    return password;
  }
}

module.exports = {
  encryptPassword,
  SM2_PUBLIC_KEY,
};
