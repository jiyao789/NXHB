'use strict'
const taskReward_1 = require('../../../../utils/taskReward')
const { httpGet, httpPost } = require('../../../../utils/http')
Page({
  data: {
    safeAreaTop: 0,
    detailData: {
      title: '',
      orgName: '',
      image: '',
      type: 1,
      points: null,
      dateRange: '',
      timeDesc: '',
      contactPhone: '',
      location: '',
      inTimeRange: true,
    },
    memberList: [],
    taskInfo: {
      active: false,
      type: '',
      countdown: 10,
      isCompleted: false,
    },
  },
  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({
      safeAreaTop: sysInfo.statusBarHeight || 20,
    })
    if (options && options.data) {
      try {
        const passedData = JSON.parse(decodeURIComponent(options.data))
        this.setData({
          detailData: { ...this.data.detailData, ...passedData },
        })
      } catch (e) {
        console.error('参数解析失败', e)
      }
    }
    this.fetchDetailData()
  },
  onShow() {
    const activeTask = wx.getStorageSync('activeTask')
    if (activeTask && activeTask.active && activeTask.type === 'browse_volunteer') {
      this.setData({
        'taskInfo.active': true,
        'taskInfo.type': activeTask.type,
        'taskInfo.countdown': activeTask.countdown !== undefined ? activeTask.countdown : 10,
        'taskInfo.isCompleted': activeTask.isCompleted || false,
      })
      if (!this.data.taskInfo.isCompleted && !this.timer) {
        this.startTimer()
      }
    } else {
      this.setData({ 'taskInfo.active': false })
      this.stopTimer()
    }
  },
  onHide() {
    if (this.data.taskInfo.active) {
      ;(0, taskReward_1.snapshotActiveTaskFromPage)(
        this.data.taskInfo,
        this.data.taskInfo.countdown,
      )
    }
    this.stopTimer()
  },
  onUnload() {
    if (this.data.taskInfo.active) {
      ;(0, taskReward_1.snapshotActiveTaskFromPage)(
        this.data.taskInfo,
        this.data.taskInfo.countdown,
      )
    }
    this.stopTimer()
  },
  startTimer() {
    this.stopTimer()
    this.timer = setInterval(() => {
      if (this.data.taskInfo.countdown > 0) {
        const next = this.data.taskInfo.countdown - 1
        this.setData({
          'taskInfo.countdown': next,
        })
        ;(0, taskReward_1.persistActiveTask)({ countdown: next })
      } else {
        this.stopTimer()
        this.setData({
          'taskInfo.isCompleted': true,
        })
        ;(0, taskReward_1.markTaskCompletedAndClaim)()
      }
    }, 1000)
  },
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },
  handleBackToTasks() {
    const pages = getCurrentPages()
    wx.removeStorageSync('activeTask')
    this.setData({ 'taskInfo.active': false })
    this.stopTimer()

    let delta = -1
    for (let i = pages.length - 1; i >= 0; i--) {
      const currRoute = pages[i].route
      // 适配分包库扁平路径
      if (currRoute.includes('checkin/index') && i !== pages.length - 1) {
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
  // 拨打电话功能
  handleCall() {
    if (this.data.detailData.contactPhone) {
      wx.makePhoneCall({
        phoneNumber: this.data.detailData.contactPhone,
      })
    }
  },
  // 接单按钮
  async handleAccept() {
    const id = this.data.detailData.id
    if (!id) {
      wx.showToast({ title: '活动数据异常', icon: 'none' })
      return
    }
    if (!this.data.detailData.inTimeRange) {
      wx.showToast({ title: '不在活动时间内', icon: 'none' })
      return
    }

    wx.showLoading({ title: '提交中...' })
    try {
      const res = await httpPost('/biz/volunteer/activity/signup', { id: id })
      wx.showToast({ title: '接单成功', icon: 'success' })

      // 延迟刷新详情页数据，留出时间显示 Toast 并确保后端事务提交
      setTimeout(() => {
        this.fetchDetailData()
      }, 1500)
    } catch (error) {
      console.error('接单失败', error)
    } finally {
      wx.hideLoading()
    }
  },
  formatTime(timeStr) {
    if (!timeStr) return '00:00:00'
    const parts = timeStr.split(':')
    while (parts.length < 3) {
      parts.push('00')
    }
    return parts.join(':')
  },
  getDatePart(dateStr) {
    if (!dateStr) return ''
    return dateStr.split(' ')[0] // "2026-07-07 00:00:00" -> "2026-07-07"
  },
  async fetchDetailData() {
    const id = this.data.detailData.id
    if (!id) return

    wx.showLoading({ title: '加载中...' })
    try {
      console.log('准备请求详情，传入的 ID 为：', id)
      const res = await httpGet('/biz/volunteer/activity/detail', { id: id, _t: Date.now() })
      console.log('详情接口返回结果：', res)
      if (res) {
        const members = (res.memberList || []).map((m) => ({
          id: m.id,
          name: m.name || m.userName,
          avatar: m.avatar || m.userAvatar,
        }))

        let imagesList = []
        if (res.images) {
          try {
            imagesList = JSON.parse(res.images)
          } catch (e) {
            imagesList = [res.images]
          }
        }

        // 招募状态判断
        let recruitStatus = res.recruitStatus || 1 // 默认为招募中
        if (
          res.maxParticipants &&
          res.maxParticipants > 0 &&
          (res.currentParticipants || 0) >= res.maxParticipants
        ) {
          recruitStatus = 2 // 已满员
        }

        let acceptStatus = res.acceptStatus === 0 ? '已接单' : '待接单'
        if (acceptStatus === '待接单' && recruitStatus === 2) {
          acceptStatus = '已满员'
        }

        const startDateStr = res.startDate ? res.startDate.split(' ')[0] : ''
        const endDateStr = res.endDate ? res.endDate.split(' ')[0] : ''
        const timeRange =
          `${startDateStr} ${res.startTime || ''} 至 ${endDateStr} ${res.endTime || ''}`.trim()

        const now = new Date()
        let inTimeRange = true

        if (res.startDate) {
          const datePart = res.startDate.split(' ')[0] // 提取日期
          const startTimeStr = this.formatTime(res.startTime)
          const startDateTimeStr = datePart + ' ' + startTimeStr
          const startTime = new Date(startDateTimeStr)
          console.log('开始时间:', startTime, '当前时间:', now)

        }

        if (res.endDate) {
          const datePart = res.endDate.split(' ')[0] // 提取日期
          const endTimeStr = this.formatTime(res.endTime) // "01:00" -> "01:00:00"
          const endDateTimeStr = datePart + ' ' + endTimeStr
          // 结果: "2026-07-07 01:00:00"  ✅ 正确
          const endTime = new Date(endDateTimeStr)
          console.log('结束时间:', endTime, '当前时间:', now)
          if (now > endTime) {
            inTimeRange = false
          }
        }
        console.log(inTimeRange, '设置区间')
        this.setData({
          detailData: {
            ...this.data.detailData,
            title: res.title,
            orgName: res.orgName || '暖新组织',
            image: res.image,
            imagesList: imagesList,
            type: recruitStatus,
            acceptStatus: acceptStatus,
            inTimeRange: inTimeRange,
            points: res.rewardPoints || 0,
            awardMechanism:
              res.awardMechanism || (res.rewardPoints ? `${res.rewardPoints}积分` : '无'),
            timeRange: timeRange === '至' ? '长期有效' : timeRange,
            contactPhone: res.contactInfo || '暂无',
            location: res.location || '线上/待定',
            fullText: res.recruitRequirement || res.remarks || '无',
            recruitTarget: res.recruitTarget || '全体人员',
          },
          memberList: members,
        })
      }
    } catch (error) {
      console.error('获取详情失败', error)
      wx.showToast({ title: '获取数据失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },
})
