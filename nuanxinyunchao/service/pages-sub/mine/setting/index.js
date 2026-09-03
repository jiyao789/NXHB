Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    userInfo: {}
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20
    });
  },

  onShow() {
    // 每次进入页面刷新用户信息，确保角色权限和资产展示最新
    const userInfo = wx.getStorageSync('service_userInfo') || {};
    this.setData({ userInfo });
  },

  handleBack() {
    wx.navigateBack();
  },

  // 通用跳转
  navTo(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({ url });
  },

  // 清理缓存
  handleClearCache() {
    const res = wx.getStorageInfoSync();
    const sizeKB = res.currentSize;
    let sizeText = '';

    if (sizeKB > 1024) {
      sizeText = `${(sizeKB / 1024).toFixed(2)} MB`;
    } else {
      sizeText = `${sizeKB.toFixed(2)} KB`;
    }

    wx.showModal({
      title: '清理缓存',
      content: `当前已占用 ${sizeText} 缓存，是否确认清理？`,
      confirmColor: '#000000',
      success: (modalRes) => {
        if (modalRes.confirm) {
          this.performClear();
        }
      }
    });
  },

  // 执行清理
  performClear() {
    wx.showLoading({ title: '清理中...' });
    try {
      // 保留用户 token 和信息，避免清理掉登录状态
      const rawToken = wx.getStorageSync('service_token');
      const rawUserInfo = wx.getStorageSync('service_userInfo');

      wx.clearStorageSync();

      if (rawToken) wx.setStorageSync('service_token', rawToken);
      if (rawUserInfo) wx.setStorageSync('service_userInfo', rawUserInfo);

      setTimeout(() => {
        wx.hideLoading();
        wx.showToast({ title: '清理完成', icon: 'success' });
      }, 500);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '清理失败', icon: 'none' });
    }
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmColor: '#000000',
      success: (res) => {
        if (res.confirm) {
          // 清除登录态
          wx.removeStorageSync('service_token');
          wx.removeStorageSync('service_userInfo');
          wx.reLaunch({ url: '/nuanxinyunchao/service/pages-sub/auth/login' });
        }
      }
    });
  },

  // 解除绑定
  handleUnbind() {
    wx.showModal({
      title: '警告',
      content: '解除绑定后将无法使用相关功能，确定继续吗？',
      confirmColor: '#ff0000',
      success: (res) => {
        if (res.confirm) {
          // 清除登录态并解绑
          wx.removeStorageSync('service_token');
          wx.removeStorageSync('service_userInfo');
          wx.reLaunch({ url: '/nuanxinyunchao/service/pages-sub/auth/login' });
        }
      }
    });
  }
});