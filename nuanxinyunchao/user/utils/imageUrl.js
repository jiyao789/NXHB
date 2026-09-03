"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeImageUrl = void 0;
const env_1 = require("./env");
const fixMerchantImageUrl_1 = require("./fixMerchantImageUrl");
/** 与积分页一致：相对路径拼 biz 域名，便于加载 `/api/dev/file/...` 等 */
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
