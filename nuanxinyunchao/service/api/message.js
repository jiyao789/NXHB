import { httpGet } from '../utils/http';

/**
 * 获取点赞消息列表
 */
export const getMessageLikesPage = (data) => {
  return httpGet('/biz/message/likes/page', data);
};

/**
 * 获取收藏消息列表
 */
export const getMessageFavoritesPage = (data) => {
  return httpGet('/biz/message/favorites/page', data);
};
