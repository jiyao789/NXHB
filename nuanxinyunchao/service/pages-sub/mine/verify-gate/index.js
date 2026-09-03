const { getActivityListByOrgIdApi } = require('../../../api/user')

Page({
  data: {
    hasLogin: false,
    userInfo: {},
    showActivityModal: false,
    activityList: [],
    selectedActivityId: '',
  },

  onShow() {
    const userInfo = wx.getStorageSync('service_userInfo')
    const token = wx.getStorageSync('service_token')

    if (token && userInfo && userInfo.rolesId === 7) {
      this.setData({
        hasLogin: true,
        userInfo,
      })
    } else {
      this.setData({
        hasLogin: false,
        userInfo: {},
      })
    }
  },

  // 进入登录页
  navToLogin() {
    wx.navigateTo({
      url: '/nuanxinyunchao/service/pages-sub/auth/login?role=7',
    })
  },

  // 进入注册页
  navToRegister() {
    wx.navigateTo({
      url: '/nuanxinyunchao/service/pages-sub/auth/verify?role=7',
    })
  },

  // 扫码核销 - 先弹出活动选择弹窗
  handleScan() {
    // wx.navigateTo({
    //   url: `/nuanxinyunchao/service/pages-sub/qrcode/index`,
    // })
    this.loadActivityList()
  },

  // 加载当前党群中心的活动列表
  async loadActivityList() {
    const userInfo = wx.getStorageSync('service_userInfo')
    const orgId = userInfo.userId

    if (!orgId) {
      wx.showToast({
        title: '获取账号信息失败',
        icon: 'none',
      })
      return
    }

    wx.showLoading({ title: '加载中...' })

    try {
      const result = await getActivityListByOrgIdApi(orgId)
      const activityList = result.data || []
      this.setData({
        activityList: activityList,
        showActivityModal: true,
        selectedActivityId: '',
      })
    } catch (error) {
      console.error('获取活动列表失败:', error)
      wx.showToast({
        title: '获取活动列表失败',
        icon: 'none',
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 选择活动
  selectActivity(e) {
    const itemId = e.currentTarget.dataset.id
    this.setData({
      selectedActivityId: itemId,
    })
  },

  // 确认选择并跳转
  confirmActivity() {
    const { selectedActivityId, activityList } = this.data

    if (!selectedActivityId) {
      wx.showToast({
        title: '请选择活动',
        icon: 'none',
      })
      return
    }

    this.setData({
      showActivityModal: false,
    })

    // 找到选中的活动项
    const selectedActivity = activityList.find((item) => item.id === selectedActivityId)

    // 携带活动类型和活动ID跳转至扫描页面
    const type = selectedActivity ? selectedActivity.type : 1
    const activityId = selectedActivityId
    console.log(type, activityId)
    wx.navigateTo({
      url: `/nuanxinyunchao/service/pages-sub/qrcode/index?type=${type}&activityId=${activityId}`,
    })
  },

  // 关闭弹窗
  closeActivityModal() {
    this.setData({
      showActivityModal: false,
      selectedActivityId: '',
    })
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数用于阻止事件冒泡
  },

  // 编辑中心资料
  handleEditProfile() {
    wx.navigateTo({
      url: '/nuanxinyunchao/service/pages-sub/mine/setting/profile',
    })
  },

  // 查看核销记录
  handleRecord() {
    wx.navigateTo({
      url: '/nuanxinyunchao/service/pages-sub/mine/verify',
    })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出当前工作账号吗？',
      confirmColor: '#FF6B00',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('service_token')
          wx.removeStorageSync('service_userInfo')
          wx.reLaunch({ url: '/nuanxinyunchao/service/pages-sub/auth/login' })
        }
      },
    })
  },
})
