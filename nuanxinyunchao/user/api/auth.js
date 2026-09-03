"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserInfoApi = exports.getLoginUserInfoApi = exports.sendSmsApi = exports.registerApi = void 0;
const http_1 = require("../utils/http");

/**
 * 注册接口
 * @param data 注册参数 (NxycClientRegisterParam)
 */
// C端用户自主注册
const registerApi = (data) => {
    return (0, http_1.httpPost)('/api/webapp/auth/c/register', data);
};
exports.registerApi = registerApi;

// 获取当前登录用户信息
const getLoginUserInfoApi = () => {
    return (0, http_1.httpGet)('/api/webapp/auth/c/getLoginUserInfo');
};
exports.getLoginUserInfoApi = getLoginUserInfoApi;

/**
 * 手机号登录 (验证码)
 * @param data 登录参数 (NxycClientLoginParam)
 */
const loginByPhoneApi = (data) => {
    return (0, http_1.httpPost)('/api/webapp/auth/c/loginByPhone', data, { hideErrorToast: true });
};
exports.loginByPhoneApi = loginByPhoneApi;

/**
 * 获取手机验证码 (暖新云巢专用)
 * @param phone 手机号
 * @param validCodeReqNo 请求序列号
 * @param isRegister 是否为注册场景 (Boolean)
 */
const sendSmsApi = (phone, validCodeReqNo, isRegister) => {
    return (0, http_1.httpPost)('/api/webapp/auth/c/getPhoneValidCode', { phone, validCodeReqNo, isRegister });
};
exports.sendSmsApi = sendSmsApi;
const deleteAccountApi = () => {
    return (0, http_1.httpPost)('/api/webapp/auth/c/deleteAccount');
};
exports.deleteAccountApi = deleteAccountApi;

/**
 * 更新个人信息
 * @param data (NxycClientUserUpdateParam)
 */
const updateUserInfoApi = (data) => {
    return (0, http_1.httpPost)('/api/webapp/auth/c/updateUserInfo', data);
};
exports.updateUserInfoApi = updateUserInfoApi;
