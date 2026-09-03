"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../../../utils/token");
const auth_1 = require("../../../api/auth");
const uploadFile_1 = require("../../../utils/uploadFile");

Page({
    data: {
        safeAreaTop: 20,
        currentStep: 0,
        isPartyMember: false,
        countdown: 0,
        certImages: [],
        form: {
            name: '', phone: '', code: '',
            siteName: '', businessArea: '', address: '',
            invitationCode: ''
        },
        rolesId: null,
        validCodeReqNo: '',
        isAgreed: false
    },
    _timer: null,
    onLoad(options) {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({
            safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : (sysInfo.statusBarHeight || 20)
        });
        if (options.role) {
            this.setData({ rolesId: parseInt(options.role) });
            console.log('RolesID:', this.data.rolesId);
        }
        // 支持从二维码扫码自动填充邀请码
        if (options.inviteCode) {
            this.setData({ 'form.invitationCode': options.inviteCode.trim().toUpperCase() });
            console.log('InviteCode from QR:', options.inviteCode);
        }
    },
    onUnload() {
        if (this._timer)
            clearInterval(this._timer);
    },
    /* ── 导航 ── */
    handleBack() {
        const { currentStep } = this.data;
        if (currentStep > 0 && currentStep < 2) {
            this.setData({ currentStep: currentStep - 1 });
        }
        else {
            wx.navigateBack();
        }
    },
    onJump(e) {
        const step = e.detail.step;
        if (step < this.data.currentStep)
            this.setData({ currentStep: step });
    },
    goToProtocol(e) {
        const type = e.detail.type;
        wx.navigateTo({ url: `/nuanxinyunchao/user/pages-sub/mine/setting/about/webview?type=${type}` });
    },
    goHome() { wx.reLaunch({ url: '/nuanxinyunchao/user/pages/index/index' }); },
    /* ── 表单 ── */
    onFieldChange(e) {
        const { field, value } = e.detail;
        this.setData({ [`form.${field}`]: value });
    },
    async onCertChanged(e) {
        const tempPaths = e.detail.paths;
        const current = this.data.certImages;
        const remaining = 6 - current.length;
        const toUpload = tempPaths.slice(0, remaining);
        if (toUpload.length === 0) return;

        wx.showLoading({ title: '上传中...', mask: true });
        try {
            const uploadPromises = toUpload.map(path =>
                uploadFile_1.uploadLocal(path)
            );
            const uploadedUrls = await Promise.all(uploadPromises);
            wx.hideLoading();
            this.setData({ certImages: current.concat(uploadedUrls).slice(0, 6) });
        } catch (err) {
            wx.hideLoading();
            console.error('证件上传失败', err);
            wx.showToast({ title: '上传失败，请重试', icon: 'none' });
        }
    },
    onCertDeleted(e) {
        const index = e.detail.index;
        const images = [...this.data.certImages];
        images.splice(index, 1);
        this.setData({ certImages: images });
    },
    togglePartyMember() { this.setData({ isPartyMember: !this.data.isPartyMember }); },
    toggleAgree() { this.setData({ isAgreed: !this.data.isAgreed }); },
    /* ── 验证码 ── */
    handleSendCode() {
        const phone = this.data.form.phone;
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
            return;
        }
        wx.showLoading({ title: '发送中...' });
        (0, auth_1.sendSmsApi)(phone, '', true).then(res => {
            wx.hideLoading();
            wx.showToast({ title: '验证码已发送', icon: 'success' });
            // res 应包含 validCodeReqNo
            this.setData({ 
                validCodeReqNo: res,
                countdown: 60 
            });
            this._timer = setInterval(() => {
                if (this.data.countdown > 1) {
                    this.setData({ countdown: this.data.countdown - 1 });
                }
                else {
                    clearInterval(this._timer);
                    this.setData({ countdown: 0 });
                }
            }, 1000);
        }).catch(err => {
            wx.hideLoading();
        });
    },
    /* ── 步骤推进 / 提交 ── */
    async handleNext() {
        const { currentStep, form, isAgreed, certImages, rolesId, validCodeReqNo, isPartyMember } = this.data;
        // 步骤一：个人信息验证
        if (currentStep === 0) {
            if (!certImages || certImages.length === 0) {
                wx.showToast({ title: '请上传职业证件', icon: 'none' });
                return;
            }
            if (!form.name.trim()) {
                wx.showToast({ title: '请输入姓名', icon: 'none' });
                return;
            }
            if (!/^1[3-9]\d{9}$/.test(form.phone)) {
                wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
                return;
            }
            if (!form.code) {
                wx.showToast({ title: '请输入验证码', icon: 'none' });
                return;
            }
            if (!form.invitationCode || !form.invitationCode.trim()) {
                wx.showToast({ title: '请输入邀请码', icon: 'none' });
                return;
            }
            // 进入第二步（此时还不提交，因为工作信息还没填）
            this.setData({ currentStep: 1 });
        }
        // 步骤二：工作信息验证 & 提交
        else if (currentStep === 1) {
            if (!form.siteName.trim()) {
                wx.showToast({ title: '请输入所属网点', icon: 'none' });
                return;
            }
            if (!form.businessArea.trim()) {
                wx.showToast({ title: '请输入商圈范围', icon: 'none' });
                return;
            }
            if (!form.address.trim()) {
                wx.showToast({ title: '请输入居住地址', icon: 'none' });
                return;
            }
            if (!isAgreed) {
                wx.showToast({ title: '请先阅读并同意协议', icon: 'none' });
                return;
            }
            
            wx.showLoading({ title: '注册中...', mask: true });
            
            try {
                const registerParam = {
                    name: form.name,
                    phone: form.phone,
                    code: form.code,
                    validCodeReqNo: validCodeReqNo,
                    rolesId: rolesId,
                    invitationCode: form.invitationCode,
                    device: 'MINI_PROGRAM',
                    extendInfo: {
                        siteName: form.siteName,
                        businessArea: form.businessArea,
                        address: form.address,
                        certImages: certImages,
                        isPartyMember: isPartyMember
                    }
                };

                // 调用注册接口
                const res = await (0, auth_1.registerApi)(registerParam);
                
                wx.hideLoading();
                this.setData({ isSubmitting: false });
                if (res) {
                    const token = res;
                    
                    // 1. 保存 Token
                    const app = getApp();
                    app.globalData.token = token;
                    token_1.tokenManager.setToken(token);

                    // 2. 获取详细用户信息
                    try {
                        const authResult = await (0, auth_1.getLoginUserInfoApi)();
                        if (authResult) {
                            app.globalData.userInfo = authResult;
                            wx.setStorageSync('userInfo', authResult);
                        }
                    } catch (e) {
                        console.error('Failed to fetch user info:', e);
                    }

                    wx.showToast({ title: '注册成功', icon: 'success' });
                    setTimeout(() => {
                        wx.reLaunch({ url: '/nuanxinyunchao/user/pages/index/index' });
                    }, 1500);
                } else {
                    // 无 token → 进入审核中状态
                    this.setData({ currentStep: 2 });
                }
            } catch (err) {
                wx.hideLoading();
                console.error('Registration failed:', err);
            }
        }
    },
    /* ── 审核页操作 ── */
    goToLogin() {
        wx.reLaunch({ url: '/nuanxinyunchao/user/pages-sub/auth/login/index' });
    }
});
