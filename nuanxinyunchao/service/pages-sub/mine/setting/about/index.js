Page({
  data: {
    safeAreaTop: 0,
    version: '1.0.0'
  },

  onLoad() {
    // 获取系统信息，计算安全区适配自定义导航栏
    const systemInfo = wx.getSystemInfoSync();
    // 兼容处理安全区高度
    const safeTop = systemInfo.safeArea ? systemInfo.safeArea.top : systemInfo.statusBarHeight;
    
    // 获取小程序版本号 (仅在正式版/体验版有效，开发版会返回空或默认值)
    const accountInfo = wx.getAccountInfoSync();
    const envVersion = accountInfo.miniProgram.version || '1.0.0';

    this.setData({
      safeAreaTop: safeTop || 0,
      version: envVersion
    });
  },

  navToService() {
    wx.navigateTo({
      url: '/nuanxinyunchao/service/pages-sub/mine/setting/about/webview?type=service'
    });
  },

  navToPrivacy() {
    wx.navigateTo({
      url: '/nuanxinyunchao/service/pages-sub/mine/setting/about/webview?type=privacy'
    });
  },

  handleBack() {
    wx.navigateBack({
      delta: 1
    });
  }
});