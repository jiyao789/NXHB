"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeImageUrl = void 0;
const env_1 = require("./env");
const fixMerchantImageUrl_1 = require("./fixMerchantImageUrl");
/** 将后端返回的图片路径规范成小程序可用的绝对 URL */
function normalizeImageUrl(url) {
    if (!url || typeof url !== 'string')
        return '';
    const u = url.trim();
    if (!u)
        return '';
    let out = '';
    if (/^https?:\/\//i.test(u) || /^data:image/i.test(u))
        out = u;
    else {
        const base = (0, env_1.getBizUrl)();
        if (!base)
            out = u;
        else if (u.startsWith('/'))
            out = base.replace(/\/+$/, '') + u;
        else
            out = base.replace(/\/+$/, '') + '/' + u;
    }
    return (0, fixMerchantImageUrl_1.fixMerchantImageUrl)(out);
}
exports.normalizeImageUrl = normalizeImageUrl;
