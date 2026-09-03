import { http as request } from '../utils/http.js';

/**
 * 获取C端用户分页列表 (支持商户入驻审计)
 * // C端接口
 */
export function getClientUserPage(data) {
  return request({
    url: '/api/webapp/client/user/page', 
    method: 'GET',
    data
  });
}

/**
 * 获取C端用户详情
 * // C端接口
 */
export function getClientUserDetail(id) {
  return request({
    url: '/api/webapp/client/user/detail', 
    method: 'GET',
    data: { id }
  });
}

/**
 * 启用用户 (审核通过)
 * // C端接口
 */
export function enableUser(id) {
  return request({
    url: '/api/webapp/client/user/enable', 
    method: 'POST',
    data: { id }
  });
}

/**
 * 驳回商户入驻申请
 * // C端接口
 */
export function rejectUser(data) {
  // data: { id, auditReply }
  return request({
    url: '/api/webapp/client/user/reject', 
    method: 'POST',
    data
  });
}

/**
 * 获取街道管理员列表（地理全称映射）
 * // C端接口
 */
export function getStreetList() {
  return request({
    url: '/api/webapp/auth/c/getStreetList',
    method: 'GET'
  });
}

/**
 * 根据党群中心ID获取活动列表（包含普通活动和志愿者活动）
 * @param {string} orgId - 党群中心ID（即当前账号的userId）
 * // C端接口
 */
export function getActivityListByOrgIdApi(orgId) {
  return request({
    url: '/api/webapp/client/c/user/mine/activity/org-list',
    method: 'GET',
    data: { orgId }
  });
}

/**
 * 提交意见反馈
 * @param {Object} data - SysFeedbackAddParam
 */
export function submitFeedback(data) {
  return request({
    url: '/api/webapp/biz/sys/feedback/add',
    method: 'POST',
    data
  });
}
