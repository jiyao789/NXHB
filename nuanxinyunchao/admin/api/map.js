"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMapPointsApi = void 0;
exports.getMapPointDetailApi = void 0;
const http_1 = require("../utils/http");
/**
 * C 端地图点位列表（需 clientToken）
 * 后端：GET /client/c/map/points ，参数 userLat,userLng,radius?,category?
 */
const getMapPointsApi = (data) => {
    return (0, http_1.httpGet)("/api/webapp/client/c/map/points", data, { hideErrorToast: false });
};
exports.getMapPointsApi = getMapPointsApi;
/**
 * C 端地图点位详情（需 clientToken）
 * 后端：GET /client/c/map/point/detail ，参数 id, nearbyRadius?, nearbyLimit?
 */
const getMapPointDetailApi = (data) => {
    return (0, http_1.httpGet)("/api/webapp/client/c/map/point/detail", data, { hideErrorToast: false });
};
exports.getMapPointDetailApi = getMapPointDetailApi;
