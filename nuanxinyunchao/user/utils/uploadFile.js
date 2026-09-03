"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileUrl = void 0;
exports.uploadFile = uploadFile;
exports.chooseAndUpload = chooseAndUpload;
exports.getBizFileUploadUrl = getBizFileUploadUrl;
exports.uploadToOss = uploadToOss;
exports.uploadLocal = uploadLocal;
const env_1 = require("./env");
const token_1 = require("./token");
exports.uploadFileUrl = {
    USER_AVATAR: (0, env_1.getBaseUrl)() + '/user/avatar'
};
function getBizFileUploadUrl() {
    return (0, env_1.getBizUrl)() + '/dev/file/upload';
}
/**
 * 上传文件到本地服务器 /dev/file/upload （统一上传接口，无需token）
 * @param {string} filePath 本地临时文件路径
 * @returns {Promise<string>} 拼接 bizUrl 后的完整文件访问 URL
 */
function uploadLocal(filePath) {
    return new Promise((resolve, reject) => {
        const bizUrl = (0, env_1.getBizUrl)();
        const url = bizUrl + '/dev/file/upload';
        wx.uploadFile({
            url,
            filePath,
            name: 'file',
            header: {},
            success: (res) => {
                try {
                    const data = JSON.parse(res.data);
                    if (data.code === 0 || data.code === 200) {
                        // 返回格式: { data: { downloadPath: "xxx" } }
                        // 去掉 downloadPath 的域名前缀再拼 bizUrl
                        const downloadPath = data.data && data.data.downloadPath ? data.data.downloadPath : '';
                        const result = downloadPath.replace(/^https?:\/\/[^\/]+/, '');
                        const fullUrl = bizUrl + result;
                        resolve(fullUrl);
                    }
                    else {
                        wx.showToast({ title: data.message || data.msg || '上传失败', icon: 'none' });
                        reject(data);
                    }
                }
                catch (e) {
                    reject(e);
                }
            },
            fail: (err) => {
                wx.showToast({ title: '网络错误', icon: 'none' });
                reject(err);
            }
        });
    });
}
/**
 * 上传文件到阿里云 OSS
 * @param {string} filePath 本地临时文件路径
 * @param {string} module 业务模块名（cert/avatar/shop/common 等）
 * @returns {Promise<string>} OSS 文件 URL
 */
function uploadToOss(filePath, module) {
    module = module || 'common';
    const url = (0, env_1.getBizUrl)() + '/auth/c/oss/upload?module=' + module;
    return new Promise((resolve, reject) => {
        const token = token_1.tokenManager.getToken();
        const header = {};
        if (token) {
            header['token'] = token;
            header['clientToken'] = token;
        }
        wx.uploadFile({
            url,
            filePath,
            name: 'file',
            header,
            success: (res) => {
                try {
                    const data = JSON.parse(res.data);
                    if (data.code === 0 || data.code === 200) {
                        resolve(data.data.url);
                    } else {
                        wx.showToast({ title: data.message || data.msg || '上传失败', icon: 'none' });
                        reject(data);
                    }
                } catch (e) {
                    reject(e);
                }
            },
            fail: (err) => {
                wx.showToast({ title: '网络错误', icon: 'none' });
                reject(err);
            }
        });
    });
}
function uploadFile(options) {
    return new Promise((resolve, reject) => {
        // Check file size maybe (skipped for simplicity in Native base unless requested)
        const token = token_1.tokenManager.getToken();
        const header = {};
        if (token) {
            header['token'] = token;
            header['clientToken'] = token;
        }
        wx.uploadFile({
            url: options.url,
            filePath: options.filePath,
            name: options.name || 'file',
            formData: options.formData,
            header,
            success: (res) => {
                try {
                    const data = JSON.parse(res.data);
                    if (data.code === 0 || data.code === 200) {
                        resolve(data.data);
                    }
                    else {
                        wx.showToast({ title: data.message || data.msg || '上传失败', icon: 'none' });
                        reject(data);
                    }
                }
                catch (e) {
                    reject(e);
                }
            },
            fail: (err) => {
                wx.showToast({ title: '网络错误', icon: 'none' });
                reject(err);
            }
        });
    });
}
function chooseAndUpload(url, formData) {
    return new Promise((resolve, reject) => {
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            success: (res) => {
                const tempFilePath = res.tempFiles[0].tempFilePath;
                wx.showLoading({ title: '上传中' });
                uploadFile({
                    url,
                    filePath: tempFilePath,
                    formData
                }).then(data => {
                    wx.hideLoading();
                    resolve(data);
                }).catch(err => {
                    wx.hideLoading();
                    reject(err);
                });
            },
            fail: (err) => reject(err)
        });
    });
}
