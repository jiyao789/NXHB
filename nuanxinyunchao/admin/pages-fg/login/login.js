const { loginByPassword } = require('../../api/auth.js')

Page({
  data: {
    formData: {
      account: '',
      password: ''
    },
    isAgreed: false,
    safeAreaTop: 0,
    redirectUrl: ''
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    let url = options.redirect ? decodeURIComponent(options.redirect) : '/nuanxinyunchao/admin/pages/rank/index'
    if (!url.startsWith('/')) {
      url = '/' + url
    }
    this.setData({
      safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : 0,
      redirectUrl: url
    })
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`formData.${field}`]: e.detail.value
    })
  },

  clearAccount() {
    this.setData({ 'formData.account': '' })
  },

  clearPassword() {
    this.setData({ 'formData.password': '' })
  },

  toggleAgree() {
    this.setData({
      isAgreed: !this.data.isAgreed
    })
  },

  navToAgreement() {
    wx.navigateTo({ url: '/nuanxinyunchao/admin/pages-sub/about/webview?type=service' })
  },

  navToPrivacy() {
    wx.navigateTo({ url: '/nuanxinyunchao/admin/pages-sub/about/webview?type=privacy' })
  },

  async handleLogin() {
    const { account, password } = this.data.formData
    const { isAgreed, redirectUrl } = this.data

    if (!account) {
      return wx.showToast({ title: '请输入账号', icon: 'none' })
    }
    if (!password) {
      return wx.showToast({ title: '请输入密码', icon: 'none' })
    }
    if (!isAgreed) {
      return wx.showToast({ title: '请先阅读并同意协议', icon: 'none' })
    }

    wx.showLoading({ title: '登录中...' })
    try {
      const res = await loginByPassword({
        account,
        password,
        device: 'MINIPROGRAM',
        clientType: 'admin'
      })
      wx.hideLoading()

      if (res.code === 200 || res.code === 0) {
        // loginByPassword 接口现在返回 { token, passwordExpired }
        const token = res.data && typeof res.data === 'object' ? res.data.token : res.data
        const passwordExpired = res.data && typeof res.data === 'object' ? !!res.data.passwordExpired : false

        wx.setStorageSync('token', token)

        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1000
        })

        setTimeout(() => {
          // 密码过期提示
          if (passwordExpired) {
            wx.showModal({
              title: '密码安全提醒',
              content: '您的密码已超过90天未修改，为保障账号安全，建议您及时修改密码。',
              confirmText: '立即修改',
              cancelText: '暂不修改',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  wx.navigateTo({ url: '/nuanxinyunchao/admin/pages-sub/password/index' })
                } else {
                  const tabbarPages = [
                    '/nuanxinyunchao/admin/pages/rank/index',
                    '/nuanxinyunchao/admin/pages/data/index',
                    '/nuanxinyunchao/admin/pages/review/index'
                  ]
                  if (tabbarPages.includes(redirectUrl)) {
                    wx.reLaunch({ url: redirectUrl })
                  } else {
                    wx.redirectTo({ url: redirectUrl })
                  }
                }
              }
            })
          } else {
            const tabbarPages = [
              '/nuanxinyunchao/admin/pages/rank/index',
              '/nuanxinyunchao/admin/pages/data/index',
              '/nuanxinyunchao/admin/pages/review/index'
            ]

            if (tabbarPages.includes(redirectUrl)) {
              wx.reLaunch({ url: redirectUrl })
            } else {
              wx.redirectTo({ url: redirectUrl })
            }
          }
        }, 1000)
      } else {
        wx.showToast({ title: res.msg || res.message || '登录失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('登录请求处理结束:', err)
    }
  }
})


