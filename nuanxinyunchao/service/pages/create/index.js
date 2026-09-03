const app = getApp();
const { getCouponPage } = require('../../api/coupon.js');
const { getClientUserPage } = require('../../api/user.js');

const BAR_COLORS = ['#f37341', '#f3d06b', '#bbe648'];
const PIE_COLORS = ['#f97316', '#facc15', '#a3e635', '#22d3ee', '#6366f1'];

Page({
  data: {
    scrollTop: 0,
    safeAreaTop: 20,
    showPublishPopup: false,
    isLoading: true,
    isMerchant: false,
    auditUnreadCount: 0,

    barChart: { title: '', data: [] },
    processedBarData: [], // 存储 JS 计算好的样式

    lineChart: { title: '每日服务使用高峰时段', categories: [], series: [] },
    yAxisTicks: [],
    chartPoints: [], // 存储 JS 计算好的坐标
    chartSvgUrl: '',
    selectedIndex: null,

    pieChart: { title: '用户占比', series: [] },
    pieChartSvgUrl: '',
    pieLabels: [],
    gridLines: [1, 2, 3, 4, 5, 6],
    lineChartCategories: [],

    publishTypes: [
      { type: 10, name: '官方通知' },
      { type: 0, name: '学习' },
      { type: 2, name: '我们需要你' },
      { type: 4, name: '活动/服务' },
      { type: 6, name: '我们的荣耀时刻', isFull: true }
    ],
    merchantPublishTypes: [
      { type: 8, name: '优惠劵' }
    ],
    currentPublishList: [],
    currentPopupBg: ''
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : 20
    });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelectedFromRoute();
    }

    const userInfo = wx.getStorageSync('service_userInfo');
    const role = (userInfo && userInfo.role) ? userInfo.role : 'street';
    const isMerchant = role === 'merchant';

    const currentPublishList = isMerchant ? [
      { type: 8, name: '优惠劵' }
    ] : [
      { type: 10, name: '官方通知' },
      { type: 0, name: '学习' },
      { type: 2, name: '我们需要你' },
      { type: 4, name: '活动' },
      { type: 6, name: '我们的荣耀时刻', isLong: true }
    ];

    this.setData({
      isMerchant: isMerchant,
      currentPublishList: currentPublishList,
      currentPopupBg: isMerchant
        ? 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/create/publish_pop_bg2.png'
        : 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/create/publish_pop_bg.png'
    }, () => {
      this.fetchData();
      this.fetchAuditPendingCount();
    });
  },

  getPageTotal(res) {
    if (res && res.data && res.data.total != null) {
      return Number(res.data.total) || 0;
    }
    return 0;
  },

  countPendingApplications(records) {
    return (records || []).filter((item) => {
      if (item.userStatus === 'ENABLE') return false;
      let ext = {};
      try {
        ext = JSON.parse(item.extJson || '{}');
      } catch (e) { /* ignore */ }
      return !ext.auditReply;
    }).length;
  },

  async fetchAuditPendingCount() {
    const userInfo = wx.getStorageSync('service_userInfo') || {};
    const isMerchant = this.data.isMerchant;

    try {
      const couponParams = { current: 1, size: 1, auditStatus: 0 };
      if (isMerchant && userInfo.userId) {
        couponParams.merchantId = userInfo.userId;
      }

      const couponRes = await getCouponPage(couponParams);
      let count = this.getPageTotal(couponRes);

      if (!isMerchant) {
        const appParams = {
          current: 1,
          size: 100,
          userStatus: 'DISABLED'
        };
        if (userInfo.orgId) {
          appParams.orgId = userInfo.orgId;
        }
        const appRes = await getClientUserPage(appParams);
        const records = (appRes && appRes.data && appRes.data.records) || [];
        count += this.countPendingApplications(records);
      }

      this.setData({ auditUnreadCount: count });
    } catch (err) {
      console.error('获取待审核数量失败', err);
      this.setData({ auditUnreadCount: 0 });
    }
  },

  onPageScroll(e) {
    this.setData({ scrollTop: e.scrollTop });
  },

  fetchData() {
    const { getServerCreateData } = require('../../api/serverHome.js');
    const isMerchant = this.data.isMerchant;
    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...' });

    getServerCreateData()
      .then((res) => {
        const payload =
          res && res.data && (res.data.data != null || res.data.series != null || res.data.use != null)
            ? res.data
            : res && (res.data != null || res.series != null)
              ? res
              : {};
        const barData = (payload.data || []).map((item, idx) => ({
          label: item.label,
          value: item.value != null ? Number(item.value) : 0,
          trend: item.trend != null ? Number(item.trend) : 0,
          color: BAR_COLORS[idx % BAR_COLORS.length]
        }));
        const pieData = (payload.use || []).map((item, idx) => ({
          name: item.name,
          percent: item.percent != null ? Number(item.percent) : 0,
          color: PIE_COLORS[idx % PIE_COLORS.length]
        }));

        this.setData({
          'barChart.title': isMerchant ? '本月核销的优惠劵数量' : '本月活动与服务核销统计',
          'barChart.data': barData,
          'lineChart.title': isMerchant ? '每日优惠核销高峰时段' : '每日服务使用高峰时段',
          'lineChart.categories': ['8-10', '10-12', '12-14', '14-16', '16-18', '18-20'],
          'lineChart.series': (payload.series || [0, 0, 0, 0, 0, 0]).map((v) => Number(v) || 0),
          'pieChart.series': pieData,
          isLoading: false
        }, () => {
          this.processCharts();
        });
      })
      .catch(() => {
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({
          'barChart.title': isMerchant ? '本月核销的优惠劵数量' : '本月活动与服务核销统计',
          'barChart.data': [],
          'lineChart.categories': ['8-10', '10-12', '12-14', '14-16', '16-18', '18-20'],
          'lineChart.series': [0, 0, 0, 0, 0, 0],
          'pieChart.series': [],
          isLoading: false
        }, () => {
          this.processCharts();
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  processCharts() {
    // 1. 处理柱状图
    const barValues = this.data.barChart.data.map(i => i.value);
    const maxBarVal = Math.max(...barValues) || 100;
    const processedBarData = this.data.barChart.data.map(item => {
      const heightPercent = (item.value / maxBarVal) * 100 * 0.6;
      return {
        ...item,
        heightPercent,
        topStyle: `bottom: ${heightPercent}%;`,
        barStyle: `height: ${heightPercent}%; background-image: linear-gradient(to bottom, rgba(0,0,0,0.15), transparent); background-color: ${item.color};`,
        trendIcon: item.trend > 0 ? '↑' : (item.trend < 0 ? '↓' : ''),
        trendClass: item.trend > 0 ? 'up' : 'down',
        absTrend: Math.abs(item.trend)
      };
    });

    // 2. 处理曲线图（小数值时勿用 +100 抬高纵轴，否则折线贴底看不见）
    const series = (this.data.lineChart.series || []).map((v) => Number(v) || 0);
    const maxVal = Math.max(...series, 0);
    const limit = maxVal <= 0 ? 10 : Math.max(5, Math.ceil(maxVal * 1.25));
    const yAxisTicks = Array.from({ length: 6 }, (_, i) => {
      const v = Math.round(limit - (i * (limit / 5)));
      return v < 0 ? 0 : v;
    });

    const chartPoints = series.map((val, index) => {
      const xPercent = (index / (series.length - 1)) * 100;
      const yPercent = (val / limit) * 100;
      return {
        value: val,
        x: (index / (series.length - 1)) * 300,
        y: 100 - yPercent,
        yPercent: yPercent,
        xPercent: xPercent,
        xLabelLeft: xPercent,
        bubbleStyle: `bottom: ${yPercent}%; left: ${xPercent}%;`
      };
    });

    let dPath = `M ${chartPoints[0].x},${chartPoints[0].y}`;
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const curr = chartPoints[i], next = chartPoints[i + 1];
      const cp1x = curr.x + (next.x - curr.x) * 0.2;
      const cp2x = next.x - (next.x - curr.x) * 0.2;
      dPath += ` C ${cp1x},${curr.y} ${cp2x},${next.y} ${next.x},${next.y}`;
    }
    const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg viewBox="0 0 300 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f37341" stop-opacity="0.6"/><stop offset="100%" stop-color="#f37341" stop-opacity="0.1"/></linearGradient></defs><path d="${dPath} V 100 H 0 Z" fill="url(#g)"/><path d="${dPath}" fill="none" stroke="#5e4a3e" stroke-width="2"/></svg>`)}`;

    // ==========================================================
    // 3. 处理饼图：改为 radius=100, strokeWidth=30
    // ==========================================================
    const radius = 100;
    const strokeWidth = 30;
    const lineStartR = radius + (strokeWidth / 2) + 2; // 117
    const lineEndR = 145; // 折线弯折点
    const minLabelSpacing = 42;
    const extension = 120; // 延长折线使其有足够长度穿透并分离文字
    const textOffset = 15; // 文本相较于折点的偏移量（使线条不仅延伸到文字，且位于文字百分比和名称之间）
    const circumference = 2 * Math.PI * radius;
    const gapRadian = 0.04;
    const gapArcLength = gapRadian * radius;

    let accumulatedAngle = 0;
    const processedPie = this.data.pieChart.series.map(item => {
      const rawArcLength = (item.percent / 100) * circumference;
      const dashArray = Math.max(0, rawArcLength - gapArcLength);
      const offset = -1 * (accumulatedAngle / 100) * circumference;

      const midPercent = accumulatedAngle + item.percent / 2;
      const midRad = (midPercent / 100) * 2 * Math.PI;
      accumulatedAngle += item.percent;

      const trueRad = midRad - (Math.PI / 2);

      return {
        ...item,
        dashArray,
        dashOffset: offset,
        trueRad,
        x: Math.cos(trueRad) * lineEndR,
        y: Math.sin(trueRad) * lineEndR,
        startX: Math.cos(trueRad) * lineStartR,
        startY: Math.sin(trueRad) * lineStartR,
        isRight: Math.cos(trueRad) >= 0
      };
    });

    const rightItems = processedPie.filter(i => i.isRight).sort((a, b) => a.y - b.y);
    const leftItems = processedPie.filter(i => !i.isRight).sort((a, b) => a.y - b.y);

    const adjustPositions = (items) => {
      for (let i = 1; i < items.length; i++) {
        const prev = items[i - 1];
        const curr = items[i];
        if (curr.y - prev.y < minLabelSpacing) {
          curr.y = prev.y + minLabelSpacing;
        }
      }
    };
    adjustPositions(rightItems);
    adjustPositions(leftItems);

    const adjustedPieData = [...rightItems, ...leftItems].sort((a, b) => b.percent - a.percent);

    const viewSize = 540;
    const center = viewSize / 2;

    const circles = adjustedPieData.map(item =>
      `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${item.color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-dasharray="${item.dashArray} 1000" stroke-dashoffset="${item.dashOffset}" />`
    ).join('');

    const lines = adjustedPieData.map(item => {
      const x1 = center + item.startX, y1 = center + item.startY;
      const x2 = center + item.x, y2 = center + item.y;
      const x3 = x2 + (item.isRight ? extension : -extension), y3 = y2;
      return `<polyline points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="none" stroke="${item.color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" />`;
    }).join('');

    const dots = adjustedPieData.map(item =>
      `<circle cx="${center + item.startX}" cy="${center + item.startY}" r="2" fill="white" />`
    ).join('');

    const pieSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${viewSize}" height="${viewSize}" viewBox="0 0 ${viewSize} ${viewSize}"><g transform="rotate(-90 ${center} ${center})">${circles}</g><g>${lines}${dots}</g></svg>`;

    const pieLabels = adjustedPieData.map(item => {
      const leftPercent = 50 + ((item.x + (item.isRight ? textOffset : -textOffset)) / center) * 50;
      const topPercent = 50 + (item.y / center) * 50;
      return {
        name: item.name,
        percent: item.percent,
        color: item.color,
        isRight: item.isRight,
        labelStyle: `left: ${leftPercent}%; top: ${topPercent}%; transform: translate(${item.isRight ? '0' : '-100%'}, -58%);`
      };
    });

    const categoriesCount = this.data.lineChart.categories.length;
    const lineChartCategories = this.data.lineChart.categories.map((cat, index) => {
      const leftPercent = categoriesCount > 1 ? (index / (categoriesCount - 1)) * 100 : 50;
      return {
        name: cat,
        labelStyle: `left: ${leftPercent}%;`
      };
    });

    this.setData({
      processedBarData,
      yAxisTicks,
      chartPoints,
      chartSvgUrl: svgUrl,
      lineChartCategories,
      pieChartSvgUrl: `data:image/svg+xml;utf8,${encodeURIComponent(pieSvg)}`,
      pieLabels: pieLabels
    });
  },

  handleChartClick(e) { this.setData({ selectedIndex: e.currentTarget.dataset.index }); },
  togglePublishPopup() { this.setData({ showPublishPopup: !this.data.showPublishPopup }); },
  handleAudit() { wx.navigateTo({ url: '/nuanxinyunchao/service/pages-sub/create/audit-list' }); },
  handlePublish(e) {
    this.setData({ showPublishPopup: false });
    wx.navigateTo({ url: `/nuanxinyunchao/service/pages-sub/create/publish?type=${e.currentTarget.dataset.type}` });
  },
  handleBack() { wx.navigateBack(); },
  preventBubble() { }
});