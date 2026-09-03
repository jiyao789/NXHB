const { httpGet, httpPost } = require('../utils/http.js');

/**
 * 统一发布内容接口
 * 支持学习、招募、活动、荣耀、票券、官方通知
 */
function publishContent(data) {
  return httpPost('/api/webapp/biz/creator/publish', data);
}

/**
 * 保存或更新草稿
 */
function addOrUpdateDraft(data) {
  return httpPost('/api/webapp/biz/creator/draft/addOrUpdate', data);
}

/**
 * 获取我的草稿列表
 */
function getMyDraftList() {
  return httpGet('/api/webapp/biz/creator/draft/myList');
}

/**
 * 删除草稿
 */
function deleteDraft(data) {
  return httpPost('/api/webapp/biz/creator/draft/delete', data);
}

/**
 * 获取我的发布分页记录（统合查询文章、活动、票券）
 */
function getMyPublishPage(data) {
  return httpGet('/api/webapp/biz/creator/my/publish/page', data);
}
/**
 * 删除我的发布
 */
function deletePublish(data) {
  return httpPost('/api/webapp/biz/creator/my/publish/delete', data);
}

module.exports = {
  publishContent,
  addOrUpdateDraft,
  getMyDraftList,
  deleteDraft,
  getMyPublishPage,
  deletePublish
};
