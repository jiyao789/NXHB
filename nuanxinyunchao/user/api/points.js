"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPointsLedgerPageApi = void 0;
exports.getPointsLedgerSummaryApi = void 0;
exports.getCouponClientListApi = void 0;
exports.getPointsEarnFeedApi = void 0;
exports.getPointsDisplayApi = void 0;
const http_1 = require("../utils/http");
/** C端积分卡片：总数、有效期、规则列表 */
const getPointsDisplayApi = () => {
    return (0, http_1.httpGet)("/api/webapp/client/c/points/display");
};
exports.getPointsDisplayApi = getPointsDisplayApi;
/** C端赚积分瀑布流（biz_article） */
const getPointsEarnFeedApi = (data) => {
    return (0, http_1.httpGet)("/api/webapp/client/c/points/earn-feed", data);
};
exports.getPointsEarnFeedApi = getPointsEarnFeedApi;
/** 兑换券列表，可按积分区间筛选（服务端过滤） */
const getCouponClientListApi = (data) => {
    return (0, http_1.httpGet)("/api/webapp/biz/coupon/client/list", data);
};
exports.getCouponClientListApi = getCouponClientListApi;
/** 积分明细汇总 */
const getPointsLedgerSummaryApi = () => {
    return (0, http_1.httpGet)("/api/webapp/client/c/points/ledger/summary", {});
};
exports.getPointsLedgerSummaryApi = getPointsLedgerSummaryApi;
/** 积分明细分页 type: 0 全部，1 获取，2 消耗 */
const getPointsLedgerPageApi = (query) => {
    return (0, http_1.httpGet)("/api/webapp/client/c/points/ledger/page", query !== null && query !== void 0 ? query : {});
};
exports.getPointsLedgerPageApi = getPointsLedgerPageApi;
