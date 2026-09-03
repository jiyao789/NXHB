import useOcr from '../../../hooks/useOcr.js';
import { chooseImage } from '../../../utils/image.js';

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    ocrType: 'idCard',
    ocrTypes: [
      { label: '身份证', value: 'idCard' },
      { label: '银行卡', value: 'bankCard' },
      { label: '营业执照', value: 'businessLicense' },
      { label: '通用文字', value: 'general' }
    ],
    idCardSide: 'face',
    imagePath: '',
    ocrLoading: false, // useOcr 会自动同步该字段
    result: null,
    resultJson: ''
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });

    // 初始化 OCR Hook
    this.ocr = useOcr(this);
  },

  handleBack() {
    wx.navigateBack();
  },

  selectOcrType(e) {
    const val = e.currentTarget.dataset.val;
    this.setData({ ocrType: val, result: null, resultJson: '', imagePath: '' });
  },

  switchIdCardSide(e) {
    this.setData({ idCardSide: e.currentTarget.dataset.side });
  },

  // 选择图片（仅预览，不识别）
  async chooseImage() {
    const paths = await chooseImage({ count: 1 });
    if (paths && paths.length > 0) {
      this.setData({ imagePath: paths[0], result: null, resultJson: '' });
    }
  },

  // 开始识别
  async startRecognize() {
    const { imagePath, ocrType, idCardSide } = this.data;

    if (!imagePath) {
      return wx.showToast({ title: '请先选择图片', icon: 'none' });
    }

    try {
      // 构建额外参数
      const extraData = ocrType === 'idCard' ? { side: idCardSide } : {};

      // 使用 hook 的底层方法，传入已选的图片路径
      const result = await this.ocr.recognizeFromPath(
        this.ocr.OCR_URL_MAP[ocrType],
        imagePath,
        extraData
      );

      this.setData({
        result,
        resultJson: JSON.stringify(result, null, 2)
      });

    } catch (err) {
      console.error('OCR识别失败:', err);
      this.setData({ resultJson: JSON.stringify(err, null, 2) });
    }
  },

  copyResult() {
    if (!this.data.resultJson) return;
    wx.setClipboardData({
      data: this.data.resultJson,
      success: () => wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
    });
  }
});
