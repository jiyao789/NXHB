'use strict'
const { getActivityListApi, cancelActivityApi } = require('../../../api/mine')
Page({
  data: {
    safeAreaInsetsTop: 20,
    isLoading: false,
    searchKeyword: '',
    currentTab: 0,
    tabs: [
      { name: '全部', key: 'all' },
      { name: '已参与', key: 'verified' },
      { name: '未参与', key: 'unverified' },
      { name: '已取消', key: 'cancelled' },
    ],
    groupedList: [],
    userId: '',
  },
  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ safeAreaInsetsTop: sysInfo.statusBarHeight || 20 })
    const userInfo = wx.getStorageSync('userInfo')
    this.setData({ userId: (userInfo && userInfo.userId) || '1' })
    this.fetchData()
  },
  handleBack() {
    wx.navigateBack()
  },
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },
  clearSearch() {
    this.setData({ searchKeyword: '' })
    this.fetchData()
  },
  handleRefresh() {
    this.fetchData()
  },
  handleTabChange(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentTab: index })
    this.fetchData()
  },
  handleItemClick(e) {
    const item = e.currentTarget.dataset.item
    console.log('点击详情:', item.id)
  },
  getStatusStyle(status) {
    switch (status) {
      case 'unverified':
        return 'text-FF6B00'
      case 'verified':
        return 'text-4BA592'
      case 'cancelled':
        return 'text-gray-400'
      default:
        return 'text-gray-800'
    }
  },
  getStatusKey(status) {
    switch (status) {
      case 0:
        return 'unverified'
      case 1:
        return 'verified'
      case 2:
        return 'cancelled'
      default:
        return 'unverified'
    }
  },
  async fetchData() {
    this.setData({ isLoading: true })
    const targetStatus = this.data.tabs[this.data.currentTab].key
    const keyword = this.data.searchKeyword

    let statusParam = null
    if (targetStatus === 'verified') {
      statusParam = 1
    } else if (targetStatus === 'unverified') {
      statusParam = 0
    } else if (targetStatus === 'cancelled') {
      statusParam = 2
    }

    try {
      const data = await getActivityListApi(this.data.userId, statusParam, keyword)
      const filtered = data.map((item) => ({
        id: item.id,
        activityId: item.activityId,
        title: item.activityTitle,
        type: item.type,
        date: item.activityDate || '未知日期',
        status: this.getStatusKey(item.status),
        statusText: item.statusText || '未知',
        showCancelBtn: item.status === 0,
        showReviewBtn: item.status === 3 && !item.reviewed,
        reviewed: !!item.reviewed,
      }))
      this.processData(filtered)
    } catch (error) {
      console.error('获取活动列表失败:', error)
      this.processData([])
    } finally {
      this.setData({ isLoading: false })
    }
  },
  processData(filtered) {
    const groups = {}
    filtered.forEach((item) => {
      item.statusClass = this.getStatusStyle(item.status)
      const [year, month] = item.date.split('.')
      const monthKey = year && month ? `${year}年${Number(month)}月` : '未分类'
      if (!groups[monthKey]) {
        groups[monthKey] = []
      }
      groups[monthKey].push(item)
    })
    const groupedList = Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => ({
        month: key,
        items: groups[key],
      }))
    this.setData({ groupedList })
  },
  async handleCancelActivity(e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: '取消活动',
      content: `确定要取消活动"${item.title}"吗？`,
      confirmColor: '#E65100',
      success: async (res) => {
        if (res.confirm) {
          try {
            await cancelActivityApi(item.id)
            wx.showToast({
              title: '取消成功',
              icon: 'success',
            })
            this.fetchData()
          } catch (error) {
            wx.showToast({
              title: '取消失败',
              icon: 'error',
            })
          }
        }
      },
    })
  },
})
