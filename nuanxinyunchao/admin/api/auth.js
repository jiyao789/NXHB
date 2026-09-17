const { httpGet, httpPost } = require('../utils/http.js')

function getBoundPartyCenters() {
  return httpGet('/api/webapp/auth/c/invitation/getBoundPartyCenters')
}

function loginByPassword(data) {
  return httpPost('/api/webapp/auth/c/loginByPassword', data)
}

module.exports = {
  getBoundPartyCenters,
  loginByPassword,
}
