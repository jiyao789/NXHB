Page({
  data: {
    statusBarHeight: 20,
    safeAreaTop: 44,
    scrollTop: 0,
    navBarHeight: 44,
    
    // 统计数据
    stats: {
      title: '街道统计',
      count: 0
    },

    // 分类 Tab 
    tabs: ['全部', '外卖骑手', '快递员', '网约车司机', '货车司机', '网络主播'],
    currentTab: '全部',

    // 人员数据
    personnelList: [],
    filteredList: []
  },

  onLoad(options) {
    this.initSystemInfo();

    // 接收参数
    if (options.name) {
      this.setData({
        'stats.title': decodeURIComponent(options.name) + '统计'
      });
    }

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

    // 模拟接口返回的完整名单数据
    const mockData = [
      { id: 1, name: '张建国', avatar: 'https://picsum.photos/100?random=100', isPartyMember: true, role: '外卖骑手', phone: '138****5678' },
      { id: 2, name: '李晓明', avatar: 'https://picsum.photos/100?random=101', isPartyMember: false, role: '快递员', phone: '135****2341' },
      { id: 3, name: '王志伟', avatar: 'https://picsum.photos/100?random=102', isPartyMember: false, role: '网约车司机', phone: '139****8890' },
      { id: 4, name: '陈美琳', avatar: 'https://picsum.photos/100?random=103', isPartyMember: true, role: '网络主播', phone: '186****0056' },
      { id: 5, name: '赵强', avatar: 'https://picsum.photos/100?random=104', isPartyMember: false, role: '货车司机', phone: '131****4432' },
      { id: 6, name: '刘伟', avatar: 'https://picsum.photos/100?random=105', isPartyMember: false, role: '外卖骑手', phone: '137****6677' }
    ];

    setTimeout(() => {
      this.setData({
        'stats.count': 136,
        personnelList: mockData,
        filteredList: mockData
      });
      wx.hideLoading();
    }, 400);
  },

  // 切换 Tab 过滤列表
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (this.data.currentTab === tab) return;
    
    this.setData({ currentTab: tab });
    
    if (tab === '全部') {
      this.setData({ filteredList: this.data.personnelList });
    } else {
      const filtered = this.data.personnelList.filter(item => item.role === tab);
      this.setData({ filteredList: filtered });
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  onScroll(e) {
    this.setData({ scrollTop: e.detail.scrollTop });
  },

  handleSearch() {
    wx.showToast({ title: '搜索人员', icon: 'none' });
  },

  goToDetail(e) {
    const item = e.currentTarget.dataset.item;
    // 跳转到个人详情，复用之前的个人详情页
    wx.navigateTo({
      url: `/nuanxinyunchao/admin/pages-sub/rank/user_detail/index?id=${item.id}&name=${encodeURIComponent(item.name)}&avatar=${encodeURIComponent(item.avatar)}&score=1500`
    });
  }
});
