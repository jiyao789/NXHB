Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    list: [
      { title: '登录密码', path: '' },
      { title: '登录过的设备', path: '' },
      { title: '应急联系人', path: '' },
      { title: '安全中心', path: '' }
    ]
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20
    });
  },

  handleBack() {
    wx.navigateBack();
  },

  handleNav(e) {
    const path = e.currentTarget.dataset.path;
    if (path) {
      wx.navigateTo({ url: path });
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  }
});