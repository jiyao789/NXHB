"use strict";
Page({
    data: {
        safeAreaTop: 20
    },
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaTop: sysInfo.safeArea.top });
        // Original Vue code immediately redirected to subpackage
        setTimeout(() => {
            wx.navigateTo({
                url: '/nuanxinyunchao/user/pages-sub/qrcode/index' // Note: Original was misspelled 'qrocde', fixing typo
            });
        }, 100);
    },
    handleBack() {
        wx.navigateBack();
    }
});
