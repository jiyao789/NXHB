"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postUserSignInApi = exports.getUserSignInDataApi = void 0;
const http_1 = require("../utils/http");
/**
 * 获取签到页数据
 * 后端：GET /biz/user/signIn/data
 */
const getUserSignInDataApi = () => {
    // 统一使用网关风格路径，直连业务端口时会自动剥离 /api/webapp
    return (0, http_1.httpGet)("/api/webapp/client/c/user/signIn/data");
};
exports.getUserSignInDataApi = getUserSignInDataApi;
/**
 * 执行签到
 * 后端：POST /biz/user/signIn
 */
const postUserSignInApi = () => {
    // 统一使用网关风格路径，直连业务端口时会自动剥离 /api/webapp
    return (0, http_1.httpPost)("/api/webapp/client/c/user/signIn");
};
exports.postUserSignInApi = postUserSignInApi;

