"use strict";
Component({
    properties: {},
    data: {
        show: false,
        redirectUrl: ''
    },
    methods: {
        open(redirectUrl) {
            // 隐藏自定义 tabbar 防止层级遮挡
            const pages = getCurrentPages();
            const currentPage = pages[pages.length - 1];
            if (currentPage && typeof currentPage.getTabBar === 'function' && currentPage.getTabBar()) {
                currentPage.getTabBar().setData({ show: false });
            }
            this.setData({
                show: true,
                redirectUrl: redirectUrl || ''
            });
        },
        preventTouchMove() {
            // 防止背部滑动
        },
        close() {
            const pages = getCurrentPages();
            const currentPage = pages[pages.length - 1];
            if (currentPage && typeof currentPage.getTabBar === 'function' && currentPage.getTabBar()) {
                currentPage.getTabBar().setData({ show: true });
            }
            this.setData({ show: false, redirectUrl: '' });
        },
        handleCancel() {
            this.close();
        },
        handleConfirm() {
            const url = this.data.redirectUrl;
            this.close();
            // 无论有没有 redirectUrl，点击确认都应该去登录页
            // 将想要去的页面作为参数传给登录页，登录成功后再跳转
            const loginUrl = `/nuanxinyunchao/user/pages-sub/auth/login/index${url ? '?redirect=' + encodeURIComponent(url) : ''}`;
            wx.navigateTo({ url: loginUrl });
        }
    }
});
