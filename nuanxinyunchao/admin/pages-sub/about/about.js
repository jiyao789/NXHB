Page({
  data: {
    hasLogin: false,
    mockResult: '点击按钮加载数据...'
  },
  onShow() {
    const app = getApp();
    this.setData({
      hasLogin: !!(app.globalData && app.globalData.userInfo)
    });
  },
  gotoLogin() {
    if (this.data.hasLogin) {
      wx.showToast({
        title: '已登录，不能去登录页',
        icon: 'none',
      });
      return;
    }
    const redirect = encodeURIComponent('/nuanxinyunchao/admin/pages-sub/about/about?a=1&b=2');
    wx.navigateTo({
      url: `/nuanxinyunchao/admin/pages-fg/login/login?redirect=${redirect}`,
    });
  },
  logout() {
    const app = getApp();
    app.globalData.userInfo = null;
    this.setData({ hasLogin: false });
    wx.showToast({
      title: '退出登录成功',
      icon: 'success',
    });
  },
  gotoScroll() {
    wx.navigateTo({
      url: '/nuanxinyunchao/admin/pages-sub/demo/scroll',
    });
  },
  gotoAlova() {
    wx.navigateTo({
      url: '/nuanxinyunchao/admin/pages-sub/about/alova',
    });
  },
  gotoSubPage() {
    wx.navigateTo({
      url: '/nuanxinyunchao/admin/pages-sub/demo/index',
    });
  }
});
