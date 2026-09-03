"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOGIN_PAGE = exports.IS_DOUBLE_TOKEN = exports.AUTH_MODE = exports.BASE_URL = void 0;
/**
 * 全局配置
 */
const env = wx.getAccountInfoSync().miniProgram.envVersion || 'release';
const config = {
    develop: {
        baseUrl: 'http://localhost:9102',
        authMode: 'double'
    },
    trial: {
        baseUrl: 'http://120.25.165.230:9102',
        authMode: 'double'
    },
    release: {
        baseUrl: 'http://120.25.165.230:9102',
        authMode: 'double'
    }
};
exports.BASE_URL = config[env].baseUrl;
exports.AUTH_MODE = config[env].authMode;
exports.IS_DOUBLE_TOKEN = exports.AUTH_MODE === 'double';
exports.LOGIN_PAGE = '/nuanxinyunchao/user/pages-fg/login/login';
