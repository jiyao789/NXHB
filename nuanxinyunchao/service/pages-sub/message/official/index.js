import { getNotificationPage } from '../../../api/notification';

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    notificationList: [],
    isLoading: false,
    current: 1,
    size: 10,
    current: 1,
    size: 10,
    hasMore: true,
    refresherTriggered: false
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20
    });
    this.fetchNotifications(true);
  },

  /**
   * 下拉刷新触发
   */
  async onRefresh() {
    if (this.data.isLoading) return;
    this.setData({
      refresherTriggered: true
    });
    await this.fetchNotifications(true);
    this.setData({
      refresherTriggered: false
    });
  },

  /**
   * 获取通知列表
   */
  async fetchNotifications(isRefresh = false) {
    if (this.data.isLoading || (!isRefresh && !this.data.hasMore)) return;
    
    this.setData({ isLoading: true });
    if (isRefresh) {
      wx.showLoading({ title: '加载中...' });
      this.setData({ current: 1, hasMore: true });
    }

    try {
      const res = await getNotificationPage({
        current: this.data.current,
        size: this.data.size,
        status: 1
      });

      if (res && res.data && res.data.records) {
        const records = res.data.records;
        const list = records.map(record => {
          let image = '';
          try {
            if (record.extJson) {
              const ext = JSON.parse(record.extJson);
              image = ext.images ? ext.images[0] : (ext.image || '');
            }
          } catch (e) {
            console.error('解析 extJson 失败', e);
          }

          return {
            id: record.id,
            title: record.title,
            content: record.summary || record.content.replace(/<[^>]+>/g, '').substring(0, 50) + '...',
            date: this.formatDate(record.createTime || record.publishedAt),
            rawTime: record.createTime || record.publishedAt,
            image: image
          };
        });

        const newList = isRefresh ? list : [...this.data.notificationList, ...list];
        // 保持时间倒序排列 (最新的在前)
        newList.sort((a, b) => {
          const tA = String(a.rawTime || '').replace(/-/g, '/').replace('T', ' ').split('.')[0];
          const tB = String(b.rawTime || '').replace(/-/g, '/').replace('T', ' ').split('.')[0];
          const timeA = new Date(tA).getTime();
          const timeB = new Date(tB).getTime();
          return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
        });

        this.setData({
          notificationList: newList,
          current: this.data.current + 1,
          hasMore: list.length === this.data.size
        });
      }
    } catch (err) {
      console.error('获取通知列表失败', err);
    } finally {
      this.setData({ isLoading: false });
      if (isRefresh) wx.hideLoading();
    }
  },

  onReachBottom() {
    this.fetchNotifications(false);
  },

  /**
   * 格式化日期
   */
  formatDate(dateStr) {
    if (!dateStr) return '刚刚';
    const dateStrStr = String(dateStr);
    let s = dateStrStr.replace(/-/g, '/').replace('T', ' ').split('.')[0];
    let date = new Date(s);

    if (isNaN(date.getTime())) {
      return dateStrStr.length >= 10 ? dateStrStr.substring(5, 10).replace('-', '-') : dateStrStr;
    }
    
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${m}-${d}`;
  },

  handleBack() {
    wx.navigateBack();
  },

  handleToDetail(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.notificationList.find(i => i.id === id);
    if (!item) return;

    // 跳转到通用详情页
    wx.navigateTo({
      url: `/nuanxinyunchao/service/pages-sub/message/detail?id=${item.id}&isOfficial=true`
    });
  }
});


