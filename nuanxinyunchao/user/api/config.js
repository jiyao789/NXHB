"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProtocolConfigApi = void 0;
const http_1 = require("../utils/http");

/**
 * 获取协议相关的 URL 配置
 */
const getProtocolConfigApi = () => {
    // 调用后端配置接口。如果后端返回的具体 URL 字段不一致，后续只需在此处映射即可。
    // 这里做了一个兜底处理，确保在后端尚未配置好具体协议 URL 时，前端能够看到效果。
    return (0, http_1.httpGet)("/api/webapp/dev/config/sysBaseList").then(res => {
        // 假设这里能够从 res 中解析出配置的 URL，这里先返回演示用的合法外链
        return {
            service: 'https://developers.weixin.qq.com/miniprogram/dev/framework/',
            privacy: 'https://developers.weixin.qq.com/miniprogram/dev/framework/ability/privacy.html'
        };
    }).catch(err => {
        console.warn('获取配置失败，使用演示 URL', err);
        return {
            service: 'https://developers.weixin.qq.com/miniprogram/dev/framework/',
            privacy: 'https://developers.weixin.qq.com/miniprogram/dev/framework/ability/privacy.html'
        };
    });
};
exports.getProtocolConfigApi = getProtocolConfigApi;
