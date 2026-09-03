/*
 * @Author: cwkl123 1297224582@qq.com
 * @Date: 2026-05-26 10:08:06
 * @LastEditors: cwkl123 1297224582@qq.com
 * @LastEditTime: 2026-05-29 16:58:44
 * @FilePath: \nxyc\nuanxinyunchao-user\miniprogram\api\mine.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelActivityApi = exports.getActivityListApi = exports.getMineOverviewApi = void 0;
const http_1 = require("../utils/http");
/** 我的页聚合（可选，与 getLoginUserInfo + getPointsDisplay 等价） */
const getMineOverviewApi = () => {
    return (0, http_1.httpGet)("/api/webapp/client/c/user/mine/overview", {});
};
exports.getMineOverviewApi = getMineOverviewApi;
/** 获取我的活动列表（支持状态筛选和名称模糊查询） */
const getActivityListApi = (userId, status, activityTitle) => {
    const params = { userId };
    if (status !== null && status !== undefined) {
        params.status = status;
    }
    if (activityTitle) {
        params.activityTitle = activityTitle;
    }
    return (0, http_1.httpGet)("/api/webapp/client/c/user/mine/activity/list", params);
};
exports.getActivityListApi = getActivityListApi;
/** 取消活动报名 */
const cancelActivityApi = (activityId) => {
    return (0, http_1.httpPost)(`/api/webapp/client/c/user/mine/activity/cancel/${activityId}`, {});
};
exports.cancelActivityApi = cancelActivityApi;
