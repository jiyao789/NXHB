Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    searchKey: '',
    isMerchant: false,
    filteredGroups: [],
    hasMore: false,
    loading: false,
    loadingMore: false
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    const role = wx.getStorageSync('service_userInfo')?.role || 'street';

    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      isMerchant: role === 'merchant'
    });

    this.loadData(true);
  },

  handleBack() {
    wx.navigateBack();
  },

  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value });
    this.loadData(true);
  },

  clearSearch() {
    this.setData({ searchKey: '' });
    this.loadData(true);
  },

  onScrollToLower() {
    if (!this.data.hasMore || this.data.loadingMore || this.data.loading) {
      return;
    }
    const groups = this.data.filteredGroups;
    if (!groups.length) {
      return;
    }
    const lastDate = groups[groups.length - 1].dateRaw;
    this.loadData(false, lastDate);
  },

  loadData(reset, beforeDate) {
    const { getServerVerificationList } = require('../../api/serverHome.js');
    if (reset) {
      this.setData({ loading: true, filteredGroups: [] });
      wx.showLoading({ title: '加载中...' });
    } else {
      this.setData({ loadingMore: true });
    }

    const params = { day: 5 };
    const keyword = (this.data.searchKey || '').trim();
    if (keyword) {
      params.keyword = keyword;
    }
    if (beforeDate) {
      params.beforeDate = beforeDate;
    }

    getServerVerificationList(params)
      .then((res) => {
        const payload =
          res && res.data && (res.data.list != null || res.data.hasMore != null)
            ? res.data
            : res && (res.list != null || res.hasMore != null)
              ? res
              : {};
        const mapped = this.mapGroups(payload.list || []);
        const merged = reset ? mapped : [...this.data.filteredGroups, ...mapped];

        this.setData({
          filteredGroups: merged,
          hasMore: !!payload.hasMore
        });
      })
      .catch(() => {
        wx.showToast({ title: '加载失败', icon: 'none' });
        if (reset) {
          this.setData({ filteredGroups: [], hasMore: false });
        }
      })
      .finally(() => {
        this.setData({ loading: false, loadingMore: false });
        wx.hideLoading();
      });
  },

  mapGroups(list) {
    const today = this.formatDateKey(new Date());
    const yesterday = this.formatDateKey(this.addDays(new Date(), -1));

    return list.map((group) => {
      const dateRaw = group.date;
      let title = `${dateRaw}核销总数`;
      if (dateRaw === today) {
        title = '今日核销总数';
      } else if (dateRaw === yesterday) {
        title = '昨日核销总数';
      }

      const listItems = (group.items || []).map((item) => ({
        id: item.id,
        title: item.title,
        time: item.time,
        count: item.count != null ? item.count : 1,
        user: item.user || ''
      }));

      return {
        title,
        date: dateRaw ? dateRaw.replace(/-/g, '.') : '',
        dateRaw,
        totalCount: group.totalCount != null ? group.totalCount : listItems.length,
        list: listItems
      };
    });
  },

  formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }
});
