"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenManager = void 0;
// 用 Storage 替代原先的 Pinia Store
const TOKEN_KEY = 'user_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
exports.tokenManager = {
    getToken() {
        return wx.getStorageSync(TOKEN_KEY) || '';
    },
    setToken(token) {
        wx.setStorageSync(TOKEN_KEY, token);
    },
    getRefreshToken() {
        return wx.getStorageSync(REFRESH_TOKEN_KEY) || '';
    },
    setRefreshToken(token) {
        wx.setStorageSync(REFRESH_TOKEN_KEY, token);
    },
    clear() {
        wx.removeStorageSync(TOKEN_KEY);
        wx.removeStorageSync(REFRESH_TOKEN_KEY);
    }
};
