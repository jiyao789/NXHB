import { getPhoneValidCode, loginByPhone, loginByPassword, getLoginUserInfo } from '../../api/auth.js'

Page({
  data: {
    formData: {
      mobile: '',
      code: '',
      password: '',
    },
    countdown: 0,
    isLoading: false,
    isAgreed: false,
    safeAreaTop: 0,
    validCodeReqNo: '',
    loginType: 'code', // 'code' 或 'password'
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : 0,
    })
  },

  toggleLoginType() {
    this.setData({
      loginType: this.data.loginType === 'code' ? 'password' : 'code',
      'formData.password': '',
      'formData.code': '',
    })
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`formData.${field}`]: e.detail.value,
    })
  },

  clearMobile() {
    this.setData({ 'formData.mobile': '' })
  },

  toggleAgree() {
    this.setData({ isAgreed: !this.data.isAgreed })
  },

  navToAgreement() {
    wx.navigateTo({ url: '/nuanxinyunchao/service/pages-sub/mine/setting/about/webview?type=service' })
  },

  navToPrivacy() {
    wx.navigateTo({ url: '/nuanxinyunchao/service/pages-sub/mine/setting/about/webview?type=privacy' })
  },

  async handleSendCode() {
    if (this.data.loginType !== 'code') return;
    const { mobile } = this.data.formData
    // 校验规则：11位标准手机号 或 以 JD_ 开头的管理账号
    const isMobile = /^1[3-9]\d{9}$/.test(mobile)
    const isJDAccount = /^JD_/.test(mobile)

    if (!isMobile && !isJDAccount) {
      return wx.showToast({ title: '请输入正确手机号或管理账号', icon: 'none' })
    }

    wx.showLoading({ title: '发送中...' })
    try {
      const res = await getPhoneValidCode({
        phone: mobile,
        isRegister: false,
      })
      wx.hideLoading()
      if (res.code === 200 || res.code === 0) {
        wx.showToast({ title: '验证码已发送', icon: 'success' })
        this.setData({
          validCodeReqNo: res.data,
          countdown: 60,
        })
        this.timer = setInterval(() => {
          if (this.data.countdown > 1) {
            this.setData({ countdown: this.data.countdown - 1 })
          } else {
            clearInterval(this.timer)
            this.setData({ countdown: 0 })
          }
        }, 1000)
      } else {
        wx.showToast({ title: res.msg || '获取失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      // 业务报错已由 http.js 拦截器统一处理，此处仅负责逻辑阻断
      console.warn('获取验证码失败:', err)
    }
  },

  async handleLogin() {
    const { mobile, code, password } = this.data.formData
    const { isAgreed, validCodeReqNo, loginType } = this.data

    if (!mobile) {
      return wx.showToast({ title: loginType === 'code' ? '请输入手机号' : '请输入账号', icon: 'none' })
    }

    if (loginType === 'code') {
      const isMobile = /^1[3-9]\d{9}$/.test(mobile)
      const isJDAccount = /^JD_/.test(mobile)

      if ((!isMobile && !isJDAccount) || !code) {
        return wx.showToast({ title: '请填写完整账号信息', icon: 'none' })
      }
    } else {
      if (!password) {
        return wx.showToast({ title: '请输入密码', icon: 'none' })
      }
    }

    if (!isAgreed) {
      return wx.showToast({ title: '请先阅读并同意协议', icon: 'none' })
    }

    this.setData({ isLoading: true })

    try {
      // 1. 执行登录
      let loginRes;
      if (loginType === 'code') {
        loginRes = await loginByPhone({
          phone: mobile,
          code: code,
          validCodeReqNo: validCodeReqNo,
          device: 'MINI_PROGRAM',
          clientType: 'service',
        })
      } else {
        loginRes = await loginByPassword({
          account: mobile,
          password: password,
          device: 'MINI_PROGRAM',
          clientType: 'service',
        })
      }

      if (loginRes.code === 200 || loginRes.code === 0) {
        const token = loginRes.data
        wx.setStorageSync('service_token', token)
        const app = getApp()
        app.globalData.token = token

        // 2. 获取详尽用户信息 (含业务概况)
        const userRes = await getLoginUserInfo()
        this.setData({ isLoading: false })

        if (userRes.code === 200 || userRes.code === 0) {
          const authResult = userRes.data

          // 3. 构建多角色用户信息对象 (标准化结构以对齐个人中心展示)
          const userInfo = {
            userId: authResult.userId,
            username: authResult.account, // 对齐 WXML 中的 userInfo.username
            name: authResult.name, // 补充真实姓名/机构名，避免与其他字段混淆
            nickname: authResult.name, // 对齐 WXML 中的 userInfo.nickname
            role:
              authResult.rolesId === 6
                ? 'street'
                : authResult.rolesId === 0
                  ? 'merchant'
                  : authResult.rolesId === 7
                    ? 'party-center'
                    : 'user', // 角色识别
            avatar:
              authResult.avatar ||
              'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/avatar.png',
            phone: authResult.phone, // 登录手机号
            rolesId: authResult.rolesId,
            orgName: authResult.orgName, // 机构名称
            address: authResult.address, // 机构地址
            contactName: authResult.contactName,
            contactPhone: authResult.contactPhone,
            realNameStatus: authResult.realNameStatus || '已认证',
            certValidity: authResult.certValidity || '2030-10-15',
            createTime: authResult.createTime || '',
            birthday: authResult.birthday || '',
            homeAddress: authResult.homeAddress || authResult.address || '',
            signature: authResult.signature || '',
            openingHours: authResult.openingHours || '',
            imageCollection: Array.isArray(authResult.imageCollection) ? authResult.imageCollection : JSON.parse(authResult.imageCollection || '[]')
          }

          app.globalData.userInfo = userInfo
          wx.setStorageSync('service_userInfo', userInfo)

          wx.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            if (authResult.rolesId === 7) {
              // 党群服务中心：直达核销工作台
              wx.reLaunch({ url: '/nuanxinyunchao/service/pages-sub/mine/verify-gate/index' })
            } else {
              wx.reLaunch({ url: '/nuanxinyunchao/service/pages/index/index' })
            }
          }, 1000)
        } else {
          wx.showToast({ title: '用户信息查询失败', icon: 'none' })
        }
      } else {
        this.setData({ isLoading: false })
        wx.showToast({ title: loginRes.msg || '登录失败', icon: 'none' })
      }
    } catch (err) {
      this.setData({ isLoading: false })
      const errMsg = (err && err.msg) || (err && err.message) || String(err || '请求失败')
      wx.showToast({ title: errMsg, icon: 'none' })
    }
  },

  goToRegister() {
    wx.navigateTo({ url: '/nuanxinyunchao/service/pages-sub/auth/verify' })
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer)
  },
})
