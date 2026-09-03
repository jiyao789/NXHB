"use strict";
Page({
    data: {
        safeAreaTop: 20,
        showPassword: false,
        isCounting: false,
        count: 60,
        formData: {
            phone: '',
            code: '',
            password: ''
        }
    },
    timer: null,
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaTop: sysInfo.safeArea.top });
    },
    onUnload() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    },
    handleBack() {
        wx.navigateBack();
    },
    onInput(e) {
        const field = e.currentTarget.dataset.field;
        const key = `formData.${field}`;
        this.setData({ [key]: e.detail.value });
    },
    togglePassword() {
        this.setData({ showPassword: !this.data.showPassword });
    },
    getCode() {
        if (this.data.isCounting)
            return;
        if (!/^1[3-9]\d{9}$/.test(this.data.formData.phone)) {
            wx.showToast({ title: '手机号格式不正确', icon: 'none' });
            return;
        }
        wx.showLoading({ title: '发送中...' });
        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '验证码1234', icon: 'success' });
            this.setData({ isCounting: true, count: 60 });
            this.timer = setInterval(() => {
                if (this.data.count > 1) {
                    this.setData({ count: this.data.count - 1 });
                }
                else {
                    clearInterval(this.timer);
                    this.setData({ isCounting: false, count: 60 });
                }
            }, 1000);
        }, 800);
    },
    handleConfirm() {
        const { code, password } = this.data.formData;
        if (!code || code.length < 4) {
            wx.showToast({ title: '请输入正确的验证码', icon: 'none' });
            return;
        }
        if (password.length < 8) {
            wx.showToast({ title: '密码长度至少8位', icon: 'none' });
            return;
        }
        wx.showLoading({ title: '修改中...' });
        setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '密码修改成功', icon: 'success' });
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        }, 1000);
    }
});
