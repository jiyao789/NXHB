const { getClientUserDetail } = require('../../../api/adminStatistics.js');

Page({
  data: {
    statusBarHeight: 20,
    safeAreaTop: 44,
    scrollTop: 0,
    navBarHeight: 44,
    
    // 接口获取的用户数据
    userInfo: {
      name: '-',
      phone: '-',
      points: 0,
      avatar: '',
      tags: []
    },

    // 参与活动记录
    activities: [],

    // 志愿活动记录
    volunteerTasks: [],

    // 优惠券兑换记录
    coupons: []
  },

  onLoad(options) {
    this.initSystemInfo();

    // 接收从 rank/index.js 跳转传来的参数
    const userId = options.id;
    if (options.name) {
      this.setData({
        'userInfo.name': decodeURIComponent(options.name),
        'userInfo.avatar': decodeURIComponent(options.avatar),
        'userInfo.id': userId,
        'userInfo.points': options.score || 0 
      });
    }

    if (userId) {
      this.fetchUserDetail(userId);
    }
  },

  async fetchUserDetail(userId) {
    try {
      const res = await getClientUserDetail(userId);
      if (res && res.data) {
        const detail = res.data;
        // 因为上个页面可能传了name和avatar，为了防止后端返回空头像覆盖，做一下判断
        const finalAvatar = detail.userInfo?.avatar || this.data.userInfo.avatar;
        const finalName = detail.userInfo?.name || this.data.userInfo.name;
        
        this.setData({
          userInfo: {
            ...detail.userInfo,
            name: finalName,
            avatar: finalAvatar
          },
          activities: detail.activities || [],
          volunteerTasks: detail.volunteerTasks || [],
          coupons: detail.coupons || []
        });
      }
    } catch (e) {
      console.error('获取用户详情失败', e);
      wx.showToast({
        title: '获取信息失败',
        icon: 'none'
      });
    }
  },

  initSystemInfo() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight,
      safeAreaTop: sysInfo.statusBarHeight
    });
  },

  handleBack() {
    wx.navigateBack();
  },

  handleViewAll(e) {
    const type = e.currentTarget.dataset.type;
    const urlMap = {
      'activities': '/nuanxinyunchao/admin/pages-sub/rank/user_detail/activities/index',
      'tasks': '/nuanxinyunchao/admin/pages-sub/rank/user_detail/tasks/index',
      'coupons': '/nuanxinyunchao/admin/pages-sub/rank/user_detail/coupons/index'
    };
    
    if (urlMap[type]) {
      wx.navigateTo({
        url: urlMap[type]
      });
    }
  },

  onScroll(e) {
    this.setData({ scrollTop: e.detail.scrollTop });
  }
});