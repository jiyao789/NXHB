Page({
  data: {
    redirectUrl: ''
  },
  onLoad(options) {
    let url = options.redirect ? decodeURIComponent(options.redirect) : '/nuanxinyunchao/admin/pages/rank/index';
    if (!url.startsWith('/')) {
      url = '/' + url;
    }
    this.setData({ redirectUrl: url });
  },
  doLogin() {
    // 模拟登录成功，直接跳转
    getApp().globalData.userInfo = {
      username: '管理员',
      role: 'admin'
    };

    wx.showToast({
      title: '模拟登录成功',
      icon: 'success',
      duration: 1000
    });

    setTimeout(() => {
      const url = this.data.redirectUrl;
      const tabbarPages = ['/nuanxinyunchao/admin/pages/rank/index', '/nuanxinyunchao/admin/pages/data/index', '/nuanxinyunchao/admin/pages/review/index'];

      if (tabbarPages.includes(url)) {
        wx.reLaunch({ url });
      } else {
        wx.redirectTo({ url });
      }
    }, 1000);
  }
});
