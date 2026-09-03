"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeArticleReadApi = void 0;
exports.toggleArticleFavoriteApi = void 0;
exports.toggleArticleLikeApi = void 0;
exports.getArticleDetailExtraApi = void 0;
exports.getArticleDetailApi = void 0;
exports.getArticlePageApi = void 0;
const http_1 = require("../utils/http");

/**
 * 分页获取文章列表
 * @param data (ArticlePageParam)
 */
const getArticlePageApi = (data) => {
    return (0, http_1.httpGet)('/api/webapp/biz/article/page', data);
};
exports.getArticlePageApi = getArticlePageApi;
/**
 * 获取文章详情
 * @param data ({id: string, type: number})
 */
const getArticleDetailApi = (data) => {
    return (0, http_1.httpGet)('/api/webapp/biz/content/manage/detail', data);
};
exports.getArticleDetailApi = getArticleDetailApi;
/** C 端文章详情扩展：点赞数、是否点赞/收藏、最短阅读秒数 */
const getArticleDetailExtraApi = (data) => {
    return (0, http_1.httpGet)('/api/webapp/client/c/article/detail-extra', data);
};
exports.getArticleDetailExtraApi = getArticleDetailExtraApi;
/** 切换点赞 */
const toggleArticleLikeApi = (data) => {
    return (0, http_1.httpPost)('/api/webapp/client/c/article/like/toggle', data);
};
exports.toggleArticleLikeApi = toggleArticleLikeApi;
/** 切换收藏（articleId + 可选 isVideo） */
const toggleArticleFavoriteApi = (data) => {
    return (0, http_1.httpPost)('/api/webapp/client/c/article/favorite/toggle', data);
};
exports.toggleArticleFavoriteApi = toggleArticleFavoriteApi;
/** 阅读完成上报（停留达标后调用一次） */
const completeArticleReadApi = (data) => {
    return (0, http_1.httpPost)('/api/webapp/client/c/article/read/complete', data);
};
exports.completeArticleReadApi = completeArticleReadApi;
