import { getMessageFavoritesPage } from '../../../api/message';

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    role: 'street', // 'street' or 'merchant'
    tabs: ['图文', '视频'],
    activeTab: 0,

    // 从接口获取的数据
    streetCollections: {
      activity: [],
      article: [],
      video: []
    },

    collectionList: []
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
      this.loadDataForTab('article', 0);
    } else if (role === 'merchant') {
      this.loadMerchantData();
    }
  },

  async loadDataForTab(type, tabIndex) {
    try {
      const res = await getMessageFavoritesPage({
        type: type,
        current: 1,
        size: 15
      });
      if (res && res.data && res.data.records) {
        const key = `streetCollections.${type}`;
        this.setData({
          [key]: res.data.records
        });
      }
    } catch (e) {
      console.error('loadDataForTab error', e);
    }
  },

  async loadMerchantData() {
    try {
      const res = await getMessageFavoritesPage({
        type: 'coupon',
        current: 1,
        size: 50
      });
      if (res && res.data && res.data.records) {
        this.setData({
          collectionList: res.data.records
        });
      }
    } catch (e) {
      console.error('loadMerchantData error', e);
    }
  },

  handleTabChange(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeTab: index });
    
    // 懒加载：点击时如果没数据才请求
    if (this.data.role === 'street') {
      if (index === 0 && this.data.streetCollections.article.length === 0) {
        this.loadDataForTab('article', 0);
      } else if (index === 1 && this.data.streetCollections.video.length === 0) {
        this.loadDataForTab('video', 1);
      }
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  handleExchange(e) {
    const id = e.currentTarget.dataset.id;
    console.log('触发兑换', id);
  }
});
