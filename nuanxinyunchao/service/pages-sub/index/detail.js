/** 与 pages/index/index.js、utils/http.js 业务端基准一致（直连 9102） */
const BIZ_APP_ORIGIN = 'http://localhost:9102';

const COS_BASE = 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com';

const DEFAULT_TOP_BG_MERCHANT = '/nuanxinyunchao/service/static/merchant_top_bg.png';
const DEFAULT_TOP_BG_PARTY = `${COS_BASE}/server/index/top_bg1.png`;

const FALLBACK_BANNERS = [
  { id: 1, imgUrl: `${COS_BASE}/server/index/index_detail_banner.png` },
  { id: 2, imgUrl: `${COS_BASE}/server/index/rank_data.png` }
];

Page({
  data: {
    safeAreaTop: 0,
    subjectType: 'MERCHANT',
    rankId: '',
    bannerList: FALLBACK_BANNERS,
    bannerTags: [],
    detailInfo: {
      name: '',
      openTime: '',
      phone: '',
      address: '',
      icon: '',
      topBg: DEFAULT_TOP_BG_PARTY
    },
    monthStats: []
  },

  onLoad(options) {
    const systemInfo = wx.getSystemInfoSync();
    const safeTop = systemInfo.safeArea ? systemInfo.safeArea.top : systemInfo.statusBarHeight;
    const subjectType = ((options.subjectType || 'MERCHANT') + '').trim().toUpperCase();
    const id = options.id;

    this.setData({
      safeAreaTop: safeTop || 0,
      subjectType,
      rankId: id != null ? String(id) : '',
      detailInfo: {
        ...this.data.detailInfo,
        topBg: subjectType === 'MERCHANT' ? DEFAULT_TOP_BG_MERCHANT : DEFAULT_TOP_BG_PARTY
      }
    });

    if (id === undefined || id === null || id === '') {
      wx.showToast({ title: '缺少排行主体', icon: 'none' });
      setTimeout(() => wx.navigateBack({ delta: 1 }), 1500);
      return;
    }

    this.loadRankDetail(id, subjectType);
  },

  handleBack() {
    wx.navigateBack({ delta: 1 });
  },

  resolveDetailMediaUrl(path) {
    if (!path || typeof path !== 'string') {
      return '';
    }
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/')) return BIZ_APP_ORIGIN + path;
    return path;
  },

  buildMonthGaugeRows(stats, subjectType) {
    const list = Array.isArray(stats) ? stats : [];
    return list.map((s, idx) => {
      const label = s.label != null ? String(s.label) : '';
      const title =
        label.length >= 4
          ? [label.slice(0, 2), label.slice(2)]
          : [label, label.length >= 2 ? label.slice(2) : ''];
      const head = title[0];
      const value = Number(s.value);
      const max = Number(s.max);
      const safeVal = Number.isFinite(value) ? value : 0;
      const safeMax = Number.isFinite(max) && max > 0 ? max : 2000;
      const isWarm = head === '活动' || head === '优惠';
      const color = isWarm ? '#ffc40b' : '#bde84b';
      const row = {
        title,
        value: safeVal,
        max: safeMax,
        color,
        iconClass: head === '服务' ? 'icon-view' : 'icon-user-filled',
        svgUrl: this.getGaugeSvgUrl(safeVal, safeMax, color, false)
      };
      if (subjectType === 'MERCHANT' && idx === 1) {
        row.subInfo = [
          { color: 'yellow', label: '核销' },
          { color: 'gray', label: '兑换' }
        ];
      }
      return row;
    });
  },

  loadRankDetail(id, subjectType) {
    const { getServerRankDetail } = require('../../api/serverHome.js');
    wx.showLoading({ title: '加载中', mask: true });
    getServerRankDetail({
      id,
      subjectType
    })
      .then((res) => {
        const payload = res.data || {};
        const r = payload.resolve || {};
        const st = payload.subjectType
          ? String(payload.subjectType).trim().toUpperCase()
          : subjectType;

        const isMerchant = st === 'MERCHANT';
        const detailInfo = {
          name: r.name != null ? String(r.name) : '',
          openTime: r.openTime != null ? String(r.openTime).trim() : '',
          phone: r.phone != null ? String(r.phone) : '',
          address: r.address != null ? String(r.address) : '',
          icon: this.resolveDetailMediaUrl(r.icon),
          topBg: isMerchant ? DEFAULT_TOP_BG_MERCHANT : DEFAULT_TOP_BG_PARTY
        };

        const rawBanners = Array.isArray(payload.bannerList) ? payload.bannerList : [];
        let bannerList =
          rawBanners.length > 0
            ? rawBanners.map((b, i) => ({
              id: b.id != null ? Number(b.id) : i + 1,
              imgUrl: this.resolveDetailMediaUrl(b.imgUrl != null ? String(b.imgUrl) : '')
            }))
            : [...FALLBACK_BANNERS];
        bannerList = bannerList.filter((b) => b.imgUrl && String(b.imgUrl).trim());
        if (!bannerList.length) {
          bannerList = [...FALLBACK_BANNERS];
        }

        const bannerTagsRaw = payload.bannerTags;
        const bannerTags = Array.isArray(bannerTagsRaw)
          ? bannerTagsRaw.map((t) => (t != null ? String(t) : '')).filter((t) => t.trim())
          : [];

        const monthStats = this.buildMonthGaugeRows(payload.monthStats, st);

        this.setData({
          subjectType: st,
          bannerList,
          bannerTags,
          detailInfo,
          monthStats
        });
      })
      .catch(() => {
        wx.showToast({
          title: '详情加载失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  getGaugeSvgUrl(value, max, color, dashed) {
    const r = 38;
    const c = 2 * Math.PI * r;
    const totalArc = c * 0.75;

    let p = max === 0 ? 0 : value / max;
    p = Math.max(0, Math.min(p, 1)); // 限制在 0-1 之间

    const offset = totalArc * (1 - p);
    let svgContent = '';

    if (dashed) {
      svgContent = `
        <defs>
          <mask id="m_track"><circle cx="50" cy="50" r="${r}" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-dasharray="${totalArc} ${c}" /></mask>
          <mask id="m_prog"><circle cx="50" cy="50" r="${r}" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-dasharray="${totalArc} ${c}" stroke-dashoffset="${offset}" /></mask>
        </defs>
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="8" stroke-dasharray="2 4" mask="url(#m_track)" />
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-dasharray="2 4" mask="url(#m_prog)" />
      `;
    } else {
      svgContent = `
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="#f3f4f6" stroke-width="8" stroke-linecap="round" stroke-dasharray="${totalArc} ${c}" />
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${totalArc} ${c}" stroke-dashoffset="${offset}" />
      `;
    }

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">${svgContent}</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  }
});
