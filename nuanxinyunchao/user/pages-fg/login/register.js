"use strict";
Page({
    doRegister() {
        wx.showToast({ title: '注册成功' });
        setTimeout(() => {
            wx.navigateTo({ url: '/nuanxinyunchao/user/pages-fg/login/login' });
        }, 1500);
    }
});
