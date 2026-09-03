const { httpGet, httpPost } = require('../../utils/http');

Page({
  data: {
    list: [],
    loading: false,
    hasMore: true,
    page: 1,
    size: 20
  },
  onLoad() {
    this.fetchData(true);
  },
  onShow() {
    if (this.data.isRefresh) {
      this.setData({ isRefresh: false });
      this.fetchData(true);
    }
  },
  async fetchData(reset = false) {
    if (this.data.loading || (!this.data.hasMore && !reset)) return;
    this.setData({ loading: true });
    
    const page = reset ? 1 : this.data.page;
    try {
      const res = await httpGet('/api/webapp/biz/mapPoint/page', {
        current: page,
        size: this.data.size
      });
      
      const records = (res.data && res.data.records) ? res.data.records : (res.records || []);
      const newList = reset ? records : [...this.data.list, ...records];
      
      this.setData({
        list: newList,
        page: page + 1,
        hasMore: records.length >= this.data.size
      });
    } catch (e) {
      console.error(e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
  onPullDownRefresh() {
    this.fetchData(true).then(() => wx.stopPullDownRefresh());
  },
  onReachBottom() {
    this.fetchData();
  },
  handleAdd() {
    wx.navigateTo({ url: '/nuanxinyunchao/service/pages-sub/map-point/form' });
  },
  handleEdit(e) {
    const item = e.currentTarget.dataset.item;
    wx.setStorageSync('mapPointEdit', item);
    wx.navigateTo({ url: `/nuanxinyunchao/service/pages-sub/map-point/form?id=${item.id}` });
  },
  handleDelete(e) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
      title: '提示',
      content: `确定要删除点位 ${item.name} 吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          try {
            await httpPost('/api/webapp/biz/mapPoint/delete', [{ id: item.id }]);
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.fetchData(true);
          } catch (e) {
            console.error(e);
            wx.showToast({ title: '删除失败', icon: 'none' });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  }
});
