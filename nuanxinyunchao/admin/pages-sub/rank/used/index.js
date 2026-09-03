const { getMerchantVerifyUsers } = require('../../../api/adminStatistics.js');
const { resolveMediaUrl } = require('../../../utils/http.js');

const TAB_JOB_CODE = {
  全部: null,
  外卖员: 1,
  快递员: 2,
  网约车司机: 3,
  货车司机: 4,
  主播: 5
};

const DEFAULT_CHART_COLORS = ['#D35400', '#E67E22', '#F39C12', '#FFB347', '#FFDAB9'];

function currentMonthStr() {
  const d = new Date();
  const m = d.getMonth() + 1;
  return `${d.getFullYear()}-${m < 10 ? '0' + m : m}`;
}

function parseMonthNumber(month) {
  if (!month || typeof month !== 'string') {
    return new Date().getMonth() + 1;
  }
  const parts = month.split('-');
  const n = parseInt(parts[1], 10);
  return Number.isFinite(n) ? n : new Date().getMonth() + 1;
}

Page({
  data: {
    merchantId: '',
    month: currentMonthStr(),
    statusBarHeight: 20,
    safeAreaTop: 44,
    scrollTop: 0,
    navBarHeight: 44,
    currentTab: '全部',
    tabs: ['全部', '快递员', '外卖员', '网约车司机', '货车司机', '主播'],
    chartTotal: 0,
    chartData: [],
    conicGradientStyle: '',
    groupedList: [],
    loading: false,
    currentMonth: new Date().getMonth() + 1
  },

  onLoad(options) {
    this.initSystemInfo();
    const merchantId = options.id != null ? String(options.id) : '';
    const month = options.month && String(options.month).trim()
      ? decodeURIComponent(String(options.month).trim())
      : currentMonthStr();

    this.setData({
      merchantId,
      month,
      currentMonth: parseMonthNumber(month)
    });

    if (!merchantId) {
      wx.showToast({ title: '缺少阵地ID', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    this.fetchVerifyUsers();
  },

  initSystemInfo() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight,
      safeAreaTop: sysInfo.statusBarHeight
    });
  },

  fetchVerifyUsers() {
    if (this.data.loading) {
      return;
    }
    const { merchantId, month, currentTab } = this.data;
    const jobCode = TAB_JOB_CODE[currentTab];
    const params = { id: merchantId, month };
    if (jobCode != null) {
      params.jobCode = jobCode;
    }

    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });

    getMerchantVerifyUsers(params)
      .then((res) => {
        const payload = res.data || {};
        const totalUsers = payload.totalUsers != null ? Number(payload.totalUsers) : 0;
        const jobStats = Array.isArray(payload.jobStats) ? payload.jobStats : [];
        const records = Array.isArray(payload.records) ? payload.records : [];

        const chartInput = jobStats.map((item, idx) => ({
          label: item.name != null ? String(item.name) : '其他',
          count: item.count != null ? Number(item.count) : 0,
          color: item.color || DEFAULT_CHART_COLORS[idx % DEFAULT_CHART_COLORS.length]
        }));

        this.processChartData(chartInput, totalUsers);

        const rawListData = records.map((item, idx) => ({
          id: item.id != null ? String(item.id) : String(idx + 1),
          name: item.name != null ? String(item.name) : '',
          role: item.role != null ? String(item.role) : '其他',
          date: item.date != null ? String(item.date) : '',
          time: item.time != null ? String(item.time) : '',
          service: item.service != null ? String(item.service) : '',
          avatar: resolveMediaUrl(item.avatar != null ? String(item.avatar) : '')
        }));

        this.groupListByDate(rawListData);
      })
      .catch((err) => {
        console.error('fetchVerifyUsers failed', err);
        this.setData({
          chartTotal: 0,
          chartData: [],
          conicGradientStyle: '',
          groupedList: []
        });
      })
      .finally(() => {
        wx.hideLoading();
        this.setData({ loading: false });
      });
  },

  processChartData(data, totalUsers) {
    const chartRows = Array.isArray(data) ? data.filter((item) => item.count > 0) : [];
    const sumCounts = chartRows.reduce((sum, item) => sum + item.count, 0);
    const total = totalUsers > 0 ? totalUsers : sumCounts;

    if (!chartRows.length || total <= 0) {
      this.setData({
        chartTotal: 0,
        chartData: [],
        conicGradientStyle: 'background: #eee;'
      });
      return;
    }

    let accPct = 0;
    const gradientStops = [];
    const processedChart = chartRows.map((item) => {
      const pct = item.count / total;
      const pctDisplay = (pct * 100).toFixed(0);
      const start = accPct;
      accPct += pct * 100;
      gradientStops.push(`${item.color} ${start}% ${accPct}%`);
      return { ...item, pctText: pctDisplay + '%' };
    });

    this.setData({
      chartTotal: total,
      chartData: processedChart,
      conicGradientStyle: `background: conic-gradient(${gradientStops.join(', ')});`
    });
  },

  groupListByDate(list) {
    const groupMap = {};
    list.forEach((item) => {
      const dateKey = item.date || '未知日期';
      if (!groupMap[dateKey]) {
        groupMap[dateKey] = [];
      }
      groupMap[dateKey].push(item);
    });

    const groupedList = Object.keys(groupMap)
      .map((date) => ({ date, items: groupMap[date] }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    this.setData({ groupedList });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (this.data.currentTab === tab) {
      return;
    }
    this.setData({ currentTab: tab });
    this.fetchVerifyUsers();
  },

  handleBack() {
    wx.navigateBack({ fail: () => wx.reLaunch({ url: '/nuanxinyunchao/admin/pages/rank/index' }) });
  },

  onScroll(e) {
    this.setData({ scrollTop: e.detail.scrollTop });
  }
});
