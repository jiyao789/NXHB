"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixMerchantImageUrl = void 0;
/** 后端常用占位 rank_data.png，COS 上多为 404；统一替换为已知可用的商户默认图 */
var RANK_DATA_RE = /rank_data\.png/i;
var FALLBACK_MERCHANT_IMG = "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/map/icon_logo_white.png";
function fixMerchantImageUrl(url) {
    if (!url || typeof url !== "string")
        return "";
    var u = url.trim();
    if (!u)
        return "";
    if (RANK_DATA_RE.test(u))
        return FALLBACK_MERCHANT_IMG;
    return u;
}
exports.fixMerchantImageUrl = fixMerchantImageUrl;
