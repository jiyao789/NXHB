'use strict'
const banner_1 = require('../../api/banner')
const normalizeImageUrl_1 = require('../../utils/normalizeImageUrl')
const hot_1 = require('../../api/hot')
Page({
  data: {
    scrollTop: 0,
    currentBannerIndex: 0,
    statusBarHeight: 0,
    navBarHeight: 0,
    menuButtonInfo: {},
    bannerList: [],
    bannerLoading: true,
    bannerSwiperKey: 0,
    searchKeyword: "",
    searchResults: [],
    showSearchResults: false,
    isSearching: false,
    searchTimer: null,
    menuList: [
      {
        title: '我来报到',
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/icon_report.png',
        path: '/nuanxinyunchao/user/pages-sub/index/checkin/index',
      },
      {
        title: '我要帮助',
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/icon_help.png',
        path: '/nuanxinyunchao/user/pages-sub/index/help/index',
      },
      {
        title: '来赚积分',
        icon: 'https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/icon_points.png',
        path: '/nuanxinyunchao/user/pages-sub/index/points/index',
      },
    ],
    honorCard: {
      imgUrl: '../../static/image.jpg',
    },
  },
  async onLoad() {
    // 获取胶囊按钮和系统信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect()
    const systemInfo = wx.getSystemInfoSync()
    // 状态栏高度
    const statusBarHeight = systemInfo.statusBarHeight || 20
    // 导航栏高度 = (胶囊按钮上边缘 - 状态栏高度) * 2 + 胶囊按钮高度
    const navBarHeight = (menuButtonInfo.top - statusBarHeight) * 2 + menuButtonInfo.height
    this.setData({
      statusBarHeight,
      navBarHeight,
      menuButtonInfo,
    })
    await this.loadHomeBanners()
  },
  normalizeImageUrl(url) {
    return (0, normalizeImageUrl_1.normalizeImageUrl)(url)
  },
  pickBannerImageUrl(item) {
    if (!item || typeof item !== 'object') return ''
    return (
      item.imageUrl ||
      item.imgUrl ||
      item.image ||
      item.url ||
      item.picUrl ||
      item.IMAGE_URL ||
      item.image_url ||
      ''
    )
  },
  mapBannerList(list) {
    if (!Array.isArray(list)) return []
    return list
      .map((item, index) => ({
        id: item && item.id != null ? String(item.id) : `home_banner_${index}`,
        imgUrl: this.normalizeImageUrl(this.pickBannerImageUrl(item)),
        linkUrl: (item && (item.linkUrl || item.LINK_URL || item.link_url)) || '',
      }))
      .filter((x) => !!x.imgUrl)
  },
  applyBannerList(bannerList) {
    this.setData({
      bannerList,
      bannerLoading: false,
      bannerSwiperKey: (this.data.bannerSwiperKey || 0) + 1,
      currentBannerIndex: 0,
    })
  },
  async loadHomeBanners() {
    if (this._bannerLoading) return
    this._bannerLoading = true
    this.setData({ bannerLoading: true })
    try {
      const raw = await (0, banner_1.getHomeBannerListApi)()
      const list = Array.isArray(raw)
        ? raw
        : (raw && raw.records) || (raw && raw.list) || (raw && raw.rows) || (raw && raw.data) || []
      const bannerList = this.mapBannerList(list)
      if (bannerList.length > 0) {
        this.applyBannerList(bannerList)
        return
      }
      this.setData({ bannerLoading: false })
    } catch (e) {
      console.warn('[home] load banners failed', e)
      this.setData({ bannerLoading: false })
    } finally {
      this._bannerLoading = false
    }
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0,
      })
    }
    if (!this._bannerLoading && (!this.data.bannerList || this.data.bannerList.length === 0)) {
      this.loadHomeBanners()
    }
  },
  onPageScrollEvent(e) {
    this.setData({
      scrollTop: e.detail.scrollTop,
    })
  },
  onBannerChange(e) {
    this.setData({
      currentBannerIndex: e.detail.current,
    })
  },
  handleMenuClick(e) {
    const { path } = e.currentTarget.dataset
    if (path) {
      wx.navigateTo({ url: path })
    }
  },
  handleCheckinClick() {
    wx.navigateTo({ url: '/nuanxinyunchao/user/pages-sub/index/checkin/index' })
  },
  handlePointsClick() {
    wx.navigateTo({ url: '/nuanxinyunchao/user/pages-sub/index/points/index' })
  },
  handleHelpClick() {
    wx.navigateTo({ url: '/nuanxinyunchao/user/pages-sub/index/help/index' })
  },
  hideSearchResults() {
    this.setData({ showSearchResults: false })
  },
  onSearchFocus() {
    this.setData({ showSearchResults: true })
    if (this.data.searchResults.length === 0) {
      this.fetchSearchResults(this.data.searchKeyword || '')
    }
  },
  onSearchInput(e) {
    const keyword = e.detail.value
    this.setData({ searchKeyword: keyword, showSearchResults: true })
    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer)
    }
    const timer = setTimeout(() => {
      this.fetchSearchResults(keyword)
    }, 300)
    this.setData({ searchTimer: timer })
  },
  async fetchSearchResults(keyword) {
    this.setData({ isSearching: true })
    try {
      const query = {}
      if (keyword) {
        query.keyword = keyword
      }
      const raw = await hot_1.getHotDiscoverListApi(query)
      const list = Array.isArray(raw) ? raw : ((raw && raw.records) || (raw && raw.data) || (raw && raw.rows) || [])
      const searchResults = list.map(row => {
        const rawType = row.type || ''
        const type = rawType === '党群服务中心' ? '暖新巢' : rawType
        return {
          id: row.id,
          title: row.title || row.name || '',
          type,
          area: row.area || '',
          detailScene: row.detailScene || (type === '暖新巢' ? 'warm' : 'merchant')
        }
      })
      this.setData({ searchResults, isSearching: false })
    } catch (e) {
      console.error('[home search] failed', e)
      this.setData({ isSearching: false })
    }
  },
  onSelectSearchResult(e) {
    const item = e.currentTarget.dataset.item
    this.hideSearchResults()
    if (!item || !item.id) return
    
    if (item.type === '友好商户') {
      wx.navigateTo({
        url: `/nuanxinyunchao/user/pages-sub/hot/detail?id=${item.id}`
      })
    } else if (item.type === '暖新巢') {
      const scene = item.detailScene === 'party' ? 'party' : 'warm'
      wx.navigateTo({
        url: `/nuanxinyunchao/user/pages-sub/hot/surroundings?id=${item.id}&name=${encodeURIComponent(item.title)}&address=${encodeURIComponent(item.area || '')}&scene=${scene}`
      })
    }
  },
  handleHonorClick() {
    wx.navigateTo({ url: '/nuanxinyunchao/user/pages-sub/index/glory/list' })
  },
  navigateToVolunteer() {
    wx.navigateTo({ url: '/nuanxinyunchao/user/pages-sub/index/volunteer/index' })
  },
})
