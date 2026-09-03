const { getServerHomeAnalysis } = require('../../api/serverHome.js');

const OVERVIEW_ICONS = ['icon-users', 'icon-view', 'icon-star', 'icon-thumb'];
const OVERVIEW_GRADIENTS = ['grad-green', 'grad-blue', 'grad-gray', 'grad-orange'];

const LABEL_STYLE_MAP = {
  '兑换数量': { icon: 'icon-users', grad: 'grad-green' },
  '报名人数': { icon: 'icon-users', grad: 'grad-green' },
  '总浏览量': { icon: 'icon-view', grad: 'grad-blue' },
  '新增收藏': { icon: 'icon-star', grad: 'grad-gray' },
  '好评率': { icon: 'icon-thumb', grad: 'grad-orange' }
};

function currentMonthStr() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${m}`;
}

Page({
  data: {
    safeAreaTop: 0,
    tab: 1,
    type: 1,
    titleText: '活动类',
    headerHeight: 0,
    pickerValue: currentMonthStr(),
    displayPeriod: '',
    totalMonthlySales: 0,
    totalYearlySales: 0,
    totalSales: 0,
    selectedBar: null,
    monthlyTrend: [],
    yearlyUserRatio: [],

    overviewCards: [],

    topList: [],
    yearlyTopList: [],

    processedMonthlyData: [],
    pieChartSvgUrl: '',
    pieLabels: []
  },

  onLoad(options) {
    const systemInfo = wx.getSystemInfoSync();
    const safeTop = systemInfo.safeArea ? systemInfo.safeArea.top : systemInfo.statusBarHeight;
    this.setData({ safeAreaTop: safeTop || 0 });

    const type = Number(options.type) || 1;
    let title = '活动类';
    if (type === 2) title = '服务类';
    if (type === 3) title = '优惠类';

    this.setData({ titleText: title, type, pickerValue: currentMonthStr() }, () => {
      this.updateDisplayPeriod();
      this.loadAnalysis(this.data.pickerValue);
    });
  },

  onReady() {
    setTimeout(() => {
      const query = wx.createSelectorQuery();
      query.select('.top-header').boundingClientRect((res) => {
        if (res) {
          this.setData({ headerHeight: res.height });
        }
      }).exec();
    }, 100);
  },

  handleBack() {
    wx.navigateBack({ delta: 1 });
  },

  onTab(e) {
    const val = Number(e.currentTarget.dataset.val);
    if (val === this.data.tab) return;

    this.setData({
      tab: val,
      totalSales: val === 1 ? this.data.totalMonthlySales : this.data.totalYearlySales
    }, () => {
      this.updateDisplayPeriod();
    });
  },

  onPeriodChange(e) {
    let val = e.detail.value;
    if (this.data.tab === 2) {
      val = `${val}-01`;
    }
    this.setData({ pickerValue: val }, () => {
      this.updateDisplayPeriod();
      if (this.data.tab === 1) {
        this.loadAnalysis(val);
      }
    });
  },

  selectBar(e) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({
      selectedBar: this.data.selectedBar === idx ? null : idx
    });
  },

  loadAnalysis(date) {
    const monthDate = date.length === 4 ? `${date}-01` : date;
    wx.showLoading({ title: '加载中...' });

    getServerHomeAnalysis({ type: this.data.type, date: monthDate })
      .then((res) => {
        const payload = res.data || {};
        
        let sourceCards = payload.overviewCards || [];
        if (this.data.type === 3) {
          sourceCards = sourceCards.filter(card => card.label !== '总浏览量' && card.label !== '好评率');
        } else {
          // 活动类(1) 和 服务类(2) 隐藏好评率
          sourceCards = sourceCards.filter(card => card.label !== '好评率');
        }

        const overviewCards = sourceCards.map((card, idx) => {
          const style = LABEL_STYLE_MAP[card.label] || { icon: OVERVIEW_ICONS[idx] || 'icon-users', grad: OVERVIEW_GRADIENTS[idx] || 'grad-green' };
          return {
            title: card.label,
            value: card.value,
            delta: card.delta != null ? card.delta : 0,
            deltaText: ((card.delta != null ? card.delta : 0) * 100).toFixed(1),
            iconClass: style.icon,
            gradientClass: style.grad
          };
        });

        const totalMonthlySales = payload.totalVerifyMonthCount != null ? Number(payload.totalVerifyMonthCount) : 0;
        const totalYearlySales = payload.totalVerifyYearlyCount != null ? Number(payload.totalVerifyYearlyCount) : 0;

        this.setData({
          overviewCards,
          totalMonthlySales,
          totalYearlySales,
          totalSales: this.data.tab === 1 ? totalMonthlySales : totalYearlySales,
          monthlyTrend: payload.monthlyTrend || [],
          yearlyUserRatio: payload.userRatio || [],
          topList: payload.rankingList || [],
          yearlyTopList: payload.yearlyTopList || []
        }, () => {
          this.updateComputedData();
        });
      })
      .catch(() => {
        wx.showToast({ title: '加载失败', icon: 'none' });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  updateDisplayPeriod() {
    const [y, m] = this.data.pickerValue.split('-');
    const text = this.data.tab === 1 ? `${y}年${Number(m)}月` : `${y}年`;
    this.setData({ displayPeriod: text });
  },

  updateComputedData() {
    this.calculateMonthlyBarData();
    this.calculateYearlyPieData();
  },

  calculateMonthlyBarData() {
    const trend = this.data.monthlyTrend || [];
    const month = Number(this.data.pickerValue.split('-')[1]);

    const raw = [];
    for (let i = 5; i >= 0; i--) {
      let m = month - i;
      if (m <= 0) m += 12;
      raw.push({ label: `${m}月`, value: trend[5 - i] != null ? Number(trend[5 - i]) : 0 });
    }

    const max = Math.max(...raw.map(i => i.value), 0);
    const containerHeight = 200;

    const processed = raw.map(item => ({
      ...item,
      baseHeight: max > 0 ? (item.value / max) * containerHeight : 0
    }));

    this.setData({ processedMonthlyData: processed });
  },

  calculateYearlyPieData() {
    const yearlyUserRatio = this.data.yearlyUserRatio || [];
    if (!yearlyUserRatio.length) {
      this.setData({ pieChartSvgUrl: '', pieLabels: [] });
      return;
    }

    const radius = 60;
    const strokeWidth = 24;
    const lineStartR = radius + (strokeWidth / 2) + 5;
    const lineEndR = 110;
    const minLabelSpacing = 35;
    const circumference = 2 * Math.PI * radius;
    const gapRadian = 0.052;
    const gapArcLength = gapRadian * radius;

    let accumulatedAngle = 0;

    const initialData = yearlyUserRatio.map((item) => {
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
        isRight: Math.cos(trueRad) >= 0,
      };
    });

    const rightItems = initialData.filter(i => i.isRight).sort((a, b) => a.y - b.y);
    const leftItems = initialData.filter(i => !i.isRight).sort((a, b) => a.y - b.y);

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

    const viewSize = 300;
    const center = viewSize / 2;

    const circles = adjustedPieData.map(item =>
      `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${item.color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-dasharray="${item.dashArray} 1000" stroke-dashoffset="${item.dashOffset}" />`
    ).join('');

    const lines = adjustedPieData.map(item => {
      const x1 = center + item.startX, y1 = center + item.startY;
      const x2 = center + item.x, y2 = center + item.y;
      const x3 = x2 + (item.isRight ? 40 : -40), y3 = y2;
      return `<polyline points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="none" stroke="${item.color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" />`;
    }).join('');

    const dots = adjustedPieData.map(item =>
      `<circle cx="${center + item.startX}" cy="${center + item.startY}" r="2" fill="white" />`
    ).join('');

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${viewSize}" height="${viewSize}" viewBox="0 0 ${viewSize} ${viewSize}"><g transform="rotate(-90 ${center} ${center})">${circles}</g><g>${lines}${dots}</g></svg>`;
    const pieChartSvgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

    const pieLabels = adjustedPieData.map(item => ({
      name: item.name,
      percent: item.percent,
      color: item.color,
      x: item.x + (item.isRight ? 10 : -10),
      y: item.y,
      isRight: item.isRight,
    }));

    this.setData({ pieChartSvgUrl, pieLabels });
  }
});
