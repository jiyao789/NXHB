"use strict";
const token_1 = require("../../../utils/token");
const http_1 = require("../../../utils/http");

Page({
    data: {
        safeAreaTop: 20,
        showOldPassword: false,
        showNewPassword: false,
        showConfirmPassword: false,
        formData: {
            password: '',
            newPassword: '',
            confirmPassword: ''
        }
    },
    
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : 20 });
    },
    
    handleBack() {
        wx.navigateBack();
    },
    
    onInput(e) {
        const field = e.currentTarget.dataset.field;
        const key = `formData.${field}`;
        this.setData({ [key]: e.detail.value });
    },
    
    handleSubmit() {
        const { password, newPassword, confirmPassword } = this.data.formData;
        if (!password) {
            wx.showToast({ title: '请输入原密码', icon: 'none' });
            return;
        }
        if (!/^(?=.*[a-zA-Z])(?=.*\d).{6,9}$/.test(newPassword)) {
            wx.showToast({ title: '新密码须6-9位且含字母数字', icon: 'none' });
            return;
        }
        if (newPassword !== confirmPassword) {
            wx.showToast({ title: '两次新密码不一致', icon: 'none' });
            return;
        }
        
        wx.showLoading({ title: '修改中...' });
        (0, http_1.httpPost)('/client/user/updatePassword', {
            password,
            newPassword,
            confirmPassword
        }).then(res => {
            wx.hideLoading();
            wx.showToast({ title: '密码修改成功', icon: 'success' });
            // 退出登录，跳转登录页
            setTimeout(() => {
                token_1.tokenManager.clear();
                wx.removeStorageSync('userInfo');
                wx.reLaunch({ url: '/nuanxinyunchao/user/pages-fg/login/login' });
            }, 1500);
        }).catch(err => {
            wx.hideLoading();
            wx.showToast({ title: err.message || '修改失败', icon: 'none' });
        });
    }
});
