/**
 * 图片工具函数
 * 提供图片选择、Base64转换等能力
 */

/**
 * 选择图片（拍照/相册）
 * @param {Object} options 配置项
 * @param {number} options.count 最多选几张，默认1
 * @param {Array<string>} options.sourceType 来源，默认 ['album', 'camera']
 * @param {Array<string>} options.sizeType 尺寸，默认 ['compressed']
 * @returns {Promise<string[]>} 图片临时路径数组
 */
export function chooseImage(options = {}) {
  const { count = 1, sourceType = ['album', 'camera'], sizeType = ['compressed'] } = options;
  return new Promise((resolve, reject) => {
    wx.chooseMedia({
      count,
      mediaType: ['image'],
      sizeType,
      sourceType,
      success: (res) => {
        const paths = res.tempFiles.map(f => f.tempFilePath);
        resolve(paths);
      },
      fail: (err) => {
        // 用户取消不报错
        if (err.errMsg && err.errMsg.indexOf('cancel') !== -1) {
          resolve([]);
        } else {
          reject(err);
        }
      }
    });
  });
}

/**
 * 将本地图片文件转为Base64字符串
 * @param {string} filePath 本地文件路径
 * @returns {Promise<string>} Base64编码字符串（不含 data:image/ 前缀）
 */
export function imageToBase64(filePath) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: (res) => resolve(res.data),
      fail: (err) => reject(err)
    });
  });
}
