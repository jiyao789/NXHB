import { httpPost, httpGet } from '../utils/http.js';

/**
 * 获取手机验证码
 */
export const getPhoneValidCode = (data) => {
  return httpPost('/api/webapp/auth/c/getPhoneValidCode', data);
};

/**
 * 手机验证码登录
 */
export const loginByPhone = (data) => {
  return httpPost('/api/webapp/auth/c/loginByPhone', data);
};

/**
 * 密码登录
 */
export const loginByPassword = (data) => {
  return httpPost('/api/webapp/auth/c/loginByPassword', data);
};

/**
 * 获取当前登录用户信息
 */
export const getLoginUserInfo = () => {
  return httpGet('/api/webapp/auth/c/getLoginUserInfo');
};

/**
 * 商户入驻注册
 */
export const registerMerchant = (data) => {
  return httpPost('/api/webapp/auth/c/register', data);
};

/**
 * 更新用户信息
 */
export const updateUserInfo = (data) => {
  return httpPost('/api/webapp/auth/c/updateUserInfo', data);
};

/**
 * 获取邀请码列表 (街道管理员专用)
 */
export const getInvitationList = (params) => {
  return httpGet('/api/webapp/auth/c/invitation/page', params);
};

/**
 * 生成邀请码 (街道管理员专用)
 */
export const generateInvitation = (data) => {
  return httpPost('/api/webapp/auth/c/invitation/add', data);
};

/**
 * 删除邀请码 (街道管理员专用)
 */
export const deleteInvitations = (ids) => {
  return httpPost('/api/webapp/auth/c/invitation/delete', ids);
};

/**
 * 获取已入驻党群中心列表 (街道管理员专用)
 */
export const getBoundPartyCenters = () => {
  return httpGet('/api/webapp/auth/c/invitation/getBoundPartyCenters');
};

/**
 * 获取用户注册邀请码列表 (街道管理员专用)
 */
export const getUserInvitationList = (params) => {
  return httpGet('/api/webapp/auth/c/userInvitation/page', params);
};

/**
 * 生成用户注册邀请码 (街道管理员专用)
 */
export const generateUserInvitation = (data) => {
  return httpPost('/api/webapp/auth/c/userInvitation/add', data);
};

/**
 * 删除用户注册邀请码 (街道管理员专用)
 */
export const deleteUserInvitations = (ids) => {
  return httpPost('/api/webapp/auth/c/userInvitation/delete', ids);
};

/**
 * 查询用户注册邀请码详情（含注册人信息）
 */
export const getUserInvitationDetail = (id) => {
  return httpGet('/api/webapp/auth/c/userInvitation/detail', { id });
};
