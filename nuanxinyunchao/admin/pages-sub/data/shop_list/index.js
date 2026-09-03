const { getSiteShops } = require('../../../api/adminStatistics');

Page({
  data: {
    statusBarHeight: 20,
    safeAreaTop: 44,
    scrollTop: 0,
    navBarHeight: 44,
    searchQuery: '',
    activeTab: '全部',
    tabs: ['全部'], // 动态生成
    newMerchants: [], // 本月新增
    allMerchants: [], // 其他商户
    filteredNew: [],
    filteredAll: []
  },

  onLoad() {
    this.initSystemInfo();
    this.fetchData();
  },

  async fetchData() {
    try {
      const res = await getSiteShops({ keyword: this.data.searchQuery });
      if (res.code === 200 && res.data) {
        const rawList = res.data || [];
        
        // 动态提取分类 tab
        const typeSet = new Set(['全部']);
        const newM = [];
        const otherM = [];
        
        rawList.forEach(item => {
          if (item.type && item.type !== '其他') {
            typeSet.add(item.type);
          }
          if (item.isNew) {
            newM.push(item);
          } else {
            otherM.push(item);
          }
        });

        this.setData({
          tabs: Array.from(typeSet),
          newMerchants: newM,
          allMerchants: otherM
        }, () => {
          this.filterList();
        });
      }
    } catch(err) {
      console.error('Failed to fetch shops:', err);
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

  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value });
  },

  onSearchConfirm(e) {
    this.fetchData();
  },

  onScroll(e) {
    this.setData({ scrollTop: e.detail.scrollTop });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab }, () => {
      this.filterList();
    });
  },

  filterList() {
    // 搜索已经由后端处理，所以这里只做 tab 过滤
    const { activeTab, newMerchants, allMerchants } = this.data;
    
    const filterFn = item => {
      return activeTab === '全部' || item.type === activeTab;
    };

    this.setData({
      filteredNew: newMerchants.filter(filterFn),
      filteredAll: allMerchants.filter(filterFn)
    });
  },

  openLocation(e) {
    const item = e.currentTarget.dataset.item;
    if (item && item.latitude && item.longitude) {
      wx.openLocation({
        latitude: item.latitude,
        longitude: item.longitude,
        name: item.name,
        address: item.address,
        scale: 18
      });
    } else {
      wx.showToast({
        title: '暂无位置信息',
        icon: 'none'
      });
    }
  }
});
