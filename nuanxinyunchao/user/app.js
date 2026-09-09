"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// app.ts
App({
    globalData: {},
    onLaunch(options) {
        console.log('App Launch', options);
        // 展示本地存储能力
        const logs = wx.getStorageSync('logs') || [];
        logs.unshift(Date.now());
        wx.setStorageSync('logs', logs);
        // 登录
        wx.login({
            success: res => {
                console.log(res.code);
                // 发送 res.code 到后台换取 openId, sessionKey, unionId
            },
        });
    },
    onShow(options) {
        console.log('App Show', options);
    },
    onHide() {
        console.log('App Hide');
    }
});
