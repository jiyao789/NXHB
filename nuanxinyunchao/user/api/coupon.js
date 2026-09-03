"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyCouponWalletApi =
    exports.submitCouponWalletReviewApi =
    exports.getCouponWalletUsedDetailApi =
    exports.getCouponWalletUseDetailApi =
    exports.exchangeCouponTemplateApi =
    exports.getCouponTemplateDetailApi =
        void 0;
const http_1 = require("../utils/http");
/** C 端券模板详情 ledgerId：券包流水，可选，服务端用库里的 coupon_id 覆盖失真 id */
function getCouponTemplateDetailApi(id, ledgerId) {
    const query = {};
    const idStr = id !== undefined && id !== null ? String(id).trim() : "";
    const ldStr = ledgerId !== undefined && ledgerId !== null ? String(ledgerId).trim() : "";
    if (idStr)
        query.id = idStr;
    if (ldStr)
        query.ledgerId = ldStr;
    return http_1.httpGet("/api/webapp/client/c/coupon/template/detail", query, {
        hideErrorToast: false,
    });
}
exports.getCouponTemplateDetailApi = getCouponTemplateDetailApi;
/** C 端积分兑换券 */
const exchangeCouponTemplateApi = (couponTemplateId) => {
    return (0, http_1.httpPost)('/api/webapp/client/c/coupon/exchange', { couponTemplateId });
};
exports.exchangeCouponTemplateApi = exchangeCouponTemplateApi;
/** 我的券包分页 filterStatus：0 未使用 1 已使用 2 已失效；不传表示全部 */
const getMyCouponWalletApi = (query) => {
    return (0, http_1.httpGet)('/api/webapp/client/c/coupon/wallet/page', query != null ? query : {});
};
exports.getMyCouponWalletApi = getMyCouponWalletApi;
/** 未使用券「去使用」详情 */
const getCouponWalletUseDetailApi = (query) => {
    return (0, http_1.httpGet)('/api/webapp/client/c/coupon/wallet/use-detail', query != null ? query : {});
};
exports.getCouponWalletUseDetailApi = getCouponWalletUseDetailApi;
/** 已使用券评价页概要 */
const getCouponWalletUsedDetailApi = (query) => {
    return (0, http_1.httpGet)('/api/webapp/client/c/coupon/wallet/used-detail', query != null ? query : {});
};
exports.getCouponWalletUsedDetailApi = getCouponWalletUsedDetailApi;
/** 评价占位提交 */
const submitCouponWalletReviewApi = (body) => {
    return (0, http_1.httpPost)('/api/webapp/client/c/coupon/wallet/review', body);
};
exports.submitCouponWalletReviewApi = submitCouponWalletReviewApi;

/** 检查优惠券是否已收藏 */
const checkCouponFavoriteApi = (couponId) => {
    return (0, http_1.httpGet)('/api/webapp/user/favorite/coupon/isFavorited', { couponId });
};
exports.checkCouponFavoriteApi = checkCouponFavoriteApi;

/** 切换优惠券收藏状态 */
const toggleCouponFavoriteApi = (couponId, title, coverImage) => {
    return (0, http_1.httpPost)('/api/webapp/user/favorite/coupon/toggle', { couponId, title, coverImage });
};
exports.toggleCouponFavoriteApi = toggleCouponFavoriteApi;
