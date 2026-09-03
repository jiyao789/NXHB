const { getAllCoupons } = require('../../../../api/adminStatistics.js');

Page({
  data: {
    list: [],
    userId: ''
  },

  onLoad(options) {
    if (options.userId) {
      this.setData({ userId: options.userId });
      this.fetchData(options.userId);
    } else {
      const pages = getCurrentPages();
      if (pages.length >= 2) {
        const prevPage = pages[pages.length - 2];
        const userId = prevPage.data.userInfo?.id;
        if (userId) {
          this.setData({ userId });
          this.fetchData(userId);
        }
      }
    }
  },

  async fetchData(userId) {
    wx.showLoading({ title: '加载中' });
    try {
      const res = await getAllCoupons(userId);
      if (res && res.code === 200) {
        this.setData({ list: res.data || [] });
      }
    } catch (e) {
      wx.showToast({ title: '获取数据失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});
