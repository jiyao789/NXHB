'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.ENV = void 0
exports.getBaseUrl = getBaseUrl
exports.getBizUrl = getBizUrl
// 环境变量与基础配置
exports.ENV = {
  active: 'develop', // develop, trial, release
  baseUrl: {
    // develop: 'http://localhost:9003',
    develop: 'http://nxyc.nj.sh.cn',
    trial: 'http://nxyc.nj.sh.cn',
    release: 'http://120.25.165.230:27603',
  },
  bizUrl: {
    // develop: 'http://localhost:9102',
    develop: 'http://nxyc.nj.sh.cn/biz',
    trial: 'http://nxyc.nj.sh.cn/biz',
    release: 'http://120.25.165.230:9999',
  },
  authMode: 'single', // single or double token
}

function getOverrideUrl(storageKey) {
  try {
    const v = wx.getStorageSync(storageKey)
    if (typeof v === 'string') {
      const trimmed = v.trim()
      if (trimmed) return trimmed.replace(/\/+$/, '')
    }
  } catch (e) {}
  return ''
}

function getBaseUrl() {
  const override = getOverrideUrl('NX_BASE_URL')
  if (override) return override
  const accountInfo = wx.getAccountInfoSync()
  const envVersion = accountInfo.miniProgram.envVersion
  if (envVersion === 'develop') return exports.ENV.baseUrl.develop
  if (envVersion === 'trial') return exports.ENV.baseUrl.trial
  if (envVersion === 'release') return exports.ENV.baseUrl.release
  return exports.ENV.baseUrl.develop
}
function getBizUrl() {
  const override = getOverrideUrl('NX_BIZ_URL')
  if (override) return override
  const accountInfo = wx.getAccountInfoSync()
  const envVersion = accountInfo.miniProgram.envVersion
  if (envVersion === 'develop') return exports.ENV.bizUrl.develop
  if (envVersion === 'trial') return exports.ENV.bizUrl.trial
  if (envVersion === 'release') return exports.ENV.bizUrl.release
  return exports.ENV.bizUrl.develop
}
