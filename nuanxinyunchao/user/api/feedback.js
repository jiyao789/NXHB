"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeedbackListApi = exports.getFeedbackDetailApi = void 0;
const http_1 = require("../utils/http");

/**
 * 获取需求反馈列表
 * @param {Object} data 分页及查询参数
 */
const getFeedbackListApi = (data = {}) => {
    return (0, http_1.httpGet)("/api/webapp/biz/sys/feedback/page", data);
};
exports.getFeedbackListApi = getFeedbackListApi;

/**
 * 获取需求反馈详情
 * @param {Object} data 包含 id 的查询参数 { id: 'xxx' }
 */
const getFeedbackDetailApi = (data) => {
    return (0, http_1.httpGet)("/api/webapp/biz/sys/feedback/detail", data);
};
exports.getFeedbackDetailApi = getFeedbackDetailApi;
