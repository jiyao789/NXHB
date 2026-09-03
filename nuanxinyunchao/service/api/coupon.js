import { http as request } from '../utils/http.js';

/**
 * 获取优惠券分页 (支持审计列表拉取)
 * // C端接口
 */
export function getCouponPage(data) {
  return request({
    url: '/api/webapp/biz/coupon/page', 
    method: 'GET',
    data
  });
}

/**
 * 获取优惠券详情
 * // C端接口
 */
export function getCouponDetail(id) {
  return request({
    url: '/api/webapp/biz/coupon/detail', 
    method: 'GET',
    data: { id }
  });
}

/**
 * 审核优惠券 (通过/驳回)
 * // C端接口
 */
export function auditCoupon(data) {
  // data: { id, auditStatus, auditReply }
  return request({
    url: '/api/webapp/biz/coupon/audit', 
    method: 'POST',
    data
  });
}
