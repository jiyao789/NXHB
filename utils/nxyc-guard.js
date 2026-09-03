/**
 * Unified Router Guard for Nuanxinyunchao (Main Package Version)
 * Intercepts navigation to User package pages to ensure authentication.
 */

const { tokenManager } = require('./nxyc-token.js'); // Use root token manager

const USER_WHITELIST = [
    '/nuanxinyunchao/user/pages/index/index',
    '/nuanxinyunchao/user/pages/hot/index',
    '/nuanxinyunchao/user/pages/map/index',
    '/nuanxinyunchao/user/pages/mine/index',
    '/nuanxinyunchao/user/pages/qrcode/index',
    '/nuanxinyunchao/user/pages-sub/auth/logo/index',
    '/nuanxinyunchao/user/pages-sub/auth/login/index',
    '/nuanxinyunchao/user/pages-sub/auth/identity/index',
    '/nuanxinyunchao/user/pages-sub/auth/verify/index',
    '/nuanxinyunchao/user/pages-fg/404/index',
    '/nuanxinyunchao/user/pages-fg/login/login',
    '/nuanxinyunchao/user/pages-fg/login/register',
    '/nuanxinyunchao/user/pages-sub/mine/setting/about/webview'
];

function initRouterInterceptor() {
    console.log('[NXYC Guard] Initializing Router Guard in Main Package...');

    const methods = ['navigateTo', 'redirectTo', 'reLaunch'];

    methods.forEach((method) => {
        const original = wx[method];

        Object.defineProperty(wx, method, {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function (opt) {
                const url = opt.url || '';

                // Only intercept User package pages
                if (!url.includes('/nuanxinyunchao/user/')) {
                    return original.call(this, opt);
                }

                const pureUrl = url.startsWith('/') ? url.split('?')[0] : '/' + url.split('?')[0];
                const hasToken = !!tokenManager.getToken();

                const isInWhitelist = USER_WHITELIST.some(path => pureUrl === path);

                console.log(`[NXYC Guard] ${method} to: ${pureUrl}, Auth: ${hasToken}, Whitelisted: ${isInWhitelist}`);

                if (isInWhitelist || hasToken) {
                    return original.call(this, opt);
                } else {
                    console.warn(`[NXYC Guard] Intercepted unauthorized access to: ${pureUrl}. Opening login modal.`);

                    const pages = getCurrentPages();
                    const currentPage = pages[pages.length - 1];

                    if (currentPage) {
                        const loginModal = currentPage.selectComponent('#global-login-modal');
                        if (loginModal) {
                            loginModal.open(opt.url);
                            return null;
                        }
                    }

                    // Fallback: direct navigation to login page
                    return wx.navigateTo({
                        url: '/nuanxinyunchao/user/pages-sub/auth/logo/index'
                    });
                }
            }
        });
    });
}

module.exports = { initRouterInterceptor };
