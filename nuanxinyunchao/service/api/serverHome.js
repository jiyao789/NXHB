import { httpGet, httpPost } from '../utils/http.js';

/** 服务端首页看板（snowy-biz-app：直连 9102 时为 /server/home/data） */
export function getServerHomeData() {
  return httpGet('/server/home/data');
}

/**
 * 服务端首页 · 排行详情（与 rankings[].subjectType 一致：MERCHANT / PARTY / NODE）
 * @param {{ id: string|number, subjectType: string }} params
 */
export function getServerRankDetail(params) {
  return httpGet('/server/home/rank/detail', params);
}

/**
 * 服务端首页 · 活动/服务/优惠详细数据报表
 * @param {{ type: number, date: string }} params type=1活动/2服务/3优惠，date=yyyy-MM
 */
export function getServerHomeAnalysis(params) {
  return httpGet('/server/home/analysis', params);
}

/** 服务端创建页统计数据（活动/优惠类型、服务高峰、用户占比） */
export function getServerCreateData() {
  return httpGet('/server/create/data');
}

/** 服务端我的核销列表（按日期分组） */
export function getServerVerificationList(params) {
  return httpGet('/server/verification/list', params);
}

/** 服务端首页 · 月度计划列表 */
export function getServerHomePlanDetail() {
  return httpGet('/server/home/plan/detail');
}

/** 服务端首页 · 删除月度计划项 */
export function deleteServerHomePlan(data) {
  return httpPost('/server/home/plan/delete?id=' + data.id);
}
