"use strict";
const couponApi = require("../../../api/coupon");
const HEADER_BODY_PX = 140;
const PAGE_SIZE = 20;
/** @returns { Record<string,string|number|undefined> } */
function buildWalletQuery(pageNo, tabIndex, keyword) {
    /** @type { Record<string,string|number> } */
    const q = { current: pageNo, size: PAGE_SIZE };
    if (tabIndex === 1)
        q.filterStatus = 0;
    else if (tabIndex === 2)
        q.filterStatus = 1;
    else if (tabIndex === 3)
        q.filterStatus = 2;
    const k = typeof keyword === "string" ? keyword.trim() : "";
    if (k)
        q.keyword = k;
    return q;
}
function formatDateDot(ts) {
    if (ts == null || ts === "")
        return "--";
    const raw = typeof ts === "number" ? ts : String(ts).replace(/-/g, "/");
    const d = new Date(raw);
    if (Number.isNaN(d.getTime()))
        return String(ts).slice(0, 10).replace(/-/g, ".");
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${dd}`;
}
function formatYuan(v) {
    const n = Number(v);
    if (!Number.isFinite(n))
        return "0";
    if (Math.abs(n - Math.round(n)) < 1e-9)
        return String(Math.round(n));
    let s = n.toFixed(2);
    s = s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
    return s;
}
/** 面值折数：0.9→9折；亦兼容 1<value≤10 表示 N 折录入 */
function formatDiscount(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0)
        return "?";
    let zhe;
    if (n <= 1) {
        zhe = Math.round(n * 1000) / 100;
    }
    else if (n <= 10) {
        zhe = Math.round(n * 100) / 100;
    }
    else {
        zhe = n;
    }
    return zhe % 1 === 0 ? String(Math.round(zhe)) : String(zhe);
}
function startOfLocalDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
/**
 * 与自然日有效期一致：valid_end 的日期早于「今天」则视为失效（对齐后端 valid_end 自然日早于今日）。
 * 该类记录 DB 仍为 status=0，不能仅用 statusCode 映射 UI。
 */
function isNaturalDayExpired(validEndRaw) {
    if (validEndRaw == null || validEndRaw === "")
        return false;
    const raw = typeof validEndRaw === "number" ? validEndRaw : String(validEndRaw).replace(/-/g, "/");
    const ve = new Date(raw);
    if (Number.isNaN(ve.getTime()))
        return false;
    return startOfLocalDay(ve) < startOfLocalDay(new Date());
}
/** 列表点击分流用：必须与券包 Tab SQL 语义一致（含「未核销但已过自然日」） */
function uiStatusFromRecord(rec) {
    const code = rec.statusCode != null ? Number(rec.statusCode) : 0;
    const ve = rec.validEndTime != null ? rec.validEndTime : rec.validEnd;
    if (code === 1)
        return "used";
    if (code === 0) {
        if (isNaturalDayExpired(ve))
            return "expired";
        return "unused";
    }
    return "expired";
}
function statusTextForRow(rec, uiStatus, statusCode) {
    if (uiStatus === "unused")
        return "";
    /** status=0 但已过期日时，Jackson 仍会带「未使用」文案，此处覆盖 */
    if (statusCode === 0 && uiStatus === "expired")
        return "已过期";
    const n = typeof rec.statusName === "string" ? rec.statusName.trim() : "";
    return n || statusFallbackText(statusCode);
}
function statusFallbackText(code) {
    switch (code) {
        case 1:
            return "已使用";
        case 2:
            return "已过期";
        case 3:
            return "已退回";
        default:
            return "已失效";
    }
}
/** @returns { Record<string, any> } */
function mapRecordToRow(rec) {
    const couponType = rec.couponType;
    const typeName = rec.typeName || "优惠券";
    const statusCode = rec.statusCode != null ? Number(rec.statusCode) : 0;
    const uiStatus = uiStatusFromRecord(rec);
    const statusText = statusTextForRow(rec, uiStatus, statusCode);
    const pname = typeof rec.productName === "string" ? rec.productName.trim() : "";
    const lim = typeof rec.limitDescription === "string" ? rec.limitDescription.trim() : "";
    let amountMain = "";
    let amountUnit = "";
    let showMinSpend = false;
    let minSpendAmount = "";
    if (couponType === 2) {
        amountMain = formatDiscount(rec.amount);
        amountUnit = "折";
        showMinSpend = false;
    }
    else if (couponType === 3) {
        amountMain = formatYuan(rec.amount);
        amountUnit = "元";
        showMinSpend = false;
    }
    else if (couponType === 4) {
        amountMain = pname || "兑换";
        amountUnit = "";
        showMinSpend = false;
    }
    else {
        amountMain = formatYuan(rec.amount);
        amountUnit = couponType === 1 ? "元" : "";
        showMinSpend = couponType === 1 && Number(rec.minSpend) > 0;
        minSpendAmount = formatYuan(rec.minSpend);
    }
    const scopeHint = pname || lim || "全场通用";
    const tid = rec.couponTemplateId != null && rec.couponTemplateId !== ""
        ? String(rec.couponTemplateId).trim()
        : "";
    return {
        id: rec.id,
        couponTemplateId: tid,
        title: rec.name || "优惠券",
        type: typeName,
        couponType: couponType != null ? couponType : -1,
        amountMain,
        amountUnit,
        showMinSpend,
        minSpendAmount,
        isDiscountCoupon: couponType === 2,
        isExchangeCoupon: couponType === 4,
        date: formatDateDot(rec.validEndTime || rec.validEnd),
        scopeHint,
        status: uiStatus,
        statusText,
        statusCodeRaw: statusCode,
    };
}
function groupByType(rows) {
    const buckets = {};
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const t = row.type || "其他";
        if (!buckets[t])
            buckets[t] = [];
        buckets[t].push(row);
    }
    const types = Object.keys(buckets).sort();
    return types.map(function (type) {
        return { type: type, items: buckets[type] };
    });
}
Page({
    data: {
        safeAreaInsetsTop: 20,
        scrollAreaHeight: 400,
        isLoading: false,
        loadingMore: false,
        isEnd: true,
        searchKeyword: "",
        currentTab: 0,
        tabs: [
            { label: "全部", key: "all" },
            { label: "未使用", key: "unused" },
            { label: "已使用", key: "used" },
            { label: "已失效", key: "expired" },
        ],
        displayList: [],
    },
    _accum: [],
    _pageCurrent: 1,
    _listBusy: false,
    onLoad() {
        const wi = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
        const bar = wi.statusBarHeight || (wi.safeArea ? wi.safeArea.top : 0) || 20;
        const winH = wi.windowHeight || wi.screenHeight || 667;
        const scrollAreaHeight = Math.max(200, Math.floor(winH - bar - HEADER_BODY_PX));
        this.setData({ safeAreaInsetsTop: bar, scrollAreaHeight: scrollAreaHeight });
        void this.resetAndFetch();
    },
    onShow() {
        // 取消自动跳转去评价的逻辑，直接展示券包列表
    },
    handleBack() {
        wx.navigateBack();
    },
    onSearchInput(e) {
        this.setData({ searchKeyword: e.detail.value });
    },
    clearSearch() {
        this.setData({ searchKeyword: "" });
        void this.resetAndFetch();
    },
    handleRefresh() {
        void this.resetAndFetch();
    },
    handleTabChange(e) {
        const index = Number(e.currentTarget.dataset.index);
        if (Number.isNaN(index) || index === this.data.currentTab)
            return;
        this.setData({ currentTab: index }, function () {
            void this.resetAndFetch();
        }.bind(this));
    },
    loadMore() {
        void this.fetchPage(false);
    },
    handleUse(e) {
        const ds = e.currentTarget.dataset || {};
        const fallback = ds.item || {};
        const status = ds.status || fallback.status;
        const userCouponId = ds.userCouponId != null ? ds.userCouponId : fallback.id;
        const couponTemplateFromAttr = ds.couponTemplateId;
        const titleSrc = ds.title != null ? ds.title : fallback.title;
        const q = encodeURIComponent(titleSrc || "");
        if (status === "used") {
            wx.navigateTo({
                url: `/nuanxinyunchao/user/pages-sub/mine/coupon/used?id=${userCouponId}&title=${q}`,
            });
        }
        else if (status === "unused") {
            wx.navigateTo({
                url: `/nuanxinyunchao/user/pages-sub/mine/coupon/use?id=${userCouponId}&title=${q}`,
            });
        }
        else {
            const tidSrc = couponTemplateFromAttr != null && String(couponTemplateFromAttr).trim() !== ""
                ? couponTemplateFromAttr
                : fallback.couponTemplateId;
            const tid = tidSrc != null ? String(tidSrc).trim() : "";
            const lid = userCouponId != null ? String(userCouponId).trim() : "";
            if (!tid && !lid) {
                wx.showToast({ title: "缺少券模板信息", icon: "none" });
                return;
            }
            if (tid) {
                wx.navigateTo({
                    url: lid
                        ? `/nuanxinyunchao/user/pages-sub/mine/coupon/detail?id=${encodeURIComponent(tid)}&ledgerId=${encodeURIComponent(lid)}`
                        : `/nuanxinyunchao/user/pages-sub/mine/coupon/detail?id=${encodeURIComponent(tid)}`,
                });
            }
            else {
                wx.navigateTo({
                    url: `/nuanxinyunchao/user/pages-sub/mine/coupon/detail?ledgerId=${encodeURIComponent(lid)}`,
                });
            }
        }
    },
    handleToQrcode(e) {
        const ds = e.currentTarget.dataset || {};
        const fallback = ds.item || {};
        const userCouponId = ds.userCouponId != null ? ds.userCouponId : fallback.id;
        if (userCouponId == null || userCouponId === "")
            return;
        const titleSrc = ds.title != null ? ds.title : fallback.title;
        const q = encodeURIComponent(titleSrc || "");
        wx.navigateTo({
            url: `/nuanxinyunchao/user/pages-sub/mine/coupon/use?id=${userCouponId}&title=${q}`,
        });
    },
    resetAndFetch() {
        this._accum = [];
        this._pageCurrent = 1;
        this._listBusy = false;
        this.setData({
            displayList: [],
            isEnd: false,
            isLoading: true,
            loadingMore: false,
        });
        return this.fetchPage(true);
    },
    async fetchPage(isReset) {
        if (!isReset && (this.data.isEnd || this._listBusy))
            return;
        if (!isReset && this.data.isLoading)
            return;
        this._listBusy = true;
        if (!isReset) {
            this.setData({ loadingMore: true });
        }
        const pageNo = isReset ? 1 : this._pageCurrent;
        try {
            const query = buildWalletQuery(pageNo, this.data.currentTab, this.data.searchKeyword);
            /** @type { any } */
            const pageData = await couponApi.getMyCouponWalletApi(query);
            const records = (pageData && (pageData.records || pageData.list || pageData.rows)) || [];
            const totalRaw = pageData.total;
            const totalNum =
                totalRaw != null &&
                    totalRaw !== "" &&
                    !Number.isNaN(Number(totalRaw))
                    ? Number(totalRaw)
                    : NaN;
            const mapped = records.map(mapRecordToRow);
            const nextAccum = isReset ? mapped.slice() : this._accum.concat(mapped);
            this._accum = nextAccum;
            this._pageCurrent = pageNo + 1;
            const gotLen = mapped.length;
            const isEnd = gotLen === 0 ||
                gotLen < PAGE_SIZE ||
                (Number.isFinite(totalNum) && nextAccum.length >= totalNum);
            const displayList = groupByType(nextAccum);
            this.setData({
                displayList: displayList,
                isEnd: isEnd,
                isLoading: false,
                loadingMore: false,
            });
        }
        catch (_e) {
            this.setData({
                isLoading: false,
                loadingMore: false,
                displayList: isReset ? [] : groupByType(this._accum),
                isEnd: true,
            });
        }
        finally {
            this._listBusy = false;
        }
    },
});
