"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayTaskListApi = void 0;
const http_1 = require("../utils/http");
/**
 * 获取今日任务与特殊任务（C端）
 * 后端：GET /client/c/task/list
 */
const getTodayTaskListApi = () => {
    return (0, http_1.httpGet)("/api/webapp/client/c/task/list");
};
exports.getTodayTaskListApi = getTodayTaskListApi;
/** 完成每日任务并领取积分 */
const completeTaskApi = (data) => {
    return (0, http_1.httpPost)("/api/webapp/client/c/task/complete", data);
};
exports.completeTaskApi = completeTaskApi;

