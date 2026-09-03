"use strict";
const adminApi = require("../../../../api/adminStatistics");
const DEFAULT_LAT = 31.218;
const DEFAULT_LNG = 121.422;
const categoryData = [
    { id: "store", name: "暖新巢旗舰店", icon: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/map/icon_logo_white.png", orangeIcon: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/map/icon_logo_orange.png" },
    { id: "toilet", name: "公共厕所", icon: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/map/icon_toilet.png", orangeIcon: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/map/icon_toilet.png" },
    { id: "dining", name: "优惠就餐点", icon: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/map/icon_medical.png", orangeIcon: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/map/icon_medical.png" }
];
/** 后端 List / 分页结构兼容 */
function normalizePointList(arr) {
    return (arr || [])
        .map((item) => {
            if (!item) {
                return null;
            }
            const latitude = parseFloat(item.lat != null ? item.lat : item.latitude);
            const longitude = parseFloat(item.lng != null ? item.lng : item.longitude);
            if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
                return null;
            }
            return Object.assign({}, item, {
                lat: latitude,
                lng: longitude
            });
        })
        .filter(Boolean);
}
function filterPointsByCategory(points, categoryId) {
    if (!points || points.length === 0) {
        return [];
    }
    const hay = (p) => `${p.category || ""} ${p.name || ""}`;
    if (categoryId === "store") {
        return points.filter((p) => p.rolesId === 7 && p.userStatus === 'ENABLE');
    }
    if (categoryId === "toilet") {
        return points.filter((p) => /厕|洗手|公共卫生|卫生间|WC/i.test(hay(p)));
    }
    if (categoryId === "charging") {
        return points.filter((p) => /充电|电站|桩/i.test(hay(p)));
    }
    if (categoryId === "dining") {
        return points.filter((p) => /就餐点/i.test(hay(p)));
    }
    return points;
}
Page({
    data: {
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LNG,
        scale: 16,
        statusBarHeight: 0,
        navBarHeight: 0,
        activeCategory: "store",
        categoryList: categoryData,
        searchKeyword: "",
        searchResults: [],
        showSearchResults: false,
        isSearching: false,
        searchTimer: null,
        displayMarkers: [],
        centerMarker: null
    },
    preventBubble() {},
    hidePanels() {
        this.hideSearchResults();
        this.setData({ centerMarker: null });
    },
    handleBack() {
        wx.navigateBack();
    },
    onLoad() {
        const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
        const systemInfo = wx.getSystemInfoSync();
        const statusBarHeight = systemInfo.statusBarHeight || 20;
        const navBarHeight = (menuButtonInfo.top - statusBarHeight) * 2 + menuButtonInfo.height;
        this.setData({ statusBarHeight, navBarHeight });
        this._rawPoints = [];
        this.reloadMapCenterAndPoints();
    },
    onShow() {
        if (typeof this.getTabBar === "function" && this.getTabBar()) {
            this.getTabBar().setData({ selected: 1 });
        }
    },
    reloadMapCenterAndPoints() {
        wx.showLoading({ title: "加载中", mask: true });
        const finish = () => wx.hideLoading();
        wx.getLocation({
            type: "gcj02",
            success: (res) => {
                this.fetchPoints(res.latitude, res.longitude).then(finish).catch(finish);
            },
            fail: () => {
                wx.showToast({ icon: "none", title: "未授权定位，使用默认视野" });
                this.fetchPoints(DEFAULT_LAT, DEFAULT_LNG).then(finish).catch(finish);
            }
        });
    },
    fetchPoints(userLat, userLng, options) {
        const opts = options || {};
        const isFallback = !!opts.isFallback;
        const lat = typeof userLat === "number" ? userLat : parseFloat(userLat);
        const lng = typeof userLng === "number" ? userLng : parseFloat(userLng);
        const centerLat = !Number.isNaN(lat) ? lat : DEFAULT_LAT;
        const centerLng = !Number.isNaN(lng) ? lng : DEFAULT_LNG;
        this.setData({ latitude: centerLat, longitude: centerLng });
        const radiusM = isFallback ? 200000 : 50000;
        return adminApi
            .getMapPoints({
                userLat: centerLat,
                userLng: centerLng,
                radius: radiusM
            })
            .then((list) => {
                let arr = [];
                if (Array.isArray(list)) {
                    arr = list;
                }
                else if (list != null && Array.isArray(list.records)) {
                    arr = list.records;
                }
                else if (list != null && Array.isArray(list.data)) {
                    arr = list.data;
                }
                const points = normalizePointList(arr);
                if (points.length === 0 && !isFallback) {
                    const atDefault =
                        Math.abs(centerLat - DEFAULT_LAT) < 0.0002 &&
                        Math.abs(centerLng - DEFAULT_LNG) < 0.0002;
                    if (!atDefault) {
                        return this.fetchPoints(DEFAULT_LAT, DEFAULT_LNG, { isFallback: true });
                    }
                }
                this._rawPoints = points;
                this.setData({
                    latitude: isFallback ? DEFAULT_LAT : centerLat,
                    longitude: isFallback ? DEFAULT_LNG : centerLng
                });
                this.updateMarkers(this.data.activeCategory);
                if (points.length === 0) {
                    wx.showToast({
                        icon: "none",
                        title: "当前范围内暂无收录点位",
                        duration: 2200
                    });
                }
                else if (isFallback) {
                    wx.showToast({
                        icon: "none",
                        title: "已在地图展示上海区域收录点位",
                        duration: 2200
                    });
                }
            })
            .catch(() => {
                this._rawPoints = [];
                this.setData({ displayMarkers: [] });
                wx.showToast({
                    icon: "none",
                    title: "地图数据加载失败，请重试",
                    duration: 2500
                });
            });
    },
    handleCategoryChange(e) {
        const id = e.currentTarget.dataset.id;
        this.setData({ activeCategory: id });
        this.updateMarkers(id);
    },
    updateMarkers(categoryId) {
        const targetWidth = 15;
        const imageAspectRatio = 34 / 18;
        const targetHeight = Math.round(targetWidth / imageAspectRatio);
        const points = filterPointsByCategory(this._rawPoints || [], categoryId);
        let displayMarkerId = 0;
        const displayMarkers = points.map((item) => {
            displayMarkerId++;
            const category = categoryData.find((c) => c.id === categoryId);
            const currentIcon = category ? category.icon : "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/map/icon_map.png";
            return {
                id: displayMarkerId,
                latitude: Number(item.lat),
                longitude: Number(item.lng),
                width: targetWidth,
                height: targetHeight,
                iconPath: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/map/icon_map.png",
                joinCluster: points.length > 15,
                customCallout: {
                    display: "ALWAYS",
                    anchorY: -2,
                    anchorX: 0
                },
                customData: {
                    icon: currentIcon,
                    title: item.name || "点位",
                    categoryName: item.category || "",
                    categoryId,
                    backendId: item.id != null ? String(item.id) : ""
                }
            };
        });
        this.setData({ displayMarkers });
    },
    markertap(e) {
        this.hidePanels();
        const markerId = e.detail && e.detail.markerId !== undefined && e.detail.markerId !== null
            ? e.detail.markerId
            : e.markerId;
        this.fetchPointDetail(markerId);
    },
    callouttap(e) {
        this.hidePanels();
        const markerId =
            e.detail && e.detail.markerId !== undefined && e.detail.markerId !== null
                ? e.detail.markerId
                : e.markerId;
        this.fetchPointDetail(markerId);
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
            const query = {
                userLat: this.data.latitude || DEFAULT_LAT,
                userLng: this.data.longitude || DEFAULT_LNG,
                radius: 500000
            };
            if (keyword) {
                query.keyword = keyword;
            }
            const raw = await adminApi.getMapPoints(query);
            const list = Array.isArray(raw) ? raw : ((raw && raw.records) || (raw && raw.data) || (raw && raw.rows) || []);
            const searchResults = list.map((row) => {
                const rawType = row.type || row.category || "";
                const type = rawType === "党群服务中心" ? "暖新巢" : rawType;
                return {
                    id: row.id,
                    title: row.title || row.name || "",
                    type,
                    area: row.area || row.address || "",
                    detailScene: row.detailScene || (type === "暖新巢" ? "warm" : "merchant")
                };
            });
            this.setData({ searchResults, isSearching: false });
        } catch (e) {
            console.error("[map search] failed", e);
            this.setData({ isSearching: false });
        }
    },
    onSelectSearchResult(e) {
        const item = e.currentTarget.dataset.item;
        this.hideSearchResults();
        if (!item || !item.id) return;
        
        // 当选中搜索结果时，不跳转详情页，而是将地图中心移动到该点位
        // 如果列表中没有自带坐标，这里暂时无法直接移动，但可以尝试在原有的点位里找到并聚焦
        const hit = (this._rawPoints || []).find(p => String(p.id) === String(item.id));
        if (hit && hit.lat && hit.lng) {
            this.setData({
                latitude: Number(hit.lat),
                longitude: Number(hit.lng)
            });
        }
    },
    async fetchPointDetail(markerDisplayId) {
        const markers = this.data.displayMarkers;
        const target = markers.find((m) => m.id === markerDisplayId);
        if (!target || !target.customData || !target.customData.backendId) return;
        
        wx.showLoading({ title: "加载中...", mask: true });
        try {
            const res = await adminApi.getPointDetail({ id: target.customData.backendId });
            if (res.code === 200 && res.data) {
                const data = Object.assign({}, res.data, {
                    categoryId: target.customData.categoryId,
                    title: res.data.name || target.customData.title
                });
                this.setData({ 
                    centerMarker: data,
                    latitude: Number(data.lat || target.latitude),
                    longitude: Number(data.lng || target.longitude)
                });
            } else {
                wx.showToast({ title: "获取详情失败", icon: "none" });
            }
        } catch (e) {
            console.error(e);
            wx.showToast({ title: "网络错误", icon: "none" });
        } finally {
            wx.hideLoading();
        }
    },
    openLocation() {
        const centerMarker = this.data.centerMarker;
        if (!centerMarker || !centerMarker.lat || !centerMarker.lng) return;
        wx.openLocation({
            latitude: Number(centerMarker.lat),
            longitude: Number(centerMarker.lng),
            name: centerMarker.title || centerMarker.name,
            address: centerMarker.address || "上海市长宁区"
        });
    }
});
