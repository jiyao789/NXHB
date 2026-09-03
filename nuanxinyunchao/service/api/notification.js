import { httpGet, httpPost } from '../utils/http';

/**
 * 获取官方通知分页 (Type 10)
 */
export const getNotificationPage = (data) => {
  return httpGet('/biz/article/page', { category: '官方通知', ...data });
};

/**
 * 获取官方通知分页 (全量，不限分类)
 */
export const getArticlePage = (data) => {
  return httpGet('/biz/article/page', data);
};

/**
 * 获取学习内容分页 (Type 0)
 */
export const getStudyPage = (data) => {
  return httpGet('/biz/article/page', { category: '学习', ...data });
};

/**
 * 获取荣誉时刻分页 (Type 6)
 */
export const getHonorPage = (data) => {
  return httpGet('/biz/article/page', { category: '我们的荣耀时刻', ...data });
};

/**
 * 获取资讯/文章详情 (官方通知、学习、荣耀通用)
 */
export const getArticleDetail = (id) => {
  return httpGet('/biz/article/detail', { id });
};

/**
 * 获取志愿者招募/我们需要你分页 (Type 2)
 */
export const getVolunteerPage = (data) => {
  return httpGet('/biz/volunteer/activity/page', data);
};

/**
 * 获取志愿者活动详情
 */
export const getVolunteerDetail = (id) => {
  return httpGet('/biz/volunteer/activity/detail', { id });
};

/**
 * 获取商户活动分页 (Type 4)
 */
export const getActivityPage = (data) => {
  return httpGet('/biz/activity/page', data);
};

/**
 * 获取商户活动详情
 */
export const getActivityDetail = (id) => {
  return httpGet('/biz/activity/detail', { id });
};

/**
 * 获取优惠券分页 (Type 8)
 */
export const getCouponPage = (data) => {
  return httpGet('/biz/coupon/page', data);
};

/**
 * 获取优惠券详情
 */
export const getCouponDetail = (id) => {
  return httpGet('/biz/coupon/detail', { id });
};

/**
 * 获取系统消息(核销、入驻申请、优惠券审核聚合)
 */
export const getSystemMessage = (data) => {
  return httpGet('/biz/message/systemMessage', data);
};

/**
 * 清除管理员的一键提醒状态
 */
export const clearRemind = () => {
  return httpPost('/biz/message/clearRemind');
};
