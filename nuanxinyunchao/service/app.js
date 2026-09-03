/*
 * @Author: cwkl123 1297224582@qq.com
 * @Date: 2026-05-28 11:25:44
 * @LastEditors: cwkl123 1297224582@qq.com
 * @LastEditTime: 2026-07-03 17:03:38
 * @FilePath: \nuanxinyunchao-service\app.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
App({
  globalData: {
    userInfo: null,
    token: '',
  },
  onLaunch() {
    // Initialize from storage
    const token = wx.getStorageSync('service_token')
    const userInfo = wx.getStorageSync('service_userInfo')
    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
    }
  },
})
