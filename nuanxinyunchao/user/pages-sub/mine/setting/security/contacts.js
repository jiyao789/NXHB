"use strict";
Page({
    data: {
        safeAreaTop: 20,
        contacts: [
            { id: 1, name: '张卫国', phone: '138****8899', allowLocation: true },
            { id: 2, name: '李芳', phone: '155****2233', allowLocation: false }
        ]
    },
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaTop: sysInfo.safeArea.top });
    },
    handleBack() {
        wx.navigateBack();
    },
    handleLocationChange(e) {
        const index = e.currentTarget.dataset.index;
        const key = `contacts[${index}].allowLocation`;
        this.setData({ [key]: e.detail.value });
    },
    handleAdd() {
        if (this.data.contacts.length >= 5) {
            wx.showToast({ title: '最多添加5位联系人', icon: 'none' });
            return;
        }
        // Note: chooseContact scope limited by miniprogram privacy policies, standard behavior
        wx.chooseContact({
            success: (res) => {
                const rawPhone = res.phoneNumber.replace(/\s+/g, '');
                const newContact = {
                    id: Date.now(),
                    name: res.displayName || '未知联系人',
                    phone: rawPhone,
                    allowLocation: true
                };
                const updated = [...this.data.contacts, newContact];
                this.setData({ contacts: updated });
                wx.showToast({ title: '导入成功', icon: 'success' });
            },
            fail: (err) => {
                console.log('取消选择或权限失败:', err);
            }
        });
    },
    handleDelete(e) {
        const index = e.currentTarget.dataset.index;
        wx.showModal({
            title: '移除提示',
            content: '确定移除该应急联系人吗？',
            confirmColor: '#FF6B00',
            success: (res) => {
                if (res.confirm) {
                    const updated = [...this.data.contacts];
                    updated.splice(index, 1);
                    this.setData({ contacts: updated });
                    wx.showToast({ title: '已移除', icon: 'success' });
                }
            }
        });
    }
});
