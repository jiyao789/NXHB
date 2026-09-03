"use strict";
const { submitClientReviewApi } = require("../../../api/review");

Page({
    data: {
        safeAreaInsetsTop: 20,
        activityTitle: "活动服务",
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
    },
    _refId: 0,
    _submitLock: false,
    onLoad(options) {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaInsetsTop: sysInfo.statusBarHeight || 20 });
        let rawId = options && options.refId != null ? String(options.refId).trim() : "";
        if (rawId.startsWith("AR_")) {
            rawId = rawId.substring(3);
        }
        const refId = Number(rawId);
        if (!Number.isFinite(refId)) {
            wx.showToast({ title: "缺少报名记录", icon: "none" });
            setTimeout(() => wx.navigateBack(), 1500);
            return;
        }
        this._refId = refId;
        const title = options && options.title
            ? decodeURIComponent(String(options.title))
            : "活动服务";
        this.setData({ activityTitle: title });
        if (options && options.reviewed === "1") {
            this.setData({ isSubmitted: true });
        }
    },
    handleBack() {
        wx.navigateBack();
    },
    handleRatingSelect(e) {
        if (this.data.isSubmitted)
            return;
        const index = e.currentTarget.dataset.index;
        const ratingTags = this.data.ratingTags.map((tag, i) => ({
            ...tag,
            active: i === index,
        }));
        this.setData({ ratingTags });
    },
    handleQuickTagSelect(e) {
        if (this.data.isSubmitted)
            return;
        const index = e.currentTarget.dataset.index;
        const quickTags = [...this.data.quickTags];
        quickTags[index].active = !quickTags[index].active;
        this.setData({ quickTags });
    },
    handleAddCustomTag() {
        if (this.data.isSubmitted)
            return;
        wx.showModal({
            title: "添加自定义标签",
            editable: true,
            placeholderText: "请输入标签内容",
            success: (res) => {
                if (res.confirm && res.content && res.content.trim()) {
                    this.setData({
                        quickTags: [...this.data.quickTags, { text: res.content.trim(), active: true }],
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
        const activeRating = this.data.ratingTags.find((t) => t.active);
        const anyQuick = this.data.quickTags.some((t) => t.active);
        if (!activeRating && !anyQuick && !String(this.data.comment || "").trim()) {
            wx.showToast({ title: "请先选择体验或填写评价", icon: "none" });
            return;
        }
        this._submitLock = true;
        wx.showLoading({ title: "提交中" });
        try {
            const quickCsv = this.data.quickTags
                .filter((t) => t.active)
                .map((t) => t.text)
                .join("|");
            await submitClientReviewApi({
                sourceType: "ACTIVITY",
                refId: this._refId,
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
});
