const { httpGet } = require('../../../utils/http.js');

const app = getApp();

Page({
  data: {
    statusBarHeight: 20,
    total: 0,
    roles: [
      { id: 1, name: '外卖', count: 0 },
      { id: 2, name: '快递', count: 0 },
      { id: 3, name: '网约车', count: 0 },
      { id: 4, name: '货运', count: 0 },
      { id: 5, name: '主播', count: 0 }
    ],
    streetList: [],
    maxCount: 100
  },

  onLoad() {
    let statusBarHeight = 20;
    if (app && app.globalData && app.globalData.systemInfo) {
      statusBarHeight = app.globalData.systemInfo.statusBarHeight;
    } else {
      const info = wx.getSystemInfoSync();
      statusBarHeight = info.statusBarHeight;
    }
    this.setData({ statusBarHeight });
    this.fetchData();
  },

  fetchData() {
    httpGet('/server/statistics/employment-group/overview').then(res => {
      const data = res.data || {};
      const roles = [
        { id: 1, name: '外卖', count: data.deliveryCount || 0 },
        { id: 2, name: '快递', count: data.courierCount || 0 },
        { id: 3, name: '网约车', count: data.rideHailingCount || 0 },
        { id: 4, name: '货运', count: data.freightCount || 0 },
        { id: 5, name: '主播', count: data.streamerCount || 0 }
      ];
      
      let maxCount = 0;
      roles.forEach(r => {
        if (r.count > maxCount) maxCount = r.count;
      });
      if (maxCount === 0) maxCount = 1;

      this.setData({
        total: data.total || 0,
        roles,
        maxCount,
        streetList: data.streetList || []
      });
    }).catch(err => {
      console.error("fetch employment overview failed", err);
    });
  },

  goBack() {
    wx.navigateBack();
  },

  handleStreetClick(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    const count = e.currentTarget.dataset.count;
    wx.navigateTo({
      url: `/nuanxinyunchao/admin/pages-sub/data/employment_group/detail/index?id=${id}&name=${name}&count=${count}`
    });
  }
});
