"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../../utils/token");
Page({
    data: {
        redirectUrl: ''
    },
    onLoad(options) {
        if (options.redirect) {
            this.setData({ redirectUrl: decodeURIComponent(options.redirect) });
        }
        else {
            this.setData({ redirectUrl: '/nuanxinyunchao/user/pages/index/index' });
        }
    },
    doLogin() {
        const hasLogin = !!token_1.tokenManager.getToken();
        if (hasLogin) {
            wx.navigateBack();
            return;
        }
        try {
            // Mock login success
            token_1.tokenManager.setToken('mock_token_success_nuanxin');
            wx.setStorageSync('userInfo', { username: '菲鸽', nickname: '模拟用户' });
            wx.showToast({ title: '登录成功' });
            setTimeout(() => {
                let path = this.data.redirectUrl;
                if (!path.startsWith('/')) {
                    path = '/' + path;
                }
                // 简单处理跳转逻辑
                const tabList = ['/nuanxinyunchao/user/pages/index/index', '/nuanxinyunchao/user/pages/map/index', '/nuanxinyunchao/user/pages/qrcode/index', '/nuanxinyunchao/user/pages/hot/index', '/nuanxinyunchao/user/pages/mine/index'];
                if (tabList.includes(path)) {
                    wx.reLaunch({ url: path });
                }
                else {
                    wx.redirectTo({ url: path });
                }
            }, 500);
        }
        catch (error) {
            console.log('登录失败', error);
        }
    }
});
