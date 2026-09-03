const { getSiteNests } = require('../../../api/adminStatistics');

Page({
  data: {
    statusBarHeight: 20,
    safeAreaTop: 44,
    scrollTop: 0,
    navBarHeight: 44,
    searchQuery: '',
    siteList: [],
    filteredList: []
  },

  onLoad() {
    this.initSystemInfo();
    this.fetchData();
  },

  async fetchData() {
    try {
      const res = await getSiteNests();
      if (res.code === 200 && res.data) {
        this.setData({
          siteList: res.data,
          filteredList: res.data
        });
      }
    } catch(err) {
      console.error('Failed to load nests:', err);
    }
  },

  initSystemInfo() {
    try {
      const sysInfo = wx.getSystemInfoSync();
      this.setData({ 
        statusBarHeight: sysInfo.statusBarHeight,
        safeAreaTop: sysInfo.statusBarHeight 
      });
    } catch (e) {
      console.error('Failed to get system info', e);
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  openLocation(e) {
    const item = e.currentTarget.dataset.item;
    wx.openLocation({
      latitude: item.latitude,
      longitude: item.longitude,
      name: item.name,
      address: item.address,
      scale: 18
    });
  },

  onSearchInput(e) {
    const query = e.detail.value;
    const filtered = this.data.siteList.filter(item => 
      item.name.includes(query) || item.address.includes(query)
    );
    this.setData({ 
      searchQuery: query,
      filteredList: filtered
    });
  },

  onScroll(e) {
    this.setData({ scrollTop: e.detail.scrollTop });
  }
});
