'use strict'
const couponApi = require('../../../api/coupon')
const normalizeImageUrl = require('../../../utils/normalizeImageUrl').normalizeImageUrl
const drawQrcode = require('../../../utils/weapp.qrcode.js')
Page({
  data: {
    safeAreaInsetsTop: 20,
    isLoading: true,
    loadError: '',
    couponId: '',
    qrCanvasPx: 200,
    detail: null,
  },
  _qrDrawScheduled: false,
  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    const px = Math.max(160, Math.round((384 / 750) * (sysInfo.windowWidth || 375)))
    this.setData({
      safeAreaInsetsTop: sysInfo.statusBarHeight || 20,
      qrCanvasPx: px,
      couponId: options && options.id ? String(options.id).trim() : '',
    })
    if (this.data.couponId) {
      void this.fetchCouponUseDetail(this.data.couponId)
    } else {
      this.setData({ isLoading: false, loadError: '缺少券信息' })
    }
  },
  onReady() {
    this.scheduleDrawQr()
  },
  handleBack() {
    wx.navigateBack()
  },
  scheduleDrawQr() {
    if (this._qrDrawScheduled) return
    const d = this.data.detail
    console.log(d, '二维码内容')
    if (!d || !d.qrPayload || !d.showQr) return
    this._qrDrawScheduled = true
    const w = this.data.qrCanvasPx
    const run = () => {
      drawQrcode({
        width: w,
        height: w,
        canvasId: 'couponUseQrCanvas',
        text: d.qrPayload,
        _this: this,
        callback() {},
      })
    }
    wx.nextTick(run)
    setTimeout(run, 80)
  },
  handleMakePhoneCall() {
    if (!this.data.detail || !this.data.detail.phone) return
    wx.makePhoneCall({ phoneNumber: this.data.detail.phone })
  },
  handleOpenMap() {
    const d = this.data.detail
    if (!d || d.latitude == null || d.longitude == null) return
    wx.openLocation({
      latitude: Number(d.latitude),
      longitude: Number(d.longitude),
      name: d.storeName || '',
      address: d.address || '',
    })
  },
  handleToStoreDetail() {
    const d = this.data.detail
    if (!d || d.merchantId == null) return
    const mid = d.merchantId
    const name = encodeURIComponent(d.storeName || '')
    const avatar = encodeURIComponent(d.avatar || '')
    const lat = d.latitude != null ? d.latitude : ''
    const lng = d.longitude != null ? d.longitude : ''
    wx.navigateTo({
      url: `/nuanxinyunchao/user/pages-sub/hot/detail?id=${mid}&name=${name}&avatar=${avatar}&lat=${lat}&lng=${lng}`,
    })
  },
  async fetchCouponUseDetail(id) {
    this._qrDrawScheduled = false
    this.setData({ isLoading: true, loadError: '' })
    try {
      const raw = await couponApi.getCouponWalletUseDetailApi({ id: id })
      const logo = normalizeImageUrl(raw && raw.avatar ? raw.avatar : '')
      const detail = Object.assign({}, raw, {
        avatar: logo || raw.avatar || '',
        points: raw.pointsSpent != null ? raw.pointsSpent : 0,
      })
      this.setData({ detail: detail, isLoading: false })
      this.scheduleDrawQr()
    } catch (_e) {
      this.setData({
        isLoading: false,
        loadError: '加载失败，请稍后重试',
        detail: null,
      })
    }
  },
})
