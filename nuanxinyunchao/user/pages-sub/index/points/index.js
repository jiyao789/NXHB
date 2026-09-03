'use strict'
const points_api_1 = require('../../../api/points')
const image_url_1 = require('../../../utils/imageUrl')
const biz_id_1 = require('../../../utils/bizId')
const taskReward_1 = require('../../../utils/taskReward')
const DEFAULT_FEED_COVER =
  'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/good_deed.png'
const DEFAULT_AVATAR =
  'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/avatar.png'
Page({
  data: {
    safeAreaTop: 0,
    currentTab: 0,
    currentFilterIndex: 0,
    showRulesModal: false,
    userPointsInfo: null,
    earnList: [],
    leftColumnList: [],
    rightColumnList: [],
    usePointsFilters: [],
    usePointsCoupons: [],
    taskInfo: {
      active: false,
      type: '',
      countdown: 30,
      isCompleted: false,
    },
  },
  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      safeAreaTop: sysInfo.statusBarHeight || 20,
      showRulesModal: true,
    })
    this.initData()
  },
  /** 从阅读加分详情返回等场景需要刷新卡片数字 */
  onShow() {
    this.refreshPointsDisplayQuiet()
    const activeTask = wx.getStorageSync('activeTask')
    if (activeTask && activeTask.active && activeTask.type === 'browse_points') {
      this.setData({
        'taskInfo.active': true,
        'taskInfo.type': activeTask.type,
        'taskInfo.countdown': activeTask.countdown != null ? activeTask.countdown : 30,
        'taskInfo.isCompleted': activeTask.isCompleted || false,
      })
      if (!this.data.taskInfo.isCompleted && !this._taskTimer) {
        this.startTaskTimer()
      }
    } else {
      this.setData({ 'taskInfo.active': false })
      this.stopTaskTimer()
    }
  },
  onHide() {
    this.persistActiveTask()
    this.stopTaskTimer()
  },
  onUnload() {
    this.persistActiveTask()
    this.stopTaskTimer()
  },
  persistActiveTask() {
    if (this.data.taskInfo.active) {
      ;(0, taskReward_1.snapshotActiveTaskFromPage)(
        this.data.taskInfo,
        this.data.taskInfo.countdown,
      )
    }
  },
  startTaskTimer() {
    this.stopTaskTimer()
    this._taskTimer = setInterval(() => {
      if (this.data.taskInfo.countdown > 0) {
        const next = this.data.taskInfo.countdown - 1
        this.setData({ 'taskInfo.countdown': next })
        ;(0, taskReward_1.persistActiveTask)({ countdown: next })
      } else {
        this.stopTaskTimer()
        this.setData({ 'taskInfo.isCompleted': true })
        ;(0, taskReward_1.markTaskCompletedAndClaim)()
      }
    }, 1000)
  },
  stopTaskTimer() {
    if (this._taskTimer) {
      clearInterval(this._taskTimer)
      this._taskTimer = null
    }
  },
  handleBackToTasks() {
    wx.removeStorageSync('activeTask')
    this.setData({ 'taskInfo.active': false })
    this.stopTaskTimer()
    const pages = getCurrentPages()
    let delta = -1
    for (let i = pages.length - 1; i >= 0; i--) {
      if (pages[i].route && pages[i].route.includes('checkin/index') && i !== pages.length - 1) {
        delta = pages.length - 1 - i
        break
      }
    }
    if (delta > 0) {
      wx.navigateBack({ delta })
    } else {
      wx.navigateTo({ url: '/nuanxinyunchao/user/pages-sub/index/checkin/index' })
    }
  },
  handleBack() {
    wx.navigateBack()
  },
  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    this.setData({ currentTab: index })
  },
  async switchFilter(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10)
    const filters = this.data.usePointsFilters || []
    const filter = filters[index]
    if (!filter || index === this.data.currentFilterIndex) {
      return
    }
    this.setData({ currentFilterIndex: index })
    wx.showLoading({ title: '加载中...' })
    try {
      const params = this.buildCouponQuery(filter)
      const payload = await (0, points_api_1.getCouponClientListApi)(params)
      const coupons = this.normalizeCouponList(payload && payload.coupons ? payload.coupons : [])
      this.setData({ usePointsCoupons: coupons })
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },
  buildCouponQuery(filterObj) {
    const q = {}
    if (!filterObj) {
      return q
    }
    if (filterObj.minPoints !== undefined && filterObj.minPoints !== null) {
      q.minPoints = filterObj.minPoints
    }
    if (filterObj.maxPoints !== undefined && filterObj.maxPoints !== null) {
      q.maxPoints = filterObj.maxPoints
    }
    return q
  },
  /**
   * 后端 tag 为数组 [{text, icon?}]；兼容历史单项对象
   */
  normalizeEarnFeed(rows) {
    return (rows || []).map((row) => {
      let tag = row.tag
      if (tag && !Array.isArray(tag)) {
        tag = [tag]
      }
      tag = (tag || []).map((t) => {
        const o = Object.assign({}, t)
        if (o.icon) {
          o.icon = (0, image_url_1.normalizeImageUrl)(o.icon)
        }
        return o
      })
      let imgUrl = (0, image_url_1.normalizeImageUrl)(row.imgUrl)
      if (!imgUrl) {
        imgUrl = DEFAULT_FEED_COVER
      }
      let avatar = (0, image_url_1.normalizeImageUrl)(row.avatar)
      if (!avatar) {
        avatar = DEFAULT_AVATAR
      }
      const safeId = (0, biz_id_1.normalizeBizEntityId)(row.id)
      return Object.assign({}, row, {
        tag,
        imgUrl,
        avatar,
        ...(safeId ? { id: safeId } : {}),
      })
    })
  },
  /** 「用积分」列表：服务端下发 couponFaceMain/Sub；旧接口兜底标题 */
  normalizeCouponList(list) {
    return (list || []).map((c) => {
      const rawMain = c.couponFaceMain != null ? String(c.couponFaceMain).trim() : ''
      const couponFaceMain = rawMain || (c.title != null ? String(c.title).trim() : '') || '优惠券'
      const rawSub = c.couponFaceSub != null ? String(c.couponFaceSub).trim() : ''
      const couponFaceSub = rawSub
      const imgUrl = (0, image_url_1.normalizeImageUrl)(c.imgUrl)
      return Object.assign({}, c, {
        couponFaceMain,
        couponFaceSub,
        ...(imgUrl ? { imgUrl } : {}),
      })
    })
  },
  splitEarnColumns(rows) {
    const earnData = rows || []
    return {
      earnList: earnData,
      leftColumnList: earnData.filter((_, i) => i % 2 === 0),
      rightColumnList: earnData.filter((_, i) => i % 2 !== 0),
    }
  },
  showRules() {
    this.setData({ showRulesModal: true })
  },
  hideRules() {
    this.setData({ showRulesModal: false })
  },
  preventTouch() {},
  /** 仅刷新顶部积分卡片（签到、阅读加分返回后不重头加载瀑布流） */
  async refreshPointsDisplayQuiet() {
    try {
      const pointsData = await (0, points_api_1.getPointsDisplayApi)()
      if (pointsData) {
        const ymd = pointsData.expireDateYmd != null ? String(pointsData.expireDateYmd) : ''
        const expireDisplay = ymd ? ymd.replace(/-/g, '.') : ''
        this.setData({
          userPointsInfo: Object.assign({}, pointsData, { expireDisplay }),
        })
      }
    } catch (e) {
      console.warn('refreshPointsDisplayQuiet', e)
    }
  },
  async initData() {
    wx.showLoading({ title: '加载中...' })
    try {
      await this.refreshPointsDisplayQuiet()
      const [earnRaw, useData] = await Promise.all([
        (0, points_api_1.getPointsEarnFeedApi)({ limit: 50 }),
        (0, points_api_1.getCouponClientListApi)({}),
      ])
      const earnData = this.normalizeEarnFeed(earnRaw)
      const cols = this.splitEarnColumns(earnData)
      const filters = useData && useData.filters ? useData.filters : []
      const coupons = this.normalizeCouponList(useData && useData.coupons ? useData.coupons : [])
      this.setData(
        Object.assign(
          {
            usePointsFilters: filters,
            usePointsCoupons: coupons,
            currentFilterIndex: 0,
          },
          cols,
        ),
      )
    } catch (e) {
      console.error(e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },
  handleDetail(e) {
    const item = e.currentTarget.dataset.item
    if (!item || item.id == null || item.id === '') {
      wx.showToast({ title: '内容加载异常', icon: 'none' })
      return
    }
    const id = (0, biz_id_1.normalizeBizEntityId)(item.id)
    if (!id) {
      wx.showToast({ title: '内容加载异常', icon: 'none' })
      return
    }
    console.log(item)
    const detailType = item.contentDetailType != null ? item.contentDetailType : 0
    const isVideo = item.isVideo === true || item.type === 1 ? 1 : 0
    wx.navigateTo({
      url: `/nuanxinyunchao/user/pages-sub/index/points/detail?id=${encodeURIComponent(id)}&type=${detailType}&isVideo=${isVideo}`,
    })
  },
  handleUse(e) {
    const item = e.currentTarget.dataset.item
    wx.navigateTo({
      url: `/nuanxinyunchao/user/pages-sub/mine/coupon/detail?id=${item.id}`,
    })
  },
})
