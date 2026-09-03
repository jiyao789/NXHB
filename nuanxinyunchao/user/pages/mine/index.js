"use strict";
const auth_1 = require("../../api/auth");
const points_1 = require("../../api/points");
const token_1 = require("../../utils/token");
const normalizeImageUrl_1 = require("../../utils/normalizeImageUrl");
const mine_1 = require("../../api/mine");

const DEFAULT_AVATAR = "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/avatar.png";

const RIDER_ROLE_LABELS = {
    1: "外卖员",
    2: "快递员",
    3: "网约车司机",
    4: "货车司机",
    5: "主播"
};
const EXTRA_ROLE_LABELS = {
    0: "商户",
    6: "街道管理员",
    7: "党群服务中心",
};

function formatExpireDot(ymd) {
    if (!ymd) {
        return "";
    }
    return String(ymd).replace(/-/g, ".");
}

function resolveRoleName(rolesId) {
    if (rolesId == null || rolesId === "") {
        return "暖新用户";
    }
    const n = Number(rolesId);
    if (!Number.isNaN(n) && Object.prototype.hasOwnProperty.call(RIDER_ROLE_LABELS, n)) {
        return RIDER_ROLE_LABELS[n];
    }
    if (!Number.isNaN(n) && Object.prototype.hasOwnProperty.call(EXTRA_ROLE_LABELS, n)) {
        return EXTRA_ROLE_LABELS[n];
    }
    return "暖新用户";
}

Page({
    data: {
        hasLogin: false,
        userInfo: {},
        roleName: "暖新用户",
        pointsBalance: 0,
        pointsExpireLabel: "",
        hasOrderRecord: false,
        showCustomModal: false,
        bannerList: [
            { id: 1, imgUrl: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/mine_banner.png" },
            { id: 2, imgUrl: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/mine_banner.png" },
        ],
        menuList: [
            { title: "我的收藏", path: "/nuanxinyunchao/user/pages-sub/mine/collection/index", iconClass: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/icon_star.png" },
            { title: "我的活动", path: "/nuanxinyunchao/user/pages-sub/mine/verify/index", iconClass: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/icon_task.png" },
            { title: "我的券包", path: "/nuanxinyunchao/user/pages-sub/mine/coupon/index", iconClass: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/icon_ticket.png" },
            { title: "我的需求反馈", path: "/nuanxinyunchao/user/pages-sub/mine/feedback/index", iconClass: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/icon_edit.png" },
            { title: "设置与安全", path: "/nuanxinyunchao/user/pages-sub/mine/setting/index", iconClass: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/mine/icon_settings.png" },
        ],
    },
    onShow() {
        void this.refreshMineData();
        if (typeof this.getTabBar === "function" && this.getTabBar()) {
            this.getTabBar().setData({
                selected: 4,
            });
        }
    },
    applyGuestUi() {
        this.setData({
            hasLogin: false,
            userInfo: { avatar: DEFAULT_AVATAR },
            roleName: "新用户",
            pointsBalance: 0,
            pointsExpireLabel: "",
        });
    },
    applyFromCacheOnly() {
        const token = token_1.tokenManager.getToken();
        const userInfo = wx.getStorageSync("userInfo") || {};
        const norm = normalizeImageUrl_1.normalizeImageUrl;
        if (!token) {
            this.applyGuestUi();
            return;
        }
        const avatar = norm(userInfo.avatar || "") || DEFAULT_AVATAR;
        this.setData({
            hasLogin: true,
            userInfo: Object.assign({}, userInfo, { avatar }),
            roleName: resolveRoleName(userInfo.rolesId),
        });
    },
    async refreshMineData() {
        const token = token_1.tokenManager.getToken();
        if (!token) {
            this.applyGuestUi();
            return;
        }
        try {
            const cachedUserInfo = wx.getStorageSync("userInfo") || {};
            const userId = cachedUserInfo.id || "";
            const [userRaw, ptsRaw, activityRes] = await Promise.all([
                auth_1.getLoginUserInfoApi(),
                points_1.getPointsDisplayApi(),
                mine_1.getActivityListApi(userId),
            ]);
            const norm = normalizeImageUrl_1.normalizeImageUrl;
            const userInfo = Object.assign({}, userRaw, {
                avatar: norm((userRaw && userRaw.avatar) || "") || DEFAULT_AVATAR,
            });
            wx.setStorageSync("userInfo", userInfo);
            const pts = ptsRaw || {};
            const dot = formatExpireDot(pts.expireDateYmd);

            const activityList = activityRes || [];
            const hasOrderRecord = activityList.some((item) => item.type === 2 && (item.status === 0 || item.status === 1));

            this.setData({
                hasLogin: true,
                userInfo,
                roleName: resolveRoleName(userInfo.rolesId),
                pointsBalance: pts.points != null ? pts.points : 0,
                pointsExpireLabel: dot || (pts.expireDate ? String(pts.expireDate) : ""),
                hasOrderRecord,
            });
        } catch (e) {
            console.error("[mine]", e);
            this.applyFromCacheOnly();
        }
    },
    handleBannerClick() {
        if (!this.data.hasLogin) {
            wx.navigateTo({ url: "/nuanxinyunchao/user/pages-sub/auth/login/index" });
            return;
        }
        if (!this.data.hasOrderRecord) {
            this.setData({ showCustomModal: true });
            return;
        }
        wx.navigateTo({ url: "/nuanxinyunchao/user/pages-sub/mine/honor/index" });
    },
    closeModal() {
        this.setData({ showCustomModal: false });
    },
    handleUserInfoClick() {
        if (!this.data.hasLogin) {
            wx.navigateTo({ url: "/nuanxinyunchao/user/pages-sub/auth/login/index" });
        } else {
            wx.navigateTo({ url: "/nuanxinyunchao/user/pages-sub/mine/setting/profile" });
        }
    },
    handleMenuClick(e) {
        const item = e.currentTarget.dataset.item;
        if (item && item.path) {
            wx.navigateTo({ url: item.path });
        }
    },
    handleIntegralClick() {
        wx.navigateTo({ url: "/nuanxinyunchao/user/pages-sub/mine/integral/index" });
    },
});
