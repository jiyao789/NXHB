"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.http = void 0;
exports.httpGet = httpGet;
exports.httpPost = httpPost;
exports.httpPut = httpPut;
exports.httpDelete = httpDelete;
const env_1 = require("./env");
const token_1 = require("./token");
const baseUrl = (0, env_1.getBaseUrl)();
const bizUrl = (0, env_1.getBizUrl)();
// Token刷新状态
let refreshing = false;
let taskQueue = [];
// 拼接 Query
function stringifyQuery(query) {
    if (!query)
        return '';
    return Object.keys(query)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(query[key]))
        .join('&');
}
// 统一的网络请求封装
const http = (options) => {
    return new Promise((resolve, reject) => {
        // --- 路由判定逻辑 ---
        let finalUrl = options.url;
        let finalBaseUrl = bizUrl; // 默认走业务端口 9102
        // 只有绝对必须由网关处理的认证逻辑才走 9003
        const isGatewayPath = finalUrl.indexOf('/auth/c/') !== -1 ||
            finalUrl.indexOf('/auth/tongyi/') !== -1 ||
            finalUrl.indexOf('/sys/org/orgTreeSelector') !== -1 ||
            finalUrl.indexOf('/client/c/user/qrcode') !== -1;
        if (isGatewayPath) {
            finalBaseUrl = baseUrl;
        }
        // 路径自愈：仅当直达业务端口9102或测试环境27912时，剥离 /api/webapp 直达业务端口。
        // trial/release 常共用一个 HTTPS 域名，必须保留 /api/webapp 前缀，否则路由不到后端。
        if ((finalBaseUrl === bizUrl || finalBaseUrl.indexOf('9102') !== -1 || finalBaseUrl.indexOf('27912') !== -1) && finalUrl.indexOf('/api/webapp') !== -1) {
            finalUrl = finalUrl.replace('/api/webapp', '');
        }
        // 拼接最终 URL
        if (!finalUrl.startsWith('http')) {
            finalUrl = finalBaseUrl + finalUrl;
        }

        console.log(`>>> [路由分发] 原始URL: ${options.url} -> 目标基准地址: ${finalBaseUrl} -> 最终URL: ${finalUrl}`);

        // 拦截器: invoke
        if (options.query) {
            const queryStr = stringifyQuery(options.query);
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryStr;
        }
        const token = token_1.tokenManager.getToken();
        options.header = {
            ...options.header,
            'content-type': 'application/json'
        };
        if (token) {
            options.header['token'] = token;
            options.header['clientToken'] = token;
            options.header['satoken'] = token;
        }
        // 发起 Native 请求
        wx.request({
            url: finalUrl,
            method: options.method || 'GET',
            data: options.data,
            header: options.header,
            timeout: 120000, // 增加到 2 分钟，防止连云端数据库太慢导致前端超时
            success: async (res) => {
                const responseData = res.data;
                let code;
                const rawCode = responseData && Object.prototype.hasOwnProperty.call(responseData, 'code')
                    ? responseData.code
                    : undefined;
                if (rawCode === undefined || rawCode === null) {
                    code = res.statusCode;
                }
                else {
                    const n = Number(rawCode);
                    code = Number.isNaN(n) ? res.statusCode : n;
                }
                // 处理 401: Token 失效
                const isTokenExpired = res.statusCode === 401 || code === 401;
                if (isTokenExpired) {
                    wx.hideLoading();
                    // 如果是注册接口，不进行自动跳转，让业务代码自行处理展示错误
                    if (options.url.includes('/auth/c/register')) {
                        const msg = (responseData && (responseData.message || responseData.msg)) || '鉴权失败';
                        wx.showToast({ icon: 'none', title: msg });
                        return reject(res.data || res);
                    }
                    token_1.tokenManager.clear();
                    setTimeout(() => {
                        wx.navigateTo({ url: '/nuanxinyunchao/user/pages-sub/auth/login/index' });
                    }, 1500);
                    return reject(res.data || res);
                }
                // 处理成功状态码
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    if (code !== 0 && code !== 200) {
                        wx.hideLoading();
                        if (!options.hideErrorToast) {
                            wx.showToast({ icon: 'none', title: (responseData && (responseData.message || responseData.msg)) || '操作失败' });
                        }
                        return reject(responseData);
                    }
                    return resolve(responseData && responseData.data);
                }
                // 其他状态错误
                wx.hideLoading();
                if (!options.hideErrorToast) {
                    wx.showToast({ icon: 'none', title: (responseData && (responseData.msg || responseData.message)) || '网络异常' });
                }
                reject(res.data || res);
            },
            fail: (err) => {
                wx.showToast({ icon: 'none', title: '网络错误，换个网络试试' });
                reject(err);
            }
        });
    });
};
exports.http = http;
function httpGet(url, data, options) {
    return (0, exports.http)({ url, method: 'GET', data, ...options });
}
function httpPost(url, data, options) {
    return (0, exports.http)({ url, method: 'POST', data, ...options });
}
function httpPut(url, data, options) {
    return (0, exports.http)({ url, method: 'PUT', data, ...options });
}
function httpDelete(url, data, options) {
    return (0, exports.http)({ url, method: 'DELETE', data, ...options });
}
exports.http.get = httpGet;
exports.http.post = httpPost;
exports.http.put = httpPut;
exports.http.delete = httpDelete;
