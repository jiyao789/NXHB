const { httpPost } = require('../../utils/http.js')

Page({
  data: {
    safeAreaTop: 20,
    formData: {
      password: '',
      newPassword: '',
      confirmPassword: ''
    },
    redirectUrl: '/nuanxinyunchao/admin/pages/rank/index',
    fromLogin: false
  },

  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    const fromLogin = options && options.from === 'login'
    let redirectUrl = options && options.redirect ? decodeURIComponent(options.redirect) : '/nuanxinyunchao/admin/pages/rank/index'
    if (!redirectUrl.startsWith('/')) {
      redirectUrl = '/' + redirectUrl
    }

    this.setData({
      safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : 20,
      fromLogin,
      redirectUrl
    })
  },

  handleBack() {
    const pages = getCurrentPages()
    const prevPage = pages && pages.length > 1 ? pages[pages.length - 2] : null
    const prevRoute = prevPage ? prevPage.route || '' : ''
    const isPrevLogin = prevRoute.includes('nuanxinyunchao/admin/pages-fg/login/login')

    // 如果是从登录页跳转过来的，或者页面栈上一页是登录页，返回时跳转到首页/目标页
    if (this.data.fromLogin || isPrevLogin || !prevPage) {
      const targetUrl = this.data.redirectUrl || '/nuanxinyunchao/admin/pages/rank/index'
      const tabbarPages = [
        '/nuanxinyunchao/admin/pages/rank/index',
        '/nuanxinyunchao/admin/pages/data/index',
        '/nuanxinyunchao/admin/pages/review/index'
      ]
      if (tabbarPages.includes(targetUrl)) {
        wx.reLaunch({ url: targetUrl })
      } else {
        wx.redirectTo({ url: targetUrl })
      }
      return
    }

    wx.navigateBack()
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const key = `formData.${field}`
    this.setData({ [key]: e.detail.value })
  },

  handleSubmit() {
    const { password, newPassword, confirmPassword } = this.data.formData
    if (!password) {
      wx.showToast({ title: '请输入原密码', icon: 'none' })
      return
    }
    if (!/^(?=.*[a-zA-Z])(?=.*\d).{6,9}$/.test(newPassword)) {
      wx.showToast({ title: '新密码须6-9位且含字母数字', icon: 'none' })
      return
    }
    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次新密码不一致', icon: 'none' })
      return
    }

    wx.showLoading({ title: '修改中...' })
    httpPost('/client/user/updatePassword', {
      password,
      newPassword,
      confirmPassword
    })
      .then((res) => {
        wx.hideLoading()
        wx.showToast({ title: '密码修改成功', icon: 'success' })
        setTimeout(() => {
          wx.removeStorageSync('admin_token')
          wx.removeStorageSync('admin_login_time')
          wx.removeStorageSync('admin_userInfo')
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          const app = getApp()
          if (app && app.globalData) {
            delete app.globalData.admin_token
            delete app.globalData.admin_userInfo
          }
          wx.reLaunch({ url: '/nuanxinyunchao/admin/pages-fg/login/login' })
        }, 1500)
      })
      .catch((err) => {
        wx.hideLoading()
        wx.showToast({
          title: (err && err.message) || (err && err.msg) || '修改失败',
          icon: 'none'
        })
      })
  }
})
