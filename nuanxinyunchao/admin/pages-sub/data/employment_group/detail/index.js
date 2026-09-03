const { httpGet } = require('../../../../utils/http.js');

const app = getApp();

Page({
  data: {
    statusBarHeight: 20,
    streetId: '',
    streetName: '',
    totalCount: 0,
    roleId: 0,
    roles: [
      { id: 0, name: '全部' },
      { id: 1, name: '外卖骑手' },
      { id: 2, name: '快递员' },
      { id: 3, name: '网约车司机' },
      { id: 4, name: '货车司机' },
      { id: 5, name: '网络主播' }
    ],
    keyword: '',
    userList: [],
    page: 1,
    hasMore: true,
    loading: false
  },

  onLoad(options) {
    let statusBarHeight = 20;
    if (app && app.globalData && app.globalData.systemInfo) {
      statusBarHeight = app.globalData.systemInfo.statusBarHeight;
    } else {
      const info = wx.getSystemInfoSync();
      statusBarHeight = info.statusBarHeight;
    }
    
    this.setData({ 
      statusBarHeight,
      streetId: options.id || '',
      streetName: options.name || '',
      totalCount: options.count || 0
    });
    
    this.fetchData(true);
  },

  handleRoleChange(e) {
    const roleId = e.currentTarget.dataset.id;
    this.setData({ roleId, page: 1, hasMore: true });
    this.fetchData(true);
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    this.setData({ page: 1, hasMore: true });
    this.fetchData(true);
  },

  clearSearch() {
    this.setData({ keyword: '', page: 1, hasMore: true });
    this.fetchData(true);
  },

  fetchData(reset = false) {
    if (this.data.loading || (!this.data.hasMore && !reset)) return;
    this.setData({ loading: true });

    httpGet('/server/statistics/employment-group/users', {
      streetId: this.data.streetId,
      roleId: this.data.roleId,
      keyword: this.data.keyword,
      current: this.data.page,
      size: 20
    }).then(res => {
      const data = res.data || {};
      const records = data.records || [];
      const total = data.total || 0;
      
      this.setData({
        userList: reset ? records : [...this.data.userList, ...records],
        hasMore: (this.data.page * 20) < total,
        page: this.data.page + 1,
        loading: false
      });
    }).catch(err => {
      console.error("fetch street users failed", err);
      this.setData({ loading: false });
    });
  },

  onReachBottom() {
    this.fetchData();
  },

  goBack() {
    wx.navigateBack();
  }
});
