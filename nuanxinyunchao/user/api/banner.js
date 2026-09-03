"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomeBannerListApi = void 0;
const http_1 = require("../utils/http");
/**
 * 首页 Banner（scene=HOME）
 */
const getHomeBannerListApi = () => {
    return (0, http_1.httpGet)('/api/webapp/client/c/hot/banner/list', { scene: 'HOME' });
};
exports.getHomeBannerListApi = getHomeBannerListApi;

