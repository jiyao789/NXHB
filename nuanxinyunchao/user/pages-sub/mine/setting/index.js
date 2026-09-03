"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../../../utils/token");
Page({
    data: {
        safeAreaTop: 20
    },
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaTop: sysInfo.safeArea.top });
    },
    handleBack() {
        wx.navigateBack();
    },
    navTo(e) {
        const url = e.currentTarget.dataset.url;
        wx.navigateTo({ url });
    },
    handleClearCache() {
        try {
            const res = wx.getStorageInfoSync();
            const sizeKB = res.currentSize;
            let sizeText = '';
            if (sizeKB > 1024) {
                sizeText = (sizeKB / 1024).toFixed(2) + ' MB';
            }
            else {
                sizeText = sizeKB.toFixed(2) + ' KB';
            }
            wx.showModal({
                title: '清理缓存',
                content: `当前已占用 ${sizeText} 缓存，是否确认清理？`,
                confirmColor: '#000000',
                success: (modalRes) => {
                    if (modalRes.confirm)
                        this.performClear();
                }
            });
        }
        catch (e) {
            console.error(e);
        }
    },
    performClear() {
        wx.showLoading({ title: '清理中...' });
        try {
            const rawToken = token_1.tokenManager.getToken();
            const userInfo = wx.getStorageSync('userInfo');
            wx.clearStorageSync();
            if (rawToken)
                token_1.tokenManager.setToken(rawToken);
            if (userInfo)
                wx.setStorageSync('userInfo', userInfo);
            setTimeout(() => {
                wx.hideLoading();
                wx.showToast({ title: '清理完成', icon: 'success' });
            }, 500);
        }
        catch (e) {
            wx.hideLoading();
            wx.showToast({ title: '清理失败', icon: 'none' });
        }
    },
    handleLogout() {
        wx.showModal({
            title: '提示',
            content: '确定要退出登录吗？',
            confirmColor: '#000000',
            success: async (res) => {
                if (res.confirm) {
                    token_1.tokenManager.clear();
                    wx.removeStorageSync('userInfo');
                    wx.reLaunch({ url: '/nuanxinyunchao/user/pages/index/index' });
                }
            }
        });
    },
    handleUnbind() {
        wx.showModal({
            title: '警告',
            content: '解除绑定后将无法使用相关功能，确定继续吗？',
            confirmColor: '#ff0000',
            success: (res) => {
                if (res.confirm) {
                    token_1.tokenManager.clear();
                    wx.removeStorageSync('userInfo');
                    wx.reLaunch({ url: '/nuanxinyunchao/user/pages/index/index' });
                }
            }
        });
    }
});
