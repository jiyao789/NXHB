"use strict";
Page({
    data: {
        safeAreaTop: 20,
        selectedRole: null,
        roles: [
            { name: '我是外卖员', img: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/auth/role_delivery.png', rolesId: 1 },
            { name: '我是快递员', img: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/auth/role_express.png', rolesId: 2 },
            { name: '我是网约车司机', img: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/auth/role_driver.png', rolesId: 3 },
            { name: '我是货车司机', img: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/auth/role_truck.png', rolesId: 4 },
            { name: '我是主播', img: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/auth/role_streamer.png', rolesId: 5 }
        ]
    },
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({
            safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : (sysInfo.statusBarHeight || 20)
        });
    },
    handleBack() {
        wx.navigateBack();
    },
    handleSelect(e) {
        const index = e.currentTarget.dataset.index;
        this.setData({ selectedRole: index });
        const rolesId = this.data.roles[index].rolesId;
        setTimeout(() => {
            wx.navigateTo({
                url: `/nuanxinyunchao/user/pages-sub/auth/verify/index?role=${encodeURIComponent(rolesId.toString())}`
            });
        }, 150);
    }
});
