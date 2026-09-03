const { getMerchantReviews } = require('../../api/adminStatistics.js');
const { resolveMediaUrl } = require('../../utils/http.js');

const TAG_COLORS = ['green', 'blue', 'orange'];

const JOB_CODE_MAP = {
  全部类型: null,
  快递员: 1,
  外卖员: 2,
  网约车司机: 3,
  卡车司机: 4,
  货车司机: 4,
  主播: 5
};

const SORT_API_MAP = {
  综合排序: 'latest',
  最新优先: 'latest',
  好评优先: 'score_desc',
  差评优先: 'score_asc'
};

function currentMonthStr() {
  const d = new Date();
  const m = d.getMonth() + 1;
  return `${d.getFullYear()}-${m < 10 ? '0' + m : m}`;
}

function attachTagColors(list) {
  return (list || []).map((item) => {
    const tags = item.tags || [];
    const tagColors = tags.map((_, i) => TAG_COLORS[i % TAG_COLORS.length]);
    return Object.assign({}, item, {
      avatar: resolveMediaUrl(item.avatar),
      tagColors
    });
  });
}

Page({
  data: {
    merchantId: '',
    month: currentMonthStr(),
    statusBarPaddingStyle: '',
    safeAreaTop: 44,
    scrollTop: 0,
    isSearchShow: false,
    searchQuery: '',
    evaluations: [],
    filteredEvaluations: [],
    loading: false,
    detailVisible: false,
    detailItem: null,
    filters: [
      { key: 'sort', label: '综合排序', options: ['综合排序', '最新优先', '好评优先', '差评优先'] },
      { key: 'time', label: '时间', options: ['全部时间', '今日', '本周', '本月'] },
      { key: 'category', label: '用户类型', options: ['全部类型', '快递员', '外卖员', '网约车司机', '货车司机', '主播'] }
    ],
    activeFilterKey: '',
    currentFilterOptions: [],
    activeFilterValues: {
      sort: '综合排序',
      time: '时间',
      category: '用户类型'
    },
    dropdownX: 0,
    dropdownY: 0
  },

  onLoad(options) {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    const merchantId = options.id != null ? String(options.id) : '';
    const month = options.month && String(options.month).trim()
      ? decodeURIComponent(String(options.month).trim())
      : currentMonthStr();

    this.setData({
      statusBarPaddingStyle: `padding-top: ${statusBarHeight}px;`,
      safeAreaTop: statusBarHeight,
      merchantId,
      month
    });

    if (!merchantId) {
      wx.showToast({ title: '缺少阵地ID', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    this.fetchReviews();
  },

  buildQueryParams() {
    const category = this.data.activeFilterValues.category;
    const sortLabel = this.data.activeFilterValues.sort;
    const jobCode = JOB_CODE_MAP[category];
    const sort = SORT_API_MAP[sortLabel] || 'latest';
    const params = {
      id: this.data.merchantId,
      month: this.data.month,
      sort
    };
    const kw = (this.data.searchQuery || '').trim();
    if (kw) {
      params.keyword = kw;
    }
    if (jobCode != null) {
      params.jobCode = jobCode;
    }
    return params;
  },

  fetchReviews() {
    if (this.data.loading) {
      return;
    }
    this.setData({ loading: true });
    getMerchantReviews(this.buildQueryParams())
      .then((res) => {
        const items = attachTagColors((res && res.items) || []);
        this.setData({
          evaluations: items,
          filteredEvaluations: items,
          loading: false
        });
      })
      .catch(() => {
        this.setData({
          evaluations: [],
          filteredEvaluations: [],
          loading: false
        });
      });
  },

  handleBack() {
    wx.navigateBack();
  },

  onScroll(e) {
    this.setData({ scrollTop: e.detail.scrollTop });
  },

  handleSearch() {
    this.setData({ isSearchShow: !this.data.isSearchShow });
  },

  handleSearchInput(e) {
    this.setData({ searchQuery: e.detail.value });
  },

  handleSearchConfirm() {
    this.fetchReviews();
  },

  handleClearSearch() {
    this.setData({ searchQuery: '' });
    this.fetchReviews();
  },

  toggleFilter(e) {
    const key = e.currentTarget.dataset.key;
    if (this.data.activeFilterKey === key) {
      this.setData({ activeFilterKey: '' });
      return;
    }

    const currentFilter = this.data.filters.find((item) => item.key === key);
    const query = wx.createSelectorQuery();
    query.select(`.filter-tab-${key}`).boundingClientRect((rect) => {
      if (rect) {
        this.setData({
          activeFilterKey: key,
          currentFilterOptions: currentFilter ? currentFilter.options : [],
          dropdownX: rect.left,
          dropdownY: rect.bottom + 12
        });
      }
    }).exec();
  },

  selectOption(e) {
    const { key, value } = e.currentTarget.dataset;
    const values = Object.assign({}, this.data.activeFilterValues);
    values[key] = value;

    this.setData({
      activeFilterValues: values,
      activeFilterKey: ''
    });

    if (key === 'time') {
      return;
    }
    this.fetchReviews();
  },

  openDetail(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.filteredEvaluations[index];
    if (!item) {
      return;
    }
    this.setData({
      detailVisible: true,
      detailItem: item
    });
  },

  closeDetail() {
    this.setData({ detailVisible: false, detailItem: null });
  }
});
