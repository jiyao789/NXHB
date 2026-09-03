"use strict";
Page({
    data: {
        safeAreaTop: 20,
        safetyChecks: [
            { label: '实名认证', desc: '防止账号被他人冒用', icon: 'i-carbon-id-management', status: 'normal', statusText: '已认证' },
            { label: '异地登录', desc: '近30天无异常登录行为', icon: 'i-carbon-location-hazard', status: 'normal', statusText: '无异常' }
        ]
    },
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaTop: sysInfo.safeArea.top });
    },
    handleBack() {
        wx.navigateBack();
    },
    handleDeleteAccount() {
        wx.showModal({
            title: '确定注销账号吗？',
            content: '注销是不可逆的操作，账号内的所有权益、积分及荣耀时刻数据都将被清空。',
            confirmText: '坚决注销',
            confirmColor: '#ff4d4f',
            cancelText: '我再想想',
            success: (res) => {
                if (res.confirm) {
                    wx.showToast({ title: '申请已提交，等待审核', icon: 'none' });
                }
            }
        });
    }
});
