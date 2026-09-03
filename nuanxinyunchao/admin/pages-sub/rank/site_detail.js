const { getMerchantRankDetail } = require('../../api/adminStatistics.js');
const { resolveMediaUrl } = require('../../utils/http.js');

const COS_BASE = 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com';
const DEFAULT_BADGE = `${COS_BASE}/server/index/rank_icon.png`;
const FALLBACK_BANNERS = [
  { id: 1, imgUrl: `${COS_BASE}/server/index/index_detail_banner.png` },
  { id: 2, imgUrl: `${COS_BASE}/server/index/rank_data.png` }
];

function base64Encode(str) {
  try {
    return wx.arrayBufferToBase64(
      new Uint8Array([...unescape(encodeURIComponent(str))].map((c) => c.charCodeAt(0))).buffer
    );
  } catch (e) {
    console.error('base64Encode error', e);
    return '';
  }
}

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

function splitTagsToRows(tags) {
  const allTags = Array.isArray(tags) ? tags : [];
  return {
    tagsRow1: allTags.filter((_, i) => i % 2 === 0),
    tagsRow2: allTags.filter((_, i) => i % 2 !== 0)
  };
}

Page({
  data: {
    statusBarPaddingStyle: 'padding-top: 20px;',
    merchantId: '',
    month: currentMonthStr(),
    bannerList: FALLBACK_BANNERS,
    tagsRow1: [],
    tagsRow2: [],
    facilityName: '',
    facilityAddress: '',
    facilityPhone: '',
    badgeUrl: DEFAULT_BADGE,
    monthlyPlan: { total: 0, completed: 0 },
    planPercent: 0,
    planPercentStyle: 'width: 0%; min-width: 36px;',
    planStatusCounts: [],
    planOverviewList: [],
    pieChartSvgUrl: '',
    pieLabels: [],
    currentMonth: new Date().getMonth() + 1,
    verifyCount: 0,
    showServiceModal: false,
    detailLoading: false
  },

  onLoad(options) {
    this.initNavbar();
    const id = options.id != null ? String(options.id) : '';
    const month = options.month && String(options.month).trim() ? String(options.month).trim() : currentMonthStr();
    const rank = options.rank ? parseInt(options.rank, 10) : 0;

    this.setData({
      merchantId: id,
      month,
      currentMonth: parseMonthNumber(month),
      rank
    });

    if (!id) {
      wx.showToast({ title: '缺少阵地ID', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    this.loadDetail(id, month);
  },

  initNavbar() {
    const sysInfo = wx.getSystemInfoSync();
    let topPadding = 20;
    try {
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
      if (menuButtonInfo && menuButtonInfo.top > 0) {
        topPadding = menuButtonInfo.top;
      } else {
        topPadding = sysInfo.statusBarHeight || 20;
      }
    } catch (e) {
      topPadding = sysInfo.statusBarHeight || 20;
    }
    this.setData({
      statusBarPaddingStyle: `padding-top: ${topPadding}px;`
    });
  },

  loadDetail(id, month) {
    if (this.data.detailLoading) {
      return;
    }
    this.setData({ detailLoading: true });
    wx.showLoading({ title: '加载中...' });

    getMerchantRankDetail({ id, month })
      .then((res) => {
        const payload = res.data || {};
        this.applyDetailPayload(payload, month);
      })
      .catch((err) => {
        console.error('loadDetail failed', err);
      })
      .finally(() => {
        wx.hideLoading();
        this.setData({ detailLoading: false });
      });
  },

  applyDetailPayload(payload, month) {
    const rawBanners = Array.isArray(payload.bannerList) ? payload.bannerList : [];
    let bannerList = rawBanners
      .map((b, i) => ({
        id: b.id != null ? Number(b.id) : i + 1,
        imgUrl: resolveMediaUrl(b.imgUrl != null ? String(b.imgUrl) : '')
      }))
      .filter((b) => b.imgUrl && b.imgUrl.trim());
    if (!bannerList.length) {
      bannerList = [...FALLBACK_BANNERS];
    }

    const tags = Array.isArray(payload.tags)
      ? payload.tags.map((t) => ({
        name: t.name != null ? String(t.name) : '',
        icon: resolveMediaUrl(t.icon != null ? String(t.icon) : '')
      }))
      : [];
    const { tagsRow1, tagsRow2 } = splitTagsToRows(tags);

    const statusCounts = Array.isArray(payload.planProgress && payload.planProgress.statusCounts)
      ? payload.planProgress.statusCounts
      : [0, 0, 0];
    const ended = Number(statusCounts[0]) || 0;
    const processing = Number(statusCounts[1]) || 0;
    const pending = Number(statusCounts[2]) || 0;
    const total = ended + processing + pending;
    const completed = ended;
    const percent = total === 0 ? 0 : Math.min(Math.round((completed / total) * 100), 100);

    const overviewList = Array.isArray(payload.planProgress && payload.planProgress.overviewList)
      ? payload.planProgress.overviewList
      : [];

    const workerRatio = Array.isArray(payload.workerRatio) ? payload.workerRatio : [];

    let badgeResolved = resolveMediaUrl(payload.badgeUrl != null ? String(payload.badgeUrl) : '');
    // Ignore the broken backend static rank icons
    if (badgeResolved && badgeResolved.indexOf('/nuanxinyunchao/admin/static/images/index/rank_icon_') !== -1) {
      badgeResolved = '';
    }

    if (!badgeResolved) {
      if (this.data.rank >= 1 && this.data.rank <= 3) {
        badgeResolved = `https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/rank_${this.data.rank}.png`;
      } else if (this.data.rank > 3) {
        badgeResolved = '';
      } else {
        badgeResolved = DEFAULT_BADGE;
      }
    }

    this.setData({
      bannerList,
      tagsRow1,
      tagsRow2,
      facilityName: payload.name != null ? String(payload.name) : '',
      facilityAddress: payload.address != null ? String(payload.address) : '',
      facilityPhone: payload.phone != null ? String(payload.phone) : '',
      badgeUrl: badgeResolved,
      monthlyPlan: { total, completed },
      planPercent: percent,
      planPercentStyle: `width: ${percent}%; min-width: 36px;`,
      planStatusCounts: statusCounts,
      planOverviewList: overviewList,
      verifyCount: payload.verifyCount != null ? Number(payload.verifyCount) : 0,
      month: payload.month || month,
      currentMonth: parseMonthNumber(payload.month || month)
    });

    this.updatePieChart(workerRatio);
  },

  handleBack() {
    wx.navigateBack();
  },

  handleToEvaluation() {
    const { merchantId, month } = this.data;
    if (!merchantId) {
      wx.showToast({ title: '缺少阵地ID', icon: 'none' });
      return;
    }
    const m = month ? encodeURIComponent(month) : '';
    wx.navigateTo({
      url: `/nuanxinyunchao/admin/pages-sub/rank/evaluation_list?id=${merchantId}&month=${m}`
    });
  },

  handleToMonth() {
    const { merchantId, month, planStatusCounts, planOverviewList, facilityName } = this.data;
    wx.navigateTo({
      url: `/nuanxinyunchao/admin/pages-sub/rank/month/month?id=${merchantId}&month=${encodeURIComponent(month)}&prefetched=1&name=${encodeURIComponent(facilityName)}`,
      success: (res) => {
        res.eventChannel.emit('planData', {
          statusCounts: planStatusCounts,
          overviewList: planOverviewList
        });
      }
    });
  },

  handleToServiceModal() {
    this.setData({ showServiceModal: true });
  },

  handleCloseServiceModal() {
    this.setData({ showServiceModal: false });
  },

  handleToUsed() {
    const { merchantId, month } = this.data;
    if (!merchantId) {
      wx.showToast({ title: '缺少阵地ID', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/nuanxinyunchao/admin/pages-sub/rank/used/index?id=${merchantId}&month=${encodeURIComponent(month || '')}`
    });
  },

  updatePieChart(rawPieData) {
    const pieData = Array.isArray(rawPieData) && rawPieData.length
      ? rawPieData.map((item) => ({
        name: item.name != null ? String(item.name) : '其他',
        percent: Number(item.percent) || 0,
        color: item.color != null ? String(item.color) : '#f97316'
      }))
      : [];

    if (!pieData.length) {
      this.setData({ pieChartSvgUrl: '', pieLabels: [] });
      return;
    }

    const radius = 60;
    const labelRadius = 100;
    let currentAngle = 0;

    const adjustedPieData = pieData.map((item) => {
      const angle = (item.percent / 100) * 360;
      const startAngle = currentAngle;
      const midAngle = startAngle + angle / 2;
      const circumference = 2 * Math.PI * radius;
      const dashLen = (item.percent / 100) * circumference;
      const gap = 2;
      const dashArray = `${dashLen - gap} ${circumference}`;
      const dashOffset = -1 * (startAngle / 360) * circumference;
      const rad = (midAngle - 90) * (Math.PI / 180);
      const x = Math.cos(rad) * labelRadius;
      const y = Math.sin(rad) * labelRadius;
      const startX = Math.cos(rad) * (radius + 5);
      const startY = Math.sin(rad) * (radius + 5);
      currentAngle += angle;
      return { ...item, dashArray, dashOffset, x, y, startX, startY, isRight: x >= 0 };
    });

    const viewSize = 300;
    const center = viewSize / 2;
    const circles = adjustedPieData
      .map(
        (item) =>
          `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${item.color}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${item.dashArray}" stroke-dashoffset="${item.dashOffset}" />`
      )
      .join('');
    const lines = adjustedPieData
      .map((item) => {
        const x1 = center + item.startX;
        const y1 = center + item.startY;
        const x2 = center + item.x;
        const y2 = center + item.y;
        const lineLength = 35;
        const x3 = item.isRight ? x2 + lineLength : x2 - lineLength;
        return `<polyline points="${x1},${y1} ${x2},${y2} ${x3},${y2}" fill="none" stroke="#999" stroke-width="1" />`;
      })
      .join('');

    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${viewSize}" height="${viewSize}" viewBox="0 0 ${viewSize} ${viewSize}">
        <g transform="rotate(-90 ${center} ${center})">${circles}</g>
        <g>${lines}</g>
      </svg>
    `.trim();

    const pieLabels = adjustedPieData.map((item) => {
      const offsetX = item.isRight ? 5 : -5;
      const translatePercent = item.isRight ? '0%' : '-100%';
      return {
        name: item.name,
        percent: item.percent,
        color: item.color,
        containerStyle: `left: 50%; top: 50%; transform: translate(${item.x + offsetX}px, ${item.y}px) translate(${translatePercent}, -50%);`,
        labelStyle: `color: ${item.color};`,
        isRight: item.isRight
      };
    });

    this.setData({
      pieChartSvgUrl: `data:image/svg+xml;base64,${base64Encode(svgString)}`,
      pieLabels
    });
  }
});
