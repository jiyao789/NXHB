/**
 * useOcr - OCR文字识别 Hook
 * 封装阿里云OCR统一识别服务，支持身份证/银行卡/营业执照/通用文字
 *
 * 用法示例：
 *   import useOcr from '../../hooks/useOcr';
 *   const ocr = useOcr(this);          // 传入页面实例
 *   ocr.recognizeIdCard('face');        // 身份证正面（自动弹出选图）
 *   ocr.recognizeBankCard();            // 银行卡
 *   ocr.recognizeBusinessLicense();     // 营业执照
 *   ocr.recognizeGeneral();             // 通用文字
 *   ocr.recognizeFromPath('/ocr/idCard', filePath, { side: 'face' }); // 指定图片路径
 */

import { httpPost } from '../utils/http.js';
import { chooseImage, imageToBase64 } from '../utils/image.js';

/** OCR 接口路径映射 */
const OCR_URL_MAP = {
  idCard: '/ocr/idCard',
  bankCard: '/ocr/bankCard',
  businessLicense: '/ocr/businessLicense',
  general: '/ocr/general'
};

/**
 * 创建OCR Hook实例
 * @param {Object} pageInstance 页面实例 (this)，用于 setData 同步状态（可选）
 * @returns {Object} OCR操作方法集
 */
export default function useOcr(pageInstance) {

  // 内部状态
  let _loading = false;

  /**
   * 更新页面 loading 状态
   */
  function _setLoading(val) {
    _loading = val;
    if (pageInstance && typeof pageInstance.setData === 'function') {
      pageInstance.setData({ ocrLoading: val });
    }
  }

  /**
   * 核心识别方法：传入图片路径 + 接口路径 + 额外参数
   * @param {string} url        接口路径，如 /ocr/idCard
   * @param {string} filePath   本地图片路径
   * @param {Object} extraData  额外参数，如 { side: 'face' }
   * @returns {Promise<Object>} 识别结果 data
   */
  async function recognizeFromPath(url, filePath, extraData = {}) {
    if (_loading) {
      wx.showToast({ title: '正在识别中，请稍候', icon: 'none' });
      return Promise.reject(new Error('OCR正在进行中'));
    }

    _setLoading(true);
    wx.showLoading({ title: '识别中...', mask: true });

    try {
      const base64 = await imageToBase64(filePath);
      const postData = { imageBase64: base64, ...extraData };
      const res = await httpPost(url, postData);
      wx.hideLoading();
      wx.showToast({ title: '识别成功', icon: 'success' });
      return res.data;
    } catch (err) {
      wx.hideLoading();
      console.error('[useOcr] 识别失败:', err);
      const msg = (err && (err.msg || err.message)) || '识别失败，请重试';
      wx.showToast({ title: msg, icon: 'none' });
      throw err;
    } finally {
      _setLoading(false);
    }
  }

  /**
   * 核心识别方法：传入图片URL + 接口路径 + 额外参数
   * @param {string} url        接口路径
   * @param {string} imageUrl   图片URL（OSS地址等）
   * @param {Object} extraData  额外参数
   * @returns {Promise<Object>} 识别结果 data
   */
  async function recognizeFromUrl(url, imageUrl, extraData = {}) {
    if (_loading) {
      wx.showToast({ title: '正在识别中，请稍候', icon: 'none' });
      return Promise.reject(new Error('OCR正在进行中'));
    }

    _setLoading(true);
    wx.showLoading({ title: '识别中...', mask: true });

    try {
      const postData = { imageUrl, ...extraData };
      const res = await httpPost(url, postData);
      wx.hideLoading();
      wx.showToast({ title: '识别成功', icon: 'success' });
      return res.data;
    } catch (err) {
      wx.hideLoading();
      console.error('[useOcr] 识别失败:', err);
      const msg = (err && (err.msg || err.message)) || '识别失败，请重试';
      wx.showToast({ title: msg, icon: 'none' });
      throw err;
    } finally {
      _setLoading(false);
    }
  }

  /**
   * 选择图片并识别（完整流程：弹选图 → 转Base64 → 调接口）
   * @param {string} type       识别类型：idCard / bankCard / businessLicense / general
   * @param {Object} extraData  额外参数，如 { side: 'face' }
   * @returns {Promise<Object|null>} 识别结果 data，用户取消返回 null
   */
  async function recognizeWithPicker(type, extraData = {}) {
    const paths = await chooseImage({ count: 1 });
    if (!paths || paths.length === 0) return null;

    const url = OCR_URL_MAP[type];
    if (!url) throw new Error('不支持的OCR类型: ' + type);

    return recognizeFromPath(url, paths[0], extraData);
  }

  // ==================== 快捷方法 ====================

  /**
   * 身份证识别（弹选图）
   * @param {string} side 'face'=正面(人像面) | 'back'=背面(国徽面)，默认'face'
   * @returns {Promise<Object|null>}
   */
  function recognizeIdCard(side = 'face') {
    return recognizeWithPicker('idCard', { side });
  }

  /**
   * 银行卡识别（弹选图）
   * @returns {Promise<Object|null>}
   */
  function recognizeBankCard() {
    return recognizeWithPicker('bankCard');
  }

  /**
   * 营业执照识别（弹选图）
   * @returns {Promise<Object|null>}
   */
  function recognizeBusinessLicense() {
    return recognizeWithPicker('businessLicense');
  }

  /**
   * 通用文字识别（弹选图）
   * @returns {Promise<Object|null>}
   */
  function recognizeGeneral() {
    return recognizeWithPicker('general');
  }

  // ==================== 返回 ====================

  return {
    /** 快捷方法 - 自动弹出选图 */
    recognizeIdCard,
    recognizeBankCard,
    recognizeBusinessLicense,
    recognizeGeneral,

    /** 通用方法 - 自动弹出选图，需指定type */
    recognizeWithPicker,

    /** 底层方法 - 传入本地文件路径 */
    recognizeFromPath,

    /** 底层方法 - 传入图片URL */
    recognizeFromUrl,

    /** 接口路径映射 */
    OCR_URL_MAP,

    /** 当前是否加载中 */
    get loading() { return _loading; }
  };
}
