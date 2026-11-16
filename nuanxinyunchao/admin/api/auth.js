const { httpGet, httpPost } = require('../utils/http.js')
const { encryptPassword } = require('../../../utils/crypto.js')

function getBoundPartyCenters() {
  return httpGet('/api/webapp/auth/c/invitation/getBoundPartyCenters')
}

function loginByPassword(data) {
  const submitData = { ...data }
  if (submitData.password) {
    submitData.password = encryptPassword(submitData.password)
  }
  return httpPost('/api/webapp/auth/c/loginByPassword', submitData)
}

function getLoginUserInfo() {
  return httpGet('/api/webapp/auth/c/getLoginUserInfo')
}

module.exports = {
  getBoundPartyCenters,
  loginByPassword,
  getLoginUserInfo,
}
