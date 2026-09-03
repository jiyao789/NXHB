const { getArticlePageApi } = require("../../../api/article");

Page({
  data: {
    statusBarHeight: 20,
    topList: [],
    normalList: [],
    
    // 分页状态
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false,
    refresherTriggered: false
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight
    });
    this.loadData(true);
  },

  // 获取数据 (isRefresh: 是否重置列表)
  async loadData(isRefresh = false) {
    if (this.data.isLoading) return;
    
    const page = isRefresh ? 1 : this.data.page;
    
    this.setData({ isLoading: true });
    try {
      const res = await getArticlePageApi({
        current: page,
        size: this.data.pageSize,
        type: 6, // 我们的荣耀时刻
        status: 1 // 已发布
      });

      const records = res.records || [];
      const newItems = records.map(item => {
        // 如果没有摘要，从内容中提取纯文本作为副标题
        let subtitle = item.summary;
        if (!subtitle && item.content) {
          // 简易正则剥离 HTML 标签
          const plainText = item.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
          subtitle = plainText.length > 60 ? plainText.substring(0, 60) + '...' : plainText;
        }
        
        return {
          id: item.id,
          image: item.coverImage,
          title: item.title,
          desc: subtitle,
          subtitle: subtitle,
          date: item.createTime ? item.createTime.split(' ')[0].split('T')[0] : '',
          createUser: item.createUser
        };
      });

      let { topList, normalList } = this.data;
      if (isRefresh) {
        topList = [];
        normalList = [];
      }

      // 处理数据：分离置顶项（仅取最新的一条管理端发布文章）
      newItems.forEach(item => {
        if (String(item.createUser) === '1' && topList.length === 0) {
          topList.push(item);
        } else {
          normalList.push(item);
        }
      });

      this.setData({
        topList,
        normalList,
        page: page + 1,
        hasMore: records.length >= this.data.pageSize, // 使用比较符更稳健
        isLoading: false,
        refresherTriggered: false
      });
      
      if (isRefresh) {
        wx.stopPullDownRefresh();
      }
    } catch (err) {
      console.error('加载荣耀时刻失败:', err);
      this.setData({ 
        isLoading: false, 
        refresherTriggered: false 
      });
      if (isRefresh) wx.stopPullDownRefresh();
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData(true);
  },

  // 触底加载 (对应页面触底 or scroll-view 触底)
  onReachBottom() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.loadData();
    }
  },

  // 对应 scroll-view 的下拉刷新实现
  onRefresherRefresh() {
    this.setData({ refresherTriggered: true });
    this.loadData(true);
  },

  // 跳转至详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({
        url: `./detail?id=${id}`
      });
    }
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.reLaunch({ url: '/nuanxinyunchao/user/pages/index/index' });
      }
    });
  }
});
