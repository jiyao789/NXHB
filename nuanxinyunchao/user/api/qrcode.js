"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserWarmQrCodeApi = void 0;
const http_1 = require("../utils/http");
/** C 端暖新二维码展示数据（短时核销票据 token + FID + 用户名 + 头像） */
const getUserWarmQrCodeApi = () => {
    return (0, http_1.httpGet)("/api/webapp/client/c/user/qrcode");
};
exports.getUserWarmQrCodeApi = getUserWarmQrCodeApi;
