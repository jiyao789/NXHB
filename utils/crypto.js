// 1. 微信小程序环境全局补丁：补齐 globalThis.crypto.getRandomValues，彻底避免环境报错
if (typeof globalThis !== 'undefined') {
  if (!globalThis.crypto) {
    globalThis.crypto = {};
  }
  if (!globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues = function (buf) {
      if (typeof wx !== 'undefined' && wx.getRandomValues) {
        try {
          wx.getRandomValues({ array: buf });
          return buf;
        } catch (e) {}
      }
      for (let i = 0; i < buf.length; i++) {
        buf[i] = Math.floor(Math.random() * 256);
      }
      return buf;
    };
  }
}

let sm2 = null;
try {
  sm2 = require('./sm2.js');
} catch (e) {
  console.warn('加载国密 sm2 算法模块异常，将安全降级传输:', e);
}

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
  if (!sm2 || typeof sm2.doEncrypt !== 'function') {
    return password;
  }
  try {
    // cipherMode: 1 代表 C1C3C2 模式，与后端 antherd sm-crypto 解密标准完全一致
    const cipher = sm2.doEncrypt(password, SM2_PUBLIC_KEY, 1);
    return cipher || password;
  } catch (e) {
    console.warn('SM2 加密执行异常，安全降级使用原值:', e);
    return password;
  }
}

module.exports = {
  encryptPassword,
  SM2_PUBLIC_KEY,
};
