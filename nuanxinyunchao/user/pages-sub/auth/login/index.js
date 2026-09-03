"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../../../utils/token");
const auth_1 = require("../../../api/auth");
Page({
    data: {
        safeAreaTop: 20,
        isLoading: false,
        countdown: 0,
        isAgreed: false,
        formData: {
            mobile: '',
            code: ''
        },
        mobileFocused: false,
        codeFocused: false,
        validCodeReqNo: ''
    },
    timer: null,
    onLoad(options) {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({
            safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : (sysInfo.statusBarHeight || 20)
        });
    },
    onUnload() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    },
    handleBack() {
        wx.navigateBack();
    },
    onMobileInput(e) { this.setData({ 'formData.mobile': e.detail.value }); },
    clearMobile() { this.setData({ 'formData.mobile': '' }); },
    onMobileFocus() { this.setData({ mobileFocused: true }); },
    onMobileBlur() { this.setData({ mobileFocused: false }); },
    onCodeInput(e) { this.setData({ 'formData.code': e.detail.value }); },
    onCodeFocus() { this.setData({ codeFocused: true }); },
    onCodeBlur() { this.setData({ codeFocused: false }); },
    toggleAgree() {
        this.setData({ isAgreed: !this.data.isAgreed });
    },
    goToProtocol(e) {
        const type = e.currentTarget.dataset.type;
        wx.navigateTo({ url: `/nuanxinyunchao/user/pages-sub/mine/setting/about/webview?type=${type}` });
    },
    goToRegister() {
        wx.navigateTo({ url: '/nuanxinyunchao/user/pages-sub/auth/identity/index' });
    },
    handleSendCode() {
        if (!/^1[3-9]\d{9}$/.test(this.data.formData.mobile)) {
            wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
            return;
        }
        wx.showLoading({ title: '发送中...' });
        (0, auth_1.sendSmsApi)(this.data.formData.mobile, '', false).then(res => {
            wx.hideLoading();
            wx.showToast({ title: '验证码已发送', icon: 'success' });
            this.setData({ 
                countdown: 60,
                validCodeReqNo: res
            });
            this.timer = setInterval(() => {
                if (this.data.countdown > 1) {
                    this.setData({ countdown: this.data.countdown - 1 });
                }
                else {
                    clearInterval(this.timer);
                    this.setData({ countdown: 0 });
                }
            }, 1000);
        }).catch(err => {
            wx.hideLoading();
        });
    },
    handleLogin() {
        if (!/^1[3-9]\d{9}$/.test(this.data.formData.mobile)) {
            wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
            return;
        }
        if (!this.data.formData.code) {
            wx.showToast({ title: '请输入验证码', icon: 'none' });
            return;
        }
        if (!this.data.isAgreed) {
            wx.showToast({ title: '请先阅读并同意协议', icon: 'none' });
            return;
        }
        this.setData({ isLoading: true });
        const param = {
            phone: this.data.formData.mobile,
            code: this.data.formData.code,
            validCodeReqNo: this.data.validCodeReqNo,
            device: 'MINIPROGRAM',
            clientType: 'user'
        };
        (0, auth_1.loginByPhoneApi)(param).then(token => {
            token_1.tokenManager.setToken(token);
            // 登录成功后获取用户信息
            return (0, auth_1.getLoginUserInfoApi)();
        }).then(userInfo => {
            const app = getApp();
            app.globalData.userInfo = userInfo;
            wx.setStorageSync('userInfo', userInfo);
            this.setData({ isLoading: false });
            wx.showToast({ title: '登录成功', icon: 'success' });
            setTimeout(() => {
                wx.reLaunch({ url: '/nuanxinyunchao/user/pages/index/index' });
            }, 1000);
        }).catch(err => {
            this.setData({ isLoading: false });
            const errMsg = (err && err.msg) || (err && err.message) || (err && err.error) || (err && err.errMsg) || String(err || '');
            console.error('登录失败', err, '解析后信息:', errMsg);

            if (errMsg.indexOf('审核') > -1) {
                // 审核中
                wx.showModal({
                    title: '审核中',
                    content: '您的注册申请正在审核中，请稍后再试',
                    showCancel: false,
                    confirmText: '我知道了'
                });
            } else if (errMsg.indexOf('未注册') > -1) {
                // 未注册
                wx.showModal({
                    title: '未注册',
                    content: '该手机号未注册，是否前往注册？',
                    confirmText: '去注册',
                    cancelText: '取消',
                    success: (res) => {
                        if (res.confirm) {
                            wx.navigateTo({ url: '/nuanxinyunchao/user/pages-sub/auth/identity/index' });
                        }
                    }
                });
            } else if (errMsg.indexOf('禁用') > -1) {
                wx.showModal({
                    title: '账号异常',
                    content: '该账号已被禁用，请联系管理员',
                    showCancel: false,
                    confirmText: '我知道了'
                });
            } else {
                wx.showToast({ title: errMsg || '登录失败', icon: 'none' });
            }
        });
    }
});
