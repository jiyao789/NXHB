const app = getApp();

Page({
  data: {
    safeAreaTop: 0,
    navBarHeight: 44
  },

  onLoad(options) {
    const systemInfo = wx.getSystemInfoSync();
    const menuButton = wx.getMenuButtonBoundingClientRect();
    const statusBarHeight = systemInfo.statusBarHeight;
    const navBarHeight = (menuButton.top - statusBarHeight) * 2 + menuButton.height;

    this.setData({
      safeAreaTop: statusBarHeight,
      navBarHeight: navBarHeight
    });
  },

  handleBack() {
    wx.navigateBack();
  }
});
