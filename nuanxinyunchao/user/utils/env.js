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
    develop: 'https://nxyc.nj.sh.cn',
    trial: 'https://nxyc.nj.sh.cn',
    release: 'https://nxyc.nj.sh.cn',
  },
  bizUrl: {
    // develop: 'http://localhost:9102',
    develop: 'https://nxyc.nj.sh.cn/biz',
    trial: 'https://nxyc.nj.sh.cn/biz',
    release: 'https://nxyc.nj.sh.cn/biz',
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
