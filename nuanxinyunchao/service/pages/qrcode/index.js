Page({
  onShow() {
    const { checkLogin } = require('../../utils/auth.js');
    if (!checkLogin('pages/qrcode/index')) return;

    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
  },

  handleScan() {
    wx.scanCode({
      success: (res) => {
        wx.showToast({ title: '扫描成功: ' + res.result, icon: 'none' });
      }
    });
  }
})
