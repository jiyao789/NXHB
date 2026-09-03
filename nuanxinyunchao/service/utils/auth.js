const EXCLUDE_LOGIN_PATH_LIST = [
  '/nuanxinyunchao/service/pages-sub/auth/login',
  '/nuanxinyunchao/service/pages-sub/auth/verify',
  '/nuanxinyunchao/service/pages-sub/mine/setting/about/webview'
];

/**
 * Check if the user is logged in.
 * If not, redirect to the login page (unless the path is in the whitelist).
 */
export function checkLogin(currentPath) {
  const app = getApp();
  const hasLogin = !!(app.globalData && app.globalData.token);

  // Normalize path
  if (!currentPath.startsWith('/')) {
    currentPath = '/' + currentPath;
  }

  const isExcluded = EXCLUDE_LOGIN_PATH_LIST.some(path => currentPath.includes(path));

  if (!hasLogin && !isExcluded) {
    wx.reLaunch({
      url: '/nuanxinyunchao/service/pages-sub/auth/login'
    });
    return false;
  }
  return true;
}

/**
 * Check if the user is a Party-Mass Center staff (Role 7).
 * If so, redirect to their specialized workplace.
 */
export function checkPartyCenter() {
  const app = getApp();
  const userInfo = app.globalData.userInfo;
  if (userInfo && (userInfo.rolesId === 7 || userInfo.role === 'party-center')) {
    wx.reLaunch({
      url: '/nuanxinyunchao/service/pages-sub/mine/verify-gate/index'
    });
    return true;
  }
  return false;
}

export function logout() {
  const app = getApp();
  app.globalData.token = '';
  app.globalData.userInfo = null;
  wx.removeStorageSync('service_token');
  wx.removeStorageSync('service_userInfo');
  wx.reLaunch({
    url: '/nuanxinyunchao/service/pages-sub/auth/login'
  });
}
