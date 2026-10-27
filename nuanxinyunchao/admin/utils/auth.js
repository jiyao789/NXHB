/**
 * 管理端登录认证与会话管理
 */

const LOGIN_PATH = '/nuanxinyunchao/admin/pages-fg/login/login'

// 白名单页面（无需登录校验）
const WHITELIST = [
  LOGIN_PATH,
  '/nuanxinyunchao/admin/pages-fg/login/register',
  '/nuanxinyunchao/admin/pages-sub/about/webview'
]

// 登录有效期：30天（毫秒）
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/**
 * 获取当前登录信息
 */
function getAuthInfo() {
  const token = wx.getStorageSync('admin_token') || ''
  const loginTime = wx.getStorageSync('admin_login_time') || 0
  const userInfo = wx.getStorageSync('admin_userInfo') || null
  return { token, loginTime, userInfo }
}

/**
 * 保存登录信息
 * @param {string} token 
 * @param {object} userInfo 
 */
function setAuthInfo(token, userInfo = {}) {
  const now = Date.now()
  wx.setStorageSync('admin_token', token)
  wx.setStorageSync('admin_login_time', now)
  wx.setStorageSync('admin_userInfo', userInfo)

  const app = getApp()
  if (app && app.globalData) {
    app.globalData.token = token
    app.globalData.admin_token = token
    app.globalData.userInfo = userInfo
    app.globalData.admin_userInfo = userInfo
  }
}

/**
 * 清除管理端登录信息
 */
function clearAuthInfo() {
  wx.removeStorageSync('admin_token')
  wx.removeStorageSync('admin_login_time')
  wx.removeStorageSync('admin_userInfo')

  const app = getApp()
  if (app && app.globalData) {
    delete app.globalData.admin_token
    delete app.globalData.admin_userInfo
    if (app.globalData.token === wx.getStorageSync('admin_token')) {
      delete app.globalData.token
    }
  }
}

/**
 * 校验当前登录状态
 * @returns {{ valid: boolean, reason?: string }}
 */
function checkAuth() {
  const { token, loginTime } = getAuthInfo()

  // 1. 未登录
  if (!token) {
    return { valid: false, reason: 'unauthorized' }
  }

  // 2. 检查是否超过30天
  const now = Date.now()
  if (!loginTime || now - Number(loginTime) > THIRTY_DAYS_MS) {
    clearAuthInfo()
    return { valid: false, reason: 'expired' }
  }

  return { valid: true }
}

let isRedirecting = false

/**
 * 检查页面登录状态，若未登录或已超过30天则阻断并重定向到登录页
 * @param {string} [currentRoute] 可选当前页面路径，默认自动通过 getCurrentPages 获取
 * @returns {boolean} true 表示已登录且有效，false 表示未登录已处理跳转
 */
function checkLogin(currentRoute) {
  let route = currentRoute
  if (!route) {
    const pages = getCurrentPages()
    if (pages && pages.length > 0) {
      route = pages[pages.length - 1].route || ''
    }
  }

  if (route && !route.startsWith('/')) {
    route = '/' + route
  }

  // 如果处于白名单，直接放行
  if (route && WHITELIST.some(whitePath => route.includes(whitePath) || whitePath.includes(route))) {
    return true
  }

  const authState = checkAuth()
  if (authState.valid) {
    return true
  }

  if (!isRedirecting) {
    isRedirecting = true
    const toastTitle = authState.reason === 'expired' 
      ? '您的登录已超过30天，请重新登录' 
      : '您当前尚未登录，请先登录后继续访问'

    wx.showToast({
      title: toastTitle,
      icon: 'none',
      duration: 2000
    })

    const redirectParam = route ? `?redirect=${encodeURIComponent(route)}` : ''
    setTimeout(() => {
      wx.reLaunch({
        url: `${LOGIN_PATH}${redirectParam}`,
        complete: () => {
          setTimeout(() => {
            isRedirecting = false
          }, 1000)
        }
      })
    }, 1500)
  }

  return false
}

/**
 * 退出登录
 */
function logout() {
  clearAuthInfo()
  wx.removeStorageSync('token')
  wx.removeStorageSync('userInfo')
  wx.showToast({
    title: '已退出登录',
    icon: 'success',
    duration: 1000
  })
  setTimeout(() => {
    wx.reLaunch({
      url: LOGIN_PATH
    })
  }, 800)
}

module.exports = {
  LOGIN_PATH,
  WHITELIST,
  THIRTY_DAYS_MS,
  getAuthInfo,
  setAuthInfo,
  clearAuthInfo,
  checkAuth,
  checkLogin,
  logout
}
