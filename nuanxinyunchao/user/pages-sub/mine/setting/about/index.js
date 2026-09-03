"use strict";
Page({
    data: {
        safeAreaInsetsTop: 20,
        version: '1.0.0' // 默认值
    },
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaInsetsTop: sysInfo.statusBarHeight || 20 });
        // 🚀 核心：获取微信小程序线上版本号
        try {
            const accountInfo = wx.getAccountInfoSync();
            // miniProgram.version 仅在正式版有值，开发版/体验版建议显示自定义版本
            const onlineVersion = accountInfo.miniProgram.version;
            if (onlineVersion) {
                this.setData({ version: onlineVersion });
            }
            else {
                // 如果是开发工具环境，显示一个硬编码的版本号，模仿 unibest 行为
                this.setData({ version: '1.0.0' });
            }
        }
        catch (e) {
            console.log('获取版本号失败', e);
        }
    },
    handleBack() {
        wx.navigateBack();
    },
    handleNav(e) {
        const type = e.currentTarget.dataset.type;
        wx.navigateTo({
            url: `/nuanxinyunchao/user/pages-sub/mine/setting/about/webview?type=${type}`
        });
    }
});
