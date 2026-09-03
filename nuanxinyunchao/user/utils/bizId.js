"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeBizEntityId = void 0;
/** Snowflake 等 Long id 超过 JS 安全整数，禁止用 Number()；统一成纯数字字符串 */
function normalizeBizEntityId(raw) {
    if (raw == null || raw === '') {
        return '';
    }
    const s = String(raw).trim();
    if (!/^\d+$/.test(s)) {
        return '';
    }
    return s;
}
exports.normalizeBizEntityId = normalizeBizEntityId;
