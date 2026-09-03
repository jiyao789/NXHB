import { httpPost, httpGet } from '../utils/http.js';

/**
 * 统一发布内容接口
 * 支持学习、招募、活动、荣耀、票券、官方通知
 */
export const publishContent = (data) => {
  return httpPost('/api/webapp/biz/creator/publish', data);
};

/**
 * 保存或更新草稿
 */
export const addOrUpdateDraft = (data) => {
  return httpPost('/api/webapp/biz/creator/draft/addOrUpdate', data);
};

/**
 * 获取我的草稿列表
 */
export const getMyDraftList = () => {
  return httpGet('/api/webapp/biz/creator/draft/myList');
};

/**
 * 删除草稿
 */
export const deleteDraft = (data) => {
  return httpPost('/api/webapp/biz/creator/draft/delete', data);
};
/**
 * 获取我的发布分页记录（统合查询文章、活动、票券）
 */
export const getMyPublishPage = (data) => {
  return httpGet('/api/webapp/biz/creator/my/publish/page', data);
};
