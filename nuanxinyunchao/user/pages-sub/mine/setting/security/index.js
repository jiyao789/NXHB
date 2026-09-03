"use strict";
Page({
    data: {
        safeAreaInsetsTop: 20,
        list: [
            { title: '登录密码', path: '/nuanxinyunchao/user/pages-sub/mine/setting/security/modify-password' },
            { title: '登录过的设备', path: '/nuanxinyunchao/user/pages-sub/mine/setting/security/devices' },
            { title: '应急联系人', path: '/nuanxinyunchao/user/pages-sub/mine/setting/security/contacts' },
            { title: '安全中心', path: '/nuanxinyunchao/user/pages-sub/mine/setting/security/safety-center' }
        ]
    },
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaInsetsTop: sysInfo.statusBarHeight || 20 });
    },
    handleBack() {
        wx.navigateBack();
    },
    handleNav(e) {
        const path = e.currentTarget.dataset.path;
        if (path) {
            wx.navigateTo({ url: path });
        }
    }
});
