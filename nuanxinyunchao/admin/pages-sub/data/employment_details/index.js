Page({
  data: {
    statusBarHeight: 20,
    safeAreaTop: 44,
    scrollTop: 0,
    navBarHeight: 44,
    
    // 顶部统计数据
    totalCount: 0,
    statsChart: [],
    
    // 街道分布列表
    districts: []
  },

  onLoad() {
    this.initSystemInfo();
    this.fetchMockData();
  },

  initSystemInfo() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ 
      statusBarHeight: sysInfo.statusBarHeight,
      safeAreaTop: sysInfo.statusBarHeight
    });
  },

  fetchMockData() {
    wx.showLoading({ title: '加载中...' });

    // 模拟柱状图数据 (percent 用于控制柱子高度)
    const mockStats = [
      { label: '外卖', count: 357, percent: 85 },
      { label: '快递', count: 225, percent: 60 },
      { label: '网约车', count: 182, percent: 45 },
      { label: '货运', count: 116, percent: 30 },
      { label: '主播', count: 320, percent: 75 }
    ];

    // 模拟各街道人员登记分布数据
    const mockDistricts = [
      { name: '华阳路街道', count: 136 },
      { name: '江苏路街道', count: 92 },
      { name: '新华路街道', count: 105 },
      { name: '周家桥街道', count: 80 },
      { name: '天山路街道', count: 190 },
      { name: '仙霞新村街道', count: 142 },
      { name: '虹桥街道', count: 115 },
      { name: '程家桥街道', count: 88 },
      { name: '北新泾街道', count: 76 },
      { name: '新泾镇', count: 124 },
      { name: '临空经济园区', count: 142 }
    ];

    setTimeout(() => {
      this.setData({
        totalCount: '1,200',
        statsChart: mockStats,
        districts: mockDistricts
      });
      wx.hideLoading();
    }, 400);
  },

  handleBack() {
    wx.navigateBack();
  },

  onScroll(e) {
    this.setData({ scrollTop: e.detail.scrollTop });
  },

  handleSearch() {
    wx.showToast({ title: '点击了搜索', icon: 'none' });
  },

  handleToPersonnelDetails(e) {
    const name = e.currentTarget.dataset.name;
    wx.navigateTo({
      url: `/nuanxinyunchao/admin/pages-sub/data/personnel_details/index?name=${encodeURIComponent(name)}`
    });
  }
});
