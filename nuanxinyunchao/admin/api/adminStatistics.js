const { httpGet, httpPost } = require('../utils/http.js');

/** 绠＄悊绔?路 鐑棬闃靛湴鎺掕鍒楄〃 */
function getRankMerchants() {
  return httpGet('/server/rank/merchant');
}

/** 绠＄悊绔?路 娲昏穬鐢ㄦ埛鎺掕鍒楄〃 */
function getRankUsers() {
  return httpGet('/server/rank/user');
}

/**
 * 绠＄悊绔?路 闃靛湴/璁炬柦鎺掕璇︽儏鑱氬悎
 * @param {{ id: string|number, month?: string }} params month 鏍煎紡 YYYY-MM锛屽彲閫? */
function getMerchantRankDetail(params) {
  return httpGet('/server/statistics/rank/detail', params);
}

/**
 * 绠＄悊绔?路 闃靛湴褰撴湀鏍搁攢鐢ㄦ埛鏄庣粏
 * @param {{ id: string|number, month?: string, jobCode?: number }} params
 */
function getMerchantVerifyUsers(params) {
  return httpGet('/server/statistics/rank/verify-users', params);
}

/**
 * 绠＄悊绔?路 闃靛湴褰撴湀鏈嶅姟璇勪环鍒楄〃
 * @param {{ id: string|number, month?: string, keyword?: string, jobCode?: number, sort?: string }} params
 */
function getMerchantReviews(params) {
  return httpGet('/server/statistics/rank/reviews', params);
}

/**
 * 绠＄悊绔?路 鑾峰彇C绔敤鎴蜂釜浜鸿鎯? * @param {string} userId
 */
function getClientUserDetail(userId) {
  return httpGet('/server/rank/clientUser/detail', { userId });
}

function getAllActivities(userId) {
  return httpGet('/server/rank/clientUser/activities', { userId });
}

function getAllTasks(userId) {
  return httpGet('/server/rank/clientUser/tasks', { userId });
}

function getAllCoupons(userId) {
  return httpGet('/server/rank/clientUser/coupons', { userId });
}

/** 绠＄悊绔?路 鑾峰彇鏁版嵁鐪嬫澘姒傝 */
function getAdminOverview() {
  return httpGet('/server/statistics/overview');
}

/** 绠＄悊绔?路 鑾峰彇闃靛湴姒傝锛堝甫6涓湀瓒嬪娍锛?*/
function getSiteOverview() {
  return httpGet('/server/statistics/site-overview');
}

/** 绠＄悊绔?路 鑾峰彇闃靛湴姒傝-鏆栨柊宸㈠垪琛?*/
function getSiteNests() {
  return httpGet('/server/statistics/site-overview/nests');
}

/** 绠＄悊绔?路 鑾峰彇闃靛湴姒傝-鍙嬪ソ鍟嗘埛鍒楄〃 */
function getSiteShops(params) {
  return httpGet('/server/statistics/site-overview/shops', params);
}

/** 绠＄悊绔?路 鑾峰彇闃靛湴姒傝-鍦板浘妯″紡鏍囪鐐?*/
function getSiteMapMarkers() {
  return httpGet('/server/statistics/site-overview/map-markers');
}

/** 绠＄悊绔?路 鑾峰彇鍦板浘鐐逛綅鏁版嵁鍒楄〃 (瀹屽叏鍏煎鐢ㄦ埛绔? */
function getMapPoints(params) {
  return httpGet('/server/statistics/site-overview/map/points', params);
}

/** 绠＄悊绔?路 娲昏穬鐪嬫澘-鑾峰彇鍚勮閬撴椿璺冨害鎺掑悕 */
function getActiveBoardStats() {
  return httpGet('/server/statistics/active-board');
}

/** 绠＄悊绔?路 鑾峰彇鍚勮閬撳姙寰呭鏍告眹鎬?*/
function getPendingAudits() {
  return httpGet('/server/statistics/audit/pending');
}

/** 绠＄悊绔?路 鑾峰彇鍚勮閬撳姙宸插鏍告眹鎬?*/
function getCompletedAudits() {
  return httpGet('/server/statistics/audit/completed');
}

function getPointDetail(params) {
  return httpGet('/server/statistics/site-overview/map/point/detail', params);
}

/** 管理端 - 一键提醒各街道办 */
function remindReview() {
  return httpPost('/server/statistics/remindReview');
}

module.exports = {
  getRankMerchants,
  getRankUsers,
  getMerchantRankDetail,
  getMerchantVerifyUsers,
  getMerchantReviews,
  getClientUserDetail,
  getAllActivities,
  getAllTasks,
  getAllCoupons,
  getAdminOverview,
  getSiteOverview,
  getSiteNests,
  getSiteShops,
  getSiteMapMarkers,
  getMapPoints,
  getPointDetail,
  getActiveBoardStats,
  getPendingAudits,
  getCompletedAudits,
  remindReview
};

