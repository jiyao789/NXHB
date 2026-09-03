"use strict";
const map_1 = require("../../api/map");
const fixMerchantImageUrl_1 = require("../../utils/fixMerchantImageUrl");
const DEFAULT_ICON = "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/map/icon_logo_white.png";
function fixCosMerchantIcon(icon) {
    return (0, fixMerchantImageUrl_1.fixMerchantImageUrl)(icon);
}

function getCategoryOfPoint(p) {
    if (p.rolesId === 7 && p.userStatus === 'ENABLE') return "store";
    const hay = `${p.category || ""} ${p.name || ""}`;
    if (/厕|洗手|公共卫生|卫生间|WC/i.test(hay)) return "toilet";
    if (/充电|电站|桩/i.test(hay)) return "charging";
    if (/就餐点/i.test(hay)) return "dining";
    return "other";
}
Page({
    data: {
        safeAreaTop: 20,
        mapLatitude: 31.218,
        mapLongitude: 121.422,
        scale: 18,
        isLoading: true,
        rawBackendId: "",
        displayMarkers: [],
        centerMarker: {
            id: "",
            title: "加载中...",
            icon: "",
            openTime: "",
            phone: ""
        },
        searchKeyword: "",
        searchResults: [],
        showSearchResults: false,
        isSearching: false,
        searchTimer: null
    },
    onLoad(options) {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaTop: sysInfo.safeArea.top });
        const passedIcon = options.icon ? decodeURIComponent(options.icon) : "";
        const titlePre = options.title ? decodeURIComponent(options.title) : "";
        const backendIdRaw = options.id != null && options.id !== "" ? String(options.id) : "";
        const lat = options.lat ? Number(options.lat) : null;
        const lng = options.lng ? Number(options.lng) : null;
        this.setData({ rawBackendId: backendIdRaw });
        if (lat != null && !Number.isNaN(lat) && lng != null && !Number.isNaN(lng)) {
            this.setData({ mapLatitude: lat, mapLongitude: lng });
        }
        if (!backendIdRaw) {
            this.setData({
                isLoading: false,
                centerMarker: {
                    id: "",
                    title: titlePre || "无点位 ID",
                    icon: fixCosMerchantIcon(passedIcon) || DEFAULT_ICON,
                    openTime: "",
                    phone: "",
                    address: "",
                    description: "",
                    categoryId: ""
                }
            });
            return;
        }
        this.fetchSpotDetail(backendIdRaw, passedIcon, titlePre);
    },
    buildMarkersAroundDetail(detail) {
        if (!detail) {
            return [];
        }
        const targetWidth = 20;
        const imageAspectRatio = 34 / 18;
        const targetHeight = Math.round(targetWidth / imageAspectRatio);
        const list = [{ point: detail, backendId: String(detail.id) }];
        const nearby = Array.isArray(detail.nearbyPoints) ? detail.nearbyPoints : [];
        const detailCat = getCategoryOfPoint(detail);
        nearby.forEach((np) => {
            if (np == null || np.id == null) {
                return;
            }
            if (String(np.id) === String(detail.id)) {
                return;
            }
            const npCat = getCategoryOfPoint(np);
            if (npCat !== detailCat) {
                return;
            }
            list.push({ point: np, backendId: String(np.id) });
        });
        const out = [];
        list.forEach(({ point, backendId }) => {
            const latVal = point.lat != null ? point.lat : detail.lat;
            const lngVal = point.lng != null ? point.lng : detail.lng;
            if (latVal == null || lngVal == null) {
                return;
            }
            const bubbleRaw =
                point.icon && String(point.icon).trim() !== "" ? point.icon : detail.icon || DEFAULT_ICON;
            const bubble = fixCosMerchantIcon(bubbleRaw) || DEFAULT_ICON;
            out.push({
                id: out.length + 1,
                latitude: latVal,
                longitude: lngVal,
                width: targetWidth,
                height: targetHeight,
                iconPath: "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/map/icon_map.png",
                customCallout: {
                    display: "ALWAYS",
                    anchorX: 0,
                    anchorY: -10
                },
                customData: {
                    title: point.name || "点位",
                    icon: bubble,
                    backendId
                }
            });
        });
        return out;
    },
    handleBack() {
        wx.navigateBack();
    },
    markertap(e) {
        this.hideSearchResults();
        const markerId =
            e.detail && e.detail.markerId !== undefined && e.detail.markerId !== null
                ? e.detail.markerId
                : e.markerId;
        if (!markerId) {
            return;
        }
        const markers = this.data.displayMarkers || [];
        const hit = markers.find((m) => m.id === markerId);
        if (!hit || !hit.customData || !hit.customData.backendId) {
            return;
        }
        const bid = hit.customData.backendId;
        const latVal = hit.latitude;
        const lngVal = hit.longitude;
        this.setData({
            mapLatitude: latVal,
            mapLongitude: lngVal,
            rawBackendId: bid
        });
        this.fetchSpotDetail(bid, hit.customData.icon || "", hit.customData.title || "");
    },
    callouttap(e) {
        this.markertap(e);
    },
    onCenterIconError() {
        this.setData({
            "centerMarker.icon": DEFAULT_ICON
        });
    },
    fetchSpotDetail(backendId, iconPlaceholder, titleFallback) {
        this.setData({ isLoading: true });
        map_1
            .getMapPointDetailApi({
                id: backendId,
                nearbyRadius: 8000,
                nearbyLimit: 30
            })
            .then((detail) => {
                if (!detail) {
                    this.setData({
                        isLoading: false,
                        centerMarker: {
                            id: backendId,
                            title: titleFallback || "未找到点位",
                            icon: fixCosMerchantIcon(iconPlaceholder) || DEFAULT_ICON,
                            openTime: "",
                            phone: "",
                            address: "",
                            description: "",
                            categoryId: ""
                        },
                        displayMarkers: []
                    });
                    return;
                }
                const title = detail.name || titleFallback || "";
                const iconShown =
                    fixCosMerchantIcon(detail.icon || iconPlaceholder || "") || DEFAULT_ICON;
                const markers = this.buildMarkersAroundDetail(detail);
                this.setData({
                    mapLatitude: detail.lat != null ? detail.lat : this.data.mapLatitude,
                    mapLongitude: detail.lng != null ? detail.lng : this.data.mapLongitude,
                    displayMarkers: markers,
                    centerMarker: {
                        id: String(backendId),
                        title,
                        icon: iconShown,
                        openTime: detail.openTime || detail.businessHours || "",
                        phone: detail.phone || "",
                        address: detail.address || "",
                        description: detail.description || "",
                        categoryId: getCategoryOfPoint(detail)
                    },
                    isLoading: false
                });
            })
            .catch(() => {
                this.setData({
                    isLoading: false,
                    centerMarker: {
                        id: backendId,
                        title: titleFallback || "加载失败",
                        icon: fixCosMerchantIcon(iconPlaceholder) || DEFAULT_ICON,
                        openTime: "",
                        phone: "",
                        address: "",
                        description: "",
                        categoryId: ""
                    },
                    displayMarkers: []
                });
            });
    },
    
    // --- 搜索相关逻辑 ---
    onSearchFocus(e) {
        const val = this.data.searchKeyword || "";
        this.fetchSearchResults(val);
    },
    
    onSearchInput(e) {
        const val = e.detail.value || "";
        this.setData({ searchKeyword: val });
        
        if (this.data.searchTimer) {
            clearTimeout(this.data.searchTimer);
        }
        
        const timer = setTimeout(() => {
            this.fetchSearchResults(val);
        }, 300);
        this.setData({ searchTimer: timer });
    },
    
    fetchSearchResults(keyword) {
        this.setData({ isSearching: true, showSearchResults: true });
        map_1.getMapPointsApi({
            userLat: this.data.mapLatitude || 31.218,
            userLng: this.data.mapLongitude || 121.422,
            radius: 500000, // 扩大搜索范围以获取全局数据
            keyword: keyword
        }).then((res) => {
            this.setData({
                searchResults: res || [],
                isSearching: false
            });
        }).catch(() => {
            this.setData({
                searchResults: [],
                isSearching: false
            });
        });
    },
    
    onSelectSearchResult(e) {
        const { id, name } = e.currentTarget.dataset;
        this.setData({
            searchKeyword: name,
            showSearchResults: false
        });
        this.fetchSpotDetail(id, "", name);
    },
    
    hideSearchResults() {
        if (this.data.showSearchResults) {
            this.setData({ showSearchResults: false });
        }
    },
    
    openMap() {
        const lat = Number(this.data.mapLatitude);
        const lng = Number(this.data.mapLongitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            wx.showToast({ title: "坐标信息缺失", icon: "none" });
            return;
        }
        wx.openLocation({
            latitude: lat,
            longitude: lng,
            name: this.data.centerMarker.title || "目标位置",
            address: this.data.centerMarker.address || "",
            scale: 16,
        });
    }
});
