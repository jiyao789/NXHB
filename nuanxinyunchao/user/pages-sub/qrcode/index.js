/*
 * @Author: cwkl123 1297224582@qq.com
 * @Date: 2026-05-26 10:08:06
 * @LastEditors: cwkl123 1297224582@qq.com
 * @LastEditTime: 2026-06-01 14:54:20
 * @FilePath: \nuanxinyunchao-user\miniprogram\pages-sub\qrcode\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
'use strict'
const qrcode_1 = require('../../api/qrcode')
const drawQrcode = require('../../utils/weapp.qrcode.js')
function buildWarmQrPayload(token, fid) {
  return JSON.stringify({ type: 'warmQr', token, fid })
}
Page({
  data: {
    safeAreaTop: 20,
    loading: true,
    loadFailed: false,
    userInfo: {
      name: '',
      fid: '',
      avatar: '',
    },
    qrCanvasPx: 200,
  },
  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const px = Math.max(160, Math.round((384 / 750) * (sysInfo.windowWidth || 375)))
    this.setData({
      safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : 20,
      qrCanvasPx: px,
    })
  },
  onShow() {
    this.loadQrPage()
  },
  loadQrPage() {
    this.setData({ loading: true, loadFailed: false })
    wx.showLoading({ title: '加载中...' })
    ;(0, qrcode_1.getUserWarmQrCodeApi)()
      .then((data) => {
        const name = (data === null || data === void 0 ? void 0 : data.username) || ''
        const fid = (data === null || data === void 0 ? void 0 : data.fid) || ''
        const avatar = (data === null || data === void 0 ? void 0 : data.avatarUrl) || ''
        const token = (data === null || data === void 0 ? void 0 : data.token) || ''
        this.setData({
          loading: false,
          loadFailed: false,
          userInfo: { name, fid, avatar },
        })
        wx.hideLoading()
        const runDraw = () => {
          if (!token || !fid) {
            wx.showToast({ title: '二维码数据不完整', icon: 'none' })
            return
          }
          const text = buildWarmQrPayload(token, fid)
          console.log(text)
          const w = this.data.qrCanvasPx
          drawQrcode({
            width: w,
            height: w,
            canvasId: 'warmQrCanvas',
            text,
            _this: this,
            callback: function () {},
          })
        }
        wx.nextTick(runDraw)
        setTimeout(runDraw, 50)
      })
      .catch((e) => {
        console.error(e)
        wx.hideLoading()
        this.setData({ loading: false, loadFailed: true })
        wx.showToast({ title: '加载失败', icon: 'none' })
      })
  },
  handleRetry() {
    this.loadQrPage()
  },
  handleBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.reLaunch({ url: '/nuanxinyunchao/user/pages/index/index' })
    }
  },
})
