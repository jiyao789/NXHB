const accountInfo = wx.getAccountInfoSync()
const envVersion = accountInfo.miniProgram.envVersion || 'release'

const envConfig = {
  develop: {
    gatewayUrl: 'http://nxyc.nj.sh.cn',
    directUrl: 'http://nxyc.nj.sh.cn/biz',
  },
  trial: {
    gatewayUrl: 'http://nxyc.nj.sh.cn',
    directUrl: 'http://nxyc.nj.sh.cn/biz',
  },
  release: {
    gatewayUrl: 'http://120.25.165.230:27603',
    directUrl: 'http://120.25.165.230:27603',
  },
}

const gatewayUrl = envConfig[envVersion].gatewayUrl
const directUrl = envConfig[envVersion].directUrl

const http = (options) => {
  return new Promise((resolve, reject) => {
    const app = getApp()
    const token = wx.getStorageSync('token') || (app.globalData && app.globalData.token)

    const header = {
      ...options.header,
      'content-type': 'application/json',
    }

    if (token) {
      header['Authorization'] = 'Bearer ' + token
      header['clientToken'] = token
    }

    let finalUrl = options.url
    let finalBaseUrl = directUrl

    const isGatewayPath =
      (finalUrl.indexOf('/auth/c/') !== -1 ||
        finalUrl.indexOf('/auth/tongyi/') !== -1 ||
        finalUrl.indexOf('/sys/org/orgTreeSelector') !== -1) &&
      finalUrl.indexOf('/invitation/') === -1

    if (isGatewayPath) {
      finalBaseUrl = gatewayUrl
    }

    if (
      finalBaseUrl === directUrl &&
      directUrl !== gatewayUrl &&
      finalUrl.indexOf('/api/webapp') !== -1
    ) {
      finalUrl = finalUrl.replace('/api/webapp', '')
    }

    wx.request({
      url: finalUrl.startsWith('http') ? finalUrl : finalBaseUrl + finalUrl,
      method: options.method || 'GET',
      data: options.data,
      header: header,
      success: (res) => {
        const { statusCode, data } = res
        if (statusCode >= 200 && statusCode < 300) {
          if (data.code === 200 || data.code === 0) {
            resolve(data)
          } else if (data.code === 401) {
            wx.showToast({ title: '登录已过期', icon: 'none' })
            wx.removeStorageSync('token')
            setTimeout(() => {
              wx.reLaunch({ url: '/nuanxinyunchao/admin/pages-fg/login/login' })
            }, 1500)
            reject(data)
          } else {
            wx.showToast({ title: data.msg || data.message || '操作失败', icon: 'none' })
            reject(data)
          }
        } else if (statusCode === 401) {
          wx.showToast({ title: '登录已过期', icon: 'none' })
          wx.removeStorageSync('token')
          setTimeout(() => {
            wx.reLaunch({ url: '/nuanxinyunchao/admin/pages-fg/login/login' })
          }, 1500)
          reject(res)
        } else {
          const businessMsg = data && (data.msg || data.message)
          if (businessMsg) {
            wx.showToast({ title: businessMsg, icon: 'none' })
            reject(data)
          } else {
            wx.showToast({ title: '服务器繁忙: ' + statusCode, icon: 'none' })
            reject(res)
          }
        }
      },
      fail: (err) => {
        console.error('>>> wx.request fail:', err)
        wx.showToast({ title: '连接服务器失败,请检查网络', icon: 'none' })
        reject(err)
      },
    })
  })
}

const httpPost = (url, data) => http({ url, data, method: 'POST' })
const httpGet = (url, data) => http({ url, data, method: 'GET' })

const resolveMediaUrl = (path) => {
  if (!path || typeof path !== 'string') {
    return ''
  }
  const trimmed = path.trim()
  if (!trimmed || trimmed === 'null') {
    return ''
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  if (trimmed.startsWith('/')) {
    return directUrl + trimmed
  }
  return trimmed
}

module.exports = {
  http,
  httpGet,
  httpPost,
  directUrl,
  resolveMediaUrl,
}
