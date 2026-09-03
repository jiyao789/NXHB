"use strict";
const taskReward_1 = require("../../utils/taskReward");
const hot_1 = require("../../api/hot");
const normalizeImageUrl_1 = require("../../utils/normalizeImageUrl");
const token_1 = require("../../utils/token");
const AMAP_KEY = '9d4b6a203c25489f882b09b20f0771e5';

function emptyShopInfo() {
    return {
        id: '',
        name: '',
        avatar: '',
        businessHours: '',
        address: '',
        subTitle: '',
        slogan: '',
        intro: '',
        distance: '',
        latitude: NaN,
        longitude: NaN,
    };
}
Page({
    data: {
        safeAreaTop: 20,
        detailLoading: true,
        shopInfo: emptyShopInfo(),
        isFavorite: false,
        staticMapUrl: '',
        couponList: [],
        taskInfo: {
            active: false,
            type: '',
            isCompleted: false,
        },
        countdown: 15,
        searchKeyword: "",
        searchResults: [],
        showSearchResults: false,
        isSearching: false,
        searchTimer: null,
    },
    _merchantIdStr: '',
    _favoriteToggleLock: false,
    onLoad(options) {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaTop: sysInfo.statusBarHeight || 20 });
        const idRaw = options && options.id != null ? String(options.id).trim() : '';
        this._merchantIdStr = idRaw;
        const activeTask = wx.getStorageSync('activeTask');
        if (activeTask && activeTask.active) {
            this.setData({
                'taskInfo.active': true,
                'taskInfo.type': activeTask.type,
                'taskInfo.isCompleted': activeTask.isCompleted,
                countdown: activeTask.countdown !== undefined ? activeTask.countdown : (activeTask.type === 'browse_hot' ? 15 : 0),
            });
            if (activeTask.type === 'browse_hot' && !activeTask.isCompleted) {
                this.startTimer();
            }
        }
        if (idRaw) {
            void this.fetchMerchantDetail(idRaw);
        }
        else {
            this.setData({ detailLoading: false });
            wx.showToast({ title: '缺少商户信息', icon: 'none' });
        }
    },
    fetchLocation() {
        return new Promise((resolve) => {
            wx.getLocation({
                type: 'gcj02',
                success: (res) => resolve({ userLat: res.latitude, userLng: res.longitude }),
                fail: () => resolve({}),
            });
        });
    },
    async fetchMerchantDetail(idStr) {
        this.setData({ detailLoading: true });
        wx.showNavigationBarLoading({});
        try {
            const loc = await this.fetchLocation();
            const query = { id: idStr };
            if (loc.userLat != null && loc.userLng != null) {
                query.userLat = loc.userLat;
                query.userLng = loc.userLng;
            }
            const raw = await (0, hot_1.getHotMerchantDetailApi)(query);
            const norm = normalizeImageUrl_1.normalizeImageUrl;
            const shopInfo = emptyShopInfo();
            shopInfo.id = String(raw && raw.id != null ? raw.id : idStr);
            shopInfo.name = (raw && raw.name) ? raw.name : '';
            shopInfo.avatar = norm((raw && raw.logo) ? raw.logo : '');
            shopInfo.businessHours = (raw && raw.businessHours) ? raw.businessHours : '';
            shopInfo.address = (raw && raw.address) ? raw.address : '';
            shopInfo.subTitle = (raw && raw.subTitle) ? raw.subTitle : '';
            shopInfo.slogan = (raw && raw.slogan) ? raw.slogan : '';
            shopInfo.intro = (raw && raw.intro) ? raw.intro : '';
            shopInfo.distance = (raw && raw.distance) ? raw.distance : '';
            const lat = raw && raw.latitude != null ? Number(raw.latitude) : NaN;
            const lng = raw && raw.longitude != null ? Number(raw.longitude) : NaN;
            shopInfo.latitude = lat;
            shopInfo.longitude = lng;
            const couponList = [];
            const list = raw && Array.isArray(raw.coupons) ? raw.coupons : [];
            for (let i = 0; i < list.length; i++) {
                const c = list[i];
                couponList.push({
                    id: String(c && c.id != null ? c.id : ''),
                    title: (c && c.title) ? c.title : '',
                    image: norm((c && c.imgUrl) ? c.imgUrl : ''),
                    points: c && c.price != null ? c.price : 0,
                    scopeLabel: (c && c.scopeLabel) ? c.scopeLabel : '',
                    couponKindLabel: (c && c.couponKindLabel) ? c.couponKindLabel : '',
                });
            }
            this.setData({
                shopInfo,
                couponList,
                isFavorite: !!(raw && raw.isFavorited),
                detailLoading: false,
            }, () => this.generateStaticMapUrl());
        }
        catch (e) {
            console.error('[hot/detail]', e);
            this.setData({ detailLoading: false });
        }
        finally {
            wx.hideNavigationBarLoading();
        }
    },
    handleBackToTasks() {
        const pages = getCurrentPages();
        const targetPath = 'pages-sub/index/checkin/index';
        const fullUrl = '/' + targetPath;
        console.log('[Task] Current Stack Routes:', pages.map(p => p.route));
        wx.removeStorageSync('activeTask');
        this.setData({ 'taskInfo.active': false });
        this.stopTimer();
        let delta = -1;
        for (let i = pages.length - 1; i >= 0; i--) {
            const currRoute = pages[i].route;
            if (currRoute.includes('checkin/index') && i !== pages.length - 1) {
                delta = pages.length - 1 - i;
                console.log('[Task] Found Task Center at stack index:', i, 'delta:', delta);
                break;
            }
        }
        if (delta > 0) {
            wx.navigateBack({ delta });
        }
        else {
            console.log('[Task] Task Center not in stack, opening new page:', fullUrl);
            wx.navigateTo({ url: fullUrl });
        }
    },
    onUnload() {
        if (this.data.taskInfo.active) {
            (0, taskReward_1.snapshotActiveTaskFromPage)(this.data.taskInfo, this.data.countdown);
        }
        this.stopTimer();
    },
    startTimer() {
        this.stopTimer();
        this.timer = setInterval(() => {
            if (this.data.countdown > 0) {
                const next = this.data.countdown - 1;
                this.setData({ countdown: next });
                (0, taskReward_1.persistActiveTask)({ countdown: next });
            }
            else {
                this.stopTimer();
                this.setData({
                    'taskInfo.isCompleted': true,
                });
                (0, taskReward_1.markTaskCompletedAndClaim)();
            }
        }, 1000);
    },
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },
    generateStaticMapUrl() {
        const lat = this.data.shopInfo.latitude;
        const lng = this.data.shopInfo.longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            this.setData({ staticMapUrl: '' });
            return;
        }
        const url = `https://restapi.amap.com/v3/staticmap?location=${lng},${lat}&zoom=16&size=750*600&scale=2&key=${AMAP_KEY}`;
        this.setData({ staticMapUrl: url });
    },
    handleBack() {
        wx.navigateBack();
    },
    openRealMap() {
        const lat = Number(this.data.shopInfo.latitude);
        const lng = Number(this.data.shopInfo.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            wx.showToast({ title: '暂无位置信息', icon: 'none' });
            return;
        }
        wx.openLocation({
            latitude: lat,
            longitude: lng,
            name: this.data.shopInfo.name || '目的地',
            address: this.data.shopInfo.address || '',
            scale: 16,
        });
    },
    async toggleFavorite() {
        const mid = String(this.data.shopInfo.id || this._merchantIdStr || '').trim();
        if (!mid) {
            wx.showToast({ title: '商户信息未加载完成', icon: 'none' });
            return;
        }
        if (!token_1.tokenManager.getToken()) {
            const loginModal = this.selectComponent('#global-login-modal');
            if (loginModal) {
                loginModal.open('');
            }
            else {
                wx.navigateTo({ url: '/nuanxinyunchao/user/pages-sub/auth/login/index' });
            }
            return;
        }
        if (this._favoriteToggleLock)
            return;
        this._favoriteToggleLock = true;
        try {
            const r = await (0, hot_1.toggleMerchantFavoriteApi)({ merchantId: mid });
            const favorited = !!(r && r.isFavorited);
            this.setData({ isFavorite: favorited });
            wx.showToast({ title: favorited ? '已收藏' : '已取消收藏', icon: 'none' });
        }
        catch (e) {
            console.error('[hot/detail] favorite', e);
        }
        finally {
            this._favoriteToggleLock = false;
        }
    },
    handleToQrcode() {
        wx.navigateTo({ url: '/nuanxinyunchao/user/pages-sub/qrcode/index' });
    },
    handleUse(e) {
        const id = e.currentTarget.dataset.id;
        if (!id) {
            wx.showToast({ title: '缺少优惠券信息', icon: 'none' });
            return;
        }
        wx.navigateTo({
            url: `/nuanxinyunchao/user/pages-sub/mine/coupon/detail?id=${encodeURIComponent(id)}`,
        });
    },
    hideSearchResults() {
        this.setData({ showSearchResults: false });
    },
    onSearchFocus() {
        this.setData({ showSearchResults: true });
        if (this.data.searchResults.length === 0) {
            this.fetchSearchResults(this.data.searchKeyword || "");
        }
    },
    onSearchInput(e) {
        const keyword = e.detail.value;
        this.setData({ searchKeyword: keyword, showSearchResults: true });
        if (this.data.searchTimer) {
            clearTimeout(this.data.searchTimer);
        }
        const timer = setTimeout(() => {
            this.fetchSearchResults(keyword);
        }, 300);
        this.setData({ searchTimer: timer });
    },
    async fetchSearchResults(keyword) {
        this.setData({ isSearching: true });
        try {
            const query = {};
            if (keyword) {
                query.keyword = keyword;
            }
            const raw = await hot_1.getHotDiscoverListApi(query);
            const list = Array.isArray(raw) ? raw : ((raw && raw.records) || (raw && raw.data) || (raw && raw.rows) || []);
            const searchResults = list.map((row) => {
                const rawType = row.type || "";
                const type = rawType === "党群服务中心" ? "暖新巢" : rawType;
                return {
                    id: row.id,
                    title: row.title || row.name || "",
                    type,
                    area: row.area || "",
                    detailScene: row.detailScene || (type === "暖新巢" ? "warm" : "merchant")
                };
            });
            this.setData({ searchResults, isSearching: false });
        } catch (e) {
            console.error("[detail search] failed", e);
            this.setData({ isSearching: false });
        }
    },
    onSelectSearchResult(e) {
        const item = e.currentTarget.dataset.item;
        this.hideSearchResults();
        if (!item || !item.id) return;
        if (item.type === "友好商户") {
            wx.navigateTo({
                url: `/nuanxinyunchao/user/pages-sub/hot/detail?id=${item.id}`
            });
        } else if (item.type === "暖新巢") {
            const scene = item.detailScene === "party" ? "party" : "warm";
            wx.navigateTo({
                url: `/nuanxinyunchao/user/pages-sub/hot/surroundings?id=${item.id}&name=${encodeURIComponent(item.title)}&address=${encodeURIComponent(item.area || "")}&scene=${scene}`
            });
        }
    },
});
