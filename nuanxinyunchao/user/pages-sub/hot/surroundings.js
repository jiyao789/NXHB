"use strict";
const taskReward_1 = require("../../utils/taskReward");
const hot = require("../../api/hot");
const normalizeImageUrlMod = require("../../utils/normalizeImageUrl");
const tokenMod = require("../../utils/token");

function emptyDetailInfo() {
    return {
        id: "",
        name: "加载中...",
        openTime: "--",
        address: "—",
        phone: "--",
        latitude: NaN,
        longitude: NaN,
        distance: "",
        images: [],
    };
}

function normalizeBanners(urls) {
    const out = [];
    for (let i = 0; i < urls.length; i++) {
        const u = urls[i];
        if (u) {
            out.push({ id: `b${i}`, imgUrl: u });
        }
    }
    return out;
}

Page({
    data: {
        safeAreaTop: 20,
        scene: "party",
        currentBannerIndex: 0,
        bannerList: [],
        detailInfo: emptyDetailInfo(),
        serviceList: [],
        isFavorite: false,
        showAppointment: false,
        activeService: null,
        scheduleOptions: [],
        selectedScheduleId: null,
        isSubmitting: false,
        taskInfo: {
            active: false,
            type: "",
            isCompleted: false,
        },
        countdown: 15,
        searchKeyword: "",
        searchResults: [],
        showSearchResults: false,
        isSearching: false,
        searchTimer: null,
    },
    _nodeIdStr: "",
    _favoriteLock: false,
    _likeLock: false,
    onLoad(options) {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : 20 });

        const activeTask = wx.getStorageSync("activeTask");
        if (activeTask && activeTask.active) {
            this.setData({
                "taskInfo.active": true,
                "taskInfo.type": activeTask.type,
                "taskInfo.isCompleted": activeTask.isCompleted,
                countdown:
                    activeTask.countdown !== undefined
                        ? activeTask.countdown
                        : activeTask.type === "browse_hot"
                          ? 15
                          : 0,
            });
            if (activeTask.type === "browse_hot" && !activeTask.isCompleted) {
                this.startTimer();
            }
        }

        const idRaw = options && options.id != null ? String(options.id).trim() : "";
        this._nodeIdStr = idRaw;
        const sceneRaw = options && options.scene != null ? String(options.scene).trim().toLowerCase() : "";
        const scene = sceneRaw === "warm" ? "warm" : "party";
        this.setData({ scene });

        const passedName = options.name ? decodeURIComponent(options.name) : "";
        const passedAddress = options.address ? decodeURIComponent(options.address) : "";
        if (passedName) {
            this.setData({ "detailInfo.name": passedName });
        }
        if (passedAddress) {
            this.setData({ "detailInfo.address": passedAddress });
        }

        if (idRaw) {
            void this.loadDetail(idRaw);
        } else {
            wx.showToast({ title: "缺少点位信息", icon: "none" });
        }
    },
    fetchLocation() {
        return new Promise((resolve) => {
            wx.getLocation({
                type: "gcj02",
                success: (res) => resolve({ userLat: res.latitude, userLng: res.longitude }),
                fail: () => resolve({}),
            });
        });
    },
    mapActivities(list) {
        const arr = Array.isArray(list) ? list : [];
        return arr.map((a) => ({
            activityId: String((a && a.activityId) || ""),
            time: (a && a.timeLabel) || "",
            day: Array.isArray(a && a.weekDayTags) ? a.weekDayTags : [],
            content: (a && a.title) || "",
            description: (a && a.description) || "",
            price: a && a.needPoints ? Number(a.pointsCost) || 0 : 0,
            liked: !!(a && a.likedByMe),
            likes: a && a.likes != null ? a.likes : 0,
        }));
    },
    applyPartyDetail(raw) {
        const norm = normalizeImageUrlMod.normalizeImageUrl;
        const imgs = raw && Array.isArray(raw.images) ? raw.images.map((u) => norm(u)).filter((u) => !!u) : [];
        const bannerList = normalizeBanners(imgs);
        if (!bannerList.length) {
            bannerList.push({
                id: "ph",
                imgUrl: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/room_cover.png",
            });
        }
        const lat = raw && raw.latitude != null ? Number(raw.latitude) : NaN;
        const lng = raw && raw.longitude != null ? Number(raw.longitude) : NaN;
        this.setData({
            bannerList,
            detailInfo: {
                id: String((raw && raw.id != null ? raw.id : this._nodeIdStr) || ""),
                name: (raw && raw.name) || "",
                openTime: (raw && raw.businessHours) || "",
                address: (raw && raw.address) || "",
                phone: (raw && raw.phone) || "",
                latitude: lat,
                longitude: lng,
                distance: (raw && raw.distance) || "",
                images: imgs,
            },
            isFavorite: !!(raw && raw.isFavorited),
            serviceList: this.mapActivities(raw && raw.activities),
            currentBannerIndex: 0,
        });
    },
    applyWarmMerchantDetail(raw) {
        const norm = normalizeImageUrlMod.normalizeImageUrl;
        let imgs = raw && Array.isArray(raw.images) ? raw.images.map((u) => norm(u)).filter((u) => !!u) : [];
        if (!imgs.length && raw && raw.logo) {
            imgs = [norm(raw.logo)];
        }
        const bannerList = normalizeBanners(imgs);
        if (!bannerList.length) {
            bannerList.push({
                id: "ph",
                imgUrl: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/room_cover.png",
            });
        }
        const lat = raw && raw.latitude != null ? Number(raw.latitude) : NaN;
        const lng = raw && raw.longitude != null ? Number(raw.longitude) : NaN;
        this.setData({
            bannerList,
            detailInfo: {
                id: String((raw && raw.id != null ? raw.id : this._nodeIdStr) || ""),
                name: (raw && raw.name) || "",
                openTime: (raw && raw.businessHours) || "",
                address: (raw && raw.address) || "",
                phone: (raw && raw.phone) || "",
                latitude: lat,
                longitude: lng,
                distance: (raw && raw.distance) || "",
                images: imgs,
            },
            isFavorite: !!(raw && raw.isFavorited),
            serviceList: this.mapActivities(raw && raw.activities),
            currentBannerIndex: 0,
        });
    },
    async loadDetail(idStr) {
        wx.showLoading({ title: "加载中...", mask: true });
        try {
            const loc = await this.fetchLocation();
            const query = { id: idStr };
            if (loc.userLat != null && loc.userLng != null) {
                query.userLat = loc.userLat;
                query.userLng = loc.userLng;
            }
            if (this.data.scene === "party") {
                const raw = await hot.getPartyCenterDetailApi(query);
                this.applyPartyDetail(raw);
            } else {
                const raw = await hot.getHotMerchantDetailApi(query);
                this.applyWarmMerchantDetail(raw);
            }
        } catch (e) {
            console.error("[surroundings]", e);
            wx.showToast({ title: "加载失败", icon: "none" });
        } finally {
            wx.hideLoading();
        }
    },
    handleBackToTasks() {
        const pages = getCurrentPages();
        const targetPath = "pages-sub/index/checkin/index";
        const fullUrl = "/" + targetPath;

        wx.removeStorageSync("activeTask");
        this.setData({ "taskInfo.active": false });
        this.stopTimer();

        let delta = -1;
        for (let i = pages.length - 1; i >= 0; i--) {
            const currRoute = pages[i].route;
            if (currRoute.includes("checkin/index") && i !== pages.length - 1) {
                delta = pages.length - 1 - i;
                break;
            }
        }

        if (delta > 0) {
            wx.navigateBack({ delta });
        } else {
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
            } else {
                this.stopTimer();
                this.setData({
                    "taskInfo.isCompleted": true,
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
    handleBack() {
        wx.navigateBack();
    },
    onBannerChange(e) {
        this.setData({ currentBannerIndex: e.detail.current });
    },
    openMap() {
        const lat = Number(this.data.detailInfo.latitude);
        const lng = Number(this.data.detailInfo.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            wx.showToast({ title: "坐标信息缺失", icon: "none" });
            return;
        }
        wx.openLocation({
            latitude: lat,
            longitude: lng,
            name: this.data.detailInfo.name,
            address: this.data.detailInfo.address,
            scale: 16,
        });
    },
    onPhoneTap() {
        const raw = String(this.data.detailInfo.phone || "").trim();
        if (!raw || raw === "--") {
            wx.showToast({ title: "暂无电话", icon: "none" });
            return;
        }
        const phoneNumber = raw.replace(/[^\d+]/g, "");
        if (!phoneNumber) {
            wx.showToast({ title: "号码格式不可用", icon: "none" });
            return;
        }
        wx.makePhoneCall({
            phoneNumber,
            fail: () => {
                wx.showToast({ title: "无法拨打电话", icon: "none" });
            },
        });
    },
    async toggleCollection() {
        const id = String(this.data.detailInfo.id || this._nodeIdStr || "").trim();
        if (!id) {
            wx.showToast({ title: "信息未加载完成", icon: "none" });
            return;
        }
        if (!tokenMod.tokenManager.getToken()) {
            const loginModal = this.selectComponent("#global-login-modal");
            if (loginModal) {
                loginModal.open("");
            } else {
                wx.navigateTo({ url: "/nuanxinyunchao/user/pages-sub/auth/login/index" });
            }
            return;
        }
        if (this._favoriteLock) {
            return;
        }
        this._favoriteLock = true;
        try {
            let r;
            if (this.data.scene === "party") {
                r = await hot.togglePartyCenterFavoriteApi({ partyCenterId: id });
            } else {
                r = await hot.toggleMerchantFavoriteApi({ merchantId: id });
            }
            const favorited = !!(r && r.isFavorited);
            this.setData({ isFavorite: favorited });
            wx.showToast({ title: favorited ? "已收藏" : "已取消收藏", icon: "none" });
        } catch (e) {
            console.error("[surroundings] favorite", e);
        } finally {
            this._favoriteLock = false;
        }
    },
    async toggleLike(e) {
        const index = e.currentTarget.dataset.index;
        const item = this.data.serviceList[index];
        if (!item || !item.activityId) {
            return;
        }
        if (!tokenMod.tokenManager.getToken()) {
            const loginModal = this.selectComponent("#global-login-modal");
            if (loginModal) {
                loginModal.open("");
            } else {
                wx.navigateTo({ url: "/nuanxinyunchao/user/pages-sub/auth/login/index" });
            }
            return;
        }
        if (this._likeLock) {
            return;
        }
        this._likeLock = true;
        try {
            const r = await hot.togglePartyActivityLikeApi({ activityId: item.activityId });
            const liked = !!(r && r.liked);
            const likes = r && r.likes != null ? r.likes : item.likes;
            this.setData({
                [`serviceList[${index}].liked`]: liked,
                [`serviceList[${index}].likes`]: likes,
            });
        } catch (err) {
            console.error("[surroundings] like", err);
        } finally {
            this._likeLock = false;
        }
    },
    preventTouchMove() {
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
            const raw = await hot.getHotDiscoverListApi(query);
            const list = Array.isArray(raw) ? raw : ((raw && raw.records) || (raw && raw.data) || (raw && raw.rows) || []);
            const searchResults = list.map((row) => {
                const rawType = row.type || "";
                const type = rawType === "党群服务中心" ? "暖新巢" : rawType;
                return {
                    id: row.id,
                    title: row.title || row.name || "",
                    type,
                    area: row.area || "",
                    detailScene: row.detailScene || (type === "暖新巢" ? "party" : "merchant")
                };
            });
            this.setData({ searchResults, isSearching: false });
        } catch (e) {
            console.error("[surroundings search] failed", e);
            this.setData({ isSearching: false });
        }
    },
    onSelectSearchResult(e) {
        const item = e.currentTarget.dataset.item;
        this.hideSearchResults();
        if (!item || !item.id) return;
        if (item.type === "友好商户") {
            wx.redirectTo({
                url: `/nuanxinyunchao/user/pages-sub/hot/detail?id=${item.id}`
            });
        } else if (item.type === "暖新巢") {
            const scene = item.detailScene === "party" ? "party" : "warm";
            wx.redirectTo({
                url: `/nuanxinyunchao/user/pages-sub/hot/surroundings?id=${item.id}&name=${encodeURIComponent(item.title)}&address=${encodeURIComponent(item.area || "")}&scene=${scene}`
            });
        }
    },
    async handleOpenAppointment(e) {
        const item = e.currentTarget.dataset.item;
        if (!item || !item.activityId) {
            wx.showToast({ title: "活动信息不完整", icon: "none" });
            return;
        }
        if (!tokenMod.tokenManager.getToken()) {
            const loginModal = this.selectComponent("#global-login-modal");
            if (loginModal) {
                loginModal.open("");
            } else {
                wx.navigateTo({ url: "/nuanxinyunchao/user/pages-sub/auth/login/index" });
            }
            return;
        }
        this.setData({
            activeService: item,
            showAppointment: true,
            scheduleOptions: [],
            selectedScheduleId: null,
        });
        await this.fetchServiceSchedulesApi(item.activityId);
    },
    closeAppointment() {
        this.setData({ showAppointment: false });
    },
    selectSchedule(e) {
        const id = e.currentTarget.dataset.id;
        this.setData({ selectedScheduleId: id });
    },
    async fetchServiceSchedulesApi(activityId) {
        wx.showLoading({ title: "加载排期...", mask: true });
        try {
            const list = await hot.getActivitySchedulesApi({ activityId: String(activityId) });
            const schedules = Array.isArray(list) ? list : [];
            if (!schedules.length) {
                wx.showToast({ title: "暂无可预约时间", icon: "none" });
                this.setData({
                    scheduleOptions: [],
                    selectedScheduleId: null,
                    showAppointment: false,
                });
                return;
            }
            const firstAvailable = schedules.find((s) => s && s.available) || schedules[0];
            this.setData({
                scheduleOptions: schedules,
                selectedScheduleId: firstAvailable ? firstAvailable.id : null,
            });
        } catch (err) {
            console.error("[surroundings] schedules", err);
            const msg = (err && (err.msg || err.message)) || "加载排期失败";
            if (!err || (!err.msg && !err.message)) {
                wx.showToast({ title: msg, icon: "none" });
            }
            this.setData({ showAppointment: false });
        } finally {
            wx.hideLoading();
        }
    },
    async confirmAppointment() {
        const { activeService, selectedScheduleId, isSubmitting } = this.data;
        if (isSubmitting) {
            return;
        }
        if (!selectedScheduleId) {
            wx.showToast({ title: "请选择预约时间", icon: "none" });
            return;
        }
        if (!activeService || !activeService.activityId) {
            wx.showToast({ title: "活动信息不完整", icon: "none" });
            return;
        }
        if (!tokenMod.tokenManager.getToken()) {
            const loginModal = this.selectComponent("#global-login-modal");
            if (loginModal) {
                loginModal.open("");
            } else {
                wx.navigateTo({ url: "/nuanxinyunchao/user/pages-sub/auth/login/index" });
            }
            return;
        }
        this.setData({ isSubmitting: true });
        try {
            await hot.createActivityAppointmentApi({
                activityId: String(activeService.activityId),
                scheduleDate: String(selectedScheduleId),
            });
            this.setData({
                isSubmitting: false,
                showAppointment: false,
            });
            wx.showToast({
                title: "预约成功",
                icon: "success",
                duration: 2000,
            });
        } catch (err) {
            console.error("[surroundings] appointment", err);
            this.setData({ isSubmitting: false });
            const msg = (err && (err.msg || err.message)) || "预约失败";
            if (!err || (!err.msg && !err.message)) {
                wx.showToast({ title: msg, icon: "none" });
            }
        }
    },
});
