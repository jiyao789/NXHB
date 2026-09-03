import { getMessageLikesPage } from '../../../api/message';

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    totalNavHeight: 64,
    role: 'street', // 'street' or 'merchant'
    tabs: ['活动', '图文', '视频'],
    activeTab: 0,

    // 从接口获取的数据
    streetLikes: {
      activity: [],
      article: [],
      video: []
    },

    merchantLikes: []
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    const app = getApp();
    const statusBarHeight = sysInfo.statusBarHeight || 20;
    const navBarHeight = 44;
    const role = (app.globalData.userInfo && app.globalData.userInfo.role) || 'street';

    this.setData({
      statusBarHeight,
      navBarHeight,
      totalNavHeight: statusBarHeight + navBarHeight,
      role: role
    });

    if (role === 'street') {
      // 初始只加载活动数据，防止三个并发请求导致超时
      this.loadDataForTab('activity', 0);
    }
  },

  async loadDataForTab(type, tabIndex) {
    try {
      const res = await getMessageLikesPage({
        type: type,
        current: 1,
        size: 15 // 缩小 size，防止因 Base64 图片太大导致请求超时
      });
      if (res && res.data && res.data.records) {
        const key = `streetLikes.${type}`;
        this.setData({
          [key]: res.data.records
        });
      }
    } catch (e) {
      console.error('loadDataForTab error', e);
    }
  },

  handleTabChange(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeTab: index });
    
    // 懒加载：点击时如果没数据才请求，防止页面卡死
    if (this.data.role === 'street') {
      if (index === 0 && this.data.streetLikes.activity.length === 0) {
        this.loadDataForTab('activity', 0);
      } else if (index === 1 && this.data.streetLikes.article.length === 0) {
        this.loadDataForTab('article', 1);
      } else if (index === 2 && this.data.streetLikes.video.length === 0) {
        this.loadDataForTab('video', 2);
      }
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  handleSignup(e) {
    const id = e.currentTarget.dataset.id;
    console.log('触发报名', id);
    wx.showToast({ title: '已提交报名', icon: 'success' });
  }
});
