const accountInfo = wx.getAccountInfoSync()
const envVersion = accountInfo.miniProgram.envVersion || 'release'

const envConfig = {
  develop: {
    //gatewayUrl: 'http://localhost:9102',
    //directUrl: 'http://localhost:9102',
    // gatewayUrl: 'http://120.25.165.230:27903',
    // directUrl: 'http://120.25.165.230:27912',
    gatewayUrl: 'http://nxyc.nj.sh.cn',
    directUrl: 'http://nxyc.nj.sh.cn/biz',
  },
  trial: {
    gatewayUrl: 'http://nxyc.nj.sh.cn',
    directUrl: 'http://nxyc.nj.sh.cn/biz',
  },
  release: {
    gatewayUrl: 'http://nxyc.nj.sh.cn',
    directUrl: 'http://nxyc.nj.sh.cn/biz',
  },
}

const gatewayUrl = envConfig[envVersion].gatewayUrl
const directUrl = envConfig[envVersion].directUrl

export const getGatewayUrl = () => gatewayUrl
export const getDirectUrl = () => directUrl

/**
 * 基础请求封装
 */
export const http = (options) => {
  return new Promise((resolve, reject) => {
    const app = getApp()
    const token = wx.getStorageSync('service_token') || (app.globalData && app.globalData.token)

    const header = {
      ...options.header,
      'content-type': 'application/json',
    }

    if (token) {
      header['Authorization'] = 'Bearer ' + token
      header['token'] = token
      header['clientToken'] = token
      header['satoken'] = token
    }

    // --- 路由判定逻辑 ---
    let finalUrl = options.url
    let finalBaseUrl = directUrl // 业务端 9102 为默认值

    // 只有绝对必须由网关处理的认证逻辑才走 9003
    // 注意：loginByPassword 不走网关，改走 directUrl 直连（路径会自动剥离 /api/webapp 前缀）
    const isGatewayPath =
      (finalUrl.indexOf('/auth/c/') !== -1 ||
        finalUrl.indexOf('/auth/tongyi/') !== -1 ||
        finalUrl.indexOf('/sys/org/orgTreeSelector') !== -1) &&
      finalUrl.indexOf('/invitation/') === -1 && // 排除属于业务端的邀请码接口
      finalUrl.indexOf('/auth/c/loginByPassword') === -1 // loginByPassword 直连后端，无需走网关

    if (isGatewayPath) {
      finalBaseUrl = gatewayUrl
    }

    // 路径自愈：仅当直连业务端口（非网关模式）时，剥离网关专用前缀
    // 但核销接口需要保留完整路径
    const verifyPaths = ['/api/webapp/activityRegistration/verify', '/api/webapp/userCoupon/verify']
    const isVerifyPath = verifyPaths.some((path) => finalUrl.indexOf(path) !== -1)

    if (
      (finalBaseUrl === directUrl ||
        finalBaseUrl.indexOf('9102') !== -1 ||
        finalBaseUrl.indexOf('27912') !== -1) &&
      finalUrl.indexOf('/api/webapp') !== -1 &&
      !isVerifyPath
    ) {
      finalUrl = finalUrl.replace('/api/webapp', '')
    }

    // --- 调试埋点：请在微信开发者工具 Console 确认此输出 ---
    console.info(
      `>>> [路由分发] 原始URL: ${options.url} -> 目标基准地址: ${finalBaseUrl} -> 最终URL: ${finalUrl}`,
    )

    wx.request({
      url: finalUrl.startsWith('http') ? finalUrl : finalBaseUrl + finalUrl,
      method: options.method || 'GET',
      data: options.data,
      header: header,
      timeout: 60000, // 增加超时时间到60秒，防止大数据量（如Base64图片）拉取超时
      success: (res) => {
        const { statusCode, data } = res
        if (statusCode >= 200 && statusCode < 300) {
          if (data.code === 200 || data.code === 0) {
            resolve(data)
          } else if (data.code === 401) {
            wx.showToast({ title: '登录已过期', icon: 'none' })
            wx.removeStorageSync('service_token')
            setTimeout(() => {
              wx.navigateTo({ url: '/nuanxinyunchao/service/pages/login/index' })
            }, 1500)
            reject(data)
          } else {
            console.error('>>> 业务拦截报错, data.code:', data.code, ' 报文:', data)
            wx.showToast({ title: data.msg || data.message || '操作失败', icon: 'none' })
            reject(data)
          }
        } else if (statusCode === 401) {
          wx.showToast({ title: '登录已过期', icon: 'none' })
          wx.removeStorageSync('service_token')
          setTimeout(() => {
            wx.navigateTo({ url: '/nuanxinyunchao/service/pages/login/index' })
          }, 1500)
          return reject(res.data || res)
        } else {
          // 优化：即使是 500/503 等错误，如果后端返回了 JSON 且含有 msg，则显示该业务提示
          console.error('>>> 接口请求失败, 状态码:', statusCode, ' 报文:', data)
          const businessMsg = data && (data.msg || data.message)
          if (businessMsg) {
            wx.showToast({ title: businessMsg, icon: 'none' })
            reject(data)
          } else {
            wx.showToast({ title: '服务器繁忙: ' + statusCode, icon: 'none' })
            reject(res.data || res)
          }
        }
      },
      fail: (err) => {
        console.error('>>> wx.request fail 回调:', err)
        wx.showToast({ title: '连接服务器失败,请检查网络', icon: 'none' })
        reject(err)
      },
    })
  })
}

export const httpPost = (url, data) => http({ url, data, method: 'POST' })
export const httpGet = (url, data) => http({ url, data, method: 'GET' })
