/** 与 utils/http.js 中 biz-app 直连端口一致（小程序后台需配置合法域名） */
const BIZ_APP_ORIGIN = 'http://localhost:9102'

Page({
  data: {
    scrollTop: 0,
    isLoading: false,
    role: 'street', // 'street' or 'merchant'
    allRankingData: [],
    monthlyPlan: { total: 0, completed: 0 },
    activityData: [],
    serviceData: [],
    discountData: [],
    planPercent: 0,
    topThree: [],
    listData: [],
  },

  onShow() {
    const { checkLogin } = require('../../utils/auth.js')
    if (!checkLogin('pages/index/index')) return

    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().syncSelectedFromRoute();
    }

    // Refresh role from globalData
    const app = getApp()
    this.setData({
      role: (app.globalData.userInfo && app.globalData.userInfo.role) || 'street',
    })

    this.loadHomeData()
  },

  onPageScroll(e) {
    this.setData({
      scrollTop: e.scrollTop,
    })
  },
  handleSearchClick() {
    wx.showToast({ title: '去搜索', icon: 'none' })
  },

  resolveMediaUrl(path) {
    if (!path || typeof path !== 'string') {
      return 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/server/index/rank_data.png'
    }
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    if (path.startsWith('/')) return BIZ_APP_ORIGIN + path
    return path
  },

  normalizeRanking(item) {
    const subTitle = item.subTitle != null ? String(item.subTitle) : ''
    let subjectType =
      item.subjectType != null && String(item.subjectType).trim()
        ? String(item.subjectType).trim().toUpperCase()
        : ''
    /** 兜底：尚未升级的后端或未返回字段时尽量不拦详情（可能与 NODE 撞车） */
    if (!subjectType) {
      subjectType = subTitle.trim() ? 'PARTY' : 'MERCHANT'
    }
    return {
      id: item.id,
      subjectType,
      rank: item.rank,
      name: item.name != null ? String(item.name) : '',
      subTitle,
      score: item.score != null ? Number(item.score) : 0,
      trend: item.trend != null ? Number(item.trend) : 0,
      isLiked: false,
      image: this.resolveMediaUrl(item.image),
    }
  },

  mapGaugeRows(rows, color, dashedFirst) {
    const arr = Array.isArray(rows) ? rows : []
    return arr.map((item, i) => ({
      label: item.label || '',
      value: item.value != null ? Number(item.value) : 0,
      max: item.max != null ? Number(item.max) : 2000,
      icon: item.icon || 'i-carbon-view',
      svgUrl: this.getGaugeSvgUrl(
        item.value != null ? Number(item.value) : 0,
        item.max != null ? Number(item.max) : 2000,
        color,
        dashedFirst && i === 0,
      ),
    }))
  },

  loadHomeData() {
    const { getServerHomeData } = require('../../api/serverHome.js')
    this.setData({ isLoading: true })
    wx.showLoading({ title: '加载中...' })

    getServerHomeData()
      .then((res) => {
        const payload =
          res &&
          res.data &&
          (res.data.rankings != null || res.data.plan != null || res.data.activity != null)
            ? res.data
            : res && res.rankings != null
              ? res
              : {}
        const rankingsRaw = payload.rankings || []
        const rankings = rankingsRaw.map((r) => this.normalizeRanking(r))
        const plan = payload.plan || { total: 0, completed: 0 }
        const total = plan.total != null ? Number(plan.total) : 0
        const completed = plan.completed != null ? Number(plan.completed) : 0

        const activity = this.mapGaugeRows(payload.activity, '#ffc40b', true)
        const service = this.mapGaugeRows(payload.service, '#bde84b', true)
        const couponRows = payload.coupon || []
        const discount = this.mapGaugeRows(couponRows, '#fad86c', false).map((row, i) => ({
          ...row,
          svgUrl: this.getGaugeSvgUrl(row.value, row.max, i === 0 ? '#fad86c' : '#f5c357', false),
        }))

        const topThree =
          rankings.length >= 3
            ? [rankings[0], rankings[1], rankings[2]]
            : rankings.length === 2
              ? [rankings[0], rankings[1], null]
              : rankings.length === 1
                ? [rankings[0], null, null]
                : []

        this.setData({
          allRankingData: rankings,
          topThree,
          listData: rankings.slice(3),
          monthlyPlan: { total, completed },
          planPercent: total === 0 ? 0 : Math.min((completed / total) * 100, 100),
          activityData: activity,
          serviceData: service,
          discountData: discount,
        })
      })
      .catch(() => {
        this.setData({
          allRankingData: [],
          topThree: [],
          listData: [],
          monthlyPlan: { total: 0, completed: 0 },
          planPercent: 0,
          activityData: [],
          serviceData: [],
          discountData: [],
        })
      })
      .finally(() => {
        wx.hideLoading()
        this.setData({ isLoading: false })
      })
  },

  getGaugeSvgUrl(value, max, color, dashed) {
    const r = 38
    const c = 2 * Math.PI * r
    const totalArc = c * 0.75
    let p = max === 0 ? 0 : value / max
    p = Math.min(Math.max(p, 0), 1)
    const offset = totalArc * (1 - p)

    let svgContent = dashed
      ? `<defs><mask id="m_track"><circle cx="50" cy="50" r="${r}" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-dasharray="${totalArc} ${c}" /></mask><mask id="m_prog"><circle cx="50" cy="50" r="${r}" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-dasharray="${totalArc} ${c}" stroke-dashoffset="${offset}" /></mask></defs><circle cx="50" cy="50" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="8" stroke-dasharray="2 4" mask="url(#m_track)" /><circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-dasharray="2 4" mask="url(#m_prog)" />`
      : `<circle cx="50" cy="50" r="${r}" fill="none" stroke="#f3f4f6" stroke-width="8" stroke-linecap="round" stroke-dasharray="${totalArc} ${c}" /><circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${totalArc} ${c}" stroke-dashoffset="${offset}" />`

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">${svgContent}</svg>`
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
  },

  toTopDetail(e) {
    const ds = e.currentTarget.dataset || {}
    const id = ds.id
    const subjectType =
      ds.subjectType != null ? ds.subjectType : ds.subjecttype != null ? ds.subjecttype : 'MERCHANT'
    if (id === undefined || id === null || id === '') {
      wx.showToast({ title: '无法打开详情', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/nuanxinyunchao/service/pages-sub/index/detail?id=${id}&subjectType=${encodeURIComponent(subjectType)}`,
    })
  },

  toMonthPlan() {
    wx.navigateTo({ url: `/nuanxinyunchao/service/pages-sub/index/month` })
  },

  toData(e) {
    const type = e.currentTarget.dataset.type
    wx.navigateTo({ url: `/nuanxinyunchao/service/pages-sub/index/data?type=${type}` })
  },
})
