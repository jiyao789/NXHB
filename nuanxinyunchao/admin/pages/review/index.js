import { getPendingAudits, getCompletedAudits, remindReview } from '../../api/adminStatistics.js';

Page({
  data: {
    pendingList: [],
    reviewedList: []
  },

  onLoad() {
    this.fetchData();
  },

  onPullDownRefresh() {
    this.fetchData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async fetchData() {
    try {
      wx.showLoading({ title: '加载中' });
      const [pendingRes, completedRes] = await Promise.all([
        getPendingAudits(),
        getCompletedAudits()
      ]);

      const pendingList = this.mapBackendData(pendingRes.data || [], false);
      const reviewedList = this.mapBackendData(completedRes.data || [], true);

      this.setData({ pendingList, reviewedList });
    } catch (e) {
      console.error(e);
      wx.showToast({ title: '获取数据失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  mapBackendData(backendList, isReviewed) {
    return backendList.map((streetGroup, index) => {
      const shopMap = {};
      (streetGroup.items || []).forEach(item => {
        // item.name is like "商户名称 | 审核内容 | 已逾2天未处理"
        const parts = (item.name || '').split(' | ');
        const shopName = parts[0] || '未知商户';
        const content = parts[1] || '未知内容';
        const status = isReviewed ? '已审核' : (parts[2] || '');
        
        if (!shopMap[shopName]) {
          shopMap[shopName] = { shopName, items: [] };
        }
        shopMap[shopName].items.push({ content, status });
      });

      return {
        id: index + 1,
        name: streetGroup.streetName || '未知街道',
        expanded: false,
        totalCount: streetGroup.count || 0,
        details: Object.values(shopMap)
      };
    });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2 // index for review
      })
    }
  },

  toggleExpand(e) {
    const data = e.currentTarget.dataset;
    const type = data.type; // 'pending' or 'reviewed'
    const index = data.index;

    if (type === 'pending') {
      const list = this.data.pendingList;
      const key = `pendingList[${index}].expanded`;
      this.setData({
        [key]: !list[index].expanded
      });
    } else if (type === 'reviewed') {
      const list = this.data.reviewedList;
      const key = `reviewedList[${index}].expanded`;
      this.setData({
        [key]: !list[index].expanded
      });
    }
  },

  async handleRemind() {
    try {
      wx.showLoading({ title: '发送提醒中' });
      await remindReview();
      wx.showToast({ title: '已发送提醒', icon: 'success' });
    } catch (e) {
      console.error(e);
      // The http interceptor already shows toast for business errors
    } finally {
      wx.hideLoading();
    }
  }
});
