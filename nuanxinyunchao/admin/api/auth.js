const { httpGet } = require('../utils/http.js');

function getBoundPartyCenters() {
  return httpGet('/api/webapp/auth/c/invitation/getBoundPartyCenters');
}

module.exports = {
  getBoundPartyCenters
};
