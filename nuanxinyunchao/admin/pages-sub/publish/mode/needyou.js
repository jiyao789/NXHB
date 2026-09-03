"use strict";
Page({
    data: {
        safeAreaTop: 0,
        detailData: {
            title: '',
            orgName: '',
            image: '',
            type: 1, // 控制 "招募中" 和 "已满员"
            points: 200,
            dateRange: '2025-03-10 ~ 2025-03-15',
            timeDesc: '即日起',
            contactPhone: '021-52540749',
            location: ''
        },
        memberList: []
    },
    onLoad(options) {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({
            safeAreaTop: sysInfo.statusBarHeight || 20
        });
        if (options && options.data) {
            try {
                const passedData = JSON.parse(decodeURIComponent(options.data));
                this.setData({
                    detailData: { ...this.data.detailData, ...passedData }
                });
            }
            catch (e) {
                console.error('参数解析失败', e);
            }
        }
        this.mockApiFetch();
    },
    handleBack() {
        wx.navigateBack();
    },
    // 拨打电话功能
    handleCall() {
        if (this.data.detailData.contactPhone) {
            wx.makePhoneCall({
                phoneNumber: this.data.detailData.contactPhone
            });
        }
    },
    // 接单按钮
    handleAccept() {
        wx.showToast({ title: '接单成功', icon: 'success' });
    },
    mockApiFetch() {
        this.setData({
            memberList: [
                { id: 1, name: '王小明', avatar: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/avatar.png' },
                { id: 2, name: '陈小明', avatar: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/avatar.png' },
                { id: 3, name: '王小明', avatar: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/avatar.png' },
                { id: 4, name: '王小明', avatar: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/avatar.png' },
                { id: 5, name: '王小明', avatar: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/avatar.png' },
            ]
        });
    }
});
