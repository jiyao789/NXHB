Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    safeAreaTop: 20,
    scrollTop: 0,
    topPerformer: null,
    districts: []
  },

  onLoad() {
    this.initSystemInfo();
    this.fetchMockData();
  },

  onPageScroll(e) {
    this.setData({ scrollTop: e.scrollTop });
  },

  initSystemInfo() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight,
      safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : sysInfo.statusBarHeight
    });
  },

  async fetchMockData() {
    wx.showLoading({ title: '处理数据中...' });

    const { getActiveBoardStats } = require('../../../api/adminStatistics.js');
    try {
      const res = await getActiveBoardStats();
      if (res.code === 200 && res.data && res.data.length > 0) {
        const rawApiData = res.data;

    // 1. 前端计算综合活跃度并降序排序
    const sortedData = rawApiData.map(item => ({
      ...item,
      score: item.act * 10 + item.red
    })).sort((a, b) => b.score - a.score);

    // 2. 提取第一名
    const topPerformer = sortedData[0];
    const gridDistricts = sortedData.slice(1);

    // 3. 动态分配尺寸
    if (gridDistricts.length > 0) {
      gridDistricts.forEach((item, index) => {
        // --- 强制设位：前4个(TOP2-5)为大模块，后方为小模块 ---
        if (index < 4) {
          // 一行2个 (span-3)，高度更高 (row-4)
          item.gridClass = 'span-3 row-3'; // 或者 row-4，取决于 80rpx 的具体感觉
          item.cardType = 'lg';
          item.rank = index + 2; 
        } else {
          // 一行3个 (span-2)，高度更低 (row-2)
          item.gridClass = 'span-2 row-2';
          item.cardType = 'sm';
        }
      });
    }

      this.setData({
        topPerformer: topPerformer,
        districts: gridDistricts
      });
      }
    } catch (error) {
      console.error("获取活跃看板数据失败", error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  handleBack() {
    wx.navigateBack();
  }
});