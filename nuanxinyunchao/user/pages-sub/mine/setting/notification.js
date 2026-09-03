"use strict";
Page({
    data: {
        safeAreaTop: 20,
        settings: {
            notification: false,
            detail: true
        }
    },
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaTop: sysInfo.safeArea.top });
    },
    handleBack() {
        wx.navigateBack();
    },
    handleDetailChange(e) {
        this.setData({ 'settings.detail': e.detail.value });
    },
    handleNotificationChange(e) {
        const isOpen = e.detail.value;
        if (isOpen) {
            this.requestSubscription();
        }
        else {
            this.setData({ 'settings.notification': false });
            wx.showToast({ title: '已关闭推送', icon: 'none' });
        }
    },
    requestSubscription() {
        const tmplIds = ['YOUR_TEMPLATE_ID_HERE']; // Replace with real template ID
        wx.requestSubscribeMessage({
            tmplIds: tmplIds,
            success: (res) => {
                const hasAccept = tmplIds.some(id => res[id] === 'accept');
                if (hasAccept) {
                    this.setData({ 'settings.notification': true });
                    wx.showToast({ title: '订阅成功', icon: 'success' });
                }
                else {
                    this.setData({ 'settings.notification': false });
                    wx.showToast({ title: '您取消了授权', icon: 'none' });
                }
            },
            fail: (err) => {
                console.error('订阅失败', err);
                this.setData({ 'settings.notification': false });
                if (err.errCode === 20004) {
                    wx.showModal({
                        title: '提示',
                        content: '您似乎关闭了消息订阅主开关，请在设置中打开',
                        confirmText: '去设置',
                        success: (res) => {
                            if (res.confirm)
                                wx.openSetting({});
                        }
                    });
                }
                else {
                    wx.showToast({ title: '授权失败，请重试', icon: 'none' });
                }
            }
        });
    }
});
