'use strict'
const { httpGet } = require('../../../utils/http')

Page({
  data: {
    safeAreaInsetsTop: 20,
    tabOptions: ['点位', '优惠', '内容'],
    currentTab: 0,
    userLat: null,
    userLng: null,
    // 原始数据
    spotList: [],
    couponList: [],
    contentList: [],
    // 计算后属性的承载数组
    displayList: [],
    flatContentList: [],
    // 分页参数
    pageNum: 1,
    pageSize: 10,
    // 瀑布流分列
    leftColumnList: [],
    rightColumnList: [],
    // 加载状态
    loading: false,
    hasMore: true,
  },
  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ safeAreaInsetsTop: sysInfo.statusBarHeight || 20 })
    this.loadData()
  },
  handleBack() {
    wx.navigateBack()
  },
  onReachBottom() {
    this.loadData()
  },
  fetchLocation() {
    return new Promise((resolve) => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => resolve({ userLat: res.latitude, userLng: res.longitude }),
        fail: () => resolve({})
      })
    })
  },
  switchTab(e) {
    const index = e.currentTarget.dataset.index
    const resetData = {
      currentTab: index,
      pageNum: 1,
      hasMore: true,
      leftColumnList: [],
      rightColumnList: [],
      displayList: [],
      flatContentList: [],
    }
    // 根据切换的标签清空对应的数据列表
    if (index === 0) {
      resetData.spotList = []
    } else if (index === 1) {
      resetData.couponList = []
    } else if (index === 2) {
      resetData.contentList = []
    }
    this.setData(resetData, () => {
      this.loadData()
    })
  },
  async loadData() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })
    try {
      if (this.data.userLat == null || this.data.userLng == null) {
        const loc = await this.fetchLocation()
        if (loc.userLat != null && loc.userLng != null) {
          this.setData({ userLat: loc.userLat, userLng: loc.userLng })
        }
      }
      
      let locParams = ''
      if (this.data.userLat != null && this.data.userLng != null) {
        locParams = `&userLat=${this.data.userLat}&userLng=${this.data.userLng}`
      }

      let url = ''
      if (this.data.currentTab === 0) {
        url = `/api/webapp/user/favorite/location/page?page=${this.data.pageNum}&size=${this.data.pageSize}${locParams}`
      } else if (this.data.currentTab === 1) {
        url = `/api/webapp/user/favorite/discount/page?page=${this.data.pageNum}&size=${this.data.pageSize}${locParams}`
      } else if (this.data.currentTab === 2) {
        url = `/api/webapp/user/favorite/content/page?page=${this.data.pageNum}&size=${this.data.pageSize}${locParams}`
      }

      const data = await httpGet(url)
      const records = (data && data.records) || []

      if (this.data.currentTab === 0) {
        const newList = this.data.spotList.concat(
          records.map((item) => ({
            id: item.id,
            image: item.coverImage || '',
            title: item.locationName || item.title || '',
            tags: item.tags ? [{ text: item.tags, type: 'highlight' }] : [],
            category: item.category || '',
            area: item.address || '',
            distance: item.distanceStr || item.distance || '',
            star: item.star || 0,
            merchantId: item.merchantId || '',
            type: item.type === 1 ? '友好商户' : '暖新巢',
            subType: '优惠',
          })),
        )
        this.setData({ spotList: newList, displayList: newList })
      } else if (this.data.currentTab === 1) {
        const newList = this.data.couponList.concat(
          records.map((item) => {
            const typeMap = { 1: '满减', 2: '折扣', 3: '免费', 4: '兑换' }
            return {
              id: item.id,
              couponId: item.couponId,
              shopName: item.title || '',
              scope: item.scope || '全场通用',
              image: item.coverImage || '',
              couponType: typeMap[item.type] || item.couponType || '',
              price: item.price || '0',
            }
          }),
        )
        this.setData({ couponList: newList, displayList: newList })
      } else if (this.data.currentTab === 2) {
        const newItems = records.map((item) => ({
          id: item.id,
          type: 'content',
          articleId: item.articleId,
          isVideo: item.isVideo,
          contentDetailType: item.contentDetailType,
          title: item.title || '',
          author: item.authorName || '',
          avatar:
            item.authorAvatar && item.authorAvatar.trim()
              ? item.authorAvatar
              : 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/avatar.png',
          image: item.coverImage || '',
          location: item.location || '',
          likes: item.likes || 0,
          date: item.createdAt || '',
          jumpUrl:
            item.jumpUrl && item.jumpUrl.trim()
              ? item.jumpUrl
              : 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/good_deed.png',
        }))
        const newContentList = [...this.data.contentList, { date: 'flat', items: newItems }]
        const flatContentList = newContentList.reduce((acc, group) => acc.concat(group.items), [])
        this.setData({
          contentList: newContentList,
          flatContentList: flatContentList,
        })
        this.updateWaterfall(flatContentList)
      }

      const total = (data && data.total) || 0
      const totalPages = Math.ceil(total / this.data.pageSize)
      this.setData({
        hasMore: this.data.pageNum < totalPages,
        pageNum: this.data.pageNum + 1,
      })
    } catch (error) {
      console.error('加载收藏数据失败', error)
    } finally {
      this.setData({ loading: false })
    }
  },
  updateWaterfall(list) {
    const leftColumn = []
    const rightColumn = []
    let leftHeight = 0
    let rightHeight = 0

    list.forEach((item) => {
      const itemHeight = this.estimateItemHeight(item)
      if (leftHeight <= rightHeight) {
        leftColumn.push(item)
        leftHeight += itemHeight
      } else {
        rightColumn.push(item)
        rightHeight += itemHeight
      }
    })

    this.setData({ leftColumnList: leftColumn, rightColumnList: rightColumn })
  },
  estimateItemHeight(item) {
    const imageHeight = 300 + Math.random() * 200
    const textHeight = 80
    return imageHeight + textHeight
  },
  handleShopClick2(e) {
    const item = e.currentTarget.dataset.item
    console.log(item)
    if (item.type === '友好商户') {
      wx.navigateTo({
        url: `/nuanxinyunchao/user/pages-sub/hot/detail?id=${item.merchantId}&name=${encodeURIComponent(item.title)}&avatar=${encodeURIComponent(item.image)}&distance=${encodeURIComponent(item.distance)}`,
      })
    } else if (item.type === '暖新巢') {
      const scene = item.detailScene === 'party' ? 'party' : 'warm'
      wx.navigateTo({
        url: `/nuanxinyunchao/user/pages-sub/hot/surroundings?id=${item.merchantId}&name=${encodeURIComponent(item.title)}&address=${encodeURIComponent(item.area)}&scene=${scene}`,
      })
    }
  },
  handleUse(e) {
    const item = e.currentTarget.dataset.item
    wx.navigateTo({
      url: `/nuanxinyunchao/user/pages-sub/mine/coupon/detail?id=${item.couponId}`,
    })
  },
  handleDetail(e) {
    const item = e.currentTarget.dataset.item
    console.log(item)
    const detailType = item.contentDetailType != null ? item.contentDetailType : 0
    const isVideo = item.isVideo === true || item.type === 1 ? 1 : 0
    wx.navigateTo({
      url: `/nuanxinyunchao/user/pages-sub/index/points/detail?id=${encodeURIComponent(item.articleId)}&type=${detailType}&isVideo=${isVideo}`,
    })
  },
})
