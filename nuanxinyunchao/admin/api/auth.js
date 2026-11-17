const { httpGet, httpPost } = require('../utils/http.js')

function getBoundPartyCenters() {
  return httpGet('/api/webapp/auth/c/invitation/getBoundPartyCenters')
}

function loginByPassword(data) {
  return httpPost('/api/webapp/auth/c/loginByPassword', data)
}

function getLoginUserInfo() {
  return httpGet('/api/webapp/auth/c/getLoginUserInfo')
}

module.exports = {
  getBoundPartyCenters,
  loginByPassword,
  getLoginUserInfo,
}
