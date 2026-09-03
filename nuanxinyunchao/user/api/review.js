"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitClientReviewApi = void 0;
const http_1 = require("../utils/http");
/** 活动等服务评价提交 */
const submitClientReviewApi = (body) => {
    return (0, http_1.httpPost)("/api/webapp/client/c/review/submit", body);
};
exports.submitClientReviewApi = submitClientReviewApi;
