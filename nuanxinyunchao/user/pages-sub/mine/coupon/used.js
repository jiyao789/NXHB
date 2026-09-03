"use strict";
const couponApi = require("../../../api/coupon");
const normalizeImageUrl = require("../../../utils/normalizeImageUrl").normalizeImageUrl;
function formatYuan(v) {
    const n = Number(v);
    if (!Number.isFinite(n))
        return "—";
    if (Math.abs(n - Math.round(n)) < 1e-9)
        return String(Math.round(n));
    let s = n.toFixed(2);
    s = s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
    return s;
}
function mapUsedDetail(raw) {
    const rules = Array.isArray(raw.usageRuleLines) && raw.usageRuleLines.length
        ? raw.usageRuleLines
        : ["详见券模板说明与门店公示"];
    const logo = normalizeImageUrl(raw && raw.avatar ? raw.avatar : "");
    let priceStr = "—";
    if (raw.couponFaceAmount != null && raw.couponFaceAmount !== "") {
        const n = Number(raw.couponFaceAmount);
        if (Number.isFinite(n)) {
            if (raw.couponKind === 2 && n > 0 && n <= 1) {
                const fold = Math.round(n * 1000) / 100;
                priceStr = (fold % 1 === 0 ? String(Math.round(fold)) : String(fold)) + " 折";
            }
            else {
                priceStr = "￥" + formatYuan(n);
            }
        }
    }
    return Object.assign({}, raw, {
        avatar: logo || raw.avatar || "https://nuanxin-images-1329191669.cos.ap-guangzhou.myqcloud.com/index/room_cover.png",
        spentPoints: raw.pointsSpent != null ? raw.pointsSpent : 0,
        currentPoints: "—",
        businessHours: raw.businessHours || "以门店公布为准",
        phone: raw.phone || "",
        price: priceStr,
        quantity: 1,
        validDate: raw.validDate || "--",
        usageTime: "营业时间内可用（以门店为准）",
        scope: raw.scope || "",
        policy: "",
        rules: rules,
    });
}
Page({
    data: {
        safeAreaInsetsTop: 20,
        isLoading: true,
        loadError: "",
        detail: null,
        ratingTags: [
            { text: "体验好", active: false },
            { text: "体验一般", active: false },
            { text: "体验差", active: false },
        ],
        quickTags: [
            { text: "环境舒适", active: false },
            { text: "设施齐全", active: false },
            { text: "充电快捷", active: false },
            { text: "停车方便", active: false },
            { text: "暖心关怀", active: false },
            { text: "态度热情", active: false },
        ],
        comment: "",
        isSubmitted: false,
        navBarOpacity: 0,
    },
    _ledgerId: "",
    _submitLock: false,
    onPageScroll(e) {
        const scrollTop = e.scrollTop;
        const threshold = 100;
        let opacity = scrollTop / threshold;
        if (opacity > 1)
            opacity = 1;
        if (opacity < 0)
            opacity = 0;
        if (Math.abs(this.data.navBarOpacity - opacity) > 0.05) {
            this.setData({ navBarOpacity: opacity });
        }
    },
    onLoad(options) {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaInsetsTop: sysInfo.statusBarHeight || 20 });
        const idRaw = options && options.id != null ? String(options.id).trim() : "";
        this._ledgerId = idRaw;
        this._focusReview = options && String(options.focusReview) === "1";
        if (idRaw) {
            void this.fetchUsedDetail(idRaw);
        }
        else {
            this.setData({ isLoading: false, loadError: "缺少券信息" });
        }
    },
    handleBack() {
        wx.navigateBack();
    },
    async fetchUsedDetail(id) {
        this.setData({ isLoading: true, loadError: "" });
        try {
            const raw = await couponApi.getCouponWalletUsedDetailApi({ id: id });
            const detail = mapUsedDetail(raw);
            const reviewed = !!(raw && raw.reviewed);
            this.setData({ detail: detail, isLoading: false, isSubmitted: reviewed });
            if (this._focusReview && !reviewed) {
                setTimeout(function () {
                    wx.pageScrollTo({ scrollTop: 2000, duration: 400 });
                }, 400);
            }
        }
        catch (_e) {
            this.setData({
                isLoading: false,
                loadError: "加载失败",
                detail: null,
            });
        }
    },
    handleRatingSelect(e) {
        if (this.data.isSubmitted)
            return;
        const index = e.currentTarget.dataset.index;
        const ratingTags = this.data.ratingTags.map((tag, i) => ({
            ...tag,
            active: i === index,
        }));
        this.setData({ ratingTags: ratingTags });
    },
    handleQuickTagSelect(e) {
        if (this.data.isSubmitted)
            return;
        const index = e.currentTarget.dataset.index;
        const quickTags = [...this.data.quickTags];
        quickTags[index].active = !quickTags[index].active;
        this.setData({ quickTags: quickTags });
    },
    handleAddCustomTag() {
        if (this.data.isSubmitted)
            return;
        wx.showModal({
            title: "添加自定义标签",
            editable: true,
            placeholderText: "请输入标签内容",
            success: (res) => {
                if (res.confirm && res.content) {
                    if (res.content.trim().length === 0)
                        return;
                    const newTag = { text: res.content.trim(), active: true };
                    this.setData({
                        quickTags: [...this.data.quickTags, newTag],
                    });
                }
            },
        });
    },
    onCommentInput(e) {
        this.setData({ comment: e.detail.value });
    },
    async handleSubmitRating() {
        if (this._submitLock || this.data.isSubmitted)
            return;
        const activeRating = this.data.ratingTags.find(function (t) { return t.active; });
        const anyQuick = this.data.quickTags.some(function (t) { return t.active; });
        if (!activeRating && !anyQuick && !String(this.data.comment || "").trim()) {
            wx.showToast({ title: "请先选择体验或填写评价", icon: "none" });
            return;
        }
        const uid = Number(this._ledgerId);
        if (!Number.isFinite(uid)) {
            wx.showToast({ title: "券信息异常", icon: "none" });
            return;
        }
        this._submitLock = true;
        wx.showLoading({ title: "提交中" });
        try {
            const quickCsv = this.data.quickTags
                .filter(function (t) { return t.active; })
                .map(function (t) { return t.text; })
                .join("|");
            await couponApi.submitCouponWalletReviewApi({
                userCouponId: uid,
                ratingLabel: activeRating ? activeRating.text : "",
                quickTags: quickCsv,
                comment: String(this.data.comment || "").trim(),
            });
            wx.hideLoading();
            this.setData({ isSubmitted: true });
            wx.showToast({ title: "已收到您的评价", icon: "success" });
        }
        catch (_e) {
            wx.hideLoading();
        }
        finally {
            this._submitLock = false;
        }
    },
    handleToStoreDetail() {
        const d = this.data.detail;
        if (!d || d.merchantId == null)
            return;
        const mid = d.merchantId;
        const name = encodeURIComponent(d.storeName || "");
        const avatar = encodeURIComponent(d.avatar || "");
        const lat = d.latitude != null ? d.latitude : "";
        const lng = d.longitude != null ? d.longitude : "";
        wx.navigateTo({
            url: `/nuanxinyunchao/user/pages-sub/hot/detail?id=${mid}&name=${name}&avatar=${avatar}&lat=${lat}&lng=${lng}`,
        });
    },
    handleMakePhoneCall() {
        if (!this.data.detail || !this.data.detail.phone)
            return;
        wx.makePhoneCall({ phoneNumber: this.data.detail.phone });
    },
    handleOpenMap() {
        const d = this.data.detail;
        if (!d || d.latitude == null || d.longitude == null)
            return;
        wx.openLocation({
            latitude: Number(d.latitude),
            longitude: Number(d.longitude),
            name: d.storeName || "",
            address: d.address || "",
        });
    },
});
