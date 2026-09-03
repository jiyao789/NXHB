"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("./utils/token");
// app.ts
App({
    globalData: {},
    onLaunch(options) {
        console.log('App Launch', options);
        // 展示本地存储能力
        const logs = wx.getStorageSync('logs') || [];
        logs.unshift(Date.now());
        wx.setStorageSync('logs', logs);
        // 挂载全局路由拦截器 (白名单策略)
        this.initRouterInterceptor();
        // 登录
        wx.login({
            success: res => {
                console.log(res.code);
                // 发送 res.code 到后台换取 openId, sessionKey, unionId
            },
        });
    },
    // 挂载拦截器，接管所有的跳转 API
    initRouterInterceptor() {
        const whitelist = [
            '/nuanxinyunchao/user/pages/index/index',
            '/nuanxinyunchao/user/pages-sub/auth/login/index', // 登录页必须白名单，否则死循环
            '/nuanxinyunchao/user/pages-sub/auth/identity/index', // 身份认证
            '/nuanxinyunchao/user/pages-fg/404/index',
            '/nuanxinyunchao/user/pages-sub/auth/verify/index', // 注册
            '/nuanxinyunchao/user/pages/index/index', // 首页
            '/nuanxinyunchao/user/pages/mine/index', // 我的页面 (建议放行，点击里面按钮再拦截)
            '/nuanxinyunchao/user/pages/map/index', // 地图
            '/nuanxinyunchao/user/pages-sub/mine/setting/about/webview'
        ];
        const methods = ['navigateTo', 'redirectTo', 'switchTab'];
        methods.forEach((method) => {
            // @ts-ignore
            const original = wx[method];
            // @ts-ignore
            Object.defineProperty(wx, method, {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function (opt) {
                    let url = opt.url || '';
                    // 处理绝对路径和去除参数
                    if (url.startsWith('.')) {
                        console.warn('[Router Guard] Warning: Intercepting relative path may fail without current page context');
                    }
                    const pureUrl = url.startsWith('/') ? url.split('?')[0] : '/' + url.split('?')[0];
                    // 在白名单里，或者已经携带 Token，则放行
                    if (whitelist.includes(pureUrl) || token_1.tokenManager.getToken()) {
                        return original.call(this, opt);
                    }
                    else {
                        console.warn(`[Router Guard] 拦截未登录访问: ${pureUrl}，呼叫自定义登录弹窗`);
                        const pages = getCurrentPages();
                        const currentPage = pages[pages.length - 1];
                        if (currentPage) {
                            const loginModal = currentPage.selectComponent('#global-login-modal');
                            if (loginModal) {
                                loginModal.open(opt.url);
                                return null;
                            }
                        }
                        // 降级保护：如果当前页没有挂载组件，直接跳转
                        return wx.navigateTo({
                            url: '/nuanxinyunchao/user/pages-sub/auth/login/index'
                        });
                    }
                }
            });
        });
    },
    onShow(options) {
        console.log('App Show', options);
    },
    onHide() {
        console.log('App Hide');
    }
});
