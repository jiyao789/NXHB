"use strict";
Page({
    data: {
        safeAreaTop: 20,
        deviceList: [
            { id: 1, name: 'iPhone 15 Pro', type: 'mobile', lastTime: '刚刚', location: '上海市·长宁区', isCurrent: true },
            { id: 2, name: 'MacBook Pro 14', type: 'desktop', lastTime: '昨天 18:24', location: '上海市·静安区', isCurrent: false },
            { id: 3, name: 'iPad Air', type: 'tablet', lastTime: '05月12日', location: '杭州市·西湖区', isCurrent: false }
        ]
    },
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaTop: sysInfo.safeArea.top });
    },
    handleBack() {
        wx.navigateBack();
    },
    handleRemove(e) {
        const index = e.currentTarget.dataset.index;
        const deviceName = this.data.deviceList[index].name;
        wx.showModal({
            title: '下线确认',
            content: '确定要将设备 "' + deviceName + '" 强制下线吗？下线后该设备需重新登录。',
            confirmColor: '#FF6B00',
            success: (res) => {
                if (res.confirm) {
                    wx.showLoading({ title: '处理中...' });
                    setTimeout(() => {
                        wx.hideLoading();
                        const updated = [...this.data.deviceList];
                        updated.splice(index, 1);
                        this.setData({ deviceList: updated });
                        wx.showToast({ title: '已成功移除该设备', icon: 'success' });
                    }, 800);
                }
            }
        });
    }
});
