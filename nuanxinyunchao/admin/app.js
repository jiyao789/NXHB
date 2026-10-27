App({
  onLaunch: function () {
    const userInfo = wx.getStorageSync('admin_userInfo') || null;
    const token = wx.getStorageSync('admin_token') || '';
    this.globalData.userInfo = userInfo;
    this.globalData.admin_userInfo = userInfo;
    this.globalData.token = token;
    this.globalData.admin_token = token;
  },
  onShow: function () {
    const userInfo = wx.getStorageSync('admin_userInfo') || null;
    const token = wx.getStorageSync('admin_token') || '';
    this.globalData.userInfo = userInfo;
    this.globalData.admin_userInfo = userInfo;
    this.globalData.token = token;
    this.globalData.admin_token = token;
  },
  onHide: function () {
    console.log('App Hide');
  },
  globalData: {
    userInfo: null,
    admin_userInfo: null,
    token: '',
    admin_token: ''
  }
});
