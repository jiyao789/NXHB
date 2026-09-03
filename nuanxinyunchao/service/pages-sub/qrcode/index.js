const { httpPost } = require('../../utils/http')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    isFlashOn: false,
    isScanning: true,
    userInfo: {},
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect()
    const statusBarHeight = sysInfo.statusBarHeight || 20
    const navBarHeight = (menuButtonInfo.top - statusBarHeight) * 2 + menuButtonInfo.height

    const userInfo = wx.getStorageSync('service_userInfo') || {}
    console.log(userInfo)
    this.setData({
      statusBarHeight: statusBarHeight,
      navBarHeight: navBarHeight,
      userInfo: userInfo,
    })
  },

  // 返回上一页
  handleBack() {
    wx.navigateBack()
  },

  // 切换手电筒
  toggleFlash() {
    this.setData({
      isFlashOn: !this.data.isFlashOn,
    })
  },

  // 扫码成功回调
  onScanCode(e) {
    if (!this.data.isScanning) return

    // 锁定，防止连续触发
    this.setData({ isScanning: false })

    const { type, result } = e.detail

    // 震动反馈
    wx.vibrateShort()

    console.log('扫码结果:', result)
    console.log('二维码类型:', type)

    // 解析二维码内容并处理
    this.handleScanResult(result)
  },

  // 处理扫码结果
  handleScanResult(result) {
    if (!result) {
      wx.showToast({ title: '扫码内容为空', icon: 'none' })
      this.resetScan()
      return
    }

    // 获取用户角色
    const { rolesId } = this.data.userInfo
    // 尝试解析JSON格式的二维码
    let parsedData = null
    try {
      parsedData = JSON.parse(result)
    } catch (e) {
      // 不是JSON格式，直接判定为无效
      this.showInvalidCode()
      return
    }

    // 根据角色判断二维码类型
    if (rolesId === 7) {
      // 党群中心：只能扫描用户码
      if (parsedData.type === 'warmQr' && parsedData.fid) {
        this.handleWarmQrCode(parsedData)
      } else {
        this.showInvalidCode()
      }
    } else if (rolesId === 0) {
      // 商户：只能扫描优惠券码
      if (parsedData.type === 'userCoupon' && parsedData.ledgerId) {
        this.handleUserCouponCode(parsedData)
      } else {
        this.showInvalidCode()
      }
    } else {
      // 其他角色：不允许扫描
      wx.showToast({ title: '当前角色无扫码权限', icon: 'none' })
      this.resetScan()
    }
  },

  // 处理用户码
  handleWarmQrCode(codeData) {
    const options = getCurrentPages()[getCurrentPages().length - 1].options
    const activityId = options.activityId
    const registrationType = parseInt(options.type) || 1

    // 获取当前登录用户（核销人）信息
    const userInfo = wx.getStorageSync('service_userInfo')
    console.log(userInfo)

    wx.showLoading({ title: '核销中...' })

    httpPost('/api/webapp/activityRegistration/verify', {
      activityId: activityId,
      userId: codeData.fid,
      registrationType: registrationType,
      verifierId: userInfo.userId,
      verifierName: userInfo.nickname,
    })
      .then((res) => {
        wx.hideLoading()
        // 从res.data中获取核销结果
        const result = res.data || {}
        const userName = result.userName || '未知用户'
        const userPhone = result.userPhone || ''
        const verifier = result.verifierName || '未知核销人'

        // 格式化核销时间
        let verifiedTime = ''
        if (result.verifiedAt) {
          const date = new Date(result.verifiedAt)
          verifiedTime = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        }

        if (result.success) {
          // 显示用户信息和核销信息的弹窗
          wx.showModal({
            title: '核销成功',
            content: `姓名：${userName}\n手机号：${userPhone}\n\n核销人：${verifier}${verifiedTime ? '\n核销时间：' + verifiedTime : ''}`,
            showCancel: false,
            confirmText: '确定',
            success: () => {
              this.resetScan()
            },
          })
        } else {
          // 显示用户信息和失败原因
          let content = `姓名：${userName}\n手机：${userPhone}`
          if (verifier) {
            content += `\n\n核销人：${verifier}`
            if (verifiedTime) {
              content += `\n核销时间：${verifiedTime}`
            }
          }
          wx.showModal({
            title: result.message || '操作失败',
            content: content,
            showCancel: false,
            confirmText: '确定',
            success: () => {
              this.resetScan()
            },
          })
        }
      })
      .catch((err) => {
        wx.hideLoading()
        wx.showToast({ title: `核销失败:,${err.msg}`, icon: 'none' })
        this.resetScan()
      })
  },

  // 处理优惠券码
  handleUserCouponCode(codeData) {
    const userInfo = wx.getStorageSync('service_userInfo')
    wx.showLoading({ title: '核销中...' })
    console.log(userInfo)
    httpPost('/api/webapp/userCoupon/verify', {
      ledgerId: codeData.ledgerId,
      verifierId: userInfo.userId,
      exp: codeData.exp,
    })
      .then((res) => {
        wx.hideLoading()
        let result = res.data
        console.log(result)
        const couponName = result.title
        const minSpend = result.minSpend
        // 获取券类型
        let couponType = ''
        let couponValueText = ''
        switch (result.couponKind) {
          case 1: // 满减券
            couponType = '满减券'
            if (minSpend && minSpend !== 0) {
              couponValueText = `满${minSpend}减${result.couponFaceAmount}元`
            } else {
              couponValueText = `${result.couponFaceAmount}元`
            }
            break
          case 2: // 折扣券
            couponType = '折扣券'
            couponValueText = `${result.couponFaceAmount}折`
            break
          case 3: // 代金券
            couponType = '代金券'
            couponValueText = `代金${result.couponFaceAmount}元`
            break
          default:
            couponType = '未知券'
            couponValueText = `${result.couponFaceAmount}元`
        }
        console.log(result)
        wx.showModal({
          title: '核销成功',
          content: `【${couponType}】\n额度：${couponValueText}\n名称：${couponName}\n${result.validDate}`,
          showCancel: false,
          confirmText: '确定',
          success: () => {
            this.resetScan()
          },
        })
      })
      .catch((err) => {
        wx.hideLoading()
        console.log(err)
        wx.showToast({ title: `核销失败,${err.msg}`, icon: 'none' })
        this.resetScan()
      })
  },

  // 显示无效二维码提示
  showInvalidCode() {
    wx.showToast({ title: '无效的二维码', icon: 'none' })
    this.resetScan()
  },

  // 处理 URL 类型二维码
  handleUrlCode(url) {
    wx.showModal({
      title: '识别到链接',
      content: `是否打开链接？\n${url}`,
      confirmText: '打开',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: url,
            success: () => {
              wx.showToast({ title: '已复制链接', icon: 'success' })
            },
          })
        }
        this.resetScan()
      },
    })
  },

  // 处理支付二维码
  handlePayCode(code) {
    wx.showModal({
      title: '识别到支付码',
      content: '请在微信支付中使用',
      showCancel: false,
      success: () => {
        this.resetScan()
      },
    })
  },

  // 处理业务ID类型二维码
  handleBusinessCode(code) {
    wx.showLoading({ title: '验证中...' })

    // 模拟请求后端验证业务码
    setTimeout(() => {
      wx.hideLoading()

      // 假设验证成功，显示业务信息
      wx.showModal({
        title: '验证成功',
        content: `业务ID: ${code}\n\n是否确认使用此业务码？`,
        confirmText: '确认',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.showToast({ title: '操作成功', icon: 'success' })
            // 可以在这里添加跳转或其他业务逻辑
            // wx.navigateTo({ url: `/nuanxinyunchao/service/pages/detail/index?id=${code}` });
          }
          this.resetScan()
        },
      })
    }, 1500)
  },

  // 处理参数形式二维码
  handleParamsCode(params) {
    wx.showModal({
      title: '识别到参数',
      content: `参数内容:\n${params}`,
      confirmText: '确认',
      showCancel: false,
      success: () => {
        // 解析参数并处理
        const paramsObj = this.parseParams(params)
        console.log('解析参数:', paramsObj)
        // 这里可以根据参数进行相应的业务处理
        wx.showToast({ title: '参数已记录', icon: 'success' })
        this.resetScan()
      },
    })
  },

  // 处理普通文本二维码
  handleTextCode(text) {
    wx.showModal({
      title: '识别到文本',
      content: text,
      confirmText: '复制',
      cancelText: '关闭',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: text,
            success: () => {
              wx.showToast({ title: '已复制', icon: 'success' })
            },
          })
        }
        this.resetScan()
      },
    })
  },

  // 解析参数字符串
  parseParams(params) {
    const result = {}
    const pairs = params.split('&')
    pairs.forEach((pair) => {
      const [key, value] = pair.split('=')
      if (key) {
        result[key] = decodeURIComponent(value || '')
      }
    })
    return result
  },

  // 重置扫码状态，允许再次扫码
  resetScan() {
    setTimeout(() => {
      this.setData({ isScanning: true })
    }, 2000)
  },

  // 相机启动失败或无权限
  onError(e) {
    console.error('相机权限或硬件错误', e)
    wx.showToast({
      title: '相机启动失败',
      icon: 'none',
    })
  },
})
