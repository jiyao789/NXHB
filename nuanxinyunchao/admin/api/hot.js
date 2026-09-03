"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePartyActivityLikeApi = void 0;
exports.togglePartyCenterFavoriteApi = void 0;
exports.getPartyCenterDetailApi = void 0;
exports.toggleMerchantFavoriteApi = void 0;
exports.getHotMerchantDetailApi = void 0;
exports.getHotDiscoverListApi = void 0;
exports.getHotBannerListApi = void 0;
const http_1 = require("../utils/http");
/** 热门 Tab Banner（scene=HOT） */
const getHotBannerListApi = () => {
    return (0, http_1.httpGet)('/api/webapp/client/c/hot/banner/list', { scene: 'HOT' });
};
exports.getHotBannerListApi = getHotBannerListApi;
/** 发现长宁列表（可选 userLat/userLng） */
const getHotDiscoverListApi = (query) => {
    return (0, http_1.httpGet)('/api/webapp/client/c/hot/item/list', query !== null && query !== void 0 ? query : {});
};
exports.getHotDiscoverListApi = getHotDiscoverListApi;
/** 友好商户详情（可选 userLat/userLng；id 为字符串以兼容超长雪花 id） */
const getHotMerchantDetailApi = (query) => {
    return (0, http_1.httpGet)('/api/webapp/client/c/hot/merchant/detail', query !== null && query !== void 0 ? query : {});
};
exports.getHotMerchantDetailApi = getHotMerchantDetailApi;
const toggleMerchantFavoriteApi = (data) => {
    return (0, http_1.httpPost)('/api/webapp/client/c/hot/merchant/favorite/toggle', data !== null && data !== void 0 ? data : {});
};
exports.toggleMerchantFavoriteApi = toggleMerchantFavoriteApi;
/** 党群服务中心详情 */
const getPartyCenterDetailApi = (query) => {
    return (0, http_1.httpGet)('/api/webapp/client/c/hot/party-center/detail', query !== null && query !== void 0 ? query : {});
};
exports.getPartyCenterDetailApi = getPartyCenterDetailApi;
const togglePartyCenterFavoriteApi = (data) => {
    return (0, http_1.httpPost)('/api/webapp/client/c/hot/party-center/favorite/toggle', data !== null && data !== void 0 ? data : {});
};
exports.togglePartyCenterFavoriteApi = togglePartyCenterFavoriteApi;
const togglePartyActivityLikeApi = (data) => {
    return (0, http_1.httpPost)('/api/webapp/client/c/hot/party-activity/like/toggle', data !== null && data !== void 0 ? data : {});
};
exports.togglePartyActivityLikeApi = togglePartyActivityLikeApi;
/** 活动/服务可预约排期 */
const getActivitySchedulesApi = (query) => {
    return (0, http_1.httpGet)('/api/webapp/client/c/hot/activity/schedules', query !== null && query !== void 0 ? query : {});
};
exports.getActivitySchedulesApi = getActivitySchedulesApi;
/** 提交活动/服务预约 */
const createActivityAppointmentApi = (data) => {
    return (0, http_1.httpPost)('/api/webapp/client/c/hot/activity/appointment', data !== null && data !== void 0 ? data : {});
};
exports.createActivityAppointmentApi = createActivityAppointmentApi;
